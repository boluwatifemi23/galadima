import { google } from "googleapis";

function getAuth() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY are not set");

  return new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
}

/**
 * Overwrites a named tab (creating it if needed) with fresh rows — simplest
 * way to keep a "live" snapshot without diffing old data against new.
 */
export async function writeReportToSheet(sheetTitle: string, rows: (string | number)[][]): Promise<string> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");

  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === sheetTitle);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: sheetTitle } } }] } });
  } else {
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetTitle}!A:Z` });
  }

  await sheets.spreadsheets.values.update({ spreadsheetId, range: `${sheetTitle}!A1`, valueInputOption: "RAW", requestBody: { values: rows } });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}