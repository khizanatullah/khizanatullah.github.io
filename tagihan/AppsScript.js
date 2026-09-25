/**
 * Google Apps Script untuk Tagihan TB. KHIZANATULLAH
 * 
 * STRUKTUR SHEET (wajib sesuai):
 * 
 * PELANGGAN:
 *   A: No | B: Nama | C: No_HP | D: Alamat | E: Keterangan
 * 
 * TAGIHAN_HEADER:
 *   A: No_Tagihan | B: No_Pelanggan | C: Tanggal | D: Status | E: Subtotal | F: Total | G: Keterangan | H: Timestamp
 * 
 * TAGIHAN_DETAIL:
 *   A: No_Tagihan | B: Nama_Barang | C: Qty | D: Harga_Satuan | E: Diskon_Persen | F: Subtotal | G: Created_At
 * 
 * PEMBAYARAN:
 *   A: NO_TAGIHAN | B: TANGGAL_BAYAR | C: JUMLAH_BAYAR | D: KETERANGAN
 * 
 * INSTRUKSI:
 * 1. Buka spreadsheet → Extensions → Apps Script
 * 2. Hapus semua kode
 * 3. Paste ini
 * 4. File → Save
 * 5. Deploy → Manage deployments → Edit → New version → Deploy
 */

const SHEET_ID = '1c75I3s3h3Jj0mvuVBq7dN1hgnNWj-8f3rBE4hc_4QfA';
const SHEET_NAMES = {
  PELANGGAN: 'PELANGGAN',
  TAGIHAN_HEADER: 'TAGIHAN_HEADER',
  TAGIHAN_DETAIL: 'TAGIHAN_DETAIL',
  PEMBAYARAN: 'PEMBAYARAN'
};

function doGet(e) {
  const a = e.parameter.action;
  if (a === 'list_pelanggan') return JSONresponse(listPelanggan());
  if (a === 'list_tagihan') return JSONresponse(listTagihan(e.parameter.no));
  if (a === 'get_detail') return JSONresponse(getDetail(e.parameter.no_tagihan));
  if (a === 'list_pembayaran') return JSONresponse(listPembayaran(e.parameter.no_tagihan));
  return JSONresponse({ error: 'Invalid action' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const a = data.action;
    if (a === 'add_pelanggan') return JSONresponse(addPelanggan(data));
    if (a === 'add_tagihan_header') return JSONresponse(addTagihanHeader(data));
    if (a === 'add_tagihan_detail') return JSONresponse(addTagihanDetail(data));
    if (a === 'add_pembayaran') return JSONresponse(addPembayaran(data));
    return JSONresponse({ error: 'Invalid action' });
  } catch (err) {
    return JSONresponse({ error: 'Invalid JSON: ' + err.message });
  }
}

function JSONresponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  try { return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name); }
  catch (e) { return null; }
}

function generateNoTag() {
  const now = new Date();
  const d = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd');
  const r = String(Math.floor(Math.random() * 900) + 100);
  return `TG-${d}-${r}`;
}

// ===== PELANGGAN =====
function listPelanggan() {
  const s = getSheet(SHEET_NAMES.PELANGGAN);
  if (!s) return { error: 'Sheet PELANGGAN not found' };
  const rows = [];
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) if (data[i][0]) rows.push(data[i]);
  return { rows };
}

function addPelanggan(data) {
  const s = getSheet(SHEET_NAMES.PELANGGAN);
  if (!s) return { error: 'Sheet PELANGGAN not found' };
  const dataRows = s.getDataRange().getValues();
  const nextNo = dataRows.length > 1 ? parseInt(dataRows[dataRows.length - 1][0]) + 1 : 1;
  s.appendRow([nextNo, data.nama || '', data.no_hp || '', data.alamat || '', data.keterangan || '']);
  return { success: true, no: nextNo };
}

// ===== TAGIHAN_HEADER =====
// Kolom: A(No_Tagihan) B(No_Pelanggan) C(Tanggal) D(Status) E(Subtotal) F(Total) G(Keterangan) H(Timestamp)
function listTagihan(noPelanggan) {
  const s = getSheet(SHEET_NAMES.TAGIHAN_HEADER);
  if (!s) return { error: 'Sheet TAGIHAN_HEADER not found' };
  const rows = [];
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(noPelanggan)) rows.push(data[i]);
  }
  return { rows };
}

function addTagihanHeader(data) {
  const s = getSheet(SHEET_NAMES.TAGIHAN_HEADER);
  if (!s) return { error: 'Sheet TAGIHAN_HEADER not found' };
  const now = new Date();
  const noTag = data.no_tagihan || generateNoTag();
  s.appendRow([
    noTag,                    // 0: No_Tagihan
    data.no_pelanggan || '',  // 1: No_Pelanggan
    now,                      // 2: Tanggal
    data.status || 'Belum Lunas', // 3: Status
    0,                        // 4: Subtotal
    data.total || 0,          // 5: Total
    data.keterangan || '',    // 6: Keterangan
    now                       // 7: Timestamp
  ]);
  return { success: true, no_tagihan: noTag };
}

// ===== TAGIHAN_DETAIL =====
// Kolom: A(No_Tagihan) B(Nama_Barang) C(Qty) D(Harga_Satuan) E(Diskon_Persen) F(Subtotal) G(Created_At)
function getDetail(noTag) {
  const sDetail = getSheet(SHEET_NAMES.TAGIHAN_DETAIL);
  const sPembayaran = getSheet(SHEET_NAMES.PEMBAYARAN);
  if (!sDetail) return { error: 'Sheet TAGIHAN_DETAIL not found' };
  
  const detailRows = [];
  const detailData = sDetail.getDataRange().getValues();
  for (let i = 1; i < detailData.length; i++) {
    if (String(detailData[i][0]) === String(noTag)) detailRows.push(detailData[i]);
  }
  
  let pembayaranRows = [];
  if (sPembayaran) {
    const payData = sPembayaran.getDataRange().getValues();
    for (let i = 1; i < payData.length; i++) {
      if (String(payData[i][0]) === String(noTag)) pembayaranRows.push(payData[i]);
    }
  }
  
  const totalDetail = detailRows.reduce((s, r) => s + (parseFloat(r[5]) || 0), 0);
  const totalPembayaran = pembayaranRows.reduce((s, r) => s + (parseFloat(r[2]) || 0), 0);
  
  return {
    details: { rows: detailRows },
    pembayaran: { rows: pembayaranRows },
    sisaBayar: totalDetail - totalPembayaran
  };
}

function addTagihanDetail(data) {
  const s = getSheet(SHEET_NAMES.TAGIHAN_DETAIL);
  if (!s) return { error: 'Sheet TAGIHAN_DETAIL not found' };
  
  if (s.getLastRow() === 0) {
    s.appendRow(['No_Tagihan', 'Nama_Barang', 'Qty', 'Harga_Satuan', 'Diskon_Persen', 'Subtotal', 'Created_At']);
  }
  
  s.appendRow([
    data.no_tagihan || generateNoTag(),
    data.nama_barang || '',
    data.qty || 0,
    data.harga_satuan || 0,
    data.diskon_persen || 0,
    data.subtotal || 0,
    new Date()
  ]);
  
  updateTagihanStatus(data.no_tagihan);
  return { success: true };
}

// ===== PEMBAYARAN =====
// Kolom: A(NO_TAGIHAN) B(TANGGAL_BAYAR) C(JUMLAH_BAYAR) D(KETERANGAN)
function listPembayaran(noTag) {
  const s = getSheet(SHEET_NAMES.PEMBAYARAN);
  if (!s) return { rows: [] };
  const rows = [];
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(noTag)) rows.push(data[i]);
  }
  return { rows };
}

function addPembayaran(data) {
  const s = getSheet(SHEET_NAMES.PEMBAYARAN);
  if (!s) return { error: 'Sheet PEMBAYARAN not found' };
  
  if (s.getLastRow() === 0) {
    s.appendRow(['NO_TAGIHAN', 'TANGGAL_BAYAR', 'JUMLAH_BAYAR', 'KETERANGAN']);
  }
  
  const now = new Date();
  s.appendRow([
    data.no_tagihan || '',        // 0: NO_TAGIHAN
    now,                          // 1: TANGGAL_BAYAR
    data.jumlah_bayar || 0,       // 2: JUMLAH_BAYAR
    data.keterangan || ''         // 3: KETERANGAN
  ]);
  
  updateTagihanStatus(data.no_tagihan);
  return { success: true };
}

function updateTagihanStatus(noTag) {
  const sHeader = getSheet(SHEET_NAMES.TAGIHAN_HEADER);
  const sPembayaran = getSheet(SHEET_NAMES.PEMBAYARAN);
  const sDetail = getSheet(SHEET_NAMES.TAGIHAN_DETAIL);
  if (!sHeader) return;
  
  let total = 0;
  if (sDetail) {
    const data = sDetail.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(noTag)) total += parseFloat(data[i][5]) || 0;
    }
  }
  
  let totalPembayaran = 0;
  if (sPembayaran) {
    const data = sPembayaran.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(noTag)) totalPembayaran += parseFloat(data[i][2]) || 0;
    }
  }
  
  const headerData = sHeader.getDataRange().getValues();
  for (let i = 1; i < headerData.length; i++) {
    if (String(headerData[i][0]) === String(noTag)) {
      const sisa = total - totalPembayaran;
      const status = sisa <= 0 ? 'Lunas' : (totalPembayaran > 0 ? 'DP' : 'Belum Lunas');
      sHeader.getRange(i + 1, 4).setValue(status);
      sHeader.getRange(i + 1, 6).setValue(total);
      break;
    }
  }
}
