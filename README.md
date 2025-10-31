# GitHub Content Bridge

Ứng dụng Next.js giúp bạn xem, chỉnh sửa và xóa nội dung file trong repository GitHub trực tiếp từ giao diện web được deploy trên Vercel.

## Tính năng

- Nhập thông tin owner, repository và đường dẫn file để tải nội dung mới nhất.
- Chỉnh sửa nội dung file và tạo commit mới chỉ với một lần bấm.
- Xóa file trong repository (yêu cầu xác nhận SHA hiện tại).
- Hiển thị trạng thái và thông báo lỗi thân thiện.

## Cấu hình

1. Tạo [Personal Access Token](https://github.com/settings/tokens) với quyền `repo`.
2. Trên Vercel, cấu hình biến môi trường `GITHUB_TOKEN` với token vừa tạo.
3. Sao chép file `.env.example` thành `.env.local` khi chạy cục bộ và điền token:

   ```bash
   cp .env.example .env.local
   ```

## Phát triển

```bash
npm install
npm run dev
```

Ứng dụng mặc định chạy tại `http://localhost:3000`.

## Triển khai lên Vercel

- Push mã nguồn lên GitHub và kết nối repository với Vercel.
- Cấu hình biến môi trường `GITHUB_TOKEN` trong dự án Vercel.
- Mỗi khi deploy, các API routes sẽ sử dụng token này để tương tác với GitHub REST API.

## Lưu ý

- API sẽ trả lỗi khi thiếu thông tin bắt buộc hoặc khi đường dẫn trỏ tới thư mục.
- Mọi thao tác ghi đều tạo commit mới trên repository; hãy chọn commit message phù hợp.
