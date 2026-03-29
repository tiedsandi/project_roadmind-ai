// Semua shared types untuk data model.
// Tidak ada import dari Firebase/PostgreSQL di sini — murni TypeScript.

// ─── Roadmap ────────────────────────────────────────────────────────────────

export interface RoadmapItem {
  hari: number;
  kegiatan: string;
}

export interface Roadmap {
  id: string;
  judul: string;
  subJudul: string;
  roadmap: RoadmapItem[];
  userId: string;
  createdAt: Date;
}

export type CreateRoadmapInput = Omit<Roadmap, "id" | "createdAt">;

// ─── Learning Plan (20-Hour) ─────────────────────────────────────────────────

export interface LearningSession {
  nomor: number;
  tujuan: string;
  aktivitas: string;
  resource: string;
  review: string;
}

export interface LearningPlan {
  id: string;
  judul: string;
  deskripsi: string;
  topik: string;
  level: string;
  totalJam: number;
  sesi: LearningSession[];
  userId: string;
  createdAt: Date;
}

export type CreateLearningPlanInput = Omit<LearningPlan, "id" | "createdAt">;

// ─── Cheat Sheet ─────────────────────────────────────────────────────────────

export interface CheatSheetKonsep {
  nama: string;
  penjelasan: string;
  contoh: string;
}

export interface CheatSheet {
  id: string;
  judul: string;
  topik: string;
  ringkasan: string;
  konsepUtama: CheatSheetKonsep[];
  tips: string[];
  kesalahanUmum: string[];
  userId: string;
  createdAt: Date;
}

export type CreateCheatSheetInput = Omit<CheatSheet, "id" | "createdAt">;

// ─── Learning Ladder ──────────────────────────────────────────────────────────

export interface LadderLevel {
  level: number;
  nama: string;
  deskripsi: string;
  milestone: string;
  skills: string[];
  project: string;
}

export interface LearningLadder {
  id: string;
  topik: string;
  levels: LadderLevel[];
  userId: string;
  createdAt: Date;
}

export type CreateLearningLadderInput = Omit<
  LearningLadder,
  "id" | "createdAt"
>;

// ─── Resource Finder ─────────────────────────────────────────────────────────

export type ResourceType = "Buku" | "Video" | "Kursus" | "Artikel" | "Tokoh";

export interface Resource {
  nama: string;
  jenis: ResourceType;
  alasan: string;
  link?: string;
}

export interface ResourceCollection {
  id: string;
  topik: string;
  resources: Resource[];
  userId: string;
  createdAt: Date;
}

export type CreateResourceCollectionInput = Omit<
  ResourceCollection,
  "id" | "createdAt"
>;

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  nomor: number;
  pertanyaan: string;
  pilihan: string[]; // 4 pilihan: A, B, C, D
  jawaban: string; // "A" | "B" | "C" | "D"
  penjelasan: string;
}

export interface Quiz {
  id: string;
  topik: string;
  jumlah: number;
  questions: QuizQuestion[];
  userId: string;
  createdAt: Date;
}

export type CreateQuizInput = Omit<Quiz, "id" | "createdAt">;

// ─── Progress Tracking ────────────────────────────────────────────────────────

export interface RoadmapProgress {
  id: string; // "{userId}_{roadmapId}"
  userId: string;
  roadmapId: string;
  completedDays: number[];
  updatedAt: Date;
}
