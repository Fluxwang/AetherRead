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
复制 `.env.example` 为 `.env` 并填入你的OpenAI API密钥（可选配置 `OPENAI_BASE_URL`）

### 3. 初始化数据库
```bash
npx prisma migrate dev
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 即可使用。

## 🛠 技术栈

- Next.js 16 (App Router)
- TypeScript
- Prisma + SQLite
- OpenAI API
- Jina Reader API
- Tailwind CSS 4

---

**享受阅读！** 📚✨
