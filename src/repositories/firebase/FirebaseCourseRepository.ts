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
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import type { ICourseRepository } from "../ICourseRepository";
import type { Course, CreateCourseInput } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseCourseRepository implements ICourseRepository {
  private readonly col = "courses";

  private toCourse(id: string, data: DocumentData): Course {
    return {
      id,
      title: data.title as string,
      description: data.description as string,
      creatorId: data.creatorId as string,
      creatorName: data.creatorName as string,
      subscriberCount: (data.subscriberCount as number) ?? 0,
      levelCount: (data.levelCount as number) ?? 0,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    };
  }

  async getAll(): Promise<Course[]> {
    const q = query(collection(db, this.col), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toCourse(d.id, d.data()),
    );
  }

  async getById(id: string): Promise<Course | null> {
    const snap = await getDoc(doc(db, this.col, id));
    if (!snap.exists()) return null;
    return this.toCourse(snap.id, snap.data());
  }

  async getByCreatorId(creatorId: string): Promise<Course[]> {
    const q = query(
      collection(db, this.col),
      where("creatorId", "==", creatorId),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d: QueryDocumentSnapshot<DocumentData>) =>
        this.toCourse(d.id, d.data()),
      )
      .sort((a, b) => {
        const ta =
          (a as unknown as { createdAt?: { seconds: number } }).createdAt
            ?.seconds ?? 0;
        const tb =
          (b as unknown as { createdAt?: { seconds: number } }).createdAt
            ?.seconds ?? 0;
        return tb - ta;
      });
  }

  async create(data: CreateCourseInput): Promise<string> {
    const docRef = await addDoc(collection(db, this.col), {
      ...data,
      subscriberCount: 0,
      levelCount: 0,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async update(
    id: string,
    data: Partial<Pick<Course, "title" | "description">>,
  ): Promise<void> {
    await updateDoc(doc(db, this.col, id), data);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.col, id));
  }

  async incrementSubscribers(id: string): Promise<void> {
    await updateDoc(doc(db, this.col, id), {
      subscriberCount: increment(1),
    });
  }

  async decrementSubscribers(id: string): Promise<void> {
    await updateDoc(doc(db, this.col, id), {
      subscriberCount: increment(-1),
    });
  }

  async incrementLevelCount(id: string): Promise<void> {
    await updateDoc(doc(db, this.col, id), { levelCount: increment(1) });
  }

  async decrementLevelCount(id: string): Promise<void> {
    await updateDoc(doc(db, this.col, id), { levelCount: increment(-1) });
  }
}
