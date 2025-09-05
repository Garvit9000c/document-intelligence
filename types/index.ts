export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  description: string;
  required: boolean;
  itemSchema?: Record<string, string>;
}

export interface DocumentSchema {
  documentType: string;
  fields: SchemaField[];
}

// Support for nested schema format (API format)
export interface NestedSchema {
  [key: string]: {
    [fieldName: string]: {
      [subFieldName: string]: string;
    };
  };
}

// Union type to support both formats
export type AnySchema = DocumentSchema | NestedSchema;

export interface UploadJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  uploadTime: Date;
  completedTime?: Date;
  extractedData?: any;
  error?: string;
}

export interface APIResponse {
  jobId: string;
  status: string;
  message?: string;
}

export interface ExtractionResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data?: any;
  error?: string;
}
