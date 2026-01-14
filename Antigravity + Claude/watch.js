import chokidar from 'chokidar';
import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import browserSync from 'browser-sync';

// 設定
const SOURCE_FILE = 'Antigravity + Claude';
const OUTPUT_FILE = 'Antigravity + Claude.html';
const PORT = 3000;

// HTMLテンプレート
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

// Markdown → HTML 変換
function convertToHtml(sourcePath, outputPath) {
  try {
    const markdown = fs.readFileSync(sourcePath, 'utf-8');
    const title = markdown.split('\n')[0].replace(/^#\s*/, '') || 'Document';
    const htmlContent = marked(markdown);
    const fullHtml = htmlTemplate(htmlContent, title);

    fs.writeFileSync(outputPath, fullHtml, 'utf-8');
    console.log(`✅ ${new Date().toLocaleTimeString()} - HTML更新完了: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ 変換エラー: ${error.message}`);
    return false;
  }
}

// メイン処理
const currentDir = process.cwd();
const sourcePath = path.join(currentDir, SOURCE_FILE);
const outputPath = path.join(currentDir, OUTPUT_FILE);

// 初回変換
console.log('🚀 Markdown → HTML 自動変換を開始します');
console.log(`📁 監視対象: ${SOURCE_FILE}`);
console.log(`📄 出力先: ${OUTPUT_FILE}`);
console.log('');

convertToHtml(sourcePath, outputPath);

// BrowserSync起動
const bs = browserSync.create();
bs.init({
  server: currentDir,
  startPath: OUTPUT_FILE,
  port: PORT,
  open: true,
  notify: false,
  ui: false
});

// ファイル監視
const watcher = chokidar.watch(sourcePath, {
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', () => {
  console.log(`📝 変更を検出: ${SOURCE_FILE}`);
  if (convertToHtml(sourcePath, outputPath)) {
    bs.reload();
  }
});

console.log(`\n🌐 ブラウザで確認: http://localhost:${PORT}/${OUTPUT_FILE}`);
console.log('👀 ファイルの変更を監視中... (Ctrl+C で終了)\n');
