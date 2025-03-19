// src/utils/textUtils.js

/**
 * Truncates text to a specified word limit and adds ellipsis if needed
 * @param {string} text - The text to truncate
 * @param {number} wordLimit - Maximum number of words to include
 * @return {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, wordLimit = 50) => {
    if (!text) return '';
    
    const words = text.trim().split(/\s+/);
    
    if (words.length <= wordLimit) {
      return text;
    }
    
    return words.slice(0, wordLimit).join(' ') + '...';
  };