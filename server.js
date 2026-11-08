/**
 * EduExam SMAN 4 Soppeng - Local Development Server (PWA Enabled)
 * Dikembangkan oleh: Syarif Hidayatullah, S.Pd.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Cek apakah file ada di direktori root atau fallback ke folder public
  let filePath = path.join(__dirname, reqPath);

  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      const publicPath = path.join(__dirname, 'public', reqPath);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        filePath = publicPath;
      }
    }
  } catch (e) {
    // Abaikan error stat
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found - EduExam SMAN 4 Soppeng');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': (ext === '.html' || ext === '.json') ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
    };

    // Header khusus agar Service Worker memiliki cakupan penuh (scope '/')
    if (filePath.endsWith('sw.js')) {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`EduExam SMAN 4 Soppeng server berjalan di http://localhost:${PORT}`);
});
