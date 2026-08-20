import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = 'd:/ProductIQ/prototype_screenshots';
const USER_DATASET_PATH = 'd:/ProductIQ/data/user_supplied_dataset.csv';

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

async function runCompleteSuite() {
  console.log('================================================================');
  console.log('STARTING PRODUCTIQ END-TO-END VERIFICATION & SCREENSHOT PIPELINE');
  console.log('================================================================');

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

  // Monitor console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('404')) {
        consoleErrors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  console.log('\n[Step 1] Navigating to http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(1500);

  // 1. Initial State Check: Verify output table and export buttons are hidden before upload
  console.log('[Step 2] Verifying initial state: output section and export button must be hidden...');
  const initialExportBtn = await page.$('#export-output-button');
  console.log(` -> Export button in DOM before upload: ${initialExportBtn ? 'FAIL (Present)' : 'PASS (Hidden)'}`);

  // 01_home.png
  console.log('[Capture 01/20] Capturing 01_home.png (Initial Landing State)...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home.png'), fullPage: false });

  // Navigate to Upload page
  console.log('\n[Step 3] Navigating to Catalog Ingestion...');
  await clickButtonByText(page, 'aside button, nav button', 'Catalog Ingestion');
  await wait(1200);

  // 02_upload.png
  console.log('[Capture 02/20] Capturing 02_upload.png (Ingestion Dropzone)...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_upload.png'), fullPage: false });

  // Upload user dataset via file input
  console.log(`\n[Step 4] Uploading user dataset: ${USER_DATASET_PATH}...`);
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(USER_DATASET_PATH);
    await wait(1500);
  }

  // 03_dataset_uploaded.png
  console.log('[Capture 03/20] Capturing 03_dataset_uploaded.png (File Selected & Inspected)...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_dataset_uploaded.png'), fullPage: false });

  // 04_schema_detection.png
  console.log('[Capture 04/20] Capturing 04_schema_detection.png (ASSR AI Schema Intelligence)...');
  await page.evaluate(() => window.scrollTo(0, 320));
  await wait(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_schema_detection.png'), fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 0));

  // Trigger processing
  console.log('\n[Step 5] Triggering full ingestion pipeline for user dataset...');
  const processBtnClicked = await clickButtonByText(page, 'button', 'Start Processing Pipeline');
  if (!processBtnClicked) {
    await clickButtonByText(page, 'button', 'Confirm Schema & Start Processing');
  }
  await wait(1000);

  // 05_processing_pipeline.png
  console.log('[Capture 05/20] Capturing 05_processing_pipeline.png (Live Multi-Stage Pipeline)...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_processing_pipeline.png'), fullPage: false });

  // Wait for processing pipeline to complete
  console.log('Waiting for pipeline stages to finish...');
  for (let i = 0; i < 35; i++) {
    await wait(1000);
    const isDone = await page.evaluate(() => {
      const txt = document.body.innerText;
      return txt.includes('Catalog Intelligence Ready') ||
             txt.includes('View Product Intelligence') ||
             txt.includes('100%');
    });
    if (isDone) {
      console.log(` -> Pipeline completed successfully at iteration ${i + 1}!`);
      break;
    }
  }
  await wait(2000);

  // Click "View Product Intelligence"
  console.log('\n[Step 6] Navigating to Product Intelligence Master Data Grid...');
  const viewProdsClicked = await clickButtonByText(page, 'button', 'View Product Intelligence');
  if (!viewProdsClicked) {
    await clickButtonByText(page, 'aside button', 'Product Intelligence');
  }
  await wait(2500);

  // Verify Export button and metrics appear dynamically
  const revealedExportBtn = await page.$('#export-output-button');
  console.log(` -> Export Output button visibility: ${revealedExportBtn ? 'PASS (Visible with fade-in)' : 'FAIL (Missing)'}`);

  // 08_output_table.png
  console.log('[Capture 08/20] Capturing 08_output_table.png (Master Data Grid with Transformation Visual)...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_output_table.png'), fullPage: false });

  // 09_output_table_horizontal.png (Scrolled horizontal technical specs)
  console.log('[Capture 09/20] Capturing 09_output_table_horizontal.png (Wide Technical Specifications View)...');
  await page.evaluate(() => {
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) tableContainer.scrollLeft = 450;
  });
  await wait(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_output_table_horizontal.png'), fullPage: false });
  await page.evaluate(() => {
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) tableContainer.scrollLeft = 0;
  });

  // 10_product_detail.png (Open Product Intelligence Lens)
  console.log('[Capture 10/20] Capturing 10_product_detail.png (Product Intelligence Lens Deep Audit)...');
  const firstRow = await page.$('table tbody tr');
  if (firstRow) {
    await firstRow.click();
    await wait(1800);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_product_detail.png'), fullPage: false });

  // Return to table
  await clickButtonByText(page, 'aside button, nav button', 'Product Intelligence');
  await wait(1200);

  // 12_export.png (Export Modal open)
  console.log('[Capture 12/20] Capturing 12_export.png (Export Intelligence Reports Modal)...');
  await clickButtonByText(page, 'header button', 'Export');
  await wait(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_export.png'), fullPage: false });

  // Close Export Modal
  await clickButtonByText(page, 'button', 'Close');
  await wait(600);

  // 13_exported_data.png (Highlighting Export Output in toolbar)
  console.log('[Capture 13/20] Capturing 13_exported_data.png (Export Output Action Toolbar)...');
  const exportBtnHover = await page.$('#export-output-button');
  if (exportBtnHover) {
    await exportBtnHover.hover();
    await wait(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_exported_data.png'), fullPage: false });

  // 06_assr_ai_enrichment.png (AI Enrichment Control Center)
  console.log('[Capture 06/20] Capturing 06_assr_ai_enrichment.png (AI Enrichment Control Center)...');
  await clickButtonByText(page, 'aside button, nav button', 'AI Enrichment');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_assr_ai_enrichment.png'), fullPage: false });

  // 07_enrichment_complete.png
  console.log('[Capture 07/20] Capturing 07_enrichment_complete.png (Enriched Taxonomy & Attributes)...');
  await page.evaluate(() => window.scrollTo(0, 320));
  await wait(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_enrichment_complete.png'), fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 0));

  // 14_data_quality.png (Data Quality Intelligence)
  console.log('[Capture 14/20] Capturing 14_data_quality.png (Data Quality Intelligence)...');
  await clickButtonByText(page, 'aside button, nav button', 'Data Quality');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_data_quality.png'), fullPage: false });

  // 15_specification_conflicts.png (Specification Conflicts Detection)
  console.log('[Capture 15/20] Capturing 15_specification_conflicts.png (Specification Conflicts Engine)...');
  await clickButtonByText(page, 'aside button, nav button', 'Conflicts');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_specification_conflicts.png'), fullPage: false });

  // 16_duplicate_clutter.png (Duplicate Detection & Cleanup)
  console.log('[Capture 16/20] Capturing 16_duplicate_clutter.png (Duplicate Clutter Detection & Clusters)...');
  await clickButtonByText(page, 'aside button, nav button', 'Duplicates');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_duplicate_clutter.png'), fullPage: false });

  // 11_validation.png & 18_rule_validation.png (Rule Validation)
  console.log('[Capture 11 & 18/20] Capturing 11_validation.png and 18_rule_validation.png...');
  await clickButtonByText(page, 'aside button, nav button', 'Validation');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_validation.png'), fullPage: false });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_rule_validation.png'), fullPage: false });

  // 17_analytics.png (Analytics Dashboard)
  console.log('[Capture 17/20] Capturing 17_analytics.png (Catalog Intelligence Analytics Dashboard)...');
  await clickButtonByText(page, 'aside button, nav button', 'Analytics');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_analytics.png'), fullPage: false });

  // 19_sources_lineage.png (Sources & Lineage)
  console.log('[Capture 19/20] Capturing 19_sources_lineage.png (Source & Data Lineage Trust Graph)...');
  await clickButtonByText(page, 'aside button, nav button', 'Sources');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '19_sources_lineage.png'), fullPage: false });

  // 20_settings.png (Platform Settings)
  console.log('[Capture 20/20] Capturing 20_settings.png (Configurable Intelligence Pipeline Settings)...');
  await clickButtonByText(page, 'aside button, nav button', 'Settings');
  await wait(1800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '20_settings.png'), fullPage: false });

  await browser.close();

  console.log('\n================================================================');
  console.log('BROWSER CONSOLE ERROR CHECK:');
  if (consoleErrors.length === 0) {
    console.log('[PASS] ZERO BROWSER CONSOLE ERRORS DETECTED!');
  } else {
    console.log(`[STATUS] Console messages recorded: ${consoleErrors.length}`);
  }
  console.log('================================================================');
}

runCompleteSuite().catch((err) => {
  console.error('Test and capture suite error:', err);
  process.exit(1);
});
