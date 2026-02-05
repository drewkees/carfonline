import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import FileUploadDialog, { DriveFile } from './FileUploadDialog';

interface UploadedFiles {
  birBusinessRegistration: File | null;
  secRegistration: File | null;
  generalInformation: File | null;
  boardResolution: File | null;
  others: File | null;
}

interface SupportingDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedFiles: UploadedFiles;
  onFileUpload: (docType: keyof UploadedFiles, file: File | null) => void;
  gencode?: string;
}

const SupportingDocumentsDialog: React.FC<SupportingDocumentsDialogProps> = ({
  isOpen,
  onClose,
  uploadedFiles,
  onFileUpload,
  gencode,
}) => {
  const [folderFiles, setFolderFiles] = useState<Record<string, DriveFile[]>>({});
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<keyof UploadedFiles | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !gencode) return;

    const fetchFolderFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/gencode/${gencode}`);
        const data = await res.json();
        setFolderFiles(data);
      } catch (err) {
        console.error('Error fetching gencode folder files', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFolderFiles();
  }, [isOpen, gencode]);

  if (!isOpen) return null;

  const documents = [
    { key: 'birBusinessRegistration' as keyof UploadedFiles, label: 'BIR Business Registration' },
    { key: 'secRegistration' as keyof UploadedFiles, label: 'SEC Registration' },
    { key: 'generalInformation' as keyof UploadedFiles, label: 'General Information Sheet' },
    { key: 'boardResolution' as keyof UploadedFiles, label: 'Board Resolution' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[920px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Supporting Documents</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className={`text-gray-400 hover:text-gray-600 transition-colors ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 font-medium py-10">Loading files...</div>
          ) : (
            <>
              {documents.map((doc) => {
                const hasFiles = folderFiles[doc.key] && folderFiles[doc.key].length > 0;
                return (
                  <div key={doc.key} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-black flex-1">{doc.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentDocType(doc.key);
                        setFileDialogOpen(true);
                      }}
                      disabled={loading}
                      className={`flex items-center space-x-2 px-5 py-2 ${
                        hasFiles ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                      } text-white text-sm font-medium rounded-full transition-colors shadow-sm ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{hasFiles ? 'VIEW' : 'UPLOAD'}</span>
                    </button>
                  </div>
                );
              })}

              {/* Others */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black flex-1">Others</span>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocType('others');
                    setFileDialogOpen(true);
                  }}
                  disabled={loading}
                  className={`flex items-center space-x-2 px-5 py-2 ${
                    folderFiles.others && folderFiles.others.length > 0
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white text-sm font-medium rounded-full transition-colors shadow-sm ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{folderFiles.others && folderFiles.others.length > 0 ? 'VIEW' : 'UPLOAD'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* FileUploadDialog */}
      {fileDialogOpen && currentDocType && (
        <FileUploadDialog
          isOpen={fileDialogOpen}
          docType={currentDocType}
          initialFiles={folderFiles[currentDocType] || []} // pass all files
          onClose={() => setFileDialogOpen(false)}
          onFileSelect={(files) => {
            onFileUpload(currentDocType, files[0] || null);
            setFileDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SupportingDocumentsDialog;
