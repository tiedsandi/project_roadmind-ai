import {
  DocumentData,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import type { ILevelRepository } from "../ILevelRepository";
import type { Level, CreateLevelInput } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseLevelRepository implements ILevelRepository {
  private colPath(courseId: string) {
    return `courses/${courseId}/levels`;
  }

  private toLevel(id: string, courseId: string, data: DocumentData): Level {
    return {
      id,
      courseId,
      name: data.name as string,
      order: (data.order as number) ?? 0,
    };
  }

  async getAllByCourseId(courseId: string): Promise<Level[]> {
    const q = query(
      collection(db, this.colPath(courseId)),
      orderBy("order", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toLevel(d.id, courseId, d.data()),
    );
  }

  async getById(courseId: string, levelId: string): Promise<Level | null> {
    const snap = await getDoc(doc(db, this.colPath(courseId), levelId));
    if (!snap.exists()) return null;
    return this.toLevel(snap.id, courseId, snap.data());
  }

  async create(data: CreateLevelInput): Promise<string> {
    const docRef = await addDoc(collection(db, this.colPath(data.courseId)), {
      name: data.name,
      order: data.order,
    });
    return docRef.id;
  }

  async update(
    courseId: string,
    levelId: string,
    data: Partial<Pick<Level, "name" | "order">>,
  ): Promise<void> {
    await updateDoc(doc(db, this.colPath(courseId), levelId), data);
  }

  async delete(courseId: string, levelId: string): Promise<void> {
    await deleteDoc(doc(db, this.colPath(courseId), levelId));
  }
}
