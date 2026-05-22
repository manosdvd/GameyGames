const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    let errs = [];
    page.on('pageerror', err => errs.push(err.toString()));
    page.on('console', msg => { if(msg.type() === 'error') errs.push(msg.text()); });
    await page.goto('http://localhost:8080/anxiety3/discalculia.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    if (errs.length) { console.log('❌ discalculia errors:', errs); } else { console.log('✅ discalculia OK'); }

    errs = [];
    await page.goto('http://localhost:8080/anxiety3/dyslexia.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    if (errs.length) { console.log('❌ dyslexia errors:', errs); } else { console.log('✅ dyslexia OK'); }

    errs = [];
    await page.goto('http://localhost:8080/hexenergy/index.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    if (errs.length) { console.log('❌ hexenergy errors:', errs); } else { console.log('✅ hexenergy OK'); }

    await browser.close();
})();
