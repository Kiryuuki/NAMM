/**
 * Decrypted Text Animation
 * Scrambles text and reveals it character by character.
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?';

export function decryptText(element, targetText, speed = 50, scrambleCount = 3) {
  let iterations = 0;
  const originalText = targetText || element.innerText;
  const length = originalText.length;
  
  const interval = setInterval(() => {
    element.innerText = originalText
      .split('')
      .map((char, index) => {
        if (index < iterations) {
          return originalText[index];
        }
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      })
      .join('');
    
    if (iterations >= length) {
      clearInterval(interval);
      element.innerText = originalText;
    }
    
    iterations += 1 / scrambleCount;
  }, speed);

  return interval;
}

/**
 * Initialize all decrypt-on-load elements
 */
export function initDecryptAnimations() {
  const elements = document.querySelectorAll('.decrypt-text');
  elements.forEach(el => {
    const text = el.getAttribute('data-text') || el.innerText;
    decryptText(el, text);
  });
}
