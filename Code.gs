/**
 * ================================================
 * Google Apps Script — Wedding RSVP & Wall of Wishes
 * Lena & Tista — 11 April 2026
 * ================================================
 *
 * CARA SETUP:
 * 1. Buka Google Sheets baru
 * 2. Beri nama sheet: "RSVP"
 * 3. Di header row (baris 1), isi kolom:
 *    A1: Timestamp | B1: Nama | C1: Kehadiran | D1: Pesan
 * 4. Klik Extensions > Apps Script
 * 5. Hapus kode default, paste semua kode ini
 * 6. Klik Save (Ctrl+S)
 * 7. Klik Deploy > New Deployment
 *    - Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Klik Deploy, copy URL-nya
 * 9. Paste URL tersebut ke CONFIG.SCRIPT_URL di index.html
 * ================================================
 */

const SHEET_NAME = 'RSVP';

// ------------------------------------------------
// Handle GET request
// - action=getWishes → return semua data sebagai JSON
// - (default)        → simpan data RSVP baru
// ------------------------------------------------
function doGet(e) {
  const params = e.parameter;

  // Return wishes list
  if (params.action === 'getWishes') {
    return getWishes();
  }

  // Save new RSVP entry
  return saveRSVP(params);
}

// ------------------------------------------------
// Simpan data RSVP ke sheet
// ------------------------------------------------
function saveRSVP(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    const timestamp = params.timestamp || new Date().toLocaleString('id-ID');
    const name      = params.name      || '';
    const attendance = params.attendance || '';
    const message   = params.message   || '';

    sheet.appendRow([timestamp, name, attendance, message]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ------------------------------------------------
// Ambil semua data wishes dari sheet
// ------------------------------------------------
function getWishes() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const rows  = sheet.getDataRange().getValues();

    // Skip header row (baris pertama)
    const wishes = rows.slice(1).map(row => ({
      timestamp:  row[0] || '',
      name:       row[1] || '',
      attendance: row[2] || '',
      message:    row[3] || '',
    })).filter(w => w.name !== ''); // filter baris kosong

    return ContentService
      .createTextOutput(JSON.stringify(wishes))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
