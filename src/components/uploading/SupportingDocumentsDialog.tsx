import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import FileUploadDialog, { DriveFile } from './FileUploadDialog';

interface UploadedFiles {
  birBusinessRegistration: File | null;
  sp2GovernmentId: File | null; 
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
  approvestatus?: string;
  customerType?: string; // 'PERSONAL' | 'CORPORATION'
}

const SupportingDocumentsDialog: React.FC<SupportingDocumentsDialogProps> = ({
  isOpen,
  onClose,
  uploadedFiles,
  onFileUpload,
  gencode,
  approvestatus = '',
  customerType = '',
}) => {
  const [folderFiles, setFolderFiles] = useState<Record<string, DriveFile[]>>({});
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<keyof UploadedFiles | null>(null);
  const [loading, setLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  useEffect(() => {
    if (!isOpen || !gencode) return;
    const fetchFolderFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/gencode/${gencode}`);
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

  const isPersonal = customerType?.toUpperCase() === 'P';

  // PERSONAL:    BIR Business Registration, Any Government ID, Others
  // CORPORATION: BIR Business Registration, SEC Registration, General Information Sheet, Board Resolution, Others
  const documents: { key: keyof UploadedFiles; label: string }[] = isPersonal
    ? [
        { key: 'birBusinessRegistration', label: 'BIR Business Registration' },
        { key: 'sp2GovernmentId',         label: 'Any Government ID' },
      ]
    : [
        { key: 'birBusinessRegistration', label: 'BIR Business Registration' },
        { key: 'secRegistration',         label: 'SEC Registration' },
        { key: 'generalInformation',      label: 'General Information Sheet' },
        { key: 'boardResolution',         label: 'Board Resolution' },
      ];

  const refreshFolderFiles = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/gencode/${gencode}`);
      const data = await res.json();
      setFolderFiles(data);
    } catch (err) {
      console.error('Error fetching gencode folder files', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] md:max-w-[920px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base md:text-lg font-bold text-gray-900">Supporting Documents</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className={`text-gray-400 hover:text-gray-600 transition-colors text-xl ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center text-gray-500 font-medium py-10 text-sm md:text-base">
              Loading files...
            </div>
          ) : (
            <>
              {documents.map((doc) => {
                const hasFiles = folderFiles[doc.key] && folderFiles[doc.key].length > 0;
                return (
                  <div
                    key={doc.key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
                  >
                    <span className="text-xs md:text-sm font-bold text-black flex-1">{doc.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentDocType(doc.key);
                        setFileDialogOpen(true);
                      }}
                      disabled={loading}
                      className={`flex items-center justify-center space-x-2 px-4 md:px-5 py-2 ${
                        hasFiles ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                      } text-white text-xs md:text-sm font-medium rounded-full transition-colors shadow-sm ${
                        loading ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      <Upload className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{hasFiles ? 'VIEW' : 'UPLOAD'}</span>
                    </button>
                  </div>
                );
              })}

              {/* Others — always shown for both PERSONAL and CORPORATION */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <span className="text-xs md:text-sm font-bold text-black flex-1">Others</span>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocType('others');
                    setFileDialogOpen(true);
                  }}
                  disabled={loading}
                  className={`flex items-center justify-center space-x-2 px-4 md:px-5 py-2 ${
                    folderFiles.others && folderFiles.others.length > 0
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white text-xs md:text-sm font-medium rounded-full transition-colors shadow-sm ${
                    loading ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <Upload className="w-3 h-3 md:w-4 md:h-4" />
                  <span>
                    {folderFiles.others && folderFiles.others.length > 0 ? 'VIEW' : 'UPLOAD'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors ${
              loading ? 'cursor-not-allowed opacity-50' : ''
            }`}
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
          gencode={gencode}
          approvestatus={approvestatus}
          initialFiles={folderFiles[currentDocType] || []}
          onClose={() => setFileDialogOpen(false)}
          onFileSelect={(files) => {
            onFileUpload(currentDocType, files[0] || null);
            refreshFolderFiles();
          }}
        />
      )}
    </div>
  );
};

export default SupportingDocumentsDialog;