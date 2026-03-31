import type { Section, CreateSectionInput, SectionContent } from "./types";

export interface ISectionRepository {
  getAllByLevelId(courseId: string, levelId: string): Promise<Section[]>;
  getById(
    courseId: string,
    levelId: string,
    sectionId: string,
  ): Promise<Section | null>;
  create(data: CreateSectionInput): Promise<string>;
  updateContent(
    courseId: string,
    levelId: string,
    sectionId: string,
    content: SectionContent,
  ): Promise<void>;
  delete(courseId: string, levelId: string, sectionId: string): Promise<void>;
}
