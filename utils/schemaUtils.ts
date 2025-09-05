import { DocumentSchema, NestedSchema, AnySchema } from '@/types';

const SCHEMA_STORAGE_KEY = 'document-intelligence-schema';

export function saveSchemaToLocalStorage(schema: AnySchema): void {
  try {
    localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schema));
  } catch (error) {
    console.error('Failed to save schema to localStorage:', error);
  }
}

export function loadSchemaFromLocalStorage(): AnySchema | null {
  try {
    const stored = localStorage.getItem(SCHEMA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load schema from localStorage:', error);
    return null;
  }
}

export async function loadDefaultSchema(): Promise<AnySchema> {
  try {
    const response = await fetch('/data/default-schema.json');
    return await response.json();
  } catch (error) {
    console.error('Failed to load default schema:', error);
    // Fallback schema
    return {
      documentType: 'document',
      fields: [
        {
          name: 'title',
          type: 'string',
          description: 'Document title',
          required: true
        }
      ]
    };
  }
}

export function validateSchema(schema: DocumentSchema): string[] {
  const errors: string[] = [];
  
  if (!schema.documentType || schema.documentType.trim() === '') {
    errors.push('Document type is required');
  }
  
  if (!schema.fields || schema.fields.length === 0) {
    errors.push('At least one field is required');
  }
  
  schema.fields?.forEach((field, index) => {
    if (!field.name || field.name.trim() === '') {
      errors.push(`Field ${index + 1}: Name is required`);
    }
    if (!field.type) {
      errors.push(`Field ${index + 1}: Type is required`);
    }
    if (!field.description || field.description.trim() === '') {
      errors.push(`Field ${index + 1}: Description is required`);
    }
  });
  
  return errors;
}

// Simple utility functions that don't modify schema structure
export function isNestedSchema(schema: AnySchema): schema is NestedSchema {
  return !('fields' in schema) && typeof schema === 'object';
}

export function isDocumentSchema(schema: AnySchema): schema is DocumentSchema {
  return 'fields' in schema && Array.isArray(schema.fields);
}

export function getSchemaFieldCount(schema: AnySchema): number {
  if (isDocumentSchema(schema)) {
    return schema.fields.length;
  } else if (isNestedSchema(schema)) {
    let count = 0;
    Object.values(schema).forEach(category => {
      if (typeof category === 'object' && category !== null) {
        Object.values(category).forEach(field => {
          if (typeof field === 'object' && field !== null) {
            count += Object.keys(field).length;
          } else {
            count += 1; // Simple field
          }
        });
      }
    });
    return count;
  }
  return 0;
}

export function getSchemaFields(schema: AnySchema): Array<{name: string, description: string, type: string}> {
  if (isDocumentSchema(schema)) {
    return schema.fields.map(field => ({
      name: field.name,
      description: field.description,
      type: field.type
    }));
  } else if (isNestedSchema(schema)) {
    const fields: Array<{name: string, description: string, type: string}> = [];
    Object.entries(schema).forEach(([category, categoryFields]) => {
      if (typeof categoryFields === 'object' && categoryFields !== null) {
        Object.entries(categoryFields).forEach(([fieldName, fieldData]) => {
          if (typeof fieldData === 'object' && fieldData !== null) {
            Object.entries(fieldData).forEach(([subFieldName, description]) => {
              fields.push({
                name: `${category}.${fieldName}.${subFieldName}`,
                description: String(description),
                type: 'string'
              });
            });
          } else {
            fields.push({
              name: `${category}.${fieldName}`,
              description: String(fieldData),
              type: 'string'
            });
          }
        });
      }
    });
    return fields;
  }
  return [];
}