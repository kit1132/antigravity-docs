# Claude Desktop Cowork プロジェクト

このフォルダは、Markdown→HTML→PDF の変換ワークフローを管理するプロジェクトです。

## フォルダ構成

```
Claude Desktop_Cowork/
├── CLAUDE.md                      # このファイル（ルール定義）
├── Claude Desktop「Cowork」.md    # コンテンツ（編集対象）
├── Claude Desktop「Cowork」.html  # ブラウザ確認用（動的表示）
├── Claude Desktop「Cowork」.pdf   # 生成物
├── generate_pdf.js                # PDF生成スクリプト
├── package.json                   # 依存パッケージ定義
└── node_modules/                  # インストール済みパッケージ
```

---

## 環境要件

| 項目 | 要件 |
|------|------|
| Node.js | v18以上推奨 |
| npm | 付属バージョン |

### 依存パッケージ

| パッケージ | 用途 |
|------------|------|
| marked | Markdown→HTML変換 |
| puppeteer | ヘッドレスブラウザ（PDF生成） |

```json
{
  "dependencies": {
    "marked": "^17.0.1",
    "puppeteer": "^24.35.0"
  }
}
```

---

## 初回セットアップ

```bash
# 1. このフォルダに移動
cd "Claude Desktop_Cowork"

# 2. 依存パッケージをインストール
npm install
```

---

## PDF生成コマンド

```bash
node generate_pdf.js
```

---

## 改ページの制御

### Markdownでの改ページ指定

セクションの前で改ページしたい場合、Markdownに以下のマーカーを挿入する：

```markdown
---

<!-- pagebreak -->

## セクション名
```

**重要**: `<!-- pagebreak -->` は `---`（水平線）の後、見出しの前に配置する。

### 改ページが必要なケース

- 表がページをまたいで分裂する場合
- 見出しだけが前ページに残り、内容が次ページに流れる場合
- セクション単位でページを分けたい場合

### CSS実装

```css
/* 改ページ用クラス */
.page-break {
    page-break-before: always;
    break-before: always;
    height: 0;
    margin: 0;
    padding: 0;
}
```

### JavaScript実装（enhanceHTML関数内）

```javascript
// 改ページマーカー（Markdown内の <!-- pagebreak --> を変換）
html = html.replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break"></div>');
```

---

## テーブル・見出しの分裂防止

### テーブルの分裂防止

```css
table {
    page-break-inside: avoid;
    break-inside: avoid;
}

tr {
    page-break-inside: avoid;
    break-inside: avoid;
}
```

### 見出しと後続コンテンツの分離防止

```css
h2, h3, h4 {
    page-break-after: avoid;
    break-after: avoid;
}

/* 見出し直後の要素との分離を防ぐ */
h2 + p + table,
h3 + p + table,
p + table {
    page-break-before: avoid;
    break-before: avoid;
}
```

### 印刷用メディアクエリ（強制指定）

```css
@media print {
    table, tr, thead, tbody {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }

    h2, h3, h4 {
        page-break-after: avoid !important;
        break-after: avoid !important;
    }

    table {
        page-break-before: avoid !important;
    }
}
```

---

## 同期ルール

**重要**: スタイルや変換処理を変更する際は、以下の2ファイルを両方更新すること。

| ファイル | 役割 | 同期が必要な箇所 |
|----------|------|------------------|
| `.html` | ブラウザでの動的表示 | `<style>`タグ内CSS、`enhanceHTML`関数 |
| `generate_pdf.js` | PDF生成 | `STYLES`定数、`enhanceHTML`関数 |

---

## レビュー観点

PDF生成後、以下の観点でレビューを実施する：

1. **ページ区切りの確認**: 表やセクションが途中で分裂していないか
2. **誤字脱字**: 特に助詞の脱落（「ついて」→正しくは「について」など）
3. **専門用語**: 初出時に説明があるか（非エンジニア向けの場合）
4. **情報の重複**: 同じ内容が過度に繰り返されていないか
5. **文体の一貫性**: です・ます調で統一されているか

---

## 処理フロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  .md ファイル │ ──▶ │  marked.js  │ ──▶ │  HTML生成   │ ──▶ │  Puppeteer  │
│ （Markdown） │     │（MD→HTML）  │     │（スタイル付）│     │（PDF出力）  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 親ディレクトリのルール

HTMLドキュメントのスタイル（カラーパレット、余白設定など）は、親ディレクトリの共通ルールに従う：

- **スタイルガイド**: [/antigravity/CLAUDE.md](../CLAUDE.md)
