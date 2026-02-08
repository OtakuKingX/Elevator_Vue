# 🏢 電梯管理模擬系統

一個使用 Vue 3 + TypeScript 打造的雙電梯調度模擬器，透過視覺化介面即時觀察電梯運行策略與乘客搭乘流程。

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-42b883?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3-ffd859?logo=pinia&logoColor=black)

## 功能特色

- **雙電梯並行運作** — 同時模擬 2 部獨立電梯的運行與調度
- **智慧調度演算法** — 綜合考量距離、方向、負載與等待時間的最佳化派遣策略
- **即時視覺化** — 以大樓剖面圖呈現電梯位置、乘客等候與搭乘狀態
- **速度控制** — 支援 1x / 2x / 4x / 10x 四段模擬速度切換
- **運作日誌** — 即時記錄每位乘客的產生、上車、下車等事件
- **進度追蹤** — 進度條與統計數據即時顯示模擬進度

## 模擬規則

| 參數         | 數值      |
| ------------ | --------- |
| 樓層數       | 10 層     |
| 電梯數       | 2 部      |
| 電梯容量     | 5 人      |
| 模擬人數     | 40 人     |
| 乘客產生速率 | 每秒 1 人 |

- 每秒隨機產生 1 位乘客，起點與目的地樓層皆隨機
- 電梯每 tick 移動 1 層樓
- 到達目標樓層後，先放人再接人
- 全部 40 位乘客送達目的地後，模擬自動結束

## 調度策略

系統採用**成本函數（Cost Function）** 為每位等候乘客選擇最佳電梯：

1. **距離成本** — 電梯與乘客之間的樓層差距
2. **方向懲罰** — 電梯正在遠離乘客時加重成本；順路時降低成本
3. **負載因子** — 電梯承載人數越多，成本越高
4. **等待時間修正** — 等候越久的乘客，方向懲罰遞減，確保不會被無限期延遲
5. **死鎖保護** — 等待超過 10 秒時，若有閒置電梯可用，強制重新分配
6. **邊界處理** — 頂樓 / 1 樓自動轉向，空車自由接客

## 技術架構

```
src/
├── App.vue                # 主介面元件（大樓視覺化 + 控制面板 + 日誌）
├── main.ts                # 應用程式進入點
├── stores/
│   └── elevator.ts        # Pinia Store — 電梯狀態管理與核心模擬邏輯
├── types/
│   └── elevator.ts        # TypeScript 型別定義
└── __tests__/
    └── App.spec.ts        # 單元測試
```

### 核心技術

- **Vue 3** — Composition API + `<script setup>` 語法
- **Pinia** — 集中式狀態管理，所有模擬邏輯與狀態皆在 Store 中
- **TypeScript** — 完整型別定義，提升開發體驗與程式碼品質
- **Vite** — 極速開發伺服器與建構工具
- **Vitest** — 單元測試框架

## 快速開始

### 前置需求

- Node.js `^20.19.0` 或 `>=22.12.0`

### 安裝與執行

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建構生產版本
npm run build

# 預覽生產版本
npm run preview
```

### 其他指令

```bash
# 執行單元測試
npm run test:unit

# 型別檢查
npm run type-check

# 程式碼格式化與 Lint
npm run format
npm run lint
```

## 操作說明

1. 點擊 **開始模擬** 啟動模擬
2. 使用 **−** / **+** 按鈕調整模擬速度
3. 觀察大樓剖面圖中電梯的移動與乘客等候狀態
4. 右側日誌面板即時顯示所有事件
5. 上方進度條與統計面板追蹤整體進度
6. 點擊 **暫停** 可暫時停止，**重置** 可重新開始

## License

此專案僅供學習與展示用途。
