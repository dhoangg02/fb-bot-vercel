# Messenger Bot — Vercel (Free)

Serverless webhook chạy trên **Vercel** (Node 18). Không cần server riêng.

## Cách triển khai (rất ngắn)

### 1) Tạo Project trên Vercel
- Vào https://vercel.com → **New Project** → chọn **Import Git Repository** (hoặc **Add New… → Project** rồi **Upload** folder này).
- Bấm qua các bước mặc định (không cần build command).

### 2) Khai báo Environment Variables
Trong **Project → Settings → Environment Variables**, thêm:
- `FB_VERIFY_TOKEN` = chuỗi bí mật do bạn đặt (vd: `my-secret-123`)
- `FB_PAGE_ACCESS_TOKEN` = (tạm để trống, lát nữa dán vào)
- `FB_GRAPH_VERSION` = `v21.0`

Deploy xong Vercel cấp domain: `https://<project>.vercel.app`

### 3) Kết nối Meta (Messenger)
- Vào **Meta for Developers → My Apps → [App của bạn] → Messenger → Settings**
- **Webhooks → Add Callback URL**:
  - Callback URL: `https://<project>.vercel.app/api/webhook`
  - Verify Token: nhập đúng `FB_VERIFY_TOKEN`
- **Add Subscriptions**: tick `messages`, `messaging_postbacks`
- **Access Tokens**: chọn **Page** → **Generate Token** → copy **Page Access Token**
- Vào **Vercel → Project → Settings → Environment Variables**: dán token vào `FB_PAGE_ACCESS_TOKEN` → **Save** → **Redeploy** (hoặc **Deploy** lại)

### 4) Test
- Dùng tài khoản admin/dev/tester nhắn tin vào **Page** → bot sẽ tự động chào nếu bạn nói "hello", hoặc dùng AI để trả lời thông minh hơn.

## Luồng xử lý tin nhắn
1. Meta gửi webhook POST tới `/api/webhook`.
2. Server đọc từng `entry.messaging` event và chuyển vào `processMessagingEvent`.
3. Hàm xử lý sẽ:
   - Bỏ qua tin nhắn echo, validate sender.
   - Kiểm tra nội dung "hello" để trả lời nhanh.
   - Nếu có text khác, gọi OpenAI (nếu cấu hình) để sinh câu trả lời.
   - Nếu là hình ảnh/tệp, gửi thông báo đã nhận tệp để tránh crash.
   - Ghi log vào Google Sheets (nếu cấu hình) và gửi phản hồi qua Graph API.
4. Để tránh timeout khi deploy trên Vercel, từng bước được bao trong timeout 8s và xử lý song song.

## Endpoint mới
- `GET /api/health` trả về `{ "status": "ok" }` giúp kiểm tra bot đang chạy.

## Environment variables bổ sung
- `OPENAI_API_KEY` và `OPENAI_MODEL` (tuỳ chọn, mặc định `gpt-4o-mini`).
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_WORKSHEET_NAME` (tuỳ chọn) để log tin nhắn.
- `DEFAULT_FALLBACK_MESSAGE` để tuỳ biến câu trả lời mặc định.

## Ghi chú
- Serverless có thể "lạnh" lần đầu, nhưng Vercel sẽ tự chạy khi có request.
- Nếu verify lỗi: kiểm tra đúng URL `/api/webhook` và token khớp.
