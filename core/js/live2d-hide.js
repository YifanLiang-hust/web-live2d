/**
 * 汉赋小助手 - 显示隐藏模块
 * 处理Live2D模型的显示和隐藏功能
 */

window.Live2DHide = (function() {
    // 私有变量
    let fadeFlag = false;
    let showMessageCallback = null;
    
    /**
     * 初始化显示/隐藏功能
     * @param {function} messageCallback - 显示消息的回调函数
     */
    function init(messageCallback) {
        // 保存消息回调函数
        if (typeof messageCallback === 'function') {
            showMessageCallback = messageCallback;
        }
        
        // 绑定按钮事件
        bindHideShowEvents();
        
        // 恢复上次的显示/隐藏状态
        restoreVisibility();
    }
    
    /**
     * 绑定隐藏和显示按钮事件
     */
    function bindHideShowEvents() {
        // 隐藏按钮点击事件
        $('#hideButton').on('click', function() {
            hideModel();
        });
        
        // 显示按钮点击事件
        $('#open_live2d').on('click', function() {
            showModel();
        });
    }
    
    /**
     * 隐藏模型
     */
    function hideModel() {
        if (fadeFlag) {
            return false;
        }
        
        fadeFlag = true;
        localStorage.setItem("live2dhidden", "0");
        
        $('#landlord').fadeOut(200);
        $('#open_live2d').delay(200).fadeIn(200);
        
        setTimeout(function() {
            fadeFlag = false;
        }, 300);
    }
    
    /**
     * 显示模型
     */
    function showModel() {
        if (fadeFlag) {
            return false;
        }
        
        fadeFlag = true;
        localStorage.setItem("live2dhidden", "1");
        
        $('#open_live2d').fadeOut(200);
        $('#landlord').delay(200).fadeIn(200);
        
        // 显示欢迎回来的消息
        setTimeout(function() {
            fadeFlag = false;
            
            // 模型完全显示后显示消息
            if (showMessageCallback) {
                const greetings = [
                    '我回来啦！想我了吗？',
                    '你好呀，我又回来了！',
                    '重新为您服务，需要什么帮助吗？',
                    '我又出现啦！有什么问题随时问我哦~',
                    '我回来啦~让我们继续聊天吧！'
                ];
                
                // 随机选择一条欢迎消息
                const greeting = greetings[Math.floor(Math.random() * greetings.length)];
                showMessageCallback(greeting, 5000);
            }
        }, 300);
    }
    
    /**
     * 恢复上次的显示/隐藏状态
     */
    function restoreVisibility() {
        // 根据本地存储中的设置决定是否显示模型
        if (localStorage.getItem("live2dhidden") === "0") {
            // 如果设置为隐藏
            $('#landlord').hide();
            $('#open_live2d').show();
        } else {
            // 默认或设置为显示
            $('#landlord').show();
            $('#open_live2d').hide();
            
            // 页面加载时如果模型显示，也可以显示欢迎消息
            // 但这里不显示，避免与页面加载时的其他欢迎消息冲突
        }
    }
    
    /**
     * 获取当前显示状态
     * @returns {boolean} true表示模型当前可见
     */
    function isVisible() {
        return $('#landlord').is(':visible');
    }
    
    /**
     * 设置可见状态
     * @param {boolean} visible - true表示显示，false表示隐藏
     */
    function setVisibility(visible) {
        if (visible) {
            showModel();
        } else {
            hideModel();
        }
    }
    
    // 公开API
    return {
        init: init,
        show: showModel,
        hide: hideModel,
        isVisible: isVisible,
        setVisibility: setVisibility
    };
})();