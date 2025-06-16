var home_Path = document.location.protocol +'//' + window.document.location.hostname +'/';

var userAgent = window.navigator.userAgent.toLowerCase();
console.log(userAgent);
var norunAI = [ "android", "iphone", "ipod", "ipad", "windows phone", "mqqbrowser" ,"msie","trident/7.0"];
var norunFlag = false;

// 定义可用模型列表
var modelList = [
    {name: "histoire", path: "model/histoire/model.json"},
];
var currentModel = 0;

setTimeout(function(){
    var modelInstance = loadlive2d("live2d", message_Path + modelList[currentModel].path);
    
    // 设置全局模型引用，以便口型同步可以使用
    if (typeof setLive2DModel === 'function') {
        setLive2DModel(modelInstance);
    }
}, 100);

for(var i=0;i<norunAI.length;i++){
    if(userAgent.indexOf(norunAI[i]) > -1){
        norunFlag = true;
        break;
    }
}

var hitFlag = false;
var AIFadeFlag = false;
var sleepTimer_ = null;
var AITalkFlag = false;
var talkNum = 0;
// 创建一个引用对象，以便Welcome模块可以修改hitFlag变量
var flagsRef = {
    hitFlag: hitFlag
};

// 初始化提示功能
if (typeof Welcome !== 'undefined') {
    Welcome.initTips(message_Path, showMessage, talkValTimer, flagsRef);
    
    // 注意：之后需要从flagsRef.hitFlag读取状态
    // 例如在某处使用 if (flagsRef.hitFlag) { ... }
}

// 初始化聊天历史功能
if (typeof ChatHistory !== 'undefined') {
    ChatHistory.init();
}

// 初始化欢迎界面
if (typeof Welcome !== 'undefined') {
    Welcome.showWelcome(showMessage);
}

if (typeof Live2DHide !== 'undefined') {
    Live2DHide.init(showMessage);
}

// 修改 showMessage 函数以更好地支持 Markdown 和 LaTeX

function showMessage(text, timeout){
    if(Array.isArray(text)) text = text[Math.floor(Math.random() * text.length + 1)-1];
    $('.message').stop();
    
    // 调试用：显示原始文本
    console.log("显示消息原始文本:", text);
    
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
            console.log("解析后的HTML:", parsedText);
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

function talkValTimer(){
    $('#live_talk').val('1');
}

// 更换模型函数
function switchModel() {
    currentModel = (currentModel + 1) % modelList.length;
    showMessage('小助手模型切换中...', 2000);
    
    setTimeout(function() {
        var modelInstance = loadlive2d("live2d", message_Path + modelList[currentModel].path);
        
        // 更新全局模型引用
        if (typeof setLive2DModel === 'function') {
            setLive2DModel(modelInstance);
        }
        
        showMessage('你好，我是汉赋小助手!', 4000);
    }, 1000);
}

function initLive2d (){
    // 确保聊天框初始隐藏
    $('.live_talk_input_body').hide();
    
    $('#switchModelBtn').on('click', function() {
        switchModel();
        // 点击切换模型时，隐藏聊天框
        $('.live_talk_input_body').fadeOut(300);
    });

    $('#showTalkBtn').on('click', function() {
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
    
    // 独立函数用于绑定发送按钮事件
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
        
        // 将用户输入添加到聊天历史
        if (typeof ChatHistory !== 'undefined') {
            ChatHistory.addMessage(userText, 'user');
        }
        
        // 清空输入框
        $('#AIuserText').val('');
        
        // 显示加载状态
        showMessage('让我想想...', 0);
        
        // 记录当前请求，用于跟踪是否为首次请求
        if (!window.requestCount) {
            window.requestCount = 1;
        } else {
            window.requestCount++;
        }
        
        const currentRequest = window.requestCount;
        
        try {
            // 调用 API 获取回答
            const reply = await openRouterService.getResponse(userText);
            console.log("收到回复:", reply);
            
            // 确保这是最新的请求响应
            if (currentRequest === window.requestCount) {
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
            if (currentRequest === window.requestCount) {
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

$(document).ready(function() {
    // 修改初始化逻辑，预加载当前模型的纹理
    var currentModelTextures = [];
    
    // 根据当前选择的模型加载对应的纹理
    switch(modelList[currentModel].name) {
        case "histoire":
            currentModelTextures = [
                message_Path + "model/histoire/histoire.1024/texture_00.png",
                message_Path + "model/histoire/histoire.1024/texture_01.png",
                message_Path + "model/histoire/histoire.1024/texture_02.png",
                message_Path + "model/histoire/histoire.1024/texture_03.png"
            ];
            break;
        default:
            currentModelTextures = [
                message_Path + "model/histoire/histoire.1024/texture_00.png",
                message_Path + "model/histoire/histoire.1024/texture_01.png",
                message_Path + "model/histoire/histoire.1024/texture_02.png",
                message_Path + "model/histoire/histoire.1024/texture_03.png"
            ];
    }

    // 初始化拖拽功能
    if (typeof Live2DDrag !== 'undefined') {
        setTimeout(function() {
            Live2DDrag.init("landlord");
        }, 1000); // 延迟初始化，确保DOM已完全加载
    }
    
    var images = [];
    var imgLength = currentModelTextures.length;
    var loadingNum = 0;
    
    for(var i=0; i<imgLength; i++){
        images[i] = new Image();
        images[i].src = currentModelTextures[i];
        images[i].onload = function(){
            loadingNum++;
            if(loadingNum === imgLength){
                var live2dhidden = localStorage.getItem("live2dhidden");
                if(live2dhidden === "0"){
                    setTimeout(function(){
                        $('#open_live2d').fadeIn(200);
                    },1300);
                }else{
                    setTimeout(function(){
                        $('#landlord').fadeIn(200);
                    },1300);
                }
                setTimeout(function(){
                    loadlive2d("live2d", message_Path + modelList[currentModel].path);
                    
                    // 设置全局模型引用
                    if (typeof setLive2DModel === 'function') {
                        var modelInstance = loadlive2d("live2d", message_Path + modelList[currentModel].path);
                        setLive2DModel(modelInstance);
                    }
                },1000);
                initLive2d();
                images = null;
            }
        };
    }

    // 确保在文档加载完成后也绑定一次事件，防止初始化问题
    setTimeout(function() {
        // 确保聊天框初始隐藏
        $('.live_talk_input_body').hide();
        
        // 初始化后绑定发送按钮事件
        $('#talk_send').off('click').on('click', function(e) {
            console.log('文档加载后绑定的发送按钮点击事件');
            
            // 确保阻止事件冒泡
            if(e) {
                e.stopPropagation();
            }
            
            var userText = $('#AIuserText').val().trim();
            if(userText === '') {
                // 显示提示消息
                showMessage('你好像没说话呀？', 3000);
                return; // 空消息不处理
            }
            
            // 清空输入框
            $('#AIuserText').val('');
            
            // 显示加载状态
            showMessage('让我想想...', 0);
            
            // 使用API获取回答
            openRouterService.getResponse(userText)
                .then(function(reply) {
                    // 显示模型回答
                    showMessage(reply, 0);
                    
                    // 同步口型动画，如果有这个功能的话
                    if(typeof startTalking === 'function') {
                        startTalking(reply);
                    }
                })
                .catch(function(error) {
                    console.error('获取回答失败:', error);
                    showMessage('抱歉，我遇到了一些问题，无法回答。', 3000);
                });
        });
        
        // 添加按Enter键发送消息的功能
        $('#AIuserText').off('keypress').on('keypress', function(e) {
            if(e.which == 13) { // Enter键的keyCode是13
                console.log('Enter键被按下');
                
                // 手动触发点击，传递一个模拟的事件对象
                var clickEvent = {
                    stopPropagation: function() {}
                };
                $('#talk_send').trigger('click', [clickEvent]);
                
                return false; // 阻止默认行为
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
    }, 2000);

    // 添加窗口焦点监听，管理休眠状态
    $(window).blur(function() {
        // 窗口失去焦点时，设置休眠状态
        sessionStorage.setItem("Sleepy", "1");
    });
    
    $(window).focus(function() {
        // 窗口获得焦点时，清除休眠状态
        if(sessionStorage.getItem("Sleepy") === "1") {
            sessionStorage.removeItem("Sleepy");
            // 如果之前在休眠，则显示欢迎回来的消息
            checkSleep();
        }
    });
});
