// filepath: c:\Users\LYF\Desktop\hanfu\web_live2d\live2d\js\latex-renderer.js
/**
 * 用于渲染LaTeX数学公式的工具
 */
const latexRenderer = {
  /**
   * 初始化KaTeX渲染
   */
  init: function() {
    if (typeof renderMathInElement !== 'function') {
      console.warn('KaTeX auto-render 脚本未加载，LaTeX公式可能不会正确渲染');
      return false;
    }
    return true;
  },
  
  /**
   * 渲染特定元素中的数学公式
   * @param {HTMLElement} element - 包含数学公式的HTML元素
   */
  renderElement: function(element) {
    if (!this.init()) return;
    
    try {
      renderMathInElement(element, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "$", right: "$", display: false}
        ],
        throwOnError: false,
        output: 'html'
      });
      
      // 处理添加了data-latex属性的元素
      const inlineMath = element.querySelectorAll('.katex-inline');
      const displayMath = element.querySelectorAll('.katex-display');
      
      inlineMath.forEach(el => {
        if (el.getAttribute('data-latex')) {
          try {
            katex.render(el.getAttribute('data-latex'), el, {
              throwOnError: false,
              displayMode: false
            });
          } catch (e) {
            console.error('渲染行内LaTeX失败:', e);
          }
        }
      });
      
      displayMath.forEach(el => {
        if (el.getAttribute('data-latex')) {
          try {
            katex.render(el.getAttribute('data-latex'), el, {
              throwOnError: false,
              displayMode: true
            });
          } catch (e) {
            console.error('渲染块级LaTeX失败:', e);
          }
        }
      });
      
    } catch (e) {
      console.error('数学公式渲染出错:', e);
    }
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  latexRenderer.init();
});