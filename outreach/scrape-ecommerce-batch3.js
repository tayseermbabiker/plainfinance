/**
 * Ecommerce batch 3: grooming, mushrooms, activewear, more.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ecommerce-brands-batch3.csv');
const OUTPUT_JSON = path.join(__dirname, 'ecommerce-brands-batch3.json');

const BRANDS = [
  // Men's grooming
  { name: "Beardbrand", url: "https://www.beardbrand.com", category: "grooming" },
  { name: "Mountaineer Brand", url: "https://www.mountaineerbrand.com", category: "grooming" },
  { name: "Stubble and Stache", url: "https://www.stubbleandstache.com", category: "grooming" },
  { name: "Razor MD", url: "https://razormd.com", category: "grooming" },
  { name: "Roughneck Beard Co", url: "https://roughneckbeardcompany.com", category: "grooming" },

  // Mushroom / plant
  { name: "Far West Fungi", url: "https://farwestfungi.com", category: "food" },
  { name: "Fungi Perfecti", url: "https://fungi.com", category: "food" },
  { name: "Smallhold", url: "https://smallhold.com", category: "food" },
  { name: "Mushroom Angel", url: "https://themushroomangel.com", category: "food" },
  { name: "Mycopolitan", url: "https://www.mycopolitan.com", category: "food" },
  { name: "Mushroom Mountain", url: "https://mushroommountain.com", category: "food" },

  // Athletic wear
  { name: "Outdoor Voices", url: "https://www.outdoorvoices.com", category: "fashion" },
  { name: "No Bull", url: "https://nobullproject.com", category: "fashion" },
  { name: "Alphalete", url: "https://alphaleteathletics.com", category: "fashion" },
  { name: "ThruDark", url: "https://thrudark.com", category: "fashion" },
  { name: "SweetLegs", url: "https://sweetlegs.com", category: "fashion" },
  { name: "UNRL", url: "https://www.unrl.com", category: "fashion" },
  { name: "IWA Company", url: "https://theiwacompany.com", category: "fashion" },

  // Beauty / skincare additional
  { name: "Klur Co", url: "https://klur.co", category: "beauty" },
  { name: "Herbivore Botanicals", url: "https://www.herbivorebotanicals.com", category: "beauty" },
  { name: "Youth To The People", url: "https://www.youthtothepeople.com", category: "beauty" },
  { name: "Drunk Elephant", url: "https://www.drunkelephant.com", category: "beauty" },
  { name: "Kosas", url: "https://www.kosas.com", category: "beauty" },

  // Food additional
  { name: "Fishwife", url: "https://eatfishwife.com", category: "food" },
  { name: "Siete Foods", url: "https://sietefoods.com", category: "food" },
  { name: "Bachan's", url: "https://bachans.com", category: "food" },
  { name: "Diaspora Co", url: "https://www.diasporaco.com", category: "food" },
  { name: "Spicewalla", url: "https://www.spicewallabrand.com", category: "food" },
  { name: "Burlap & Barrel", url: "https://www.burlapandbarrel.com", category: "food" },

  // Home additional
  { name: "Boll & Branch", url: "https://www.bollandbranch.com", category: "home" },
  { name: "Brooklinen", url: "https://www.brooklinen.com", category: "home" },
  { name: "Public Goods", url: "https://publicgoods.com", category: "home" },

  // Bags / accessories
  { name: "State Bags", url: "https://statebags.com", category: "fashion" },
  { name: "Paravel", url: "https://www.tourparavel.com", category: "fashion" },
  { name: "Bellroy", url: "https://bellroy.com", category: "fashion" },
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

  console.log(`=== Ecommerce Batch 3: ${unique.length} brands ===\n`);
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
