/**
 * Phase 1b (NY): Expand URL pool by scraping additional NYC restaurant lists
 * + trying Bing search (less aggressive bot detection than Google).
 * Loads existing ny-restaurant-urls.json, adds new URLs, saves merged result.
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'ny-restaurant-urls.json');

// Same skip list as phase1
const SKIP_DOMAINS = [
  'yelp.com', 'tripadvisor.com', 'google.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'twitter.com', 'x.com', 'doordash.com', 'ubereats.com',
  'grubhub.com', 'opentable.com', 'resy.com', 'toasttab.com', 'seamless.com',
  'postmates.com', 'zomato.com', 'foursquare.com', 'tiktok.com', 'reddit.com',
  'youtube.com', 'wikipedia.org', 'pinterest.com', 'nextdoor.com',
  'exploretock.com', 'getbento.com', 'order.online', 'slice.com',
  'menulog.com', 'caviar.com', 'chownow.com', 'beyondmenu.com',
  'eater.com', 'ny.eater.com', 'timeout.com', 'thrillist.com', 'infatuation.com',
  'theinfatuation.com', 'nymag.com', 'grubstreet.com', 'villagevoice.com',
  'nypost.com', 'nytimes.com', 'bonappetit.com', 'foodandwine.com',
  'seriouseats.com', 'eatthis.com', 'tastingtable.com', 'bustle.com',
  'secretnyc.co', 'timeoutnewyork.com', 'bkmag.com', 'brooklynmagazine.com',
  'blog.resy.com', 'gothamist.com', 'amny.com', 'ny1.com', 'pix11.com',
  'silive.com', 'brooklyneagle.com', 'bronxtimes.com', 'queenschronicle.com',
  'patch.com', 'abc7ny.com', 'cbsnewyork.com', 'fox5ny.com', 'nbcnewyork.com',
  'foodnetwork.com', 'tasteatlas.com', 'roaminghunger.com', 'singleplatform.com',
  'guide.michelin.com', 'michelin.com', 'jamesbeard.org',
  'maps.apple.com', 'squareup.com', 'square.site', 'wix.com', 'weebly.com',
  'godaddy.com', 'bing.com', 'yahoo.com', 'bbb.org', 'yellowpages.com',
  'manta.com', 'chamberofcommerce.com', 'citysearch.com', 'duckduckgo.com',
  'nycgo.com', 'nyctourism.com', 'iloveny.com', 'visitnyc.com',
  'mapquest.com', 'bizapedia.com', 'buzzrnyc.com', 'newyork.com',
  'mcdonalds.com', 'chipotle.com', 'subway.com', 'dominos.com',
  'papajohns.com', 'pizzahut.com', 'wendys.com', 'burgerking.com',
  'chilis.com', 'applebees.com', 'olivegarden.com', 'ihop.com',
  'dennys.com', 'outback.com', 'pandaexpress.com', 'tacobell.com',
  'chickfila.com', 'whataburger.com', 'jackinthebox.com', 'crackerbarrel.com',
  'starbucks.com', 'dunkindonuts.com', 'dunkin.com', 'texasroadhouse.com',
  'pappadeaux.com', 'cheddarskitchen.com', 'buffalowildwings.com',
  'popeyes.com', 'sonicdriveins.com', 'arbys.com', 'fiveguys.com',
  'jimmyjohns.com', 'potbelly.com', 'panera.com', 'noodles.com',
  'shakeshack.com', 'halalguys.com', 'sweetgreen.com', 'chopt.com',
  'justsalad.com', 'cava.com', 'dig.com',
  'nathansfamous.com', 'whitecastle.com',
  'lepainquotidien.com', 'bonchon.com',
  'tgifridays.com', 'redlobster.com', 'hooters.com',
  'amazon.com', 'apple.com', 'spotify.com', 'cloudflare.com', 'akamai.com',
  'zoominfo.com', 'entrepreneur.com', 'crunchbase.com',
  'wanderlog.com', 'expertise.com', 'nrn.com', 'restaurant.org',
  'archive.org', 'web.archive.org', 'medium.com', 'substack.com',
  'cntraveler.com', 'travelandleisure.com', 'forbes.com', 'usatoday.com',
  'huffpost.com', 'businessinsider.com', 'cnn.com', 'today.com',
  'mashable.com', 'vice.com', 'buzzfeed.com', 'eater', 'untappedcities.com',
];

function isRestaurantDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (SKIP_DOMAINS.some(d => hostname.includes(d))) return false;
    if (!url.startsWith('http')) return false;
    return true;
  } catch { return false; }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.origin;
  } catch { return null; }
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Source: Bing search (less bot detection than Google) ---
async function scrapeBingByCuisine(context) {
  console.log('\n--- Source: Bing search by cuisine/neighborhood ---');
  const restaurants = {};
  const page = await context.newPage();

  const queries = [
    'Italian restaurant Manhattan NYC family owned',
    'pizzeria Brooklyn NY independent',
    'Mexican restaurant Queens NY local',
    'taqueria Brooklyn NY independent',
    'Chinese restaurant Manhattan Chinatown',
    'Chinese restaurant Flushing Queens',
    'Thai restaurant NYC independent',
    'Vietnamese pho restaurant Brooklyn',
    'sushi restaurant Manhattan independent',
    'ramen restaurant NYC small',
    'Korean restaurant Koreatown Manhattan',
    'Korean BBQ Flushing Queens',
    'Indian restaurant Jackson Heights',
    'Pakistani Halal restaurant NYC',
    'Ethiopian restaurant Harlem NYC',
    'Greek restaurant Astoria Queens',
    'Turkish restaurant Brooklyn NYC',
    'Lebanese restaurant Bay Ridge Brooklyn',
    'Polish restaurant Greenpoint Brooklyn',
    'Russian restaurant Brighton Beach',
    'Ukrainian restaurant East Village',
    'French bistro West Village NYC',
    'Spanish tapas restaurant NYC',
    'Cuban restaurant NYC Chelsea',
    'Jamaican restaurant Brooklyn NY',
    'Dominican restaurant Washington Heights',
    'Peruvian restaurant Jackson Heights',
    'Colombian restaurant Queens NYC',
    'Argentinian steakhouse NYC',
    'Brazilian restaurant NYC',
    'soul food restaurant Harlem',
    'BBQ barbecue restaurant NYC local',
    'oyster bar restaurant NYC independent',
    'steakhouse NYC independent',
    'burger restaurant NYC local',
    'cafe coffee shop NYC independent',
    'bagel shop Brooklyn independent',
    'bakery Manhattan independent',
    'vegan restaurant NYC independent',
    'dumpling restaurant Flushing Queens',
    'restaurant Williamsburg Brooklyn local',
    'restaurant Bushwick Brooklyn independent',
    'restaurant Park Slope Brooklyn local',
    'restaurant Astoria Queens local',
    'restaurant Long Island City Queens',
    'restaurant Jackson Heights Queens',
    'restaurant Flushing Queens local',
    'restaurant Lower East Side Manhattan',
    'restaurant East Village Manhattan',
    'restaurant West Village Manhattan',
    'restaurant Harlem NYC local',
    'restaurant Washington Heights NYC',
    'restaurant Bronx Arthur Avenue',
    'restaurant Staten Island local',
    'restaurant Greenpoint Brooklyn local',
    'restaurant Crown Heights Brooklyn',
  ];

  for (const query of queries) {
    try {
      await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}&count=30`, {
        waitUntil: 'domcontentloaded', timeout: 20000
      });
      await page.waitForTimeout(1500 + Math.random() * 1500);

      const links = await page.$$eval('a[href]', anchors =>
        anchors.map(a => a.href).filter(h => h && h.startsWith('http'))
      );

      let found = 0;
      for (const link of links) {
        if (isRestaurantDomain(link)) {
          const url = normalizeUrl(link);
          if (url && !restaurants[url]) {
            restaurants[url] = { name: '', url, source: `bing:${query.substring(0, 30)}` };
            found++;
          }
        }
      }
      console.log(`  "${query}" -> ${found} new (${Object.keys(restaurants).length} total)`);
      await delay(1500 + Math.random() * 1500);
    } catch (err) {
      console.log(`  Error for "${query}": ${err.message.substring(0, 60)}`);
    }
  }

  await page.close();
  console.log(`  Total from Bing: ${Object.keys(restaurants).length}`);
  return restaurants;
}

// --- Source: Expanded NYC blog/guide list pages ---
async function scrapeBlogLists(context) {
  console.log('\n--- Source: Extended NYC blog/guide list pages ---');
  const restaurants = {};
  const page = await context.newPage();

  const listPages = [
    // Eater NY heatmaps and "where to eat" lists (we filter ny.eater.com from results, but they link out to actual sites)
    'https://ny.eater.com/maps/best-new-restaurants-nyc-heatmap',
    'https://ny.eater.com/maps/best-restaurants-brooklyn-heatmap',
    'https://ny.eater.com/maps/best-restaurants-queens',
    'https://ny.eater.com/maps/best-restaurants-east-village',
    'https://ny.eater.com/maps/best-restaurants-west-village',
    'https://ny.eater.com/maps/best-restaurants-lower-east-side',
    'https://ny.eater.com/maps/best-restaurants-williamsburg',
    'https://ny.eater.com/maps/best-restaurants-astoria',
    'https://ny.eater.com/maps/best-restaurants-flushing-queens',
    'https://ny.eater.com/maps/best-restaurants-harlem',
    'https://ny.eater.com/maps/best-restaurants-bronx',
    'https://ny.eater.com/maps/best-restaurants-staten-island',
    'https://ny.eater.com/maps/cheap-eats-nyc-best',
    'https://ny.eater.com/maps/best-italian-restaurants-nyc-essential',
    'https://ny.eater.com/maps/best-mexican-restaurants-nyc-essential',
    'https://ny.eater.com/maps/best-chinese-restaurants-nyc-essential',
    'https://ny.eater.com/maps/best-thai-restaurants-nyc-essential',
    'https://ny.eater.com/maps/best-japanese-restaurants-nyc-essential',
    'https://ny.eater.com/maps/best-korean-restaurants-nyc-essential',
    'https://ny.eater.com/maps/best-indian-restaurants-nyc-essential',

    // The Infatuation NYC guides
    'https://www.theinfatuation.com/new-york/guides/best-restaurants-nyc',
    'https://www.theinfatuation.com/new-york/guides/best-restaurants-brooklyn',
    'https://www.theinfatuation.com/new-york/guides/best-restaurants-east-village',
    'https://www.theinfatuation.com/new-york/guides/best-restaurants-west-village',
    'https://www.theinfatuation.com/new-york/guides/best-restaurants-lower-east-side',

    // Time Out NY
    'https://www.timeout.com/newyork/restaurants/best-restaurants-in-nyc',
    'https://www.timeout.com/newyork/restaurants/best-restaurants-brooklyn',
    'https://www.timeout.com/newyork/restaurants/the-best-restaurants-in-queens',
    'https://www.timeout.com/newyork/restaurants/best-restaurants-in-the-bronx',

    // Misc NYC indie restaurant lists
    'https://www.eater.com/maps/best-restaurants-nyc-cheap',
    'https://www.thrillist.com/eat/new-york/best-restaurants-nyc',
    'https://www.thrillist.com/eat/new-york/best-cheap-restaurants-nyc',
    'https://secretnyc.co/best-restaurants-nyc/',
    'https://secretnyc.co/best-italian-restaurants-nyc/',
    'https://secretnyc.co/best-mexican-restaurants-nyc/',
    'https://secretnyc.co/best-restaurants-brooklyn/',
    'https://secretnyc.co/best-restaurants-queens/',
    'https://www.cntraveler.com/restaurants/new-york',
    'https://www.bonappetit.com/restaurants-travel/new-york',
    'https://www.foodandwine.com/travel/restaurants/best-nyc-restaurants',
    'https://www.timeout.com/newyork/restaurants/best-pizza-nyc',
    'https://www.timeout.com/newyork/restaurants/best-burgers-nyc',
    'https://www.timeout.com/newyork/restaurants/best-mexican-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-italian-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-chinese-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-thai-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-sushi-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-korean-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-indian-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-greek-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-french-restaurants-nyc',
    'https://www.timeout.com/newyork/restaurants/best-vegetarian-restaurants-nyc',
  ];

  for (const listUrl of listPages) {
    try {
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      // Scroll to trigger lazy loaded content
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 1500));
        await page.waitForTimeout(500);
      }

      const links = await page.$$eval('a[href]', anchors =>
        anchors.map(a => ({ href: a.href, text: (a.textContent || '').trim() }))
          .filter(l => l.href && l.href.startsWith('http'))
      );

      let found = 0;
      for (const link of links) {
        if (isRestaurantDomain(link.href)) {
          const url = normalizeUrl(link.href);
          if (url && !restaurants[url]) {
            restaurants[url] = { name: link.text.substring(0, 80), url, source: listUrl.substring(0, 50) };
            found++;
          }
        }
      }
      console.log(`  ${listUrl.substring(0, 70)}... -> ${found} new`);
      await delay(1200);
    } catch (err) {
      console.log(`  Error: ${listUrl.substring(0, 50)} -> ${err.message.substring(0, 50)}`);
    }
  }

  await page.close();
  console.log(`  Total from blogs: ${Object.keys(restaurants).length}`);
  return restaurants;
}

async function main() {
  console.log('=== Phase 1b: Expand NYC Restaurant URLs ===\n');

  // Load existing
  let existing = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    const arr = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    for (const r of arr) existing[r.url] = r;
    console.log(`Loaded ${arr.length} existing URLs from previous phase1 run.\n`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // Run sources
  const blogResults = await scrapeBlogLists(context);
  for (const [url, data] of Object.entries(blogResults)) {
    if (!existing[url]) existing[url] = data;
    else if (data.name && !existing[url].name) existing[url].name = data.name;
  }

  const bingResults = await scrapeBingByCuisine(context);
  for (const [url, data] of Object.entries(bingResults)) {
    if (!existing[url]) existing[url] = data;
    else if (data.name && !existing[url].name) existing[url].name = data.name;
  }

  await browser.close();

  const resultArray = Object.values(existing);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultArray, null, 2));

  console.log(`\n=== Phase 1b Complete ===`);
  console.log(`Total unique restaurant domains: ${resultArray.length}`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
