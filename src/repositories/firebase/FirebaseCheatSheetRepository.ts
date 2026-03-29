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

import type { ICheatSheetRepository } from "../ICheatSheetRepository";
import type { CheatSheet, CreateCheatSheetInput } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseCheatSheetRepository implements ICheatSheetRepository {
  private readonly col = "cheat_sheets";

  private toCheatSheet(id: string, data: DocumentData): CheatSheet {
    return {
      id,
      judul: data.judul as string,
      topik: data.topik as string,
      ringkasan: data.ringkasan as string,
      konsepUtama: (data.konsepUtama ?? []) as CheatSheet["konsepUtama"],
      tips: (data.tips ?? []) as string[],
      kesalahanUmum: (data.kesalahanUmum ?? []) as string[],
      userId: data.userId as string,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    };
  }

  async getAllByUserId(userId: string): Promise<CheatSheet[]> {
    const q = query(collection(db, this.col), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toCheatSheet(d.id, d.data()),
    );
  }

  async getById(id: string): Promise<CheatSheet | null> {
    const snap = await getDoc(doc(db, this.col, id));
    if (!snap.exists()) return null;
    return this.toCheatSheet(snap.id, snap.data());
  }

  async create(data: CreateCheatSheetInput): Promise<string> {
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
