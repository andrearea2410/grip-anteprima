/* ==========================================================================
   GRIP — server di anteprima (solo per lo sviluppo, porta 5507)
   Avvio:  node tools/server.js
   Serve i file statici della cartella del progetto, senza cache.
   In più accetta  POST /__salva?file=nome.webp  per salvare in assets/snap/
   le immagini che il sito genera da solo con ?snapshot=1 (fallback senza
   WebGL e miniature del catalogo). Quel percorso esiste solo qui: online
   il sito è statico e non ne ha bisogno.
   ========================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
const PORTA = Number(process.env.PORT) || 5507;
const TIPI = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/__salva') {
    const nome = String(url.searchParams.get('file') || '');
    if (!/^[a-z0-9-]+\.(webp|png|jpg)$/.test(nome)) { res.writeHead(400); return res.end('nome non valido'); }
    const pezzi = [];
    let peso = 0;
    req.on('data', (c) => { peso += c.length; if (peso < 8e6) pezzi.push(c); });
    req.on('end', () => {
      const dest = path.join(RADICE, 'assets', 'snap', nome);
      fs.writeFile(dest, Buffer.concat(pezzi), (err) => {
        console.log(err ? `[salva] ERRORE ${nome}` : `[salva] ${nome} ${peso} byte`);
        res.writeHead(err ? 500 : 200, { 'Content-Type': 'text/plain' });
        res.end(err ? 'errore' : 'ok');
      });
    });
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(RADICE, rel));
  if (!file.startsWith(RADICE)) { res.writeHead(403); return res.end('vietato'); }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      console.log(`404 ${rel}`);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Non trovato: ' + rel);
    }
    res.writeHead(200, {
      'Content-Type': TIPI[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-store'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORTA, '127.0.0.1', () => console.log(`GRIP in anteprima su http://localhost:${PORTA}`));
