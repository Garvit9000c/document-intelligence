# Document Intelligence Dashboard

A Next.js dashboard for AI-powered document processing and data extraction with schema management capabilities.

## Features

- **Schema Management**: Create, edit, and manage extraction schemas with local storage
- **Multi-PDF Upload**: Upload and automatically merge multiple PDF documents
- **Real-time Processing**: Track job status with live updates
- **Structured PDF Export**: Generate beautiful PDFs from extracted data using jsPDF AutoTable
- **Responsive Design**: Modern, clean interface built with Tailwind CSS

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Set to 'true' to use the real NavaCord API, leave empty or 'false' to use demo API
   NEXT_PUBLIC_USE_REAL_API=false
   
   # NavaCord API Configuration (only needed if using real API)
   NEXT_PUBLIC_NAVACORD_API_URL=https://api.navacord.9ai.in
   NEXT_PUBLIC_NAVACORD_API_TOKEN=your_api_token_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Architecture

### Components

- **SchemaManager**: Handles schema creation, editing, and local storage
- **DocumentUploader**: Multi-file PDF upload with drag-and-drop and merging
- **JobTracker**: Real-time job status monitoring and result display

### Utils

- **pdfUtils**: PDF merging and validation using pdf-lib
- **schemaUtils**: Schema management and local storage operations
- **apiUtils**: API communication and job status polling
- **pdfGenerator**: PDF generation from extracted data using jsPDF AutoTable

### API Integration

The dashboard supports two API modes:

#### NavaCord API (Production)
When `NEXT_PUBLIC_USE_REAL_API=true`, the dashboard integrates with NavaCord's document extraction API:

1. **POST /pdf/extract/new/schema**
   - Accepts: FormData with 'pdf_file' and 'extraction_schema'
   - Returns: `{ success: boolean, content_access_id: string }`

2. **GET /pdf/data/fetch**
   - Query param: `content_access_id`
   - Returns: `{ completed: boolean, success: boolean, result: object }`

#### Demo API (Development)
When `NEXT_PUBLIC_USE_REAL_API=false` or unset, uses local mock endpoints:

1. **POST /api/demo/upload**
   - Accepts: FormData with 'file' and 'schema'
   - Returns: `{ jobId: string, status: string, message?: string }`

2. **GET /api/demo/status/{jobId}**
   - Returns: `{ jobId: string, status: string, data?: any, error?: string }`

### Schema Format

#### Internal Schema Format
Our internal schema format:
```json
{
  "documentType": "invoice",
  "fields": [
    {
      "name": "invoiceNumber",
      "type": "string",
      "description": "Invoice number or ID",
      "required": true
    }
  ]
}
```

#### NavaCord Schema Format
When using the NavaCord API, schemas are automatically converted to:
```json
{
  "Organisation": {
    "Invoice_No": {
      "Invoice_Number": "Invoice Number"
    },
    "Organisation_Name": {
      "Organisation_Name": "Organisation_Name"
    }
  }
}
```

The conversion groups fields by document type and creates nested objects for each field.

### Data Flow

1. User creates/edits schema in Schema Manager
2. Schema is saved to localStorage and passed to API calls
3. User uploads PDF(s) which are merged if multiple
4. API call includes merged PDF + current schema
5. Job tracking polls API for status updates
6. When complete, extracted data can be downloaded as structured PDF

## Customization

### Adding New Field Types

Edit `types/index.ts` to add new field types to the `SchemaField` interface.

### Changing PDF Output Format

Modify `utils/pdfGenerator.ts` to customize the PDF generation layout and styling.

### API Configuration

Update `utils/apiUtils.ts` to match your API endpoint structure and authentication requirements.

## Dependencies

- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **jsPDF + jsPDF-AutoTable**: PDF generation
- **pdf-lib**: PDF merging
- **Lucide React**: Icons

## Browser Support

Modern browsers with ES2020+ support. File handling requires browsers that support:
- File API
- FormData
- Promise/async-await
- Local Storage

## Development Notes

- Schema data is stored in browser localStorage
- Default schema loads from `/public/data/default-schema.json`
- PDF merging happens client-side for privacy
- Real-time updates use polling (no WebSocket required)

## Production Deployment

1. Build the project: `npm run build`
2. Set up your API endpoints
3. Configure environment variables
4. Deploy to your preferred platform (Vercel, Netlify, etc.)

## License

MIT License - feel free to use this for your own projects!
