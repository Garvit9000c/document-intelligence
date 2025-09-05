import { NextRequest, NextResponse } from 'next/server';

// Mock API endpoint for testing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const schema = formData.get('schema') as string;

    if (!file || !schema) {
      return NextResponse.json(
        { error: 'Missing file or schema' },
        { status: 400 }
      );
    }

    // Generate a mock job ID
    const jobId = `demo-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate API response
    return NextResponse.json({
      jobId,
      status: 'processing',
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
