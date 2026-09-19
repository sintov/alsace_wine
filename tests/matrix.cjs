const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
 const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const st=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('alsace-atlas-v3')));
 const cell=(g,geo,area='all')=>page.locator(`.mx-cell[data-g="${g}"][data-geo="${geo}"][data-area="${area}"]`);
 const label=async(g,geo,area)=>await cell(g,geo,area).getAttribute('aria-label');
 const combos=async()=>{const t=await page.locator('.count-line').textContent();return {single:+t.match(/^(\d+) distinct/)[1],blend:(t.match(/· (\d+) blend combination/)||[0,0])[1]*1}};
 const closed=()=>page.waitForFunction(()=>!document.querySelector('#editor').open);
 const gotoMatrix=async()=>{await page.locator('[data-tab=matrix]').click()};
 async function addWine(o){
  await page.locator('#add-wine').click();const f=page.locator('#wine-form');
  await f.locator('[name=producer]').fill(o.producer||'Test producer');await f.locator('[name=cuvee]').fill(o.cuvee||'Cuvee');
  if(o.status)await f.locator('[name=status]').selectOption(o.status);
  if(o.grape)await f.locator('[name=grape]').selectOption(o.grape);
  for(const g of o.blend||[])await f.locator(`[name=blendGrapes][value="${g}"]`).check();
  if(o.site){await f.locator('[name=site]').selectOption(o.site);await f.locator('[name=originEvidence]').fill('Label');}
  if(o.area)await f.locator('[name=originRegion]').selectOption(o.area);
  if(o.multi)await f.locator('[name=multiOrigin]').check();
  await f.locator('button[type=submit]').click();await closed();
 }
 await page.goto('http://127.0.0.1:8765');

 // Existing v3 data migrates without loss and feeds the matrix
 const legacyState={version:3,wines:[{id:'old',producer:'Old grower',cuvee:'OldCuvee',vintage:'2020',date:'2024-01-01',status:'tasted',grape:'Riesling',site:'brand',region:'colmar',originEvidence:'Label',notes:'Keep me'}],comparisons:[],explore:[],legacy:{checked:{'r-gneiss':1},notes:{}}};
 await page.evaluate(x=>{localStorage.clear();localStorage.setItem('alsace-atlas-v3',JSON.stringify(x))},legacyState);await page.reload();
 await gotoMatrix();
 assert.ok((await label('Riesling','granite')).includes('tasted: 1 encounter'),'existing wine appears in the matching cell');
 assert.ok((await label('Riesling','marl-limestone')).includes('unknown'));
 assert.deepEqual(await combos(),{single:1,blend:0});
 const migrated=await st();assert.equal(migrated.wines[0].notes,'Keep me');assert.deepEqual(migrated.legacy.checked,{'r-gneiss':1});
 // Areas are independent
 await page.locator('#mx-area').selectOption('south');assert.ok((await label('Riesling','granite','south')).includes('unknown'),'tasting in colmar does not cover south');
 await page.locator('#mx-area').selectOption('colmar');assert.ok((await label('Riesling','granite','colmar')).includes('tasted: 1'));
 await page.locator('#mx-area').selectOption('all');

 // Wishlist never counts
 await addWine({status:'wishlist',grape:'Riesling',site:'ld-clos-windsbuhl',cuvee:'Wish'});
 const wl=await label('Riesling','limestone');assert.ok(wl.includes('not yet tasted')&&!wl.includes(': tasted'),wl);assert.deepEqual(await combos(),{single:1,blend:0});
 // Repeat tasting raises encounters, not distinct combinations
 await page.locator('[data-tab=journal]').click();await page.locator('.wine-card').filter({hasText:'OldCuvee'}).locator('[data-action=repeat-wine]').click();await page.locator('#wine-form button[type=submit]').click();await closed();
 await gotoMatrix();assert.ok((await label('Riesling','granite')).includes('tasted: 2 encounters'));assert.deepEqual(await combos(),{single:1,blend:0});
 // Blend stays separate from single-variety coverage
 await addWine({grape:'Blend / other',blend:['Riesling','Pinot Gris'],site:'ld-engelgarten',cuvee:'BlendTest'});
 assert.ok((await label('Riesling','alluvial')).includes('unknown'),'blend must not mark Riesling');assert.equal(await cell('Riesling','alluvial').locator('.mx-blend').count(),1,'blend hint shown');
 assert.ok((await label('blend','alluvial')).includes('tasted: 1'));assert.deepEqual(await combos(),{single:1,blend:1});
 // Mixed geology is one explicit setting
 await addWine({grape:'Riesling',site:'ld-heissenberg',cuvee:'HeissTest'});
 assert.ok((await label('Riesling','mixed-other')).includes('tasted: 1'));assert.ok((await label('Riesling','sandstone')).includes('unknown'),'mixed site is not pure sandstone');assert.ok((await label('Riesling','granite')).includes('tasted: 2 encounters'),'mixed site is not pure granite');
 assert.deepEqual(await combos(),{single:2,blend:1});
 // Unknown origin, multi-origin and area-only records
 await addWine({grape:'Riesling',cuvee:'NoOrigin'});assert.deepEqual(await combos(),{single:2,blend:1});assert.ok((await page.locator('#view').textContent()).includes('not placed in any cell'));
 await addWine({grape:'Riesling',site:'ld-clos-windsbuhl',multi:true,cuvee:'MultiTest'});
 const multi=(await st()).wines.find(w=>w.cuvee==='MultiTest');assert.equal(multi.site,'');assert.equal(multi.multiOrigin,'1');assert.ok((await label('Riesling','limestone')).includes('not yet tasted'),'multi-origin wine gives no limestone coverage');
 await addWine({grape:'Pinot Gris',area:'colmar',cuvee:'AreaOnly'});assert.ok((await label('Pinot Gris','')).includes('tasted: 1'),'area-only counts under unknown geology');assert.ok((await label('Pinot Gris','marl-limestone')).includes('unknown'));assert.deepEqual(await combos(),{single:2,blend:1},'no invented geology');
 await page.locator('#mx-area').selectOption('south');assert.ok((await label('Pinot Gris','','south')).includes('unknown'));await page.locator('#mx-area').selectOption('all');

 // Editing and deleting recalculate coverage
 await page.locator('[data-tab=journal]').click();await page.locator('.wine-card').filter({hasText:'HeissTest'}).locator('[data-action=edit-wine]').click();await page.locator('[name=site]').selectOption('brand');await page.locator('#wine-form button[type=submit]').click();await closed();
 await gotoMatrix();assert.ok((await label('Riesling','mixed-other')).includes('unknown'));assert.ok((await label('Riesling','granite')).includes('tasted: 3 encounters'));assert.deepEqual(await combos(),{single:1,blend:1});
 await page.locator('[data-tab=journal]').click();page.once('dialog',d=>d.accept());await page.locator('.wine-card').filter({hasText:'HeissTest'}).locator('[data-action=delete-wine]').click();
 await gotoMatrix();assert.ok((await label('Riesling','granite')).includes('tasted: 2 encounters'));
 // Sourced parcel correction
 await page.locator('[data-tab=journal]').click();await page.locator('.wine-card').filter({hasText:'OldCuvee'}).first().locator('[data-action=edit-wine]').click();await page.locator('[name=parcelGeology]').selectOption('limestone');await page.locator('#wine-form button[type=submit]').click();
 assert.equal(await page.locator('#editor').evaluate(e=>e.open),true,'parcel correction needs a source');await page.locator('[name=parcelGeologyEvidence]').fill('Producer technical sheet');await page.locator('#wine-form button[type=submit]').click();await closed();
 await gotoMatrix();assert.ok((await label('Riesling','limestone')).includes('tasted: 1'));assert.ok((await label('Riesling','granite')).includes('tasted: 1'));

 // Cell dialog, targets, not-applicable reason, recording flow (no unsupported checkmark)
 await cell('Sylvaner','limestone').click();assert.equal(await page.locator('#editor').evaluate(e=>e.open),true);assert.ok((await page.locator('#editor-body').textContent()).includes('No tasted record supports'));
 await page.locator('[data-action=mx-target]').click();assert.deepEqual((await st()).targets,['Sylvaner|limestone|any']);await page.locator('#close-dialog').click();
 assert.equal(await cell('Sylvaner','limestone').locator('.mx-flag').count(),1);assert.ok((await page.locator('#stats').textContent()).includes('0 / 1'));
 await cell('Sylvaner','limestone').click();await page.locator('[data-action=mx-record]').click();assert.equal(await page.locator('[name=grape]').inputValue(),'Sylvaner');await page.locator('#close-dialog').click();assert.ok((await label('Sylvaner','limestone')).includes('unknown'),'opening the form creates no checkmark');
 await cell('Sylvaner','limestone').click();await page.locator('[data-action=mx-record]').click();await page.locator('[name=producer]').fill('Quick producer');await page.locator('[name=site]').selectOption('ld-clos-windsbuhl');await page.locator('[name=originEvidence]').fill('Label');await page.locator('#wine-form button[type=submit]').click();await closed();
 assert.ok((await label('Sylvaner','limestone')).includes('tasted: 1'));assert.ok((await page.locator('#stats').textContent()).includes('1 / 1'));
 await cell('Auxerrois','granite').click();page.once('dialog',d=>d.accept('Not grown on this rock'));await page.locator('[data-action=mx-na]').click();assert.ok((await label('Auxerrois','granite')).includes('not applicable: Not grown on this rock'));
 await page.locator('#close-dialog').click();
 // Quick entry: essential details only, origin later
 await page.locator('#quick-wine').click();await page.locator('#wine-form [name=producer]').fill('Visit grower');await page.locator('#wine-form [name=cuvee]').fill('Quick bottle');await page.locator('#wine-form button[type=submit]').click();await closed();
 const quick=(await st()).wines.find(w=>w.cuvee==='Quick bottle');assert.equal(quick.site,'');assert.equal(quick.status,'tasted');
 // Suggestions are separate from confirmed data
 await page.locator('[data-tab=producers]').click();await page.evaluate(()=>{});
 await page.locator('#quick-wine').click();const opts=await page.locator('#wine-form [name=producerId] option').count();assert.ok(opts>700);assert.equal(await page.locator('#origin-suggest button').count(),0);await page.locator('#close-dialog').click();

 // Personal vineyard
 await page.locator('[data-tab=atlas]').click();await page.locator('[data-action=add-site]').click();await page.locator('#site-form [name=name]').fill('Testberg <b>x</b>');await page.locator('#site-form [name=village]').fill('Testheim');await page.locator('#site-form [name=region]').selectOption('colmar');await page.locator('#site-form [name=geology]').selectOption('granite');await page.locator('#site-form button[type=submit]').click();
 assert.equal(await page.locator('#editor').evaluate(e=>e.open),true,'geology needs a description or source');await page.locator('#site-form [name=soil]').fill('Granite per producer sheet');await page.locator('#site-form button[type=submit]').click();await closed();
 await page.locator('#search').fill('Testberg');assert.equal(await page.locator('.card').count(),1);assert.equal(await page.locator('.card b').count(),0);
 await page.locator('[data-action=add-site]').click();await page.locator('#site-form [name=name]').fill('testberg <B>x</b>');await page.locator('#site-form [name=village]').fill('Testheim');await page.locator('#site-form [name=region]').selectOption('colmar');await page.locator('#site-form button[type=submit]').click();assert.equal(await page.locator('#editor').evaluate(e=>e.open),true,'duplicate rejected');await page.locator('#close-dialog').click();
 const psite=(await st()).personalSites[0].id;
 await page.locator('#search').fill('');await addWine({grape:'Gewurztraminer',site:psite,cuvee:'PersonalSiteWine'});
 await page.locator('#search').fill('Testberg');await page.locator('[data-action=delete-site]').click();assert.equal((await st()).personalSites.length,1,'linked personal site is protected');
 await page.locator('#search').fill('');await gotoMatrix();assert.ok((await label('Gewurztraminer','granite')).includes('tasted: 1'));

 // Backup: version 4, round trip, and old-format backups
 await page.locator('[data-tab=backup]').click();const ev=page.waitForEvent('download');await page.locator('[data-action=export]').click();const backup=JSON.parse(fs.readFileSync(await (await ev).path(),'utf8'));
 assert.equal(backup.version,4);assert.equal(backup.personalSites.length,1);assert.deepEqual(backup.targets,['Sylvaner|limestone|any']);assert.equal(backup.excluded.length,1);
 page.once('dialog',d=>d.accept());await page.locator('#import-file').setInputFiles({name:'r.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('successfully'));assert.deepEqual(await st(),backup);
 const before=JSON.stringify(await st());
 for(const [name,mut] of [['exclusion without reason',b=>{b.excluded[0].reason=''}],['parcel correction without source',b=>{b.wines[0].parcelGeology='limestone';b.wines[0].parcelGeologyEvidence=''}],['unknown origin area',b=>{b.wines[0].originRegion='nowhere'}],['bad target',b=>{b.targets=['Nonsense|x|y']}],['multi-origin with site',b=>{b.wines[0].multiOrigin='1';b.wines[0].site='brand'}]]){
  const bad=structuredClone(backup);mut(bad);await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('rejected'));assert.equal(JSON.stringify(await st()),before,'rejected: '+name);await page.evaluate(()=>{document.querySelector('#notice').textContent=''});
 }
 page.once('dialog',d=>d.accept());await page.locator('#import-file').setInputFiles({name:'v3.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacyState))});await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('successfully'));
 const restored=await st();assert.equal(restored.version,4);assert.deepEqual(restored.targets,[]);assert.equal(restored.wines[0].id,'old');
 await gotoMatrix();assert.ok((await label('Riesling','granite')).includes('tasted: 1'));

 // Keyboard: table region is focusable, cells open with Enter, Escape closes
 await page.locator('.mx-wrap').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('mx-cell')),true,'tab reaches the first cell');
 await cell('Riesling','granite').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#editor').evaluate(e=>e.open),true);assert.ok((await page.locator('#editor-body').textContent()).includes('OldCuvee'));await page.keyboard.press('Escape');assert.equal(await page.locator('#editor').evaluate(e=>e.open),false);
 // One-grape view: areas x geology
 await page.locator('#mx-mode').selectOption('area-geo');await page.locator('#mx-grape').selectOption('Riesling');assert.ok((await label('Riesling','granite','colmar')).includes('tasted: 1'));assert.ok((await label('Riesling','granite','south')).includes('unknown'));assert.equal(await page.locator('.mx tbody tr').count(),7);
 await page.locator('#mx-mode').selectOption('grape-geo');

 // Mobile
 await page.setViewportSize({width:390,height:844});await gotoMatrix();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');assert.ok(await page.evaluate(()=>{const w=document.querySelector('.mx-wrap');return w.scrollWidth>w.clientWidth}),'matrix scrolls inside its own region');
 assert.ok((await cell('Riesling','granite').boundingBox()).height>=44,'touch target size');
 await cell('Riesling','granite').click();assert.ok(await page.locator('#editor').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'cell dialog fits');await page.locator('#close-dialog').click();
 await page.locator('#quick-wine').click();assert.ok(await page.locator('#editor').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'quick entry fits');await page.locator('#close-dialog').click();
 await page.locator('[data-tab=atlas]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: matrix cells, wishlist/blend/mixed/unknown/multi-origin rules, repeat tastings, edit/delete recalculation, parcel correction, targets, not-applicable reasons, quick entry, personal vineyards, v3/v4 backups, keyboard and mobile.');
})().catch(e=>{console.error(e);process.exit(1)});
