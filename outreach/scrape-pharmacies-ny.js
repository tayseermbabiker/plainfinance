/**
 * Scrape independent pharmacies in New York for PlainFinancials outreach.
 * Only collects publicly posted contact info from pharmacy websites.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ny-pharmacies.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-pharmacies.json');

const PHARMACIES = [
  // Manhattan
  { name: "Park West Pharmacy", url: "https://www.parkwestpharmacy.com" },
  { name: "Thriftway Pharmacy NYC", url: "https://www.thriftwaynyc.com" },
  { name: "Cherry's Pharmacy", url: "https://www.cherryspharmacy.com" },
  { name: "Ivan Pharmacy", url: "https://ivanpharmacy.com" },
  { name: "Tu Quynh Pharmacy", url: "https://www.tuquynhrx.com" },
  { name: "Healthy Harlem Pharmacy", url: "https://www.healthyharlemrx.org" },
  { name: "Harlem Community Pharmacy", url: "https://harlemcrx.com" },
  { name: "Healthy Heights Pharmacy", url: "https://www.healthyheightspharmacy.com" },
  { name: "90th Street Pharmacy", url: "https://www.90thstpharmacy.com" },
  { name: "Zitomer Pharmacy", url: "https://zitomer.com" },
  { name: "Caligor Pharmacy", url: "https://www.caligorpharmacy.com" },
  { name: "Compounding Pharmacy NYC", url: "https://www.compoundpharmacynyc.com" },
  { name: "Community Pharmacy NYC", url: "https://communitypharmacynyc.com" },
  { name: "Enexia Specialty Pharmacy", url: "https://www.enexiaspecialty.com" },
  { name: "Gigi Specialty Pharmacy", url: "https://gigispecialtypharmacy.com" },

  // Brooklyn
  { name: "New Victory Pharmacy", url: "https://www.newvictorypharmacy.com" },
  { name: "Kelly's Pharmacy", url: "https://www.kellyspharm.com" },
  { name: "Mill Park Pharmacy", url: "https://www.millparkpharmacy.com" },
  { name: "Life Care Pharmacy", url: "https://www.lifecarepharmacyny.com" },
  { name: "FriendlyRx", url: "https://www.friendlyrxny.com" },
  { name: "Prospect Pharmacy", url: "https://www.prospectdrugs.com" },
  { name: "Park Chemists Pharmacy", url: "https://www.parkchemistsrx.com" },
  { name: "Thriftway Flatbush", url: "https://www.thriftwayflatbush.com" },
  { name: "Oxford Pharmacy", url: "https://oxfordpharmacyny.com" },
  { name: "David's Pharmacy", url: "https://www.davidsdrugs.com" },
  { name: "Faith Pharmacy", url: "https://faithpharmacyrx.com" },
  { name: "SouthSide Pharmacy", url: "https://www.southsidedrugs.com" },

  // Queens
  { name: "Auburndale Pharmacy", url: "https://www.auburndalepharmacy.com" },
  { name: "Jewel Pharmacy", url: "https://www.jewelpharm.com" },
  { name: "Catalpa Chemists", url: "https://www.catalpachemists.com" },
  { name: "Frank's Pharmacy", url: "https://www.frankspharmacyny.com" },
  { name: "Big Six Pharmacy", url: "https://bigsixrx.com" },
  { name: "AV Chemist", url: "https://avchemist.com" },

  // Bronx
  { name: "Boom Pharmacy", url: "https://www.boompharmacy.com" },
  { name: "Moscoso Pharmacy", url: "https://www.moscosopharmacy.com" },
  { name: "Oval Drug", url: "https://www.ovaldrugrx.com" },
  { name: "Starling Pharmacy", url: "https://www.starlingpharmacy.com" },
  { name: "Oval Pharmacy", url: "https://www.ovalpharmacy.com" },
  { name: "Mt. Carmel Pharmacy", url: "https://www.mtcarmelpharmacy.com" },
  { name: "Pure Health Pharmacy", url: "https://www.purerxpharmacy.com" },

  // Staten Island
  { name: "Randall Manor Pharmacy", url: "https://www.randallmanorpharmacy.com" },
  { name: "Dongan Hills Pharmacy", url: "https://www.donganhillspharmacy.com" },
  { name: "Seaview Pharmacy", url: "https://seaview-pharmacy.com" },
  { name: "Richmond Valley Pharmacy", url: "https://www.richmondvalleypharmacy.com" },
  { name: "Brighton Community Pharmacy", url: "https://www.brightoncommunityrx.com" },
  { name: "Ocean Breeze Pharmacy", url: "https://www.oceanbreezepharmacy.com" },
  { name: "SI Compounding Pharmacy", url: "https://www.compoundingpharmacystatenisland.com" },

  // Westchester / Yonkers
  { name: "Rye Beach Pharmacy", url: "https://www.ryerx.com" },
  { name: "Westchester Compounding", url: "https://www.wc-rx.com" },
  { name: "Yonkers Pharmacy", url: "https://www.yonkerspharm.com" },
  { name: "Fleetwood Specialty Pharmacy", url: "https://www.fleetwoodrx.com" },
  { name: "Community Pharmacy Brewster", url: "https://www.communitypharmacybrewster.com" },

  // Upstate NY
  { name: "Upstate Pharmacy", url: "https://www.upstatepharmacy.com" },
  { name: "Buffalo Pharmacies", url: "https://buffalopharmacies.com" },
  { name: "Clinton Pharmacy Buffalo", url: "https://www.clintonpharmacybuffalo.com" },

  // Long Island
  { name: "L&M Pharmacy", url: "http://www.landmpharmacy.com" },

  // New Jersey (nearby market)
  { name: "Baron's Drug Store", url: "https://www.baronsdrugstore.com" },
  { name: "Bonhamtown Pharmacy", url: "https://www.bonhamtownpharmacy.com" },
  { name: "Bowker's Pharmacy", url: "https://www.bowkersrx.com" },
  { name: "Crosskeys Pharmacy", url: "https://www.crosskeyspharmacy.com" },
  { name: "Better Life Pharmacy", url: "https://betterlifenj.com" },
  { name: "Skillzcare Pharmacy", url: "https://www.skillzcarepharmacy.com" },
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
      && !lower.includes('@instagram') && !lower.includes('@twitter')
      && !lower.includes('@facebook');
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
    /(?:owner|founder|pharmacist[\s\-\/&]+owner|owned\s+(?:and\s+operated\s+)?by|operated by|founded by)\s*[:\-–—]?\s*([A-Z][a-z]+(?:\s+(?:and|&)\s+)?(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,3})/g,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})\s*[,\-–—]\s*(?:owner|founder|pharmacist[\s\/&]+owner|co[\s\-]?owner|Pharm\.?\s*D\.?|RPh)/g,
    /(?:pharmacist|head\s+pharmacist|lead\s+pharmacist)\s*[:\-–—]?\s*([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})/gi,
  ];
  const names = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 3 && name.length < 50 && name.split(/\s+/).length >= 2 && name.split(/\s+/).length <= 5) {
        const lower = name.toLowerCase();
        if (!lower.includes('about') && !lower.includes('story') && !lower.includes('read')
          && !lower.includes('click') && !lower.includes('learn') && !lower.includes('menu')
          && !lower.includes('services') && !lower.includes('pharmacy')) {
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

    // Find internal About/Contact links
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
  // Deduplicate
  const seen = new Set();
  const unique = [];
  for (const p of PHARMACIES) {
    try {
      const domain = new URL(p.url).hostname.replace(/^www\./, '');
      if (!seen.has(domain)) { seen.add(domain); unique.push(p); }
    } catch {}
  }

  console.log(`=== NY Independent Pharmacies: Scraping ${unique.length} websites ===\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const results = [];
  for (let i = 0; i < unique.length; i++) {
    const p = unique[i];
    process.stdout.write(`[${i + 1}/${unique.length}] ${p.name.padEnd(30)} `);
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

  // CSV
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
  console.log(`Pharmacies checked: ${unique.length}`);
  console.log(`With public email: ${withEmail.length}`);
  console.log(`With owner/pharmacist name: ${results.filter(r => r.ownerName).length}`);
  console.log(`CSV rows: ${csvRows.length - 1}`);
  console.log(`\nSaved: ${OUTPUT_CSV}`);
}

main().catch(console.error);
