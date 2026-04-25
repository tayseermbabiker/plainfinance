/**
 * Ecommerce batch 2: coffee, tea, kids, supplements, more categories.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ecommerce-brands-batch2.csv');
const OUTPUT_JSON = path.join(__dirname, 'ecommerce-brands-batch2.json');

const BRANDS = [
  // Coffee
  { name: "Indie Coffee Roasters", url: "https://www.indiecoffeeroasters.com", category: "coffee" },
  { name: "Independence Coffee", url: "https://www.independencecoffee.com", category: "coffee" },
  { name: "Mothership Coffee", url: "https://mothershipcoffee.com", category: "coffee" },
  { name: "Intelligentsia Coffee", url: "https://www.intelligentsia.com", category: "coffee" },

  // Tea
  { name: "Snarky Tea", url: "https://snarkytea.com", category: "tea" },
  { name: "Firebelly Tea", url: "https://firebellytea.com", category: "tea" },
  { name: "Tease Tea", url: "https://teasetea.com", category: "tea" },
  { name: "Vorratu", url: "https://vorratu.com", category: "tea" },

  // Kids / Baby toys
  { name: "Milton & Goose", url: "https://www.miltonandgoose.com", category: "kids" },
  { name: "Posh Peanut", url: "https://www.poshpeanut.com", category: "kids" },
  { name: "Monica + Andy", url: "https://www.monicaandandy.com", category: "kids" },
  { name: "Sapling Child", url: "https://saplingchild.com", category: "kids" },
  { name: "Mountain Kids Toys", url: "https://mountainkidstoys.com", category: "kids" },

  // Supplements / Wellness
  { name: "Two Islands", url: "https://twoislands.com.au", category: "wellness" },
  { name: "MaryRuth Organics", url: "https://maryruthorganics.com", category: "wellness" },
  { name: "Four Sigmatic", url: "https://us.foursigmatic.com", category: "wellness" },
  { name: "FLO Vitamins", url: "https://flovitamins.com", category: "wellness" },

  // Beauty / Skincare (additional)
  { name: "Rhode Beauty", url: "https://www.rhodeskin.com", category: "beauty" },
  { name: "Youthforia", url: "https://www.youthforia.com", category: "beauty" },
  { name: "Topicals", url: "https://mytopicals.com", category: "beauty" },
  { name: "Hyper Skin", url: "https://hyperskin.com", category: "beauty" },
  { name: "Fur", url: "https://www.furyou.com", category: "beauty" },
  { name: "Ogee", url: "https://www.ogee.com", category: "beauty" },

  // Home / Decor (additional)
  { name: "Ruggable", url: "https://ruggable.com", category: "home" },
  { name: "Parachute Home", url: "https://www.parachutehome.com", category: "home" },
  { name: "Floyd Home", url: "https://floydhome.com", category: "home" },
  { name: "Coyuchi", url: "https://www.coyuchi.com", category: "home" },

  // Fashion / Apparel (additional)
  { name: "Cuyana", url: "https://www.cuyana.com", category: "fashion" },
  { name: "Everlane", url: "https://www.everlane.com", category: "fashion" },
  { name: "Girlfriend Collective", url: "https://girlfriend.com", category: "fashion" },
  { name: "Mejuri", url: "https://mejuri.com", category: "jewelry" },

  // Food (additional)
  { name: "Partake Foods", url: "https://partakefoods.com", category: "food" },
  { name: "Omsom", url: "https://omsom.com", category: "food" },
  { name: "Fly By Jing", url: "https://flybyjing.com", category: "food" },
  { name: "Graza", url: "https://graza.co", category: "food" },
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

  console.log(`=== Ecommerce Batch 2: ${unique.length} brands ===\n`);
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
