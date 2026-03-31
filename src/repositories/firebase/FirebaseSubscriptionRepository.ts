import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import type { ISubscriptionRepository } from "../ISubscriptionRepository";
import type { Subscription } from "../types";
import { db } from "@/lib/firebase";

export class FirebaseSubscriptionRepository implements ISubscriptionRepository {
  private readonly col = "subscriptions";

  private docId(userId: string, courseId: string) {
    return `${userId}_${courseId}`;
  }

  private toSub(id: string, data: DocumentData): Subscription {
    return {
      id,
      userId: data.userId as string,
      courseId: data.courseId as string,
      subscribedAt:
        data.subscribedAt instanceof Timestamp
          ? data.subscribedAt.toDate()
          : new Date(),
    };
  }

  async isSubscribed(userId: string, courseId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, this.col, this.docId(userId, courseId)));
    return snap.exists();
  }

  async subscribe(userId: string, courseId: string): Promise<void> {
    await setDoc(doc(db, this.col, this.docId(userId, courseId)), {
      userId,
      courseId,
      subscribedAt: serverTimestamp(),
    });
  }

  async unsubscribe(userId: string, courseId: string): Promise<void> {
    await deleteDoc(doc(db, this.col, this.docId(userId, courseId)));
  }

  async getByUserId(userId: string): Promise<Subscription[]> {
    const q = query(collection(db, this.col), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>
      this.toSub(d.id, d.data()),
    );
  }
}
