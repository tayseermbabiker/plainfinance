const fs = require('fs');
const path = require('path');

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').slice(1);
  return lines.map(line => {
    const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
    if (match) return { name: match[1], founder: match[2], email: match[3], category: match[4], url: match[5] };
    return null;
  }).filter(Boolean);
}

const files = [
  'ecommerce-brands.csv',
  'ecommerce-brands-batch2.csv',
  'ecommerce-brands-batch3.csv',
];

const all = {};
let totalRead = 0;
for (const f of files) {
  const rows = readCsv(path.join(__dirname, f));
  totalRead += rows.length;
  console.log(`${f}: ${rows.length} rows`);
  for (const r of rows) {
    try {
      const domain = new URL(r.url).hostname.replace(/^www\./, '');

      // Skip obvious false positives
      if (r.email.includes('support@ruggable.co.kr')) continue; // foreign support

      // Clean founder name
      let founder = r.founder || '';
      if (founder && (founder.toLowerCase().includes('is now') ||
        founder.toLowerCase().includes('knows') ||
        founder.toLowerCase().includes('quick') ||
        founder.toLowerCase().includes('brand ') ||
        founder.toLowerCase().includes('learn'))) {
        founder = '';
      }

      if (!all[domain]) {
        all[domain] = { ...r, founder };
      } else if (!all[domain].founder && founder) {
        all[domain].founder = founder;
      }
    } catch {}
  }
}

const rows = ['Brand Name,Founder Name,Email,Category,Website URL'];
const entries = Object.values(all).sort((a,b) => (a.category||'').localeCompare(b.category||'') || a.name.localeCompare(b.name));
for (const r of entries) {
  rows.push(`"${r.name}","${r.founder}","${r.email}","${r.category}","${r.url}"`);
}

const finalPath = path.join(__dirname, 'ecommerce-brands-final.csv');
fs.writeFileSync(finalPath, rows.join('\n') + '\n');

console.log(`\n=== Final Merged ===`);
console.log(`Total rows read: ${totalRead}`);
console.log(`Unique brands: ${entries.length}`);
console.log(`With founder name: ${entries.filter(e => e.founder).length}`);

// Category breakdown
const byCategory = {};
for (const e of entries) {
  byCategory[e.category] = (byCategory[e.category] || 0) + 1;
}
console.log(`\nBy category:`);
for (const [cat, count] of Object.entries(byCategory).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${cat}: ${count}`);
}

console.log(`\nSaved: ${finalPath}`);
