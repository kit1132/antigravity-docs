/**
 * generate_pdf.js - Markdown→PDF変換スクリプト
 *
 * Markdownファイルを読み込み、スタイル付きHTMLに変換後、PDFを生成する
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// ============================================
// 設定
// ============================================
const CONFIG = {
    inputFile: 'Claude Desktop「Cowork」.md',
    outputFile: 'Claude Desktop「Cowork」.pdf',
    docDate: '2026年1月12日',
    pageFormat: 'A4',
    margin: '12.7mm',  // 0.5インチ
    timeout: 30000,    // ブラウザ操作のタイムアウト（ミリ秒）
};

// ============================================
// CSSスタイル定義
// ============================================
const STYLES = `
    @page {
        size: A4;
        margin: 12.7mm;
    }

    :root {
        --primary-color: #0078d4;
        --secondary-color: #106ebe;
        --success-color: #107c10;
        --warning-color: #d83b01;
        --danger-color: #d13438;
        --bg-color: #ffffff;
        --text-color: #323130;
        --text-muted: #605e5c;
        --border-color: #e1dfdd;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: 'Segoe UI', 'Hiragino Sans', 'Meiryo', 'Yu Gothic', sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        line-height: 1.7;
        font-size: 10pt;
    }

    .container {
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
        padding: 0;
    }

    /* 印刷時の調整 */
    @media print {
        body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
        }
        .container {
            width: 100%;
            max-width: none;
            padding: 0;
            margin: 0;
        }
        .header {
            background: var(--primary-color) !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    }

    /* ヘッダー */
    .header {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        padding: 30px;
        margin-bottom: 25px;
        border-radius: 8px;
    }
    .header h1 { font-size: 18pt; font-weight: 600; margin-bottom: 10px; }
    .header p { font-size: 10pt; opacity: 0.95; margin-bottom: 10px; }
    .header .meta {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        padding: 5px 12px;
        border-radius: 15px;
        font-size: 9pt;
    }

    /* Markdownコンテンツ */
    #markdown-content { line-height: 1.8; }
    #markdown-content h1 { display: none; }

    #markdown-content h2 {
        color: var(--primary-color);
        font-size: 14pt;
        font-weight: 600;
        margin-top: 40px;
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--primary-color);
        page-break-after: avoid;
        break-after: avoid;
    }

    #markdown-content h3 {
        color: var(--text-color);
        font-size: 11pt;
        font-weight: 600;
        margin: 25px 0 12px 0;
        page-break-after: avoid;
        break-after: avoid;
    }

    #markdown-content h4 {
        color: var(--text-muted);
        font-size: 10pt;
        font-weight: 600;
        margin: 20px 0 10px 0;
        page-break-after: avoid;
        break-after: avoid;
    }

    /* セクション単位での改ページ制御 */
    .content-section { page-break-inside: avoid; break-inside: avoid; }
    .h2-section { page-break-before: auto; }
    .h3-section { page-break-inside: avoid; break-inside: avoid; }

    /* 見出しと直後の要素をまとめる */
    #markdown-content h2 + p,
    #markdown-content h2 + ul,
    #markdown-content h2 + ol,
    #markdown-content h2 + table,
    #markdown-content h3 + p,
    #markdown-content h3 + ul,
    #markdown-content h3 + ol,
    #markdown-content h3 + table {
        page-break-before: avoid;
        break-before: avoid;
    }

    #markdown-content p { margin-bottom: 12px; orphans: 3; widows: 3; }
    #markdown-content strong { color: var(--text-color); font-weight: 600; }

    /* テーブル */
    #markdown-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 9pt;
        page-break-inside: avoid;
    }
    #markdown-content th, #markdown-content td {
        padding: 10px 12px;
        text-align: left;
        border: 1px solid var(--border-color);
    }
    #markdown-content th { background: #f3f2f1; font-weight: 600; color: var(--text-color); }
    #markdown-content tr:nth-child(even) { background: #fafafa; }

    /* リスト */
    #markdown-content ul, #markdown-content ol {
        margin: 12px 0;
        padding-left: 25px;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    #markdown-content li { margin: 8px 0; orphans: 2; widows: 2; }
    #markdown-content li::marker { color: var(--primary-color); }

    /* コード */
    #markdown-content code {
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 9pt;
    }
    #markdown-content pre {
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 15px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 15px 0;
        font-size: 9pt;
        page-break-inside: avoid;
    }
    #markdown-content pre code { background: none; padding: 0; color: inherit; }

    /* 引用 */
    #markdown-content blockquote {
        border-left: 4px solid var(--primary-color);
        padding: 12px 18px;
        margin: 15px 0;
        background: #f9f9f9;
        font-style: italic;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    #markdown-content blockquote p { margin: 0; }

    /* 水平線 */
    #markdown-content hr { border: none; border-top: 1px solid var(--border-color); margin: 30px 0; }

    /* リンク */
    #markdown-content a { color: var(--primary-color); text-decoration: none; }

    /* 注意書きボックス */
    .note-box {
        border-left: 4px solid var(--warning-color);
        padding: 12px 15px;
        margin: 15px 0;
        background: #fff8f3;
        border-radius: 0 6px 6px 0;
        page-break-inside: avoid;
    }
    .note-box.info { border-left-color: var(--primary-color); background: #f3f9ff; }
    .note-box.success { border-left-color: var(--success-color); background: #f3fff3; }
    .note-box.danger { border-left-color: var(--danger-color); background: #fff3f3; }
    .note-box-title { font-weight: 600; margin-bottom: 5px; font-size: 9pt; }

    /* サマリーカード */
    .summary-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .summary-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 15px 18px;
        page-break-inside: avoid;
    }
    .summary-card.points { border-color: var(--success-color); background: linear-gradient(135deg, #f3fff3, #e8f5e9); }
    .summary-card.cautions { border-color: var(--danger-color); background: linear-gradient(135deg, #fff3f3, #ffebee); }
    .summary-card-title {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 9pt;
        font-weight: 600;
        margin-bottom: 10px;
    }
    .summary-card.points .summary-card-title { background: var(--success-color); color: white; }
    .summary-card.cautions .summary-card-title { background: var(--danger-color); color: white; }
    .summary-card ul { margin: 0; padding-left: 20px; }
    .summary-card li { margin: 6px 0; font-size: 9pt; }
    .summary-card.points li::marker { color: var(--success-color); }
    .summary-card.cautions li::marker { color: var(--danger-color); }

    /* ステップカード */
    .step-card {
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 15px 18px;
        margin: 12px 0;
        page-break-inside: avoid;
    }
    .step-card h4 { color: var(--primary-color); margin-top: 0; margin-bottom: 8px; }

    /* バッジ */
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 8pt; font-weight: 600; margin-right: 5px; }
    .badge-info { background: #e5f1fb; color: var(--primary-color); }
    .badge-success { background: #dff6dd; color: var(--success-color); }
    .badge-warning { background: #fff4ce; color: var(--warning-color); }
    .badge-danger { background: #fde7e9; color: var(--danger-color); }

    /* フッター */
    .footer {
        text-align: center;
        padding: 20px;
        color: var(--text-muted);
        font-size: 8pt;
        border-top: 1px solid var(--border-color);
        margin-top: 30px;
    }

    /* 改ページ用クラス */
    .page-break { page-break-before: always; break-before: always; height: 0; margin: 0; padding: 0; }
`;

// ============================================
// ユーティリティ関数
// ============================================

/**
 * ファイルの存在確認
 * @param {string} filePath - チェックするファイルパス
 * @returns {boolean} ファイルが存在するか
 */
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

/**
 * ファイル読み込み（エラーハンドリング付き）
 * @param {string} filePath - 読み込むファイルパス
 * @returns {{success: boolean, content: string|null, error: string|null}}
 */
function readFileContent(filePath) {
    // 入力バリデーション
    if (!filePath || typeof filePath !== 'string') {
        return { success: false, content: null, error: 'ファイルパスが無効です' };
    }

    if (!fileExists(filePath)) {
        return { success: false, content: null, error: `ファイルが見つかりません: ${filePath}` };
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // 空ファイルチェック
        if (!content || content.trim().length === 0) {
            return { success: false, content: null, error: 'ファイルが空です' };
        }

        return { success: true, content, error: null };
    } catch (error) {
        return { success: false, content: null, error: `ファイル読み込みエラー: ${error.message}` };
    }
}

/**
 * Markdownからタイトルとサブタイトルを抽出
 * @param {string} markdown - Markdownコンテンツ
 * @returns {{title: string, subtitle: string}}
 */
function extractTitleFromMarkdown(markdown) {
    // デフォルト値
    const result = { title: 'Document', subtitle: '' };

    // null/undefinedチェック
    if (!markdown || typeof markdown !== 'string') {
        return result;
    }

    // H1タイトルを検索
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (!titleMatch || !titleMatch[1]) {
        return result;
    }

    const fullTitle = titleMatch[1].trim();

    // 「——」で分割（タイトルとサブタイトル）
    const parts = fullTitle.split(/\s*——\s*/);

    // タイトルから【】を除去
    result.title = parts[0].replace(/【.*?】/g, '').trim() || 'Document';

    // サブタイトルがあれば設定
    if (parts[1]) {
        result.subtitle = parts[1].trim();
    }

    return result;
}

// ============================================
// HTML変換関数
// ============================================

/**
 * h2/h3見出しをセクションタグでラップ
 * @param {string} html - 変換対象のHTML
 * @returns {string} ラップ済みHTML
 */
function wrapSectionsWithHeadings(html) {
    // 入力バリデーション
    if (!html || typeof html !== 'string') {
        return html || '';
    }

    try {
        // h2セクションを処理
        html = html.replace(
            /(<h2[^>]*>[\s\S]*?)(?=<h2[^>]*>|<h1[^>]*>|$)/gi,
            '<section class="h2-section">$1</section>'
        );

        // h3セクションを処理
        html = html.replace(
            /(<h3[^>]*>[\s\S]*?)(?=<h3[^>]*>|<h2[^>]*>|<h1[^>]*>|<\/section>|$)/gi,
            '<div class="h3-section">$1</div>'
        );

        return html;
    } catch (error) {
        console.warn('セクションラッピング中にエラー:', error.message);
        return html;
    }
}

/**
 * HTMLを拡張（カード、バッジ、改ページマーカーなどを変換）
 * @param {string} html - 変換対象のHTML
 * @returns {string} 拡張済みHTML
 */
function enhanceHTML(html) {
    // 入力バリデーション
    if (!html || typeof html !== 'string') {
        return html || '';
    }

    try {
        // ポイント・注意点カードの変換
        html = html.replace(
            /<p><strong>ポイント<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>\s*<p><strong>注意点<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>/gi,
            `<div class="summary-cards">
  <div class="summary-card points">
    <div class="summary-card-title">ポイント</div>
    <ul>$1</ul>
  </div>
  <div class="summary-card cautions">
    <div class="summary-card-title">注意点</div>
    <ul>$2</ul>
  </div>
</div>`
        );

        // 注意書きボックスの変換（危険系）
        html = html.replace(
            /<p><strong>(注意|警告|重要)<\/strong>[:：]\s*([^<]+)<\/p>/gi,
            '<div class="note-box danger"><div class="note-box-title">$1</div><p>$2</p></div>'
        );

        // 注意書きボックスの変換（情報系）
        html = html.replace(
            /<p><strong>(ポイント|ヒント|Tips)<\/strong>[:：]\s*([^<]+)<\/p>/gi,
            '<div class="note-box info"><div class="note-box-title">$1</div><p>$2</p></div>'
        );

        // 注意書きボックスの変換（成功系）
        html = html.replace(
            /<p><strong>(完了|成功)<\/strong>[:：]\s*([^<]+)<\/p>/gi,
            '<div class="note-box success"><div class="note-box-title">$1</div><p>$2</p></div>'
        );

        // ※で始まる注釈をボックス化
        html = html.replace(
            /<p>※(.+?)<\/p>/g,
            '<div class="note-box info"><p>※$1</p></div>'
        );

        // ステップの変換
        html = html.replace(
            /<h3>Step\s*(\d+)[:：]\s*(.+?)<\/h3>/gi,
            '<div class="step-card"><h4><span class="badge badge-info">Step $1</span> $2</h4></div>'
        );

        // バッジの変換
        const badgeReplacements = [
            { pattern: /\[必須\]/g, replacement: '<span class="badge badge-danger">必須</span>' },
            { pattern: /\[推奨\]/g, replacement: '<span class="badge badge-success">推奨</span>' },
            { pattern: /\[任意\]/g, replacement: '<span class="badge badge-info">任意</span>' },
            { pattern: /\[対応予定\]/g, replacement: '<span class="badge badge-warning">対応予定</span>' },
        ];

        for (const { pattern, replacement } of badgeReplacements) {
            html = html.replace(pattern, replacement);
        }

        // 改ページマーカーの変換
        html = html.replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break"></div>');

        // セクションラッピングを適用
        html = wrapSectionsWithHeadings(html);

        return html;
    } catch (error) {
        console.warn('HTML拡張中にエラー:', error.message);
        return html;
    }
}

/**
 * 完全なHTMLドキュメントを構築
 * @param {string} contentHtml - メインコンテンツのHTML
 * @param {string} title - ドキュメントタイトル
 * @param {string} subtitle - サブタイトル
 * @param {string} docDate - ドキュメント日付
 * @returns {string} 完全なHTMLドキュメント
 */
function buildFullHTML(contentHtml, title, subtitle, docDate) {
    // 入力のサニタイズ（XSS対策）
    const safeTitle = escapeHtml(title || 'Document');
    const safeSubtitle = escapeHtml(subtitle || '');
    const safeDocDate = escapeHtml(docDate || '');

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${safeTitle}</h1>
      <p>${safeSubtitle}</p>
      <span class="meta">リサーチプレビュー公開：${safeDocDate}</span>
    </header>
    <main id="markdown-content">
      ${contentHtml}
    </main>
    <footer class="footer">
      <p>${safeTitle} | ${currentYear}年${currentMonth}月作成</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * HTMLエスケープ（XSS対策）
 * @param {string} text - エスケープするテキスト
 * @returns {string} エスケープ済みテキスト
 */
function escapeHtml(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

// ============================================
// PDF生成関数
// ============================================

/**
 * PDFを生成
 * @param {string} html - PDFに変換するHTML
 * @param {string} outputPath - 出力先ファイルパス
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function generatePDF(html, outputPath) {
    let browser = null;

    try {
        // 入力バリデーション
        if (!html || typeof html !== 'string') {
            return { success: false, error: 'HTMLが無効です' };
        }

        if (!outputPath || typeof outputPath !== 'string') {
            return { success: false, error: '出力パスが無効です' };
        }

        console.log('ブラウザを起動中...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']  // 安定性向上
        });

        const page = await browser.newPage();

        // タイムアウト設定
        page.setDefaultTimeout(CONFIG.timeout);

        console.log('HTMLをレンダリング中...');
        await page.setContent(html, { waitUntil: 'networkidle0' });

        console.log(`PDF生成中: ${path.basename(outputPath)}...`);
        await page.pdf({
            path: outputPath,
            format: CONFIG.pageFormat,
            printBackground: true,
            margin: {
                top: CONFIG.margin,
                bottom: CONFIG.margin,
                left: CONFIG.margin,
                right: CONFIG.margin
            }
        });

        return { success: true, error: null };

    } catch (error) {
        return { success: false, error: `PDF生成エラー: ${error.message}` };

    } finally {
        // ブラウザのクリーンアップ（エラーが発生しても必ず実行）
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.warn('ブラウザ終了時にエラー:', closeError.message);
            }
        }
    }
}

// ============================================
// メイン処理
// ============================================

async function main() {
    console.log('='.repeat(50));
    console.log('PDF生成開始');
    console.log('='.repeat(50));

    const startTime = Date.now();

    try {
        // 1. Markdownファイル読み込み
        console.log('\n[1/4] Markdownファイルを読み込み中...');
        const inputPath = path.join(__dirname, CONFIG.inputFile);
        const readResult = readFileContent(inputPath);

        if (!readResult.success) {
            throw new Error(readResult.error);
        }

        const markdown = readResult.content;
        console.log(`  -> ${markdown.length.toLocaleString()} 文字を読み込みました`);

        // 2. タイトル抽出
        console.log('\n[2/4] タイトルを抽出中...');
        const { title, subtitle } = extractTitleFromMarkdown(markdown);
        console.log(`  -> タイトル: ${title}`);
        if (subtitle) {
            console.log(`  -> サブタイトル: ${subtitle}`);
        }

        // 3. Markdown→HTML変換
        console.log('\n[3/4] HTMLに変換中...');
        marked.setOptions({ breaks: true, gfm: true });

        let contentHtml = marked(markdown);
        if (!contentHtml) {
            throw new Error('Markdown変換に失敗しました');
        }

        contentHtml = enhanceHTML(contentHtml);
        const fullHtml = buildFullHTML(contentHtml, title, subtitle, CONFIG.docDate);
        console.log(`  -> ${fullHtml.length.toLocaleString()} 文字のHTMLを生成しました`);

        // 4. PDF生成
        console.log('\n[4/4] PDFを生成中...');
        const outputPath = path.join(__dirname, CONFIG.outputFile);
        const pdfResult = await generatePDF(fullHtml, outputPath);

        if (!pdfResult.success) {
            throw new Error(pdfResult.error);
        }

        // 完了
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n' + '='.repeat(50));
        console.log(`完了! (${elapsed}秒)`);
        console.log(`出力: ${CONFIG.outputFile}`);
        console.log('='.repeat(50));

        return { success: true };

    } catch (error) {
        console.error('\n' + '='.repeat(50));
        console.error('エラーが発生しました:');
        console.error(`  ${error.message}`);
        console.error('='.repeat(50));

        process.exit(1);
    }
}

// エントリーポイント
main().catch(error => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
