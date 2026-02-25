import React, { useState, useEffect } from 'react';
import { X, Upload, File as FileIcon, Trash2, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  iconLink?: string;
  size?: number;
  mimeType?: string;
}

interface FileUploadDialogProps {
  isOpen: boolean;
  docType: string;
  onClose: () => void;
  onFileSelect: (files: (File | DriveFile)[]) => void;
  initialFiles?: DriveFile[];
  gencode?: string;
  approvestatus?: string;
}

export default function FileUploadDialog({
  isOpen,
  docType,
  onClose,
  onFileSelect,
  initialFiles = [],
  gencode,
  approvestatus = '',
}: FileUploadDialogProps) {
  const [uploadedFiles, setUploadedFiles] = useState<(File | DriveFile)[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | DriveFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const canUpload = approvestatus === '';

  const addFilesWithoutDuplicates = (newFilesToAdd: File[]) => {
    setNewFiles((prev) => {
      const combined = [...prev, ...newFilesToAdd];
      return combined.filter((file, index, self) =>
        index === self.findIndex((f) => f.name === file.name)
      );
    });
  };

  useEffect(() => {
    if (isOpen) {
      setUploadedFiles(initialFiles);
      setNewFiles([]);
      setSelectedFile(null);
      setPreviewUrl(null);
      setProgress(0);
      setIsUploading(false);
    }
  }, [isOpen, initialFiles]);

  useEffect(() => {
    if (!selectedFile || !('id' in selectedFile)) {
      setPreviewUrl(null);
      return;
    }

    const fetchDriveFile = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/drive-file/${selectedFile.id}`);
        const blob = await res.blob();
        setPreviewUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error(err);
        setPreviewUrl(null);
      }
    };

    fetchDriveFile();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addFilesWithoutDuplicates(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFilesWithoutDuplicates(files);
  };

  const handleRemoveFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteUploadedFile = async (fileId: string, index: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`${BASE_URL}/api/delete-file/${fileId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gencode, docType }),
      });

      if (!response.ok) throw new Error('Failed to delete file');

      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
      if (selectedFile && 'id' in selectedFile && selectedFile.id === fileId) {
        setSelectedFile(null);
        setPreviewUrl(null);
      }
      toast({ title: 'Success', description: 'File deleted successfully!' });
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: 'Failed to delete file', variant: 'destructive' });
    }
  };

  const handleViewFullScreen = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!selectedFile) return;

    let url: string | null = null;
    if ('type' in selectedFile) {
      url = URL.createObjectURL(selectedFile);
    } else if ('id' in selectedFile && previewUrl) {
      url = previewUrl;
    }
    if (url) window.open(url, '_blank');
  };

  const handleUpload = async () => {
    if (newFiles.length === 0) { alert('No files to upload'); return; }
    if (!gencode) { alert('CARF No. is required for upload'); return; }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('gencode', gencode);
      formData.append('docType', docType);
      newFiles.forEach((file) => formData.append('files', file));

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${BASE_URL}/api/upload-files`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        toast({ title: 'Success', description: 'Files uploaded successfully!' });
        onFileSelect([...uploadedFiles, ...newFiles]);
      }, 500);

    } catch (err: any) {
      setIsUploading(false);
      setProgress(0);
      alert(`Failed to upload files: ${err.message}`);
    }
  };

  const getPreviewContent = () => {
    if (!selectedFile) return null;

    if ('type' in selectedFile && selectedFile.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(selectedFile)} alt={selectedFile.name} className="max-h-full w-full object-contain rounded-lg" />;
    }
    if ('type' in selectedFile && selectedFile.type === 'application/pdf') {
      return <iframe src={URL.createObjectURL(selectedFile)} title={selectedFile.name} className="w-full h-full rounded-lg" />;
    }
    if ('id' in selectedFile && previewUrl) {
      if (selectedFile.mimeType?.startsWith('image/')) {
        return <img src={previewUrl} alt={selectedFile.name} className="max-h-full w-full object-contain rounded-lg" />;
      }
      if (selectedFile.mimeType === 'application/pdf') {
        return <iframe src={previewUrl} title={selectedFile.name} className="w-full h-full rounded-lg" />;
      }
    }
    return (
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <FileIcon className="w-12 h-12" />
        <p className="text-sm font-medium text-gray-600">{selectedFile.name}</p>
        <p className="text-xs text-gray-400">Preview not available</p>
      </div>
    );
  };

  if (!isOpen) return null;

  const allFiles = [...uploadedFiles, ...newFiles];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-[70]">
      <div
        className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[1200px] h-[90vh] md:h-[82vh] flex flex-col md:flex-row overflow-hidden"
        style={{ boxShadow: '0 24px 60px -10px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)' }}
      >
        {/* ── Left: Preview panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-gray-100">
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 flex-shrink-0" />

          {/* Left header */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 leading-tight">Attachment Preview</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{docType}</p>
              </div>
            </div>

            {selectedFile && (
              <button
                onClick={handleViewFullScreen}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full
              </button>
            )}
          </div>

          <div className="h-px bg-gray-100 mx-5 flex-shrink-0" />

          {/* Drop zone / preview area */}
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden min-h-0">
            <div
              className={`flex-1 rounded-xl border-2 border-dashed flex items-center justify-center transition-all relative overflow-hidden
                ${canUpload ? 'cursor-pointer' : 'cursor-default'}
                ${isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : selectedFile
                    ? 'border-gray-200 bg-gray-50'
                    : canUpload
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 bg-gray-50/50'
                      : 'border-gray-200 bg-gray-50/50'
                }`}
              onClick={(e) => {
                if (!canUpload) return;
                if (!selectedFile || e.target === e.currentTarget) {
                  document.getElementById('file-input')?.click();
                }
              }}
              onDragOver={(e) => {
                if (!canUpload) return;
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                if (!canUpload) return;
                handleDrop(e);
              }}
            >
              {selectedFile ? (
                <div className="w-full h-full flex items-center justify-center p-3">
                  {getPreviewContent()}
                </div>
              ) : canUpload ? (
                <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Drop files here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  </div>
                  {isDragging && (
                    <p className="text-xs font-semibold text-blue-500 animate-pulse">Release to add files</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FileIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600">View only</p>
                    <p className="text-xs text-gray-400 mt-1">Select a file on the right to preview</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {isUploading && (
              <div className="flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    <span className="text-sm font-medium text-gray-700">Uploading files...</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Browse button */}
            {canUpload && (
              <button
                type="button"
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={isUploading}
                className="flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Browse & Select Files
              </button>
            )}

            {canUpload && (
              <input
                type="file"
                id="file-input"
                className="hidden"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            )}
          </div>
        </div>

        {/* ── Right: File list panel ── */}
        <div className="w-full md:w-80 flex flex-col overflow-hidden bg-gray-50 max-h-[45vh] md:max-h-none">
          {/* Right header */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                Files
                <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {allFiles.length}
                </span>
              </h3>
              {newFiles.length > 0 && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  {newFiles.length} pending upload
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-px bg-gray-200 mx-5 flex-shrink-0" />

          {/* File list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 min-h-0">
            {allFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <FileIcon className="w-8 h-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No files yet</p>
                <p className="text-xs text-gray-400">
                  {canUpload ? 'Add files using the left panel' : 'No documents uploaded'}
                </p>
              </div>
            )}

            {/* Saved Drive files */}
            {uploadedFiles.map((file, idx) => (
              <button
                key={`drive-${idx}`}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all group
                  ${selectedFile && 'id' in selectedFile && 'id' in file && selectedFile.id === file.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/40'
                  }`}
              >
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-green-600 mt-0.5">Saved</p>
                </div>
                {canUpload && 'id' in file && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteUploadedFile(file.id, idx); }}
                    disabled={isUploading}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-30 flex-shrink-0"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))}

            {/* New pending files */}
            {newFiles.map((file, idx) => (
              <button
                key={`new-${idx}`}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all group
                  ${selectedFile && 'name' in selectedFile && selectedFile.name === file.name && !('id' in selectedFile)
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-gray-200 hover:border-amber-200 hover:bg-amber-50/40'
                  }`}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-amber-600 mt-0.5">Pending upload</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                  disabled={isUploading}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-30 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>

          {/* Footer actions */}
          <div className="px-4 py-4 border-t border-gray-200 flex flex-col gap-2 flex-shrink-0">
            {canUpload && (
              <button
                onClick={handleUpload}
                disabled={newFiles.length === 0 || isUploading || !gencode}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" />Upload {newFiles.length > 0 ? `(${newFiles.length})` : ''}</>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isUploading}
              className="w-full py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {canUpload ? 'Close' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}