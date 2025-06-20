var src_Path = "./src/";
var userAgent = window.navigator.userAgent.toLowerCase();
console.log(userAgent);

// 初始化提示和欢迎
if (typeof Welcome !== 'undefined') {
    Welcome.initTips(src_Path, showMessage);
    Welcome.showWelcome(showMessage);
}

// 初始化Live2D模型
if (typeof Live2DCore !== 'undefined') {
    Live2DCore.init(src_Path, showMessage);
}

// 初始化聊天历史功能
if (typeof ChatHistory !== 'undefined') {
    ChatHistory.init();
}

// 初始化聊天功能
if (typeof Live2DChat !== 'undefined') {
    Live2DChat.init(showMessage);
}

function showMessage(text, timeout){
    if(Array.isArray(text)) text = text[Math.floor(Math.random() * text.length + 1)-1];
    $('.message').stop();
    
    // 使用Markdown解析器解析文本
    if (typeof markdownParser !== 'undefined' && typeof markdownParser.parse === 'function') {
        // 调整消息框高度和滚动，根据文本长度自适应
        if (text.length > 100) {
            $('.message').addClass('scrollable');
        } else {
            $('.message').removeClass('scrollable');
        }
        
        try {
            // 解析Markdown并设置HTML内容
            var parsedText = markdownParser.parse(text);
            $('.message').html(parsedText);
            
            // 渲染LaTeX公式
            if (typeof latexRenderer !== 'undefined' && typeof latexRenderer.renderElement === 'function') {
                setTimeout(function() {
                    latexRenderer.renderElement($('.message')[0]);
                }, 100);
            }
        } catch (e) {
            console.error("Markdown解析错误", e);
            // 解析失败时显示纯文本
            $('.message').html('<p>' + text.replace(/\n/g, '<br>') + '</p>');
        }
    } else {
        // 如果没有Markdown解析器，退回到纯文本显示
        $('.message').text(text);
    }
    
    $('.message').fadeTo(200, 1);
    
    if(timeout > 0){
        $('.message').delay(timeout).fadeTo(200, 0);
    }
}




