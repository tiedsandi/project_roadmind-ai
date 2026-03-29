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

import type { ILearningLadderRepository } from "../ILearningLadderRepository";
import type { LearningLadder, CreateLearningLadderInput } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseLearningLadderRepository implements ILearningLadderRepository {
  private readonly col = "learning_ladders";

  private toLadder(id: string, data: DocumentData): LearningLadder {
    return {
      id,
      topik: data.topik as string,
      levels: (data.levels ?? []) as LearningLadder["levels"],
      userId: data.userId as string,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    };
  }

  async getAllByUserId(userId: string): Promise<LearningLadder[]> {
    const q = query(collection(db, this.col), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toLadder(d.id, d.data()),
    );
  }

  async getById(id: string): Promise<LearningLadder | null> {
    const snap = await getDoc(doc(db, this.col, id));
    if (!snap.exists()) return null;
    return this.toLadder(snap.id, snap.data());
  }

  async create(data: CreateLearningLadderInput): Promise<string> {
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
