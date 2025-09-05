import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Mock API endpoint for testing job status
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Simulate processing delay
    const now = Date.now();
    const jobTimestamp = parseInt(jobId.split('-')[2] || '0');
    const elapsed = now - jobTimestamp;

    if (elapsed < 10000) {
      // Still processing for first 10 seconds
      return NextResponse.json({
        success: true,
        completed: false,
        result: null
      });
    } else if (elapsed < 15000) {
      // Still processing between 10-15 seconds
      return NextResponse.json({
        success: true,
        completed: false,
        result: null
      });
    } else {
      // Simulate a failed completion after 15 seconds (10% chance)
      const shouldFail = Math.random() < 0.1;
      if (shouldFail) {
        return NextResponse.json({
          success: false,
          completed: true,
          result: null
        });
      } else {
        // Return completed with sample data after 15+ seconds
        try {
          const sampleDataPath = path.join(process.cwd(), 'public', 'data', 'sample-extracted-data.json');
          const sampleData = await fs.readFile(sampleDataPath, 'utf8');
          
          return NextResponse.json({
            success: true,
            completed: true,
            result: JSON.parse(sampleData)
          });
        } catch (error) {
          // Fallback sample data
          return NextResponse.json({
            success: true,
            completed: true,
            result: {
              invoiceNumber: 'INV-DEMO-001',
              date: new Date().toISOString().split('T')[0],
              vendorName: 'Demo Vendor',
              totalAmount: 1000.00
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        completed: true,
        result: null
      },
      { status: 500 }
    );
  }
}
