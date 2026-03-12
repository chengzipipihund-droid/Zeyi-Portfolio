# Zeyi Cheng — Portfolio

洞洞板（Pegboard）风格的个人作品集网站。

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 项目结构

```
zeyi-portfolio/
├── public/
│   ├── images/
│   │   └── projects/        ← 项目图片放这里
│   ├── svg/                 ← 你设计的 SVG 放这里
│   └── icons/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx       ← 根布局（metadata、字体）
│   │   ├── globals.css      ← 全局样式 + Tailwind
│   │   ├── page.tsx         ← 首页（洞洞板）
│   │   ├── info/
│   │   │   └── page.tsx     ← INFO 页面
│   │   ├── experience/
│   │   │   └── page.tsx     ← EXP 页面
│   │   └── projects/
│   │       └── [slug]/
│   │           └── page.tsx ← 项目详情页（动态路由）
│   │
│   ├── components/
│   │   ├── Header.tsx       ← 顶部：logo + 名字 + 导航
│   │   ├── Pegboard.tsx     ← 洞洞板主体容器
│   │   ├── ProjectCard.tsx  ← 项目卡片（可复用）
│   │   ├── BioCard.tsx      ← 自述卡片
│   │   ├── EduBadge.tsx     ← 教育徽章 (TJU / A!)
│   │   ├── ShelfBracket.tsx ← 架子支架装饰
│   │   ├── Hole.tsx         ← 洞洞板孔洞
│   │   ├── Peg.tsx          ← 挂钩 / 彩色钉子
│   │   └── index.ts         ← 统一导出
│   │
│   └── data/
│       ├── projects.ts      ← 项目数据（增删改项目只需编辑这里）
│       └── site.ts          ← 网站配置（名字、导航、Bio、教育）
│
├── tailwind.config.ts       ← Tailwind 主题（颜色、阴影、字体）
├── package.json
├── tsconfig.json
└── next.config.js
```

## 如何使用

### 添加/修改项目
编辑 `src/data/projects.ts`，添加新的 project 对象即可。
首页布局通过 `col` 和 `row` 字段控制在洞洞板上的位置。

### 引入你的 SVG
1. 把 SVG 文件放到 `public/svg/` 目录
2. 在页面中直接引用: `<img src="/svg/your-file.svg" alt="..." />`
3. 或者在项目详情页的内容区域中使用

### 自定义颜色和主题
编辑 `tailwind.config.ts` 中的 `colors.board` 对象。

### 部署
```bash
npm run build    # 构建
npm run start    # 本地预览生产版本
```

推荐部署到 Vercel:
```bash
npx vercel
```

## 技术栈
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Server Components + Client Components
