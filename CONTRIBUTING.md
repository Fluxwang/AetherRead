# 开发指南 (Contributing Guide)

感谢你对 Aether Read 项目的关注！本文档将帮助你快速上手开发。

## 🚀 快速开始

### 环境要求

- Node.js 20.x 或更高版本
- npm 10.x 或更高版本
- Git

### 本地开发设置

1. **克隆项目**
```bash
git clone <repository-url>
cd aether-read
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 OpenAI API Key
```

4. **初始化数据库**
```bash
npx prisma migrate dev
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📝 代码规范

### TypeScript 规范

- **启用严格模式**：项目使用 TypeScript strict mode
- **显式类型**：为函数参数和返回值添加类型注解
- **避免 any**：使用 `unknown` 或具体类型替代
- **类型导入**：使用 `type` 关键字导入类型

```typescript
// ✅ 好的
import type { Article } from '@/types';
export function processArticle(article: Article): Promise<void> {
  // ...
}

// ❌ 不好的
import { Article } from '@/types';
export function processArticle(article: any) {
  // ...
}
```

### 命名规范

- **组件名**：PascalCase - `ArticleHeader`, `ThemeToggle`
- **文件名**：
  - 组件：PascalCase - `ArticleHeader.tsx`
  - 工具函数：kebab-case - `api-error-handler.ts`
  - 页面：lowercase - `page.tsx`, `layout.tsx`
- **函数名**：camelCase - `fetchArticle`, `handleSubmit`
- **常量名**：UPPER_SNAKE_CASE - `OWNER_TAGS`, `API_BASE_URL`
- **类型名**：PascalCase - `Article`, `OwnerTag`

### 代码风格

- **缩进**：2 空格
- **引号**：优先使用双引号（由 ESLint 配置）
- **分号**：必须使用分号
- **导入顺序**：
  1. React / Next.js
  2. 第三方库
  3. 本地模块（@/ 别名）
  4. 类型导入

```typescript
// ✅ 好的导入顺序
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { prisma } from '@/lib/prisma';
import type { Article } from '@/types';
```

## 🏗️ 项目结构约定

### 组件组织

- **展示组件**：放在 `app/components/`
- **页面特定组件**：放在对应页面目录下
- **每个组件一个文件**：不要在一个文件中定义多个导出组件

### API 路由约定

- **RESTful 设计**：遵循 REST 规范
- **错误处理**：使用 `lib/api-error-handler.ts` 中的工具
- **文档注释**：在文件顶部添加 API 端点说明

```typescript
/**
 * GET /api/articles/[id] - 获取单个文章
 * Response: { article: Article }
 */
export async function GET(/* ... */) {
  // ...
}
```

### 类型定义约定

- **集中管理**：所有共享类型放在 `types/index.ts`
- **不要重复**：同一类型只定义一次
- **导出类型**：使用 `export type` 或 `export interface`

## 🧪 测试

目前项目还没有自动化测试套件。在添加或修改功能时：

1. **手动测试**：
   - 运行开发服务器
   - 测试所有主要功能流程
   - 测试边界情况

2. **Lint 检查**：
```bash
npm run lint
```

3. **类型检查**：
```bash
npm run build
```

## 🔧 常用开发命令

```bash
# 开发服务器（带热重载）
npm run dev

# 生产构建
npm run build

# 运行生产构建
npm run start

# ESLint 检查
npm run lint

# 数据库相关
npx prisma studio          # 打开数据库 GUI
npx prisma migrate dev     # 创建并应用迁移
npx prisma generate        # 重新生成 Prisma Client
npx prisma migrate reset   # 重置数据库（警告：删除所有数据）
```

## 📦 添加新依赖

在添加新的 npm 包之前，请考虑：

1. **是否真的需要**：能否用现有工具实现？
2. **包的质量**：检查维护状态、下载量、安全问题
3. **包的大小**：避免添加过大的依赖

添加依赖后：
```bash
npm install <package-name>
# 更新 package-lock.json
git add package.json package-lock.json
```

## 🎨 样式开发

项目使用 Tailwind CSS 4，遵循以下约定：

- **使用 Tailwind 类**：优先使用 Tailwind 原子类
- **CSS 变量**：主题相关使用 CSS 变量（见 `globals.css`）
- **响应式设计**：移动优先，使用 Tailwind 响应式前缀

```tsx
// ✅ 好的
<div className="text-[color:var(--foreground)] hover:text-[color:var(--accent)]">
  内容
</div>

// ✅ 也可以
<div className="text-foreground hover:text-accent">
  内容
</div>
```

## 🐛 调试技巧

### 开发工具

- **React DevTools**：检查组件状态和 props
- **Prisma Studio**：查看和编辑数据库数据
- **浏览器 DevTools**：网络请求、控制台日志

### 常见问题

1. **数据库连接错误**
```bash
# 重新生成 Prisma Client
npx prisma generate
```

2. **类型错误**
```bash
# 确保所有类型都从正确位置导入
# 检查 types/index.ts
```

3. **环境变量未加载**
```bash
# 确保 .env 文件存在
# 重启开发服务器
```

## 📝 Git 工作流

### 分支策略

- `main` - 主分支，始终可部署
- `feature/*` - 新功能分支
- `fix/*` - Bug 修复分支

### 提交信息

使用清晰的提交信息（推荐 Conventional Commits）：

```bash
# 格式：<type>(<scope>): <subject>

feat(api): 添加文章搜索功能
fix(ui): 修复深色模式下按钮颜色
docs: 更新 README 安装说明
refactor(lib): 重构错误处理逻辑
style: 统一代码格式
```

类型说明：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `refactor`: 代码重构
- `style`: 代码格式（不影响功能）
- `test`: 测试相关
- `chore`: 构建/工具配置

### Pull Request

1. **创建分支**
```bash
git checkout -b feature/your-feature-name
```

2. **开发和提交**
```bash
git add .
git commit -m "feat: 添加新功能"
```

3. **推送和创建 PR**
```bash
git push origin feature/your-feature-name
```

4. **PR 描述应包含**：
   - 功能/修复说明
   - 测试步骤
   - 截图（UI 变更）
   - 相关 Issue（如有）

## 🔒 安全注意事项

- **不要提交敏感信息**：API Keys, 密码等
- **不要提交 .env 文件**：仅提交 .env.example
- **检查依赖安全**：定期运行 `npm audit`
- **输入验证**：始终验证用户输入
- **错误信息**：不要在错误中暴露敏感信息

## 📚 学习资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Prisma 文档](https://www.prisma.io/docs)
- [TypeScript 手册](https://www.typescriptlang.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 💬 需要帮助？

- 查看 [README.md](./README.md) 了解项目概览
- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解架构设计
- 查看现有代码寻找示例

---

再次感谢你的贡献！🎉
