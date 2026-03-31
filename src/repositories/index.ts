import type { ICourseRepository } from "./ICourseRepository";
import type { ILevelRepository } from "./ILevelRepository";
import type { ISectionRepository } from "./ISectionRepository";
import type { ISubscriptionRepository } from "./ISubscriptionRepository";
import { FirebaseCourseRepository } from "./firebase/FirebaseCourseRepository";
import { FirebaseLevelRepository } from "./firebase/FirebaseLevelRepository";
import { FirebaseSectionRepository } from "./firebase/FirebaseSectionRepository";
import { FirebaseSubscriptionRepository } from "./firebase/FirebaseSubscriptionRepository";

export const courseRepository: ICourseRepository =
  new FirebaseCourseRepository();

export const levelRepository: ILevelRepository =
  new FirebaseLevelRepository();

export const sectionRepository: ISectionRepository =
  new FirebaseSectionRepository();

export const subscriptionRepository: ISubscriptionRepository =
  new FirebaseSubscriptionRepository();
