/**
 * 汉赋小助手 - 聊天模块
 * 处理Live2D模型的聊天功能
 */

window.Live2DChat = (function() {
    // 私有变量
    let showMessageCallback = null;
    let requestCount = 0;
    
    /**
     * 初始化聊天模块
     * @param {function} messageCallback - 显示消息的回调函数
     */
    function init(messageCallback) {
        console.log("Live2DChat初始化中...");
        
        // 保存消息回调函数
        if (typeof messageCallback === 'function') {
            showMessageCallback = messageCallback;
        }
        
        // 确保聊天框初始隐藏
        $('.live_talk_input_body').hide();
        
        // 绑定聊天相关事件
        bindChatEvents();
    }
    
    /**
     * 绑定聊天相关的事件处理
     */
    function bindChatEvents() {
        console.log("绑定聊天按钮事件...");
        
        // 聊天按钮事件
        $('#showTalkBtn').on('click', function() {
            console.log('聊天按钮被点击');
            // 显示聊天输入框
            $('.live_talk_input_body').fadeToggle(300);
            
            // 聊天框显示时，绑定发送按钮事件
            if ($('.live_talk_input_body').is(':visible')) {
                // 立即绑定发送按钮事件
                bindSendButtonEvent();
                // 自动聚焦输入框
                $('#AIuserText').focus();
            }
        });
        
        // 添加点击其他地方隐藏聊天框的功能
        $(document).on('click', function(e) {
            // 如果点击的不是聊天相关元素，则隐藏聊天框
            if (!$(e.target).closest('#showTalkBtn').length && 
                !$(e.target).closest('.live_talk_input_body').length) {
                $('.live_talk_input_body').fadeOut(300);
            }
        });
    }
    
    /**
     * 绑定发送按钮事件
     */
    function bindSendButtonEvent() {
        console.log("绑定发送按钮事件");
        // 确保先移除之前的事件绑定，避免重复
        $('#talk_send').off('click').on('click', function(e) {
            console.log('发送按钮被点击');
            sendMessage();
            // 阻止事件冒泡，确保不会触发隐藏聊天框
            e.stopPropagation();
        });
        
        // 添加按Enter键发送消息的功能
        $('#AIuserText').off('keypress').on('keypress', function(e) {
            if(e.which == 13) { // Enter键的keyCode是13
                console.log('Enter键被按下');
                sendMessage();
                return false; // 阻止默认行为
            }
        });
    }
    
    /**
     * 发送用户消息并获取AI回复
     */
    async function sendMessage() {
        console.log('sendMessage函数被调用');
        var userText = $('#AIuserText').val().trim();
        if(userText === '') {
            // 显示提示消息
            showMessage('你好像没说话呀？', 3000);
            return; // 空消息不处理
        }
        
        // 将用户输入记录到控制台
        console.log('用户输入:', userText);

        // 将用户输入添加到聊天历史
        if (typeof ChatHistory !== 'undefined') {
            ChatHistory.addMessage(userText, 'user');
        }
        
        // 清空输入框
        $('#AIuserText').val('');
        
        // 显示加载状态
        showMessage('让我想想...', 0);
        
        // 记录当前请求，用于跟踪是否为最新请求
        requestCount++;
        const currentRequest = requestCount;
        
        try {
            // 调用 API 获取回答
            const reply = await openRouterService.getResponse(userText);
            console.log("收到回复:", reply);
            
            // 确保这是最新的请求响应
            if (currentRequest === requestCount) {
                // 检查回复是否为空
                if (!reply || reply.trim() === '') {
                    throw new Error('收到空回复');
                }
                
                // 将回复添加到聊天历史
                if (typeof ChatHistory !== 'undefined') {
                    ChatHistory.addMessage(reply, 'assistant');
                }
                
                // 显示模型回答
                showMessage(reply, 0);
                
                // 同步口型动画，如果有这个功能的话
                if(typeof startTalking === 'function') {
                    startTalking(reply);
                }
            }
        } catch(error) {
            console.error('获取回答失败:', error);
            
            // 只有当这是最新的请求时才显示错误
            if (currentRequest === requestCount) {
                // 首次请求失败时，尝试重新请求
                if (currentRequest === 1) {
                    console.log('首次请求失败，正在重试...');
                    
                    try {
                        // 直接调用备用方法
                        const fallbackReply = openRouterService.getFallbackResponse(userText);
                        
                        // 将备用回复添加到聊天历史
                        if (typeof ChatHistory !== 'undefined') {
                            ChatHistory.addMessage(fallbackReply, 'assistant');
                        }
                        
                        showMessage(fallbackReply, 0);
                        
                        if(typeof startTalking === 'function') {
                            startTalking(fallbackReply);
                        }
                    } catch (retryError) {
                        console.error('重试也失败:', retryError);
                        const errorMsg = '抱歉，我遇到了一些问题，无法回答。请稍后再试。';
                        
                        // 将错误消息添加到聊天历史
                        if (typeof ChatHistory !== 'undefined') {
                            ChatHistory.addMessage(errorMsg, 'assistant');
                        }
                        
                        showMessage(errorMsg, 3000);
                    }
                } else {
                    const errorMsg = '抱歉，我遇到了一些问题，无法回答。';
                    
                    // 将错误消息添加到聊天历史
                    if (typeof ChatHistory !== 'undefined') {
                        ChatHistory.addMessage(errorMsg, 'assistant');
                    }
                    
                    showMessage(errorMsg, 3000);
                }
            }
        }
    }
    
    /**
     * 显示消息
     * @param {string} text - 消息文本
     * @param {number} timeout - 显示时长(毫秒)
     */
    function showMessage(text, timeout) {
        if (typeof showMessageCallback === 'function') {
            showMessageCallback(text, timeout);
        } else {
            console.warn("显示消息回调未设置");
        }
    }
    
    /**
     * 设置输入框值
     * @param {string} value - 输入框的值
     */
    function setInputValue(value) {
        $('#AIuserText').val(value);
    }
    
    /**
     * 显示聊天框
     */
    function showChatInput() {
        $('.live_talk_input_body').fadeIn(300);
        $('#AIuserText').focus();
        bindSendButtonEvent();
    }
    
    /**
     * 隐藏聊天框
     */
    function hideChatInput() {
        $('.live_talk_input_body').fadeOut(300);
    }
    
    /**
     * 切换聊天框显示状态
     */
    function toggleChatInput() {
        $('.live_talk_input_body').fadeToggle(300);
        if ($('.live_talk_input_body').is(':visible')) {
            $('#AIuserText').focus();
            bindSendButtonEvent();
        }
    }
    
    // 公开API
    return {
        init: init,
        sendMessage: sendMessage,
        showChatInput: showChatInput,
        hideChatInput: hideChatInput,
        toggleChatInput: toggleChatInput,
        setInputValue: setInputValue
    };
})();