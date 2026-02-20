import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import multer from 'multer'; // ✅ MISSING IMPORT
import { Readable } from 'stream'; // ✅ MISSING IMPORT
import 'dotenv/config';
import archiver from 'archiver';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

// Main parent folder ID
const MAIN_FOLDER_ID = '15GyW7ZZt-XFfdze96pJmsoNSgdU7PLmT';
// const MAIN_FOLDER_ID = '1H1tfPxV77LqQ_De4P04Xy2FSbHCe2rwN';

app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Google Auth
// const auth = new google.auth.GoogleAuth({
//   keyFile: path.join(process.cwd(), 'service-account.json'),
//   scopes: [
//     'https://www.googleapis.com/auth/drive',
//     'https://www.googleapis.com/auth/spreadsheets'
//   ],
// });

// Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets'
  ],
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
// Helper: Find or create folder
const findOrCreateFolder = async (parentId, folderName) => {
  const client = await auth.getClient();
  const driveApi = google.drive({ version: 'v3', auth: client });

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
};

// -----------------------------
// Helper: Create gencode folder structure
const createGencodeStructure = async (gencode) => {
  // Create main gencode folder
  const gencodeFolderId = await findOrCreateFolder(MAIN_FOLDER_ID, gencode);

  // Create SP subfolders
  const spFolders = ['SP1','SP2' ,'SP3', 'SP4', 'SP5', 'SP6'];
  const folderIds = {};

  for (const spFolder of spFolders) {
    const folderId = await findOrCreateFolder(gencodeFolderId, spFolder);
    folderIds[spFolder] = folderId;
  }

  return { gencodeFolderId, ...folderIds };
};

// -----------------------------
// Upload files to Drive
app.post('/api/upload-files', upload.array('files'), async (req, res) => {
  try {
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

    const spFolderName = folderMapping[docType];
    if (!spFolderName) {
      return res.status(400).json({ error: 'Invalid docType' });
    }

    // Create folder structure
    const folderStructure = await createGencodeStructure(gencode);
    const targetFolderId = folderStructure[spFolderName];

    // Upload files
    const client = await auth.getClient();
    const driveApi = google.drive({ version: 'v3', auth: client });

    const uploadedFiles = [];

    for (const file of files) {
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

      uploadedFiles.push(uploadRes.data);
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
});

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
        sp2GovernmentId: [],
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
      sp2GovernmentId: [], 
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
// Add this endpoint to your server.js file

// -----------------------------
// Delete a file from Google Drive
app.delete('/api/delete-file/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { gencode, docType } = req.body;
    const client = await auth.getClient();
    const driveApi = google.drive({ version: 'v3', auth: client });

    // Delete the file from Google Drive
    await driveApi.files.delete({
      fileId: fileId,
    });

    res.json({
      success: true,
      message: 'File deleted successfully',
      fileId: fileId,
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({
      error: 'Failed to delete file',
      details: err.message,
    });
  }
});

app.get('/api/download-zip/:gencode', async (req, res) => {
  try {
    const { gencode } = req.params;
    const client = await auth.getClient();
    const driveApi = google.drive({ version: 'v3', auth: client });

    // Find gencode folder
    const folderRes = await driveApi.files.list({
      q: `'${MAIN_FOLDER_ID}' in parents and name='${gencode}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    if (!folderRes.data.files?.length) {
      return res.status(404).json({ error: 'Gencode folder not found' });
    }

    const gencodeFolderId = folderRes.data.files[0].id;

    // List subfolders
    const subfoldersRes = await driveApi.files.list({
      q: `'${gencodeFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${gencode}-documents.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const folder of subfoldersRes.data.files || []) {
      const files = await listFilesInFolder(folder.id);
      for (const file of files) {
        const stream = await driveApi.files.get(
          { fileId: file.id, alt: 'media' },
          { responseType: 'stream' }
        );
        archive.append(stream.data, { name: `${folder.name}/${file.name}` });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('Error creating zip:', err);
    res.status(500).json({ error: 'Failed to create zip', details: err.message });
  }
});
let sheetsClient;
async function getSheetsClient() {
  if (!sheetsClient) {
    const client = await auth.getClient();
    sheetsClient = google.sheets({ version: 'v4', auth: client });
  }
  return sheetsClient;
}

// Add your spreadsheet ID
// const SPREADSHEET_ID = '1TJ1b_cBoW3pCC_zhSDvOot9jViXnuCbbLTfMQspSMPw';
const SPREADSHEET_ID = '1JJDh_w_opcdy3QNPZ-1xh-wahsx_t0iElBw95TwK8iY';


app.post("/api/submitform", async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    const sheets = await getSheetsClient();

    // 1. Get headers from the sheet
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "CUSTOMER DATA!1:1", // First row for headers
    });

    const headers = headerRes.data.values?.[0] || [];
    if (headers.length === 0) {
      return res.status(500).json({ error: "No headers found in sheet" });
    }

    // 2. Get last ID from "#" column
    const idColIndex = headers.indexOf("#");
    let lastId = 0;
    if (idColIndex >= 0) {
      const idRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `CUSTOMER DATA!${String.fromCharCode(65 + idColIndex)}2:${String.fromCharCode(65 + idColIndex)}`,
      });
      const existingIds = idRes.data.values || [];
      if (existingIds.length > 0) {
        lastId = parseInt(existingIds[existingIds.length - 1][0]) || 0;
      }
    }
    // 3. Map formData to row by headers
    const rowsWithId = rows.map(formData => {
      lastId += 1;
      const row = headers.map(col => {
        if (col === "#") return lastId;
        const value = formData[col];
        if (Array.isArray(value)) return value.join(", ");
        return value ?? "";
      });
      return row;
    });

    // 4. Append rows to sheet
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "CUSTOMER DATA!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values: rowsWithId },
    });

    res.json({ success: true, appendedRows: rowsWithId });
  } catch (err) {
    console.error("Error writing to CUSTOMER DATA:", err);
    res.status(500).json({ error: "Failed to submit form" });
  }
});

app.post("/api/updateform", async (req, res) => {
  try {

    const { rowId, data } = req.body;
    if (!rowId || !data) return res.status(400).json({ error: "Missing rowId or data" });

    const sheets = await getSheetsClient();

    // 1. Get headers
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "CUSTOMER DATA!1:1",
    });
    const headers = headerRes.data.values?.[0] || [];
    if (!headers.length) return res.status(500).json({ error: "No headers found" });

    // 2. Find row number by "#"
    const idColIndex = headers.indexOf("#");
    if (idColIndex < 0) return res.status(500).json({ error: '"#" column not found' });

    const idRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `CUSTOMER DATA!${String.fromCharCode(65 + idColIndex)}2:${String.fromCharCode(65 + idColIndex)}`,
    });

    const existingIds = idRes.data.values || [];
    let rowNumber = -1;
    for (let i = 0; i < existingIds.length; i++) {
      if (parseInt(existingIds[i][0]) === rowId) {
        rowNumber = i + 2; // header row = 1
        break;
      }
    }
    if (rowNumber === -1) return res.status(404).json({ error: "Row ID not found" });

    // 3. Map data to row
    const rowValues = headers.map(col => {
      if (col === "#") return rowId;
      const value = data[col];
      return Array.isArray(value) ? value.join(", ") : value ?? "";
    });

    // 4. Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `CUSTOMER DATA!A${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowValues] },
    });

    res.json({ success: true, updatedRow: rowNumber });
  } catch (err) {
    console.error("Error updating CUSTOMER DATA:", err);
    res.status(500).json({ error: "Failed to update form" });
  }
});

app.post("/api/submittobos", async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    const sheets = await getSheetsClient();

    // 1. Get headers from the APPROVEDFORBOS sheet
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "APPROVEDFORBOS!1:1", // First row for headers
    });

    const headers = headerRes.data.values?.[0] || [];
    if (headers.length === 0) {
      return res.status(500).json({ error: "No headers found in APPROVEDFORBOS sheet" });
    }

    // ✅ 2. Map formData to row by headers (use # from formData)
    const rowsWithId = rows.map(formData => {
      const row = headers.map(col => {
        // ✅ Use the # value from formData, don't auto-increment
        if (col === "#") {
          return formData["#"] || formData["id"] || "";
        }
        const value = formData[col];
        if (Array.isArray(value)) return value.join(", ");
        return value ?? "";
      });
      return row;
    });

    // ✅ 3. Append rows to APPROVEDFORBOS sheet
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "APPROVEDFORBOS!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values: rowsWithId },
    });

    res.json({ success: true, appendedRows: rowsWithId });
  } catch (err) {
    console.error("Error writing to APPROVEDFORBOS:", err);
    res.status(500).json({ error: "Failed to submit to BOS", details: err.message });
  }
});

app.post("/api/submittoemail", async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    const sheets = await getSheetsClient();

    // 1. Get headers from the APPROVEDFORBOS sheet
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "FORAPPROVALEMAIL!1:1", // First row for headers
    });

    const headers = headerRes.data.values?.[0] || [];
    if (headers.length === 0) {
      return res.status(500).json({ error: "No headers found in APPROVEDFORBOS sheet" });
    }

    // ✅ 2. Map formData to row by headers (use # from formData)
    const rowsWithId = rows.map(formData => {
      const row = headers.map(col => {
        // ✅ Use the # value from formData, don't auto-increment
        if (col === "#") {
          return formData["#"] || formData["id"] || "";
        }
        const value = formData[col];
        if (Array.isArray(value)) return value.join(", ");
        return value ?? "";
      });
      return row;
    });

    // ✅ 3. Append rows to FORAPPROVALEMAIL sheet
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "FORAPPROVALEMAIL!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values: rowsWithId },
    });

    res.json({ success: true, appendedRows: rowsWithId });
  } catch (err) {
    console.error("Error writing to FORAPPROVALEMAIL:", err);
    res.status(500).json({ error: "Failed to submit to BOS", details: err.message });
  }
});

app.post("/api/submittoexecemail", async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    const sheets = await getSheetsClient();

    // 1. Get headers from the FINALEMAILBLAST sheet
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "FINALEMAILBLAST!1:1", // First row for headers
    });

    const headers = headerRes.data.values?.[0] || [];
    if (headers.length === 0) {
      return res.status(500).json({ error: "No headers found in FINALEMAILBLAST sheet" });
    }

    // ✅ 2. Map formData to row by headers (use # from formData)
    const rowsWithId = rows.map(formData => {
      const row = headers.map(col => {
        // ✅ Use the # value from formData, don't auto-increment
        if (col === "#") {
          return formData["#"] || formData["id"] || "";
        }
        const value = formData[col];
        if (Array.isArray(value)) return value.join(", ");
        return value ?? "";
      });
      return row;
    });

    // ✅ 3. Append rows to FINALEMAILBLAST sheet
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "FINALEMAILBLAST!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values: rowsWithId },
    });

    res.json({ success: true, appendedRows: rowsWithId });
  } catch (err) {
    console.error("Error writing to FINALEMAILBLAST:", err);
    res.status(500).json({ error: "Failed to submit to BOS", details: err.message });
  }
});

app.post('/api/generate-pdf', async (req, res) => {
  const { html, title } = req.body;

  if (!html) {
    return res.status(400).json({ message: 'Missing html in request body' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title ?? 'CustomerForm'}</title>
          <style>
            @page {
              size: 8.5in 13in;
              margin: 0.3in;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 9.5pt;
              color: #000;
              line-height: 1.15;
            }
            .print-container {
              font-size: 9.5pt;
              font-family: Arial, sans-serif;
              color: #000;
              line-height: 1.15;
            }
            .underline-input {
              border: none;
              border-bottom: 1px solid #000;
              padding: 1px 5px;
              background: #D9EBD3 !important;
              outline: none;
              width: 100%;
              font-size: inherit;
              font-family: inherit;
            }
            .text-sm { font-size: 0.85em; }
            .text-lg { font-size: 1.1em; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${html}
          </div>
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: '8.5in',
      height: '13in',
      printBackground: true,
      margin: {
        top:    '0.3in',
        bottom: '0.3in',
        left:   '0.3in',
        right:  '0.3in',
      },
    });

    const safeTitle = (title ?? 'CustomerForm').replace(/[^a-z0-9_\-]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('[generate-pdf] Error:', error);
    return res.status(500).json({ message: 'PDF generation failed', error: String(error) });

  } finally {
    if (browser) await browser.close();
  }
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
