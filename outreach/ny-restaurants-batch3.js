/**
 * NY Restaurants Batch 3: More curated small indie NYC restaurants.
 * Focusing on gaps from batch 1+2: deeper Queens, Bronx, Brooklyn, Manhattan neighborhoods.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ny-restaurants-batch3.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-restaurants-batch3.json');

const RESTAURANTS = [
  // ========== MANHATTAN — deeper cuts ==========

  // --- East Harlem / Spanish Harlem ---
  { name: "Taco Mix", url: "https://www.tacomixnyc.com" },
  { name: "Cascalote Latin Bistro", url: "https://www.cascalote.com" },
  { name: "Amor Cubano", url: "https://www.amorcubanonyc.com" },
  { name: "Ricardo Steakhouse", url: "https://www.ricardosteakhouse.com" },

  // --- Washington Heights / Inwood ---
  { name: "Saggio", url: "https://www.saggionyc.com" },
  { name: "Le Cheile", url: "https://www.lecheilenyc.com" },
  { name: "Locksmith Wine Bar", url: "https://www.locksmithnyc.com" },
  { name: "Beans & Vines", url: "https://www.beansandvines.com" },

  // --- Upper East Side ---
  { name: "JG Melon", url: "https://www.jgmelon.com" },
  { name: "Heidelberg Restaurant", url: "https://www.heidelbergrestaurantnyc.com" },
  { name: "Cafe Sabarsky", url: "https://www.neuegalerie.org" },
  { name: "Cafe d'Alsace", url: "https://www.cafedalsace.com" },
  { name: "Flex Mussels", url: "https://www.flexmussels.com" },
  { name: "Paola's Restaurant", url: "https://www.paolasrestaurant.com" },

  // --- Upper West Side ---
  { name: "Barney Greengrass", url: "https://www.barneygreengrass.com" },
  { name: "Jacob's Pickles", url: "https://www.jacobspickles.com" },
  { name: "Miss Mamie's", url: "https://www.missmamies.com" },
  { name: "Cotta", url: "https://www.cottanyc.com" },
  { name: "Bodrum", url: "https://www.bodrumnyc.com" },
  { name: "Maison Pickle", url: "https://www.maisonpickle.com" },

  // --- Murray Hill / Gramercy ---
  { name: "Dhaba", url: "https://www.dhabanyc.com" },
  { name: "Curry in a Hurry", url: "https://www.curryinahurryny.com" },
  { name: "Saravanaas", url: "https://www.saravanaas.com" },
  { name: "Penelope", url: "https://www.penelopenyc.com" },
  { name: "Pete's Tavern", url: "https://www.petestavern.com" },
  { name: "Friend of a Farmer", url: "https://www.friendofafarmer.com" },

  // --- Hell's Kitchen ---
  { name: "Kashkaval Garden", url: "https://www.kashkavalgarden.com" },
  { name: "Pure Thai Cookhouse", url: "https://www.purethaicookhouse.com" },
  { name: "Chez Napoleon", url: "https://www.cheznapoleon.com" },
  { name: "Taboon", url: "https://www.taboonnyc.com" },
  { name: "Saju Bistro", url: "https://www.sajubistro.com" },
  { name: "Afghan Kebab House", url: "https://www.afghankebabhouse.com" },

  // --- Financial District / Battery Park ---
  { name: "Fraunces Tavern", url: "https://www.frauncestavern.com" },
  { name: "Tiny's and the Bar Upstairs", url: "https://www.tinysnyc.com" },
  { name: "Blue Smoke", url: "https://www.bluesmoke.com" },

  // ========== BROOKLYN — deeper cuts ==========

  // --- Prospect Heights / Crown Heights ---
  { name: "Chuko Ramen", url: "https://www.barchuko.com" },
  { name: "Olmsted", url: "https://www.olmstednyc.com" },
  { name: "Glady's", url: "https://www.gladysnyc.com" },
  { name: "Berg'n", url: "https://www.bergn.com" },
  { name: "Ample Hills Creamery", url: "https://www.amplehills.com" },

  // --- DUMBO / Brooklyn Heights ---
  { name: "Westville", url: "https://www.westvillenyc.com" },
  { name: "Cecconi's DUMBO", url: "https://www.cecconisdumbo.com" },
  { name: "Jack the Horse Tavern", url: "https://www.jackthehorse.com" },
  { name: "Henry's End", url: "https://www.henrysend.com" },

  // --- Sunset Park / Borough Park ---
  { name: "Ba Xuyên", url: "https://www.baxuyenbrooklyn.com" },
  { name: "Tacos El Bronco", url: "https://www.tacoselbronco.com" },
  { name: "Yun Nan Flavour Garden", url: "https://www.yunnanflavourgarden.com" },
  { name: "East Harbor Seafood Palace", url: "https://www.eastharborseafoodpalace.com" },

  // --- Ditmas Park / Flatbush ---
  { name: "Mimi's Hummus", url: "https://www.mimishummus.com" },
  { name: "Purple Yam", url: "https://www.purpleyamnyc.com" },
  { name: "The Farm on Adderley", url: "https://www.thefarmonyc.com" },
  { name: "Ox Cart Tavern", url: "https://www.oxcarttavern.com" },

  // --- Bensonhurst / Gravesend / Sheepshead Bay ---
  { name: "L&B Spumoni Gardens", url: "https://www.spumonigardens.com" },
  { name: "Roll-N-Roaster", url: "https://www.rollnroaster.com" },
  { name: "Totonno's", url: "https://www.totonnosconeyisland.com" },
  { name: "Randazzo's Clam Bar", url: "https://www.randazzosclambar.com" },

  // --- Fort Greene / Clinton Hill ---
  { name: "Olea", url: "https://www.oleabrooklyn.com" },
  { name: "Roman's", url: "https://www.romansnyc.com" },
  { name: "Walter's", url: "https://www.waltersbrooklyn.com" },
  { name: "Habana Outpost", url: "https://www.habanaoutpost.com" },

  // ========== QUEENS — deep coverage ==========

  // --- Astoria ---
  { name: "Bahari", url: "https://www.bahariestiatorio.com" },
  { name: "Kyclades Astoria", url: "https://www.kycladesastoria.com" },
  { name: "Seva Indian", url: "https://www.sevaindian.com" },
  { name: "Christos Steakhouse", url: "https://www.christossteakhouse.com" },
  { name: "Milkflower", url: "https://www.milkflowernyc.com" },
  { name: "Tikka Indian Grill", url: "https://www.tikkaindiangrill.com" },
  { name: "Agnanti Meze", url: "https://www.agnantimeze.com" },
  { name: "Astoria Seafood", url: "https://www.astoriaseafood.com" },

  // --- Jackson Heights / Elmhurst ---
  { name: "Lhasa Fast Food", url: "https://www.lhasafastfood.com" },
  { name: "Kabab King Diner", url: "https://www.kabab-king.com" },
  { name: "Rincon Criollo", url: "https://www.rinconcriollorestaurant.com" },
  { name: "Kitchen 79", url: "https://www.kitchen79.com" },
  { name: "Ayada Thai", url: "https://www.ayadathai.com" },
  { name: "La Pequeña Colombia", url: "https://www.lapequenacolombia.com" },
  { name: "Urubamba", url: "https://www.urubamba.com" },

  // --- Flushing ---
  { name: "Szechuan House", url: "https://www.szechuanhouseny.com" },
  { name: "Biang!", url: "https://www.biangnyc.com" },
  { name: "M&T Restaurant", url: "https://www.mtrestaurantnyc.com" },
  { name: "Golden Palace", url: "https://www.goldenpalaceflushing.com" },
  { name: "Spy C Cuisine", url: "https://www.spyccuisine.com" },

  // --- Long Island City ---
  { name: "Casa Enrique", url: "https://www.casaenrique.com" },
  { name: "Mu Ramen", url: "https://www.muramen.com" },
  { name: "Manducatis", url: "https://www.manducatis.com" },
  { name: "John Brown Smokehouse", url: "https://www.johnbrownsmokehouse.com" },
  { name: "LIC Market", url: "https://www.licmarket.com" },

  // --- Forest Hills / Rego Park ---
  { name: "Nick's Pizza", url: "https://www.nickspizzanyc.com" },
  { name: "Danny Brown Wine Bar", url: "https://www.dannybrownwinebarandkitchen.com" },
  { name: "Station House", url: "https://www.stationhouseresort.com" },
  { name: "Banter", url: "https://www.banterforesthill.com" },
  { name: "La Vigna", url: "https://www.lavignarestaurant.com" },

  // --- Woodside / Sunnyside ---
  { name: "Sripraphai", url: "https://www.sripraphairestaurant.com" },
  { name: "Salt & Fat", url: "https://www.saltandfat.com" },
  { name: "Leng Thai", url: "https://www.leng-thai.com" },
  { name: "De Mole", url: "https://www.demoleny.com" },

  // ========== BRONX — deeper cuts ==========

  // --- Arthur Avenue ---
  { name: "Mario's Restaurant", url: "https://www.mariosrestarthurave.com" },
  { name: "Dominick's", url: "https://www.dominicksrestaurant.com" },
  { name: "Ann & Tony's", url: "https://www.annandtonys.com" },
  { name: "Emilia's", url: "https://www.emiliasrestaurant.com" },

  // --- City Island ---
  { name: "Sammy's Fish Box", url: "https://www.sammysfishbox.com" },
  { name: "Johnny's Reef", url: "https://www.johnnysreefrestaurant.com" },
  { name: "Artie's Steak & Seafood", url: "https://www.artiesonline.com" },
  { name: "The Black Whale", url: "https://www.theblackwhalenyc.com" },
  { name: "Seafood City", url: "https://www.seafoodcityci.com" },

  // --- Mott Haven / South Bronx ---
  { name: "Ceetay", url: "https://www.ceetay.com" },
  { name: "Beatstro", url: "https://www.beatstrobx.com" },
  { name: "La Morada", url: "https://www.lamoradanyc.com" },

  // --- Fordham / Belmont ---
  { name: "Estrellita Poblana III", url: "https://www.estrellitapoblana3.com" },
  { name: "Pugsley Pizza", url: "https://www.pugsleypizza.com" },
  { name: "Ebe Ye Yie", url: "https://www.ebeyeyierestaurant.com" },

  // ========== STATEN ISLAND — deeper cuts ==========
  { name: "Killmeyer's Old Bavaria Inn", url: "https://www.killmeyers.com" },
  { name: "Bayou", url: "https://www.bayousi.com" },
  { name: "Lakruwana", url: "https://www.lakruwana.com" },
  { name: "Alfonso's Pastry Shoppe", url: "https://www.alfonsospastry.com" },
  { name: "Violette's Cellar", url: "https://www.violettescellar.com" },
  { name: "Bario", url: "https://www.bariosi.com" },
  { name: "Life", url: "https://www.lifestatenisland.com" },
  { name: "Bocelli Ristorante", url: "https://www.bocelliristorante.com" },
];

// ===== Contact extraction (same as batch2) =====

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

async function scrapeRestaurant(context, restaurant) {
  const result = {
    name: restaurant.name,
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

  console.log(`=== NY Restaurants Batch 3: ${unique.length} curated sites ===\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const allResults = [];

  for (let i = 0; i < unique.length; i++) {
    const r = unique[i];
    process.stdout.write(`[${i + 1}/${unique.length}] ${r.name.padEnd(35)} `);
    const info = await scrapeRestaurant(context, r);
    allResults.push(info);

    if (info.emails.length > 0) {
      console.log(`EMAIL: ${info.emails[0]}${info.ownerName ? ' | Owner: ' + info.ownerName : ''}`);
    } else if (info.ownerName) {
      console.log(`OWNER ONLY: ${info.ownerName}`);
    } else {
      console.log(`-`);
    }

    if ((i + 1) % 25 === 0) fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allResults, null, 2));
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
  console.log(`With public email: ${allResults.filter(r => r.emails.length > 0).length}`);
  console.log(`With owner name: ${allResults.filter(r => r.ownerName).length}`);
  console.log(`CSV rows: ${csvRows.length - 1}`);
  console.log(`\nSaved: ${OUTPUT_CSV}`);
}

main().catch(console.error);
