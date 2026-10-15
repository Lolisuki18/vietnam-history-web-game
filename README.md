# Hào khí Việt Nam

**Chơi game để hiểu những người anh hùng đã làm nên lịch sử.**

Hào khí Việt Nam là dự án web game về các anh hùng cách mạng Việt Nam. Mỗi anh hùng là một **chương**: bạn nhập vai chính nhân vật, đi qua một khoảnh khắc làm nên tên tuổi của họ, rồi đọc **hồ sơ lịch sử** để biết người thật, việc thật đằng sau câu chuyện. Chơi ngay trên trình duyệt, không cần cài đặt, dùng được cả trên máy tính lẫn điện thoại.

## Các chương

| Chương | Nhân vật                                               | Trạng thái |
| ------ | ------------------------------------------------------ | ---------- |
| 1      | **Kim Đồng** – Người liên lạc nhỏ (Cao Bằng, 1943)     | Chơi được  |
| 2      | **Trần Quốc Toản** – Bóp nát quả cam (Bình Than, 1282) | Sắp ra mắt |
| 3      | **Võ Thị Sáu** – Mùa hoa lê-ki-ma (Côn Đảo, 1952)      | Sắp ra mắt |
| …      | Những người anh hùng tiếp theo                         | Dự kiến    |

## Chương 1 – Kim Đồng: Người liên lạc nhỏ

Cao Bằng, những năm kháng chiến chống Pháp. Bạn là Nông Văn Dền, tên thường gọi **Kim Đồng**, đội trưởng đầu tiên của Đội Nhi đồng Cứu quốc, cậu giao liên nhỏ tuổi của cách mạng.

- **Lặng lẽ qua rừng:** nấp trong bụi rậm, sau tảng đá, lặn qua suối để lính tuần không nhìn thấy; sương mù buông dần khi đi sâu vào rừng.
- **Nhặt năm mật thư:** mỗi mảnh thư mở ra một mẩu kiến thức về người giao liên thời ấy.
- **Đánh lạc hướng:** ném sỏi dụ lính đi chỗ khác, nhặt thêm sỏi dọc đường.
- **Tiếng tu hú báo tin:** trèo lên cây, bấm đúng nhịp để gửi tín hiệu cho cán bộ.
- **Khoảnh khắc quyết định:** khi bị phục kích, Kim Đồng nổ súng đánh động để đồng đội rút lui, rồi chạy thoát khỏi toán lính đuổi.

Điều khiển: `WASD` hoặc phím mũi tên để di chuyển, chuột trái hoặc `G` để ném sỏi. Trên điện thoại có cần gạt và nút hành động. Cả màn chơi mất khoảng 5 phút.

### Hồ sơ lịch sử

Sau khi chơi, bạn mở được hồ sơ đầy đủ về Kim Đồng: tiểu sử và dòng thời gian, năm mảnh mật thư, các hiện vật (súng kíp, áo chàm, còi tu hú) và khu di tích ở Nà Mạ, Hà Quảng, Cao Bằng cùng bản đồ vùng đất ấy.

## Cảm hứng thiết kế

Đồ họa pixel với màu sắc, giấy ố và con dấu của thời kháng chiến: phẳng, mộc mạc, không hào nhoáng. Mục tiêu là để lịch sử gần gũi chứ không phải để "chơi cho vui rồi quên".

## Lưu ý về nội dung

Nội dung lịch sử được tổng hợp từ tư liệu phổ thông, phục vụ mục đích giáo dục; hãy đối chiếu sách giáo khoa và nguồn chính thống khi cần trích dẫn. Các tình tiết trong trò chơi (mật thư, trạm gác, cuộc phục kích…) là hư cấu để minh họa tinh thần của nhân vật.

## Chạy thử trên máy

Cần Node.js 22.12 trở lên và pnpm.

```bash
pnpm install
pnpm dev          # mở http://localhost:3000
```

Muốn góp code, thêm anh hùng mới hay làm asset: xem [CONTRIBUTING.md](CONTRIBUTING.md).

Xây dựng bằng Next.js, React, Phaser, Tailwind và TypeScript.
