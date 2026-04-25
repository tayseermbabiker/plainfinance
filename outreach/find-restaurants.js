const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'austin-restaurants.csv');
const RESULTS_JSON = path.join(__dirname, 'austin-restaurants.json');

// Curated list of small independent/family-owned restaurants in Austin TX
// Sources: CultureMap Austin, So Much Life, Only In Your State, web searches
const RESTAURANTS = [
  { name: "Bartlett's", url: "https://bartlettsaustin.com" },
  { name: "Bill's Oyster", url: "https://www.billsoyster.com" },
  { name: "La Barbecue", url: "https://labarbecue.com" },
  { name: "Lenoir", url: "https://www.lenoirrestaurant.com" },
  { name: "Hillside Farmacy", url: "https://www.hillsidefarmacy.com" },
  { name: "Odd Duck", url: "https://www.oddduckaustin.com" },
  { name: "Eldorado Cafe", url: "https://www.eldoradocafeatx.com" },
  { name: "Hestia", url: "https://hestiaaustin.com" },
  { name: "Dee Dee", url: "https://www.deedeeatx.com" },
  { name: "Habanero Mexican Cafe", url: "https://www.habanerocafe.com" },
  { name: "Tamale House East", url: "https://www.tamalehouseeast.com" },
  { name: "Bouldin Creek Cafe", url: "https://bouldincreekcafe.com" },
  { name: "FoodHeads", url: "https://www.foodheads.com" },
  { name: "Fat Dragon", url: "https://www.fatdragonatx.com" },
  { name: "Caspian Grill", url: "https://caspiangrillaustin.com" },
  { name: "Deckhand Oyster Bar", url: "https://www.deckhandoysterbar.com" },
  { name: "Matt's El Rancho", url: "https://mattselrancho.com" },
  { name: "Barley Swine", url: "https://www.barleyswine.com" },
  { name: "Fonda San Miguel", url: "https://www.fondasanmiguel.com" },
  { name: "Olamaie", url: "https://www.olamaieaustin.com" },
  { name: "Nixta Taqueria", url: "https://www.nixtataqueria.com" },
  { name: "LeRoy and Lewis", url: "https://leroyandlewisbbq.com" },
  { name: "Whip My Soul", url: "https://whipmysoul.shop" },
  { name: "Vic & Al's", url: "https://www.vicandals.com" },
  { name: "Joe's Bakery", url: "https://joesbakery.com" },
  { name: "Patrizi's", url: "https://www.patrizis.com" },
  { name: "Texas Honey Ham", url: "https://texashoneyham.com" },
  { name: "Roya", url: "https://www.royaaustin.com" },
  { name: "Moderna Pizzeria", url: "https://www.modernapizzeria.com" },
  { name: "Fabrik", url: "https://www.fabrikaustin.com" },
  { name: "Tare Tare", url: "https://www.taretareaustin.com" },
  { name: "InterStellar BBQ", url: "https://www.interstellarbbq.com" },
  { name: "Craft Omakase", url: "https://www.craftomakase.com" },
];

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
      && !lower.includes('protection') && !lower.includes('cdn-cgi');
  });
}

// Extract emails from mailto: links in the DOM
async function extractMailtoEmails(page) {
  try {
    return await page.$$eval('a[href^="mailto:"]', anchors =>
      anchors.map(a => a.href.replace('mailto:', '').split('?')[0].trim().toLowerCase())
        .filter(e => e.includes('@'))
    );
  } catch { return []; }
}

// Look for owner/manager names near ownership keywords
function extractOwnerName(text) {
  const patterns = [
    /(?:owner|founder|proprietor|chef[\s\-\/]+owner|co[\s\-]?owner|owned by|operated by|founded by|created by|started by|run by)\s*[:\-–—]?\s*([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,3})/g,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})\s*[,\-–—]\s*(?:owner|founder|proprietor|chef[\s\/]owner|co[\s\-]?owner)/g,
    /(?:meet|about)\s+(?:the\s+)?(?:owner|founders?)\s*[:\-–—]?\s*([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,3})/gi,
    /(?:Executive\s+Chef|Head\s+Chef|Chef)\s+(?:and\s+(?:Owner|Founder)\s+)?([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})/g,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+){1,2})\s*[,\-–—]\s*(?:Executive\s+Chef|Head\s+Chef|Chef\s+(?:and\s+)?Owner)/g,
  ];

  const names = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 3 && name.length < 50 && name.split(/\s+/).length >= 2 && name.split(/\s+/).length <= 4) {
        // Filter out common false positives
        const lower = name.toLowerCase();
        if (!lower.includes('about us') && !lower.includes('our story') && !lower.includes('read more')
            && !lower.includes('click here') && !lower.includes('learn more')) {
          names.push(name);
        }
      }
    }
  }
  return [...new Set(names)];
}

async function scrapeRestaurantSite(context, restaurant) {
  const result = {
    name: restaurant.name,
    url: restaurant.url,
    ownerName: '',
    emails: [],
    pagesChecked: [],
  };
  const page = await context.newPage();

  try {
    const baseUrl = new URL(restaurant.url).origin;

    // Visit homepage
    await page.goto(restaurant.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    let allText = '';
    try { allText = await page.evaluate(() => document.body?.innerText || ''); } catch {}
    result.pagesChecked.push(restaurant.url);

    // Get mailto emails from homepage
    const homeMailtos = await extractMailtoEmails(page);
    result.emails.push(...homeMailtos);

    // Find internal links to About, Contact, Team, Our Story pages
    let internalLinks = [];
    try {
      internalLinks = await page.$$eval('a[href]', (anchors, base) => {
        const keywords = ['about', 'contact', 'team', 'our-story', 'our story', 'story', 'meet',
          'staff', 'people', 'who-we-are', 'bios', 'founders', 'owner', 'history', 'faq'];
        const results = [];
        for (const a of anchors) {
          const href = (a.href || '').toLowerCase();
          const text = (a.textContent || '').toLowerCase().trim();
          if (keywords.some(k => href.includes(k) || text.includes(k))) {
            try {
              if (new URL(a.href).origin === new URL(base).origin) {
                results.push(a.href);
              }
            } catch {}
          }
        }
        return results;
      }, baseUrl);
    } catch {}

    // Visit each relevant internal page
    const visited = new Set([restaurant.url, baseUrl, baseUrl + '/']);
    const uniqueLinks = [...new Set(internalLinks)].slice(0, 6);

    for (const link of uniqueLinks) {
      const normalized = link.replace(/\/$/, '');
      if (visited.has(normalized) || visited.has(normalized + '/')) continue;
      visited.add(normalized);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);
        const pageText = await page.evaluate(() => document.body?.innerText || '');
        allText += '\n' + pageText;
        result.pagesChecked.push(link);

        // Check for mailto links on this page too
        const pageMailtos = await extractMailtoEmails(page);
        result.emails.push(...pageMailtos);
      } catch (err) {
        console.log(`    Subpage error (${link}): ${err.message.substring(0, 60)}`);
      }
    }

    // Also check /contact directly if not already visited
    for (const suffix of ['/contact', '/contact-us', '/about', '/about-us', '/our-story']) {
      const contactUrl = baseUrl + suffix;
      const norm = contactUrl.replace(/\/$/, '');
      if (visited.has(norm) || visited.has(norm + '/')) continue;
      visited.add(norm);
      try {
        await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(1000);
        const ct = await page.evaluate(() => document.body?.innerText || '');
        allText += '\n' + ct;
        result.pagesChecked.push(contactUrl);
        const ctMailtos = await extractMailtoEmails(page);
        result.emails.push(...ctMailtos);
      } catch {}
    }

    // Extract info from all collected text
    const textEmails = extractEmails(allText);
    result.emails.push(...textEmails);
    result.emails = [...new Set(result.emails.map(e => e.toLowerCase()))].filter(e => e.includes('@'));

    const owners = extractOwnerName(allText);
    if (owners.length > 0) result.ownerName = owners[0];

  } catch (err) {
    console.log(`  Error scraping ${restaurant.name}: ${err.message.substring(0, 80)}`);
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  console.log('=== PlainFinancials Outreach: Austin TX Restaurants ===');
  console.log(`Checking ${RESTAURANTS.length} restaurant websites for publicly posted contact info.\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const results = [];

  for (let i = 0; i < RESTAURANTS.length; i++) {
    const r = RESTAURANTS[i];
    console.log(`[${i + 1}/${RESTAURANTS.length}] ${r.name} (${r.url})`);
    const info = await scrapeRestaurantSite(context, r);

    if (info.emails.length > 0 || info.ownerName) {
      results.push(info);
      console.log(`  -> Owner: ${info.ownerName || '(not found)'}`);
      console.log(`  -> Emails: ${info.emails.join(', ') || '(none)'}`);
      console.log(`  -> Pages checked: ${info.pagesChecked.length}`);
    } else {
      console.log(`  -> No public contact info found (checked ${info.pagesChecked.length} pages)`);
    }
    console.log('');

    // Brief delay between sites
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
  }

  await browser.close();

  // Save JSON
  fs.writeFileSync(RESULTS_JSON, JSON.stringify(results, null, 2));
  console.log(`\nFull results: ${RESULTS_JSON}`);

  // Build CSV — one row per email
  const csvHeader = 'Restaurant Name,Owner/Manager Name,Email,Website URL';
  const csvRows = [];

  for (const r of results) {
    if (r.emails.length > 0) {
      for (const email of r.emails) {
        csvRows.push([
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.ownerName || '').replace(/"/g, '""')}"`,
          `"${email}"`,
          `"${r.url}"`,
        ].join(','));
      }
    } else if (r.ownerName) {
      // Include owner-only rows (no email)
      csvRows.push([
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.ownerName || '').replace(/"/g, '""')}"`,
        `""`,
        `"${r.url}"`,
      ].join(','));
    }
  }

  fs.writeFileSync(OUTPUT_CSV, csvHeader + '\n' + csvRows.join('\n') + '\n');
  console.log(`CSV: ${OUTPUT_CSV}`);

  // Summary
  const withEmail = results.filter(r => r.emails.length > 0);
  const withOwner = results.filter(r => r.ownerName);
  console.log(`\n=== Summary ===`);
  console.log(`Restaurants checked: ${RESTAURANTS.length}`);
  console.log(`With public email: ${withEmail.length}`);
  console.log(`With owner name: ${withOwner.length}`);
  console.log(`Total CSV rows: ${csvRows.length}`);
}

main().catch(console.error);
