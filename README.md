# Word Guessing Game

Web game đoán chữ realtime dành cho lớp học/nhóm nhỏ. Chủ game tạo phòng, nhập đáp án và gợi ý; người chơi tham gia phòng, đoán từng ô chữ, rồi nhận kết quả đúng/sai từ chủ game.

## Features

- Không cần đăng nhập/đăng ký.
- Realtime bằng Socket.IO.
- Hỗ trợ nhiều phòng bằng mã phòng.
- Người chơi có thể chọn phòng đang mở, không cần nhập code.
- Hỗ trợ tiếng Việt có dấu bằng Unicode grapheme.
- Khoảng trắng/dấu câu hiển thị sẵn, không cần đoán.
- Chủ game chấm từng ký tự, chấm tất cả đúng/sai, hoặc tự động chấm.
- Hình phạt bí mật được chọn khi tạo phòng và mở dần khi đoán sai.
- UI tiếng Việt, màu tím pastel, tối ưu mobile/tablet/desktop.
- Tên người chơi và session tạm thời lưu bằng `localStorage`.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, Socket.IO
- Process manager: PM2
- Tests: Vitest

## Requirements

- Node.js LTS
- npm
- PM2 nếu chạy production bằng process manager

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Frontend dev server chạy ở Vite port `5173`. Backend dev server chạy ở port `6670`.

## Build

```bash
npm run build
```

Build output nằm ở `dist/`.

## Run Production Locally

```bash
HOST=0.0.0.0 PORT=6670 npm start
```

Mở:

```text
http://localhost:6670
```

Trong LAN:

```text
http://<LAN_IP>:6670
```

> Không dùng port `6666` vì Chrome/Edge chặn bằng `ERR_UNSAFE_PORT`.

## PM2

Start:

```bash
npm run pm2:start
```

Restart sau khi sửa code:

```bash
npm run pm2:restart
```

Logs:

```bash
npm run pm2:logs
```

Save process list:

```bash
npm run pm2:save
```

Stop/delete:

```bash
npm run pm2:stop
npm run pm2:delete
```

## Scripts

```bash
npm run dev          # chạy frontend + backend dev
npm run build        # build frontend
npm start            # chạy Express server phục vụ dist/
npm test             # chạy unit tests
npm run typecheck    # kiểm tra TypeScript
npm run pm2:start    # build và start bằng PM2
npm run pm2:restart  # build và restart PM2
```

## Deployment Notes

### VPS/LAN

Khuyến nghị chạy bằng PM2:

```bash
npm install
npm run build
npm run pm2:start
npm run pm2:save
```

Default production port trong `ecosystem.config.cjs` là `6670`.

### Vercel

Không nên deploy full app lên Vercel vì backend dùng Express + Socket.IO long-running server. Vercel phù hợp để deploy frontend Vite, còn backend nên deploy ở Render, Railway, Fly.io, VPS hoặc provider hỗ trợ WebSocket server.

Frontend trên Vercel:

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Environment variable:

```text
VITE_SOCKET_URL=https://your-backend-domain.example
```

Backend chạy riêng:

```bash
npm install
npm run build
HOST=0.0.0.0 PORT=$PORT npm start
```

## Project Structure

```text
client/
  src/
    App.tsx
    main.tsx
    styles.css
server/
  index.js
shared/
  gameLogic.js
tests/
  gameLogic.test.js
ecosystem.config.cjs
vite.config.ts
vitest.config.ts
requirements.md
```

## Important Behavior

- Game state is in-memory only.
- Restarting the server clears active rooms.
- Player name/session in `localStorage` is only a convenience, not authentication.
- Host permission is protected by a temporary `hostToken`.
- When a player submits, other players do not receive state updates that would erase their local draft.

## Tests

```bash
npm test
```

Current tests cover:

- Vietnamese grapheme segmentation.
- Static characters such as spaces/dashes.
- Auto review behavior.
- Applying review to lock correct letters and clear wrong letters.
