import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PREVIEW_URL = 'http://127.0.0.1:4174';
const SCREENSHOT_DIR = 'C:\\Users\\recvn\\.gemini\\antigravity\\brain\\a2436169-70bb-4a55-b1b6-42f47d466078\\scratch\\e2e-screenshots';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return;
    } catch {
      // ignore while starting
    }
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function runE2E() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4174', '--host', '127.0.0.1', '--strictPort'], {
    stdio: 'ignore',
  });

  try {
    await waitForServer(PREVIEW_URL);
    const browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--use-gl=angle', '--use-angle=swiftshader'],
    });

    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      // 1. Check all 9 public routes + /admin on Desktop (1440x900)
      const routes = ['/', '/technology', '/products', '/applications', '/performance', '/pilot', '/about', '/resources', '/contact', '/admin'];
      for (const route of routes) {
        await page.goto(`${PREVIEW_URL}${route}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await wait(250);
        await page.evaluate(() => window.scrollTo(0, 0));
        const bodyText = await page.locator('main').innerText();
        assert.ok(bodyText.trim().length > 80, `Route ${route} rendered empty content`);

        const brokenImgs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('img')).filter((img) => !img.complete || img.naturalWidth === 0).map((i) => i.src)
        );
        assert.deepEqual(brokenImgs, [], `Broken images on ${route}: ${brokenImgs.join(', ')}`);

        const overflowDesktop = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflowDesktop <= 2, `Horizontal overflow on desktop ${route}: ${overflowDesktop}px`);
      }

      // 1b. Verify Interactive 3D Hero Turbine Lab, Exploded View, Wind Speed, Gearbox & Energy Flow on '/'
      await page.goto(`${PREVIEW_URL}/`, { waitUntil: 'networkidle' });
      await page.getByText('Powering the Future at the Speed of the Wind.').waitFor();
      await page.getByText('Conceptual airflow visualization — not CFD simulation').waitFor();
      await page.getByText(/Simulation Mode — No live hardware data connected/).first().waitFor();
      await page.getByRole('button', { name: '8 m/s' }).first().click();
      await page.getByRole('button', { name: 'Explode All' }).click();
      await page.getByRole('button', { name: 'gearbox' }).click();
      await page.getByText('Step-Up Gearbox (Option A/B)').waitFor();
      await page.getByRole('button', { name: 'Blueprint' }).click();
      await page.getByRole('button', { name: 'Pause simulation' }).click();
      await page.getByRole('button', { name: 'Reset turbine simulation' }).click();
      await page.getByText('Planetary Gearbox Kinematics Lab (Willis Equation Solver)').waitFor();
      await page.getByText(/Research options remain under evaluation until validated test evidence/).waitFor();

      // Step-scroll through '/' so every ScrollReveal and lazy 3D scene triggers before full-page screenshot
      for (const frac of [0.25, 0.5, 0.75, 1.0]) {
        await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), frac);
        await wait(220);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(250);

      // Desktop Home Screenshot
      const desktopShot = path.join(SCREENSHOT_DIR, 'desktop-1440-home.png');
      await page.screenshot({ path: desktopShot, fullPage: true });
      assert.ok(fs.statSync(desktopShot).size > 10000);

      // Verify Reduced Motion & Theme Toggle
      await page.getByRole('button', { name: 'Toggle reduced motion' }).click();
      await page.getByRole('button', { name: 'Switch color theme' }).click();
      const lightShot = path.join(SCREENSHOT_DIR, 'desktop-1440-light-theme.png');
      await page.screenshot({ path: lightShot });
      assert.ok(fs.statSync(lightShot).size > 10000);
      await page.getByRole('button', { name: 'Switch color theme' }).click();
      await page.getByRole('button', { name: 'Toggle reduced motion' }).click();

      // 2. Verify Interactive Performance CSV Audit, Animated Telemetry Graph & Calculator Suite
      await page.goto(`${PREVIEW_URL}/performance`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Inspect Repo Sample CSV' }).click();
      await page.getByText(/Betz Anomalies Flagged:/).waitFor({ timeout: 5000 });
      await page.getByText('Illustrative sample dataset — not experimental results').waitFor();
      await page.locator('#ps-telemetry-svg-chart').waitFor();
      await page.getByRole('tab', { name: 'ROI & Payback' }).click();
      await page.getByText('Total Installed CapEx (Est.)').waitFor();
      await page.getByRole('tab', { name: 'Solar-Wind Hybrid' }).click();
      await page.getByText('Illustrative 24-Hour Generation Profile Estimate').waitFor();

      // 3. Verify Products Option A vs Option B filter & Resources Search
      await page.goto(`${PREVIEW_URL}/products`, { waitUntil: 'networkidle' });
      await page.getByLabel('Filter Option A vs Option B comparison criteria').fill('Starting torque');
      await page.getByText('Starting torque').waitFor();
      await page.goto(`${PREVIEW_URL}/resources`, { waitUntil: 'networkidle' });
      await page.getByLabel('Search Pawan Shakti resource library').fill('Patent');
      await page.getByRole('heading', { name: /Compact Wind Turbine with Planetary Gears/i }).waitFor();

      // 4. Verify Pilot & Contact Form validation alerts
      await page.goto(`${PREVIEW_URL}/pilot`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Submit Pilot Site Assessment' }).click();
      await page.getByRole('alert').waitFor({ timeout: 5000 });

      await page.goto(`${PREVIEW_URL}/contact`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Send Technical Inquiry' }).click();
      await page.getByRole('alert').waitFor({ timeout: 5000 });

      // 5. Verify Technology CAD Explorer (Zoom, Reset, Wireframe) & Airfoil plot
      await page.goto(`${PREVIEW_URL}/technology`, { waitUntil: 'networkidle' });
      await page.locator('svg[aria-label="Selig S1223 airfoil cross-section plot"]').waitFor();
      await page.getByLabel('Zoom in 3D CAD model').click();
      await page.getByLabel('Reset 3D CAD camera').click();
      await page.getByRole('button', { name: /Wireframe|Solid Mesh/ }).click();
      const cadShot = path.join(SCREENSHOT_DIR, 'desktop-1440-technology-cad.png');
      await page.screenshot({ path: cadShot });
      assert.ok(fs.statSync(cadShot).size > 10000);

      // 6. Verify Admin Workbench across all 4 tabs & least-privilege RBAC isolation
      await page.goto(`${PREVIEW_URL}/admin`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Inspect Offline UI & RBAC Views' }).click();
      await page.getByLabel('Inspect RBAC visibility by role').selectOption('founder_super_admin');
      await page.getByRole('tab', { name: 'Grants, Data Room & RBAC' }).click();
      await page.getByText(/Least-Privilege RBAC Policy Matrix/).waitFor();

      await page.getByLabel('Inspect RBAC visibility by role').selectOption('team_member');
      await page.getByRole('tab', { name: 'CRM & Pilot Pipeline' }).click();
      await page.getByText(/Access Restricted: Your current role does not hold/i).waitFor();
      await page.getByRole('tab', { name: /KPIs, Monthly PDF/i }).click();
      await page.getByText(/Financial Scenarios & Unit BOM Economics are hidden/i).waitFor();

      // 7. Verify Tablet (768x1024) & Mobile (375x812) responsiveness + screenshots
      for (const vp of [
        { width: 768, height: 1024, label: 'tablet-768' },
        { width: 375, height: 812, label: 'mobile-375' },
      ]) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        for (const r of ['/', '/technology', '/performance', '/pilot', '/admin']) {
          await page.goto(`${PREVIEW_URL}${r}`, { waitUntil: 'networkidle' });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          assert.ok(overflow <= 2, `Responsive overflow at ${vp.width}px on ${r}: ${overflow}px`);
        }
        await page.goto(`${PREVIEW_URL}/`, { waitUntil: 'networkidle' });
        const vpShot = path.join(SCREENSHOT_DIR, `${vp.label}-home.png`);
        await page.screenshot({ path: vpShot, fullPage: true });
        assert.ok(fs.statSync(vpShot).size > 10000);

        await page.getByRole('button', { name: 'Open navigation menu' }).click();
        await page.locator('nav[aria-label="Mobile navigation"]').waitFor();
        await page.getByRole('button', { name: 'Close navigation menu' }).click();
      }

      assert.deepEqual(pageErrors, [], `Unhandled page errors encountered: ${pageErrors.join(' | ')}`);
      assert.deepEqual(consoleErrors, [], `Console errors encountered: ${consoleErrors.join(' | ')}`);
      console.log('ALL PLAYWRIGHT E2E, RESPONSIVE, RBAC & SCREENSHOT CHECKS PASSED!');
    } finally {
      await browser.close();
    }
  } finally {
    server.kill();
  }
}

runE2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
