import { marked } from 'marked';
import fs from 'fs';

// 設定
const SOURCE_FILE = 'Antigravity + Claude';
const OUTPUT_FILE = 'Antigravity + Claude.html';

// HTMLテンプレート（watch.jsと同じ）
const htmlTemplate = (content, title) => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #333333;
      --heading-color: #1a1a1a;
      --link-color: #0066cc;
      --code-bg: #f5f5f5;
      --border-color: #e0e0e0;
      --table-header-bg: #f8f9fa;
      --h1-color: #2563eb;
      --h2-color: #059669;
      --h3-color: #7c3aed;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
      line-height: 1.8;
      color: var(--text-color);
      background-color: var(--bg-color);
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    h1, h2, h3, h4 {
      margin-top: 2em;
      margin-bottom: 0.8em;
      font-weight: 600;
    }

    h1 {
      font-size: 2em;
      color: var(--h1-color);
      border-bottom: 3px solid var(--h1-color);
      padding-bottom: 0.3em;
    }

    h2 {
      font-size: 1.5em;
      color: var(--h2-color);
      border-bottom: 2px solid var(--h2-color);
      padding-bottom: 0.3em;
    }

    h3 {
      font-size: 1.25em;
      color: var(--h3-color);
    }

    h4 {
      font-size: 1.1em;
      color: var(--heading-color);
    }

    p {
      margin: 1em 0;
    }

    a {
      color: var(--link-color);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    code {
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      background-color: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
    }

    pre {
      background-color: var(--code-bg);
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid var(--border-color);
    }

    pre code {
      background: none;
      padding: 0;
    }

    blockquote {
      border-left: 4px solid var(--link-color);
      margin: 1.5em 0;
      padding: 0.5em 1em;
      background-color: var(--code-bg);
      color: #555;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }

    th, td {
      border: 1px solid var(--border-color);
      padding: 0.75em 1em;
      text-align: left;
    }

    th {
      background-color: var(--table-header-bg);
      font-weight: 600;
    }

    tr:nth-child(even) {
      background-color: #fafafa;
    }

    ul, ol {
      padding-left: 1.5em;
      margin: 1em 0;
    }

    li {
      margin: 0.5em 0;
    }

    hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 2em 0;
    }

    strong {
      font-weight: 600;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    .update-time {
      color: #888;
      font-size: 0.85em;
      text-align: right;
      margin-bottom: 2em;
    }
  </style>
</head>
<body>
  <div class="update-time">最終更新: ${new Date().toLocaleString('ja-JP')}</div>
  ${content}
</body>
</html>`;

// 変換実行
try {
  const markdown = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const title = markdown.split('\n')[0].replace(/^#\s*/, '') || 'Document';
  const htmlContent = marked(markdown);
  const fullHtml = htmlTemplate(htmlContent, title);

  fs.writeFileSync(OUTPUT_FILE, fullHtml, 'utf-8');
  console.log(`✅ HTML生成完了: ${OUTPUT_FILE}`);
} catch (error) {
  console.error(`❌ エラー: ${error.message}`);
  process.exit(1);
}
