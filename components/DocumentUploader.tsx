'use client';

import { useState, useRef } from 'react';
import { UploadJob, AnySchema } from '@/types';
import { mergePDFs, validatePDFFile, formatFileSize } from '@/utils/pdfUtils';
import { uploadDocumentWithSchema } from '@/utils/apiUtils';
import { getSchemaFieldCount } from '@/utils/schemaUtils';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2, Plus } from 'lucide-react';

interface DocumentUploaderProps {
  schema: AnySchema;
  onJobUpdate: (job: UploadJob) => void;
}

export default function DocumentUploader({ schema, onJobUpdate }: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach(file => {
      if (validatePDFFile(file)) {
        newFiles.push(file);
      } else {
        errors.push(`${file.name} is not a valid PDF file`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(null), 5000);
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const uploadDocuments = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);

    try {
      let fileToUpload: File | Blob;
      let fileName: string;

      if (files.length === 1) {
        fileToUpload = files[0];
        fileName = files[0].name;
      } else {
        const mergedPdfBytes = await mergePDFs(files);
        fileToUpload = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        fileName = `merged-${files.length}-documents.pdf`;
      }

      const response = await uploadDocumentWithSchema(fileToUpload, schema);
      
      const newJob: UploadJob = {
        id: response.jobId,
        status: 'processing',
        fileName,
        uploadTime: new Date(),
      };

      onJobUpdate(newJob);
      setFiles([]);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      
      const failedJobId = `failed-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      onJobUpdate({
        id: failedJobId,
        status: 'failed',
        fileName: files.length === 1 ? files[0].name : `${files.length} files`,
        uploadTime: new Date(),
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="space-y-6">
      {/* Schema Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Schema Ready</h4>
            <p className="text-sm text-blue-700">
              {getSchemaFieldCount(schema)} fields will be extracted from your documents.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`drop-zone p-8 text-center ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF Documents</h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your PDF files here, or click to browse
            </p>
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Choose Files
            </button>
            
            {files.length > 0 && (
              <button
                onClick={clearFiles}
                disabled={uploading}
                className="btn-ghost"
              >
                Clear All
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            Supports PDF files up to 10MB each. Multiple files will be merged.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length})
            </h4>
            <span className="text-sm text-gray-500">
              Total: {formatFileSize(totalSize)}
            </span>
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Merge Notice */}
          {files.length > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-amber-100 rounded">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Multiple Files</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Files will be merged into a single document for processing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={uploadDocuments}
              disabled={uploading || files.length === 0}
              className="btn-primary"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}