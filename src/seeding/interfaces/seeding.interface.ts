import { User } from "src/user/models/user.model";

export interface IDocumentSeedingService {
  seed(user: User, count: number): Promise<any>;
}

export interface IUserService {
  getAllUsers(): Promise<User[]>;
  deleteAllUsers(): Promise<void>;
  bulkCreate(users: any[]): Promise<void>;
}

export interface IDocumentsService {
  getAllDocuments(): Promise<Document[]>;
  uploadBulkDocuments(documents: any[]): Promise<void>;
  createDocPermissions(permissions: any[]): Promise<void>;
  deleteAllDocuments(): Promise<void>;
}

export interface IIngestionService {
  createBulkIngestionJobs(jobs: any[]): Promise<void>;
  deleteAllIngestionJobs(): Promise<void>;
}

export interface ISeedingResult {
  message: string;
  duration: string;
  total: number;
}