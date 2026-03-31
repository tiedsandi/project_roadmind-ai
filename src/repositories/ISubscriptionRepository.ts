import type { Subscription } from "./types";

export interface ISubscriptionRepository {
  isSubscribed(userId: string, courseId: string): Promise<boolean>;
  subscribe(userId: string, courseId: string): Promise<void>;
  unsubscribe(userId: string, courseId: string): Promise<void>;
  getByUserId(userId: string): Promise<Subscription[]>;
}
