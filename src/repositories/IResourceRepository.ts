import type {
  ResourceCollection,
  CreateResourceCollectionInput,
} from "./types";

export interface IResourceRepository {
  getAllByUserId(userId: string): Promise<ResourceCollection[]>;
  getById(id: string): Promise<ResourceCollection | null>;
  create(data: CreateResourceCollectionInput): Promise<string>;
  delete(id: string): Promise<void>;
}
