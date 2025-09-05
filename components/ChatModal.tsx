'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  messages,
  onSendMessage,
  isLoading
}: ChatModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = () => {
    if (currentQuestion.trim() && !isLoading) {
      onSendMessage(currentQuestion.trim());
      setCurrentQuestion('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-lg shadow-2xl transition-all duration-300 flex flex-col ${
          isMinimized 
            ? 'w-96 h-16' 
            : 'w-full max-w-4xl h-[80vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">AI Chat</h3>
              <p className="text-xs text-gray-600 truncate max-w-60">{jobTitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-blue-100 rounded text-gray-600 hover:text-gray-800 transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-100 rounded text-gray-600 hover:text-red-600 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Messages Container */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Start a conversation with AI about the extracted data</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ask questions, request summaries, or get insights
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <div className="whitespace-pre-wrap text-white text-sm">{message.content}</div>
                          ) : (
                            <MarkdownRenderer content={message.content} />
                          )}
                          <div 
                            className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 p-3 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about the extracted data..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!currentQuestion.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="text-white hidden sm:inline">Send</span>
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
