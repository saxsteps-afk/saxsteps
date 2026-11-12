# SaxSteps

Web bán khóa học saxophone 30 ngày bằng tiếng Anh: **saxsteps.com**.

- Next.js 16 + Supabase + Tailwind 4, cùng bộ công nghệ với TOPSAX nhưng là dự án riêng: Supabase riêng, tài khoản Google riêng (saxsteps@gmail.com).
- Màn hình học là app **sax-tap** (`D:\Dunghd\code\ky am\sax-tap`), build bản tiếng Anh vào `public/learn`.
- Bài học là bộ `score/bai-tap/30daysForSax` (62 file `Day NN - Notes/Song/Bonus - ….nhac.json`) cùng giáo án `lesson-plan.md`.
- Thanh toán qua **Lemon Squeezy**. Mọi phần riêng của Lemon Squeezy nằm trong `src/lib/payments/lemonsqueezy.ts`.

## Các trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang giới thiệu: cách hoạt động, 30 ngày, giá, FAQ (trang tĩnh, không gọi database) |
| `/login` | Đăng nhập / đăng ký: Google hoặc email |
| `/account` | Khóa học của tôi: tiến độ, nút học tiếp hoặc mua |
| `/buy` | Bắt đăng nhập, rồi chuyển sang trang thanh toán Lemon Squeezy (kèm id người mua) |
| `/welcome` | Lemon Squeezy đưa khách về đây sau khi trả tiền; trang chờ tới khi khóa học mở |
| `/learn` | Màn hình học (app sax-tap) |
| `/admin` | Quản lý (tiếng Việt): tải bài + giáo án, video, ngày học thử, học viên, đơn hàng |
| `/terms`, `/privacy`, `/refund` | Điều khoản, chính sách bảo mật, hoàn tiền (Lemon Squeezy yêu cầu có) |
| `/api/webhooks/lemonsqueezy` | Lemon Squeezy báo đơn mới / hoàn tiền |

## Cài đặt lần đầu

1. **Supabase**: đăng nhập supabase.com bằng saxsteps@gmail.com và tạo project mới (region gần khách, ví dụ US East). Sau đó:
   - Dán toàn bộ `supabase/schema.sql` vào SQL Editor và chạy.
   - Vào Project Settings → API, chép URL, `anon` key và `service_role` key vào `.env.local`.
   - Vào Authentication → URL Configuration: Site URL `https://saxsteps.com`; Redirect URLs thêm `http://localhost:3100/**` và `https://saxsteps.com/**`.
   - Bật Google theo đúng các bước đã làm cho TOPSAX, nhưng tạo project Google Cloud mới bằng saxsteps@gmail.com. Redirect URI là `https://<project-id>.supabase.co/auth/v1/callback`.
2. **Bật quyền admin**: chạy `npm run dev`, mở http://localhost:3100/login và đăng nhập bằng saxsteps@gmail.com. Rồi chạy `supabase/make-admin.sql` trong SQL Editor.
3. **Bài học**:
   - Build màn hình học: `npm run player` (cần `.env.local` có URL và anon key).
   - Vào http://localhost:3100/admin → "Tải bài lên" → chọn cả 62 file `.nhac.json` và `lesson-plan.md` trong `score/bai-tap/30daysForSax`.
   - Bật "Học thử" cho ngày 1–3, bấm "Đăng tất cả", rồi bấm "Mở bán" khi sẵn sàng.
4. **Lemon Squeezy**:
   - Tạo store và product "SaxSteps" (một lần, giá trùng `src/lib/site.ts`).
   - Ở variant, mục Confirmation modal: đặt nút về `https://saxsteps.com/welcome`.
   - Share → chép checkout link vào `LEMONSQUEEZY_CHECKOUT_URL`.
   - Settings → Webhooks: URL `https://saxsteps.com/api/webhooks/lemonsqueezy`, chọn sự kiện `order_created` và `order_refunded`, chép signing secret vào `LEMONSQUEEZY_WEBHOOK_SECRET`.
5. **Vercel**: import repo, khai báo đủ các biến trong `.env.local.example`, gắn tên miền saxsteps.com.

## Lệnh

```
npm run dev          # http://localhost:3100
npm run player       # build màn hình học tiếng Anh vào public/learn (chạy lại khi sửa sax-tap)
npm run curriculum   # cập nhật src/data/curriculum.json (danh sách 30 ngày trên trang chủ) khi sửa bài / giáo án
npm run build
```

## Những chỗ là quyết định kinh doanh

`src/lib/site.ts`: giá hiển thị ($29), số ngày hoàn tiền (14), các ngày học thử (1–3). Giá thật đặt ở Lemon Squeezy, nhớ đặt trùng. Nếu đổi số ngày hoàn tiền thì trang `/refund` tự cập nhật theo.

## Mua trước, đăng ký sau

`/buy` bắt đăng nhập trước khi thanh toán, nên đơn hàng gắn thẳng vào tài khoản. Nếu khách vẫn trả bằng email khác (hoặc mua từ link Lemon Squeezy gửi trực tiếp), đơn được lưu với email đó. Khóa học tự mở khi họ đăng nhập bằng đúng email ấy (hàm `claim_orders`). Admin cũng có thể mở tay ở mục Học viên.
