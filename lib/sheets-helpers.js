import { getSheetsApi } from './google-auth.js';

export const SPREADSHEET_ID = '1TJ1b_cBoW3pCC_zhSDvOot9jViXnuCbbLTfMQspSMPw';
// export const SPREADSHEET_ID = process.env.SHEET_MAIN_FOLDER_ID || '1JJDh_w_opcdy3QNPZ-1xh-wahsx_t0iElBw95TwK8iY';


export async function getSheetHeaders(sheetName) {
  const sheets = await getSheetsApi();
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!1:1`,
  });
  return headerRes.data.values?.[0] || [];
}

export async function getLastId(sheetName, headers) {
  const sheets = await getSheetsApi();
  const idColIndex = headers.indexOf("#");
  let lastId = 0;

  if (idColIndex >= 0) {
    const idRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${String.fromCharCode(65 + idColIndex)}2:${String.fromCharCode(65 + idColIndex)}`,
    });
    const existingIds = idRes.data.values || [];
    if (existingIds.length > 0) {
      lastId = parseInt(existingIds[existingIds.length - 1][0]) || 0;
    }
  }

  return lastId;
}

export async function appendToSheet(sheetName, rows) {
  const sheets = await getSheetsApi();
  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    resource: { values: rows },
  });
  return appendRes;
}

export async function findRowByIdInSheet(sheetName, rowId, headers) {
  const sheets = await getSheetsApi();
  const idColIndex = headers.indexOf("#");
  
  if (idColIndex < 0) {
    throw new Error('"#" column not found');
  }

  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${String.fromCharCode(65 + idColIndex)}2:${String.fromCharCode(65 + idColIndex)}`,
  });

  const existingIds = idRes.data.values || [];
  let rowNumber = -1;

  for (let i = 0; i < existingIds.length; i++) {
    if (parseInt(existingIds[i][0]) === rowId) {
      rowNumber = i + 2; // header row = 1
      break;
    }
  }

  return rowNumber;
}

export async function updateSheetRow(sheetName, rowNumber, rowValues) {
  const sheets = await getSheetsApi();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    resource: { values: [rowValues] },
  });
}

export function mapDataToRow(headers, formData) {
  return headers.map(col => {
    if (col === "#") {
      return formData["#"] || formData["id"] || "";
    }
    const value = formData[col];
    if (Array.isArray(value)) return value.join(", ");
    return value ?? "";
  });
}