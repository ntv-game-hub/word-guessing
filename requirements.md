# Word Guessing Game - Tài Liệu Yêu Cầu Đầy Đủ

## 1. Mục Tiêu

Xây dựng web game đoán chữ realtime, không cần đăng nhập, đăng ký hoặc xác thực.

Người dùng khi vào web chọn một trong hai vai trò:

- **Chủ game**: tạo phòng, nhập đáp án, gợi ý, số lượt đoán tối đa, chọn hình phạt bí mật, theo dõi và chấm câu trả lời của người chơi.
- **Người chơi**: nhập tên hiển thị, chọn phòng đang mở hoặc nhập mã phòng, xem gợi ý, nhập đáp án theo từng ô chữ, nhận kết quả chấm từ chủ game.

Ứng dụng chạy bằng Node.js, Express, Socket.IO và React/Vite. Bản LAN/production hiện dùng `pm2`, host `0.0.0.0`, port `6670`.

## 2. Phạm Vi MVP Hiện Tại

### Có trong phiên bản hiện tại

- Không có tài khoản, đăng nhập, đăng ký hoặc xác thực người dùng.
- Có màn hình chọn vai trò: `Chủ game` và `Người chơi`.
- Chủ game tạo nhiều phòng khác nhau bằng `gameCode`.
- Chủ game nhập:
  - Từ/cụm từ cần đoán, hỗ trợ tiếng Anh và tiếng Việt có dấu.
  - Số lượt đoán tối đa, mặc định `20`, nhỏ nhất `1`.
  - Gợi ý/mô tả.
  - Hình phạt bí mật từ danh sách thử thách vui.
- Người chơi có thể:
  - Nhập tên hiển thị.
  - Chọn phòng từ danh sách phòng đang mở, không cần nhập mã.
  - Nhập mã phòng thủ công nếu cần.
  - Join bằng link có query `?code=XXXXX`.
- Tên người chơi được lưu trong `localStorage` để tự điền lại lần sau.
- Host token được lưu trong `localStorage` để chủ game reload vẫn quay lại phòng nếu server chưa restart.
- Player session được lưu trong `localStorage` để người chơi reload vẫn quay lại phòng nếu server chưa restart.
- Nếu session cũ không còn hợp lệ sau server restart, client tự xóa session và không hiện lỗi gây nhiễu.
- Người chơi thấy:
  - Gợi ý/mô tả.
  - Các ô nhập chữ tương ứng với ký tự cần đoán.
  - Lượt còn lại và trạng thái dạng compact.
  - Hình phạt bí mật đang bị che.
  - Lịch sử đoán của riêng mình, mới nhất lên trước.
- Chủ game thấy:
  - Đáp án, mã phòng, số ký tự, lượt tối đa dạng compact trên một hàng.
  - Link/mã phòng để chia sẻ.
  - Hình phạt bí mật đang bị che.
  - Danh sách người chơi theo grid ngang; tablet 2 người mỗi hàng, mobile 1 người mỗi hàng.
  - Người chơi có lượt đoán mới nhất được đưa lên trước.
  - Trong mỗi người chơi, lượt đoán mới nhất lên trước.
- Người chơi nhập câu trả lời:
  - Mỗi ký tự là một ô input.
  - Nhập 1 ký tự tự chuyển focus sang ô tiếp theo.
  - Backspace ở ô trống lùi về ô trước.
  - Paste cả từ/cụm từ vào ô đầu, hệ thống tự điền từng ô.
  - Không cho gửi nếu thiếu ô bắt buộc.
  - Sau khi gửi thì khóa chờ chủ game chấm.
- Chủ game chấm:
  - Chấm từng ký tự `Đúng` hoặc `Sai`.
  - Có nút `Tất cả đúng`.
  - Có nút `Tất cả sai`.
  - Có nút `Tự động chấm` dựa trên đáp án, nhưng host vẫn có thể sửa lại từng ô.
  - Có nút gửi kết quả chấm.
- Quy tắc kết quả:
  - Đúng nghĩa là đúng ký tự và đúng vị trí.
  - Nếu đúng, phía người chơi giữ lại ký tự và khóa ô đó.
  - Nếu sai, phía người chơi xóa ký tự sai và mở lại ô để nhập lại.
  - Nếu đúng hết, người chơi thắng và không đoán tiếp.
  - Nếu hết lượt, người chơi thua và không đoán tiếp.
- Mỗi lần submit tính mất 1 lượt ngay.
- Mỗi người chơi thắng/thua độc lập; game không tự kết thúc cho tất cả.
- Chủ game có thể tạo phòng mới; phòng cũ được đánh dấu `finished` và biến mất khỏi danh sách phòng đang mở.
- Realtime bằng Socket.IO giữa chủ game và người chơi.
- Client giữ draft local:
  - Người chơi khác submit không làm mất chữ đang nhập của người chơi hiện tại.
  - Realtime state không ghi đè phần host đang mark đúng/sai.
- UI tiếng Việt, tối ưu mobile/tablet/desktop.
- Màu chủ đạo tím pastel:
  - `#C264FF`
  - `#CC7DFF`
  - `#D697FF`
  - `#E0B0FF`
  - `#EACAFF`
  - `#F4E3FF`
- Có animation nhẹ: nền vui, pop input, confetti khi thắng, hình phạt mở từng mảnh.

### Không có trong MVP

- Tài khoản người dùng.
- Phân quyền thật sự bằng tài khoản.
- Database persistent.
- Lưu game sau khi server restart.
- Chat trong game.
- Bảng xếp hạng dài hạn.
- Gợi ý tự động bằng AI.
- Nhiều host cùng quản lý một phòng.
- QR code.
- Giới hạn số người chơi tối đa.

## 3. Vai Trò Và Luồng Sử Dụng

### 3.1. Màn hình đầu tiên

Người dùng thấy hai lựa chọn:

- `Chủ game`
- `Người chơi`

Nếu chọn `Chủ game`, đi tới form tạo phòng.

Nếu chọn `Người chơi`, đi tới màn tham gia phòng.

### 3.2. Luồng chủ game

1. Chọn `Chủ game`.
2. Nhập từ cần đoán.
3. Nhập gợi ý/mô tả.
4. Nhập số lượt đoán tối đa.
5. Chọn hình phạt bí mật.
6. Bấm `Tạo phòng`.
7. Chia sẻ mã/link phòng.
8. Theo dõi người chơi và câu trả lời realtime.
9. Chấm từng lượt đoán.
10. Bấm `Tạo phòng mới` khi muốn kết thúc phòng cũ và mở phòng khác.

### 3.3. Luồng người chơi

1. Chọn `Người chơi`.
2. Nhập tên hiển thị, hoặc dùng tên đã lưu.
3. Chọn phòng trong danh sách phòng đang mở, hoặc nhập mã phòng.
4. Nhập đáp án theo từng ô chữ.
5. Bấm `Trả lời`.
6. Chờ chủ game chấm.
7. Nhận kết quả:
   - Ô đúng được giữ lại.
   - Ô sai bị xóa để đoán lại.
8. Có thể bấm `Tham gia phòng mới` để rời luồng chơi hiện tại và chọn phòng khác.

## 4. Chủ Game

### 4.1. Tạo game

Form tạo game gồm:

- `Từ cần đoán`
  - Hỗ trợ tiếng Anh và tiếng Việt.
  - Ví dụ: `PICTURE`, `BÁNH MÌ`, `BỨC TRANH`.
- `Gợi ý/mô tả`
  - Chủ game tự nhập.
- `Số lượt đoán tối đa`
  - Mặc định `20`.
  - Tối thiểu `1`.
- `Chọn hình phạt bí mật`
  - Chủ game chọn một hình phạt/thử thách vui từ danh sách.

Danh sách hình phạt hiện tại:

- `Hát 1 bài hoặc 1 đoạn ngắn`
- `Nhăn mặt, nhe răng trong 5 giây`
- `Nhảy robot trong 10 giây`
- `Tạo dáng siêu anh hùng 5 giây`
- `Bật nhảy 10 cái`
- `Đọc nhanh một câu khó`
- `Đi kiểu vui trong 5 bước`
- `Đứng một chân trong 5 giây`
- `Khen một bạn trong phòng`
- `Vẽ mặt cười trong 10 giây`

Không dùng hình phạt thể chất hoặc bạo lực trong UI trẻ em.

### 4.2. Dashboard chủ game

Chủ game thấy:

- Mã phòng.
- Đáp án đầy đủ.
- Gợi ý.
- Số ký tự cần đoán.
- Số lượt tối đa.
- Link/mã phòng để chia sẻ.
- Nút `Copy link`.
- Nút `Tạo phòng mới`.
- Nút `Trang chính`.
- Hình phạt bí mật.
- Bộ lọc người chơi:
  - `Tất cả`
  - `Chờ chấm`
  - `Đã thắng`
  - `Hết lượt`
- Danh sách người chơi dạng grid ngang.

### 4.3. Chấm câu trả lời

Mỗi lượt đoán hiển thị:

- Tên người chơi.
- Số lần đoán.
- Các ô chữ của câu trả lời.
- Trạng thái từng ô:
  - `correct`
  - `wrong`
  - `pending`
- Nút `Tất cả đúng`.
- Nút `Tất cả sai`.
- Nút `Tự động chấm`.
- Nút `Gửi kết quả`.

Host có thể chấm tay hoặc dùng auto-grade rồi chỉnh lại.

## 5. Người Chơi

### 5.1. Tham gia game

Màn tham gia gồm:

- `Tên hiển thị`
  - Lưu trong `localStorage`.
- `Mã phòng`
  - Có thể nhập thủ công.
- Danh sách phòng đang mở:
  - Mã phòng.
  - Gợi ý.
  - Số ký tự.
  - Số lượt.
  - Số người chơi.

Bấm vào một phòng trong danh sách sẽ join ngay bằng tên hiện tại.

### 5.2. Nhập câu trả lời

Người chơi nhập đáp án theo từng ô:

- Chỉ các ký tự chữ/số là ô cần đoán.
- Khoảng trắng và dấu câu hiển thị sẵn, không cần đoán.
- Input tự uppercase theo locale Việt.
- Người chơi phải nhập đúng dấu tiếng Việt.
- Không cho submit nếu thiếu ô bắt buộc.
- Nếu đang chờ chấm thì không thể submit thêm.

### 5.3. Nhận kết quả

Sau khi host gửi kết quả:

- Ô đúng giữ nguyên và khóa.
- Ô sai bị xóa.
- Lịch sử cập nhật dòng mới.
- Lịch sử sắp xếp mới nhất lên trước.
- Nếu thắng, hiển thị trạng thái thắng và confetti.
- Nếu hết lượt, khóa input.

## 6. Hình Phạt Bí Mật

Mỗi phòng có một `punishment`:

- Chủ game chọn hình phạt trước khi tạo phòng.
- Hình phạt hiển thị cho cả host và player dưới dạng poster bị che.
- Poster có `10` mảnh che.
- Mỗi lần host chấm một câu trả lời có ít nhất một ô sai, hệ thống mở thêm `1` mảnh.
- Nếu câu trả lời được chấm toàn đúng, hình phạt không mở thêm.
- Host và player đều thấy tiến độ realtime.

## 7. Dữ Liệu Và Trạng Thái

### 7.1. Game

```json
{
  "id": "string",
  "code": "string",
  "answer": "string",
  "answerCells": [
    {
      "index": 0,
      "value": "B",
      "playable": true
    }
  ],
  "hint": "string",
  "maxAttempts": 20,
  "punishment": {
    "id": "funny-face",
    "revealedParts": 0,
    "totalParts": 10
  },
  "hostToken": "string",
  "createdAt": "datetime",
  "status": "active | finished"
}
```

### 7.2. Player

```json
{
  "id": "string",
  "gameId": "string",
  "name": "string",
  "attemptsUsed": 0,
  "maxAttempts": 20,
  "status": "playing | waiting_review | won | lost",
  "lockedLetters": ["B", null, null, "H"],
  "createdAt": "datetime"
}
```

### 7.3. Guess

```json
{
  "id": "string",
  "gameId": "string",
  "playerId": "string",
  "letters": ["B", "Á", "N", "H"],
  "review": ["correct", "wrong", "pending", "correct"],
  "autoReview": ["correct", "correct", "correct", "correct"],
  "status": "pending | reviewed",
  "createdAt": "datetime",
  "reviewedAt": "datetime | null"
}
```

### 7.4. Game Summary

Dùng cho danh sách phòng đang mở:

```json
{
  "code": "ABCDE",
  "hint": "string",
  "maxAttempts": 20,
  "playableCount": 7,
  "playerCount": 3,
  "status": "active",
  "createdAt": "datetime"
}
```

## 8. Xử Lý Tiếng Việt Và Ký Tự Đặc Biệt

- Chuẩn hóa text bằng Unicode `NFC`.
- Tách ký tự bằng `Intl.Segmenter` theo grapheme.
- Fallback bằng `Array.from` nếu môi trường không hỗ trợ `Intl.Segmenter`.
- So sánh không phân biệt hoa/thường bằng `toLocaleUpperCase("vi-VN")`.
- Vẫn phân biệt dấu tiếng Việt.
- Chữ và số là ký tự cần đoán.
- Khoảng trắng và dấu câu hiển thị sẵn, không cần đoán.
- Khoảng trắng/dấu câu luôn được review là `correct`.

## 9. Realtime

Realtime dùng `Socket.IO`.

### 9.1. Client gửi lên server

- `game:create`
- `game:get`
- `game:finish`
- `games:list`
- `game:join`
- `guess:submit`
- `guess:review`
- `player:leave`

### 9.2. Server gửi về client

- `game:created`
- `game:state`
- `games:list`
- `player:joined`
- `guess:submitted`
- `guess:reviewed`
- `player:updated`
- `error`

### 9.3. Nguyên tắc realtime/draft

- Khi một người chơi submit, server chỉ gửi state mới cho host và chính người chơi đó.
- Không broadcast state submit tới các người chơi khác để tránh mất draft đang nhập.
- Khi host đang chấm, client giữ draft chấm local cho các guess pending.
- Khi host gửi kết quả, state mới được phát tới các bên liên quan.

## 10. UI/UX

### 10.1. Layout chung

- UI tiếng Việt.
- Chủ đạo tím pastel.
- Hỗ trợ desktop, tablet và mobile.
- Header compact, badge realtime nằm cùng dòng với logo `Ô Chữ Vui Vẻ`.
- Mobile ưu tiên nhìn thấy ô nhập chữ và hình phạt.
- Card radius tối đa khoảng `8px`.
- Không dùng layout landing page; vào game là thao tác ngay.

### 10.2. Chủ game

- Thông tin phòng compact trên một hàng:
  - Đáp án.
  - Mã phòng.
  - Số ký tự.
  - Lượt tối đa.
- Người chơi hiển thị dạng grid:
  - Desktop: nhiều cột tùy độ rộng.
  - Tablet: 2 người mỗi hàng.
  - Mobile: 1 người mỗi hàng.
- Người chơi/lượt đoán mới nhất lên trước.
- Các nút chấm dễ bấm trên tablet/mobile.

### 10.3. Người chơi

- Lượt còn lại và trạng thái dạng compact.
- Ô nhập chữ nằm nổi bật.
- Hình phạt bí mật nằm gần khu vực chơi.
- Lịch sử nằm bên cạnh trên desktop, bên dưới trên mobile.
- Lịch sử mới nhất lên trước.

### 10.4. Trạng thái màu

- Đúng: xanh lá.
- Sai: đỏ/coral.
- Chờ chấm: vàng nhẹ.
- Nền và UI chính: tím pastel.

## 11. Validation

- Không cho tạo game nếu từ cần đoán rỗng.
- Không cho tạo game nếu từ không có chữ/số nào cần đoán.
- Không cho tạo game nếu số lượt nhỏ hơn `1`.
- Không cho tham gia nếu tên hiển thị rỗng.
- Không cho tham gia nếu phòng không tồn tại.
- Không cho tham gia nếu phòng đã `finished`.
- Không cho gửi câu trả lời khi:
  - Chưa nhập đủ ký tự cần đoán.
  - Đang có câu trả lời chờ chấm.
  - Người chơi đã thắng.
  - Người chơi đã hết lượt.
  - Phòng đã kết thúc.
- Chủ game chỉ được chấm nếu có `hostToken` hợp lệ.
- Một lượt đoán chỉ được gửi kết quả khi tất cả ô playable đã được chấm.

## 12. Deployment

### 12.1. LAN/VPS bằng PM2

Môi trường hiện tại:

- OS đề xuất: Ubuntu Server 24.04.
- Runtime: Node.js LTS.
- Process manager: `pm2`.
- Host: `0.0.0.0`.
- Port: `6670`.
- Truy cập LAN: `http://<LAN_IP>:6670`.

Không dùng port `6666` vì Chrome/Edge chặn `ERR_UNSAFE_PORT`.

### 12.2. Scripts

```bash
npm install
npm run build
npm start
```

PM2:

```bash
npm run pm2:start
npm run pm2:restart
npm run pm2:stop
npm run pm2:delete
npm run pm2:logs
npm run pm2:save
```

`ecosystem.config.cjs` chạy:

- App name: `word-guessing`.
- Script: `server/index.js`.
- `HOST=0.0.0.0`.
- `PORT=6670`.
- `NODE_ENV=production`.

### 12.3. Vercel

Không deploy full backend Socket.IO lên Vercel theo mô hình hiện tại.

Cách phù hợp:

- Deploy frontend Vite lên Vercel.
- Deploy backend Express/Socket.IO lên Render, Railway, Fly.io, VPS hoặc provider hỗ trợ WebSocket long-running server.
- Set env Vercel:

```bash
VITE_SOCKET_URL=https://your-backend-domain.example
```

Vercel frontend config:

- Framework: `Vite`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Install command: `npm install`.

## 13. Kiểm Thử

### 13.1. Unit tests

- Tách grapheme tiếng Việt.
- Khoảng trắng/dấu câu hiển thị sẵn.
- Submit thiếu ký tự bị từ chối.
- Auto review phân biệt dấu tiếng Việt.
- Apply review giữ chữ đúng và xóa chữ sai.

### 13.2. Smoke tests

- HTTP `GET /` trả `200 OK`.
- Socket.IO polling endpoint hoạt động.
- Host tạo phòng.
- Player join phòng bằng code.
- Player submit.
- Host review.
- Player thắng nếu tất cả ô đúng.
- Một lượt sai mở thêm 1 mảnh hình phạt.
- Danh sách phòng có phòng active và bỏ phòng finished.
- Player khác submit không làm player hiện tại mất chữ đang nhập.

## 14. Quyết Định Hiện Tại

- Hỗ trợ nhiều phòng bằng `gameCode`.
- Trạng thái game lưu in-memory.
- Sau server restart, game đang chơi mất.
- Chủ game tự nhập gợi ý.
- Không dùng AI.
- Tiếng Việt phải nhập đúng dấu.
- Mỗi lần submit tính mất 1 lượt.
- Người chơi không sửa câu trả lời đang chờ chấm.
- Người chơi thắng/thua độc lập.
- Hình phạt là thử thách vui, không bạo lực.
- UI ưu tiên tiếng Việt.
