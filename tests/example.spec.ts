import { test, expect } from '@playwright/test';




 const BASE = 'https://playwright.dev';
 
 // This test performs a small visual sweep of the Playwright site.
 // It visits the homepage, discovers a set of internal links and
 // captures full-page screenshots for each visited page.
 test('visual sweep - capture screenshots for main site pages', async ({ page }) => {
	 // Go to home page and wait for meaningful content
	 await page.goto(BASE);
	 await page.waitForLoadState('networkidle');
	 // Wait for either footer or main content to be available
	 await Promise.race([
		 page.locator('footer').waitFor({ timeout: 5000 }),
		 page.locator('main').waitFor({ timeout: 5000 }),
	 ]).catch(() => {});
 
	 // Collect internal links from the page (hrefs that start with '/') and dedupe
	 const hrefs: string[] = await page.evaluate(() => {
		 const anchors = Array.from(document.querySelectorAll('a[href^="/"]')) as HTMLAnchorElement[];
		 const urls = anchors
			 .map(a => a.getAttribute('href') || '')
			 .filter(Boolean)
			 .map(h => h.split('#')[0].split('?')[0]);
		 return Array.from(new Set(urls));
	 });
 
	 // Keep a short, deterministic subset so the run is fast and stable
	 const shortlist = hrefs
		 .filter(h => !h.startsWith('/#'))
		 .filter(h => !h.startsWith('/cdn-cgi'))
		 .slice(0, 6);
 
	 // Always include the homepage as first entry
	 const pagesToCapture = ['/', ...shortlist.filter(h => h !== '/')];
 
	 for (const href of pagesToCapture) {
		 const url = new URL(href, BASE).toString();
		 await test.step(`capture ${url}`, async () => {
			 await page.goto(url);
			 // Prefer waiting for main/footer/header to ensure meaningful content
			 await page.waitForLoadState('networkidle');
			 await Promise.race([
				 page.locator('main').waitFor({ timeout: 5000 }),
				 page.locator('footer').waitFor({ timeout: 5000 }),
				 page.locator('header').waitFor({ timeout: 5000 }),
			 ]).catch(() => {});
 
			 // Build a filesystem-friendly snapshot name from the path
			 const raw = new URL(url).pathname;
			 const name = raw.replace(/\//g, '-').replace(/^-+|-+$/g, '') || 'homepage';
 
			 // Capture and compare the screenshot (full page)
			 await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
		 });
	 }
 });
