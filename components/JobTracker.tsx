'use client';

import { useEffect, useState } from 'react';
import { UploadJob } from '@/types';
import { pollJobStatus, askAIQuestion } from '@/utils/apiUtils';
import { generateReactPdf, suggestUiSchema } from '@/utils/reactPdfGenerator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  FileText,
  AlertCircle,
  Eye,
  MessageSquare,
  Send,
  Copy,
  Check
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import ChatModal from './ChatModal';

interface JobTrackerProps {
  jobs: UploadJob[];
  onJobUpdate: (job: UploadJob) => void;
  instructionType: 'navacord' | 'care-edge' | 'others';
}

export default function JobTracker({ jobs, onJobUpdate, instructionType }: JobTrackerProps) {
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<{ [jobId: string]: 'preview' | 'json' }>({});
  const [chatMessages, setChatMessages] = useState<{ [jobId: string]: Array<{ role: 'user' | 'ai'; content: string; timestamp: Date }> }>({});
  const [isAskingAI, setIsAskingAI] = useState<{ [jobId: string]: boolean }>({});
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<{ [jobId: string]: boolean }>({});
  const [activeChatJobId, setActiveChatJobId] = useState<string | null>(null);

  useEffect(() => {
    // Start polling for jobs that are pending or processing
    jobs.forEach(job => {
      if ((job.status === 'pending' || job.status === 'processing') && !pollingJobs.has(job.id)) {
        startPolling(job.id);
      }
    });
  }, [jobs]);


  const startPolling = (jobId: string) => {
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
          onJobUpdate(updatedJob);
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

    // Cleanup after 5 minutes
    setTimeout(() => {
      cleanup();
      setPollingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }, 5 * 60 * 1000);
  };

  const downloadSmartPdf = async (job: UploadJob) => {
    if (!job.extractedData) return;
    
    setIsGeneratingPdf(prev => ({ ...prev, [job.id]: true }));
    
    try {
      const title = `Extracted ${job.fileName.replace('.pdf', '')} Data`;
      const ui = suggestUiSchema(job.extractedData);
      
      await generateReactPdf(job.extractedData, ui, title);
    } catch (error) {
      console.error('Smart PDF generation failed:', error);
      // You could add a toast notification here
    } finally {
      setIsGeneratingPdf(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const setJobViewMode = (jobId: string, mode: 'preview' | 'json') => {
    setViewMode(prev => ({ ...prev, [jobId]: mode }));
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const countExtractedFields = (data: any): number => {
    if (!data || typeof data !== 'object') return 0;
    
    let count = 0;
    
    const countRecursive = (obj: any) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively count nested objects
          countRecursive(value);
        } else {
          // Count primitive values and arrays
          count++;
        }
      });
    };
    
    countRecursive(data);
    return count;
  };

  const flattenDataForPreview = (data: any, prefix: string = ''): Array<{key: string, value: any}> => {
    const result: Array<{key: string, value: any}> = [];
    
    const flatten = (obj: any, currentPrefix: string) => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = currentPrefix ? `${currentPrefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively flatten nested objects
          flatten(value, fullKey);
        } else {
          // Add primitive values and arrays
          result.push({ key: fullKey, value });
        }
      });
    };
    
    flatten(data, prefix);
    return result;
  };

  const askAI = async (jobId: string, question: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.extractedData) return;

    setIsAskingAI(prev => ({ ...prev, [jobId]: true }));

    // Add user message
    const userMessage = { role: 'user' as const, content: question, timestamp: new Date() };
    setChatMessages(prev => ({
      ...prev,
      [jobId]: [...(prev[jobId] || []), userMessage]
    }));

    try {
      const response = await askAIQuestion(job.extractedData, question, instructionType);
      
      if (response.success && response.result) {
        const aiMessage = { role: 'ai' as const, content: response.result, timestamp: new Date() };
        setChatMessages(prev => ({
          ...prev,
          [jobId]: [...(prev[jobId] || []), aiMessage]
        }));
      } else {
        const errorMessage = { role: 'ai' as const, content: `Error: ${response.error || 'Failed to get AI response'}`, timestamp: new Date() };
        setChatMessages(prev => ({
          ...prev,
          [jobId]: [...(prev[jobId] || []), errorMessage]
        }));
      }
    } catch (error) {
      const errorMessage = { role: 'ai' as const, content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp: new Date() };
      setChatMessages(prev => ({
        ...prev,
        [jobId]: [...(prev[jobId] || []), errorMessage]
      }));
    } finally {
      setIsAskingAI(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const openChatModal = (jobId: string) => {
    setActiveChatJobId(jobId);
  };

  const closeChatModal = () => {
    setActiveChatJobId(null);
  };

  const getStatusIcon = (status: UploadJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: UploadJob['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: UploadJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const diffMs = endTime.getTime() - start.getTime();
    const diffSec = Math.round(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHour = Math.round(diffMin / 60);
    return `${diffHour}h`;
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Processing Jobs</h3>
        <p className="text-gray-600">Your document processing jobs will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="card-interactive p-4 slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(job.status)}
              <div>
                <h4 className="text-sm font-medium text-gray-900">{job.fileName}</h4>
                <div className="flex items-center space-x-4 mt-1">
                                          <span className={`status-badge ${
                          job.status === 'completed' ? 'status-completed' :
                          job.status === 'processing' ? 'status-processing' :
                          job.status === 'failed' ? 'status-failed' :
                          'status-pending'
                        }`}>
                          {getStatusText(job.status)}
                        </span>
                  <span className="text-xs text-gray-500">
                    ID: {job.id}
                  </span>
                  <span className="text-xs text-gray-500">
                    Started: {job.uploadTime.toLocaleTimeString()}
                  </span>
                  {job.completedTime && (
                    <span className="text-xs text-gray-500">
                      Duration: {formatDuration(job.uploadTime, job.completedTime)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {job.status === 'completed' && job.extractedData && (
                <>
                  <button
                    onClick={() => downloadSmartPdf(job)}
                    disabled={isGeneratingPdf[job.id]}
                    className="flex items-center space-x-1 text-sm btn-primary disabled:opacity-50"
                  >
                    {isGeneratingPdf[job.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className='text-white'>
                      {isGeneratingPdf[job.id] ? 'Generating...' : 'Download PDF'}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleJobExpansion(job.id)}
                    className="flex items-center space-x-1 text-sm btn-secondary"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{expandedJobs.has(job.id) ? 'Hide' : 'View'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {job.status === 'failed' && job.error && (
            <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-red-800">Error Details</h5>
                  <p className="text-sm text-red-700 mt-1">{job.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Data View */}
          {job.status === 'completed' && job.extractedData && expandedJobs.has(job.id) && (
            <div className="mt-3 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium text-gray-800">
                  Extracted Data
                </h5>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">
                    {countExtractedFields(job.extractedData)} fields extracted
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setJobViewMode(job.id, 'preview')}
                      className={`px-2 py-1 text-xs rounded ${
                        viewMode[job.id] === 'preview' || !viewMode[job.id]
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setJobViewMode(job.id, 'json')}
                      className={`px-2 py-1 text-xs rounded ${
                        viewMode[job.id] === 'json'
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => openChatModal(job.id)}
                      className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      Chat with AI
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Mode */}
              {(viewMode[job.id] === 'preview' || !viewMode[job.id]) && (
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {flattenDataForPreview(job.extractedData)
                      .slice(0, 12) // Show first 12 fields
                      .map(({ key, value }) => (
                        <div key={key} className="text-xs p-2 bg-white rounded border">
                          <span className="font-medium text-gray-800">{key}:</span>
                          <span className="text-gray-700 ml-1">
                            {Array.isArray(value) 
                              ? `[${value.length} items]`
                              : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')
                            }
                          </span>
                        </div>
                      ))}
                  </div>
                  
                  {flattenDataForPreview(job.extractedData).length > 12 && (
                    <p className="text-xs text-gray-600 mt-2">
                      ... and {flattenDataForPreview(job.extractedData).length - 12} more fields
                    </p>
                  )}
                </div>
              )}

              {/* JSON Mode */}
              {viewMode[job.id] === 'json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Raw JSON Data</span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(job.extractedData, null, 2), `json-${job.id}`)}
                      className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      {copiedItems.has(`json-${job.id}`) ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedItems.has(`json-${job.id}`) ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(job.extractedData, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          )}
        </div>
      ))}
      
      {/* Chat Modal */}
      {activeChatJobId && (
        <ChatModal
          isOpen={true}
          onClose={closeChatModal}
          jobId={activeChatJobId}
          jobTitle={jobs.find(j => j.id === activeChatJobId)?.fileName || 'Document'}
          messages={chatMessages[activeChatJobId] || []}
          onSendMessage={(message) => askAI(activeChatJobId, message)}
          isLoading={isAskingAI[activeChatJobId] || false}
        />
      )}
    </div>
  );
}
