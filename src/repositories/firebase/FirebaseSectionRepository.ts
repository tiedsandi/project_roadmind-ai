import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import type { ISectionRepository } from "../ISectionRepository";
import type { Section, CreateSectionInput, SectionContent } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseSectionRepository implements ISectionRepository {
  private colPath(courseId: string, levelId: string) {
    return `courses/${courseId}/levels/${levelId}/sections`;
  }

  private toSection(
    id: string,
    courseId: string,
    levelId: string,
    data: DocumentData,
  ): Section {
    return {
      id,
      courseId,
      levelId,
      type: data.type as Section["type"],
      content: (data.content as SectionContent) ?? null,
      generatedAt:
        data.generatedAt instanceof Timestamp
          ? data.generatedAt.toDate()
          : null,
    };
  }

  async getAllByLevelId(courseId: string, levelId: string): Promise<Section[]> {
    const snap = await getDocs(collection(db, this.colPath(courseId, levelId)));
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toSection(d.id, courseId, levelId, d.data()),
    );
  }

  async getById(
    courseId: string,
    levelId: string,
    sectionId: string,
  ): Promise<Section | null> {
    const snap = await getDoc(
      doc(db, this.colPath(courseId, levelId), sectionId),
    );
    if (!snap.exists()) return null;
    return this.toSection(snap.id, courseId, levelId, snap.data());
  }

  async create(data: CreateSectionInput): Promise<string> {
    const docRef = await addDoc(
      collection(db, this.colPath(data.courseId, data.levelId)),
      {
        type: data.type,
        content: null,
        generatedAt: null,
      },
    );
    return docRef.id;
  }

  async updateContent(
    courseId: string,
    levelId: string,
    sectionId: string,
    content: SectionContent,
  ): Promise<void> {
    await updateDoc(doc(db, this.colPath(courseId, levelId), sectionId), {
      content,
      generatedAt: serverTimestamp(),
    });
  }

  async delete(
    courseId: string,
    levelId: string,
    sectionId: string,
  ): Promise<void> {
    await deleteDoc(doc(db, this.colPath(courseId, levelId), sectionId));
  }
}
