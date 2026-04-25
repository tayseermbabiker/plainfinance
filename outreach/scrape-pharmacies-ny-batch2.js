/**
 * Batch 2: Additional NY independent pharmacies to get closer to 200+.
 * All URLs collected from WebSearch results.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ny-pharmacies-batch2.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-pharmacies-batch2.json');

const PHARMACIES = [
  // Long Island - Nassau & Suffolk
  { name: "Main Source Pharmacy", url: "https://mainsourcepharmacy.com" },
  { name: "Merrick Apothecary", url: "https://apothecarygroup.com/merrick" },
  { name: "Compounding Pharmacy Long Island", url: "https://www.compoundingpharmacylongisland.com" },
  { name: "Franklin RX Pharmacy", url: "https://franklinrxpharmacy.com" },
  { name: "Vanco Pharmacy", url: "https://vancopharmacy.com" },
  { name: "Long Island Apothecary", url: "https://longislandapothecary.com" },
  { name: "West Hempstead Pharmacy", url: "https://www.whpharmacy.com" },
  { name: "Prescription Center of Long Island", url: "https://www.rxcenterli.com" },
  { name: "Maple Pharmacy", url: "https://www.maplepharmacyli.com" },
  { name: "North Shore Chemists", url: "https://www.northshorechemists.com" },
  { name: "Town Pharmacy", url: "https://www.townpharmacy.care" },
  { name: "Nature's Remedy Pharmacy", url: "https://www.naturesremedypharmacy.com" },
  { name: "Rockville Centre Pharmacy", url: "https://www.rcpharmacy.com" },
  { name: "The Square Health & Wellness", url: "https://squarehw.com" },
  { name: "Nature's Prescriptions LIC", url: "https://naturesrxs.com" },
  { name: "Transcript Pharmacy", url: "https://www.transcriptrx.com" },

  // Rochester / Monroe County
  { name: "Alexander Pharmacy", url: "https://www.alexanderrx.com" },
  { name: "Rochester Care Pharmacy", url: "https://www.rochestercarerx.com" },
  { name: "Irondequoit Pharmacy", url: "https://irondequoitpharmacy.com" },
  { name: "Twelve Corners Apothecary", url: "https://12cornersapothecary.com" },
  { name: "A&J Pharmacy", url: "https://www.ajpharmacy.co" },

  // Albany / Capital Region
  { name: "Lindsay Pharmacy", url: "https://www.lindsaypharmacy.com" },
  { name: "Fallon Wellness Pharmacy", url: "https://fallonwellnesspharmacy.com" },
  { name: "Capital Regional Pharmacy", url: "https://capitalregionalrx.com" },

  // Syracuse / Central NY
  { name: "Burnet Pharmacy", url: "https://www.burnetpharmacy.com" },
  { name: "C&J Northside Pharmacy", url: "https://www.candjnorthsidepharmacy.com" },

  // Hudson Valley
  { name: "Hudson View Pharmacy", url: "https://www.hudsonviewpharmacy.com" },
  { name: "Molloy Pharmacy", url: "https://molloypharmacy.com" },

  // Buffalo / Western NY
  { name: "Vital Pharmacy", url: "https://www.vitalpharmacyrx.com" },

  // Manhattan (additional)
  { name: "Apotheco Pharmacy Manhattan", url: "https://www.apothecopharmacy.com" },

  // Bronx (additional)
  { name: "Riverdale Specialty Pharmacy", url: "https://riverdalespecialtypharmacy.com" },
  { name: "MediServ Pharmacy", url: "https://mediservpharmacy.com" },
  { name: "Best Pharmacy NYC", url: "https://www.bestpharmacynyc.com" },
  { name: "Compounding Pharmacy Bronx", url: "https://www.compoundingpharmacybronx.com" },

  // Queens (additional)
  { name: "Sterling Pharmacy", url: "https://www.sterlingpharmacyny.com" },
  { name: "Bayside Compounding Pharmacy", url: "https://baysidecompoundingpharmacy.com" },
  { name: "Pharmaconic Littleneck", url: "https://pharmaconic.com" },
  { name: "Health Source Plus Pharmacy", url: "https://www.healthsourceplusrx.com" },
  { name: "Forest Hills Organics", url: "https://www.foresthillsorganicsrx.com" },
  { name: "Altru Chemists", url: "https://www.altrurx.com" },
  { name: "Bliss Drugs", url: "https://www.blissdrugs.com" },
  { name: "Chemist Shop LIC", url: "https://www.thechemistshoppharmacy.com" },
  { name: "Healthy Living Pharmacy LIC", url: "https://healthylivingpharmacylic.com" },

  // Brooklyn (additional)
  { name: "Farmacon Pharmacy", url: "https://www.farmaconpharmacy.com" },
  { name: "Bay Pharmacy", url: "https://thebaypharmacy.com" },
  { name: "Lowens Pharmacy", url: "https://lowensrx.com" },
  { name: "Bay Chemists", url: "https://www.baychemists.com" },
  { name: "Williamsburg Pharmacy", url: "https://www.wbpharmacy.net" },
  { name: "Northside Pharmacy", url: "https://www.northsidepharmacy.nyc" },
  { name: "Corner Pharmacy", url: "https://www.cornerpharmacyny.com" },
  { name: "MG Pharmacy", url: "https://www.mgpharmacyny.com" },
  { name: "Crown Drugs", url: "https://crowndrugs.com" },
  { name: "Boro Park Pharmacy", url: "https://www.boroparkpharmacy.com" },
  { name: "Shalom Pharmacy", url: "https://www.shalomspharmacy.com" },
  { name: "Compounding Pharmacy Brooklyn", url: "https://www.compoundingpharmacybrooklyn.com" },

  // Staten Island (additional)
  { name: "Chemist On Bay", url: "https://www.chemistonbayrx.com" },

  // Westchester (additional)
  { name: "Sunshine Pharmacy WP", url: "https://www.mysunshinepharmacy.com" },
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

// Stricter owner name extraction — only high-confidence matches
function extractOwnerName(text) {
  const patterns = [
    // "X is the owner/pharmacist/founder of..."
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is\s+(?:the\s+)?(?:owner|founder|proprietor|pharmacist\s+(?:and\s+)?owner|head\s+pharmacist)|,\s*(?:Pharm\.?D\.?|R\.?Ph\.?|owner|founder))/g,
    // "owned by X" / "founded by X"
    /(?:owned|founded|established|operated)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    // "X, Pharm.D." / "X, RPh"
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s*,\s*(?:Pharm\.?D\.?|R\.?Ph\.?)/g,
    // "Meet [the] owner X"
    /(?:meet\s+(?:the\s+)?(?:owner|founder|pharmacist|our\s+team))\s*[:\-,]?\s*([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  ];
  const names = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 5 && name.length < 40 && name.split(/\s+/).length >= 2 && name.split(/\s+/).length <= 4) {
        const lower = name.toLowerCase();
        const badWords = ['about', 'story', 'read', 'click', 'learn', 'menu', 'services',
          'pharmacy', 'welcome', 'contact', 'home', 'quick', 'link', 'team', 'our',
          'main', 'page', 'site', 'hours', 'location', 'info', 'help', 'find'];
        if (!badWords.some(w => lower.includes(w))) {
          names.push(name);
        }
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
        const kw = ['about', 'contact', 'team', 'our-story', 'staff', 'pharmacist', 'owner'];
        return anchors.filter(a => {
          const href = (a.href || '').toLowerCase();
          const text = (a.textContent || '').toLowerCase();
          return kw.some(k => href.includes(k) || text.includes(k));
        }).map(a => a.href).filter(h => { try { return new URL(h).origin === new URL(base).origin; } catch { return false; } });
      }, baseUrl);
    } catch {}

    const visited = new Set([pharmacy.url, baseUrl, baseUrl + '/']);
    const pages = [...new Set(internalLinks)].slice(0, 4);
    for (const suffix of ['/contact', '/about', '/about-us', '/contact-us']) pages.push(baseUrl + suffix);

    for (const link of pages) {
      const norm = link.replace(/\/$/, '');
      if (visited.has(norm) || visited.has(norm + '/')) continue;
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
      const domain = new URL(p.url).hostname.replace(/^www\./, '');
      if (!seen.has(domain)) { seen.add(domain); unique.push(p); }
    } catch {}
  }

  console.log(`=== NY Pharmacies Batch 2: Scraping ${unique.length} more websites ===\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const results = [];
  for (let i = 0; i < unique.length; i++) {
    const p = unique[i];
    process.stdout.write(`[${i + 1}/${unique.length}] ${p.name.padEnd(32)} `);
    const info = await scrapePharmacy(context, p);
    results.push(info);
    if (info.emails.length > 0) {
      console.log(`EMAIL: ${info.emails[0]}${info.ownerName ? ' | Owner: ' + info.ownerName : ''}`);
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
      const ranked = r.emails.sort((a, b) => {
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
  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n') + '\n');

  const withEmail = results.filter(r => r.emails.length > 0);
  console.log(`\n=== Summary ===`);
  console.log(`Checked: ${unique.length} | With email: ${withEmail.length} | With owner: ${results.filter(r => r.ownerName).length}`);
  console.log(`Saved: ${OUTPUT_CSV}`);
}

main().catch(console.error);
