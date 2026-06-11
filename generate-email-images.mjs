import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const WIDTH = 580;

const heroHtml = `
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${WIDTH}px; font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <div style="background: linear-gradient(135deg, #3a0a5e 0%, #1a0630 50%, #0d1f33 100%); padding: 48px 40px 44px; text-align: center;">
    <img src="https://score-prediction.com/wc2026-logo.svg" width="100" style="margin-bottom: 24px;" />
    <h1 style="font-size: 32px; font-weight: 800; color: #ffffff; line-height: 38px; letter-spacing: -0.5px; margin-bottom: 12px;">
      The World Cup Starts&nbsp;Today!
    </h1>
    <p style="font-size: 16px; color: #c4b5d9; line-height: 25px;">
      We noticed you haven't joined the competition yet.<br/>
      It's not too late — kick off your predictions now.
    </p>
  </div>
</body>
</html>`;

const ctaHtml = `
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${WIDTH}px; font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <div style="background: linear-gradient(180deg, #1a0630 0%, #3a0a5e 100%); padding: 40px 40px 20px; text-align: center;">
    <p style="font-size: 17px; font-weight: 600; color: #ffffff; line-height: 26px;">
      The tournament kicks off today, June 11th.<br/>
      Get your first predictions in before the opening match!
    </p>
  </div>
</body>
</html>`;

const cardHtml = (bg, points, label, desc, labelColor, descColor) => `
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 260px; font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <div style="background-color: ${bg}; border-radius: 10px; padding: 14px;">
    <div style="font-size: 26px; font-weight: 800; color: #ffffff;">${points}</div>
    <div style="font-size: 13px; font-weight: 600; color: ${labelColor}; margin-top: 3px;">${label}</div>
    <div style="font-size: 11px; color: ${descColor}; margin-top: 3px; line-height: 15px;">${desc}</div>
  </div>
</body>
</html>`;

const logoHtml = `
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 280px; font-family: 'Inter', sans-serif; background: #ffffff; }
  </style>
</head>
<body>
  <div style="display: inline-flex; align-items: center; padding: 12px 16px; background: #ffffff; border-radius: 12px;">
    <div style="width: 44px; height: 44px; border-radius: 11px; background: linear-gradient(135deg, #1e3a5f, #0d1f33); display: flex; align-items: center; justify-content: center; margin-right: 14px;">
      <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -1px;">SP</span>
    </div>
    <span style="font-size: 19px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.3px;">Score Prediction</span>
  </div>
</body>
</html>`;

const cards = [
	{ bg: '#065f46', points: '+3', label: 'Exact Score', desc: 'Right outcome & exact goals for both teams', labelColor: '#6ee7b7', descColor: '#a7f3d0', file: 'card-exact.png' },
	{ bg: '#854d0e', points: '+2', label: 'Correct Result', desc: 'Right outcome, wrong number of goals', labelColor: '#fde68a', descColor: '#fef3c7', file: 'card-result.png' },
	{ bg: '#9d174d', points: '+1', label: 'One Score Right', desc: "Guessed one team's goals correctly", labelColor: '#f9a8d4', descColor: '#fbcfe8', file: 'card-onescore.png' },
	{ bg: '#155e75', points: '+2', label: 'Upset Bonus', desc: 'Correctly predict an underdog victory', labelColor: '#67e8f9', descColor: '#a5f3fc', file: 'card-upset.png' },
	{ bg: '#4338ca', points: '2x', label: 'Confidence Boost', desc: 'Double your points on select predictions', labelColor: '#a5b4fc', descColor: '#c7d2fe', file: 'card-boost.png' },
	{ bg: '#6b21a8', points: '+1', label: 'Group Position', desc: 'Per correct team placement in group standings', labelColor: '#d8b4fe', descColor: '#e9d5ff', file: 'card-groups.png' },
];

async function renderToImage(browser, html, width, outputPath) {
	const page = await browser.newPage();
	await page.setViewport({ width, height: 1, deviceScaleFactor: 2 });
	await page.setContent(html, { waitUntil: 'networkidle0' });
	const body = await page.$('body > div');
	const screenshot = await body.screenshot({ type: 'png', omitBackground: true });
	writeFileSync(outputPath, screenshot);
	await page.close();
	console.log(`  ✓ ${outputPath}`);
}

const outDir = '/Users/pedroalvito/Repos/other/score-prediction/frontend/public/email';

const browser = await puppeteer.launch({
	executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});

console.log('Generating email images...');

await renderToImage(browser, logoHtml, 280, `${outDir}/logo.png`);
await renderToImage(browser, heroHtml, WIDTH, `${outDir}/hero.png`);
await renderToImage(browser, ctaHtml, WIDTH, `${outDir}/cta.png`);

for (const c of cards) {
	await renderToImage(browser, cardHtml(c.bg, c.points, c.label, c.desc, c.labelColor, c.descColor), 260, `${outDir}/${c.file}`);
}

await browser.close();
console.log('Done!');
