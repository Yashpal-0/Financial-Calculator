import fs from 'fs';
import path from 'path';

const files = [
  'pages/retirement.html',
  'pages/rd.html',
  'pages/lumpsum.html',
  'pages/income-tax.html',
  'pages/gst.html',
  'pages/gratuity.html'
];

files.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove <nav>...</nav>
  content = content.replace(/<nav[\s\S]*?<\/nav>/, '');

  // Remove <header>...</header> if it's outside the app div
  // Actually, most of these have header inside the Preact component now, 
  // so we should remove the hardcoded one.
  content = content.replace(/<header[\s\S]*?<\/header>/, '');

  // Remove <footer>...</footer>
  content = content.replace(/<footer[\s\S]*?<\/footer>/, '');

  // Remove "Controls" div
  content = content.replace(/<!-- Controls -->[\s\S]*?<\/div>/, '');

  // For lumpsum.html, it has a lot of hardcoded content in <main>
  if (file === 'pages/lumpsum.html') {
    content = content.replace(/<main[\s\S]*?<\/main>/, '<main id="app"></main>');
    // Also update the script to use renderLumpsumApp if it exists, or just keep it as is if it's already correct.
    // Let's check lumpsum.js first.
  }

  // For gst.html, it has <main id="gst-root">
  if (file === 'pages/gst.html') {
    content = content.replace(/<main id="gst-root">[\s\S]*?<\/main>/, '<div id="app"></div>');
    content = content.replace("import { initApp } from '../scripts/app.js';", ""); // It might not have it
    content = content.replace('<script type="module" src="../scripts/gst.js"></script>', `
  <script type="module">
    import { initApp } from '../scripts/app.js';
    import { renderGSTApp } from '../scripts/gst.js';
    initApp();
    renderGSTApp(document.getElementById('app'));
  </script>`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Cleaned ${file}`);
});
