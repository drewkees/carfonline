import { getDriveApi } from '../../lib/google-auth.js';
import { MAIN_FOLDER_ID, listFilesInFolder } from '../../lib/drive-helpers.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gencode } = req.query;
    const driveApi = await getDriveApi();

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
      SP2: 'sp2GovernmentId',
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
}