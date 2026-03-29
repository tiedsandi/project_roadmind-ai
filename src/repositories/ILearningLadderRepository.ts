import type { LearningLadder, CreateLearningLadderInput } from "./types";

export interface ILearningLadderRepository {
  getAllByUserId(userId: string): Promise<LearningLadder[]>;
  getById(id: string): Promise<LearningLadder | null>;
  create(data: CreateLearningLadderInput): Promise<string>;
  delete(id: string): Promise<void>;
}
