/**
 * 汉赋小助手 - 拖拽模块
 * 实现Live2D模型容器的拖拽功能与位置记忆
 */

window.Live2DDrag = (function() {
    // 私有变量
    let moveX = 0;
    let moveY = 0;
    let moveBottom = 0;
    let moveLeft = 0;
    let moveable = false;
    let dragElement = null;
    let originalDocMouseMove = null;
    let originalDocMouseUp = null;
    
    /**
     * 初始化拖拽功能
     * @param {string} elementId - 要使拖拽的元素ID，默认为"landlord"
     */
    function init(elementId = "landlord") {
        console.log("Live2DDrag初始化中...");
        
        // 先恢复位置，确保元素可见
        restorePosition();
        
        // 获取元素并设置拖拽
        setTimeout(function() {
            setupDraggable(elementId);
        }, 500); // 延迟设置，确保DOM已加载
    }
    
    /**
     * 设置元素为可拖动
     */
    function setupDraggable(elementId) {
        // 获取要拖拽的元素
        dragElement = document.getElementById(elementId);
        if (!dragElement) {
            console.error('未找到要拖拽的元素:', elementId);
            return;
        }
        
        console.log("设置拖拽功能...", dragElement);
        
        // 添加鼠标按下事件
        dragElement.addEventListener('mousedown', function(e) {
            e.preventDefault(); // 阻止默认事件
            
            // 保存原始事件处理器
            originalDocMouseMove = document.onmousemove;
            originalDocMouseUp = document.onmouseup;
            
            moveable = true;
            moveX = e.clientX;
            moveY = e.clientY;
            
            // 确保有正确的初始位置
            let computedStyle = window.getComputedStyle(dragElement);
            moveBottom = parseInt(computedStyle.bottom) || 0;
            moveLeft = parseInt(computedStyle.left) || 0;
            
            // Firefox特殊处理
            if (navigator.userAgent.indexOf("Firefox") > 0) {
                window.getSelection().removeAllRanges();
            }
            
            // 设置移动事件
            document.onmousemove = handleMouseMove;
            document.onmouseup = handleMouseUp;
            
            console.log("开始拖拽", {moveX, moveY, moveBottom, moveLeft});
        });
    }
    
    /**
     * 处理鼠标移动事件
     */
    function handleMouseMove(e) {
        if (moveable && dragElement) {
            let x = moveLeft + e.clientX - moveX;
            let y = moveBottom + (moveY - e.clientY);
            
            // 确保不会拖动到屏幕外太远
            x = Math.max(-dragElement.offsetWidth / 2, x);
            y = Math.max(-30, y); // 允许部分隐藏，但不要完全隐藏
            
            dragElement.style.left = x + "px";
            dragElement.style.bottom = y + "px";
            
            console.log("拖拽中", {x, y});
        }
    }
    
    /**
     * 处理鼠标抬起事件
     */
    function handleMouseUp() {
        if (moveable && dragElement) {
            // 保存新位置到会话存储
            let newLeft = parseInt(dragElement.style.left);
            let newBottom = parseInt(dragElement.style.bottom);
            
            console.log("拖拽结束，保存新位置", {newLeft, newBottom});
            
            sessionStorage.setItem("historywidth", newLeft);
            sessionStorage.setItem("historyheight", newBottom);
            
            // 恢复原始事件处理器
            document.onmousemove = originalDocMouseMove;
            document.onmouseup = originalDocMouseUp;
            
            // 重置状态
            moveable = false;
            moveX = 0;
            moveY = 0;
            moveBottom = 0;
            moveLeft = 0;
        }
    }
    
    /**
     * 从会话存储中恢复位置
     */
    function restorePosition() {
        console.log("恢复位置...");
        
        // 获取保存的位置
        let landL = sessionStorage.getItem("historywidth");
        let landB = sessionStorage.getItem("historyheight");
        
        console.log("存储的位置:", {landL, landB});
        
        // 检查值是否有效
        if (landL === null || landB === null || isNaN(parseInt(landL)) || isNaN(parseInt(landB))) {
            landL = 5;
            landB = 0;
        } else {
            landL = parseInt(landL);
            landB = parseInt(landB);
        }
        
        // 应用位置到元素
        $("#landlord").css({
            'left': landL + 'px',
            'bottom': landB + 'px'
        });
        
        console.log("应用新位置:", {landL, landB});
    }
    
    // 公开API
    return {
        init: init,
        restorePosition: restorePosition
    };
})();