/**
 * 汉赋小助手 - 欢迎与问候模块
 * 处理基于时间的问候语和交互式消息
 */

// 创建命名空间
window.Welcome = (function() {
    // 私有变量
    let sleepTimer_ = null;
    
    /**
     * 根据当前时间生成问候语
     * @returns {string} 时间相关的问候语
     */
    function getTimeGreeting() {
        var now = (new Date()).getHours();
        if (now > 23 || now <= 5) {
            return '你是夜猫子呀？这么晚还不睡觉，明天起的来嘛？';
        } else if (now > 5 && now <= 7) {
            return '早上好！一日之计在于晨，美好的一天就要开始了！';
        } else if (now > 7 && now <= 11) {
            return '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！';
        } else if (now > 11 && now <= 14) {
            return '中午了，工作了一个上午，现在是午餐时间！';
        } else if (now > 14 && now <= 17) {
            return '午后很容易犯困呢，今天的运动目标完成了吗？';
        } else if (now > 17 && now <= 19) {
            return '傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~~';
        } else if (now > 19 && now <= 21) {
            return '晚上好，今天过得怎么样？';
        } else if (now > 21 && now <= 23) {
            return '已经这么晚了呀，早点休息吧，晚安~~';
        } else {
            return '嗨~ 快来逗我玩吧！';
        }
    }
    
    /**
     * 显示初始问候语
     * @param {function} showMessageFn - 显示消息的函数
     */
    function showWelcome(showMessageFn) {
        if (typeof showMessageFn !== 'function') {
            console.error('显示消息的函数未提供');
            return;
        }
        
        let text = getTimeGreeting();
        showMessageFn(text, 12000);
    }
    
    /**
     * 检查睡眠状态
     * @param {function} showMessageFn - 显示消息的函数
     * @param {function} talkValTimerFn - 重置对话计时器的函数
     */
    function checkSleep(showMessageFn, talkValTimerFn) {
        if (typeof showMessageFn !== 'function' || typeof talkValTimerFn !== 'function') {
            console.error('必要的函数未提供');
            return;
        }
        
        var sleepStatu = sessionStorage.getItem("Sleepy");
        if (sleepStatu !== '1') {
            talkValTimerFn();
            showMessageFn('你回来啦~休息的怎么样！', 0);
            clearInterval(sleepTimer_);
            sleepTimer_ = null;
        }
    }
    
    /**
     * 显示随机提示消息
     * @param {function} showMessageFn - 显示消息的函数
     * @param {function} hideMessageFn - 隐藏消息的函数
     * @param {function} talkValTimerFn - 重置对话计时器的函数
     * @param {boolean} AITalkFlag - AI是否正在对话的标志
     */
    function showQuote(showMessageFn, hideMessageFn, talkValTimerFn, AITalkFlag) {
        if (typeof showMessageFn !== 'function' || 
            typeof hideMessageFn !== 'function' || 
            typeof talkValTimerFn !== 'function') {
            console.error('必要的函数未提供');
            return;
        }
        
        if (sessionStorage.getItem("Sleepy") !== "1") {
            if (!AITalkFlag) {
                const backupMessages = [
                    '你学会了吗？有什么问题可以问我！',
                    '学习需要耐心和毅力，加油！',
                    '多做练习才能掌握知识点哦！',
                    '遇到困难不要放弃，一起解决它！',
                    '需要我解答任何疑问吗？',
                    '汉赋小助手随时为你服务！',
                    '学习需要踏实的态度！'
                ];
                const randomMsg = backupMessages[Math.floor(Math.random() * backupMessages.length)];
                talkValTimerFn();
                showMessageFn(randomMsg, 0);
            }
        } else {
            hideMessageFn(0);
            if (sleepTimer_ == null) {
                sleepTimer_ = setInterval(function() {
                    checkSleep(showMessageFn, talkValTimerFn);
                }, 200);
            }
        }
    }
    
    /**
     * 渲染模板字符串，替换变量
     * @param {string} template - 包含变量占位符的模板字符串
     * @param {object} context - 提供替换变量的上下文对象
     * @returns {string} 替换变量后的字符串
     */
    function renderTip(template, context) {
        var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;
        return template.replace(tokenReg, function (word, slash1, token, slash2) {
            if (slash1 || slash2) {
                return word.replace('\\', '');
            }
            var variables = token.replace(/\s/g, '').split('.');
            var currentObject = context;
            var i, length, variable;
            for (i = 0, length = variables.length; i < length; ++i) {
                variable = variables[i];
                currentObject = currentObject[variable];
                if (currentObject === undefined || currentObject === null) return '';
            }
            return currentObject;
        });
    }
    
    /**
     * 扩展String原型，添加renderTip方法
     * 初始化时调用一次来添加此方法
     */
    function extendStringPrototype() {
        if (!String.prototype.renderTip) {
            String.prototype.renderTip = function (context) {
                return renderTip(this, context);
            };
        }
    }
    
    /**
     * 初始化交互提示功能，绑定页面元素事件
     * @param {string} messagePath - 消息配置文件路径
     * @param {function} showMessageFn - 显示消息的函数
     * @param {function} talkValTimerFn - 重置对话计时器的函数
     * @param {object} hitFlagRef - 包含hitFlag变量引用的对象
     */
    function initTips(messagePath, showMessageFn, talkValTimerFn, hitFlagRef) {
        if (!messagePath || typeof showMessageFn !== 'function' || typeof talkValTimerFn !== 'function') {
            console.error('初始化Tips所需参数不完整');
            return;
        }
        
        // 确保String原型已扩展
        extendStringPrototype();
        
        $.ajax({
            cache: true,
            url: messagePath + 'message.json',
            dataType: "json",
            success: function (result) {
                // 绑定鼠标悬停事件
                $.each(result.mouseover, function (index, tips) {
                    $(tips.selector).mouseover(function () {
                        var text = tips.text;
                        if (Array.isArray(tips.text)) {
                            text = tips.text[Math.floor(Math.random() * tips.text.length + 1) - 1];
                        }
                        text = text.renderTip({text: $(this).text()});
                        showMessageFn(text, 3000);
                        talkValTimerFn();
                    });
                });
                
                // 绑定点击事件
                $.each(result.click, function (index, tips) {
                    $(tips.selector).click(function () {
                        if (hitFlagRef.hitFlag) {
                            return false;
                        }
                        hitFlagRef.hitFlag = true;
                        setTimeout(function() {
                            hitFlagRef.hitFlag = false;
                        }, 8000);
                        
                        var text = tips.text;
                        if (Array.isArray(tips.text)) {
                            text = tips.text[Math.floor(Math.random() * tips.text.length + 1) - 1];
                        }
                        text = text.renderTip({text: $(this).text()});
                        showMessageFn(text, 3000);
                    });
                });
            },
            error: function(xhr, status, error) {
                console.error('加载message.json失败:', error);
            }
        });
    }
    
    // 公开API
    return {
        showWelcome: showWelcome,
        checkSleep: checkSleep,
        showQuote: showQuote,
        getTimeGreeting: getTimeGreeting,
        renderTip: renderTip,
        initTips: initTips
    };
})();