/**
 * NY Restaurants Batch 2: Curated list of small, owner-operated,
 * independent NYC restaurants (all 5 boroughs, all cuisines).
 * Target: ≤20 staff, single-location, non-chain, $500K-$2M revenue.
 * Scrapes contact info, then merges with existing ny-restaurants.csv.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'ny-restaurants-batch2.csv');
const OUTPUT_JSON = path.join(__dirname, 'ny-restaurants-batch2.json');

const RESTAURANTS = [
  // ========== MANHATTAN ==========

  // --- East Village / LES ---
  { name: "Veselka", url: "https://www.veselka.com" },
  { name: "Mamoun's Falafel", url: "https://www.mamouns.com" },
  { name: "S&P Lunch", url: "https://www.sandplunch.com" },
  { name: "Superiority Burger", url: "https://www.superiorityburger.com" },
  { name: "Russ & Daughters Cafe", url: "https://www.russanddaughters.com" },
  { name: "Katz's Delicatessen", url: "https://katzsdelicatessen.com" },
  { name: "Punjabi Deli", url: "https://www.punjabinyc.com" },
  { name: "Abraco", url: "https://www.abraconyc.com" },
  { name: "Minca Ramen", url: "https://www.newyorkramen.com" },
  { name: "Vanessa's Dumpling House", url: "https://www.vanessas.com" },
  { name: "Lucien", url: "https://www.luciennyc.com" },
  { name: "Prune", url: "https://www.prunerestaurant.com" },

  // --- West Village / Greenwich ---
  { name: "John's of Bleecker Street", url: "https://www.johnsbrickovenpizza.com" },
  { name: "Tartine", url: "https://www.tartinenyc.com" },
  { name: "Buvette", url: "https://ilovebuvette.com" },
  { name: "Mary's Fish Camp", url: "https://www.marysfishcamp.com" },
  { name: "The Spotted Pig", url: "https://www.thespottedpig.com" },
  { name: "Corner Bistro", url: "https://www.cornerbistrony.com" },
  { name: "Lupa", url: "https://www.luparestaurant.com" },
  { name: "Malatesta", url: "https://www.malatestatrattoria.com" },

  // --- Harlem / Upper Manhattan ---
  { name: "Amy Ruth's", url: "https://www.amyruthsharlem.com" },
  { name: "Dinosaur Bar-B-Que", url: "https://www.dinosaurbarbque.com" },
  { name: "Lolo's Seafood Shack", url: "https://www.lolosseafoodshack.com" },
  { name: "Oso Harlem", url: "https://www.osoharlem.com" },
  { name: "Manhattanville Coffee", url: "https://www.manhattanvillecoffee.com" },
  { name: "Mess Hall", url: "https://www.messhallkitchen.com" },

  // --- Chinatown / Little Italy ---
  { name: "Nom Wah Tea Parlor", url: "https://nomwah.com" },
  { name: "Joe's Shanghai", url: "https://www.joeshanghairestaurants.com" },
  { name: "Xi'an Famous Foods", url: "https://www.xianfoods.com" },
  { name: "Wo Hop", url: "https://www.wohopnyc.com" },
  { name: "Great NY Noodletown", url: "https://www.greatnynoodletown.com" },
  { name: "Lombardi's Pizza", url: "https://www.firstpizza.com" },
  { name: "Alleva Dairy", url: "https://www.allevadairy.com" },

  // --- Midtown / Chelsea / Flatiron ---
  { name: "Totto Ramen", url: "https://www.tottoramen.com" },
  { name: "BCD Tofu House", url: "https://www.bcdtofu.com" },
  { name: "Cho Dang Gol", url: "https://www.chodanggolnyc.com" },
  { name: "Szechuan Gourmet", url: "https://www.szechuangourmetnyc.com" },
  { name: "Chennai Garden", url: "https://www.chennaigarden.com" },
  { name: "Hangawi", url: "https://www.hangawirestaurant.com" },
  { name: "Keens Steakhouse", url: "https://www.keens.com" },
  { name: "Uncle Boons Sister", url: "https://www.uncleboons.com" },

  // --- SoHo / NoLita / Tribeca ---
  { name: "Balthazar", url: "https://www.balthazarny.com" },
  { name: "Cafe Habana", url: "https://www.cafehabana.com" },
  { name: "Prince Street Pizza", url: "https://www.princestreetpizza.com" },
  { name: "Ruby's Cafe", url: "https://www.rubyscafe.com" },
  { name: "Thai Diner", url: "https://www.thaidiner.com" },
  { name: "Tacombi", url: "https://www.tacombi.com" },

  // ========== BROOKLYN ==========

  // --- Williamsburg ---
  { name: "Peter Luger", url: "https://peterluger.com" },
  { name: "Bamonte's", url: "https://www.bamontes.com" },
  { name: "Lilia", url: "https://www.lilianewyork.com" },
  { name: "Okonomi", url: "https://www.okonomibk.com" },
  { name: "Misi", url: "https://www.misinewyork.com" },
  { name: "SEA Thai", url: "https://www.seathainyc.com" },

  // --- Park Slope / Gowanus ---
  { name: "al di la Trattoria", url: "https://www.aldilatrattoria.com" },
  { name: "Bogota Latin Bistro", url: "https://www.bogotabistro.com" },
  { name: "Miriam", url: "https://www.miriamrestaurant.com" },
  { name: "Stone Park Cafe", url: "https://www.stoneparkcafe.com" },
  { name: "Runner & Stone", url: "https://www.runnerandstone.com" },
  { name: "Pork Slope", url: "https://www.porkslopebrooklyn.com" },

  // --- Bushwick / Bed-Stuy ---
  { name: "Roberta's", url: "https://www.robertaspizza.com" },
  { name: "Bunna Cafe", url: "https://www.bfrankrestaurant.com" },
  { name: "Momo Sushi Shack", url: "https://www.momosushishack.com" },
  { name: "Saraghina", url: "https://www.sfrankrestaurant.com" },
  { name: "Tortilleria Mexicana Los Hermanos", url: "https://www.tortilleriamexicanaloshermanos.com" },

  // --- Red Hook / Carroll Gardens / Cobble Hill ---
  { name: "Hometown BBQ", url: "https://www.hometownbbq.com" },
  { name: "Lucali", url: "https://www.lucali.com" },
  { name: "Ferdinando's Focacceria", url: "https://www.ferdinandosfocacceria.com" },
  { name: "Court Street Grocers", url: "https://www.courtstreetgrocers.com" },
  { name: "Buttermilk Channel", url: "https://www.buttermilkchannelnyc.com" },

  // --- Greenpoint / DUMBO ---
  { name: "Paulie Gee's", url: "https://pauliegee.com" },
  { name: "Karczma", url: "https://www.karczmabk.com" },
  { name: "Esme", url: "https://www.esmenyc.com" },
  { name: "Peter Pan Donut", url: "https://www.peterpandonuts.com" },
  { name: "Juliana's Pizza", url: "https://www.julianaspizza.com" },

  // --- Bay Ridge / Sunset Park ---
  { name: "Tanoreen", url: "https://www.tanoreen.com" },
  { name: "Elia", url: "https://www.eliarestaurant.com" },
  { name: "Brooklyn Beso", url: "https://www.brooklynbeso.com" },
  { name: "Pacificana", url: "https://www.pacificanarestaurant.com" },

  // ========== QUEENS ==========

  // --- Astoria ---
  { name: "Taverna Kyclades", url: "https://www.tavernakyclades.com" },
  { name: "Vesta Trattoria", url: "https://www.vestatrattoria.com" },
  { name: "Mar's", url: "https://www.marsnyc.com" },
  { name: "Ornella Trattoria", url: "https://www.ornellatrattoria.com" },
  { name: "Botte Bar", url: "https://www.bottebar.com" },

  // --- Jackson Heights ---
  { name: "Pio Pio", url: "https://www.piopio.com" },
  { name: "Samosa Shack", url: "https://www.thesamosashack.com" },
  { name: "Arepa Lady", url: "https://www.arepalady.com" },
  { name: "Phayul", url: "https://www.phayulrestaurant.com" },

  // --- Flushing ---
  { name: "Nan Xiang Xiao Long Bao", url: "https://www.nanxiangxiaolongbao.com" },
  { name: "Hunan Kitchen of Grand Sichuan", url: "https://www.hunankitchennyc.com" },
  { name: "White Bear", url: "https://www.whitebearnyc.com" },
  { name: "Lao Bei Fang Dumpling House", url: "https://www.laobeifangdumplinghouse.com" },

  // --- Other Queens ---
  { name: "Donovan's Pub", url: "https://www.donovanspubnyc.com" },
  { name: "Lhasa Fast Food", url: "https://www.lhasafastfood.com" },
  { name: "Rincon Criollo", url: "https://www.rinconcriollorestaurant.com" },
  { name: "Nick's Pizza", url: "https://www.nickspizzanyc.com" },

  // ========== BRONX ==========

  // --- Arthur Avenue / Little Italy ---
  { name: "Roberto's", url: "https://www.robertosofarthurave.com" },
  { name: "Tra Di Noi", url: "https://www.tradinoibx.com" },
  { name: "Zero Otto Nove", url: "https://www.089nyc.com" },
  { name: "Enzo's of Arthur Avenue", url: "https://www.enzosofarthurave.com" },
  { name: "Mike's Deli", url: "https://www.arthuravenue.com" },

  // --- Other Bronx ---
  { name: "Havana Cafe", url: "https://www.havanacafebronx.com" },
  { name: "Feeding Tree", url: "https://www.feedingtreebronx.com" },
  { name: "Taqueria Tlaxcalli", url: "https://www.taqueratlaxcalli.com" },
  { name: "Estrellita Poblana", url: "https://www.estrellitapoblana.com" },

  // ========== STATEN ISLAND ==========
  { name: "Denino's Pizzeria", url: "https://www.deninos.com" },
  { name: "Joe & Pat's", url: "https://www.joeandpats.com" },
  { name: "Enoteca Maria", url: "https://www.enotecamaria.com" },
  { name: "Royal Crown Bakery", url: "https://www.royalcrownbakery.com" },
  { name: "Beso", url: "https://www.besosi.com" },
  { name: "Lee's Tavern", url: "https://www.leestavernsi.com" },
];

// ===== Contact extraction (same as phase2) =====

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

  } catch {} finally {
    await page.close();
  }

  return result;
}

async function main() {
  // Dedupe by domain
  const seen = new Set();
  const unique = [];
  for (const r of RESTAURANTS) {
    try {
      const domain = new URL(r.url).hostname.replace(/^www\./, '');
      if (!seen.has(domain)) { seen.add(domain); unique.push(r); }
    } catch {}
  }

  console.log(`=== NY Restaurants Batch 2: ${unique.length} curated sites ===\n`);

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
  console.log(`Full data: ${OUTPUT_JSON}`);
}

main().catch(console.error);
