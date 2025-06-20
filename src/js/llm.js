const openRouterService = {
  // API 密钥
  apiKey: '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',
  
  // 模型配置
  modelConfig: {
    currentModel: null,
    allModels: [],
    defaultModel: '',
    categories: {}
  },
  
  // 对话历史记录
  conversationHistory: [
    {
      role: 'system',
      content: '您是一位友好的数学辅导助手，名叫"汉赋小助手"。您帮助学生解决数学问题。请保持您的回答友好、专业且格式清晰，使用 Markdown 以提高可读性。'
    }
  ],

  // 对话历史上下文长度限制
  maxHistoryLength: 10,

  // 初始化方法，加载模型配置
  async initialize() {
    try {
      const response = await fetch('/src/llm.json');
      if (!response.ok) {
        throw new Error(`Failed to load models: ${response.status}`);
      }
      
      const data = await response.json();
      this.modelConfig.allModels = data.models;
      this.modelConfig.defaultModel = data.defaultModel;
      this.modelConfig.categories = data.categories;
      
      // 设置默认模型
      this.setModel(this.modelConfig.defaultModel);
      
      console.log("模型配置加载成功，当前使用模型：", this.modelConfig.currentModel);
      return true;
    } catch (error) {
      console.error("加载模型配置失败:", error);
      // 设置一个默认模型以防配置加载失败
      this.setModel("qwen/qwen2.5-vl-72b-instruct:free")
      return false;
    }
  },
  
  // 设置当前使用的模型
  setModel(modelNameOrId) {
    if (!modelNameOrId) {
      console.error("无效的模型名称或ID");
      return false;
    }
    
    // 检查是否直接提供了完整的模型名称
    if (modelNameOrId.includes('/')) {
      this.modelConfig.currentModel = modelNameOrId;
      return true;
    }
    
    // 通过ID查找模型
    const model = this.modelConfig.allModels.find(m => m.id === modelNameOrId);
    if (model) {
      this.modelConfig.currentModel = model.name;
      console.log(`已切换到模型: ${model.description} (${model.name})`);
      return true;
    }
    
    console.error(`未找到ID为 "${modelNameOrId}" 的模型`);
    return false;
  },
  
  // 获取当前模型名称
  getCurrentModel() {
    return this.modelConfig.currentModel || this.modelConfig.defaultModel;
  },
  
  // 获取指定分类的模型列表
  getModelsByCategory(category) {
    if (!category || !this.modelConfig.categories[category]) {
      return [];
    }
    
    return this.modelConfig.categories[category].map(id => {
      return this.modelConfig.allModels.find(m => m.id === id);
    }).filter(Boolean);
  },
  
  // 获取所有可用模型
  getAllModels() {
    return this.modelConfig.allModels;
  },

  // 清空对话历史，只保留系统提示
  resetConversation() {
    this.conversationHistory = [
      {
        role: 'system',
        content: '您是一位友好的数学辅导助手，名叫"汉赋小助手"。您帮助学生解决数学问题。请保持您的回答友好、专业且格式清晰，使用 Markdown 以提高可读性。'
      }
    ];
    console.log("对话历史已重置");
  },
  
  // 调用 API 的方法
  async getResponse(userInput) {
    try {
      // 保存用户输入以便在请求失败时返回
      this.lastUserInput = userInput;
      
      // 添加用户消息到历史记录
      this.conversationHistory.push({
        role: 'user',
        content: userInput
      });

      // 如果历史记录过长，移除最早的非系统消息
      if (this.conversationHistory.length > this.maxHistoryLength + 1) {
        // 找到第一个非系统消息的索引
        const firstNonSystemIndex = this.conversationHistory.findIndex(msg => msg.role !== 'system');
        if (firstNonSystemIndex !== -1) {
          // 移除最早的一组对话（用户消息和助手回复）
          this.conversationHistory.splice(firstNonSystemIndex, 2);
        }
      }
      
      // 设置超时
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('请求超时')), 8000)
      );
      
      // 确保已有当前模型设置
      const modelName = this.getCurrentModel();
      
      // 准备请求体数据，使用完整的对话历史
      const requestBody = {
        model: modelName,
        messages: [...this.conversationHistory], // 使用对话历史记录
        max_tokens: 800
      };
      
      // 与超时竞争
      const response = await Promise.race([
        fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': document.location.href,
            'X-Title': 'HanFu Assistant'
          },
          body: JSON.stringify(requestBody)
        }),
        timeout
      ]);
      
      if(!response.ok) {
        console.error('API返回错误状态码:', response.status);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API 返回的原始数据:", data); 
      
      // 检查API返回数据格式是否正确
      if (!data || !data.choices || !data.choices.length || !data.choices[0].message) {
        console.error('API返回数据格式错误');
        throw new Error('API返回数据格式错误');
      }
      
      // 获取回复内容
      const reply = data.choices[0].message.content.trim();
      
      // 检查回复是否为空
      if (!reply) {
        console.error('API返回空回复');
        throw new Error('API返回空回复');
      }
      
      // 将助手回复添加到对话历史
      this.conversationHistory.push({
        role: 'assistant',
        content: reply
      });
      
      console.log("当前对话历史:", this.conversationHistory);
      
      // 返回回复内容
      return reply;
      
    } catch(error) {
      console.error('API调用出错:', error);
      
      // 发生错误时，移除最后一条用户消息避免重复
      if (this.conversationHistory.length > 0 && 
          this.conversationHistory[this.conversationHistory.length - 1].role === 'user') {
        this.conversationHistory.pop();
      }
      
      // 其他错误情况使用备用回答
      const fallbackResponse = this.getFallbackResponse(this.lastUserInput || userInput);
      
      // 将备用回答添加到历史记录
      this.conversationHistory.push({
        role: 'assistant',
        content: fallbackResponse
      });
      
      return fallbackResponse;
    }
  },
  
  // 备用回答
  getFallbackResponse(userInput) {
    // 根据用户输入关键词提供相关的备用回答
    const keywords = {
      '方程': [
        '二元一次方程组是数学中的基础内容，通常有两个未知数和两个方程。',
        '解二元一次方程组常用的方法有代入法、加减法和矩阵法。',
        '二元一次方程组可以表示为：\na₁x + b₁y = c₁\na₂x + b₂y = c₂'
      ],
      '数学': [
        '数学是研究数量、结构、变化、空间以及信息等概念的一门学科。',
        '数学的逻辑性和严谨性是它的重要特点，也是它的魅力所在。',
        '数学在我们日常生活中无处不在，从购物计算到数据分析。'
      ]
    };
    
    // 默认回复
    const defaultReplies = [
      '我很乐意帮助你解答这个问题！请告诉我更多细节。',
      '这是一个很好的问题！让我来详细解释一下...',
      '学习数学需要耐心和实践，我会尽力帮助你理解这个概念。',
      '你提出了一个有趣的问题，让我来为你分析。'
    ];
    
    // 检查用户输入是否包含关键词
    for (let keyword in keywords) {
      if (userInput.toLowerCase().includes(keyword)) {
        const replies = keywords[keyword];
        return replies[Math.floor(Math.random() * replies.length)];
      }
    }
    
    // 如果没有匹配关键词，返回默认回复
    return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
  },

  // 添加加载对话历史的方法, 从本地存储恢复对话历史
  loadConversationHistory() {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        
        // 先保留系统消息
        const systemMessages = this.conversationHistory.filter(
          msg => msg.role === 'system'
        );
        
        // 合并系统消息和加载的历史
        this.conversationHistory = [...systemMessages, ...history];
        
        console.log("已从本地存储加载对话历史");
      }
    } catch (e) {
      console.error("加载对话历史失败:", e);
      // 出错时，保持原始的系统提示，不影响正常使用
    }
  }
};

// 页面加载完成后初始化模型配置
document.addEventListener('DOMContentLoaded', () => {
  openRouterService.initialize().then(success => {
    if (success) {
      console.log('模型配置加载成功');
    } else {
      console.warn('使用默认模型配置');
    }
  });
});