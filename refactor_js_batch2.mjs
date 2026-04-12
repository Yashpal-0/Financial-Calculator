import fs from 'fs';

const syncSliderReplacement = `function syncSlider(inputId, sliderId, displayId, formatter) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (!input || !slider || !display) return;

    function update(val) {
        display.textContent = formatter(val);
        const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
        const thumbColor = '#0d9488';
        const trackColor = document.documentElement.dataset.theme === 'dark' ? '#334155' : '#e2e8f0';
        slider.style.background = \`linear-gradient(to right, \${thumbColor} \${pct}%, \${trackColor} \${pct}%)\`;
    }
    input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
    slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
    update(slider.value);
    
    const observer = new MutationObserver(() => update(slider.value));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}`;

const files = [
  'main.js', 'affordability.js', 'balance-transfer.js',
  'income-tax.js', 'inflation.js', 'retirement.js',
  'education.js', 'gst.js', 'gratuity.js'
];

for (const file of files) {
  const filePath = `scripts/${file}`;
  if (!fs.existsSync(filePath)) continue;

  let js = fs.readFileSync(filePath, 'utf8');

  // Replace syncSlider if exists
  js = js.replace(/function syncSlider[\s\S]*?\}\s*?(?=\n\S)/, syncSliderReplacement + '\n');
  
  // Hide sections on reset
  js = js.replace(/document\.getElementById\('recommSection'\)\.style\.display\s*=\s*'';/g, "document.getElementById('recommSection').classList.remove('hidden');");
  js = js.replace(/document\.getElementById\('resultsSection'\)\?.removeAttribute\('style'\);/g, "document.getElementById('resultsSection')?.classList.remove('hidden');");
  js = js.replace(/document\.getElementById\('chartSection'\)\.style\.display\s*=\s*'';/g, "document.getElementById('chartSection').classList.remove('hidden');");
  js = js.replace(/document\.getElementById\('chartSection'\)\.style\.display\s*=\s*'none';/g, "document.getElementById('chartSection').classList.add('hidden');");
  js = js.replace(/\[\s*'recommSection',\s*'resultsSection',\s*'chartSection'\s*\].forEach\(id => \{ const el = document.getElementById\(id\); if \(el\) el.style.display = 'none'; \}\);/g, "['recommSection', 'resultsSection', 'chartSection'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });");

  fs.writeFileSync(filePath, js, 'utf8');
}
