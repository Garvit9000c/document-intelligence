import { DocumentSchema, APIResponse, ExtractionResult, AnySchema } from '@/types';

// NavaCord API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_NAVACORD_API_URL || 'https://api.navacord.9ai.in';
const API_TOKEN = process.env.NEXT_PUBLIC_NAVACORD_API_TOKEN || '9e4c7a13f6d29b84c51a3d07e9f62c4d8a7b013cfa92de5634b8a15d29e6f7c1';
const USE_DEMO_API = process.env.NEXT_PUBLIC_USE_REAL_API !== 'true';

export async function uploadDocumentWithSchema(
  pdfFile: File | Blob,
  schema: AnySchema
): Promise<APIResponse> {
  if (USE_DEMO_API) {
    // Use demo API for development
    try {
      const formData = new FormData();
      formData.append('file', pdfFile, 'document.pdf');
      formData.append('schema', JSON.stringify(schema));

      const response = await fetch('/api/demo/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Demo upload error:', error);
      throw error;
    }
  }

  // Use NavaCord API for production
  try {
    const formData = new FormData();
    
    // Pass schema as-is to API
    formData.append('input_schema', JSON.stringify(schema));
    formData.append('pdf_file', pdfFile, 'document.pdf');

    const response = await fetch(`${API_BASE_URL}/general/extract/data?tmp_dir=%2Ftmp`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Upload failed: API returned unsuccessful status');
    }

    // Return in our expected format
    return {
      jobId: result.content_access_id,
      status: 'processing',
      message: 'Document uploaded successfully'
    };
  } catch (error) {
    console.error('NavaCord upload error:', error);
    throw error;
  }
}

export async function checkJobStatus(jobId: string): Promise<ExtractionResult> {
  if (USE_DEMO_API) {
    // Use demo API for development
    try {
      const response = await fetch(`/general/fetch/data?content_access_id=${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('Demo API Response:', { jobId, result });
      
      // Handle demo API response format
      if (result.completed) {
        if (result.success) {
          return {
            jobId,
            status: 'completed',
            data: result.result
          };
        } else {
          return {
            jobId,
            status: 'failed',
            error: 'Extraction completed but failed'
          };
        }
      } else {
        // Still processing - regardless of success value
        return {
          jobId,
          status: 'processing',
          data: undefined
        };
      }
    } catch (error) {
      console.error('Demo status check error:', error);
      throw error;
    }
  }

  // Use NavaCord API for production
  try {
    const response = await fetch(`${API_BASE_URL}/general/fetch/data?content_access_id=${jobId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('NavaCord API Response:', { jobId, result });

    // Check completion status first - only check success when completed is true
    if (result.completed) {
      console.log('Job completed, checking success:', result.success);
      // Job is completed, now check if it was successful
      if (result.success) {
        // Successfully completed
        console.log('Job completed successfully');
        return {
          jobId,
          status: 'completed',
          data: result.result
        };
      } else {
        // Completed but failed
        console.log('Job completed but failed');
        return {
          jobId,
          status: 'failed',
          error: 'Extraction completed but failed'
        };
      }
    } else {
      // Still processing - regardless of success value when not completed
      console.log('Job still processing, continuing polling');
      return {
        jobId,
        status: 'processing',
        data: undefined
      };
    }
  } catch (error) {
    console.error('NavaCord status check error:', error);
    return {
      jobId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function pollJobStatus(
  jobId: string,
  onUpdate: (result: ExtractionResult) => void,
  interval: number = 10000
): () => void {
  const intervalId = setInterval(async () => {
    try {
      console.log('Polling job status for:', jobId);
      const result = await checkJobStatus(jobId);
      console.log('Polling result:', result);
      onUpdate(result);
      
      // Only stop polling when completed is true
      if (result.status === 'completed' || result.status === 'failed') {
        console.log('Stopping polling for job:', jobId, 'Status:', result.status);
        clearInterval(intervalId);
      } else {
        console.log('Continuing polling for job:', jobId, 'Status:', result.status);
      }
    } catch (error) {
      console.error('Polling error:', error);
      onUpdate({
        jobId,
        status: 'failed',
        error: 'Failed to check job status'
      });
      clearInterval(intervalId);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}


// Helper function to convert NavaCord response data to our format
function convertNavaCordDataToOurFormat(navaCordData: any): any {
  const result: any = {};
  
  // Flatten the nested NavaCord structure
  Object.keys(navaCordData).forEach(groupKey => {
    const group = navaCordData[groupKey];
    Object.keys(group).forEach(fieldKey => {
      const fieldData = group[fieldKey];
      
      if (fieldData.extracted_fields) {
        // Handle the nested structure from NavaCord
        Object.keys(fieldData.extracted_fields).forEach(extractedKey => {
          const extractedValue = fieldData.extracted_fields[extractedKey];
          
          if (typeof extractedValue === 'object' && extractedValue !== null) {
            // If it's an object, flatten it
            Object.keys(extractedValue).forEach(subKey => {
              result[subKey] = extractedValue[subKey];
            });
          } else {
            result[extractedKey] = extractedValue;
          }
        });
      }
    });
  });
  
  return result;
}

export async function askAIQuestion(
  extractedData: any,
  question: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/general/question/data`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_schema: extractedData,
        input_prompt: question
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI question error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ask AI question'
    };
  }
}
