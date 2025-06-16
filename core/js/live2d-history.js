/**
 * 汉赋小助手 - 对话历史模块
 * 这个模块处理聊天历史记录的显示、存储和管理
 */

// 创建命名空间
window.ChatHistory = {
    /**
     * 初始化聊天历史功能
     */
    init: function() {
        // 添加一个显示历史记录的按钮
        // if (!$('#showHistoryBtn').length) {
        //     // 在按钮区域添加历史按钮
        //     $('.live_ico_box').prepend('<div class="live_ico_item type_text" id="showHistoryBtn" title="查看对话记录">历</div>');
        // }
        
        // 绑定显示/隐藏历史记录的点击事件
        $('#showHistoryBtn').on('click', function() {
            ChatHistory.toggle();
        });
        
        // 绑定关闭按钮事件
        $('.chat-history-container .close-btn').on('click', function() {
            $('.chat-history-container').removeClass('visible');
        });
        
        // 绑定清空历史按钮事件
        $('.clear-history-btn').on('click', function() {
            ChatHistory.clear();
        });
        
        // 从本地存储加载历史记录
        ChatHistory.load();
    },
    
    /**
     * 切换显示/隐藏历史记录
     */
    toggle: function() {
        const container = $('.chat-history-container');
        
        if (container.hasClass('visible')) {
            container.removeClass('visible');
        } else {
            container.addClass('visible');
            
            // 滚动到最新消息
            const historyList = document.querySelector('.chat-history');
            if (historyList) {
                historyList.scrollTop = historyList.scrollHeight;
            }
        }
    },
    
    /**
     * 添加消息到历史记录
     * @param {string} text - 消息文本
     * @param {string} role - 角色，'user'或'assistant'
     */
    addMessage: function(text, role) {
        // 创建消息元素
        const message = $('<li class="chat-message"></li>').addClass(role);
        
        // 添加发送者信息
        const sender = $('<div class="sender"></div>');
        sender.text(role === 'user' ? '我' : '汉赋小助手');
        message.append(sender);
        
        // 添加消息内容
        const content = $('<div class="message-content"></div>');
        
        // 解析Markdown格式（如果是助手消息）
        if (role === 'assistant' && typeof markdownParser !== 'undefined') {
            content.html(markdownParser.parse(text));
            
            // 如果存在LaTeX渲染器，渲染公式
            if (typeof renderMathInElement !== 'undefined') {
                setTimeout(function() {
                    renderMathInElement(content[0], {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false}
                        ]
                    });
                }, 0);
            }
        } else {
            content.text(text);
        }
        
        message.append(content);
        
        // 添加到历史记录
        $('.chat-history').append(message);
        
        // 滚动到最新消息
        const historyList = document.querySelector('.chat-history');
        if (historyList) {
            historyList.scrollTop = historyList.scrollHeight;
        }
        
        // 保存到本地存储
        ChatHistory.save();
    },
    
    /**
     * 保存聊天记录到本地存储
     */
    save: function() {
        // 如果openRouterService存在并且有对话历史
        if (typeof openRouterService !== 'undefined' && openRouterService.conversationHistory) {
            try {
                localStorage.setItem('hanfu_chat_history', JSON.stringify(openRouterService.conversationHistory));
            } catch (e) {
                console.error('Failed to save chat history:', e);
            }
        }
    },
    
    /**
     * 从本地存储加载聊天记录
     */
    load: function() {
        try {
            const savedHistory = localStorage.getItem('hanfu_chat_history');
            if (savedHistory && typeof openRouterService !== 'undefined') {
                const history = JSON.parse(savedHistory);
                openRouterService.conversationHistory = history;
                
                // 清空现有显示的历史
                $('.chat-history').empty();
                
                // 将历史消息添加到界面
                history.forEach(item => {
                    if (item.role !== 'system') {
                        ChatHistory.addMessage(item.content, item.role);
                    }
                });
            }
        } catch (e) {
            console.error('Failed to load chat history:', e);
        }
    },
    
    /**
     * 清空聊天记录
     */
    clear: function() {
        if (confirm('确定要清空所有对话记录吗？')) {
            // 清空界面显示
            $('.chat-history').empty();
            
            // 清空存储的历史
            if (typeof openRouterService !== 'undefined') {
                // 保留系统信息
                const systemMessages = openRouterService.conversationHistory.filter(
                    item => item.role === 'system'
                );
                openRouterService.conversationHistory = systemMessages;
                
                // 更新存储
                ChatHistory.save();
            }
            
            // 移除本地存储
            localStorage.removeItem('hanfu_chat_history');
        }
    }
};