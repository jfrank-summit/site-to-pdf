import { crawlAndCreateOutput, OutputFormat } from './sitemapper';

const main = async () => {
    const [sitemapURL, outputName, format = 'pdf'] = process.argv.slice(2);

    if (!sitemapURL || !outputName) {
        console.error('Usage: yarn start <sitemap_url> <output_name> [format]');
        console.error('Available formats: pdf, txt, md (default: pdf)');
        process.exit(1);
    }

    if (!['pdf', 'txt', 'md'].includes(format)) {
        console.error('Invalid format. Available formats: pdf, txt, md');
        process.exit(1);
    }

    await crawlAndCreateOutput(sitemapURL, outputName, format as OutputFormat);
};

main().catch(console.error);
