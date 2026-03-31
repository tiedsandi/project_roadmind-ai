// ─── Course Platform — shared types ──────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  subscriberCount: number;
  levelCount: number;
  createdAt: Date;
}

export type CreateCourseInput = Omit<
  Course,
  "id" | "createdAt" | "subscriberCount" | "levelCount"
>;

export interface Level {
  id: string;
  courseId: string;
  name: string;
  order: number;
}

export type CreateLevelInput = Omit<Level, "id">;

export type SectionType =
  | "learning-plan"
  | "cheat-sheet"
  | "resources"
  | "quiz-config";

export interface LearningPlanContent {
  sesi: Array<{
    nomor: number;
    kegiatan: string;
    durasi_menit: number;
    resource: string;
    review: string;
  }>;
}

export interface CheatSheetContent {
  ringkasan: string;
  konsep: Array<{
    nama: string;
    penjelasan: string;
    contoh: string;
  }>;
  tips: string[];
  kesalahanUmum: string[];
}

export interface ResourcesContent {
  resources: Array<{
    nama: string;
    jenis: "Buku" | "Video" | "Kursus" | "Artikel" | "Tokoh";
    alasan: string;
    link?: string;
  }>;
}

export interface QuizConfigContent {
  kisi_kisi: string[];
}

export type SectionContent =
  | LearningPlanContent
  | CheatSheetContent
  | ResourcesContent
  | QuizConfigContent;

export interface Section {
  id: string;
  courseId: string;
  levelId: string;
  type: SectionType;
  content: SectionContent | null;
  generatedAt: Date | null;
}

export type CreateSectionInput = {
  courseId: string;
  levelId: string;
  type: SectionType;
};

export interface QuizQuestion {
  nomor: number;
  pertanyaan: string;
  pilihan: string[];
  jawaban: string;
  penjelasan: string;
}

export interface Subscription {
  id: string;
  userId: string;
  courseId: string;
  subscribedAt: Date;
}
