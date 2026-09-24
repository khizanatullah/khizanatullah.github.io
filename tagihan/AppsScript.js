/**
 * Google Apps Script untuk Tagihan TB. KHIZANATULLAH
 * 
 * INSTRUKSI:
 * 1. Buka spreadsheet Google Sheets
 * 2. Extensions → Apps Script
 * 3. Delete semua kode yang ada
 * 4. Paste kode ini
 * 5. File → Save
 * 6. Deploy → Manage deployments → Edit (deployment aktif) → New version → Deploy
 */

const SHEET_ID = '1c75I3s3h3Jj0mvuVBq7dN1hgnNWj-8f3rBE4hc_4QfA';
const SHEET_NAMES = {
  PELANGGAN: 'PELANGGAN',
  TAGIHAN_HEADER: 'TAGIHAN_HEADER',
  TAGIHAN_DETAIL: 'TAGIHAN_DETAIL',
  PEMBAYARAN: 'PEMBAYARAN'
};

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'list_pelanggan') {
    return JSONresponse(listPelanggan());
  }
  
  if (action === 'list_tagihan') {
    return JSONresponse(listTagihan(e.parameter.no));
  }
  
  if (action === 'get_detail') {
    return JSONresponse(getDetail(e.parameter.no_tagihan));
  }
  
  if (action === 'list_pembayaran') {
    return JSONresponse(listPembayaran(e.parameter.no_tagihan));
  }
  
  return JSONresponse({ error: 'Invalid action' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'add_pelanggan') {
      return JSONresponse(addPelanggan(data));
    }
    
    if (action === 'add_tagihan_header') {
      return JSONresponse(addTagihanHeader(data));
    }
    
    if (action === 'add_tagihan_detail') {
      return JSONresponse(addTagihanDetail(data));
    }
    
    if (action === 'add_pembayaran') {
      return JSONresponse(addPembayaran(data));
    }
    
    return JSONresponse({ error: 'Invalid action' });
    
  } catch (err) {
    return JSONresponse({ error: 'Invalid JSON: ' + err.message });
  }
}

// Helper: balikin JSON response yang valid untuk web app
function JSONresponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== MANAGE PELANGGAN =====

function listPelanggan() {
  const sheet = getSheet(SHEET_NAMES.PELANGGAN);
  if (!sheet) return { error: 'Sheet PELANGGAN not found' };
  
  const data = sheet.getDataRange().getValues();
  const rows = [];
  
  // Skip header (row 1)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // hanya baris dengan nomor (kolom A)
      rows.push(row);
    }
  }
  
  return { rows };
}

function addPelanggan(data) {
  const sheet = getSheet(SHEET_NAMES.PELANGGAN);
  if (!sheet) return { error: 'Sheet PELANGGAN not found' };
  
  // Generate nomor urut
  const dataRows = sheet.getDataRange().getValues();
  const nextNo = dataRows.length > 1 ? parseInt(dataRows[dataRows.length - 1][0]) + 1 : 1;
  
  sheet.appendRow([
    nextNo,
    data.nama || '',
    data.no_hp || '',
    data.alamat || '',
    data.keterangan || ''
  ]);
  
  return { success: true, no: nextNo };
}

// ===== MANAGE TAGIHAN HEADER =====

function listTagihan(noPelanggan) {
  const sheet = getSheet(SHEET_NAMES.TAGIHAN_HEADER);
  if (!sheet) return { error: 'Sheet TAGIHAN_HEADER not found' };
  
  const data = sheet.getDataRange().getValues();
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] == noPelanggan || String(row[1]) === String(noPelanggan)) {
      rows.push(row);
    }
  }
  
  return { rows };
}

function addTagihanHeader(data) {
  const sheet = getSheet(SHEET_NAMES.TAGIHAN_HEADER);
  if (!sheet) return { error: 'Sheet TAGIHAN_HEADER not found' };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now = new Date();
  
  const rowData = {};
  headers.forEach((h, i) => {
    rowData[h] = data[h.toLowerCase().replace(/\s/g, '_')] || '';
  });
  
  // Default values
  rowData['NO_TAGIHAN'] = data.no_tagihan || generateNoTag();
  rowData['NO_PELANGGAN'] = data.no_pelanggan || '';
  rowData['TANGGAL'] = now;
  rowData['STATUS'] = data.status || 'Belum Lunas';
  rowData['KETERANGAN'] = data.keterangan || '';
  rowData['CREATED_AT'] = now;
  rowData['TOTAL'] = data.total || 0;
  
  sheet.appendRow(headers.map(h => rowData[h] || ''));
  
  return { success: true, no_tagihan: rowData['NO_TAGIHAN'] };
}

// ===== MANAGE TAGIHAN DETAIL =====

function getDetail(noTag) {
  const sheetDetail = getSheet(SHEET_NAMES.TAGIHAN_DETAIL);
  const sheetPembayaran = getSheet(SHEET_NAMES.PEMBAYARAN);
  const sheetHeader = getSheet(SHEET_NAMES.TAGIHAN_HEADER);
  
  if (!sheetDetail) return { error: 'Sheet TAGIHAN_DETAIL not found' };
  
  // Load detail items
  const detailData = sheetDetail.getDataRange().getValues();
  const detailRows = [];
  
  for (let i = 1; i < detailData.length; i++) {
    const row = detailData[i];
    if (row[1] === noTag || String(row[1]) === String(noTag)) {
      detailRows.push(row);
    }
  }
  
  // Load pembayaran
  let pembayaranRows = [];
  if (sheetPembayaran) {
    const pembayaranData = sheetPembayaran.getDataRange().getValues();
    for (let i = 1; i < pembayaranData.length; i++) {
      const row = pembayaranData[i];
      if (row[1] === noTag || String(row[1]) === String(noTag)) {
        pembayaranRows.push(row);
      }
    }
  }
  
  // Hitung total dari detail
  const totalFromDetail = detailRows.reduce((sum, row) => sum + (parseFloat(row[6]) || 0), 0);
  
  // Hitung total pembayaran
  const totalPembayaran = pembayaranRows.reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0);
  
  // Sisa bayar
   const sisaBayar = totalFromDetail - totalPembayaran;
  
  // Load header buat dapetin total & status
  let headerInfo = {};
  if (sheetHeader) {
    const headerData = sheetHeader.getDataRange().getValues();
    for (let i = 1; i < headerData.length; i++) {
      const row = headerData[i];
      if (row[1] === noTag || String(row[1]) === String(noTag)) {
        headerInfo = {
          no_tagihan: row[1],
          no_pelanggan: row[2],
          tanggal: row[3],
          status: row[4],
          keterangan: row[5],
          total: parseFloat(row[6]) || 0,
          created_at: row[7]
        };
        break;
      }
    }
  }
  
  return {
    details: { rows: detailRows },
    pembayaran: { rows: pembayaranRows },
    sisaBayar: sisaBayar,
    header: headerInfo
  };
}

function addTagihanDetail(data) {
  const sheet = getSheet(SHEET_NAMES.TAGIHAN_DETAIL);
  if (!sheet) return { error: 'Sheet TAGIHAN_DETAIL not found' };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Baca data sesuai header yang ada
  const rowData = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().replace(/\s/g, '_');
    rowData[h] = data[key] || '';
  });
  
  // Default values
  rowData['NO_TAGIHAN'] = data.no_tagihan || generateNoTag();
  rowData['NAMA_BARANG'] = data.nama_barang || '';
  rowData['QTY'] = data.qty || 0;
  rowData['HARGA_SATUAN'] = data.harga_satuan || 0;
  rowData['DISKON_PERSEN'] = data.diskon_persen || 0;
  rowData['SUBTOTAL'] = data.subtotal || 0;
  rowData['CREATED_AT'] = new Date();
  
  sheet.appendRow(headers.map(h => rowData[h] || ''));
  
  return { success: true };
}

// ===== MANAGE PEMBAYARAN =====

function listPembayaran(noTag) {
  const sheet = getSheet(SHEET_NAMES.PEMBAYARAN);
  if (!sheet) return { rows: [] };
  
  const data = sheet.getDataRange().getValues();
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === noTag || String(row[1]) === String(noTag)) {
      rows.push(row);
    }
  }
  
  return { rows };
}

function addPembayaran(data) {
  const sheet = getSheet(SHEET_NAMES.PEMBAYARAN);
  if (!sheet) return { error: 'Sheet PEMBAYARAN not found' };
  
  // Buat sheet kalau belum ada
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['NO', 'NO_TAGIHAN', 'TANGGAL_BAYAR', 'JUMLAH_BAYAR', 'KETERANGAN']);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now = new Date();
  
  const rowData = {};
  headers.forEach((h, i) => {
    rowData[h] = data[h.toLowerCase().replace(/\s/g, '_')] || '';
  });
  
  // Default values
  rowData['NO'] = sheet.getLastRow(); // auto increment
  rowData['NO_TAGIHAN'] = data.no_tagihan || '';
  rowData['TANGGAL_BAYAR'] = now;
  rowData['JUMLAH_BAYAR'] = data.jumlah_bayar || 0;
  rowData['KETERANGAN'] = data.keterangan || '';
  
  sheet.appendRow(headers.map(h => rowData[h] || ''));
  
  // Update status tagihan_header jadi "Lunas" kalau sisa = 0
  updateTagihanStatus(data.no_tagihan);
  
  return { success: true };
}

function updateTagihanStatus(noTag) {
  const sheetHeader = getSheet(SHEET_NAMES.TAGIHAN_HEADER);
  const sheetPembayaran = getSheet(SHEET_NAMES.PEMBAYARAN);
  const sheetDetail = getSheet(SHEET_NAMES.TAGIHAN_DETAIL);
  
  if (!sheetHeader) return;
  
  // Dapatkan total dari detail
  let total = 0;
  if (sheetDetail) {
    const detailData = sheetDetail.getDataRange().getValues();
    for (let i = 1; i < detailData.length; i++) {
      const row = detailData[i];
      if (row[1] === noTag || String(row[1]) === String(noTag)) {
        total += parseFloat(row[6]) || 0;
      }
    }
  }
  
  // Dapatkan total pembayaran
  let totalPembayaran = 0;
  if (sheetPembayaran) {
    const pembayaranData = sheetPembayaran.getDataRange().getValues();
    for (let i = 1; i < pembayaranData.length; i++) {
      const row = pembayaranData[i];
      if (row[1] === noTag || String(row[1]) === String(noTag)) {
        totalPembayaran += parseFloat(row[3]) || 0;
      }
    }
  }
  
  // Update status
  const sisaBayar = total - totalPembayaran;
  const status = sisaBayar <= 0 ? 'Lunas' : (totalPembayaran > 0 ? 'DP' : 'Belum Lunas');
  
  const headerData = sheetHeader.getDataRange().getValues();
  for (let i = 1; i < headerData.length; i++) {
    const row = headerData[i];
    if (row[1] === noTag || String(row[1]) === String(noTag)) {
      sheetHeader.getRange(i + 1, 4).setValue(status); // kolom STATUS
      sheetHeader.getRange(i + 1, 6).setValue(total); // kolom TOTAL
      break;
    }
  }
}

function getSheet(name) {
  try {
    return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
  } catch (e) {
    return null;
  }
}

function generateNoTag() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd');
  const random = String(Math.floor(Math.random() * 900) + 100);
  return `TG-${dateStr}-${random}`;
}
