import { getDriveApi } from '../../lib/google-auth.js';
import { MAIN_FOLDER_ID } from '../../lib/drive-helpers.js';
import JSZip from 'jszip';

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

    // ✅ Same helper as the working gencode route
    const driveApi = await getDriveApi();

    // Find gencode folder
    const folderRes = await driveApi.files.list({
      q: `'${MAIN_FOLDER_ID}' in parents and name='${gencode}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    if (!folderRes.data.files || folderRes.data.files.length === 0) {
      return res.status(404).json({ error: 'Gencode folder not found' });
    }

    const gencodeFolderId = folderRes.data.files[0].id;

    // List subfolders
    const subfoldersRes = await driveApi.files.list({
      q: `'${gencodeFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    const zip = new JSZip();

    for (const folder of subfoldersRes.data.files || []) {
      // List files in each subfolder
      const filesRes = await driveApi.files.list({
        q: `'${folder.id}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType)',
      });

      for (const file of filesRes.data.files || []) {
        // Download each file as buffer
        const fileRes = await driveApi.files.get(
          { fileId: file.id, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        // ✅ Wrap in Buffer for reliable JSZip handling
        zip.folder(folder.name).file(file.name, Buffer.from(fileRes.data));
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${gencode}-documents.zip"`);
    return res.send(zipBuffer);

  } catch (err) {
    console.error('Error creating zip:', err);
    return res.status(500).json({ error: 'Failed to create zip', details: err.message });
  }
}