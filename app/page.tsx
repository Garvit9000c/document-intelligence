'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentSchema, UploadJob, AnySchema } from '@/types';
import { loadSchemaFromLocalStorage, loadDefaultSchema } from '@/utils/schemaUtils';
import { pollJobStatus } from '@/utils/apiUtils';
import SchemaManager from '@/components/SchemaManager';
import DocumentUploader from '@/components/DocumentUploader';
import JobTracker from '@/components/JobTracker';
import { Settings, Upload, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ApiStatus from '@/components/ApiStatus';

export default function Dashboard() {
  const [schema, setSchema] = useState<AnySchema | null>(null);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'upload' | 'jobs'>('upload');
  const [showSchemaManager, setShowSchemaManager] = useState(false);
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());
  const [instructionType, setInstructionType] = useState<'navacord' | 'care-edge' | 'others'>('others');

  const handleJobUpdate = useCallback((job: UploadJob) => {
    console.log('Updating job:', job.id, 'status:', job.status, 'hasData:', !!job.extractedData);
    if (job.extractedData) {
      console.log('Extracted data keys:', Object.keys(job.extractedData));
      console.log('Extracted data:', job.extractedData);
    }
    
    setJobs(prevJobs => {
      const existingIndex = prevJobs.findIndex(j => j.id === job.id);
      if (existingIndex >= 0) {
        const newJobs = [...prevJobs];
        newJobs[existingIndex] = job;
        return newJobs;
      } else {
        return [job, ...prevJobs];
      }
    });
  }, []);

  const startPolling = useCallback((jobId: string) => {
    setPollingJobs(prev => new Set([...prev, jobId]));

    const cleanup = pollJobStatus(
      jobId,
      (result) => {
        const existingJob = jobs.find(j => j.id === jobId);
        if (existingJob) {
          const updatedJob: UploadJob = {
            ...existingJob,
            status: result.status,
            extractedData: result.data,
            error: result.error,
            completedTime: result.status === 'completed' || result.status === 'failed' 
              ? new Date() 
              : undefined
          };
          handleJobUpdate(updatedJob);
        }

        if (result.status === 'completed' || result.status === 'failed') {
          setPollingJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
        }
      }
    );

    setTimeout(() => {
      cleanup();
      setPollingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }, 5 * 60 * 1000);
  }, [jobs, handleJobUpdate]);

  useEffect(() => {
    initializeSchema();
  }, []);

  useEffect(() => {
    jobs.forEach(job => {
      if ((job.status === 'pending' || job.status === 'processing') && !pollingJobs.has(job.id)) {
        startPolling(job.id);
      }
    });
  }, [jobs, pollingJobs, startPolling]);

  const initializeSchema = async () => {
    try {
      let loadedSchema = loadSchemaFromLocalStorage();
      if (!loadedSchema) {
        loadedSchema = await loadDefaultSchema();
      }
      setSchema(loadedSchema);
    } catch (error) {
      console.error('Failed to initialize schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemaUpdate = (updatedSchema: AnySchema) => {
    setSchema(updatedSchema);
    setShowSchemaManager(false);
  };

  const activeJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

    if (loading) {
      return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Document Intelligence...</p>
        </div>
        </div>
      );
    }

        return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Document Intelligence</h1>
                  <p className="text-sm text-gray-500">Extract data from PDFs with AI</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ApiStatus />
              {activeJobs.length > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{activeJobs.length} processing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeJobs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{completedJobs.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-semibold text-gray-900">{failedJobs.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('upload')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveView('jobs')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'jobs'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              View Jobs ({jobs.length})
            </button>
          </div>

          <button
            onClick={() => setShowSchemaManager(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Schema
          </button>
        </div>

        {/* Content */}
          <div className="space-y-6">
          {activeView === 'upload' ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h2>
                <p className="text-sm text-gray-600">
                  Upload PDF documents to extract data using your configured schema.
                </p>
              </div>
              
              {schema ? (
                <DocumentUploader
                  schema={schema}
                  onJobUpdate={handleJobUpdate}
                  instructionType={instructionType}
                />
              ) : (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Schema Configured</h3>
                  <p className="text-gray-600 mb-6">Configure an extraction schema before uploading documents.</p>
                  <button
                    onClick={() => setShowSchemaManager(true)}
                    className="btn-primary"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Schema
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Jobs</h2>
                <p className="text-sm text-gray-600">
                  Monitor the status of your document processing jobs.
                </p>
              </div>

              {jobs.length > 0 ? (
                <JobTracker jobs={jobs} onJobUpdate={handleJobUpdate} instructionType={instructionType} />
              ) : (
                <div className="text-center py-12">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Yet</h3>
                  <p className="text-gray-600 mb-6">Upload your first document to start processing.</p>
                  <button
                    onClick={() => setActiveView('upload')}
                    className="btn-primary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
      </main>

      {/* Schema Manager Modal */}
      {showSchemaManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Schema Configuration</h2>
                <button
                  onClick={() => setShowSchemaManager(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {schema && (
                <SchemaManager
                  schema={schema}
                  onSchemaUpdate={handleSchemaUpdate}
                  instructionType={instructionType}
                  onInstructionTypeChange={setInstructionType}
                />
              )}
            </div>
          </div>
      </div>
      )}
    </div>
  );
}