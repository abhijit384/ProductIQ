import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = 'd:/ProductIQ/prototype_screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Locate Chrome or Edge
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

if (!executablePath) {
  console.error('No Chrome or Edge executable found!');
  process.exit(1);
}

console.log(`Using browser at: ${executablePath}`);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function clickButtonByText(page, selector, textMatch) {
  const buttons = await page.$$(selector);
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.toLowerCase().includes(textMatch.toLowerCase())) {
      await btn.click();
      return true;
    }
  }
  return false;
}

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1.5
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1.5 });

  console.log('Navigating to http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(1500);

  // 01_home.png (Initial home / overview before dataset loaded)
  console.log('[1/20] Capturing 01_home.png...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home.png'), fullPage: false });

  // 02_upload.png (Upload catalog page)
  console.log('[2/20] Capturing 02_upload.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Catalog Ingestion');
  await wait(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_upload.png'), fullPage: false });

  // 03_dataset_uploaded.png (Clicking preset dataset A to show dataset selected)
  console.log('[3/20] Capturing 03_dataset_uploaded.png...');
  const presetCards = await page.$$('.cursor-pointer');
  if (presetCards.length > 0) {
    await presetCards[0].click();
    await wait(800);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_dataset_uploaded.png'), fullPage: false });

  // 04_schema_detection.png (Schema Intelligence section on Upload page)
  console.log('[4/20] Capturing 04_schema_detection.png...');
  await page.evaluate(() => window.scrollTo(0, 320));
  await wait(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_schema_detection.png'), fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 0));

  // Now trigger the 1,000 product Demo catalog via Topbar "Load 1,000 Demo"
  console.log('Triggering demo catalog processing...');
  await clickButtonByText(page, 'header button', '1,000 Demo');
  await wait(1000);

  // 05_processing_pipeline.png (Live Processing Pipeline screen)
  console.log('[5/20] Capturing 05_processing_pipeline.png...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_processing_pipeline.png'), fullPage: false });

  // Wait for processing pipeline to reach 100% / complete
  console.log('Waiting for pipeline completion...');
  for (let i = 0; i < 30; i++) {
    await wait(1000);
    const isComplete = await page.evaluate(() => {
      return document.body.innerText.includes('Processing Complete') ||
             document.body.innerText.includes('100%') ||
             document.body.innerText.includes('1,050 records');
    });
    if (isComplete) break;
  }
  await wait(2000);

  // 08_output_table.png (Product Intelligence Master Data Grid)
  console.log('[8/20] Capturing 08_output_table.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Product Intelligence');
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_output_table.png'), fullPage: false });

  // 09_output_table_horizontal.png (Scrolled horizontal table view)
  console.log('[9/20] Capturing 09_output_table_horizontal.png...');
  await page.evaluate(() => {
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) tableContainer.scrollLeft = 450;
  });
  await wait(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_output_table_horizontal.png'), fullPage: false });
  await page.evaluate(() => {
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) tableContainer.scrollLeft = 0;
  });

  // 10_product_detail.png (Product Intelligence Lens / Detail view)
  console.log('[10/20] Capturing 10_product_detail.png...');
  const firstRow = await page.$('table tbody tr');
  if (firstRow) {
    await firstRow.click();
    await wait(1500);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_product_detail.png'), fullPage: false });

  // Return to table
  await clickButtonByText(page, 'aside button, nav button', 'Product Intelligence');
  await wait(1200);

  // 12_export.png (Export Modal open)
  console.log('[12/20] Capturing 12_export.png...');
  await clickButtonByText(page, 'header button', 'Export');
  await wait(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_export.png'), fullPage: false });

  // Close Export Modal
  await clickButtonByText(page, 'button', 'Close');
  await wait(600);

  // 13_exported_data.png (Highlighting Export Output in table toolbar)
  console.log('[13/20] Capturing 13_exported_data.png...');
  const exportBtn = await page.$('#export-output-button');
  if (exportBtn) {
    await exportBtn.hover();
    await wait(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_exported_data.png'), fullPage: false });

  // 06_assr_ai_enrichment.png (AI Enrichment Control Center)
  console.log('[6/20] Capturing 06_assr_ai_enrichment.png...');
  await clickButtonByText(page, 'aside button, nav button', 'AI Enrichment');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_assr_ai_enrichment.png'), fullPage: false });

  // 07_enrichment_complete.png (AI Enrichment scrolled to sample records)
  console.log('[7/20] Capturing 07_enrichment_complete.png...');
  await page.evaluate(() => window.scrollTo(0, 320));
  await wait(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_enrichment_complete.png'), fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 0));

  // 14_data_quality.png (Data Quality Intelligence)
  console.log('[14/20] Capturing 14_data_quality.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Data Quality');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_data_quality.png'), fullPage: false });

  // 15_specification_conflicts.png (Specification Conflicts Detection)
  console.log('[15/20] Capturing 15_specification_conflicts.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Conflicts');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_specification_conflicts.png'), fullPage: false });

  // 16_duplicate_clutter.png (Duplicate Clutter Detection & Cleanup)
  console.log('[16/20] Capturing 16_duplicate_clutter.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Duplicates');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_duplicate_clutter.png'), fullPage: false });

  // 11_validation.png & 18_rule_validation.png (Rule Validation)
  console.log('[11 & 18/20] Capturing 11_validation.png and 18_rule_validation.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Validation');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_validation.png'), fullPage: false });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_rule_validation.png'), fullPage: false });

  // 17_analytics.png (Analytics Dashboard)
  console.log('[17/20] Capturing 17_analytics.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Analytics');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_analytics.png'), fullPage: false });

  // 19_sources_lineage.png (Sources & Lineage)
  console.log('[19/20] Capturing 19_sources_lineage.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Sources');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '19_sources_lineage.png'), fullPage: false });

  // 20_settings.png (Platform Settings)
  console.log('[20/20] Capturing 20_settings.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Settings');
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '20_settings.png'), fullPage: false });

  await browser.close();
  console.log('ALL 20 SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture error:', err);
  process.exit(1);
});
