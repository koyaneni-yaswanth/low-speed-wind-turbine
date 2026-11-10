import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PREVIEW_URL = 'http://127.0.0.1:4174';

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
      page.on('pageerror', (err) => pageErrors.push(err.message));

      // 1. Check all 9 public routes + /admin on Desktop (1440x900)
      const routes = ['/', '/technology', '/products', '/applications', '/performance', '/pilot', '/about', '/resources', '/contact', '/admin'];
      for (const route of routes) {
        await page.goto(`${PREVIEW_URL}${route}`, { waitUntil: 'networkidle' });
        const bodyText = await page.locator('main').innerText();
        assert.ok(bodyText.trim().length > 80, `Route ${route} rendered empty content`);

        // Assert zero broken images
        const brokenImgs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('img')).filter((img) => !img.complete || img.naturalWidth === 0).map((i) => i.src)
        );
        assert.deepEqual(brokenImgs, [], `Broken images on ${route}: ${brokenImgs.join(', ')}`);

        // Assert desktop horizontal overflow == 0
        const overflowDesktop = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflowDesktop <= 2, `Horizontal overflow on desktop ${route}: ${overflowDesktop}px`);
      }

      // 2. Verify Interactive Performance CSV Audit & Calculator Suite
      await page.goto(`${PREVIEW_URL}/performance`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Inspect Repo Sample CSV' }).click();
      await page.getByText(/Betz Anomalies Flagged:/).waitFor({ timeout: 5000 });
      await page.getByRole('tab', { name: 'ROI & Payback' }).click();
      await page.getByText('Total Installed CapEx (Est.)').waitFor();
      await page.getByRole('tab', { name: 'Solar-Wind Hybrid' }).click();
      await page.getByText('Illustrative 24-Hour Generation Profile Estimate').waitFor();

      // 3. Verify Pilot Form validation & honest unconfigured handling
      await page.goto(`${PREVIEW_URL}/pilot`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Submit Pilot Site Assessment' }).click();
      await page.getByRole('alert').waitFor({ timeout: 5000 });

      // 4. Verify Technology CAD Explorer & Airfoil plot
      await page.goto(`${PREVIEW_URL}/technology`, { waitUntil: 'networkidle' });
      await page.locator('svg[aria-label="Selig S1223 airfoil cross-section plot"]').waitFor();
      await page.getByRole('button', { name: /Wireframe|Solid Mesh/ }).click();

      // 5. Verify Admin RBAC least-privilege UI isolation
      await page.goto(`${PREVIEW_URL}/admin`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Inspect Offline UI & RBAC Views' }).click();
      await page.getByLabel('Inspect RBAC visibility by role').selectOption('team_member');
      await page.getByRole('tab', { name: 'CRM & Pilot Pipeline' }).click();
      await page.getByText(/Access Restricted: Your current role does not hold/i).waitFor();
      await page.getByRole('tab', { name: /KPIs, Monthly PDF/i }).click();
      await page.getByText(/Financial Scenarios & Unit BOM Economics are hidden/i).waitFor();

      // 6. Verify Mobile Viewport (375x812) & Tablet (768x1024) responsiveness across key pages
      for (const vp of [
        { width: 375, height: 812 },
        { width: 768, height: 1024 },
      ]) {
        await page.setViewportSize(vp);
        for (const r of ['/', '/technology', '/performance', '/pilot', '/admin']) {
          await page.goto(`${PREVIEW_URL}${r}`, { waitUntil: 'networkidle' });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          assert.ok(overflow <= 2, `Responsive overflow at ${vp.width}px on ${r}: ${overflow}px`);
        }
        // Test mobile hamburger drawer opens cleanly
        await page.getByRole('button', { name: 'Open navigation menu' }).click();
        await page.locator('nav[aria-label="Mobile navigation"]').waitFor();
        await page.getByRole('button', { name: 'Close navigation menu' }).click();
      }

      assert.deepEqual(pageErrors, [], `Unhandled page errors encountered: ${pageErrors.join(' | ')}`);
      console.log('ALL PLAYWRIGHT E2E, RESPONSIVE & RBAC VERIFICATION CHECKS PASSED!');
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
