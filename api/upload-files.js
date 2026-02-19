import multer from 'multer';
import { createGencodeStructure, uploadFileToDrive } from '../lib/drive-helpers.js';

const upload = multer({ storage: multer.memoryStorage() });

// Helper to run middleware in serverless
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.array('files'));

    const { gencode, docType } = req.body;
    const files = req.files;

    if (!gencode || !docType || !files || files.length === 0) {
      return res.status(400).json({ error: 'Missing gencode, docType, or files' });
    }

    console.log(`Uploading ${files.length} file(s) for gencode: ${gencode}, docType: ${docType}`);

    // Folder mapping
    const folderMapping = {
      birBusinessRegistration: 'SP1',
      sp2GovernmentId: 'SP2',
      secRegistration: 'SP3',
      generalInformation: 'SP4',
      boardResolution: 'SP5',
      others: 'SP6',
    };
    alert(docType);
    const spFolderName = folderMapping[docType];
    if (!spFolderName) {
      return res.status(400).json({ error: 'Invalid docType' });
    }

    // Create folder structure
    const folderStructure = await createGencodeStructure(gencode);
    const targetFolderId = folderStructure[spFolderName];

    // Upload files
    const uploadedFiles = [];
    for (const file of files) {
      const uploadedFile = await uploadFileToDrive(file, targetFolderId);
      uploadedFiles.push(uploadedFile);
    }

    res.json({
      success: true,
      gencode,
      docType,
      uploadedFiles,
    });
  } catch (err) {
    console.error('Error uploading files:', err);
    res.status(500).json({ error: 'Failed to upload files', details: err.message });
  }
}