import type { ChapterPhase, ChoiceId, ChoiceOption, DialogueId } from "../types";

/** Short objective shown in the HUD for each story phase. */
export const PHASE_OBJECTIVES: Record<ChapterPhase, string> = {
  forest: "Hồi 1 · Lẩn qua rừng cao su, tìm trạm gác ngầm của chú Bảy",
  "meet-bay": "Gặp đồng chí Bảy",
  market: "Hồi 2 · Hòa vào đám đông, tìm cách qua trạm gác",
  checkpoint: "Trạm gác: bình tĩnh trả lời",
  target: "Tìm cơ hội ném lựu đạn vào tên Cai Tòng giữa chợ",
  escape: "Chạy! Tới lối thoát ngầm ở góc chợ",
  interrogation: "Hồi 3 · Giữ vững khí tiết",
  ending: "…",
};

/** Control hints for each phase (empty = none). */
export const PHASE_CONTROLS: Partial<Record<ChapterPhase, string>> = {
  forest:
    "WASD / mũi tên: di chuyển · Chui vào bụi rậm để ẩn · G hoặc Space: ném sỏi đánh lạc hướng",
  market:
    "WASD / mũi tên: di chuyển · Đứng sát nhóm dân để hòa vào đám đông · Space: tương tác (cắt dây)",
  target: "Tiến tới vòng sáng, bấm Space để ngắm, bấm Space lần nữa để ném lựu đạn",
  escape: "WASD / mũi tên: chạy hết tốc lực tới lối thoát",
};

export const PHASE_CONTROLS_TOUCH: Partial<Record<ChapterPhase, string>> = {
  forest: "Cần gạt: di chuyển · Chui vào bụi rậm để ẩn · Nút HÀNH ĐỘNG: ném sỏi",
  market: "Cần gạt: di chuyển · Đứng sát nhóm dân để hòa vào đám đông · HÀNH ĐỘNG: cắt dây",
  target: "Tiến tới vòng sáng, chạm HÀNH ĐỘNG để ngắm, chạm lần nữa để ném",
  escape: "Cần gạt: chạy hết tốc lực tới lối thoát",
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
  tips?: readonly string[];
  touchTips?: readonly string[];
}

const PORTRAIT_SAU = "/assets/vothisau/images/portrait_sau.png";
const PORTRAIT_BAY = "/assets/vothisau/images/portrait_bay.png";

/** Gặp đồng chí Bảy (end of act 1): the grenade is handed over. */
export const DIALOGUES: Record<DialogueId, DialogueScript> = {
  bay: {
    lines: [
      {
        speaker: "Đồng chí Bảy",
        role: "Trạm gác ngầm",
        portrait: PORTRAIT_BAY,
        text: "Cháu đến đúng lúc lắm. Rừng khuya nay chó săn sủa gắt, cháu đi đường có gặp nguy hiểm không?",
      },
      {
        speaker: "Chị Sáu",
        role: "Liên lạc",
        portrait: PORTRAIT_SAU,
        text: "Dạ không sao chú Bảy. Tài liệu cháu giấu dưới đáy thúng rau, bọn lính ngụy ở bốt cầu gật gù ngủ chẳng màng để ý.",
      },
      {
        speaker: "Đồng chí Bảy",
        role: "Trạm gác ngầm",
        portrait: PORTRAIT_BAY,
        text: "Tốt lắm. Kế hoạch sắp tới ở chợ Đất Đỏ rất nguy hiểm. Tên Cai Tòng đang lùng sục cơ sở của ta. Cháu cầm quả lựu đạn này, nhớ chỉ dùng khi cần mở đường máu và thu hút địch.",
      },
      {
        speaker: "Chị Sáu",
        role: "Liên lạc",
        portrait: PORTRAIT_SAU,
        text: "Chú yên tâm. Cháu sẽ cẩn thận.",
      },
    ],
    tips: [
      "Hồi 2 diễn ra ban ngày giữa chợ: đứng sát nhóm dân để hòa vào đám đông, tránh tầm nhìn của lính.",
      "Quả lựu đạn chỉ có một. Ném đúng người, đúng lúc, rồi chạy thoát.",
    ],
  },
};

/** Floating monologues of Chị Sáu (shown above her head, typed out), by situation. */
export const SAU_THOUGHTS = {
  forestStart: ["Phải giao kịp cuộn tài liệu này cho chú Bảy trước lúc rạng sáng."],
  hide: [
    "Bọn chúng đi tuần gắt quá... Mình phải ép sát vào gốc cây.",
    "Ánh đèn pin kìa, nín thở đợi chúng qua...",
  ],
  bushHint: ["Nấp vào đây, đợi hắn quay đi..."],
  crowd: ["Cứ đi chậm, như một người đi chợ bình thường."],
  marketStart: ["Chợ đông thế này, phải đợi đúng lúc."],
  lostBreath: ["Chạy mau... không được để chúng bắt!"],
} as const;

/** What soldiers mutter on their own, by what they are doing. */
export const GUARD_LINES = {
  patrol: ["Muỗi rừng cắn chết người... đi nhanh cho hết ca."],
  suspicious: ["Vừa có tiếng động bên rặng sồi?"],
  alert: ["Có kẻ đột nhập! Khám xét ngay!"],
  market: ["Đứa nào lén lút, tao bắn bỏ tại chỗ!"],
} as const;

export const VILLAGER_LINES = [
  "Bà con né ra chút, dạo này quan bót làm căng lắm.",
  "Khổ quá, gạo thóc bị thu hết rồi, sống sao nổi...",
  "(Thì thầm) Cô Sáu... đứng nấp sát vào lưng tôi này.",
] as const;

export const CAI_TONG_LINES = [
  "Lục soát kỹ vào! Đừng để mống Việt Minh nào lọt qua!",
  "Đứa nào lén lút giấu tài liệu, tao bắn bỏ tại chỗ!",
] as const;

export interface ChoiceOptionContent {
  id: Exclude<ChoiceOption, "timeout">;
  label: string;
  /** What Chị Sáu says when she picks it. */
  reply: string;
  /** `true` = the safe answer (checkpoint only). */
  correct?: boolean;
}

export interface ChoiceScript {
  title: string;
  /** What the soldier says; the player has `seconds` to answer. */
  prompt: string;
  speaker: string;
  seconds: number;
  options: readonly ChoiceOptionContent[];
  /** Shuffle the buttons each time, so the right answer is not always in the same place. */
  shuffle?: boolean;
}

export const CHOICES: Record<ChoiceId, ChoiceScript> = {
  checkpoint: {
    title: "Trạm gác chợ Đất Đỏ",
    speaker: "Lính gác",
    prompt: "Đứng lại! Con nhỏ kia, đi đâu? Trong thúng giấu cái gì?",
    seconds: 3,
    shuffle: true,
    options: [
      {
        id: "a",
        label: "“Dạ, cháu mang ít trầu cau ra chợ đổi bơ gạo cho u ốm ở nhà.”",
        reply: "Dạ bẩm thầy, cháu mang ít trầu cau ra chợ đổi bơ gạo cho u ốm ở nhà.",
        correct: true,
      },
      {
        id: "b",
        label: "“Tôi… tôi không giấu gì hết! Đừng khám!”",
        reply: "Tôi... tôi không giấu gì hết! Đừng khám!",
      },
      {
        id: "c",
        label: "Lặng lẽ cúi đầu, đi thẳng qua cổng.",
        reply: "...",
      },
    ],
  },
  caitong: {
    title: "Cai Tòng đang sinh nghi!",
    speaker: "Cai Tòng",
    prompt: "Con ranh kia, thúng mủng giấu cái gì đấy? Mở ra!",
    seconds: 4,
    options: [
      {
        id: "a",
        label: "Bình tĩnh đóng vai người mua hàng",
        reply: "Dạ bẩm thầy, cháu mang ít trầu cau ra chợ đổi bơ gạo cho u ốm ở nhà.",
      },
      {
        id: "b",
        label: "Ném lựu đạn ngay lập tức!",
        reply: "Cho các người nếm mùi Đất Đỏ!",
      },
    ],
  },
};

/** What Cai Tòng says after the buyer act. */
export const CAI_TONG_BUYER_PASS = "Trầu cau à... Hừm, đi đi! Đừng có lảng vảng ở đây!";
export const CAI_TONG_BLAST_SHOUT = "Á... Việt Minh! Bắt lấy nó!!!";

export interface LoreContent {
  title: string;
  /** What the picked-up paper says. */
  quote: string;
  /** A short historical fact ("Bạn có biết"). */
  fact?: string;
  /** Rendered in alarm colours. */
  urgent?: boolean;
}

/** The 5 papers lying around: act 1 holds 0, 1 and 4 (the last is at Bảy's post), act 2 holds 2 and 3. */
export const LORE: readonly LoreContent[] = [
  {
    title: "Truyền đơn Việt Minh",
    quote:
      "Đồng bào Đất Đỏ! Đất nước là của chúng ta. Đoàn kết lại, không để giặc cướp nước giày xéo!",
    fact: "Chị Võ Thị Sáu sinh năm 1933 ở Đất Đỏ (Bà Rịa) và tham gia hoạt động cách mạng từ khi còn rất nhỏ, làm liên lạc, tiếp tế cho bộ đội.",
  },
  {
    title: "Tờ báo kháng chiến",
    quote: "Nam Bộ kháng chiến! Cả nước một lòng, quyết không làm nô lệ lần nữa.",
    fact: "Ngày 23/9/1945, quân Pháp nổ súng chiếm lại Sài Gòn, mở đầu cuộc kháng chiến ở Nam Bộ.",
  },
  {
    title: "Lệnh truy lùng",
    quote: "Bắt sống bằng được con nhỏ liên lạc ở Đất Đỏ. Kẻ nào chứa chấp sẽ bị xử bắn.",
    fact: "Chị tham gia đội công an xung phong ở Đất Đỏ, từng làm nhiệm vụ trinh sát, dò xét bọn tay sai.",
  },
  {
    title: "Giấy thu thuế gạo",
    quote: "Mỗi nóc nhà nộp đủ số thóc quy định cho bót, nếu thiếu sẽ bị tịch thu ruộng.",
    fact: "Bọn thực dân và tay sai thường cướp lúa gạo, bắt phu, đánh thuế nặng nề khiến dân làng khốn khổ.",
  },
  {
    title: "Mật thư cuối cùng",
    quote: "Giữ bí mật tuyệt đối. Nếu bị bắt, chỉ nói mình là người Việt Nam. – Chú Bảy",
    fact: "Nhiều chiến sĩ trẻ như chị Sáu đã chọn im lặng và kiên định trước kẻ thù thay vì khai báo.",
    urgent: true,
  },
];

export const LORE_TOAST_MS = 6000;

/* ------------------------------------------------------------------------------------------ */
/* Act 3: the interrogation room (visual novel, 100% React)                                    */
/* ------------------------------------------------------------------------------------------ */

export type Speaker = "officer" | "sau" | "narrator";

export interface StoryLine {
  speaker: Speaker;
  text: string;
  /** Sound / stage direction shown in italics under the line. */
  note?: string;
  /** Mood of the room: drives the lamp flicker and background tint. */
  mood?: "calm" | "angry";
}

export const INTERROGATION_INTRO: readonly StoryLine[] = [
  {
    speaker: "narrator",
    text: "Phòng thẩm vấn đồn Đất Đỏ. Bóng đèn dây tóc vàng vọt đung đưa trên bàn sắt.",
    note: "Tiếng gót giày sắt nện xuống nền gạch…",
  },
  {
    speaker: "officer",
    mood: "calm",
    text: "Một cô gái trẻ đẹp thế này... Lẽ ra phải được sống sung sướng. Nói đi, những kẻ chỉ đạo cô trốn ở đâu trong khu rừng cao su kia?",
    note: "Gõ gậy xuống bàn.",
  },
];

export interface InterrogationAnswer {
  id: 1 | 2;
  label: string;
  /** Lines that follow, in order. */
  lines: readonly StoryLine[];
}

export const INTERROGATION_ANSWERS: readonly InterrogationAnswer[] = [
  {
    id: 1,
    label: "Trả lời khinh bỉ",
    lines: [
      {
        speaker: "sau",
        text: "Tao chỉ biết tao là người Việt Nam. Còn lũ cướp nước bọn mày, tao không có gì để nói!",
      },
      {
        speaker: "officer",
        mood: "angry",
        text: "Mày điên rồi! Mày không sợ chết sao?",
        note: "Tiếng bật lửa, rít thuốc lá.",
      },
      {
        speaker: "sau",
        text: "Tao chỉ ân hận là chưa tiêu diệt hết bọn thực dân cướp nước và lũ tay sai bán nước.",
      },
    ],
  },
  {
    id: 2,
    label: "Trả lời đanh thép",
    lines: [
      {
        speaker: "sau",
        text: "Tao có đủ dũng cảm để ném lựu đạn giết lũ ác ôn, thì tao cũng đủ can đảm để đón nhận cái chết. Đừng tốn công mớm cung!",
      },
    ],
  },
];

export const INTERROGATION_VERDICT: readonly StoryLine[] = [
  {
    speaker: "officer",
    mood: "angry",
    text: "Đưa con nhãi này ra Côn Đảo! Tao muốn xem nó cứng đầu được bao lâu trước mũi súng!",
    note: "Tức giận đập bàn.",
  },
];

/** The very last line: the screen fades to black while a đàn tranh plays. */
export const FINAL_LINE = "Đất Đỏ quê mình... ngày mai chắc chắn sẽ nở hoa.";

export const OUTRO_LINES: readonly string[] = [
  "Ngày 23/1/1952, tại Côn Đảo, chị Võ Thị Sáu hy sinh khi mới 19 tuổi.",
  "Năm 1993, Nhà nước truy tặng chị danh hiệu Anh hùng Lực lượng vũ trang nhân dân.",
];

/* ------------------------------------------------------------------------------------------ */
/* Codex                                                                                       */
/* ------------------------------------------------------------------------------------------ */

export interface CodexSection {
  heading: string;
  body: string;
}

export interface CodexTimelineEntry {
  date: string;
  text: string;
}

/** The historical dossier unlocked after finishing the chapter. */
export const CODEX = {
  years: "1933 – 1952",
  cardSummary:
    "Người con gái Đất Đỏ (Bà Rịa) tham gia kháng chiến từ khi còn rất trẻ; bị bắt, bị kết án tử hình và hy sinh ở Côn Đảo năm 1952, khi mới 19 tuổi, vẫn một lòng kiên trung.",
  stats: [
    { label: "Năm sinh", value: "1933" },
    { label: "Năm hy sinh", value: "1952" },
    { label: "Truy tặng Anh hùng LLVTND", value: "1993" },
  ],
  sections: [
    {
      heading: "Cô gái Đất Đỏ",
      body: "Võ Thị Sáu sinh năm 1933 ở vùng Đất Đỏ, tỉnh Bà Rịa (nay thuộc tỉnh Bà Rịa – Vũng Tàu). Lớn lên giữa những năm kháng chiến chống thực dân Pháp, chị sớm tham gia hoạt động cách mạng, làm liên lạc, tiếp tế và tham gia đội công an xung phong ở địa phương.",
    },
    {
      heading: "Những nhiệm vụ nguy hiểm",
      body: "Trong những năm 1948 – 1949, chị Sáu trực tiếp tham gia nhiều trận đánh nhỏ và các nhiệm vụ diệt ác, trừ gian, trong đó có vụ ném lựu đạn vào nơi tập trung của quân Pháp và tay sai ở Đất Đỏ. Chị bị địch bắt, giam ở các nhà tù Đất Đỏ, Bà Rịa rồi Chí Hòa.",
    },
    {
      heading: "Khí tiết ở Côn Đảo",
      body: "Trước tòa án quân sự của thực dân Pháp (năm 1950), chị bị kết án tử hình. Trong nhà tù, chị vẫn giữ vững tinh thần, không khai báo. Ngày 23/1/1952, chị bị đưa ra xử bắn tại Côn Đảo khi mới 19 tuổi. Hình ảnh người con gái nhỏ nhắn, hiên ngang giữa trại giam trở thành biểu tượng của tinh thần bất khuất; năm 1993, chị được Nhà nước truy tặng danh hiệu Anh hùng Lực lượng vũ trang nhân dân.",
    },
  ] satisfies readonly CodexSection[],
  timeline: [
    { date: "1933", text: "Võ Thị Sáu ra đời ở vùng Đất Đỏ, tỉnh Bà Rịa." },
    {
      date: "1946 – 1947",
      text: "Còn rất nhỏ tuổi, chị tham gia hoạt động cách mạng: liên lạc, tiếp tế, sau đó vào đội công an xung phong.",
    },
    {
      date: "1948 – 1949",
      text: "Tham gia các nhiệm vụ diệt ác, trừ gian ở Đất Đỏ, trong đó có vụ ném lựu đạn vào đám quân Pháp và tay sai.",
    },
    { date: "1950", text: "Bị địch xét xử và kết án tử hình, bị đưa ra Côn Đảo." },
    { date: "23/1/1952", text: "Chị hy sinh tại Côn Đảo, hưởng dương 19 tuổi." },
    {
      date: "2/8/1993",
      text: "Nhà nước truy tặng danh hiệu Anh hùng Lực lượng vũ trang nhân dân.",
    },
  ] satisfies readonly CodexTimelineEntry[],
  note: "Nội dung được tổng hợp từ tư liệu phổ thông, phục vụ mục đích giáo dục; một số mốc thời gian (năm bị bắt, số liệu các trận đánh) được các nguồn ghi hơi khác nhau, hãy đối chiếu với sách giáo khoa và nguồn chính thống khi cần trích dẫn. Các tình tiết trong trò chơi (rừng cao su ban đêm, đồng chí Bảy, Cai Tòng, cuộc thẩm vấn…) là hư cấu để minh họa tinh thần của chị. Hình vẽ là tranh minh họa, không phải ảnh thật.",
} as const;

/** Where Võ Thị Sáu rests, shown in the "Di tích" tab. */
export const MONUMENT = {
  title: "Nghĩa trang Hàng Dương (Côn Đảo)",
  body: "Mộ chị Võ Thị Sáu nằm ở nghĩa trang Hàng Dương, Côn Đảo, nơi hằng năm có rất nhiều người đến thắp hương, đặt hoa tưởng niệm. Ở quê nhà Đất Đỏ cũng có đền thờ và khu tưởng niệm chị.",
} as const;

/** The title card shown when an act begins. */
export const ACT_TITLES = {
  1: { label: "Hồi 1", title: "Bóng đêm Rừng Cao Su", subtitle: "Nhiệm vụ liên lạc" },
  2: { label: "Hồi 2", title: "Chợ Đất Đỏ", subtitle: "Ẩn thân và phá hoại" },
  3: { label: "Hồi 3", title: "Khí tiết", subtitle: "Phòng thẩm vấn" },
} as const;
