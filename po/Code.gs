const SHEET_NAME = 'Sheet1';
const HEADERS = ['Nama', 'Alamat', 'Tanggal Kirim', 'Barang'];

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('TB. KHIZANATULLAH')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,4).setValues([HEADERS]);
  return sh;
}

function saveOrder(data) {
  if (!data || !String(data.nama || '').trim()) throw new Error('Nama pelanggan wajib diisi.');
  if (!String(data.alamat || '').trim()) throw new Error('Alamat kirim wajib diisi.');
  if (!String(data.tanggal || '').trim()) throw new Error('Tanggal kirim wajib diisi.');
  if (!Array.isArray(data.items) || !data.items.length) throw new Error('Tambahkan minimal satu barang.');

  const sh = getSheet_();
  const barang = data.items.map(x => {
    const n = String(x.nama || '').trim();
    const q = String(x.jumlah || '').trim();
    return q ? n + ' - ' + q : n;
  }).filter(Boolean).join('; ');

  sh.appendRow([
    String(data.nama).trim(),
    String(data.alamat).trim(),
    String(data.tanggal).trim(),
    barang
  ]);
  return {ok:true, message:'Data berhasil disimpan.'};
}

function getCustomers() {
  const sh = getSheet_();
  if (sh.getLastRow() < 2) return [];
  const v = sh.getRange(2,1,sh.getLastRow()-1,4).getDisplayValues();
  return v.map((r,i)=>({row:i+2,nama:r[0],alamat:r[1],tanggal:r[2],barang:r[3]}))
          .filter(x=>x.nama);
}

function getCustomer(rowNumber) {
  const sh = getSheet_();
  const row = Number(rowNumber);
  if (!Number.isInteger(row) || row < 2 || row > sh.getLastRow()) throw new Error('Data pelanggan tidak ditemukan.');
  const r = sh.getRange(row,1,1,4).getDisplayValues()[0];
  return {row:row,nama:r[0],alamat:r[1],tanggal:r[2],barang:r[3]};
}
