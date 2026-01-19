# 库存系统 Agent 开发指南

本文档旨在为在此存储库中工作的 AI Agent 提供指导。

## 项目概览
- **后端**: FastAPI + SQLModel (SQLite)。位于 `backend/` 目录。
- **前端**: React + TypeScript + Vite + Bootstrap。位于 `frontend/` 目录。

## 1. 构建、Lint 与测试命令

### 后端 (`backend/`)
*工作目录: `backend/`*

- **安装依赖**: 
  ```bash
  pip install -r requirements.txt
  ```
- **运行服务器**: 
  ```bash
  python main.py
  # 或者
  uvicorn main:app --reload
  ```
  *注意：服务器默认运行在 http://localhost:8000*
- **Lint (代码检查)**: 当前未配置严格的 Linter。请遵循 PEP 8 标准。
- **测试**: 当前未配置测试套件。
  - *Agent 操作*: 如果编写测试，请使用标准的 `pytest` 约定。
  - *验证*: 在没有测试的情况下，请确保 `python main.py` 能成功启动，并对照 API 文档 (`/docs`) 进行手动验证。

### 前端 (`frontend/`)
*工作目录: `frontend/`*

- **安装依赖**: 
  ```bash
  npm install
  ```
- **运行开发服务器**: 
  ```bash
  npm run dev
  ```
  *注意：Web 应用默认运行在 http://localhost:5173*
- **类型检查与构建**: 
  ```bash
  npm run build
  ```
  *注意：必须运行此命令以确保 TypeScript 类型合规。*
- **Lint (代码检查)**: 
  ```bash
  npm run lint
  ```

## 2. 代码风格与规范

### 通用规则
- **路径**: 在引用文件时，始终使用基于项目根目录的**绝对路径**。
- **一致性**: 编辑特定文件时，请模仿现有的代码风格（缩进、空格、命名）。

### 后端 (Python/FastAPI)
- **结构**: 目前为单体结构 (`backend/main.py`)。
  - 如果添加新实体，请将相关逻辑（模型、CRUD、路由）保持在一起。
- **类型提示 (Type Hinting)**: **强制要求**。
  - 使用 `typing.List`, `typing.Optional` 以及 Pydantic/SQLModel 类。
  - 返回类型必须显式声明（例如：`response_model=List[Product]`）。
- **数据库 (SQLModel)**:
  - 所有数据库操作都使用 `with Session(engine) as session:` 上下文管理器。
  - 提交 (commit) 后使用 `session.refresh(obj)` 以获取生成的 ID 或默认值。
  - 在处理关系时，使用 `selectinload` 避免异步/同步上下文中的延迟加载问题。
- **命名**:
  - 变量/函数: `snake_case` (蛇形命名)
  - 类: `PascalCase` (帕斯卡命名)
- **错误处理**:
  - API 错误使用 `fastapi.HTTPException`。
  - 在 DB 提交前验证输入（如唯一性约束），以提供清晰的 400 错误。

### 前端 (React/TypeScript)
- **组件结构**:
  - 使用函数式组件，并为 Props 定义严格的 TypeScript 接口。
  - 使用 `export default function ComponentName(...)` 模式。
- **样式**:
  - 优先使用 `react-bootstrap` 组件（如 `<Button>`, `<Table>`）。
  - 仅在必要时引入 CSS；优先使用 Bootstrap 的工具类。
- **命名**:
  - 文件名: `PascalCase.tsx`
  - 组件名: `PascalCase`
  - 函数/变量: `camelCase`
- **异步/Await**:
  - API 调用使用 `async/await`。
  - 必须处理错误（try/catch），并向用户展示友好的消息（如 `alert` 或 toast）。

## 3. Agent 开发工作流
1. **探索 (Discovery)**:
   - 编辑前，先阅读 `backend/main.py` 以理解数据模型。
   - 阅读 `frontend/src/types.ts`（如有）或根据 API 调用推断类型。
2. **实现 (Implementation)**:
   - 如果向模型添加字段，切记更新：
     1. SQLModel 类 (`table=True`)。
     2. Read/Create/Update DTO Schema。
     3. 前端接口定义。
   - *数据库迁移*: 项目包含 `alembic`。如果修改 DB Schema：
     - 检查 `backend/alembic/`。
     - 如果可能，运行 `alembic revision --autogenerate -m "message"` 和 `alembic upgrade head`，或提示用户。
3. **验证 (Verification)**:
   - **前端**: 运行 `npm run build` 以捕获 TypeScript 错误。
   - **后端**: 启动服务器以确保没有运行时崩溃。
