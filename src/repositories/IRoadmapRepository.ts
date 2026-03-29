// Kontrak/interface yang harus dipenuhi oleh SEMUA provider database.
// Kalau ganti ke PostgreSQL, buat class baru yang implements interface ini
// tanpa perlu ubah satu pun baris di halaman atau API route.

import type { CreateRoadmapInput, Roadmap } from "./types";

export interface IRoadmapRepository {
  getAllPublic(): Promise<Roadmap[]>;
  getAllByUserId(userId: string): Promise<Roadmap[]>;
  getById(id: string): Promise<Roadmap | null>;
  create(data: CreateRoadmapInput): Promise<string>; // returns doc id
  delete(id: string): Promise<void>;
}
