# Aether Read - 项目架构文档

## 📐 架构概览

Aether Read 是一个基于 Next.js 16 App Router 的现代 Web 应用，采用服务端渲染（SSR）和客户端交互相结合的架构。

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层 (UI)                         │
│  Next.js App Router + React 19 + Tailwind CSS           │
└─────────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────────┐
│                  API 路由层 (API Routes)                  │
│  /api/articles/* - RESTful API + SSE Stream             │
└─────────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────────┐
│                  业务逻辑层 (lib/)                        │
│  article-fetch, openai-*, jina-reader, rss-parser      │
└─────────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────────┐
│                  数据持久层 (Prisma)                      │
│  SQLite Database (dev.db)                               │
└─────────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────────┐
│                  外部服务 (External APIs)                 │
│  OpenAI API, Jina Reader API                            │
└─────────────────────────────────────────────────────────┘
```

## 📁 目录结构

```
aether-read/
├── app/                    # Next.js App Router 应用目录
│   ├── components/         # React 组件
│   │   ├── ErrorBoundary.tsx    # 错误边界
│   │   ├── ArticleHeader.tsx    # 文章头部
│   │   ├── ArticleContent.tsx   # 文章内容显示
│   │   ├── ArticleSummary.tsx   # 文章摘要
│   │   ├── ReadingModeToggle.tsx # 阅读模式切换
│   │   ├── ThemeToggle.tsx      # 主题切换
│   │   └── Toast.tsx            # 提示消息
│   ├── api/               # API 路由
│   │   └── articles/      # 文章相关 API
│   ├── add/               # 添加文章页面
│   ├── article/[id]/      # 文章详情页（动态路由）
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── loading.tsx        # 加载状态
│   └── globals.css        # 全局样式
├── lib/                   # 业务逻辑和工具库
│   ├── constants.ts           # 应用常量
│   ├── utils.ts              # 通用工具函数
│   ├── api-error-handler.ts  # API 错误处理
│   ├── prisma.ts             # Prisma 客户端单例
│   ├── article-fetch.ts      # 文章抓取流程编排
│   ├── jina-reader.ts        # Jina Reader API 集成
│   ├── rss-parser.ts         # RSS 订阅解析
│   ├── openai-client.ts      # OpenAI 客户端配置
│   ├── openai-summary.ts     # AI 摘要生成
│   └── openai-translate.ts   # AI 翻译
├── types/                 # TypeScript 类型定义
│   └── index.ts           # 全局类型
├── prisma/                # 数据库相关
│   ├── schema.prisma      # 数据模型定义
│   ├── migrations/        # 数据库迁移
│   └── dev.db             # SQLite 数据库文件
└── public/                # 静态资源
```

## 🔄 数据流

### 1. 文章添加流程

```
用户输入 URL/内容
    ↓
POST /api/articles (创建文章记录 status=pending)
    ↓
POST /api/articles/process/[id] (后台处理)
    ├→ fetchArticleContent (Jina Reader 抓取内容)
    ├→ generateSummary (GPT 生成摘要)
    └→ translateContent (GPT 翻译全文)
    ↓
更新文章状态 status=ready
```

### 2. 实时翻译流程（SSE）

```
用户点击翻译按钮
    ↓
GET /api/articles/translate/[id]/stream (SSE连接)
    ↓
splitParagraphs (分段)
    ↓
for each paragraph:
    ├→ translateParagraph (GPT 翻译)
    └→ SSE: paragraph event (实时推送)
    ↓
SSE: complete event (完成)
```

### 3. 文章阅读流程

```
用户访问 /article/[id]
    ↓
GET /api/articles/[id] (获取文章数据)
    ↓
渲染文章内容
    ├→ 原文模式：显示 originalContent
    ├→ 双语模式：显示 en + zh 段落
    └→ 中文模式：仅显示 zh 段落
    ↓
自动标记为已读
    └→ PATCH /api/articles/[id]/read
```

## 🎯 核心设计决策

### 1. 为什么选择 Next.js App Router？

- **服务端渲染（SSR）**：首屏加载快，SEO 友好
- **API Routes**：前后端一体化，简化架构
- **React Server Components**：减少客户端 JS 包大小
- **文件系统路由**：约定优于配置，开发效率高

### 2. 为什么选择 SQLite？

- **简单部署**：单文件数据库，无需额外服务
- **开发友好**：本地开发零配置
- **性能足够**：对于单用户/小规模应用性能优秀
- **易于迁移**：后期可轻松迁移到 PostgreSQL/MySQL

### 3. 为什么使用 Prisma？

- **类型安全**：自动生成 TypeScript 类型
- **迁移管理**：版本化的数据库变更
- **开发体验**：直观的 ORM API
- **跨数据库**：轻松切换数据库引擎

### 4. 为什么采用流式翻译（SSE）？

- **实时反馈**：用户可以立即看到翻译进度
- **避免超时**：长文章翻译不会触发超时
- **渐进式渲染**：边翻译边显示，提升体验
- **取消支持**：用户可以随时停止翻译

## 🔐 安全考虑

1. **API Key 保护**：
   - 所有 OpenAI API 调用在服务端进行
   - 环境变量不暴露给客户端

2. **输入验证**：
   - 用户标签（OwnerTag）严格校验
   - URL 参数类型检查

3. **错误处理**：
   - 统一的错误处理机制
   - 不泄露敏感信息的错误消息

4. **数据库安全**：
   - Prisma ORM 防止 SQL 注入
   - 使用参数化查询

## 📈 性能优化

1. **代码分离**：
   - Next.js 自动按路由分离代码
   - 大型依赖（react-markdown）动态加载

2. **缓存策略**：
   - Prisma Client 单例模式避免重复连接
   - HTTP 缓存头优化静态资源

3. **渲染优化**：
   - React Server Components 减少客户端 JS
   - Suspense 和 loading.tsx 改善加载体验

4. **数据库优化**：
   - 适当的索引（id, ownerTag, isRead）
   - 仅查询需要的字段（select）

## 🚀 扩展性

### 水平扩展

当前架构支持以下扩展：

1. **数据库迁移**：Prisma 支持迁移到 PostgreSQL
2. **文件存储**：可集成 S3/OSS 存储文章内容
3. **缓存层**：可添加 Redis 缓存热门文章
4. **消息队列**：可使用 Bull/BullMQ 处理文章任务

### 功能扩展

易于添加的功能：

1. **用户认证**：集成 NextAuth.js
2. **协作功能**：添加评论、分享
3. **全文搜索**：集成 Elasticsearch
4. **推荐系统**：基于阅读历史推荐

## 📚 技术栈版本

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.1 | 应用框架 |
| React | 19.2.4 | UI 库 |
| TypeScript | 5.x | 类型系统 |
| Prisma | 6.19.2 | ORM |
| Tailwind CSS | 4.x | 样式框架 |
| OpenAI | latest | AI 服务 |

## 🔗 相关文档

- [README.md](./README.md) - 项目介绍和快速开始
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 开发指南
- [prisma/schema.prisma](./prisma/schema.prisma) - 数据模型
