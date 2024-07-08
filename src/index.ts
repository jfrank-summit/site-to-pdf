import { crawlAndCreatePDF } from './sitemapper';
const main = async () => {
    const sitemapURL = 'https://example.com/sitemap.xml';
    await crawlAndCreatePDF(sitemapURL);
};

main().catch(console.error);
