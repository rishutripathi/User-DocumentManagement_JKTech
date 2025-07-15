export interface IngestionRequest {
  jobId: number;
  documentId: number;
  filePath: string;
  fileName: string;
  mimeType: string;
  callbackUrl: string;
}

export interface IngestionResponse {
  jobId: number;
  status: string;
  message: string;
}

export interface PythonBackendConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

export interface IngestionRequest {}

export interface IngestionResponse {}
