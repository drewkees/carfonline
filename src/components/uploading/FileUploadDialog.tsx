import React, { useState, useEffect } from 'react';
import { X, Upload, File as FileIcon } from 'lucide-react';

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
  docType: string; // SP1, SP3, etc.
  onClose: () => void;
  onFileSelect: (files: (File | DriveFile)[]) => void;
  initialFiles?: DriveFile[]; // existing folder files
}

export default function FileUploadDialog({
  isOpen,
  docType,
  onClose,
  onFileSelect,
  initialFiles = [],
}: FileUploadDialogProps) {
  const [uploadedFiles, setUploadedFiles] = useState<(File | DriveFile)[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | DriveFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFilesWithoutDuplicates = (newFiles: (File | DriveFile)[]) => {
    setUploadedFiles((prev) => {
      const combined = [...newFiles, ...prev];
      return combined.filter((file, index, self) =>
        index === self.findIndex((f) => f.name === file.name)
      );
    });
  };

  useEffect(() => {
    if (isOpen) {
      setUploadedFiles(initialFiles);
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
        const res = await fetch(`http://localhost:3001/api/drive-file/${selectedFile.id}`);
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

  const handleUpload = () => {
    if (!uploadedFiles.length) return;
    setIsUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          onFileSelect(uploadedFiles);
          onClose();
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const getPreviewContent = () => {
    if (!selectedFile) return null;
    if ('type' in selectedFile && selectedFile.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(selectedFile)} alt={selectedFile.name} className="max-h-full w-full object-contain" />;
    }
    if ('type' in selectedFile && selectedFile.type === 'application/pdf') {
      return <iframe src={URL.createObjectURL(selectedFile)} title={selectedFile.name} className="w-full h-full" />;
    }
    if ('id' in selectedFile && previewUrl) {
      if (selectedFile.mimeType?.startsWith('image/')) {
        return <img src={previewUrl} alt={selectedFile.name} className="max-h-full w-full object-contain" />;
      }
      if (selectedFile.mimeType === 'application/pdf') {
        return <iframe src={previewUrl} title={selectedFile.name} className="w-full h-full" />;
      }
      return <p>{selectedFile.name}</p>;
    }
    return <p>{selectedFile.name}</p>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[1400px] h-[85vh] flex overflow-hidden">
        {/* Left: Preview & Upload */}
        <div className="flex-1 p-12 border-r border-gray-200 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-4">
              <Upload className="w-7 h-7" />
              Attachment
            </h2>
          </div>

        <div className="flex-1 flex flex-col justify-between items-center overflow-auto">
            {/* Drag / Preview area */}
            <div
                className="w-full border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 cursor-pointer flex flex-col justify-center items-center mb-4 flex-1"
                onClick={() => document.getElementById('file-input')?.click()}
            >
                {selectedFile ? (
                getPreviewContent()
                ) : (
                <>
                    <div className="w-40 h-40 bg-green-500 rounded-full flex items-center justify-center mb-6">
                    <Upload className="w-20 h-20 text-white" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1 text-lg">Drag files here</p>
                    <p className="text-gray-500 text-base">or click to browse</p>
                </>
                )}
            </div>

            {/* Upload button stays at bottom */}
            <button
                onClick={() => document.getElementById('file-input')?.click()}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                <Upload className="w-5 h-5" />
                Upload Files
            </button>

            <input type="file" id="file-input" className="hidden" multiple onChange={handleFileSelect} />
        </div>


          {isUploading && (
            <div className="mt-6 w-full">
              <p className="text-lg text-gray-700 mb-2 font-medium">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Uploaded & Drive files */}
        <div className="w-96 bg-gray-50 p-10 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {uploadedFiles.length === 0 && (
              <p className="text-gray-400 text-center py-20">No files available</p>
            )}

            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-5 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedFile(file)}
              >
                <FileIcon className="w-6 h-6 text-blue-600" />
                <p className="truncate">{file.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadedFiles.length || isUploading}
              className="flex-1 px-6 py-4 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
