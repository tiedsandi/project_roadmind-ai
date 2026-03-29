// Implementasi Firebase dari IRoadmapRepository.
// Semua detail Firebase (Timestamp, collection name, dll) tersembunyi di sini.
// Kalau ganti ke PostgreSQL: buat file baru di ../postgres/PostgresRoadmapRepository.ts
// lalu ganti 1 baris di ../index.ts — selesai.

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
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import type { IRoadmapRepository } from "../IRoadmapRepository";
import type { CreateRoadmapInput, Roadmap } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseRoadmapRepository implements IRoadmapRepository {
  private readonly col = "blogs";

  private toRoadmap(id: string, data: DocumentData): Roadmap {
    return {
      id,
      judul: data.judul as string,
      subJudul: data.subJudul as string,
      roadmap: (data.roadmap ?? []) as Roadmap["roadmap"],
      userId: data.userId as string,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    };
  }

  async getAllPublic(): Promise<Roadmap[]> {
    const q = query(collection(db, this.col), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toRoadmap(d.id, d.data()),
    );
  }

  async getAllByUserId(userId: string): Promise<Roadmap[]> {
    const q = query(collection(db, this.col), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toRoadmap(d.id, d.data()),
    );
  }

  async getById(id: string): Promise<Roadmap | null> {
    const snap = await getDoc(doc(db, this.col, id));
    if (!snap.exists()) return null;
    return this.toRoadmap(snap.id, snap.data());
  }

  async create(data: CreateRoadmapInput): Promise<string> {
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
