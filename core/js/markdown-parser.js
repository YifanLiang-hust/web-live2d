/**
 * 简单但强大的Markdown解析器，含LaTeX支持
 */
const markdownParser = {
  /**
   * 解析Markdown文本为HTML
   * @param {string} text - Markdown格式文本
   * @return {string} HTML格式文本
   */
  parse: function(text) {
    if (!text) return '';
    
    try {
      // 确保处理的是字符串
      text = String(text);
      
      // 保存原始文本，以便出错时返回
      const originalText = text;
      
      // 预处理：统一换行符并添加空行
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      text = '\n\n' + text + '\n\n';
      
      // 1. 标记并保护LaTeX公式
      const mathExpressions = [];
      // 行内公式 $...$
      text = text.replace(/\$([^\$\n]+?)\$/g, function(match, formula) {
        mathExpressions.push({ type: 'inline', formula: formula });
        return `<MATH-INLINE-${mathExpressions.length - 1}>`;
      });
      
      // 独立公式 $$...$$
      text = text.replace(/\$\$([\s\S]+?)\$\$/g, function(match, formula) {
        mathExpressions.push({ type: 'display', formula: formula });
        return `<MATH-DISPLAY-${mathExpressions.length - 1}>`;
      });
      
      // 2. 处理代码块 - 必须先处理，防止内部的特殊字符被解析
      text = text.replace(/```([\s\S]*?)```/g, function(match, code) {
        // 对HTML特殊字符进行转义
        code = code.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
        return `<div class="code-block">${code.trim()}</div>`;
      });
      
      // 3. 处理行内代码 - 同样需要先处理
      text = text.replace(/`([^`]+?)`/g, function(match, code) {
        code = code.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
        return `<code>${code}</code>`;
      });
      
      // 4. 处理标题
      text = text.replace(/(?:^|\n)### (.*?)(?:\n|$)/g, '\n<h3>$1</h3>\n');
      text = text.replace(/(?:^|\n)## (.*?)(?:\n|$)/g, '\n<h2>$1</h2>\n');
      text = text.replace(/(?:^|\n)# (.*?)(?:\n|$)/g, '\n<h1>$1</h1>\n');
      
      // 5. 处理引用块
      text = text.replace(/(?:^|\n)> (.*?)(?:\n|$)/g, '\n<blockquote>$1</blockquote>\n');
      
      // 6. 处理有序列表
      text = this._processLists(text, /(?:^|\n)(\d+\. .*(?:\n(?!\n)[^\d\n].*)*)/g, 'ol');
      
      // 7. 处理无序列表
      text = this._processLists(text, /(?:^|\n)([*\-+] .*(?:\n(?!\n)[^*\-+\n].*)*)/g, 'ul');
      
      // 8. 处理粗体 - 使用特定的正则来捕获所有情况
      text = text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
      
      // 9. 处理斜体 - 使用非贪婪匹配确保正确处理
      text = text.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
      text = text.replace(/_([^_]+?)_/g, '<em>$1</em>');
      
      // 10. 处理链接
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
      
      // 11. 处理图片
      text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
      
      // 12. 处理水平线
      text = text.replace(/(?:^|\n)---+(?:\n|$)/g, '\n<hr>\n');
      
      // 13. 处理段落 - 将多行文本分割为段落
      text = this._processParagraphs(text);
      
      // 14. 恢复LaTeX公式
      // 恢复行内公式
      text = text.replace(/<MATH-INLINE-(\d+)>/g, function(match, index) {
        const mathData = mathExpressions[parseInt(index)];
        return `<span class="katex-inline" data-latex="${this._escapeAttr(mathData.formula)}">${mathData.formula}</span>`;
      }.bind(this));
      
      // 恢复独立公式
      text = text.replace(/<MATH-DISPLAY-(\d+)>/g, function(match, index) {
        const mathData = mathExpressions[parseInt(index)];
        return `<div class="katex-display" data-latex="${this._escapeAttr(mathData.formula)}">${mathData.formula}</div>`;
      }.bind(this));
      
      return text;
    } catch(error) {
      console.error('Markdown解析错误:', error);
      return text.replace(/\n/g, '<br>');
    }
  },
  
  // 辅助方法：处理列表
  _processLists: function(text, pattern, listType) {
    return text.replace(pattern, function(match) {
      // 拆分列表项
      const items = match.split('\n').filter(line => line.trim());
      
      // 处理列表项
      const processedItems = items.map(item => {
        if (listType === 'ol') {
          return `<li>${item.replace(/^\d+\.\s+/, '')}</li>`;
        } else {
          return `<li>${item.replace(/^[*\-+]\s+/, '')}</li>`;
        }
      });
      
      // 组合成列表
      return `\n<${listType}>${processedItems.join('')}</${listType}>\n`;
    });
  },
  
  // 辅助方法：处理段落
  _processParagraphs: function(text) {
    // 首先标记所有已经被HTML标签包裹的内容
    const blocks = [];
    text = text.replace(/<([a-z][a-z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/gi, function(match) {
      blocks.push(match);
      return `\n<BLOCK${blocks.length - 1}>\n`;
    });
    
    // 处理段落
    const paragraphs = text.split(/\n\s*\n/)
                          .filter(p => p.trim())
                          .map(p => {
                            if (p.trim().startsWith('<BLOCK')) {
                              // 恢复被标记的块
                              const index = parseInt(p.trim().replace('<BLOCK', '').replace('>', ''));
                              return blocks[index];
                            } else if (!p.trim().startsWith('<')) {
                              // 只有不是以HTML标签开头的内容才包装为段落
                              return `<p>${p.trim()}</p>`;
                            }
                            return p.trim();
                          });
    
    // 恢复所有被替换的块
    let result = paragraphs.join('\n');
    result = result.replace(/<BLOCK(\d+)>/g, function(match, index) {
      return blocks[parseInt(index)];
    });
    
    return result;
  },
  
  // 辅助方法：转义HTML属性
  _escapeAttr: function(text) {
    return text.replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
  }
};