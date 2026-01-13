# HS-WMS 仓库说明

本仓库包含一个简洁的仓储管理系统（HS-WMS），提供库存、客户、产品、入库与出库（发货）管理能力。项目由 FastAPI 后端与 React 前端组成，适合本地开发与演示。

## 目录结构

```
HS-WMS/
├─ inventory-system/   # 主项目目录（后端 + 前端）
│  ├─ backend/         # FastAPI + SQLModel API
│  ├─ frontend/        # React + Vite 前端
│  └─ README.md        # 详细项目说明
└─ start_app.bat        # Windows 一键启动脚本
```

## 快速开始

### 1) 启动后端（FastAPI）

```bash
cd inventory-system/backend
pip install -r requirements.txt
python main.py
```

- API 地址：`http://localhost:8000`
- Swagger 文档：`http://localhost:8000/docs`

### 2) 启动前端（React + Vite）

```bash
cd inventory-system/frontend
npm install
npm run dev
```

- Web 地址：`http://localhost:5173`

### 3) Windows 一键启动（可选）

在仓库根目录执行：

```bat
start_app.bat
```

## 功能概览

- **客户与产品管理**：新增/编辑/删除客户与产品，支持客户与产品关联。
- **库存管理**：入库、库存数量调整、目标/安全库存阈值设置与分组展示。
- **发货管理**：出库扣减库存，支持批量发货。
- **入库记录**：自动记录入库与手动调整的历史。

## 进一步阅读

- 详细的 API 与功能说明请参阅：`inventory-system/README.md`
- 如需调整前端 API 地址，可修改：`inventory-system/frontend/src/api.ts`

## 许可说明

如需开源/商用许可，请根据团队要求补充许可证文件。
