import { getDriveApi } from './google-auth.js';
import { Readable } from 'stream';

export const MAIN_FOLDER_ID = process.env.DRIVE_MAIN_FOLDER_ID || '1H1tfPxV77LqQ_De4P04Xy2FSbHCe2rwN';

export async function listFilesInFolder(folderId) {
  const driveApi = await getDriveApi();
  const res = await driveApi.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size)',
    pageSize: 50,
  });
  return res.data.files || [];
}

export async function findOrCreateFolder(parentId, folderName) {
  const driveApi = await getDriveApi();

  // Try to find existing folder
  const searchRes = await driveApi.files.list({
    q: `'${parentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    return searchRes.data.files[0].id;
  }

  // Create new folder
  const createRes = await driveApi.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  return createRes.data.id;
}

export async function createGencodeStructure(gencode) {
  // Create main gencode folder
  const gencodeFolderId = await findOrCreateFolder(MAIN_FOLDER_ID, gencode);

  // Create SP subfolders
  const spFolders = ['SP1','SP2','SP3', 'SP4', 'SP5', 'SP6'];
  const folderIds = {};

  for (const spFolder of spFolders) {
    const folderId = await findOrCreateFolder(gencodeFolderId, spFolder);
    folderIds[spFolder] = folderId;
  }

  return { gencodeFolderId, ...folderIds };
}

export async function uploadFileToDrive(file, targetFolderId) {
  const driveApi = await getDriveApi();

  const bufferStream = new Readable();
  bufferStream.push(file.buffer);
  bufferStream.push(null);

  const fileMetadata = {
    name: file.originalname,
    parents: [targetFolderId],
  };

  const media = {
    mimeType: file.mimetype,
    body: bufferStream,
  };

  const uploadRes = await driveApi.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, mimeType, size',
  });

  return uploadRes.data;
}