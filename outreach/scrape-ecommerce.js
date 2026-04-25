/**
 * Scrape small indie ecommerce brands for PlainFinancials outreach.
 * Target: owner-operated Shopify/DTC brands, <$1M revenue profile.
 * Only collects publicly posted contact info from brand websites.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ecommerce-brands.csv');
const OUTPUT_JSON = path.join(__dirname, 'ecommerce-brands.json');

const BRANDS = [
  // Skincare / Beauty (indie, founder-owned)
  { name: "Klur", url: "https://klur.co", category: "beauty" },

  // Home goods / Furniture
  { name: "Jennifer Taylor Home", url: "https://jennifertaylorhome.com", category: "home" },
  { name: "Molly Mutt", url: "https://mollymutt.com", category: "pet" },
  { name: "Wovenbyrd", url: "https://wovenbyrd.com", category: "home" },
  { name: "Lekker Home", url: "https://lekkerhome.com", category: "home" },

  // Pet (indie, founder-owned)
  { name: "ModernBeast", url: "https://modernbeast.com", category: "pet" },
  { name: "West Paw", url: "https://www.westpaw.com", category: "pet" },
  { name: "Bodhi Dog", url: "https://www.thebodhidog.com", category: "pet" },
  { name: "Redbarn Pet Products", url: "https://www.redbarn.com", category: "pet" },
  { name: "Jax & Bones", url: "https://jaxandbones.com", category: "pet" },
  { name: "Lil Archies", url: "https://lilarchies.com", category: "pet" },

  // Fashion / Clothing
  { name: "Caraa", url: "https://caraasport.com", category: "fashion" },
  { name: "Genuine People", url: "https://genuine-people.com", category: "fashion" },
  { name: "Indie Identity", url: "https://www.indieidentity.com", category: "fashion" },
  { name: "Modern Citizen", url: "https://www.moderncitizen.com", category: "fashion" },
  { name: "Beefcake Swimwear", url: "https://beefcakeswimwear.com", category: "fashion" },

  // Food / Snacks
  { name: "Pulp Pantry", url: "https://pulppantry.com", category: "food" },
  { name: "FireCreek Snacks", url: "https://firecreeksnacks.com", category: "food" },
  { name: "Magic Spoon", url: "https://magicspoon.com", category: "food" },
  { name: "DEUX", url: "https://eatdeux.com", category: "food" },
  { name: "Freestyle Snacks", url: "https://freestylesnacks.com", category: "food" },

  // Jewelry
  { name: "NAKIIT", url: "https://nakiit.com", category: "jewelry" },
  { name: "Lot28", url: "https://lot28.com", category: "jewelry" },
  { name: "Ostrich Moon", url: "https://ostrichmoon.com", category: "jewelry" },
  { name: "Simuero", url: "https://simuero.com", category: "jewelry" },
  { name: "Local Eclectic", url: "https://www.localeclectic.com", category: "jewelry" },

  // Candles / Fragrance
  { name: "P.F. Candle Co", url: "https://pfcandleco.com", category: "home" },
  { name: "Brooklyn Candle Studio", url: "https://brooklyncandlestudio.com", category: "home" },
  { name: "Red Sky Candles", url: "https://redskycandles.com", category: "home" },
  { name: "Lily Lou's Aromas", url: "https://lilylousaromas.com", category: "home" },
  { name: "The New Savant", url: "https://thenewsavant.com", category: "home" },

  // Stationery / Paper
  { name: "Appointed", url: "https://appointed.co", category: "stationery" },
  { name: "Rifle Paper Co", url: "https://riflepaperco.com", category: "stationery" },
  { name: "Aya Paper Co", url: "https://ayapaperco.com", category: "stationery" },
  { name: "Papier", url: "https://www.papier.com", category: "stationery" },
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
      && !lower.includes('shopify.com') && !lower.includes('@shopify')
      && !lower.includes('@instagram') && !lower.includes('@twitter')
      && !lower.includes('@facebook') && !lower.includes('klaviyo')
      && !lower.includes('mailchimp');
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

function extractFounderName(text) {
  const patterns = [
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is\s+(?:the\s+)?(?:founder|founded|owner|creator|CEO|maker)|,\s*(?:founder|owner|creator|CEO))/g,
    /(?:founded|created|started|launched)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s+(?:founded|started|created)\s+(?:\w+\s+)?(?:in\s+\d{4}|the\s+brand|this\s+brand|the\s+company)/g,
  ];
  const names = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 5 && name.length < 40 && name.split(/\s+/).length >= 2 && name.split(/\s+/).length <= 4) {
        const lower = name.toLowerCase();
        const bad = ['about','story','read','click','learn','menu','services','welcome','contact','home','quick','link','team','our','main','page','site','hours','location','info','help','find','shop','brand','collection','product'];
        if (!bad.some(w => lower.includes(w))) names.push(name);
      }
    }
  }
  return [...new Set(names)];
}

async function scrapeBrand(context, brand) {
  const result = { name: brand.name, url: brand.url, category: brand.category, founderName: '', emails: [] };
  const page = await context.newPage();
  try {
    const baseUrl = new URL(brand.url).origin;
    await page.goto(brand.url, { waitUntil: 'domcontentloaded', timeout: 18000 });
    await page.waitForTimeout(2000);

    let allText = '';
    try { allText = await page.evaluate(() => document.body?.innerText || ''); } catch {}
    result.emails.push(...await extractMailtoEmails(page));

    // Find About, Contact, Our Story, Press pages
    let internalLinks = [];
    try {
      internalLinks = await page.$$eval('a[href]', (anchors, base) => {
        const kw = ['about','contact','our-story','story','founder','press','team','meet','who-we-are'];
        return anchors.filter(a => {
          const href = (a.href||'').toLowerCase();
          const text = (a.textContent||'').toLowerCase();
          return kw.some(k => href.includes(k) || text.includes(k));
        }).map(a => a.href).filter(h => { try { return new URL(h).origin === new URL(base).origin; } catch { return false; } });
      }, baseUrl);
    } catch {}

    const visited = new Set([brand.url, baseUrl, baseUrl+'/']);
    const pages = [...new Set(internalLinks)].slice(0, 5);

    // Shopify common paths
    for (const s of ['/pages/about','/pages/contact','/pages/our-story','/pages/about-us','/pages/contact-us','/contact','/about']) {
      pages.push(baseUrl+s);
    }

    for (const link of pages) {
      const norm = link.replace(/\/$/,'');
      if (visited.has(norm) || visited.has(norm+'/')) continue;
      visited.add(norm);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(1000);
        allText += '\n' + await page.evaluate(() => document.body?.innerText || '');
        result.emails.push(...await extractMailtoEmails(page));
      } catch {}
    }

    result.emails.push(...extractEmails(allText));
    result.emails = [...new Set(result.emails.map(e => e.toLowerCase()))].filter(e => e.includes('@'));
    const founders = extractFounderName(allText);
    if (founders.length > 0) result.founderName = founders[0];
  } catch {} finally { await page.close(); }
  return result;
}

async function main() {
  const seen = new Set();
  const unique = [];
  for (const b of BRANDS) {
    try {
      const domain = new URL(b.url).hostname.replace(/^www\./,'');
      if (!seen.has(domain)) { seen.add(domain); unique.push(b); }
    } catch {}
  }

  console.log(`=== Ecommerce Brands: Scraping ${unique.length} websites ===\n`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const results = [];
  for (let i = 0; i < unique.length; i++) {
    const b = unique[i];
    process.stdout.write(`[${i+1}/${unique.length}] ${b.name.padEnd(30)} `);
    const info = await scrapeBrand(context, b);
    results.push(info);
    if (info.emails.length > 0) {
      console.log(`EMAIL: ${info.emails[0]}${info.founderName ? ' | Founder: '+info.founderName : ''}`);
    } else if (info.founderName) {
      console.log(`FOUNDER: ${info.founderName}`);
    } else {
      console.log('-');
    }
    await new Promise(r => setTimeout(r, 600 + Math.random() * 900));
  }
  await browser.close();

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
  const csvRows = ['Brand Name,Founder Name,Email,Category,Website URL'];
  for (const r of results) {
    if (r.emails.length > 0) {
      const ranked = r.emails.sort((a,b) => {
        const p = (e) => {
          if (e.startsWith('hello@') || e.startsWith('info@') || e.startsWith('contact@')) return 0;
          if (e.includes('gmail.com') || e.includes('yahoo.com')) return 1;
          if (e.startsWith('press@') || e.startsWith('media@')) return 3;
          if (e.startsWith('support@') || e.startsWith('help@')) return 2;
          if (e.startsWith('wholesale@') || e.startsWith('returns@')) return 4;
          return 2;
        };
        return p(a) - p(b);
      });
      csvRows.push(`"${r.name.replace(/"/g,'""')}","${(r.founderName||'').replace(/"/g,'""')}","${ranked[0]}","${r.category}","${r.url}"`);
    }
  }
  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n')+'\n');

  const withEmail = results.filter(r => r.emails.length > 0);
  console.log(`\n=== Summary ===`);
  console.log(`Checked: ${unique.length} | With email: ${withEmail.length} | With founder: ${results.filter(r => r.founderName).length}`);
  console.log(`Saved: ${OUTPUT_CSV}`);
}

main().catch(console.error);
