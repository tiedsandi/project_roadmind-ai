import {
  DocumentData,
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import type { IProgressRepository } from "../IProgressRepository";
import type { RoadmapProgress } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseProgressRepository implements IProgressRepository {
  private readonly col = "roadmap_progress";

  private docId(userId: string, roadmapId: string) {
    return `${userId}_${roadmapId}`;
  }

  private toProgress(id: string, data: DocumentData): RoadmapProgress {
    return {
      id,
      userId: data.userId as string,
      roadmapId: data.roadmapId as string,
      completedDays: (data.completedDays ?? []) as number[],
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(),
    };
  }

  async get(
    userId: string,
    roadmapId: string,
  ): Promise<RoadmapProgress | null> {
    const snap = await getDoc(doc(db, this.col, this.docId(userId, roadmapId)));
    if (!snap.exists()) return null;
    return this.toProgress(snap.id, snap.data());
  }

  async save(
    userId: string,
    roadmapId: string,
    completedDays: number[],
  ): Promise<void> {
    await setDoc(
      doc(db, this.col, this.docId(userId, roadmapId)),
      {
        userId,
        roadmapId,
        completedDays,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}
