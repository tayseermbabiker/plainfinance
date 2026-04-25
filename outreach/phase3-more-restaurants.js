/**
 * Phase 3: Second batch of Austin TX restaurants to get closer to 200.
 * Restaurants NOT already in Phase 2 list.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'austin-restaurants-batch2.csv');
const OUTPUT_JSON = path.join(__dirname, 'austin-restaurants-batch2.json');

// Additional restaurants found via WebSearch
const RESTAURANTS = [
  // More Tex-Mex / Mexican
  { name: "Fresa's", url: "https://www.fresaschicken.com" },
  { name: "Chuy's", url: "https://www.chuys.com" },
  { name: "Guero's Taco Bar", url: "https://www.guerostacobar.com" },
  { name: "Torchy's Tacos", url: "https://www.torchystacos.com" },
  { name: "Taqueria Arandas", url: "https://www.taqueriaarandas.com" },
  { name: "Polvo's Mexican", url: "https://polvosaustin.com" },
  { name: "Vaquero Taquero", url: "https://www.vaquerotaquero.com" },
  { name: "Valentina's Tex-Mex BBQ", url: "https://www.valentinastexmexbbq.com" },
  { name: "Pueblo Viejo", url: "https://www.puebloviejofoodpark.com" },
  { name: "Licha's Cantina", url: "https://www.lichascantina.com" },
  { name: "Suerte", url: "https://www.suerteaustin.com" },
  { name: "Rosie's Al Pastor", url: "https://www.rosiesalpastor.com" },
  { name: "Casa Colombia", url: "https://www.casacolombia.com" },

  // More Asian
  { name: "Sap's Thai", url: "https://sapsthai.com" },
  { name: "Madam Mam's", url: "https://www.madammam.com" },
  { name: "Thai Kun", url: "https://thaikunaustin.com" },
  { name: "Asia Cafe", url: "https://www.asiacafeaustin.com" },
  { name: "Chen's Noodle House", url: "https://www.chensnoodlehouse.com" },
  { name: "Wu Chow", url: "https://www.wuchowaustin.com" },
  { name: "Lucky Robot", url: "https://www.luckyrobotrestaurant.com" },
  { name: "Taste of India", url: "https://www.tasteofindia-austin.com" },
  { name: "Bombay Bistro", url: "https://www.bombaybistro.com" },
  { name: "Clay Pit", url: "https://www.claypit.com" },
  { name: "Swad Indian", url: "https://www.swadindian.com" },
  { name: "Koriente", url: "https://korienteatx.com" },
  { name: "Chi'Lantro", url: "https://www.chilantrobbq.com" },
  { name: "Fukumoto", url: "https://www.fukumotoaustin.com" },
  { name: "Tsuke Edomae", url: "https://www.tsukeedomae.com" },
  { name: "Ling Wu", url: "https://lingwuaustin.com" },

  // More Italian
  { name: "Mandola's Italian", url: "https://www.mandolas.com" },
  { name: "Vespaio", url: "https://www.austinvespaio.com" },
  { name: "Juliet Ristorante", url: "https://juliet-austin.com" },
  { name: "Andiamo", url: "https://www.andiamoitaliano.com" },

  // More BBQ
  { name: "Stiles Switch BBQ", url: "https://www.stilesswitchbbq.com" },
  { name: "Kerlin BBQ", url: "https://kerlinbbq.com" },
  { name: "Micklethwait", url: "https://craftmeatsaustin.com" },
  { name: "Sam's BBQ", url: "https://www.samsbbqaustin.com" },
  { name: "Brown's Bar-B-Que", url: "https://brownsbarbque.com" },
  { name: "Valentina's BBQ", url: "https://www.valentinastexmexbbq.com" },

  // More Seafood
  { name: "Clark's Oyster Bar", url: "https://www.clarksoysterbar.com" },
  { name: "Garbo's Lobster", url: "https://garboslobster.com" },
  { name: "Truluck's", url: "https://trulucks.com" },

  // More Brunch / Cafe / Bakery
  { name: "Snooze", url: "https://www.snoozeeatery.com" },
  { name: "Magnolia Cafe", url: "https://www.magnoliacafeaustin.com" },
  { name: "Cafe Medici", url: "https://cafemedici.com" },
  { name: "Mozart's Coffee", url: "https://mozartscoffee.com" },
  { name: "Quack's Bakery", url: "https://www.quacksbakery.com" },
  { name: "Swedish Hill Bakery", url: "https://www.swedishhillaustin.com" },
  { name: "Upper Crust Bakery", url: "https://theuppercrustbakery.com" },
  { name: "Colleen's Kitchen", url: "https://www.colleenskitchenaustin.com" },
  { name: "Bird Bird Biscuit", url: "https://birdbirdaustin.com" },
  { name: "Biscuits & Groovy", url: "https://www.biscuitsandgroovy.com" },
  { name: "Sour Duck Market", url: "https://www.sourduckmarket.com" },
  { name: "Summer Moon Coffee", url: "https://www.summermooncoffee.com" },
  { name: "Houndstooth Coffee", url: "https://www.houndstoothcoffee.com" },
  { name: "Fleet Coffee", url: "https://www.fleetcoffee.com" },
  { name: "Greater Goods Coffee", url: "https://greatergoodsroasting.com" },

  // More American / New American / Neighborhood
  { name: "Salty Sow", url: "https://saltysow.com" },
  { name: "Fixe Southern House", url: "https://www.fixesouthernhouse.com" },
  { name: "Parkside", url: "https://www.parkside-austin.com" },
  { name: "Oasthouse", url: "https://oasthouseaustin.com" },
  { name: "Maie Day", url: "https://www.maieday.com" },
  { name: "Supper Club", url: "https://www.supperclubaustin.com" },
  { name: "Austin Land & Cattle", url: "https://alcsteaks.com" },
  { name: "VanHorn's", url: "https://www.vanhornsaustin.com" },
  { name: "Slab BBQ", url: "https://www.slabbbq.com" },
  { name: "24 Diner", url: "https://www.24diner.com" },
  { name: "Cover 3", url: "https://cover-3.com" },

  // More Wings / Chicken / Casual
  { name: "Tommy Want Wingy", url: "https://tommywantwingyatx.com" },
  { name: "Texas Wings & Grill", url: "https://texaswingsandgrill.com" },
  { name: "Wings N More", url: "https://wingsnmore-austin.com" },
  { name: "Tumble 22", url: "https://www.tumble22.com" },
  { name: "Lucy's Fried Chicken", url: "https://lucysfriedchicken.com" },

  // More Diverse
  { name: "G'Raj Mahal", url: "https://www.grajmahalaustin.com" },
  { name: "Banger's", url: "https://www.bangersaustin.com" },
  { name: "Nasha India", url: "https://nashaindia.com" },
  { name: "Fogo de Chao", url: "https://fogodechao.com" },
  { name: "The Meteor", url: "https://themeteorcafe.com" },
  { name: "Veracruz All Natural", url: "https://www.veracruzallnatural.com" },
  { name: "Taco Flats", url: "https://www.tacoflats.com" },
  { name: "Phoebe's Diner", url: "https://www.phoebesdiner.com" },
  { name: "Lao'd Bar", url: "https://laodbar.com" },
  { name: "House of Three Gorges", url: "https://www.houseofthreegorges.com" },
  { name: "AllDay Pizza", url: "https://alldaypizzaaustin.com" },
  { name: "De Nada Cantina", url: "https://www.denadacantina.com" },
  { name: "Ramen Tatsu-ya", url: "https://ramentatsuya.com" },
  { name: "Aba Austin", url: "https://www.abarestaurants.com" },
  { name: "Pitchfork Pretty", url: "https://www.pitchforkpretty.com" },
  { name: "Cuantos Tacos", url: "https://www.cuantostacos.com" },
  { name: "Comal", url: "https://www.comalatx.com" },
  { name: "Bird Bird Biscuit", url: "https://birdbirdaustin.com" },
  { name: "Biscuits & Groovy", url: "https://www.biscuitsandgroovy.com" },
];

// --- Same extraction functions as Phase 2 ---

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
  ];
  const names = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 3 && name.length < 50 && name.split(/\s+/).length >= 2 && name.split(/\s+/).length <= 5) {
        const lower = name.toLowerCase();
        if (!lower.includes('about') && !lower.includes('story') && !lower.includes('read')
          && !lower.includes('click') && !lower.includes('learn') && !lower.includes('menu')) {
          names.push(name);
        }
      }
    }
  }
  return [...new Set(names)];
}

async function scrapeRestaurant(context, restaurant) {
  const result = { name: restaurant.name, url: restaurant.url, ownerName: '', emails: [] };
  const page = await context.newPage();
  try {
    const baseUrl = new URL(restaurant.url).origin;
    await page.goto(restaurant.url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(1200);

    let allText = '';
    try { allText = await page.evaluate(() => document.body?.innerText || ''); } catch {}
    result.emails.push(...await extractMailtoEmails(page));

    // Find internal links
    let internalLinks = [];
    try {
      internalLinks = await page.$$eval('a[href]', (anchors, base) => {
        const kw = ['about', 'contact', 'team', 'our-story', 'story', 'founder', 'owner'];
        return anchors.filter(a => {
          const href = (a.href || '').toLowerCase();
          const text = (a.textContent || '').toLowerCase();
          return kw.some(k => href.includes(k) || text.includes(k));
        }).map(a => a.href).filter(h => { try { return new URL(h).origin === new URL(base).origin; } catch { return false; } });
      }, baseUrl);
    } catch {}

    const visited = new Set([restaurant.url, baseUrl, baseUrl + '/']);
    const pages = [...new Set(internalLinks)].slice(0, 3);
    for (const suffix of ['/contact', '/about']) pages.push(baseUrl + suffix);

    for (const link of pages) {
      const norm = link.replace(/\/$/, '');
      if (visited.has(norm) || visited.has(norm + '/')) continue;
      visited.add(norm);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(600);
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
  for (const r of RESTAURANTS) {
    try {
      const domain = new URL(r.url).hostname.replace(/^www\./, '');
      if (!seen.has(domain)) { seen.add(domain); unique.push(r); }
    } catch {}
  }

  console.log(`=== Phase 3: Batch 2 — ${unique.length} more restaurants ===\n`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const results = [];
  for (let i = 0; i < unique.length; i++) {
    const r = unique[i];
    process.stdout.write(`[${i + 1}/${unique.length}] ${r.name.padEnd(25)} `);
    const info = await scrapeRestaurant(context, r);
    results.push(info);
    if (info.emails.length > 0) {
      console.log(`EMAIL: ${info.emails[0]}${info.ownerName ? ' | Owner: ' + info.ownerName : ''}`);
    } else { console.log('-'); }
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
  }
  await browser.close();

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));

  const csvRows = ['Restaurant Name,Owner/Manager Name,Email,Website URL'];
  for (const r of results) {
    if (r.emails.length > 0) {
      const ranked = r.emails.sort((a, b) => {
        const p = (e) => {
          if (e.startsWith('info@') || e.startsWith('hello@') || e.startsWith('contact@')) return 0;
          if (e.includes('gmail.com') || e.includes('yahoo.com')) return 1;
          if (e.startsWith('events@') || e.startsWith('press@')) return 2;
          if (e.startsWith('reservations@') || e.startsWith('catering@')) return 4;
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
  console.log(`Checked: ${unique.length} | With email: ${withEmail.length}`);
  console.log(`Saved: ${OUTPUT_CSV}`);
}

main().catch(console.error);
