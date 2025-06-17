/**
 * 汉赋小助手 - 模型加载与切换模块
 * 处理Live2D模型的加载、初始化和切换功能
 */

window.Live2DModel = (function() {
    // 私有变量
    let currentModel = 0;
    let modelList = [
        {name: "histoire", path: "model/histoire/model.json"},
        // 可以在这里添加更多模型
    ];
    let modelInstance = null;
    let showMessageCallback = null;
    let srcPath = "";

    /**
     * 初始化模型管理模块
     * @param {string} path - 资源路径前缀
     * @param {function} messageCallback - 显示消息的回调函数
     */
    function init(path, messageCallback) {
        console.log("Live2DModel初始化中...");
        srcPath = path || "";

        // 保存消息回调函数
        if (typeof messageCallback === 'function') {
            showMessageCallback = messageCallback;
        }

        // 绑定切换模型按钮事件
        bindModelEvents();
        
        // 初始加载模型
        setTimeout(function() {
            loadModel(currentModel);
        }, 100);
    }

    /**
     * 绑定模型相关的事件处理
     */
    function bindModelEvents() {
        console.log("绑定模型按钮事件...");
        
        // 使用事件委托绑定切换模型按钮
        $(document).on('click', '#switchModelBtn', function() {
            console.log('切换模型按钮被点击');
            switchModel();
        });

        // 如果使用内联方式，确保window上有方法可调用
        window.switchLive2DModel = switchModel;

        console.log("模型按钮事件绑定完成");
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
            modelInstance = loadlive2d("live2d", srcPath + modelList[modelIndex].path);
            
            // 更新全局模型引用，以便口型同步可以使用
            if (typeof setLive2DModel === 'function') {
                setLive2DModel(modelInstance);
            }
            
            console.log("模型加载完成:", modelList[modelIndex].name);
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
            loadModel(currentModel);
            showMessage('你好，我是汉赋小助手!', 4000);
        }, 1000);
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
     */
    function addModel(name, path) {
        modelList.push({name: name, path: path});
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
            loadModel(currentModel);
            return true;
        }
        return false;
    }

    // 公开API
    return {
        init: init,
        switchModel: switchModel,
        loadModel: loadModel,
        getModelList: getModelList,
        addModel: addModel,
        getCurrentModelIndex: getCurrentModelIndex,
        setCurrentModel: setCurrentModel
    };
})();