import { crawlAndCreatePDF } from './sitemapper';

const main = async () => {
    const [sitemapURL, pdfName] = process.argv.slice(2);

    if (!sitemapURL || !pdfName) {
        console.error('Usage: yarn start <sitemap_url> <pdf_name>');
        process.exit(1);
    }

    await crawlAndCreatePDF(sitemapURL, pdfName);
};

main().catch(console.error);
