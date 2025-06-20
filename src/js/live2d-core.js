/**
 * 汉赋小助手 - Live2D核心模块
 * 整合模型加载、显示隐藏和拖拽功能
 */

window.Live2DCore = (function() {
    // 私有变量和状态
    let currentModel = 0;
    let modelList = [
        {name: "histoire", path: "model/histoire/model.json"},
        // 可以在这里添加更多模型
    ];
    let modelInstance = null;
    let showMessageCallback = null;
    let srcPath = "";
    let images = [];
    let fadeFlag = false;
    
    // 拖拽相关变量
    let moveX = 0;
    let moveY = 0;
    let moveBottom = 0;
    let moveLeft = 0;
    let moveable = false;
    let dragElement = null;
    let originalDocMouseMove = null;
    let originalDocMouseUp = null;
    
    // 纹理映射表
    const textureMapping = {
        "histoire": [
            "model/histoire/histoire.1024/texture_00.png",
            "model/histoire/histoire.1024/texture_01.png",
            "model/histoire/histoire.1024/texture_02.png",
            "model/histoire/histoire.1024/texture_03.png"
        ]
        // 可以在这里添加更多模型的纹理映射
    };

    /**
     * 初始化Live2D核心功能
     * @param {string} path - 资源路径前缀
     * @param {function} messageCallback - 显示消息的回调函数
     */
    function init(path, messageCallback) {
        console.log("Live2DCore初始化中...");
        srcPath = path || "";

        // 保存消息回调函数
        if (typeof messageCallback === 'function') {
            showMessageCallback = messageCallback;
        }

        // 恢复上次的位置
        restorePosition();
        
        // 恢复上次的显示/隐藏状态
        restoreVisibility();

        // 绑定所有事件
        bindEvents();
        
        // 初始加载模型（预加载纹理）
        setTimeout(function() {
            preloadModelTextures(currentModel, function() {
                loadModel(currentModel);
            });
        }, 100);
    }

    /**
     * 绑定所有交互事件
     */
    function bindEvents() {
        // 绑定模型切换按钮
        $(document).on('click', '#switchModelBtn', function() {
            console.log('切换模型按钮被点击');
            switchModel();
        });

        // 隐藏按钮点击事件
        $('#hideButton').on('click', function() {
            console.log("隐藏按钮被点击");
            hideModel();
        });
        
        // 显示按钮点击事件
        $('#open_live2d').on('click', function() {
            console.log("显示按钮被点击");
            showModel();
        });

        // 设置可拖拽功能
        setTimeout(function() {
            setupDraggable("landlord");
        }, 500);

        // 如果使用内联方式，确保window上有方法可调用
        window.switchLive2DModel = switchModel;

        console.log("Live2D所有事件绑定完成");
    }

    // ========================
    // 模型加载与切换相关功能
    // ========================

    /**
     * 预加载当前模型的纹理
     * @param {number} modelIndex - 要加载的模型索引
     * @param {function} callback - 加载完成后的回调函数
     */
    function preloadModelTextures(modelIndex, callback) {
        console.log("预加载模型纹理:", modelList[modelIndex].name);
        
        const modelName = modelList[modelIndex].name;
        let currentModelTextures = [];
        
        // 根据当前选择的模型加载对应的纹理
        if (textureMapping[modelName]) {
            currentModelTextures = textureMapping[modelName].map(texture => srcPath + texture);
        } else {
            console.warn("没有找到模型的纹理映射:", modelName);
            // 使用默认纹理
            currentModelTextures = textureMapping["histoire"].map(texture => srcPath + texture);
        }
        
        images = [];
        const imgLength = currentModelTextures.length;
        let loadingNum = 0;
        
        for (let i = 0; i < imgLength; i++) {
            images[i] = new Image();
            images[i].src = currentModelTextures[i];
            images[i].onload = function() {
                loadingNum++;
                if (loadingNum === imgLength) {
                    console.log("模型纹理预加载完成:", modelName);
                    // 显示Live2D模型或打开按钮
                    displayModelOrButton();
                    
                    // 执行回调
                    if (typeof callback === 'function') {
                        callback();
                    }
                    
                    images = null; // 释放内存
                }
            };
            
            // 添加错误处理
            images[i].onerror = function() {
                console.error("纹理加载失败:", currentModelTextures[i]);
                loadingNum++;
                if (loadingNum === imgLength) {
                    console.log("模型纹理加载完成(有错误):", modelName);
                    displayModelOrButton();
                    
                    if (typeof callback === 'function') {
                        callback();
                    }
                    
                    images = null;
                }
            };
        }
    }
    
    /**
     * 显示Live2D模型或打开按钮
     */
    function displayModelOrButton() {
        const live2dhidden = localStorage.getItem("live2dhidden");
        if (live2dhidden === "0") {
            setTimeout(function() {
                $('#open_live2d').fadeIn(200);
            }, 1300);
        } else {
            setTimeout(function() {
                $('#landlord').fadeIn(200);
            }, 1300);
        }
    }

    /**
     * 加载指定索引的模型
     * @param {number} modelIndex - 要加载的模型索引
     */
    function loadModel(modelIndex) {
        if (modelIndex < 0 || modelIndex >= modelList.length) {
            console.error("模型索引无效:", modelIndex);
            return;
        }

        console.log("加载模型:", modelList[modelIndex].name);
        
        try {
            // 加载Live2D模型
            setTimeout(function() {
                modelInstance = loadlive2d("live2d", srcPath + modelList[modelIndex].path);
                
                // 更新全局模型引用，以便口型同步可以使用
                if (typeof setLive2DModel === 'function') {
                    setLive2DModel(modelInstance);
                }
                
                console.log("模型加载完成:", modelList[modelIndex].name);
            }, 1000);
        } catch (e) {
            console.error("模型加载失败:", e);
        }
    }

    /**
     * 切换到下一个模型
     */
    function switchModel() {
        console.log("切换模型...", currentModel, "->", (currentModel + 1) % modelList.length);
        
        // 显示切换提示
        showMessage('小助手模型切换中...', 2000);
        
        // 计算下一个模型索引
        currentModel = (currentModel + 1) % modelList.length;
        
        // 延迟加载新模型，形成过渡效果
        setTimeout(function() {
            // 先预加载纹理，再加载模型
            preloadModelTextures(currentModel, function() {
                loadModel(currentModel);
                showMessage('你好，我是汉赋小助手!', 4000);
            });
        }, 1000);
    }

    /**
     * 获取当前模型列表
     * @returns {Array} 模型列表
     */
    function getModelList() {
        return [...modelList];
    }

    /**
     * 添加新模型到列表
     * @param {string} name - 模型名称
     * @param {string} path - 模型路径
     * @param {Array} textures - 模型纹理路径数组
     */
    function addModel(name, path, textures) {
        modelList.push({name: name, path: path});
        
        // 如果提供了纹理，则添加到纹理映射
        if (Array.isArray(textures) && textures.length > 0) {
            textureMapping[name] = textures;
        }
    }

    /**
     * 获取当前模型索引
     */
    function getCurrentModelIndex() {
        return currentModel;
    }

    /**
     * 直接设置当前模型
     * @param {number} index - 模型索引
     */
    function setCurrentModel(index) {
        if (index >= 0 && index < modelList.length && index !== currentModel) {
            currentModel = index;
            preloadModelTextures(currentModel, function() {
                loadModel(currentModel);
            });
            return true;
        }
        return false;
    }

    // ========================
    // 显示隐藏相关功能
    // ========================
    
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
        }
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

    // ========================
    // 拖拽相关功能
    // ========================
    
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
        // 获取保存的位置
        let landL = sessionStorage.getItem("historywidth");
        let landB = sessionStorage.getItem("historyheight");
        
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
    }

    /**
     * 显示消息
     * @param {string} text - 消息文本
     * @param {number} timeout - 显示时长(毫秒)
     */
    function showMessage(text, timeout) {
        // 优先使用传入的回调函数
        if (typeof showMessageCallback === 'function') {
            showMessageCallback(text, timeout);
        } else if (typeof window.showMessage === 'function') {
            // 回退到全局函数
            window.showMessage(text, timeout);
        } else {
            console.log("无法显示消息:", text);
        }
    }

    // 公开API
    return {
        // 核心初始化
        init: init,
        
        // 模型相关API
        switchModel: switchModel,
        loadModel: loadModel,
        addModel: addModel,
        getModelList: getModelList,
        getCurrentModelIndex: getCurrentModelIndex,
        setCurrentModel: setCurrentModel,
        
        // 显示隐藏相关API
        show: showModel,
        hide: hideModel,
        isVisible: isVisible,
        setVisibility: setVisibility,
        
        // 位置相关API
        restorePosition: restorePosition
    };
})();