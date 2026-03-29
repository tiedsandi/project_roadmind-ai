import type { CreateLearningPlanInput, LearningPlan } from "./types";

export interface ILearningPlanRepository {
  getAllByUserId(userId: string): Promise<LearningPlan[]>;
  getById(id: string): Promise<LearningPlan | null>;
  create(data: CreateLearningPlanInput): Promise<string>;
  delete(id: string): Promise<void>;
}
