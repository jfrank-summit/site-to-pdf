import axios from 'axios';
import xml2js from 'xml2js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

interface SitemapURL {
    loc: string[];
}

interface Sitemap {
    urlset: {
        url: SitemapURL[];
    };
}

export async function crawlAndCreatePDF(
    sitemapURL: string,
    pdfName: string
): Promise<void> {
    try {
        // Fetch the sitemap
        const response = await axios.get(sitemapURL);
        const parser = new xml2js.Parser();
        const result = (await parser.parseStringPromise(
            response.data
        )) as Sitemap;

        // Extract URLs from the sitemap
        const urls: string[] = result.urlset.url.map((url) => url.loc[0]);

        // Launch a headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Create a new PDF document
        const mergedPdf = await PDFDocument.create();

        // Create a PDF for each URL
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`Processing ${i + 1}/${urls.length}: ${url}`);

            await page.goto(url, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
            });

            // Load the PDF buffer into a PDFDocument
            const pdfDoc = await PDFDocument.load(pdfBuffer);

            // Copy all pages from the current PDF to the merged PDF
            const copiedPages = await mergedPdf.copyPages(
                pdfDoc,
                pdfDoc.getPageIndices()
            );
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        await browser.close();

        // Create the pdfs directory if it doesn't exist
        const pdfDir = path.join(process.cwd(), 'pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir);
        }

        // Save the merged PDF in the pdfs directory
        const pdfBytes = await mergedPdf.save();
        const pdfPath = path.join(pdfDir, `${pdfName}.pdf`);
        fs.writeFileSync(pdfPath, pdfBytes);

        console.log(`PDF creation complete: ${pdfPath}`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}
