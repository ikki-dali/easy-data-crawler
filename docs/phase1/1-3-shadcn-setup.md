# 1-3: shadcn/ui セットアップ

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 1-3 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 1-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

shadcn/ui をセットアップし、プロジェクトのカラースキームを設定する。

## タスク

- [ ] shadcn/ui 初期化
- [ ] カラースキーム設定（ピンク系）
- [ ] フォント設定（Noto Sans JP, Inter）
- [ ] globals.css 調整
- [ ] ダークモード対応準備

## 実装詳細

### 初期化コマンド

```bash
npx shadcn@latest init
```

設定選択:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### tailwind.config.ts 追加設定

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF4D8E",
          foreground: "#FFFFFF",
          50: "#FFF0F5",
          100: "#FFE1EB",
          200: "#FFC3D7",
          300: "#FFA5C3",
          400: "#FF79A7",
          500: "#FF4D8E",
          600: "#E6457F",
          700: "#CC3D71",
          800: "#B33562",
          900: "#992D54",
        },
        accent: {
          DEFAULT: "#14B8A6",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans JP", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### globals.css

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 13%;
    --primary: 340 100% 65%;
    --primary-foreground: 0 0% 100%;
    --accent: 174 72% 40%;
    --accent-foreground: 0 0% 100%;
    /* ... その他の変数 */
  }
}
```

## 完了条件

- [ ] shadcn/ui がインストールされている
- [ ] カラースキームが反映されている（ピンク #FF4D8E）
- [ ] フォントが適用されている
- [ ] `components.json` が作成されている

## 参考リソース

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)

