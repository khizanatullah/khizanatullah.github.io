const express = require('express');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const app = express();

const PORT = process.env.PORT || 3000;
const PDF_DIR = path.join(__dirname, 'pdfs');
app.use(express.static(__dirname));
app.use('/pdfs', express.static(PDF_DIR));
app.use(express.json());

let pdfContents = {};

// Load PDFs on startup
function loadPdfs() {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
    return;
  }
  
  fs.readdirSync(PDF_DIR).forEach(file => {
    if (file.endsWith('.pdf')) {
      const fullPath = path.join(PDF_DIR, file);
      const dataBuffer = fs.readFileSync(fullPath);
      pdfParse(dataBuffer).then(data => {
        pdfContents[file] = data.text;
        console.log(`✅ Loaded ${file}`);
      }).catch(err => {
        console.error(`❌ Gagal load ${file}:`, err.message);
      });
    }
  });
}

app.post('/api/chat', (req, res) => {
  const query = req.body.message?.toLowerCase() || '';
  let results = [];

  for (const [file, content] of Object.entries(pdfContents)) {
    if (!content) continue;
    const lines = content.split('\n').filter(Boolean);
    lines.forEach(line => {
      if (line.toLowerCase().includes(query)) {
        results.push({ file, text: line.trim().substring(0, 200) });
      }
    });
  }

  if (results.length === 0) {
    res.json({ answer: "Maaf, saya tidak menemukan informasi terkait." });
  } else {
    res.json({
      answer: results.slice(0, 3).map(r => `📄 ${r.file}\n${r.text}`).join('\n\n')
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

loadPdfs();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});