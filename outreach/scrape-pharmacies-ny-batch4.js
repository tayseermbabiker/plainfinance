/**
 * Batch 4: Final push — more NY/NJ/CT pharmacies.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ny-pharmacies-batch4.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-pharmacies-batch4.json');

const PHARMACIES = [
  // Queens
  { name: "Richmond Hill Pharmacy Inc", url: "https://www.rhpharminc.com" },
  { name: "Richmond Hill Pharmacy", url: "https://richmondhillpharmacy.com" },
  { name: "Sure Drugs Pharmacy", url: "https://www.suredrugspharmacy.com" },
  { name: "Richmond Heights Pharmacy", url: "https://www.richmondheightspharmacy.com" },

  // Long Island - Suffolk
  { name: "Holbrook Pharmacy", url: "https://www.holbrookrx.com" },
  { name: "Lakeland Pharmacy", url: "https://lakeland-pharmacy.com" },

  // Nassau
  { name: "Oceanside Pharmacy", url: "https://www.myoceansiderx.com" },

  // Brooklyn
  { name: "New Age Pharmacy", url: "https://www.newagepharm.com" },
  { name: "Live Well Pharmacy", url: "https://www.livewellutica.com" },
  { name: "Family Pharmacy Brooklyn", url: "https://www.familypharmacyny.com" },

  // Bronx
  { name: "Family Pharmacy Bronx", url: "https://www.familypharmacysurgicalsupply.com" },
  { name: "Family Pharmacy Harlem", url: "https://familypharmacyharlem.com" },

  // Upstate NY
  { name: "Condo Pharmacy", url: "https://www.condopharmacy.com" },
  { name: "Bolton's Pharmacy", url: "https://www.boltonspharmacy.com" },
  { name: "Owego Pharmacy", url: "https://www.theowegopharmacy.com" },

  // New Jersey
  { name: "J&J Pharmacy NJ", url: "https://www.jandjdrugstores.com" },

  // More from index pages
  { name: "FCLNY Independent Index", url: "https://www.fclny.org/independent-pharmacy-resource-index-ny" },
  { name: "Eckerd Pharmacy", url: "https://www.eckerdrx.com" },
  { name: "MedPro Pharmacy", url: "https://medproharmacyny.com" },
  { name: "Wellness Pharmacy NY", url: "https://www.wellnesspharmacyny.com" },
  { name: "Pharmacy First", url: "https://www.pharmacyfirstny.com" },
  { name: "Stanleys Pharmacy", url: "https://www.stanleysrx.com" },
  { name: "Red Apple Pharmacy", url: "https://redapplerx.com" },
  { name: "King's Pharmacy", url: "https://kingsrx.com" },
  { name: "Mini Pharmacy", url: "https://www.miniphcy.com" },

  // Additional Queens/Brooklyn independents commonly found
  { name: "Sutton Place Pharmacy", url: "https://www.suttonplacerx.com" },
  { name: "Lenox Hill Pharmacy", url: "https://www.lenoxhillpharmacy.com" },
  { name: "Gotham Pharmacy", url: "https://www.gothampharmacy.com" },
  { name: "New York Drug", url: "https://www.newyorkdrug.com" },
  { name: "City Drug Store", url: "https://www.citydrugstorenyc.com" },
];

function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return [...new Set(matches)].filter(e => {
    const lower = e.toLowerCase();
    return !lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.gif')
      && !lower.endsWith('.svg') && !lower.endsWith('.webp')
      && !lower.includes('sentry') && !lower.includes('cloudflare')
      && !lower.includes('example.com') && !lower.includes('domain.com')
      && !lower.includes('wordpress') && !lower.includes('wixpress')
      && !lower.includes('squarespace') && !lower.includes('@2x')
      && !lower.includes('protection') && !lower.includes('cdn-cgi')
      && !lower.includes('noreply') && !lower.includes('no-reply')
      && !lower.includes('.woff') && !lower.includes('.ttf')
      && !lower.includes('.css') && !lower.includes('.js')
      && !lower.includes('mymail@mailservice');
  });
}

async function extractMailtoEmails(page) {
  try {
    return await page.$$eval('a[href^="mailto:"]', anchors =>
      anchors.map(a => a.href.replace('mailto:', '').split('?')[0].trim().toLowerCase())
        .filter(e => e.includes('@'))
    );
  } catch { return []; }
}

function extractOwnerName(text) {
  const patterns = [
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is\s+(?:the\s+)?(?:owner|founder|pharmacist\s+(?:and\s+)?owner)|,\s*(?:Pharm\.?D\.?|R\.?Ph\.?|owner|founder))/g,
    /(?:owned|founded|established|operated)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s*,\s*(?:Pharm\.?D\.?|R\.?Ph\.?)/g,
  ];
  const names = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 5 && name.length < 40 && name.split(/\s+/).length >= 2 && name.split(/\s+/).length <= 4) {
        const lower = name.toLowerCase();
        const bad = ['about','story','read','click','learn','menu','services','pharmacy','welcome','contact','home','quick','link','team','our','main','page','site','hours','location','info','help','find'];
        if (!bad.some(w => lower.includes(w))) names.push(name);
      }
    }
  }
  return [...new Set(names)];
}

async function scrapePharmacy(context, pharmacy) {
  const result = { name: pharmacy.name, url: pharmacy.url, ownerName: '', emails: [] };
  const page = await context.newPage();
  try {
    const baseUrl = new URL(pharmacy.url).origin;
    await page.goto(pharmacy.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    let allText = '';
    try { allText = await page.evaluate(() => document.body?.innerText || ''); } catch {}
    result.emails.push(...await extractMailtoEmails(page));

    let internalLinks = [];
    try {
      internalLinks = await page.$$eval('a[href]', (anchors, base) => {
        const kw = ['about','contact','team','our-story','staff','pharmacist','owner'];
        return anchors.filter(a => {
          const href = (a.href||'').toLowerCase();
          const text = (a.textContent||'').toLowerCase();
          return kw.some(k => href.includes(k) || text.includes(k));
        }).map(a => a.href).filter(h => { try { return new URL(h).origin === new URL(base).origin; } catch { return false; } });
      }, baseUrl);
    } catch {}

    const visited = new Set([pharmacy.url, baseUrl, baseUrl+'/']);
    const pages = [...new Set(internalLinks)].slice(0, 4);
    for (const s of ['/contact','/about','/about-us','/contact-us']) pages.push(baseUrl+s);

    for (const link of pages) {
      const norm = link.replace(/\/$/,'');
      if (visited.has(norm) || visited.has(norm+'/')) continue;
      visited.add(norm);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(800);
        allText += '\n' + await page.evaluate(() => document.body?.innerText || '');
        result.emails.push(...await extractMailtoEmails(page));
      } catch {}
    }

    result.emails.push(...extractEmails(allText));
    result.emails = [...new Set(result.emails.map(e => e.toLowerCase()))].filter(e => e.includes('@'));
    const owners = extractOwnerName(allText);
    if (owners.length > 0) result.ownerName = owners[0];
  } catch {} finally { await page.close(); }
  return result;
}

async function main() {
  const seen = new Set();
  const unique = [];
  for (const p of PHARMACIES) {
    try {
      const domain = new URL(p.url).hostname.replace(/^www\./,'');
      if (!seen.has(domain)) { seen.add(domain); unique.push(p); }
    } catch {}
  }

  console.log(`=== NY Pharmacies Batch 4: ${unique.length} websites ===\n`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const results = [];
  for (let i = 0; i < unique.length; i++) {
    const p = unique[i];
    process.stdout.write(`[${i+1}/${unique.length}] ${p.name.padEnd(32)} `);
    const info = await scrapePharmacy(context, p);
    results.push(info);
    if (info.emails.length > 0) {
      console.log(`EMAIL: ${info.emails[0]}${info.ownerName ? ' | Owner: '+info.ownerName : ''}`);
    } else if (info.ownerName) {
      console.log(`OWNER: ${info.ownerName}`);
    } else {
      console.log('-');
    }
    await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
  }
  await browser.close();

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
  const csvRows = ['Pharmacy Name,Owner/Pharmacist Name,Email,Website URL'];
  for (const r of results) {
    if (r.emails.length > 0) {
      const ranked = r.emails.sort((a,b) => {
        const p = (e) => {
          if (e.startsWith('info@') || e.startsWith('hello@') || e.startsWith('contact@')) return 0;
          if (e.includes('gmail.com') || e.includes('yahoo.com')) return 1;
          if (e.startsWith('pharmacy@') || e.startsWith('rx@')) return 2;
          return 3;
        };
        return p(a) - p(b);
      });
      csvRows.push(`"${r.name.replace(/"/g,'""')}","${(r.ownerName||'').replace(/"/g,'""')}","${ranked[0]}","${r.url}"`);
    }
  }
  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n')+'\n');

  const withEmail = results.filter(r => r.emails.length > 0);
  console.log(`\n=== Summary ===`);
  console.log(`Checked: ${unique.length} | With email: ${withEmail.length} | With owner: ${results.filter(r => r.ownerName).length}`);
  console.log(`Saved: ${OUTPUT_CSV}`);
}

main().catch(console.error);
