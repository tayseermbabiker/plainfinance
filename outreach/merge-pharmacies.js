const fs = require('fs');
const path = require('path');

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').slice(1);
  return lines.map(line => {
    const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
    if (match) return { name: match[1], owner: match[2], email: match[3], url: match[4] };
    return null;
  }).filter(Boolean);
}

const files = [
  'ny-pharmacies.csv',
  'ny-pharmacies-batch2.csv',
  'ny-pharmacies-batch3.csv',
  'ny-pharmacies-batch4.csv',
  'ny-pharmacies-batch5.csv',
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
      // Skip bad owner names (false positives with fragments)
      const badOwner = r.owner && (r.owner.toLowerCase().includes(' is ') ||
        r.owner.toLowerCase().includes('knows') ||
        r.owner.toLowerCase().includes('always') ||
        r.owner.toLowerCase().includes('quick') ||
        r.owner.toLowerCase().includes('graduating') ||
        r.owner.toLowerCase().includes('cares') ||
        r.owner.toLowerCase().includes('nice') ||
        r.owner.toLowerCase().includes('works') ||
        r.owner.toLowerCase().includes('trained') ||
        r.owner.toLowerCase().includes('very') ||
        r.owner.toLowerCase().includes('called') ||
        r.owner.toLowerCase().includes('consultation') ||
        r.owner.toLowerCase().includes('operations') ||
        r.owner.toLowerCase().includes('seaview'));
      const owner = badOwner ? '' : r.owner;

      // Skip known false positive emails
      if (r.email === 'support@spillover.com') continue;
      if (r.email === 'mymail@mailservice.com') continue;
      if (r.email.startsWith('%')) continue;

      if (!all[domain]) {
        all[domain] = { ...r, owner };
      } else if (!all[domain].owner && owner) {
        all[domain].owner = owner;
      }
    } catch {}
  }
}

const rows = ['Pharmacy Name,Owner/Pharmacist Name,Email,Website URL'];
const entries = Object.values(all).sort((a,b) => a.name.localeCompare(b.name));
for (const r of entries) {
  rows.push(`"${r.name}","${r.owner}","${r.email}","${r.url}"`);
}

const finalPath = path.join(__dirname, 'ny-pharmacies-final.csv');
fs.writeFileSync(finalPath, rows.join('\n') + '\n');

console.log(`\n=== Final Merged ===`);
console.log(`Total rows read: ${totalRead}`);
console.log(`Unique pharmacies: ${entries.length}`);
console.log(`With owner name: ${entries.filter(e => e.owner).length}`);
console.log(`Saved: ${finalPath}`);
