const fs = require('fs');
const path = require('path');

// Known owner names from WebSearch research
const KNOWN_OWNERS = {
  'labarbecue.com': 'Ali Clem',
  'lenoirrestaurant.com': 'Todd Duplechan & Jessica Maher',
  'oddduckaustin.com': 'Bryce Gilmore',
  'barleyswine.com': 'Bryce Gilmore',
  'hestiaaustin.com': 'Kevin Fink & Tavel Bristol-Joseph',
  'deedeeatx.com': 'Justin & Lakana Trubiana',
  'nixtataqueria.com': 'Edgar Rico & Sara Mardanbigi',
  'fondasanmiguel.com': 'Tom Gilliland & Miguel Ravago',
  'billsoyster.com': 'Stewart Jarmon & Daniel Berg',
  'habanerocafe.com': 'Arturo & Evelyn Ibarra',
  'mattselrancho.com': 'Gloria, Cecilia & Cathy Martinez',
  'hooverscooking.com': 'Hoover Alexander',
  'evangelinecafe.com': 'Curtis Clarke',
  'catfishparlour.com': 'David Beal',
  'kerbeylanecafe.com': 'Mason Family',
  'juaninamillion.com': 'Juan Meza',
  'bouldincreekcafe.com': 'Woman-owned',
  'jacobysaustin.com': 'Jacoby Family',
  'thepeachedtortilla.com': 'Eric Silverstein',
  'astersethiopian.com': 'Family-owned since 1991',
  'marioseafood.com': 'Mario Sorto',
  'fresaschicken.com': 'Local Austin',
  'gueros.com': 'Rob Lippincott',
  'chilantrobbq.com': 'Jae Kim',
  'parkside-austin.com': 'Shawn Cirkiel',
  'patrizis.com': 'Patrizi Family',
  'thai-fresh.com': 'Family-owned',
  'jollygoatcoffee.com': '',
  'mamajambalaya.com': 'New Orleans family',
  'hetsayaustin.com': 'Het Say family',
  'tamalehouseeast.com': 'Founded 1958',
  'dongnaiaustin.com': 'Steven Pham',
  'perlasaustin.com': 'Larry McGuire & Tom Moorman',
  'kerlinbbq.com': 'Bill Kerlin',
  'fixesouthernhouse.com': 'Keith',
  'crafteatsaustin.com': 'Tom Micklethwait',
  'bombaysham@yahoo.com': 'Sham',
};

// False positive emails to exclude
const BAD_EMAILS = [
  'support@spillover.com',
  'press@haihospitality.com',
];

// Read both CSVs
function readCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').slice(1); // skip header
  return lines.map(line => {
    const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
    if (match) return { name: match[1], owner: match[2], email: match[3], url: match[4] };
    return null;
  }).filter(Boolean);
}

const batch1 = readCsv(path.join(__dirname, 'austin-restaurants.csv'));
const batch2 = readCsv(path.join(__dirname, 'austin-restaurants-batch2.csv'));

// Merge and deduplicate by domain
const all = {};
for (const r of [...batch1, ...batch2]) {
  try {
    const domain = new URL(r.url).hostname.replace(/^www\./, '');

    // Skip false positives
    if (BAD_EMAILS.includes(r.email)) continue;

    if (!all[domain]) {
      // Try to add owner name from known list
      let owner = r.owner || '';
      if (!owner && KNOWN_OWNERS[domain]) owner = KNOWN_OWNERS[domain];
      all[domain] = { ...r, owner };
    }
  } catch {}
}

// Build final CSV
const rows = ['Restaurant Name,Owner/Manager Name,Email,Website URL'];
const entries = Object.values(all).sort((a, b) => a.name.localeCompare(b.name));

for (const r of entries) {
  rows.push(`"${r.name}","${r.owner}","${r.email}","${r.url}"`);
}

const finalPath = path.join(__dirname, 'austin-restaurants-final.csv');
fs.writeFileSync(finalPath, rows.join('\n') + '\n');

console.log(`=== Final Merged CSV ===`);
console.log(`Total leads: ${entries.length}`);
console.log(`With owner name: ${entries.filter(e => e.owner).length}`);
console.log(`Saved: ${finalPath}`);
