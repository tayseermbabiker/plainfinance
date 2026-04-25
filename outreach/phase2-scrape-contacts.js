/**
 * Phase 2: Visit each restaurant website and extract publicly posted
 * owner names + contact emails from their own About/Contact pages.
 * Only collects what restaurants chose to publish on their own sites.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'austin-restaurants.csv');
const OUTPUT_JSON = path.join(__dirname, 'austin-restaurants-full.json');

// ============================================================
// MASTER LIST: All Austin TX restaurant websites found via
// WebSearch + blog scraping. Curated to independent/small only.
// ============================================================
const RESTAURANTS = [
  // --- Tex-Mex / Mexican ---
  { name: "Las Lomas", url: "https://laslomastexmex.com" },
  { name: "Trudy's", url: "https://trudys.com" },
  { name: "La Mancha", url: "https://lamanchatexmex.com" },
  { name: "Maudie's", url: "https://www.maudies.com" },
  { name: "Pelon's Tex-Mex", url: "https://www.pelonstexmex.com" },
  { name: "DK Maria's", url: "https://dkmarias.com" },
  { name: "Matt's El Rancho", url: "https://mattselrancho.com" },
  { name: "Eldorado Cafe", url: "https://www.eldoradocafeatx.com" },
  { name: "Habanero Mexican Cafe", url: "https://www.habanerocafe.com" },
  { name: "Tamale House East", url: "https://www.tamalehouseeast.com" },
  { name: "Juan in a Million", url: "https://juaninamillion.com" },
  { name: "Tyson's Tacos", url: "https://www.tysonstacos.com" },
  { name: "Granny's Tacos", url: "https://www.grannystacosatx.com" },
  { name: "Tacodeli", url: "https://www.tacodeli.com" },
  { name: "Hasta La Luna Tacos", url: "https://www.hastalalunatacos.com" },
  { name: "Taco Joint", url: "https://austintacojoint.com" },
  { name: "El Mercado", url: "https://elmercadorestaurant.com" },
  { name: "ATX Cocina", url: "https://www.atxcocina.com" },
  { name: "La Condesa", url: "https://lacondesa.com" },
  { name: "Nixta Taqueria", url: "https://www.nixtataqueria.com" },
  { name: "Curra's Grill", url: "https://currasgrill.com" },
  { name: "Mi Madre's", url: "https://mimadresaustin.com" },

  // --- Thai / Vietnamese / Asian ---
  { name: "Dee Dee", url: "https://www.deedeeatx.com" },
  { name: "Pho Thaison", url: "https://phothaison.com" },
  { name: "Dong Nai", url: "https://dongnaiaustin.com" },
  { name: "Cyclo Vietnamese", url: "https://www.cyclorestaurantaustin.com" },
  { name: "Bun Belly", url: "https://www.bunbellyatx.com" },
  { name: "Het Say", url: "https://www.hetsayaustin.com" },
  { name: "888 Pan Asian", url: "https://www.888panasianrestaurant.com" },
  { name: "PhoWok", url: "https://www.phowokaustin.com" },
  { name: "mam mam", url: "https://www.mam-atx.com" },
  { name: "Thai Fresh", url: "https://www.thai-fresh.com" },
  { name: "Fat Dragon", url: "https://www.fatdragonatx.com" },
  { name: "The Peached Tortilla", url: "https://www.thepeachedtortilla.com" },

  // --- Korean / Japanese / Sushi ---
  { name: "Osaka Mansun", url: "https://www.osakamansun.com" },
  { name: "Oseyo", url: "https://www.oseyoaustin.com" },
  { name: "O'daku Sushi", url: "https://www.odaku-sushi.com" },
  { name: "Korea House", url: "https://www.koreahouseaustin.com" },
  { name: "DK Sushi & Seoul", url: "https://www.dksushi.com" },

  // --- Ramen ---
  { name: "Sazan Ramen", url: "https://sazanramen.com" },
  { name: "Daruma Ramen", url: "https://www.darumaramen.com" },
  { name: "Ramen 512", url: "https://www.ramen512.com" },
  { name: "Ramen Del Barrio", url: "https://www.ramendelbarrio.com" },
  { name: "Michi Ramen", url: "https://michiramen.com" },
  { name: "EurAsia Ramen", url: "https://www.eurasiasushiaustin.com" },

  // --- Italian / Pizza ---
  { name: "Patrizi's", url: "https://www.patrizis.com" },
  { name: "Craigo's", url: "https://www.craigositalian.com" },
  { name: "Bufalina", url: "https://www.bufalinapizza.com" },
  { name: "Baldinucci Pizza", url: "https://www.baldinucci.pizza" },
  { name: "Lefty's Pizza Kitchen", url: "https://www.leftyspizzakitchenaustintx.com" },
  { name: "The Backspace", url: "https://www.backspacepizza.com" },
  { name: "Roppolo's", url: "https://roppolos.com" },
  { name: "Reale's Italian Cafe", url: "https://www.realespizza.com" },

  // --- BBQ ---
  { name: "La Barbecue", url: "https://labarbecue.com" },
  { name: "LeRoy and Lewis", url: "https://leroyandlewisbbq.com" },
  { name: "Lamberts", url: "https://lambertsaustin.com" },
  { name: "Rollin Smoke BBQ", url: "https://rollinsmokeatxbbq.com" },
  { name: "Franklin Barbecue", url: "https://franklinbbq.com" },
  { name: "Terry Black's", url: "https://terryblacksbbq.com" },
  { name: "KG BBQ", url: "https://www.kgbbq.com" },
  { name: "InterStellar BBQ", url: "https://www.theinterstellarbbq.com" },
  { name: "Cooper's BBQ", url: "https://coopersbbqaustin.com" },

  // --- Southern / Soul Food / Cajun ---
  { name: "Whip My Soul", url: "https://whipmysoul.shop" },
  { name: "Vic & Al's", url: "https://www.vicandals.com" },
  { name: "Hoover's Cooking", url: "https://www.hooverscooking.com" },
  { name: "Evangeline Cafe", url: "https://www.evangelinecafe.com" },
  { name: "Lil' Easy", url: "https://www.lileasyatx.com" },
  { name: "Mama Jambalaya", url: "https://mamajambalaya.com" },

  // --- Seafood ---
  { name: "Bill's Oyster", url: "https://www.billsoyster.com" },
  { name: "Deckhand Oyster Bar", url: "https://www.deckhandoysterbar.com" },
  { name: "Catfish Parlour", url: "https://catfishparlour.com" },
  { name: "Quality Seafood", url: "https://qualityseafoodmarket.com" },
  { name: "Mongers", url: "https://www.mongersaustin.com" },
  { name: "TLC Austin", url: "https://www.tlcaustin.com" },
  { name: "Mario's Seafood", url: "https://marioseafood.com" },
  { name: "Perla's", url: "https://perlasaustin.com" },

  // --- Ethiopian / African ---
  { name: "Aster's Ethiopian", url: "https://www.astersethiopian.com" },
  { name: "Habesha Ethiopian", url: "https://habeshaaustin.com" },
  { name: "Taste of Ethiopia", url: "https://www.tasteofethiopiaaustin.com" },
  { name: "Injera & Beyond", url: "https://injeratx.com" },

  // --- Indian / Mediterranean / Middle Eastern ---
  { name: "Caspian Grill", url: "https://caspiangrillaustin.com" },
  { name: "Meditindia", url: "https://meditindiatx.com" },
  { name: "Ararat Mid-East Fusion", url: "https://araratfusion.com" },
  { name: "Asiana Indian Cuisine", url: "https://www.asianaindiancuisine.com" },

  // --- Burgers / Sandwiches / Deli ---
  { name: "JewBoy Burgers", url: "https://jewboyburgers.com" },
  { name: "Sandy's Hamburgers", url: "https://sandysaustin.com" },
  { name: "Wally's Burger Express", url: "https://www.wallysaustin.com" },
  { name: "Knuckle Sandwich", url: "https://www.knucklesandwichatx.com" },
  { name: "Burger Bar", url: "https://www.burgerbaraustin.com" },
  { name: "Otherside Deli", url: "https://www.othersidedeliatx.com" },
  { name: "Billy's on Burnet", url: "https://billysonburnet.com" },
  { name: "Hat Creek Burgers", url: "https://hatcreekburgers.com" },
  { name: "FoodHeads", url: "https://www.foodheads.com" },

  // --- Vegan / Vegetarian ---
  { name: "Bouldin Creek Cafe", url: "https://bouldincreekcafe.com" },
  { name: "Casa de Luz", url: "https://www.casadeluz.org" },

  // --- Brunch / Breakfast / Cafe ---
  { name: "Kerbey Lane Cafe", url: "https://kerbeylanecafe.com" },
  { name: "Joe's Bakery", url: "https://joesbakery.com" },
  { name: "Butterwhisk Brunch", url: "https://butterwhiskbrunchhouseatx.com" },
  { name: "Picnik", url: "https://www.picnikrestaurants.com" },
  { name: "Texas Honey Ham", url: "https://texashoneyham.com" },
  { name: "June's All Day", url: "https://junesallday.com" },
  { name: "Turnstile", url: "https://turnstilebrews.com" },

  // --- American / New American / Fine Dining ---
  { name: "Bartlett's", url: "https://bartlettsaustin.com" },
  { name: "Lenoir", url: "https://www.lenoirrestaurant.com" },
  { name: "Hillside Farmacy", url: "https://www.hillsidefarmacy.com" },
  { name: "Odd Duck", url: "https://www.oddduckaustin.com" },
  { name: "Barley Swine", url: "https://www.barleyswine.com" },
  { name: "Fonda San Miguel", url: "https://www.fondasanmiguel.com" },
  { name: "Olamaie", url: "https://www.olamaieaustin.com" },
  { name: "Hestia", url: "https://hestiaaustin.com" },
  { name: "Jacoby's", url: "https://www.jacobysaustin.com" },

  // --- From blog scrapes (extra) ---
  { name: "Teal House", url: "https://www.tealhouse.co" },
  { name: "Bento Picnic", url: "https://www.bentopicnic.com" },
  { name: "Veracruz All Natural", url: "https://www.veracruzallnatural.com" },
  { name: "Bird Bird Biscuit", url: "https://birdbirdaustin.com" },
  { name: "Home Slice Pizza", url: "https://homeslicepizza.com" },
  { name: "Salty Sow", url: "https://saltysow.com" },
  { name: "Contigo", url: "https://contigoaustin.com" },
  { name: "Suerte", url: "https://www.suerteaustin.com" },
  { name: "Launderette", url: "https://www.launderetteaustin.com" },
  { name: "Uchi Austin", url: "https://uchiaustin.com" },
  { name: "Uchiko Austin", url: "https://uchikoaustin.com" },
  { name: "Kemuri Tatsu-ya", url: "https://kemuri-tatsuya.com" },
  { name: "Dai Due", url: "https://www.daidue.com" },
  { name: "L'Oca d'Oro", url: "https://www.locadoro.com" },
  { name: "Foreign & Domestic", url: "https://fndaustin.com" },
  { name: "Easy Tiger", url: "https://www.easytigeraustin.com" },
  { name: "Justine's Brasserie", url: "https://justines1937.com" },
  { name: "Buenos Aires Cafe", url: "https://www.buenosairescafe.com" },
  { name: "Eberly", url: "https://www.eberlyaustin.com" },
  { name: "Counter Cafe", url: "https://thecountercafe.com" },
  { name: "Elizabeth Street Cafe", url: "https://elizabethstreetcafe.com" },
  { name: "Loro", url: "https://www.loroeats.com" },
  { name: "Red Ash", url: "https://www.redashgrille.com" },
  { name: "Jeffrey's", url: "https://jeffreysofaustin.com" },
  { name: "Emmer & Rye", url: "https://www.emmerandrye.com" },
  { name: "Juliet", url: "https://juliet-austin.com" },
  { name: "Cafe No Se", url: "https://www.cafenoseatx.com" },
  { name: "Mr. Natural", url: "https://www.mrnatural-austin.com" },
  { name: "Cisco's", url: "https://ciscosaustin.com" },
  { name: "Paperboy", url: "https://www.paperboyaustin.com" },
  { name: "Comadre Panaderia", url: "https://www.comadrepanaderia.com" },
  { name: "Spread & Co", url: "https://www.spreadandco.com" },

  // --- Persian ---
  { name: "Roya", url: "https://www.royaaustin.com" },

  // --- More from searches ---
  { name: "Catfish Parlour South", url: "https://www.austinseafoodrestaurant.com" },
  { name: "Down South Cajun Eats", url: "https://cajjuneats.com" },
  { name: "Este", url: "https://www.esteatx.com" },
  { name: "Ezov", url: "https://ezovatx.com" },
  { name: "JewBoy Sub Shop", url: "https://jewboysubshop.com" },
  { name: "Fabrik", url: "https://www.fabrikatx.com" },
];

// ============================================================

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

// Extract emails from mailto: links
async function extractMailtoEmails(page) {
  try {
    return await page.$$eval('a[href^="mailto:"]', anchors =>
      anchors.map(a => a.href.replace('mailto:', '').split('?')[0].trim().toLowerCase())
        .filter(e => e.includes('@'))
    );
  } catch { return []; }
}

// Look for owner/manager names near keywords
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

async function scrapeRestaurant(context, restaurant, index, total) {
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

    // Visit homepage
    await page.goto(restaurant.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    let allText = '';
    try { allText = await page.evaluate(() => document.body?.innerText || ''); } catch {}
    result.pagesChecked++;

    // Get mailto emails from homepage
    result.emails.push(...await extractMailtoEmails(page));

    // Find internal About/Contact links
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

    // Visit internal pages + /contact, /about fallbacks
    const visited = new Set([restaurant.url, baseUrl, baseUrl + '/']);
    const pagesToVisit = [...new Set(internalLinks)].slice(0, 4);

    // Add fallback paths
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

    // Extract from all text
    result.emails.push(...extractEmails(allText));
    result.emails = [...new Set(result.emails.map(e => e.toLowerCase()))].filter(e => e.includes('@'));

    const owners = extractOwnerName(allText);
    if (owners.length > 0) result.ownerName = owners[0];

  } catch (err) {
    // Site unreachable — skip silently
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  // Deduplicate by domain
  const seen = new Set();
  const unique = [];
  for (const r of RESTAURANTS) {
    try {
      const domain = new URL(r.url).hostname.replace(/^www\./, '');
      if (!seen.has(domain)) {
        seen.add(domain);
        unique.push(r);
      }
    } catch {}
  }

  console.log(`=== Phase 2: Scraping ${unique.length} restaurant websites ===\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const allResults = [];
  const withEmail = [];

  for (let i = 0; i < unique.length; i++) {
    const r = unique[i];
    process.stdout.write(`[${i + 1}/${unique.length}] ${r.name.padEnd(25)} `);
    const info = await scrapeRestaurant(context, r, i, unique.length);
    allResults.push(info);

    if (info.emails.length > 0) {
      withEmail.push(info);
      console.log(`EMAIL: ${info.emails[0]}${info.ownerName ? ' | Owner: ' + info.ownerName : ''}`);
    } else if (info.ownerName) {
      console.log(`OWNER ONLY: ${info.ownerName}`);
    } else {
      console.log(`-`);
    }

    // Brief delay
    await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
  }

  await browser.close();

  // Save full JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allResults, null, 2));

  // Build CSV
  const csvRows = ['Restaurant Name,Owner/Manager Name,Email,Website URL'];
  for (const r of allResults) {
    if (r.emails.length > 0) {
      // Use most relevant email (prefer info@, hello@, contact@ over reservations@, catering@)
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

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Restaurants checked: ${unique.length}`);
  console.log(`With public email: ${withEmail.length}`);
  console.log(`With owner name: ${allResults.filter(r => r.ownerName).length}`);
  console.log(`CSV rows: ${csvRows.length - 1}`);
  console.log(`\nSaved: ${OUTPUT_CSV}`);
  console.log(`Full data: ${OUTPUT_JSON}`);
}

main().catch(console.error);
