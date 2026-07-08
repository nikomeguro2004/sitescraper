import { scrapeWebsite } from "./lib/scraper/scrape";

async function main() {
  const sites = [
    "https://example.com",
    "https://news.ycombinator.com"
  ];
  
  for (const site of sites) {
    try {
      console.log(`Starting scrape of ${site}...`);
      const data = await scrapeWebsite(site);
      console.log(`Scrape successful for ${site}! Title: ${data.title}`);
    } catch (err) {
      console.error(`Scrape failed for ${site}:`, err);
    }
  }
}

main();
