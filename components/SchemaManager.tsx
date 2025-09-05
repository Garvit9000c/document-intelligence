'use client';

import { useState, useEffect } from 'react';
import { AnySchema } from '@/types';
import { saveSchemaToLocalStorage, validateSchema, loadDefaultSchema, isDocumentSchema, getSchemaFieldCount, getSchemaFields } from '@/utils/schemaUtils';
import { Edit2, Save, X, RotateCcw, Copy, Check } from 'lucide-react';

interface SchemaManagerProps {
  schema: AnySchema;
  onSchemaUpdate: (schema: AnySchema) => void;
}

export default function SchemaManager({ schema, onSchemaUpdate }: SchemaManagerProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [jsonText, setJsonText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEditing) return;
      
      if (event.key === 'Escape') {
        cancelEditing();
      } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        saveSchema();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, jsonText]);

  const startEditing = () => {
    setJsonText(JSON.stringify(schema, null, 2));
    setIsEditing(true);
    setErrors([]);
  };

  const cancelEditing = () => {
    setErrors([]);
    setJsonText('');
    setIsEditing(false);
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    // Clear errors when user is typing to avoid distracting them
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const isValidJson = (text: string): boolean => {
    if (!text.trim()) return false;
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = isEditing ? jsonText : JSON.stringify(schema, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const saveSchema = () => {
    let schemaToSave: AnySchema;

    try {
      schemaToSave = JSON.parse(jsonText);
    } catch (error) {
      setErrors(['Invalid JSON format. Please check your syntax.']);
      return;
    }

    if (!schemaToSave) return;

    // Only validate if it's a document schema
    if (isDocumentSchema(schemaToSave)) {
      const validationErrors = validateSchema(schemaToSave);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    // Save the schema as-is without any conversion
    saveSchemaToLocalStorage(schemaToSave);
    onSchemaUpdate(schemaToSave);
    setErrors([]);
    setJsonText('');
    setIsEditing(false);
  };

  const resetToDefault = async () => {
    try {
      const defaultSchema = await loadDefaultSchema();
      saveSchemaToLocalStorage(defaultSchema);
      onSchemaUpdate(defaultSchema);
      setErrors([]);
    } catch (error) {
      setErrors(['Failed to load default schema']);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Schema Configuration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Define what data fields to extract from your PDF documents.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={startEditing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                <span className='text-white'>Edit Schema</span>
              </button>
              <button
                onClick={resetToDefault}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                <span>Reset</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <button
                onClick={saveSchema}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4 mr-2" />
                <span className='text-white'>Save Changes</span>
              </button>
              <button
                onClick={cancelEditing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200 hover:border-gray-400"
              >
                <X className="w-4 h-4 mr-2" />
                <span>Cancel</span>
              </button>
              <div className="text-xs text-gray-500 ml-2">
                Press Esc to cancel
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schema Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Current Schema: {isDocumentSchema(schema) ? schema.documentType : 'Custom JSON Schema'}
        </h4>
        <p className="text-sm text-blue-700">
          {getSchemaFieldCount(schema)} fields will be extracted from uploaded documents.
        </p>
        <details className="mt-2">
          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
            View schema fields
          </summary>
          <div className="mt-2 space-y-1">
            {getSchemaFields(schema).map((field, index) => (
              <div key={index} className="text-xs text-blue-600">
                • {field.name} ({field.type})
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Schema Content - JSON Only */}
      <div className="space-y-4">
        {isEditing ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  JSON Schema Editor
                </label>
                <p className="text-xs text-blue-700">
                  Edit your extraction schema below. Changes are validated in real-time.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Editor</span>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="textarea w-full h-96 font-mono text-sm bg-white border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-inner"
                placeholder="Paste your JSON schema here..."
                autoFocus
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded shadow-sm">
                Lines: {jsonText.split('\n').length}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-xs text-blue-700">
                  The schema will be passed to the API exactly as entered.
                </p>
                {jsonText && (
                  <div className={`text-xs flex items-center space-x-1 ${
                    isValidJson(jsonText) 
                      ? 'text-green-600' 
                      : 'text-amber-600'
                  }`}>
                    {isValidJson(jsonText) ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Valid JSON syntax</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>Invalid JSON syntax</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                ⌘S to save • Esc to cancel
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Schema
            </label>
            <pre className="text-sm text-gray-800 overflow-x-auto bg-white border border-gray-200 rounded p-3">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}