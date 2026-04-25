/**
 * Phase 1: Collect restaurant website URLs from directory pages
 * Sources: austintexas.org, OpenTable, blog lists, Google searches by cuisine
 */
const { chromium } = require('C:/Users/LENOVO/Desktop/New folder/Projects/kidsdirectory/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'restaurant-urls.json');

// Domains to skip
const SKIP_DOMAINS = [
  'yelp.com', 'tripadvisor.com', 'google.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'twitter.com', 'x.com', 'doordash.com', 'ubereats.com',
  'grubhub.com', 'opentable.com', 'resy.com', 'toasttab.com', 'seamless.com',
  'postmates.com', 'zomato.com', 'foursquare.com', 'tiktok.com', 'reddit.com',
  'youtube.com', 'wikipedia.org', 'pinterest.com', 'nextdoor.com',
  'eater.com', 'timeout.com', 'thrillist.com', 'infatuation.com',
  'austin360.com', 'austinmonthly.com', 'do512.com', 'culturemap.com',
  'austintexas.org', 'feastio.com', 'somuchlife.com', 'onlyinyourstate.com',
  'texasmonthly.com', 'austinchronicle.com', 'tribeza.com',
  'maps.apple.com', 'squareup.com', 'square.site', 'wix.com', 'weebly.com',
  'godaddy.com', 'bing.com', 'yahoo.com', 'bbb.org', 'yellowpages.com',
  'manta.com', 'chamberofcommerce.com', 'menulog.com',
  'mcdonalds.com', 'chipotle.com', 'subway.com', 'dominos.com',
  'papajohns.com', 'pizzahut.com', 'wendys.com', 'burgerking.com',
  'chilis.com', 'applebees.com', 'olivegarden.com', 'ihop.com',
  'dennys.com', 'outback.com', 'pandaexpress.com', 'tacobell.com',
  'chickfila.com', 'whataburger.com', 'jackinthebox.com', 'crackerbarrel.com',
  'starbucks.com', 'dunkindonuts.com', 'texasroadhouse.com',
  'pappadeaux.com', 'cheddarskitchen.com', 'buffalowildwings.com',
  'popeyes.com', 'sonicdriveins.com', 'arbys.com', 'fiveguys.com',
  'jimmyjohns.com', 'potbelly.com', 'panera.com', 'noodles.com',
  'guide.michelin.com', 'foodnetwork.com', 'tasteatlas.com',
  'roaminghunger.com', 'singleplatform.com', 'restaurantji.com',
  'exploretock.com', 'getbento.com', 'order.online', 'slice.com',
  'eggscellent.site', 'res-menu.net', 'wheree.com', 'restaurants-world.net',
  'foodjoyy.net', 'wa-cafe.com', 'americascuisine.com',
  'amazon.com', 'apple.com', 'spotify.com', 'dinersdriveinsdiveslocations.com',
  'locallyaustin.org', '512area.com', 'gatordirectory.com', 'austinguidered.com',
  'casago.com', 'novacircle.com', 'thevendry.com', 'austinfoodbloggers.org',
  'bramlettpartners.com', 'weiss.group', 'austincityguide.com',
  'texastimetravel.com', '6street.com', 'atxtoday.6amcity.com',
  'exploreatx.us', 'texaslifestylemag.com', 'fearlesscaptivations.com',
  'atasteofkoko.com', 'alexreichek.com', 'withthewoodruffs.com',
  'nmgastronome.com', 'austinrestaurantweeks.org', 'romanticspotsaustin.com',
  'stevesfoodblog.com', 'perceptivetravel.com', 'getmeez.com', 'nrn.com',
  'zoominfo.com', 'thevenuecollective.com', 'emmerhospitality.com',
  'top-menus.com', 'hellowoodlands.com', 'woodlandsonline.com',
  'nationaltoday.com', 'culturemaptastemakers.com', 'momskoop.com',
  'texashighways.com', 'entrepreneur.com', 'momandpopeats.com',
  'forum.quartertothree.com', 'bigcitychefs.com', 'expertise.com',
  'thetexastasty.com', 'austinstaysweird.com', 'wanderlog.com',
  'blog.resy.com',
];

function isRestaurantDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (SKIP_DOMAINS.some(d => hostname.includes(d))) return false;
    // Must be http/https
    if (!url.startsWith('http')) return false;
    return true;
  } catch { return false; }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.origin; // just keep the domain
  } catch { return null; }
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Source 1: austintexas.org restaurant listings
async function scrapeAustinTexasOrg(context) {
  console.log('\n--- Source: austintexas.org ---');
  const restaurants = {};
  const page = await context.newPage();

  try {
    // Visit the food and drink page
    await page.goto('https://www.austintexas.org/food-and-drink/', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await page.waitForTimeout(3000);

    // Try to load more items and collect listing links
    let listingLinks = [];

    // Scroll down repeatedly to trigger lazy loading
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 2000));
      await page.waitForTimeout(1000);
    }

    // Get all listing links
    listingLinks = await page.$$eval('a[href*="/listings/"]', anchors =>
      anchors.map(a => ({ href: a.href, text: (a.textContent || '').trim() }))
        .filter(l => l.href.includes('austintexas.org/listings/'))
    );

    console.log(`  Found ${listingLinks.length} listing links on main page`);

    // Visit each listing page to get the restaurant's actual website
    const uniqueListings = [...new Map(listingLinks.map(l => [l.href, l])).values()].slice(0, 200);

    for (let i = 0; i < uniqueListings.length; i++) {
      const listing = uniqueListings[i];
      try {
        await page.goto(listing.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800);

        // Look for "Visit Website" or external links
        const externalLinks = await page.$$eval('a[href]', (anchors) => {
          return anchors
            .filter(a => {
              const text = (a.textContent || '').toLowerCase();
              const href = (a.href || '').toLowerCase();
              return (text.includes('visit website') || text.includes('website') ||
                      text.includes('official site') || a.classList.contains('website-link') ||
                      a.getAttribute('data-type') === 'website') &&
                     !href.includes('austintexas.org');
            })
            .map(a => a.href);
        });

        if (externalLinks.length > 0) {
          const url = normalizeUrl(externalLinks[0]);
          if (url && isRestaurantDomain(externalLinks[0])) {
            const name = listing.text.split('\n')[0].trim().substring(0, 80);
            restaurants[url] = { name: name || '', url, source: 'austintexas.org' };
          }
        }
      } catch {}

      if (i % 20 === 0 && i > 0) console.log(`  Processed ${i}/${uniqueListings.length} listings (${Object.keys(restaurants).length} restaurants found)`);
    }
  } catch (err) {
    console.log(`  Error: ${err.message.substring(0, 80)}`);
  }
  await page.close();
  console.log(`  Total from austintexas.org: ${Object.keys(restaurants).length}`);
  return restaurants;
}

// Source 2: Google searches by cuisine type + "Austin TX"
async function scrapeGoogleByCuisine(context) {
  console.log('\n--- Source: Google searches by cuisine ---');
  const restaurants = {};
  const page = await context.newPage();

  const queries = [
    // By cuisine
    'Mexican restaurant Austin TX',
    'Tex-Mex restaurant Austin TX',
    'BBQ barbecue restaurant Austin TX',
    'Italian restaurant Austin TX',
    'Thai restaurant Austin TX',
    'Vietnamese restaurant Austin TX',
    'Chinese restaurant Austin TX',
    'Indian restaurant Austin TX',
    'Japanese sushi restaurant Austin TX',
    'Korean restaurant Austin TX',
    'Ethiopian restaurant Austin TX',
    'Mediterranean restaurant Austin TX',
    'Southern soul food restaurant Austin TX',
    'seafood restaurant Austin TX',
    'pizza restaurant Austin TX',
    'burger restaurant Austin TX',
    'taco restaurant Austin TX',
    'breakfast brunch restaurant Austin TX',
    'cafe coffee shop Austin TX food',
    'bakery Austin TX',
    'Cajun Creole restaurant Austin TX',
    'Greek restaurant Austin TX',
    'Persian restaurant Austin TX',
    'vegan vegetarian restaurant Austin TX',
    'Cuban restaurant Austin TX',
    'Argentinian restaurant Austin TX',
    'food truck Austin TX popular',
    'diner Austin TX local',
    'steakhouse Austin TX independent local',
    'ramen noodle restaurant Austin TX',
    // By neighborhood
    'restaurant East Austin TX local',
    'restaurant South Austin TX local',
    'restaurant North Austin TX local',
    'restaurant downtown Austin TX independent',
    'restaurant South Lamar Austin TX',
    'restaurant Burnet Road Austin TX',
    'restaurant East 6th Austin TX',
    'restaurant South Congress Austin TX',
    'restaurant Mueller Austin TX',
    'restaurant Manor Road Austin TX',
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

      // Get all links
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

// Source 3: Blog list pages
async function scrapeBlogLists(context) {
  console.log('\n--- Source: Blog list pages ---');
  const restaurants = {};
  const page = await context.newPage();

  const listPages = [
    'https://somuchlife.com/family-owned-austin-restaurants/',
    'https://www.onlyinyourstate.com/texas/austin/mom-pop-restaurants-in-austin-tx/',
    'https://fearlesscaptivations.com/2016-city-guide-best-north-austin-restaurants/',
    'https://bramlettpartners.com/blog/best-restaurants-in-southwest-austin',
    'https://austinfoodbloggers.org/best-places-to-eat-in-austin/',
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
            restaurants[url] = { name: link.text.substring(0, 80), url, source: listUrl.substring(0, 40) };
            found++;
          }
        }
      }
      console.log(`  ${listUrl.substring(0, 50)}... -> ${found} new URLs`);
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
  console.log('=== Phase 1: Collect Austin TX Restaurant URLs ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const allRestaurants = {};

  // Run sources
  const googleResults = await scrapeGoogleByCuisine(context);
  Object.assign(allRestaurants, googleResults);

  const blogResults = await scrapeBlogLists(context);
  for (const [url, data] of Object.entries(blogResults)) {
    if (!allRestaurants[url]) allRestaurants[url] = data;
    else if (data.name && !allRestaurants[url].name) allRestaurants[url].name = data.name;
  }

  // austintexas.org takes long, do it if we still need more
  if (Object.keys(allRestaurants).length < 200) {
    const atoResults = await scrapeAustinTexasOrg(context);
    for (const [url, data] of Object.entries(atoResults)) {
      if (!allRestaurants[url]) allRestaurants[url] = data;
      else if (data.name && !allRestaurants[url].name) allRestaurants[url].name = data.name;
    }
  }

  await browser.close();

  // Save results
  const resultArray = Object.values(allRestaurants);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultArray, null, 2));

  console.log(`\n=== Phase 1 Complete ===`);
  console.log(`Total unique restaurant domains: ${resultArray.length}`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
