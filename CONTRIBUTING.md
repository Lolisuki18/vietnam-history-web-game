# Hướng dẫn cho người phát triển

Tài liệu kỹ thuật của dự án **Hào khí Việt Nam**. Phần giới thiệu dự án nằm ở [README](README.md).

Công nghệ: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Zustand 5 · Phaser 4 · Vitest · pnpm 11.

## Chạy

Cần Node.js ≥ 22.12 và pnpm 11.

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
tools/kimdong-art/      script Python (Pillow) xử lý ảnh gốc thành sprite/prop/nền; xem README trong thư mục
scripts/                check-assets (ngân sách dung lượng)
```

## Thêm một game mới (ví dụ `tran-quoc-toan`)

1. Thêm id vào `CHAPTER_IDS` ở `lib/engine/chapter.ts`. TypeScript sẽ báo lỗi ở mọi nơi còn thiếu.
2. Tạo `features/tran-quoc-toan/` theo mẫu `features/kimdong/`:
   - `types.ts`: hằng id, các giai đoạn, kiểu thông điệp game ⇄ UI, kiểu kết quả.
   - `game/`: Phaser. Gọi `createPhaserGame` / `destroyPhaserGame` (`lib/game/phaser.ts`), `TouchControls`, `LoadingBar`, `Synth`… từ `lib/game/`. **Tự tạo emitter, `touchInput`, sổ debug của riêng game** (đừng dùng chung biến toàn cục).
   - `ui/`: React overlay, nhúng game bằng `<GameCanvas load={...} />`.
3. Thêm route `app/tran-quoc-toan/page.tsx` (và `codex/page.tsx`); đặt `metadata` riêng.
4. Thêm vào `data/chapters.ts` (`href: "/tran-quoc-toan"`, `codexHref: "/tran-quoc-toan/codex"`) và `features/registry.tsx`.
5. Bỏ ảnh/âm thanh vào `public/assets/tran-quoc-toan/`.

## Quy tắc (ESLint tự kiểm tra)

- `features/<game>` **không** import `features/<game khác>`. Cần dùng chung thì đưa sang `lib/` hoặc `components/`.
- `lib/` không import `features`, `app`, `components`, `stores`, `data`.
- Phaser chỉ được import trong code tải bằng `import()` bên trong effect (nó dùng `window`). Đừng import `phaser` ở file chạy lúc render server.
- Mã chỉ để test (cheat `window.debug*`, `?timeoutloop`) phải nằm sau `process.env.NODE_ENV !== "production"` để không vào bản production.
- Icon chỉ dùng `lucide-react`; icon khác để thành file `.svg` riêng và hiển thị bằng `SvgIcon`, không viết `<svg>` trực tiếp trong code.

## Asset (ảnh, âm thanh)

Mọi asset của một game nằm **một chỗ**: `public/assets/<game>/` (Kim Đồng: `images/`, `sprites/`, `audio/`, `web/`; dùng chung: `public/assets/shared/`). Chi tiết từng file xem `public/assets/kimdong/README.md`.

`pnpm check:assets` (chạy cả trong CI) giới hạn: mỗi file ≤ 2 MB, mỗi game ≤ 12 MB, cấm `.bmp`, `.tiff`, `.psd`, `.ai`, `.xcf`, `.aseprite`. Dùng `png`/`webp`/`jpg` cho ảnh, `ogg`/`mp3`/`m4a`/`wav` ngắn cho âm thanh. Mỗi game chỉ tải asset của nó khi vào route của nó.

File trong `/assets/*` được cache 1 ngày (xem `next.config.ts`). Ảnh trong game có kèm `?v=<ASSET_VERSION>` (`features/kimdong/game/assets/manifest.ts`): **sau khi thay ảnh hay âm thanh nào, hãy tăng `ASSET_VERSION`** để người chơi thấy bản mới ngay. Ảnh trang web (`web/`) không có số phiên bản: đổi tên file nếu cần cập nhật ngay.

## Dữ liệu người chơi

Tiến độ lưu trong `localStorage` (`vhg-progress`) của từng trình duyệt. Khi đổi cấu trúc `ProgressData` (`stores/progress-migrate.ts`): tăng `PROGRESS_VERSION` và thêm bước chuyển đổi trong `migrateProgress`, để bản lưu cũ của người chơi không bị mất.

## Deploy (Vercel)

Một project Vercel trỏ vào thư mục gốc, không cần biến môi trường. Push `main` → production; mỗi PR → bản preview.
