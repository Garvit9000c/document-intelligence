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
  instructionType?: 'navacord' | 'care-edge' | 'others';
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

// PDF Engine Types
export interface UiSchema {
  /** Hide fields by json-path (e.g., "internal.secret") */
  hide?: string[];
  /** Labels by path */
  labels?: Record<string, string>;
  /** Order within an object path: ["name","email","phone"] */
  order?: Record<string, string[]>;
  /** Format by path: "currency" | "number" | "date:YYYY-MM-DD" | custom function name */
  format?: Record<string, string>;
  /** Force renderer by path: "table" | "list" | "kv" | "image" | "markdown" */
  as?: Record<string, "table"|"list"|"kv"|"image"|"markdown">;
  /** Table columns for an array path: ["a","b.c","d"] -> keys */
  tableCols?: Record<string, string[]>;
  /** Section titles for object paths */
  titles?: Record<string, string>;
}
