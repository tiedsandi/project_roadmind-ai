import type { Level, CreateLevelInput } from "./types";

export interface ILevelRepository {
  getAllByCourseId(courseId: string): Promise<Level[]>;
  getById(courseId: string, levelId: string): Promise<Level | null>;
  create(data: CreateLevelInput): Promise<string>;
  update(
    courseId: string,
    levelId: string,
    data: Partial<Pick<Level, "name" | "order">>,
  ): Promise<void>;
  delete(courseId: string, levelId: string): Promise<void>;
}
