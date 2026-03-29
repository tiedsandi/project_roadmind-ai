import type { Quiz, CreateQuizInput } from "./types";

export interface IQuizRepository {
  getAllByUserId(userId: string): Promise<Quiz[]>;
  getById(id: string): Promise<Quiz | null>;
  create(data: CreateQuizInput): Promise<string>;
  delete(id: string): Promise<void>;
}
