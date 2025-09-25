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
- Dùng tài khoản admin/dev/tester nhắn tin vào **Page** → bot sẽ **echo** lại.

## Ghi chú
- Serverless có thể "lạnh" lần đầu, nhưng Vercel sẽ tự chạy khi có request.
- Nếu verify lỗi: kiểm tra đúng URL `/api/webhook` và token khớp.
