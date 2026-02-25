import React, { useState, useEffect } from 'react';
import { Download, Loader2, FileArchive, CheckCircle2, FolderOpen, X, ChevronRight } from 'lucide-react';
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
  customerType?: string;
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
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadError, setDownloadError] = useState(false);

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

  const documents: { key: keyof UploadedFiles; label: string }[] = isPersonal
    ? [
        { key: 'birBusinessRegistration', label: 'BIR Business Registration' },
        { key: 'sp2GovernmentId', label: 'Any Government ID' },
      ]
    : [
        { key: 'birBusinessRegistration', label: 'BIR Business Registration' },
        { key: 'secRegistration', label: 'SEC Registration of the Corporate Name' },
        { key: 'generalInformation', label: 'Latest General Information Sheet duly acknowledged by SEC' },
        { key: 'boardResolution', label: 'Board Resolution authorizing the signatories herein to transact business' },
      ];

  const allDocs = [...documents, { key: 'others' as keyof UploadedFiles, label: 'Others' }];

  const refreshFolderFiles = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/gencode/${gencode}`);
      const data = await res.json();
      setFolderFiles(data);
    } catch (err) {
      console.error('Error fetching gencode folder files', err);
    }
  };

  const totalFileCount = Object.values(folderFiles).reduce(
    (sum, files) => sum + (Array.isArray(files) ? files.length : 0),
    0
  );

  const uploadedCount = allDocs.filter(d => (folderFiles[d.key] || []).length > 0).length;

  const handleDownloadZip = async () => {
    if (!gencode || downloading) return;
    setDownloading(true);
    setDownloadError(false);
    setDownloadProgress('Preparing files...');

    try {
      const res = await fetch(`${BASE_URL}/api/download-zip/${gencode}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }
      setDownloadProgress('Downloading...');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gencode}-documents.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadProgress('');
    } catch (err: any) {
      console.error('Error downloading zip:', err);
      setDownloadError(true);
      setDownloadProgress('Download failed. Please try again.');
      setTimeout(() => {
        setDownloadProgress('');
        setDownloadError(false);
      }, 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[600px] overflow-hidden flex flex-col max-h-[92vh]"
        style={{ boxShadow: '0 24px 60px -10px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)' }}
      >
        {/* ── Top accent bar ── */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 flex-shrink-0" />

        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 tracking-tight">Supporting Documents</h2>
              {gencode && (
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{gencode}</p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={loading || downloading}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-4 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Progress + Download card ── */}
          {!loading && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {uploadedCount} of {allDocs.length} categories
                  </span>
                  <span className="text-gray-400 text-xs">·</span>
                  <span className="text-xs text-gray-500">{totalFileCount} file{totalFileCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Download ZIP */}
                {totalFileCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={downloading || loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none
                      ${downloading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : downloadError
                          ? 'bg-red-50 text-red-500 border border-red-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-95'
                      }`}
                  >
                    {downloading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" />{downloadProgress || 'Working...'}</>
                    ) : downloadError ? (
                      <><X className="w-3 h-3" />Failed</>
                    ) : (
                      <><Download className="w-3 h-3" />Download ZIP</>
                    )}
                  </button>
                )}
              </div>

              {/* Progress track */}
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-blue-500"
                  style={{ width: `${(uploadedCount / allDocs.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gray-100 mx-6 flex-shrink-0" />

        {/* ── Document list ── */}
        <div className="px-4 py-3 space-y-2 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-9 h-9 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
              <p className="text-sm text-gray-400">Loading documents...</p>
            </div>
          ) : (
            allDocs.map((doc) => {
              const files = folderFiles[doc.key] || [];
              const hasFiles = files.length > 0;

              return (
                <button
                  key={doc.key}
                  type="button"
                  onClick={() => {
                    setCurrentDocType(doc.key);
                    setFileDialogOpen(true);
                  }}
                  disabled={loading || downloading}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group text-left select-none
                    ${hasFiles
                      ? 'bg-green-50 border-green-200 hover:border-green-300 hover:bg-green-50'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]`}
                >
                  {/* Icon bubble */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                    ${hasFiles
                      ? 'bg-green-100'
                      : 'bg-gray-100 group-hover:bg-blue-100'
                    }`}
                  >
                    {hasFiles
                      ? <CheckCircle2 className="w-4.5 h-4.5 text-green-600 w-5 h-5" />
                      : <FolderOpen className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    }
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug truncate
                      ${hasFiles ? 'text-green-800' : 'text-gray-800'}`}
                    >
                      {doc.label}
                    </p>
                    <p className={`text-xs mt-0.5 leading-tight
                      ${hasFiles ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {hasFiles
                        ? `${files.length} file${files.length !== 1 ? 's' : ''} uploaded`
                        : 'No files — tap to upload'
                      }
                    </p>
                  </div>

                  {/* Right badge + arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all
                      ${hasFiles
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}
                    >
                      {hasFiles ? 'View' : 'Upload'}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-all group-hover:translate-x-0.5
                      ${hasFiles ? 'text-green-400' : 'text-gray-300 group-hover:text-blue-400'}`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50">
          <p className="text-xs text-gray-400">
            {loading ? 'Fetching documents...' : `${allDocs.length} document categories`}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || downloading}
            className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
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