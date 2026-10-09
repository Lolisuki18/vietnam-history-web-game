export const CHAPTER_KIMDONG_URL =
  process.env.NEXT_PUBLIC_CHAPTER_KIMDONG_URL ?? "http://localhost:5173";

export const CHAPTER_KIMDONG_ORIGIN = new URL(CHAPTER_KIMDONG_URL).origin;
