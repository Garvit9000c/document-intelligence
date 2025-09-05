import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { data, ui, title }: { data:any; ui?:any; title?:string } = await req.json();

    if (!data) {
      return new Response(JSON.stringify({ error: "No data provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Import React PDF dynamically to avoid SSR issues
    const ReactPDF = await import("@react-pdf/renderer");
    const React = await import("react");
    const { default: PdfDoc } = await import("@/lib/pdf/engine");

    const pdfBuffer = await ReactPDF.pdf(React.createElement(PdfDoc, { data, ui, title })).toBuffer();

    return new Response(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="report.pdf"'
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate PDF", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
