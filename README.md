# Hào khí Việt Nam – web game lịch sử

Mỗi nhân vật lịch sử Việt Nam là một game nhỏ (Phaser) nằm trong **một** app Next.js. Game Kim Đồng ở `/kimdong`, hồ sơ lịch sử ở `/kimdong/codex`.

Công nghệ: Next.js 16 (App Router) · React 19 · Tailwind 4 · Zustand 5 · Phaser 4 · pnpm 11.

## Chạy

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Lệnh                | Việc                                                |
| ------------------- | --------------------------------------------------- |
| `pnpm typecheck`    | Kiểm tra kiểu TypeScript                            |
| `pnpm lint`         | ESLint (gồm quy tắc ranh giới thư mục)              |
| `pnpm test`         | Vitest (logic thuần, danh sách chương, lưu tiến độ) |
| `pnpm format:check` | Prettier                                            |
| `pnpm check:assets` | Ngân sách dung lượng ảnh / âm thanh của game        |
| `pnpm build`        | Build production                                    |

Cả sáu lệnh chạy tự động trên mỗi PR (`.github/workflows/ci.yml`).

## Cấu trúc

```
app/                    route Next.js: trang chủ, /<game>, /<game>/codex
components/ui/          Button, Card, ChapterCard, CodexCard (dùng chung)
components/game/        GameCanvas: nhúng một game Phaser, có màn lỗi + thử lại
components/home/        trang chủ (đọc danh sách chương)
lib/engine/             logic thuần, không phụ thuộc Phaser/React (có test)
lib/game/               hạ tầng Phaser dùng chung: tạo/hủy game, cần gạt cảm ứng, thanh tải, synth âm thanh, sổ cheat dev
features/<game>/        MỌI THỨ của một game: game/ (Phaser), ui/ (React overlay), data/, store/, types.ts
features/registry.tsx   mô tả từng chương cho trang chủ (Record<ChapterId, ...>)
data/chapters.ts        danh sách chương hiển thị ở trang chủ
stores/                 tiến độ người chơi (localStorage, có version + migrate)
public/assets/<game>/   ảnh, bản đồ, âm thanh của game
```

## Thêm một game mới (ví dụ `tran-hung-dao`)

1. Thêm id vào `CHAPTER_IDS` ở `lib/engine/chapter.ts`. TypeScript sẽ báo lỗi ở mọi nơi còn thiếu.
2. Tạo `features/tran-hung-dao/` theo mẫu `features/kimdong/`:
   - `types.ts`: hằng id, các giai đoạn, kiểu thông điệp game ⇄ UI, kiểu kết quả.
   - `game/`: Phaser. Gọi `createPhaserGame` / `destroyPhaserGame` (`lib/game/phaser.ts`), `TouchControls`, `LoadingBar`, `Synth`… từ `lib/game/`. **Tự tạo emitter, `touchInput`, sổ debug của riêng game** (đừng dùng chung biến toàn cục).
   - `ui/`: React overlay, nhúng game bằng `<GameCanvas load={...} />`.
3. Thêm route `app/tran-hung-dao/page.tsx` (và `codex/page.tsx`); đặt `metadata` riêng.
4. Thêm vào `data/chapters.ts` (`href: "/tran-hung-dao"`, `codexHref: "/tran-hung-dao/codex"`) và `features/registry.tsx`.
5. Bỏ ảnh/âm thanh vào `public/assets/tran-hung-dao/`.

## Quy tắc (ESLint tự kiểm tra)

- `features/<game>` **không** import `features/<game khác>`. Cần dùng chung thì đưa sang `lib/` hoặc `components/`.
- `lib/` không import `features`, `app`, `components`, `stores`, `data`.
- Phaser chỉ được import trong code tải bằng `import()` bên trong effect (nó dùng `window`). Đừng import `phaser` ở file chạy lúc render server.
- Mã chỉ để test (cheat `window.debug*`, `?timeoutloop`) phải nằm sau `process.env.NODE_ENV !== "production"` để không vào bản production.

## Dung lượng asset

`pnpm check:assets` (chạy cả trong CI) giới hạn: mỗi file ≤ 2 MB, mỗi game ≤ 12 MB, cấm `.wav`, `.bmp`, `.tiff`, `.psd`… Dùng `png`/`webp`/`jpg` cho ảnh, `ogg`/`mp3`/`m4a` cho âm thanh. Mỗi game chỉ tải asset của nó khi vào route của nó. File trong `/assets/*` được cache 1 ngày (xem `next.config.ts`): khi thay ảnh cùng tên, người chơi có thể thấy ảnh cũ tối đa 1 ngày; đổi tên file nếu cần cập nhật ngay.

## Dữ liệu người chơi

Tiến độ lưu trong `localStorage` (`vhg-progress`) của từng trình duyệt. Khi đổi cấu trúc `ProgressData` (`stores/progress-migrate.ts`): tăng `PROGRESS_VERSION` và thêm bước chuyển đổi trong `migrateProgress`, để bản lưu cũ của người chơi không bị mất.

## Deploy (Vercel)

Một project Vercel trỏ vào thư mục gốc, không cần biến môi trường. Push `main` → production; mỗi PR → bản preview.
