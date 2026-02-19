import { google } from 'googleapis';

let authClient = null;

export async function getAuthClient() {
  if (authClient) return authClient;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
  });

  authClient = await auth.getClient();
  return authClient;
}

export async function getDriveApi() {
  const client = await getAuthClient();
  return google.drive({ version: 'v3', auth: client });
}

export async function getSheetsApi() {
  const client = await getAuthClient();
  return google.sheets({ version: 'v4', auth: client });
}