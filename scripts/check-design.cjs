// Browser checks for the tester's typography, alignment and responsive grid contract.
const fs = require('node:fs'), http = require('node:http'), assert = require('node:assert/strict');
let chromium;
try { ({chromium} = require('playwright')); }
catch { ({chromium} = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
(async () => {
  const html = fs.readFileSync(require('node:path').join(__dirname, '../prototype/index.html'));
  const server = http.createServer((_, res) => { res.setHeader('content-type','text/html'); res.end(html); });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
    const page = await browser.newPage();
    const external = [];
    page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url()); });
    for (const width of [2560,1920,1854,1440,1200,1199,1024,768,375,320]) {
      await page.setViewportSize({width,height:1000});
      await page.goto(`http://127.0.0.1:${server.address().port}/#home`);
      await page.reload();
      await page.evaluate(async () => {
        await Promise.all([400,500,600,700].map(weight => document.fonts.load(`${weight} 16px Raleway`)));
        for (const [i,name] of ['Gemeindebüro','Veranstaltungen & Räume','Medien & Kommunikation','Gemeindeleitung','Kinder & Jugend','Weitere Themen'].entries()) {
          areas.push({...structuredClone(areas[0]),id:`layout-${i}`,name,description:'Informationen und Unterstützung für die Mitarbeit in der Gemeinde.'});
        }
        renderHome();
      });
      const report = await page.evaluate(() => {
        const box = selector => document.querySelector(selector).getBoundingClientRect();
        const header = document.querySelector('.header-inner');
        const right = box('.header-inner').right - parseFloat(getComputedStyle(header).paddingRight);
        const titles = [...document.querySelectorAll('.area-card h3')];
        const splitWords = titles.flatMap(title => {
          const node = title.firstChild, text = node.textContent, failures = [];
          for (const match of text.matchAll(/\S+/g)) {
            const range = document.createRange(); range.setStart(node,match.index); range.setEnd(node,match.index+match[0].length);
            if (range.getClientRects().length !== 1 || range.getBoundingClientRect().right > title.getBoundingClientRect().right + 1) failures.push(match[0]);
          }
          return failures;
        });
        return {
          left:box('header .brand-logo').left, footerLeft:box('footer .brand-logo').left,
          copyLeft:box('.home-search-copy').left, right, cardsRight:box('.areas').right,
          logo:box('header .brand-logo').height, footerLogo:box('footer .brand-logo').height,
          brandFamily:getComputedStyle(document.querySelector('.brand-title')).fontFamily,
          bodyFamily:getComputedStyle(document.body).fontFamily,
          columns:getComputedStyle(document.querySelector('.areas')).gridTemplateColumns.split(' ').length,
          heights:[...document.querySelectorAll('.area-card')].map(card=>card.getBoundingClientRect().height),
          titleLines:box('#home-title').height / parseFloat(getComputedStyle(document.querySelector('#home-title')).lineHeight),
          backdrop:parseFloat(getComputedStyle(document.querySelector('.home-layout'),'::before').width),
          panel:box('.home-search-panel').width,
          panelLeft:box('.home-search-panel').left,
          artLeft:box('.home-service-art').left,
          artRight:box('.home-service-art').right,
          badTracking:[...document.querySelectorAll('h1,h2,h3,p,label,button,input,a')].filter(e=>parseFloat(getComputedStyle(e).letterSpacing)<0 && !e.classList.contains('brand-title')).length,
          overflow:document.documentElement.scrollWidth > innerWidth,
          splitWords,
          fonts:[...document.fonts].filter(face=>face.family==='Raleway').every(face=>face.status==='loaded')
        };
      });
      assert.equal(report.columns,width>=1200?3:width>=768?2:1,`${width}: Spalten`);
      for (const value of [report.copyLeft,report.footerLeft]) assert(Math.abs(value-report.left)<1,`${width}: gemeinsame linke Linie`);
      assert(Math.abs(report.left-(width<768?24:48))<1,`${width}: kein zusätzlicher zentrierter Außenrand`);
      assert(Math.abs(report.cardsRight-report.right)<1,`${width}: gemeinsame rechte Linie`);
      assert.equal(report.footerLogo,20);
      if(width>=375) assert(Math.abs(report.logo-35)<.1);
      assert(report.brandFamily.includes('system-ui') && !report.brandFamily.includes('Raleway'));
      assert(report.bodyFamily.includes('Raleway') && report.fonts);
      assert.equal(report.badTracking,0);
      assert.equal(report.overflow,false,`${width}: Überlauf`);
      assert.deepEqual(report.splitWords,[],`${width}: abgeschnittene/geteilte Wörter`);
      assert(Math.max(...report.heights)-Math.min(...report.heights)<1,`${width}: gleiche Kartenhöhen`);
      if(width>=1200) {
        assert(Math.abs(report.titleLines-2)<.1,`${width}: zweizeilige Einstiegsfrage`);
        assert(Math.abs(report.backdrop-report.panel)<1,`${width}: Hintergrund endet an Spaltengrenze`);
        assert(Math.abs(report.artLeft-report.panelLeft)<1 && Math.abs(report.artRight-report.panelLeft-report.panel)<1,
          `${width}: Suchbild füllt die Spalte ohne seitliche blaue Streifen`);
      }
      await page.screenshot({path:`/tmp/serviceportal-finetuning-${width}.png`,fullPage:true});
      await page.goto(`http://127.0.0.1:${server.address().port}/#area/it`);
      const alignment = await page.evaluate(() => ({
        logo:document.querySelector('header .brand-logo').getBoundingClientRect().left,
        content:document.querySelector('.breadcrumb').getBoundingClientRect().left,
        right:document.querySelector('.breadcrumb').getBoundingClientRect().right,
        headerRight:document.querySelector('.header-inner').getBoundingClientRect().right-parseFloat(getComputedStyle(document.querySelector('.header-inner')).paddingRight)
      }));
      assert(Math.abs(alignment.logo-alignment.content)<1 && Math.abs(alignment.right-alignment.headerRight)<1,`${width}: Bereichsausrichtung`);
      console.log(`OK: ${width}px – lokale Raleway, unveränderte Marken-Schrift, Logo, Ausrichtung, Raster, Kartenhöhen, Wörter und Überlauf.`);
    }
    assert.deepEqual(external,[], 'Keine externen Schrift- oder Assetanfragen');
  } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
