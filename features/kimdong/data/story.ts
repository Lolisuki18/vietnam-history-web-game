import type { ChapterPhase, DialogueId } from "../types";

/** Short objective shown in the HUD for each story phase. */
export const PHASE_OBJECTIVES: Record<ChapterPhase, string> = {
  intro: "Nghe cán bộ giao nhiệm vụ",
  explore: "Nhặt đủ 5 mật thư, rồi ra cây cổ thụ báo hiệu – tránh tầm nhìn của lính tuần",
  rhythm: "Hú tiếng chim tu hú để báo hiệu cho cán bộ",
  climax: "Cán bộ đang gặp nguy! Phải thu hút hỏa lực!",
  runner: "Chạy thoát – né chướng ngại và đạn!",
  ending: "…",
};

/** Control hints shown in the HUD for each story phase (empty = none). */
export const PHASE_CONTROLS: Partial<Record<ChapterPhase, string>> = {
  explore: "WASD / phím mũi tên: di chuyển · Chuột trái hoặc G: ném sỏi đánh lạc hướng",
  rhythm: "SPACE: hú tiếng chim khi con trượt vào vùng sáng",
  climax: "SPACE: bắn súng đánh động, thu hút hỏa lực",
  runner: "↑ / ↓: đổi làn · SPACE: nhảy qua đá, rễ cây",
};

/** Same hints for touch devices (virtual joystick + action button). */
export const PHASE_CONTROLS_TOUCH: Partial<Record<ChapterPhase, string>> = {
  explore: "Cần gạt bên trái: di chuyển · Nút HÀNH ĐỘNG: ném sỏi về phía trước",
  rhythm: "Chạm nút HÀNH ĐỘNG khi con trượt vào vùng sáng",
  climax: "Chạm nút HÀNH ĐỘNG: bắn súng đánh động",
  runner: "Gạt lên / xuống: đổi làn · Nút HÀNH ĐỘNG: nhảy qua đá, rễ cây",
};

export interface DialogueLine {
  speaker: string;
  role?: string;
  /** Portrait of the speaker (a file in public/); the initials are shown when there is none. */
  portrait?: string;
  text: string;
}

export interface DialogueScript {
  lines: readonly DialogueLine[];
  /** Short "how to play" tips shown under the last line. */
  tips?: readonly string[];
  /** Tips for touch devices. */
  touchTips?: readonly string[];
}

export const DIALOGUES: Record<DialogueId, DialogueScript> = {
  intro: {
    lines: [
      {
        speaker: "Anh Đức Thanh",
        role: "Cán bộ",
        portrait: "/assets/kimdong/images/portrait_ducthanh.png",
        text: "Dền ơi, em đi trước dò đường và nhặt 5 mật thư liên lạc bị thất lạc nhé. Nhớ lời anh dặn: nhanh nhẹn như sóc, im lặng như bóng đêm. Hãy cẩn thận tránh lính Pháp tuần tra!",
      },
      {
        speaker: "Kim Đồng",
        role: "Giao liên",
        portrait: "/assets/kimdong/images/portrait_kimdong_determined.png",
        text: "Em nhớ rồi! Nhiệm vụ giao liên: báo tin, dắt đường, canh gác lính tây.",
      },
    ],
    tips: [
      "WASD hoặc phím mũi tên: di chuyển.",
      "Đứng trong bụi rậm hoặc sau tảng đá: lính không nhìn thấy em.",
      "Lội qua suối: lặn được tối đa 5 giây, hết hơi sẽ bị lộ.",
      "Chuột trái hoặc phím G: ném sỏi để đánh lạc hướng lính. Em có 3 viên, nhặt thêm dọc đường (tối đa 6); sỏi rơi xuống đất khô thì nhặt lại được.",
    ],
    touchTips: [
      "Cần gạt bên trái: di chuyển.",
      "Đứng trong bụi rậm hoặc sau tảng đá: lính không nhìn thấy em.",
      "Lội qua suối: lặn được tối đa 5 giây, hết hơi sẽ bị lộ.",
      "Nút HÀNH ĐỘNG bên phải: ném sỏi về phía trước để đánh lạc hướng lính. Em có 3 viên, nhặt thêm dọc đường (tối đa 6); sỏi rơi xuống đất khô thì nhặt lại được.",
    ],
  },
};

export interface LetterContent {
  title: string;
  /** Text of the intercepted letter. */
  quote: string;
  /** A short historical fact about how couriers worked ("Bạn có biết"). */
  fact?: string;
  /** Rendered in alarm colours. */
  urgent?: boolean;
}

/** The 5 letters, shown in the order they are picked up. */
export const LETTERS: readonly LetterContent[] = [
  {
    title: "Mảnh 1",
    quote: "Địch đang dồn quân về phía Nam...",
    fact: "Giao liên thường cuộn tròn tài liệu giấu vào ống nứa hoặc đế giày để ngụy trang.",
  },
  {
    title: "Mảnh 2",
    quote: "...lực lượng gồm 2 trung đội vũ trang trang bị mạnh...",
    fact: "Tài liệu mật thường được viết bằng nước cơm, chỉ hiện lên khi hơ lửa.",
  },
  {
    title: "Mảnh 3",
    quote: "...mục tiêu của chúng là chặn đường rút lui...",
    fact: "Các giao liên nhỏ tuổi thường giả vờ chăn trâu, cắt cỏ để qua mắt tai mắt địch.",
  },
  {
    title: "Mảnh 4",
    quote: "...thời gian phục kích dự kiến vào chập tối nay...",
    fact: "Tiếng chim hót, tiếng gõ gậy là những ám hiệu phổ biến trong rừng.",
  },
  {
    title: "Mảnh 5",
    quote: "KHẨN CẤP: Lính tuần tra đã vào vị trí phục kích! Hủy tài liệu ngay!",
    urgent: true,
  },
];

/** How long a letter toast stays on screen. */
export const TOAST_DURATION_MS = 5000;

export interface CodexSection {
  heading: string;
  body: string;
}

export interface CodexTimelineEntry {
  date: string;
  text: string;
}

/** The keepsakes shown in the Codex ("Hiện vật"): illustrations, tied to the story of the game. */
export const ARTIFACTS = [
  {
    id: "sung-kip",
    title: "Súng kíp nhỏ",
    image: "/assets/kimdong/web/artifact_sung_kip.webp",
    note: "Súng kíp nạp đạn từ nòng, quen thuộc ở vùng núi. Trong trò chơi, đây là vật gắn với khoảnh khắc đánh động để bảo vệ cán bộ.",
  },
  {
    id: "ao-cham",
    title: "Bộ quần áo chàm Nùng",
    image: "/assets/kimdong/web/artifact_ao_cham.webp",
    note: "Áo chàm nhuộm từ cây chàm là trang phục truyền thống của đồng bào các dân tộc vùng cao Cao Bằng, trong đó có người Nùng.",
  },
  {
    id: "coi-tu-hu",
    title: "Còi tu hú",
    image: "/assets/kimdong/web/artifact_coi_tu_hu.webp",
    note: "Tiếng chim tu hú là ám hiệu báo tin trong rừng ở trò chơi này: ba tiếng dài là an toàn, một ngắn hai dài là có biến.",
  },
] as const;

/** Map of the area, shown in the "Di tích" tab. */
export const AREA_MAP = {
  image: "/assets/kimdong/web/map_na_ma.webp",
  caption: "Bản đồ minh họa khu vực Nà Mạ – Hà Quảng, Cao Bằng (1941 – 1943).",
} as const;

/** The historical dossier unlocked after finishing the chapter. */
export const CODEX = {
  years: "1929 – 1943",
  /** One-line biography for the trading card. */
  cardSummary:
    "Người liên lạc nhỏ của cách mạng ở Cao Bằng, đội trưởng đầu tiên của Đội Nhi đồng Cứu quốc – hy sinh khi bảo vệ cán bộ lúc mới 14 tuổi.",
  /** Key numbers shown big in the article. */
  stats: [
    { label: "Năm sinh", value: "1929" },
    { label: "Năm hy sinh", value: "1943" },
    { label: "Đội Nhi đồng Cứu quốc thành lập", value: "15/5/1941" },
  ],
  sections: [
    {
      heading: "Người liên lạc nhỏ của cách mạng",
      body: "Giữa những năm 1941 – 1943, khi cách mạng còn hoạt động bí mật ở vùng núi Cao Bằng, nhiều thiếu niên đã đảm nhận việc giao liên: dẫn đường, đưa đón cán bộ, chuyển thư từ và tài liệu. Nông Văn Dền – bí danh Kim Đồng, người dân tộc Nùng, sinh ra tại làng Nà Mạ, xã Trường Hà, huyện Hà Quảng, tỉnh Cao Bằng – là một trong những đội viên tiêu biểu của lực lượng nhỏ tuổi ấy.",
    },
    {
      heading: "Đội Nhi đồng Cứu quốc",
      body: "Đội Nhi đồng Cứu quốc được thành lập ngày 15/5/1941 tại Cao Bằng – tiền thân của Đội Thiếu niên Tiền phong Hồ Chí Minh. Kim Đồng được nhắc đến như đội trưởng đầu tiên của đội, cùng bốn đội viên đầu tiên là Cao Sơn, Thanh Minh, Thủy Tiên và Thanh Thủy. Các đội viên vừa làm nhiệm vụ canh gác, liên lạc, vừa học tập và tuyên truyền trong bản làng.",
    },
    {
      heading: "Sự hy sinh",
      body: "Ngày 15/2/1943, trong lúc làm nhiệm vụ bảo vệ cán bộ, Kim Đồng bị địch bao vây. Kim Đồng nhanh trí đánh lạc hướng, thu hút hỏa lực của địch về phía mình và phát tín hiệu để các cán bộ cách mạng rút lui an toàn; anh đã hy sinh khi mới 14 tuổi. Hình ảnh người liên lạc nhỏ dũng cảm, mưu trí trở thành biểu tượng của lòng yêu nước và tinh thần trách nhiệm của thiếu nhi Việt Nam; tên anh được đặt cho nhiều trường học, đường phố và cả Nhà xuất bản Kim Đồng. Năm 1997, Kim Đồng được Nhà nước truy tặng danh hiệu Anh hùng Lực lượng vũ trang nhân dân.",
    },
  ] satisfies readonly CodexSection[],
  timeline: [
    {
      date: "1929",
      text: "Nông Văn Dền ra đời tại làng Nà Mạ, xã Trường Hà, huyện Hà Quảng, tỉnh Cao Bằng.",
    },
    {
      date: "15/5/1941",
      text: "Đội Nhi đồng Cứu quốc được thành lập; Kim Đồng làm đội trưởng cùng bốn đội viên đầu tiên: Cao Sơn, Thanh Minh, Thủy Tiên, Thanh Thủy.",
    },
    {
      date: "1941 – 1943",
      text: "Làm giao liên: dẫn đường, đưa đón cán bộ, chuyển thư từ, tài liệu.",
    },
    {
      date: "15/2/1943",
      text: "Bị địch bao vây, Kim Đồng đánh lạc hướng và thu hút hỏa lực về phía mình để cán bộ rút lui an toàn; hy sinh khi mới 14 tuổi.",
    },
    {
      date: "1997",
      text: "Được Nhà nước truy tặng danh hiệu Anh hùng Lực lượng vũ trang nhân dân.",
    },
  ] satisfies readonly CodexTimelineEntry[],
  note: "Nội dung được tổng hợp từ tư liệu lịch sử phổ thông, phục vụ mục đích giáo dục. Hãy đối chiếu với sách giáo khoa và nguồn chính thống khi cần trích dẫn. Các tình tiết trong trò chơi (mật thư, trạm gác, cuộc phục kích…) là hư cấu để minh họa tinh thần của người giao liên.",
} as const;
