import type { CheatSheet, CreateCheatSheetInput } from "./types";

export interface ICheatSheetRepository {
  getAllByUserId(userId: string): Promise<CheatSheet[]>;
  getById(id: string): Promise<CheatSheet | null>;
  create(data: CreateCheatSheetInput): Promise<string>;
  delete(id: string): Promise<void>;
}
