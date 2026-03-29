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

import type { IResourceRepository } from "../IResourceRepository";
import type {
  ResourceCollection,
  CreateResourceCollectionInput,
} from "../types";
import { db } from "@/lib/firebase";

export class FirebaseResourceRepository implements IResourceRepository {
  private readonly col = "resources";

  private toCollection(id: string, data: DocumentData): ResourceCollection {
    return {
      id,
      topik: data.topik as string,
      resources: (data.resources ?? []) as ResourceCollection["resources"],
      userId: data.userId as string,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    };
  }

  async getAllByUserId(userId: string): Promise<ResourceCollection[]> {
    const q = query(collection(db, this.col), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toCollection(d.id, d.data()),
    );
  }

  async getById(id: string): Promise<ResourceCollection | null> {
    const snap = await getDoc(doc(db, this.col, id));
    if (!snap.exists()) return null;
    return this.toCollection(snap.id, snap.data());
  }

  async create(data: CreateResourceCollectionInput): Promise<string> {
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
