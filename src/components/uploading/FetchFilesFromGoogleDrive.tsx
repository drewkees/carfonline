// FetchFilesFromGoogleDrive.tsx
import React, { useEffect, useState } from 'react';
import { File } from 'lucide-react';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string; // link to preview or view
}

interface FetchFilesFromGoogleDriveProps {
  onSelectFile?: (file: DriveFile) => void; // callback when a file is selected
}

export default function FetchFilesFromGoogleDrive({ onSelectFile }: FetchFilesFromGoogleDriveProps) {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const fetchDriveFiles = async () => {
      await new Promise((r) => setTimeout(r, 1000)); // simulate delay
      const files: DriveFile[] = [
        {
          id: '1',
          name: 'DriveDocument1.pdf',
          mimeType: 'application/pdf',
          webViewLink: 'https://drive.google.com/file/d/1/view',
        },
        {
          id: '2',
          name: 'DriveImage1.jpg',
          mimeType: 'image/jpeg',
          webViewLink: 'https://drive.google.com/file/d/2/view',
        },
      ];
      setDriveFiles(files);
      setLoading(false);
    };

    fetchDriveFiles();
  }, []);

  if (loading) return <p className="text-gray-500 text-center mt-6">Loading Google Drive files...</p>;

  if (driveFiles.length === 0)
    return <p className="text-gray-400 text-center mt-6">No files in Google Drive.</p>;

  return (
    <div className="space-y-4 overflow-y-auto max-h-[60vh]">
      {driveFiles.map((file) => (
        <a
          key={file.id}
          href={file.webViewLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => onSelectFile && onSelectFile(file)}
          className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded flex items-center justify-center flex-shrink-0">
            <File className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-800 truncate">{file.name}</p>
            <p className="text-sm text-gray-500">{file.mimeType}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
