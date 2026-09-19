// Data and coverage regression checks; no browser dependency.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['data.js','sites.js','producers.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
let app=fs.readFileSync(path.join(root,'app.js'),'utf8');
app=app.slice(0,app.indexOf("$('#search').oninput="))+`globalThis.api={empty,validate,coverageIndex,cellData,naFor,matrixCell,targetProgress,atlas,matrix,matrixAxes,referenceSites,set(s){state=validate(s);rebuildSites()},view(mode,area,evidence='documented'){mxMode=mode;mxSiteArea=area;mxArea=area;mxEvidence=evidence}};})();`;
vm.runInContext(app,ctx);const a=ctx.api,site='site:ld-patergarten';
let s=a.empty();a.set(s);
assert(a.naFor('Riesling','granite',site).automatic);
assert.equal(a.naFor('Gewurztraminer','alluvial',site),undefined,'unknown grape is never an exclusion');
assert.equal(a.naFor('Gewurztraminer','limestone','all'),undefined,'no broad grape/rock prohibition');
assert(a.matrixCell(a.coverageIndex(),'Riesling','alluvial',site).includes('documented by a source'));
assert(a.atlas().includes('Named vineyard / lieu-dit'));
for(const id of ['ld-patergarten','ld-rosenbourg','ld-letzenberg'])assert(ctx.window.ALSACE_SITES.lieux.some(x=>x.id===id));
s.targets=['Riesling|alluvial|'+site];s.wines=[{id:'one',producer:'Example',status:'tasted',grape:'Riesling',site:'ld-patergarten',originEvidence:'Label'}];a.set(s);
assert.equal(a.cellData(a.coverageIndex(),'Riesling','alluvial',site).tasted.length,1);
assert.equal(a.cellData(a.coverageIndex(),'Riesling','alluvial','site:ld-rosenbourg').tasted.length,0);
assert.equal(a.targetProgress(a.coverageIndex()),1);
assert.equal(a.validate(JSON.parse(JSON.stringify(s))).targets[0],s.targets[0]);
s.wines[0].parcelGeology='granite';s.wines[0].parcelGeologyEvidence='Parcel technical sheet';a.set(s);
assert.equal(a.naFor('Riesling','granite',site),undefined,'sourced parcel overrides broad reference');
s.wines=[];a.set(s);assert(a.naFor('Riesling','granite',site).automatic);assert.equal(a.targetProgress(a.coverageIndex()),0);
a.view('site-geo','ribeauville');const html=a.matrix();assert(html.includes('Grand Cru'));assert(!html.includes('data-area="site:ld-rosenbourg"'));assert(!html.includes('data-area="site:ld-patergarten"'));
a.view('grape-geo','all');const choices=a.matrix();assert(!choices.includes('value="site:ld-patergarten"'));assert(!choices.includes('value="site:ld-rosenbourg"'));assert(choices.includes('· Grand Cru'));
assert.throws(()=>a.validate({...s,targets:['Riesling|alluvial|site:missing']}));
console.log('PASS: site coverage, isolation, targets and backups, catalogue examples, safe exclusions, parcel overrides, filtering');

a.set(a.empty());
const D=ctx.window.ALSACE_DATA,L=ctx.window.ALSACE_SITES;
for(const site of D.crus){
 assert(site.documentedGrapes.length>0,site.id+' missing grape evidence');
 assert(site.geology||L.soilToGeology[site.soil],site.id+' missing geology');
 a.view('grape-geo','site:'+site.id);const axes=a.matrixAxes(a.coverageIndex());
 assert(axes.rows.length>0 && axes.cols.length===1,site.id+' does not reduce to its supported reference');
}
a.view('grape-geo','site:altenberg-de-bergbieten');let axes=a.matrixAxes(a.coverageIndex());
assert.deepEqual([...axes.cols],['marl-gypsum']);assert.equal(axes.rows.length,4);assert(!axes.rows.includes('Chardonnay'));
a.view('grape-geo','site:altenberg-de-bergbieten','all');axes=a.matrixAxes(a.coverageIndex());assert(axes.cols.includes('granite'));assert(axes.rows.includes('Chardonnay'));
assert(a.naFor('Riesling','granite','site:altenberg-de-bergbieten').automatic);
assert(!a.naFor('Chardonnay','marl-gypsum','site:altenberg-de-bergbieten'));
for(const region of D.regions){
 a.view('grape-geo',region.id);axes=a.matrixAxes(a.coverageIndex());assert(axes.cols.length&&axes.rows.length,region.id);
 for(const row of axes.rows)assert(axes.cols.some(col=>a.referenceSites(row,col,region.id).length),region.id+' invented cross-product row');
}
assert(a.referenceSites('Pinot Noir','granite','site:brand').length);
assert(a.referenceSites('Auxerrois','granite','site:brand').length);
assert(a.referenceSites('Sylvaner','marl-limestone','site:zotzenberg').length);
assert.equal(a.referenceSites('Auxerrois','marl-limestone','north').length,0,'do not cross-multiply regional grape and soil lists');
assert(a.matrixCell(a.coverageIndex(),'Auxerrois','marl-limestone','north').includes('>?</span>'));
s=a.empty();s.wines=[{id:'new',producer:'Source',status:'tasted',grape:'Chardonnay',site:'altenberg-de-bergbieten',originEvidence:'Label',parcelGeology:'granite',parcelGeologyEvidence:'Technical sheet'}];a.set(s);a.view('grape-geo','site:altenberg-de-bergbieten');axes=a.matrixAxes(a.coverageIndex());assert(axes.rows.includes('Chardonnay'));assert(axes.cols.includes('granite'));assert(!a.naFor('Chardonnay','granite','site:altenberg-de-bergbieten'));
assert.equal(a.validate(JSON.parse(JSON.stringify(s))).wines.length,1);
console.log('PASS: all 51 cru references, all 7 regional views, sparse axes, unknowns and record overrides');
