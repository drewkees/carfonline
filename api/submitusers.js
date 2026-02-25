import { getSheetHeaders, appendToSheet } from '../lib/sheets-helpers.js';

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
    const { rows } = req.body;
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    const sheetName = "User";
    const headers = await getSheetHeaders(sheetName);
    if (headers.length === 0) {
      return res.status(500).json({ error: "No headers found in User sheet" });
    }

    const rowsToInsert = rows.map(formData => {
      return headers.map(col => {
        const value = formData[col];
        if (Array.isArray(value)) return value.join(", ");
        return value ?? "";
      });
    });

    await appendToSheet(sheetName, rowsToInsert);

    res.json({ success: true });
  } catch (err) {
    console.error("Error writing to User sheet:", err);
    res.status(500).json({ error: "Failed to submit user", details: err.message });
  }
}