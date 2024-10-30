import axios from 'axios';
import xml2js from 'xml2js';
import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { marked } from 'marked';
import TurndownService from 'turndown';

interface SitemapURL {
    loc: string[];
}

interface Sitemap {
    urlset: {
        url: SitemapURL[];
    };
}

export type OutputFormat = 'pdf' | 'txt' | 'md';

const createOutputDirectory = (format: OutputFormat): string => {
    const dirMap = {
        pdf: 'pdfs',
        md: 'markdown',
        txt: 'text',
    };
    const outputDir = path.join(process.cwd(), 'output', dirMap[format]);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
};

const extractUrlsFromSitemap = async (sitemapURL: string): Promise<string[]> => {
    const response = await axios.get(sitemapURL);
    const parser = new xml2js.Parser();
    const result = (await parser.parseStringPromise(response.data)) as Sitemap;
    return result.urlset.url.map((url) => url.loc[0]);
};

const setupBrowser = async (): Promise<Browser> => {
    return await puppeteer.launch();
};

const processPageToMarkdown = async (
    url: string,
    page: Page,
    turndownService: TurndownService
): Promise<string> => {
    try {
        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000 // 30 second timeout
        });

        if (!response || !response.ok()) {
            console.warn(`Warning: Failed to load ${url} (${response?.status() || 'unknown status'})`);
            return `\n\n# ${url}\n\nFailed to load page.`;
        }

        const html = await page.content();
        return `\n\n# ${url}\n\n${turndownService.turndown(html)}`;
    } catch (error: any) {
        console.warn(`Warning: Error processing ${url}:`, error);
        return `\n\n# ${url}\n\nError loading page: ${error.message}`;
    }
};

const processPageToText = async (url: string, page: Page): Promise<string> => {
    try {
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);

        const response = await page.goto(url, {
            waitUntil: ['domcontentloaded', 'networkidle0'],
            timeout: 60000
        });

        if (!response || !response.ok()) {
            console.warn(`Warning: Failed to load ${url} (${response?.status() || 'unknown status'})`);
            return `\n\n=== ${url} ===\n\nFailed to load page.`;
        }

        const html = await page.content();
        if (!html.trim()) {
            return `\n\n=== ${url} ===\n\nEmpty page content.`;
        }

        return `\n\n=== ${url} ===\n\n${marked.parse(html)}`;
    } catch (error: any) {
        console.warn(`Warning: Error processing ${url}:`, error);
        return `\n\n=== ${url} ===\n\nError loading page: ${error.message}`;
    }
};

const processPageToPDF = async (
    url: string,
    page: Page,
    mergedPdf: PDFDocument,
    index: number,
    total: number
): Promise<void> => {
    try {
        console.log(`Processing ${index + 1}/${total}: ${url}`);
        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000 // 30 second timeout
        });

        if (!response || !response.ok()) {
            console.warn(`Warning: Failed to load ${url} (${response?.status() || 'unknown status'})`);
            return;
        }

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
        });

        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (error) {
        console.warn(`Warning: Error processing ${url}:`, error);
    }
};

const handlePDFOutput = async (
    urls: string[],
    page: Page,
    outputName: string
): Promise<void> => {
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < urls.length; i++) {
        await processPageToPDF(urls[i], page, mergedPdf, i, urls.length);
    }

    const outputDir = createOutputDirectory('pdf');
    const pdfBytes = await mergedPdf.save();
    const outputPath = path.join(outputDir, `${outputName}.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);
};

const handleTextOutput = async (
    urls: string[],
    page: Page,
    outputName: string,
    format: 'txt' | 'md'
): Promise<void> => {
    const turndownService = new TurndownService();

    const contents = [];
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`Processing ${i + 1}/${urls.length}: ${url}`);
        const content = format === 'md'
            ? await processPageToMarkdown(url, page, turndownService)
            : await processPageToText(url, page);
        contents.push(content);
    }

    const content = contents.join('');
    const outputDir = createOutputDirectory(format);
    const outputPath = path.join(outputDir, `${outputName}.${format}`);
    fs.writeFileSync(outputPath, content);
};

export const crawlAndCreateOutput = async (
    sitemapURL: string,
    outputName: string,
    format: OutputFormat = 'pdf'
): Promise<void> => {
    try {
        const urls = await extractUrlsFromSitemap(sitemapURL);
        const browser = await setupBrowser();
        const page = await browser.newPage();

        if (format === 'pdf') {
            await handlePDFOutput(urls, page, outputName);
        } else {
            await handleTextOutput(urls, page, outputName, format);
        }

        await browser.close();
        console.log(
            `${format.toUpperCase()} creation complete: ${outputName}.${format}`
        );
    } catch (error) {
        console.error('An error occurred:', error);
    }
};
