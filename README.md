# Aether Read - 移动端阅读Web应用

一个专为移动端设计的英文文章阅读应用，支持文章爬取、AI总结和多模式翻译阅读。

## ✨ 功能特性

### 📝 文章添加

- 🔗 粘贴网页链接（自动爬取内容）
- 🐦 粘贴Twitter链接
- 📋 直接粘贴文章内容
- 📡 RSS订阅链接解析

### 🤖 AI智能处理

- **自动总结**：使用OpenAI GPT生成中文摘要
- **智能翻译**：段落级英译中翻译

### 📖 三种阅读模式

1. **全英文模式**：显示原文
2. **双语模式**：英文段落后紧跟中文翻译
3. **全中文模式**：仅显示翻译内容

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的OpenAI API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# OpenAI API配置 (必需)
OPENAI_API_KEY=你的_OpenAI_API_密钥

# OpenAI API Base URL (可选，用于代理或第三方兼容服务)
# OPENAI_BASE_URL=https://api.openai.com/v1
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用。

## 📁 项目结构

```
aether-read/
├── app/                      # Next.js App Router
│   ├── components/           # React组件
│   │   ├── ArticleHeader.tsx
│   │   ├── ArticleContent.tsx
│   │   ├── ArticleSummary.tsx
│   │   ├── ReadingModeToggle.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── Toast.tsx
│   ├── api/                  # API路由
│   │   └── articles/         # 文章相关API
│   │       ├── route.ts      # GET (列表) / POST (创建)
│   │       ├── [id]/         # 单个文章操作
│   │       │   ├── route.ts  # GET / PATCH / DELETE
│   │       │   └── read/     # 已读状态更新
│   │       ├── fetch/[id]/   # 抓取文章内容
│   │       ├── process/[id]/ # 处理文章（抓取+总结+翻译）
│   │       └── translate/[id]/stream/  # SSE流式翻译
│   ├── add/                  # 添加文章页面
│   ├── article/[id]/         # 文章详情页面
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 首页（文章列表）
│   └── globals.css           # 全局样式
├── lib/                      # 工具库和业务逻辑
│   ├── prisma.ts             # Prisma客户端单例
│   ├── constants.ts          # 应用常量
│   ├── utils.ts              # 通用工具函数
│   ├── api-error-handler.ts  # API错误处理
│   ├── jina-reader.ts        # Jina Reader API集成
│   ├── rss-parser.ts         # RSS解析
│   ├── openai-client.ts      # OpenAI客户端配置
│   ├── openai-summary.ts     # AI摘要生成
│   ├── openai-translate.ts   # AI翻译
│   └── article-fetch.ts      # 文章抓取流程编排
├── types/                    # TypeScript类型定义
│   └── index.ts
├── prisma/                   # 数据库
│   ├── schema.prisma         # 数据库模型
│   ├── migrations/           # 迁移文件
│   └── dev.db                # SQLite数据库（开发环境）
├── public/                   # 静态资源
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 🛠 技术栈

- **前端框架**: Next.js 16 (App Router)
- **语言**: TypeScript (严格模式)
- **样式**: Tailwind CSS 4
- **数据库**: Prisma + SQLite
- **AI服务**: OpenAI API (GPT-4o-mini)
- **内容抓取**: Jina Reader API
- **RSS解析**: rss-parser

## 📚 API文档

### 文章管理

#### `GET /api/articles`
获取文章列表，支持按用户和已读状态筛选。

**查询参数:**
- `ownerTag`: 用户标签 (`Wang` | `LYY`)
- `read`: 已读筛选 (`all` | `read` | `unread`)

**响应:**
```json
{
  "articles": [
    {
      "id": "...",
      "title": "文章标题",
      "status": "ready",
      "ownerTag": "Wang",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      ...
    }
  ]
}
```

#### `POST /api/articles`
创建新文章。

**请求体:**
```json
{
  "url": "https://example.com/article",  // 或 content
  "sourceType": "crawler",  // 或 "manual", "rss"
  "ownerTag": "Wang"  // 或 "LYY"
}
```

#### `GET /api/articles/[id]`
获取单个文章详情。

#### `PATCH /api/articles/[id]`
更新文章信息（当前支持 ownerTag）。

#### `DELETE /api/articles/[id]`
删除文章。

#### `PATCH /api/articles/[id]/read`
更新文章已读状态。

**请求体:**
```json
{
  "isRead": true
}
```

### 文章处理

#### `POST /api/articles/fetch/[id]`
抓取并处理文章（获取内容 + 生成摘要）。

#### `POST /api/articles/process/[id]`
完整处理文章（抓取 + 摘要 + 全量翻译）。

#### `GET /api/articles/translate/[id]/stream`
流式翻译文章（SSE）。返回实时翻译进度和结果。

**响应事件:**
- `progress`: `{ completed: number, total: number }`
- `paragraph`: `{ index: number, en: string, zh: string }`
- `complete`: `{ translatedCount: number }`
- `error`: `{ message: string }`

## 🔧 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置 (Next.js + TypeScript)
- 使用 2 空格缩进
- 组件名: PascalCase
- 函数名: camelCase
- 常量名: UPPER_SNAKE_CASE

### 运行 Lint

```bash
npm run lint
```

### 构建生产版本

```bash
npm run build
npm run start
```

### 数据库操作

```bash
# 创建迁移
npx prisma migrate dev --name migration_name

# 查看数据库
npx prisma studio

# 重置数据库
npx prisma migrate reset
```

## 🌍 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `OPENAI_API_KEY` | ✅ | - | OpenAI API密钥 |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | OpenAI API基础URL |
| `JINA_REQUEST_TIMEOUT_MS` | ❌ | `15000` | Jina Reader请求超时(毫秒) |
| `JINA_MAX_RETRIES` | ❌ | `2` | Jina Reader最大重试次数 |
| `JINA_RETRY_BACKOFF_MS` | ❌ | `800` | Jina Reader重试退避时间(毫秒) |
| `HTTPS_PROXY` | ❌ | - | HTTPS代理URL |

## 📝 许可证

MIT

---

**享受阅读！** 📚✨

