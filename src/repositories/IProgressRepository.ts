import type { RoadmapProgress } from "./types";

export interface IProgressRepository {
  get(userId: string, roadmapId: string): Promise<RoadmapProgress | null>;
  save(
    userId: string,
    roadmapId: string,
    completedDays: number[],
  ): Promise<void>;
}
