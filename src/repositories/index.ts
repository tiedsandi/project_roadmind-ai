// Satu-satunya file yang perlu diubah saat ganti database provider.
//
// Misal ganti ke PostgreSQL:
//   1. Buat: src/repositories/postgres/PostgresRoadmapRepository.ts
//   2. Ubah baris import & export di bawah ini
//   3. Selesai — tidak ada file lain yang perlu disentuh.

import type { IRoadmapRepository } from "./IRoadmapRepository";
import type { ILearningPlanRepository } from "./ILearningPlanRepository";
import type { ICheatSheetRepository } from "./ICheatSheetRepository";
import type { ILearningLadderRepository } from "./ILearningLadderRepository";
import type { IResourceRepository } from "./IResourceRepository";
import type { IQuizRepository } from "./IQuizRepository";
import { FirebaseRoadmapRepository } from "./firebase/FirebaseRoadmapRepository";
import { FirebaseLearningPlanRepository } from "./firebase/FirebaseLearningPlanRepository";
import { FirebaseCheatSheetRepository } from "./firebase/FirebaseCheatSheetRepository";
import { FirebaseLearningLadderRepository } from "./firebase/FirebaseLearningLadderRepository";
import { FirebaseResourceRepository } from "./firebase/FirebaseResourceRepository";
import { FirebaseQuizRepository } from "./firebase/FirebaseQuizRepository";

export const roadmapRepository: IRoadmapRepository =
  new FirebaseRoadmapRepository();

export const learningPlanRepository: ILearningPlanRepository =
  new FirebaseLearningPlanRepository();

export const cheatSheetRepository: ICheatSheetRepository =
  new FirebaseCheatSheetRepository();

export const learningLadderRepository: ILearningLadderRepository =
  new FirebaseLearningLadderRepository();

export const resourceRepository: IResourceRepository =
  new FirebaseResourceRepository();

export const quizRepository: IQuizRepository = new FirebaseQuizRepository();
