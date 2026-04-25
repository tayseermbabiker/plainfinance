/**
 * Phase 2 (NY): Visit each NYC restaurant site and extract publicly posted
 * owner names + contact emails from their own About/Contact pages.
 * Reads input from ny-restaurant-urls.json (produced by phase1-collect-urls-ny.js).
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const INPUT_JSON = path.join(__dirname, 'ny-restaurant-urls.json');
const OUTPUT_CSV = path.join(__dirname, 'ny-restaurants.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-restaurants-full.json');

// Extract emails from text
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
      && !lower.includes('@sentry') && !lower.includes('webpack')
      && !lower.includes('noreply') && !lower.includes('no-reply')
      && !lower.includes('.woff') && !lower.includes('.ttf')
      && !lower.includes('.css') && !lower.includes('.js')
      && !lower.includes('spillover.com')
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
    /(?:owner|founder|proprietor|chef[\s\-\/&]+owner|co[\s\-]?owner|owned\s+(?:and\s+operated\s+)?by|operated by|founded by|created by|started by|run by)\s*[:\-–—]?\s*([A-Z][a-z]+(?:\s+(?:and|&)\s+)?(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,3})/g,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})\s*[,\-–—]\s*(?:owner|founder|proprietor|chef[\s\/&]+owner|co[\s\-]?owner)/g,
    /(?:Executive\s+Chef|Head\s+Chef|Chef)\s+(?:and\s+(?:Owner|Founder)\s+)?([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})/g,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})\s*[,\-–—]\s*(?:Executive\s+Chef|Head\s+Chef|Chef\s+(?:and\s+)?Owner)/g,
  ];
  const names = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 3 && name.length < 50 && name.split(/\s+/).length >= 2 && name.split(/\s+/).length <= 5) {
        const lower = name.toLowerCase();
        if (!lower.includes('about') && !lower.includes('story') && !lower.includes('read')
          && !lower.includes('click') && !lower.includes('learn') && !lower.includes('view')
          && !lower.includes('menu') && !lower.includes('order') && !lower.includes('contact')) {
          names.push(name);
        }
      }
    }
  }
  return [...new Set(names)];
}

// Guess restaurant name from URL if phase1 didn't capture a clean one
function nameFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').replace(/\.(com|net|org|co|nyc|restaurant|us)$/i, '');
    // Split on common separators and titlecase
    return host.split(/[-_.]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  } catch { return ''; }
}

async function scrapeRestaurant(context, restaurant) {
  const result = {
    name: restaurant.name || nameFromUrl(restaurant.url),
    url: restaurant.url,
    ownerName: '',
    emails: [],
    pagesChecked: 0,
  };
  const page = await context.newPage();

  try {
    const baseUrl = new URL(restaurant.url).origin;

    await page.goto(restaurant.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    let allText = '';
    try { allText = await page.evaluate(() => document.body?.innerText || ''); } catch {}
    result.pagesChecked++;

    // Try to extract a cleaner restaurant name from <title> / og:site_name
    try {
      const titleName = await page.evaluate(() => {
        const og = document.querySelector('meta[property="og:site_name"]');
        if (og && og.content) return og.content.trim();
        const t = document.title || '';
        return t.split(/[|\-–—]/)[0].trim();
      });
      if (titleName && titleName.length > 2 && titleName.length < 80) {
        result.name = titleName;
      }
    } catch {}

    result.emails.push(...await extractMailtoEmails(page));

    let internalLinks = [];
    try {
      internalLinks = await page.$$eval('a[href]', (anchors, base) => {
        const kw = ['about', 'contact', 'team', 'our-story', 'story', 'meet',
          'staff', 'people', 'who-we-are', 'bios', 'founder', 'owner', 'history', 'faq'];
        const results = [];
        for (const a of anchors) {
          const href = (a.href || '').toLowerCase();
          const text = (a.textContent || '').toLowerCase().trim();
          if (kw.some(k => href.includes(k) || text.includes(k))) {
            try {
              if (new URL(a.href).origin === new URL(base).origin) results.push(a.href);
            } catch {}
          }
        }
        return [...new Set(results)];
      }, baseUrl);
    } catch {}

    const visited = new Set([restaurant.url, baseUrl, baseUrl + '/']);
    const pagesToVisit = [...new Set(internalLinks)].slice(0, 4);

    for (const suffix of ['/contact', '/about', '/about-us', '/our-story', '/contact-us']) {
      pagesToVisit.push(baseUrl + suffix);
    }

    for (const link of pagesToVisit) {
      const norm = link.replace(/\/$/, '');
      if (visited.has(norm) || visited.has(norm + '/')) continue;
      visited.add(norm);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(800);
        const pt = await page.evaluate(() => document.body?.innerText || '');
        allText += '\n' + pt;
        result.pagesChecked++;
        result.emails.push(...await extractMailtoEmails(page));
      } catch {}
    }

    result.emails.push(...extractEmails(allText));
    result.emails = [...new Set(result.emails.map(e => e.toLowerCase()))].filter(e => e.includes('@'));

    const owners = extractOwnerName(allText);
    if (owners.length > 0) result.ownerName = owners[0];

  } catch {
    // Unreachable — skip
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  if (!fs.existsSync(INPUT_JSON)) {
    console.error(`Input file not found: ${INPUT_JSON}`);
    console.error(`Run phase1-collect-urls-ny.js first.`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_JSON, 'utf-8'));

  // Dedupe by host
  const seen = new Set();
  const unique = [];
  for (const r of raw) {
    try {
      const domain = new URL(r.url).hostname.replace(/^www\./, '');
      if (!seen.has(domain)) {
        seen.add(domain);
        unique.push(r);
      }
    } catch {}
  }

  console.log(`=== Phase 2 (NY): Scraping ${unique.length} restaurant websites ===\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const allResults = [];
  const withEmail = [];

  for (let i = 0; i < unique.length; i++) {
    const r = unique[i];
    const displayName = (r.name || nameFromUrl(r.url)).substring(0, 28);
    process.stdout.write(`[${i + 1}/${unique.length}] ${displayName.padEnd(30)} `);
    const info = await scrapeRestaurant(context, r);
    allResults.push(info);

    if (info.emails.length > 0) {
      withEmail.push(info);
      console.log(`EMAIL: ${info.emails[0]}${info.ownerName ? ' | Owner: ' + info.ownerName : ''}`);
    } else if (info.ownerName) {
      console.log(`OWNER ONLY: ${info.ownerName}`);
    } else {
      console.log(`-`);
    }

    // Save progress every 25 sites (long run safety)
    if ((i + 1) % 25 === 0) {
      fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allResults, null, 2));
    }

    await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
  }

  await browser.close();

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allResults, null, 2));

  const csvRows = ['Restaurant Name,Owner/Manager Name,Email,Website URL'];
  for (const r of allResults) {
    if (r.emails.length > 0) {
      const ranked = r.emails.sort((a, b) => {
        const priority = (e) => {
          if (e.startsWith('info@') || e.startsWith('hello@') || e.startsWith('contact@')) return 0;
          if (e.includes('gmail.com') || e.includes('yahoo.com') || e.includes('hotmail.com')) return 1;
          if (e.startsWith('events@') || e.startsWith('press@')) return 2;
          if (e.startsWith('reservations@') || e.startsWith('catering@') || e.startsWith('foh@')) return 4;
          return 3;
        };
        return priority(a) - priority(b);
      });
      csvRows.push([
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.ownerName || '').replace(/"/g, '""')}"`,
        `"${ranked[0]}"`,
        `"${r.url}"`,
      ].join(','));
    }
  }

  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n') + '\n');

  console.log(`\n=== Summary ===`);
  console.log(`Restaurants checked: ${unique.length}`);
  console.log(`With public email: ${withEmail.length}`);
  console.log(`With owner name: ${allResults.filter(r => r.ownerName).length}`);
  console.log(`CSV rows: ${csvRows.length - 1}`);
  console.log(`\nSaved: ${OUTPUT_CSV}`);
  console.log(`Full data: ${OUTPUT_JSON}`);
}

main().catch(console.error);
