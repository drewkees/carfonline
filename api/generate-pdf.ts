// api/generate-pdf.ts

// Place this file at your project root: /api/generate-pdf.ts
// Vercel auto-deploys it as a serverless function.
//
// Install deps:
//   npm install puppeteer @sparticuz/chromium puppeteer-core
//   npm install -D @vercel/node

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { html, title } = req.body as { html?: string; title?: string };

  if (!html) {
    return res.status(400).json({ message: 'Missing html in request body' });
  }

  const isVercel = !!process.env.VERCEL;
  let browser = null;

  try {
    if (isVercel) {
      // ── Production: use sparticuz/chromium (fits Vercel's size limits) ──
      const puppeteer = await import('puppeteer-core');
      const chromium  = await import('@sparticuz/chromium');

      browser = await puppeteer.default.launch({
        args:            chromium.default.args,
        executablePath:  await chromium.default.executablePath(),
        defaultViewport: { width: 1280, height: 900 },
        headless:        true,
      });
    } else {
      // ── Local dev: use full puppeteer (bundles its own Chromium) ────────
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title ?? 'CustomerForm'}</title>
          <style>
            @page {
              size: 8.5in 13in;
              margin: 0.3in;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 9.5pt;
              color: #000;
              line-height: 1.15;
            }
            .print-container {
              font-size: 9.5pt;
              font-family: Arial, sans-serif;
              color: #000;
              line-height: 1.15;
            }
            .underline-input {
              border: none;
              border-bottom: 1px solid #000;
              padding: 1px 5px;
              background: #D9EBD3 !important;
              outline: none;
              width: 100%;
              font-size: inherit;
              font-family: inherit;
            }
            .text-sm { font-size: 0.85em; }
            .text-lg { font-size: 1.1em;  }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${html}
          </div>
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width:           '8.5in',
      height:          '13in',
      printBackground: true,
      margin: {
        top:    '0.3in',
        bottom: '0.3in',
        left:   '0.3in',
        right:  '0.3in',
      },
    });

    const safeTitle = (title ?? 'CustomerForm').replace(/[^a-z0-9_\-]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('[generate-pdf] Error:', error);
    return res.status(500).json({ message: 'PDF generation failed', error: String(error) });

  } finally {
    if (browser) await (browser as any).close();
  }
}