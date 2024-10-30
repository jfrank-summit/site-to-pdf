# Sitemap to PDF Crawler

This application crawls a sitemap and generates a PDF containing all the pages listed in the sitemap.

## Prerequisites

-   Node.js (version 14 or higher recommended)
-   Yarn package manager
-   Required system libraries (for Linux users):

    ```bash
    sudo apt-get update && sudo apt-get install -y \
        libasound2 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libgbm1 \
        libnss3 \
        libpango-1.0-0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libxshmfence1
    ```

## Installation

1. Clone this repository:

    ```
    git clone https://github.com/jfrank-summit/sitemap-to-pdf-crawler.git
    cd sitemap-to-pdf-crawler
    ```

2. Install dependencies:
    ```
    yarn install
    ```

## Usage

Run the application using the following command:

```
yarn start <sitemap_url> <pdf_name>
```

Replace `<sitemap_url>` with the URL of the sitemap you want to crawl and `<pdf_name>` with the desired name for the generated PDF file.

## Example

```
yarn start https://example.com/sitemap.xml example-pdf
```

This will create a PDF file named `example-pdf.pdf` in the `pdfs` directory containing all the pages listed in the sitemap at `https://example.com/sitemap.xml`.

## Output

The generated PDF will be saved in the `pdfs` folder in the project root directory. If the folder doesn't exist, it will be created automatically.

## Notes

-   The application uses Puppeteer to render web pages, which requires a compatible version of Chromium to be installed. The installation process should handle this automatically.
-   Large sitemaps with many pages may take a considerable amount of time to process and may generate large PDF files.
-   Ensure you have permission to crawl the website before using this tool.

## License

[MIT License](LICENSE)
