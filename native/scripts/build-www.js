// Copies the game into native/www, the folder Capacitor bundles into the app.
// The web version loads its two fonts from Google Fonts; inside the app they
// are bundled (native/fonts) so the game looks right with no connection, so
// the Google Fonts lines are swapped for a local stylesheet here.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', 'www');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const before = html;
html = html.replace(/^<link rel="preconnect" href="https:\/\/fonts\.g[^\n]*\n/gm, '');
html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/, '<link rel="stylesheet" href="fonts/fonts.css">');
if (html === before || html.includes('fonts.googleapis.com')) {
  console.error('::error::Could not swap the Google Fonts link in index.html for the bundled fonts.');
  process.exit(1);
}
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.copyFileSync(path.join(ROOT, 'manifest.webmanifest'), path.join(OUT, 'manifest.webmanifest'));
fs.cpSync(path.join(ROOT, 'icons'), path.join(OUT, 'icons'), { recursive: true });
fs.cpSync(path.join(__dirname, '..', 'fonts'), path.join(OUT, 'fonts'), { recursive: true });
console.log('native/www ready from the root game files');
