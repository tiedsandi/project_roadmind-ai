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

import type { IQuizRepository } from "../IQuizRepository";
import type { Quiz, CreateQuizInput } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseQuizRepository implements IQuizRepository {
  private readonly col = "quizzes";

  private toQuiz(id: string, data: DocumentData): Quiz {
    return {
      id,
      topik: data.topik as string,
      jumlah: data.jumlah as number,
      questions: (data.questions ?? []) as Quiz["questions"],
      userId: data.userId as string,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    };
  }

  async getAllByUserId(userId: string): Promise<Quiz[]> {
    const q = query(collection(db, this.col), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toQuiz(d.id, d.data()),
    );
  }

  async getById(id: string): Promise<Quiz | null> {
    const snap = await getDoc(doc(db, this.col, id));
    if (!snap.exists()) return null;
    return this.toQuiz(snap.id, snap.data());
  }

  async create(data: CreateQuizInput): Promise<string> {
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
