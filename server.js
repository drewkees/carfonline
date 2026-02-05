import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';

const app = express();
const PORT = 3001;

// Main parent folder ID
const MAIN_FOLDER_ID = '15GyW7ZZt-XFfdze96pJmsoNSgdU7PLmT';

app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());

// Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

// -----------------------------
// Helper: list files in a folder
const listFilesInFolder = async (folderId) => {
  const client = await auth.getClient();
  const driveApi = google.drive({ version: 'v3', auth: client });
  const res = await driveApi.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size)',
    pageSize: 50,
  });
  return res.data.files || [];
};

// -----------------------------
// Get all subfolder files for a gencode
app.get('/api/gencode/:gencode', async (req, res) => {
  try {
    const gencode = req.params.gencode;
    const client = await auth.getClient();
    const driveApi = google.drive({ version: 'v3', auth: client });

    // Find the gencode folder
    const folderRes = await driveApi.files.list({
      q: `'${MAIN_FOLDER_ID}' in parents and name='${gencode}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    if (!folderRes.data.files || folderRes.data.files.length === 0) {
      return res.json({
        birBusinessRegistration: [],
        secRegistration: [],
        generalInformation: [],
        boardResolution: [],
        others: [],
      });
    }

    const gencodeFolderId = folderRes.data.files[0].id;

    // List subfolders
    const subfoldersRes = await driveApi.files.list({
      q: `'${gencodeFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    // Map SP folders to document keys
    const folderMapping = {
      SP1: 'birBusinessRegistration',
      SP3: 'secRegistration',
      SP4: 'generalInformation',
      SP5: 'boardResolution',
      SP6: 'others',
    };

    const result = {
      birBusinessRegistration: [],
      secRegistration: [],
      generalInformation: [],
      boardResolution: [],
      others: [],
    };

    for (const folder of subfoldersRes.data.files || []) {
      const docKey = folderMapping[folder.name];
      if (docKey) {
        const files = await listFilesInFolder(folder.id);
        result[docKey] = files;
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch gencode folder files' });
  }
});

// -----------------------------
// Stream a file by ID
app.get('/api/drive-file/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const client = await auth.getClient();
    const driveApi = google.drive({ version: 'v3', auth: client });

    const { data: file } = await driveApi.files.get({ fileId, fields: 'name,mimeType' });

    const stream = await driveApi.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);

    stream.data.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
