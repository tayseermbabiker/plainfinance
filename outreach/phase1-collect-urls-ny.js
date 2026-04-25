/**
 * Phase 1 (NY): Collect NYC restaurant website URLs from directory pages
 * Sources: Google searches by cuisine/neighborhood + NYC blog lists
 * Target: small independent / family-owned restaurants, all 5 boroughs
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'ny-restaurant-urls.json');

// Domains to skip (aggregators, directories, media, chains)
const SKIP_DOMAINS = [
  // Review/booking aggregators
  'yelp.com', 'tripadvisor.com', 'google.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'twitter.com', 'x.com', 'doordash.com', 'ubereats.com',
  'grubhub.com', 'opentable.com', 'resy.com', 'toasttab.com', 'seamless.com',
  'postmates.com', 'zomato.com', 'foursquare.com', 'tiktok.com', 'reddit.com',
  'youtube.com', 'wikipedia.org', 'pinterest.com', 'nextdoor.com',
  'exploretock.com', 'getbento.com', 'order.online', 'slice.com',
  'menulog.com', 'caviar.com', 'chownow.com', 'beyondmenu.com',

  // NYC media / food blogs
  'eater.com', 'ny.eater.com', 'timeout.com', 'thrillist.com', 'infatuation.com',
  'theinfatuation.com', 'nymag.com', 'grubstreet.com', 'villagevoice.com',
  'nypost.com', 'nytimes.com', 'bonappetit.com', 'foodandwine.com',
  'seriouseats.com', 'eatthis.com', 'tastingtable.com', 'bustle.com',
  'secretnyc.co', 'timeoutnewyork.com', 'bkmag.com', 'brooklynmagazine.com',
  'blog.resy.com', 'gothamist.com', 'amny.com', 'ny1.com', 'pix11.com',
  'silive.com', 'brooklyneagle.com', 'bronxtimes.com', 'queenschronicle.com',
  'patch.com', 'abc7ny.com', 'cbsnewyork.com', 'fox5ny.com', 'nbcnewyork.com',

  // National food/travel media
  'foodnetwork.com', 'tasteatlas.com', 'roaminghunger.com', 'singleplatform.com',
  'guide.michelin.com', 'michelin.com', 'jamesbeard.org',

  // Local guide/directory
  'maps.apple.com', 'squareup.com', 'square.site', 'wix.com', 'weebly.com',
  'godaddy.com', 'bing.com', 'yahoo.com', 'bbb.org', 'yellowpages.com',
  'manta.com', 'chamberofcommerce.com', 'citysearch.com',
  'nycgo.com', 'nyctourism.com', 'iloveny.com', 'visitnyc.com',
  'mapquest.com', 'bizapedia.com', 'buzzrnyc.com', 'newyork.com',

  // Chains (national fast food / casual chains to filter out)
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
  'justsalad.com', 'cava.com', 'dig.com', 'prettyagurrrl.com',
  'prethehaus.com', 'prethapark.com',
  'nathansfamous.com', 'whitecastle.com', 'popeyeschicken.com',
  'lepainquotidien.com', 'joesteak.com', 'bonchon.com',
  'tgifridays.com', 'redlobster.com', 'hooters.com',

  // CDN / asset domains
  'amazon.com', 'apple.com', 'spotify.com', 'cloudflare.com', 'akamai.com',
  'zoominfo.com', 'entrepreneur.com', 'crunchbase.com',

  // Other noise
  'wanderlog.com', 'expertise.com', 'nrn.com', 'restaurant.org',
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

// Source 1: Google searches by cuisine + NYC boroughs/neighborhoods
async function scrapeGoogleByCuisine(context) {
  console.log('\n--- Source: Google searches by cuisine ---');
  const restaurants = {};
  const page = await context.newPage();

  const queries = [
    // --- By cuisine ---
    'Italian restaurant Manhattan NYC independent',
    'Italian restaurant Brooklyn NY family owned',
    'pizzeria Brooklyn NY independent small',
    'pizzeria Queens NY family owned',
    'Mexican restaurant NYC family owned',
    'Mexican restaurant Queens NY local',
    'taqueria Brooklyn NY independent',
    'Chinese restaurant Manhattan Chinatown NYC',
    'Chinese restaurant Flushing Queens NY',
    'dim sum restaurant NYC local',
    'Thai restaurant NYC independent',
    'Vietnamese restaurant NYC Chinatown',
    'Vietnamese pho restaurant Brooklyn NY',
    'Japanese sushi restaurant Manhattan NYC',
    'Japanese izakaya restaurant East Village NYC',
    'ramen restaurant NYC independent',
    'Korean restaurant Koreatown Manhattan NYC',
    'Korean restaurant Flushing Queens NY',
    'Korean BBQ restaurant NYC local',
    'Indian restaurant NYC Curry Hill',
    'Indian restaurant Jackson Heights Queens',
    'Pakistani Halal restaurant NYC',
    'Bangladeshi restaurant NYC',
    'Ethiopian restaurant NYC Harlem Brooklyn',
    'African restaurant Harlem NYC',
    'Senegalese restaurant NYC Harlem',
    'Mediterranean restaurant NYC local',
    'Greek restaurant Astoria Queens',
    'Turkish restaurant Brooklyn NYC',
    'Middle Eastern restaurant NYC local',
    'Lebanese restaurant Bay Ridge Brooklyn',
    'Israeli restaurant NYC small',
    'Jewish deli NYC Lower East Side',
    'Kosher restaurant NYC Midtown',
    'Polish restaurant Greenpoint Brooklyn',
    'Russian restaurant Brighton Beach Brooklyn',
    'Ukrainian restaurant East Village NYC',
    'German restaurant NYC independent',
    'French bistro restaurant NYC independent',
    'French restaurant West Village NYC',
    'Spanish tapas restaurant NYC independent',
    'Cuban restaurant NYC Chelsea',
    'Caribbean restaurant Brooklyn NY local',
    'Jamaican restaurant Brooklyn NY',
    'Dominican restaurant Washington Heights NYC',
    'Puerto Rican restaurant Bronx NYC',
    'Peruvian restaurant NYC Jackson Heights',
    'Colombian restaurant Queens NYC',
    'Ecuadorian restaurant Queens NYC',
    'Argentinian steakhouse restaurant NYC independent',
    'Brazilian restaurant NYC local',
    'soul food restaurant Harlem NYC',
    'Southern restaurant Brooklyn NYC local',
    'BBQ barbecue restaurant NYC local',
    'seafood restaurant NYC independent',
    'oyster bar restaurant NYC independent',
    'steakhouse NYC independent local',
    'burger restaurant NYC independent',
    'breakfast brunch restaurant NYC local',
    'cafe coffee shop NYC independent',
    'bagel shop NYC Brooklyn independent',
    'bakery NYC Manhattan independent',
    'bakery Brooklyn NY family owned',
    'vegan restaurant NYC local independent',
    'vegetarian restaurant NYC independent',
    'diner NYC classic family owned',
    'pub gastropub NYC independent',
    'wine bar restaurant NYC independent',
    'dumpling restaurant Flushing Queens',
    'noodle restaurant NYC Chinatown',
    'taco restaurant Brooklyn NY local',
    'donut shop NYC independent',
    'deli sandwich shop NYC independent',

    // --- By borough / neighborhood ---
    'restaurant Lower East Side Manhattan NYC local',
    'restaurant East Village Manhattan NYC independent',
    'restaurant West Village Manhattan NYC local',
    'restaurant Greenwich Village NYC independent',
    'restaurant Chelsea Manhattan NYC local',
    'restaurant Harlem Manhattan NYC local',
    'restaurant Washington Heights Manhattan NYC',
    'restaurant Upper East Side Manhattan NYC',
    'restaurant Upper West Side Manhattan NYC local',
    'restaurant Chinatown Manhattan NYC',
    'restaurant Little Italy Manhattan NYC',
    'restaurant SoHo Manhattan NYC independent',
    'restaurant Tribeca Manhattan NYC independent',
    'restaurant NoLita Manhattan NYC',
    'restaurant Williamsburg Brooklyn NY local',
    'restaurant Bushwick Brooklyn NY independent',
    'restaurant Park Slope Brooklyn NY local',
    'restaurant Fort Greene Brooklyn NY local',
    'restaurant Bed Stuy Brooklyn NY',
    'restaurant Crown Heights Brooklyn NY',
    'restaurant Sunset Park Brooklyn NY local',
    'restaurant Bay Ridge Brooklyn NY',
    'restaurant Greenpoint Brooklyn NY local',
    'restaurant Red Hook Brooklyn NY local',
    'restaurant Carroll Gardens Brooklyn NY',
    'restaurant Cobble Hill Brooklyn NY local',
    'restaurant Dumbo Brooklyn NY independent',
    'restaurant Astoria Queens NY local',
    'restaurant Long Island City Queens NY',
    'restaurant Jackson Heights Queens NY local',
    'restaurant Flushing Queens NY local',
    'restaurant Forest Hills Queens NY local',
    'restaurant Sunnyside Queens NY',
    'restaurant Elmhurst Queens NY local',
    'restaurant Woodside Queens NY local',
    'restaurant Rego Park Queens NY',
    'restaurant Bronx NY independent local',
    'restaurant Arthur Avenue Bronx NY Little Italy',
    'restaurant Riverdale Bronx NY local',
    'restaurant Fordham Bronx NY local',
    'restaurant Staten Island NY local independent',
    'restaurant St George Staten Island NY',
  ];

  for (const query of queries) {
    try {
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=30`, {
        waitUntil: 'domcontentloaded', timeout: 20000
      });
      await page.waitForTimeout(2000 + Math.random() * 2000);

      // Accept cookies if prompted
      try {
        const btn = page.locator('button:has-text("Accept all"), button:has-text("I agree")');
        if (await btn.count() > 0) await btn.first().click();
      } catch {}

      const links = await page.$$eval('a[href]', anchors =>
        anchors.map(a => a.href).filter(h => h && h.startsWith('http'))
      );

      let found = 0;
      for (const link of links) {
        if (isRestaurantDomain(link)) {
          const url = normalizeUrl(link);
          if (url && !restaurants[url]) {
            restaurants[url] = { name: '', url, source: `google:${query.substring(0, 30)}` };
            found++;
          }
        }
      }
      console.log(`  "${query}" -> ${found} new URLs (${Object.keys(restaurants).length} total)`);

      await delay(2500 + Math.random() * 2500);
    } catch (err) {
      console.log(`  Error for "${query}": ${err.message.substring(0, 60)}`);
    }
  }

  await page.close();
  console.log(`  Total from Google: ${Object.keys(restaurants).length}`);
  return restaurants;
}

// Source 2: NYC blog list pages
async function scrapeBlogLists(context) {
  console.log('\n--- Source: Blog list pages ---');
  const restaurants = {};
  const page = await context.newPage();

  const listPages = [
    'https://secretnyc.co/family-owned-restaurants-nyc/',
    'https://secretnyc.co/oldest-restaurants-nyc/',
    'https://www.cntraveler.com/gallery/best-restaurants-new-york-city',
    'https://bkmag.com/2023/03/30/family-owned-brooklyn-restaurants/',
    'https://www.timeout.com/newyork/restaurants/best-cheap-restaurants-nyc',
    'https://untappedcities.com/nycs-oldest-restaurants/',
    'https://www.thrillist.com/eat/new-york/old-restaurants-nyc-family-owned',
  ];

  for (const listUrl of listPages) {
    try {
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

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
      console.log(`  ${listUrl.substring(0, 60)}... -> ${found} new URLs`);
      await delay(1500);
    } catch (err) {
      console.log(`  Error: ${err.message.substring(0, 60)}`);
    }
  }

  await page.close();
  console.log(`  Total from blogs: ${Object.keys(restaurants).length}`);
  return restaurants;
}

async function main() {
  console.log('=== Phase 1: Collect NYC Restaurant URLs ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const allRestaurants = {};

  const googleResults = await scrapeGoogleByCuisine(context);
  Object.assign(allRestaurants, googleResults);

  const blogResults = await scrapeBlogLists(context);
  for (const [url, data] of Object.entries(blogResults)) {
    if (!allRestaurants[url]) allRestaurants[url] = data;
    else if (data.name && !allRestaurants[url].name) allRestaurants[url].name = data.name;
  }

  await browser.close();

  const resultArray = Object.values(allRestaurants);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultArray, null, 2));

  console.log(`\n=== Phase 1 Complete ===`);
  console.log(`Total unique restaurant domains: ${resultArray.length}`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
