/**
 * Batch 5: Final expansion — all remaining pharmacy websites found.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ny-pharmacies-batch5.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-pharmacies-batch5.json');

const PHARMACIES = [
  // Long Island — additional
  { name: "Country Chemist PJ", url: "https://countrychemistrx.com" },

  // Brooklyn — additional
  { name: "Ditmas Park Pharmacy", url: "https://www.ditmasparkrx.com" },

  // NJ — additional
  { name: "Park Avenue Pharmacy NJ", url: "https://www.parkaverx.com" },
  { name: "Aspire Health Pharmacy", url: "https://www.aspirehealthrx.com" },

  // Harlem / Bronx — additional
  { name: "Ambar Pharmacy", url: "https://www.ambarpharmacy.com" },
  { name: "Desai's Pharmacy", url: "https://desaispharmacy.com" },
  { name: "Harlem Pharmacy & Surgicals", url: "https://hrxsurg.com" },

  // NCPA/GNP members commonly found
  { name: "Bedford Chemists", url: "https://www.bedfordchemists.com" },
  { name: "Montague Pharmacy", url: "https://www.montaguepharmacy.com" },
  { name: "Dashing Diva Pharmacy", url: "https://www.dashingdivarx.com" },
  { name: "Madison Ave Pharmacy Albany", url: "https://madisonavenuepharmacy.com" },
  { name: "Grand Central Pharmacy", url: "https://www.grandcentralpharmacyny.com" },

  // Staten Island additions
  { name: "Apthorp Pharmacy", url: "https://www.apthorprx.com" },
  { name: "Bloomingdale Pharmacy", url: "https://bloomingdalepharmacy.com" },
  { name: "New Amsterdam Pharmacy", url: "https://newamsterdampharmacy.com" },

  // Queens additions
  { name: "Hollis Pharmacy", url: "https://www.hollispharmacy.com" },
  { name: "Laurelton Pharmacy", url: "https://laureltonpharmacy.com" },
  { name: "Queens Drugs Surgical", url: "https://www.queensdrugs.com" },

  // Brooklyn additions
  { name: "JC Pharmacy", url: "https://www.jcpharmacy.net" },
  { name: "H&H Pharmacy", url: "https://www.hhpharmacy.com" },
  { name: "Medmark Pharmacy", url: "https://medmarkny.com" },
  { name: "CityRx Pharmacy", url: "https://www.cityrxpharmacy.com" },
  { name: "Health First Pharmacy", url: "https://healthfirstpharmacy.net" },

  // NJ additions
  { name: "Town Drug Pharmacy NJ", url: "https://www.towndrugpharmacy.com" },
  { name: "Princeton Pharmacy NJ", url: "https://princetonpharmacynj.com" },
  { name: "Newark Pharmacy", url: "https://www.newarkpharmacy.com" },
  { name: "Elizabeth Pharmacy", url: "https://elizabethpharmacynj.com" },

  // Westchester additions
  { name: "Pleasantville Pharmacy", url: "https://pleasantvillepharmacy.com" },
  { name: "White Plains Pharmacy", url: "https://whiteplainsrx.com" },
  { name: "Dobbs Ferry Pharmacy", url: "https://dobbsferryrx.com" },
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

  console.log(`=== NY Pharmacies Batch 5: ${unique.length} websites ===\n`);
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
