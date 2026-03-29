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
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import type { ILearningPlanRepository } from "../ILearningPlanRepository";
import type { CreateLearningPlanInput, LearningPlan } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseLearningPlanRepository implements ILearningPlanRepository {
  private readonly col = "learning_plans";

  private toLearningPlan(id: string, data: DocumentData): LearningPlan {
    return {
      id,
      judul: data.judul as string,
      deskripsi: data.deskripsi as string,
      topik: data.topik as string,
      level: data.level as string,
      totalJam: data.totalJam as number,
      sesi: (data.sesi ?? []) as LearningPlan["sesi"],
      userId: data.userId as string,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    };
  }

  async getAllByUserId(userId: string): Promise<LearningPlan[]> {
    const q = query(collection(db, this.col), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toLearningPlan(d.id, d.data()),
    );
  }

  async getById(id: string): Promise<LearningPlan | null> {
    const snap = await getDoc(doc(db, this.col, id));
    if (!snap.exists()) return null;
    return this.toLearningPlan(snap.id, snap.data());
  }

  async create(data: CreateLearningPlanInput): Promise<string> {
    const docRef = await addDoc(collection(db, this.col), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.col, id));
  }
}
