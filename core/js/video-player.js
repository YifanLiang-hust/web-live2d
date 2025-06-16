// 视频播放器与Live2D交互脚本
document.addEventListener('DOMContentLoaded', function() {
    // 获取视频元素
    const videoPlayer = document.getElementById('video-player');
    
    if (videoPlayer) {
        // 视频播放时
        videoPlayer.addEventListener('play', function() {
            showMessage('视频开始播放啦！', 3000);
        });
        
        // 视频暂停时
        videoPlayer.addEventListener('pause', function() {
            showMessage('视频暂停了呢，需要休息一下吗？', 3000);
        });
        
        // 视频结束时
        videoPlayer.addEventListener('ended', function() {
            showMessage('视频看完了，学会二元一次方程组了吗？', 5000);
        });
        
        // 视频加载错误时
        videoPlayer.addEventListener('error', function() {
            showMessage('视频加载失败了，请检查视频文件是否存在', 5000);
        });

        // 视频加载成功
        videoPlayer.addEventListener('loadeddata', function() {
            showMessage('视频已准备好啦！点击播放按钮开始观看吧~', 4000);
        });

        // 视频进度更新
        videoPlayer.addEventListener('timeupdate', function() {
            // 当视频播放到约一半时
            if (videoPlayer.currentTime > videoPlayer.duration / 2 && 
                videoPlayer.currentTime < (videoPlayer.duration / 2 + 0.5)) {
                showMessage('看到这里，有没有更明白一些呢？', 3000);
            }
        });
    }

    // 确保函数在全局作用域可用
    window.toggleFullScreen = function() {
        if (!document.fullscreenElement) {
            if (videoPlayer.requestFullscreen) {
                videoPlayer.requestFullscreen();
            } else if (videoPlayer.webkitRequestFullscreen) {
                videoPlayer.webkitRequestFullscreen();
            } else if (videoPlayer.msRequestFullscreen) {
                videoPlayer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
});

// 重载showMessage函数，以防message.js中的函数未加载
function showMessage(text, timeout) {
    if (window.showMessage && typeof window.showMessage === 'function') {
        window.showMessage(text, timeout);
    } else {
        console.log("Live2D Message:", text);
        
        // 简单实现一个显示消息的功能
        const messageElement = document.querySelector('.message');
        if (messageElement) {
            messageElement.innerHTML = text;
            messageElement.style.opacity = 1;
            
            setTimeout(function() {
                messageElement.style.opacity = 0;
            }, timeout || 5000);
        }
    }
}