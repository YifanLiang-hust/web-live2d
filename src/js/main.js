var src_Path = "./src/";
var userAgent = window.navigator.userAgent.toLowerCase();
console.log(userAgent);

// 定义可用模型列表
var modelList = [
    {name: "histoire", path: "model/histoire/model.json"},
];
var currentModel = 0;

var hitFlag = false;
var AIFadeFlag = false;
var sleepTimer_ = null;
var AITalkFlag = false;
var talkNum = 0;
// 创建一个引用对象，以便Welcome模块可以修改hitFlag变量
var flagsRef = {
    hitFlag: hitFlag
};

// 在main.js中应该有类似这样的代码
if (typeof Live2DModel !== 'undefined') {
    Live2DModel.init(src_Path, showMessage);
}

// 初始化提示和欢迎
if (typeof Welcome !== 'undefined') {
    Welcome.initTips(src_Path, showMessage, talkValTimer, flagsRef);
    Welcome.showWelcome(showMessage);
}

// 初始化聊天历史功能
if (typeof ChatHistory !== 'undefined') {
    ChatHistory.init();
}

// 初始化聊天功能
if (typeof Live2DChat !== 'undefined') {
    Live2DChat.init(showMessage);
}

// 初始化隐藏/显示功能
if (typeof Live2DHide !== 'undefined') {
    Live2DHide.init(showMessage);
}

// 初始化拖拽功能
if (typeof Live2DDrag !== 'undefined') {
    Live2DDrag.init("landlord");
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
            // console.log("解析后的HTML:", parsedText);
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

function initLive2d (){
    $('#switchModelBtn').on('click', function() {
        console.log('切换模型按钮被点击');
        Live2DModel.switchModel();
        // 点击切换模型时，隐藏聊天框
        if (typeof Live2DChat !== 'undefined') {
            Live2DChat.hideChatInput();
        } else {
            $('.live_talk_input_body').fadeOut(300);
        }
    });
}

$(document).ready(function() {
    // 修改初始化逻辑，预加载当前模型的纹理
    var currentModelTextures = [];
    
    // 根据当前选择的模型加载对应的纹理
    switch(modelList[currentModel].name) {
        case "histoire":
            currentModelTextures = [
                src_Path + "model/histoire/histoire.1024/texture_00.png",
                src_Path + "model/histoire/histoire.1024/texture_01.png",
                src_Path + "model/histoire/histoire.1024/texture_02.png",
                src_Path + "model/histoire/histoire.1024/texture_03.png"
            ];
            break;
        default:
            currentModelTextures = [
                src_Path + "model/histoire/histoire.1024/texture_00.png",
                src_Path + "model/histoire/histoire.1024/texture_01.png",
                src_Path + "model/histoire/histoire.1024/texture_02.png",
                src_Path + "model/histoire/histoire.1024/texture_03.png"
            ];
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
                    loadlive2d("live2d", src_Path + modelList[currentModel].path);
                    
                    // 设置全局模型引用
                    if (typeof setLive2DModel === 'function') {
                        var modelInstance = loadlive2d("live2d", src_Path + modelList[currentModel].path);
                        setLive2DModel(modelInstance);
                    }
                },1000);
                initLive2d();
                images = null;
            }
        };
    }

    // 添加窗口焦点监听，管理休眠状态
    $(window).blur(function() {
        // 窗口失去焦点时，设置休眠状态
        console.log("窗口失去焦点，设置休眠状态");
        sessionStorage.setItem("Sleepy", "1");
    });
    
    $(window).focus(function() {
        // 窗口获得焦点时，清除休眠状态
        if(sessionStorage.getItem("Sleepy") === "1") {
            sessionStorage.removeItem("Sleepy");
            console.log("窗口获得焦点，清除休眠状态");
            // 如果之前在休眠，则显示欢迎回来的消息
            Welcome.checkSleep(showMessage, talkValTimer);
        }
    });
});
