/**
 * Batch 3: Additional NY/NJ pharmacy websites from latest WebSearch results.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ny-pharmacies-batch3.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-pharmacies-batch3.json');

const PHARMACIES = [
  // Long Island (Suffolk)
  { name: "Islip Pharmacy", url: "https://www.islippharmacy.com" },

  // Westchester
  { name: "Grassy Sprain Pharmacy", url: "https://www.grassysprainpharmacy.com" },
  { name: "WestRiver Pharmacy", url: "https://westriver-pharmacy.com" },
  { name: "Bayview Pharmacy", url: "https://www.bayviewrx.com" },

  // Brooklyn
  { name: "Super Health Pharmacy Park Slope", url: "https://www.superhealthpharmacyps.com" },

  // Queens
  { name: "Hill Pharmacy Maspeth", url: "https://www.myhillpharmacy.com" },
  { name: "AV Chemist Glendale", url: "https://avchemist.com" },

  // Saratoga
  { name: "Menges & Curtis Apothecary", url: "https://www.mengesandcurtis.com" },

  // Connecticut (nearby)
  { name: "Chapel Street Pharmacy", url: "https://www.chapelstreetpharmacy.com" },
  { name: "CT Pharmacy", url: "https://ctpharmacy.net" },
  { name: "Hancock Pharmacy", url: "https://www.hancockrx.com" },
  { name: "Bridgeport Pharmacy", url: "https://www.bridgeportpharmacy.net" },
  { name: "Unity RX", url: "https://unityrxs.com" },
  { name: "New Haven Pharmacy", url: "https://www.newhavenrx.com" },
  { name: "V-Care Pharmacy CT", url: "https://myvcarepharmacy.com" },

  // New Jersey
  { name: "HB Pharmacy", url: "https://hbpharmacy.com" },
  { name: "Clear Cities Pharmacy", url: "https://www.clearcitiespharmacy.com" },
  { name: "Park Ave Pharmacy NJ", url: "https://www.parkavepharmacy.com" },
  { name: "Pharmacy Plus NJ", url: "http://www.pharmacyplusnj.com" },
  { name: "NuPathways Rx", url: "https://www.nupathwaysrxpharmacy.com" },
  { name: "North Brunswick Pharmacy", url: "https://northbrunswickpharmacy.com" },
  { name: "Quick Aid Pharmacy", url: "https://quickaidnj.com" },
  { name: "Morristown Pharmacy", url: "https://morristownrx.com" },

  // Manhattan
  { name: "Fancy RX", url: "https://www.fancyrx.com" },

  // Additional from index pages
  { name: "Catholic Health Long Island", url: "https://www.catholichealthli.org" },
  { name: "Dedrick Pharmacy", url: "https://www.dedricks.com" },
  { name: "Beacon Wellness Pharmacy", url: "https://beaconwellnessrx.com" },
  { name: "Rockland Pharmacy", url: "https://rocklandrx.com" },
  { name: "Valuable Drugs", url: "https://valuabledrugs.com" },
  { name: "Saxon Pharmacy", url: "https://www.saxonpharmacy.com" },
  { name: "Hartsdale Pharmacy", url: "https://www.hartsdalepharmacy.com" },
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
      && !lower.includes('.css') && !lower.includes('.js');
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
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is\s+(?:the\s+)?(?:owner|founder|proprietor|pharmacist\s+(?:and\s+)?owner|head\s+pharmacist)|,\s*(?:Pharm\.?D\.?|R\.?Ph\.?|owner|founder))/g,
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

  console.log(`=== NY Pharmacies Batch 3: ${unique.length} websites ===\n`);
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
