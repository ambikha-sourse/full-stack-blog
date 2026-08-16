import confetti from 'canvas-confetti';

// Launch celebratory confetti burst
export function triggerCelebration() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
  });
}

// Format relative date or standard date
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Calculate estimated read time
export function estimateReadTime(text) {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Extract Table of Contents headings from Markdown content
export function extractHeadings(markdown) {
  if (!markdown) return [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim().replace(/[*_`]/g, '');
    const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
    headings.push({ level, text, id });
  }

  return headings;
}

// Render Markdown to HTML with enhanced code blocks & blockquotes
export function renderMarkdown(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Escape basic HTML to prevent injection
  const escapeHtml = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  // Code blocks with syntax styling & copy hooks
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const cleanLang = lang || 'code';
    const escapedCode = escapeHtml(code.trim());
    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-block-lang">${cleanLang}</span>
        <button class="code-copy-btn" data-code="${encodeURIComponent(code.trim())}">
          <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Copy</span>
        </button>
      </div>
      <pre><code class="language-${cleanLang}">${escapedCode}</code></pre>
    </div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headings with IDs
  html = html.replace(/^###\s+(.+)$/gm, (m, title) => {
    const id = title.trim().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
    return `<h3 id="${id}">${title}</h3>`;
  });

  html = html.replace(/^##\s+(.+)$/gm, (m, title) => {
    const id = title.trim().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
    return `<h2 id="${id}">${title}</h2>`;
  });

  html = html.replace(/^#\s+(.+)$/gm, (m, title) => {
    const id = title.trim().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
    return `<h1 id="${id}">${title}</h1>`;
  });

  // Callouts / Blockquotes
  html = html.replace(/^>\s*💡\s*(.+)$/gm, '<div class="article-callout tip"><span class="callout-icon">💡</span><div class="callout-body">$1</div></div>');
  html = html.replace(/^>\s*⚠️\s*(.+)$/gm, '<div class="article-callout warning"><span class="callout-icon">⚠️</span><div class="callout-body">$1</div></div>');
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="article-quote">$1</blockquote>');

  // Bold and Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="article-link">$1</a>');

  // Unordered Lists
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="article-list-item">$1</li>');
  html = html.replace(/(<li class="article-list-item">[\s\S]*?<\/li>)/g, '<ul class="article-list">$1</ul>');
  // Fix multiple nested lists
  html = html.replace(/<\/ul>\s*<ul class="article-list">/g, '');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="article-divider" />');

  // Paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h1') ||
        trimmed.startsWith('<h2') ||
        trimmed.startsWith('<h3') ||
        trimmed.startsWith('<div class="code-block') ||
        trimmed.startsWith('<div class="article-callout') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<hr')
      ) {
        return trimmed;
      }
      return `<p class="article-p">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}
