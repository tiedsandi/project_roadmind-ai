import type { Course, CreateCourseInput } from "./types";

export interface ICourseRepository {
  getAll(): Promise<Course[]>;
  getById(id: string): Promise<Course | null>;
  getByCreatorId(creatorId: string): Promise<Course[]>;
  create(data: CreateCourseInput): Promise<string>;
  update(
    id: string,
    data: Partial<Pick<Course, "title" | "description">>,
  ): Promise<void>;
  delete(id: string): Promise<void>;
  incrementSubscribers(id: string): Promise<void>;
  decrementSubscribers(id: string): Promise<void>;
  incrementLevelCount(id: string): Promise<void>;
  decrementLevelCount(id: string): Promise<void>;
}
