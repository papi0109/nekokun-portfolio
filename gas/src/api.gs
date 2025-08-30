/**
 * Spreadsheet-backed Web App for portfolio data.
 * - doGet: returns JSON assembled from sheets
 * - doPost: accepts { password, data } to overwrite sheets
 */
function doGet(e) {
  ensureSpreadsheet_();
  // Admin UI: serve HTML when `?admin=1`
  if (e && e.parameter && e.parameter.admin === '1') {
    const tpl = HtmlService.createTemplateFromFile('Admin');
    return tpl.evaluate()
      .setTitle('Admin Console')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  // API JSON
  const data = readAll_();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  ensureSpreadsheet_();
  const pw = getAdminPassword_();
  let body = null;
  try {
    body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;
  } catch(_) {}
  const passParam = (body && (body.password || (body.data && body.data.password))) || (e && e.parameter && e.parameter.password);
  if (!pw || passParam !== pw){
    return ContentService.createTextOutput(JSON.stringify({ error:'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = (body && (body.data || body)) || {};
  saveAll_(data);
  const out = readAll_();
  return ContentService.createTextOutput(JSON.stringify({ ok:true, data: out }))
    .setMimeType(ContentService.MimeType.JSON);
}

const SHEETS = {
  ABOUT: { name:'about', headers:['text'] },
  LINKS: { name:'links', headers:['title','href'] },
  SK_LANG: { name:'skills_languages', headers:['value'] },
  SK_FW: { name:'skills_frameworks', headers:['value'] },
  SK_TOOLS: { name:'skills_tools', headers:['value'] },
  SK_CLOUDS: { name:'skills_clouds', headers:['value'] },
  CAREERS: { name:'careers', headers:['period','title','industry','description','languages','tools'] },
  HOBBIES: { name:'hobbies', headers:['title','code','desc','image'] },
  WORKS: { name:'works', headers:['title','desc','href','image'] }
};

function ensureSpreadsheet_(){
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  let ss;
  if (id){ try{ ss = SpreadsheetApp.openById(id); }catch(err){} }
  if (!ss){
    ss = SpreadsheetApp.create('Nekokun Portfolio Data');
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  Object.keys(SHEETS).forEach(function(key){
    const meta = SHEETS[key];
    const sh = ss.getSheetByName(meta.name) || ss.insertSheet(meta.name);
    const range = sh.getRange(1,1,1,meta.headers.length);
    const values = range.getValues()[0];
    const needHeader = values.filter(String).length === 0;
    if (needHeader){ range.setValues([meta.headers]); }
  });
}

function getSheet_(name){
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = SpreadsheetApp.openById(id);
  return ss.getSheetByName(name);
}

function readTable_(name, headers){
  const sh = getSheet_(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rng = sh.getRange(2,1,last-1, headers.length);
  const rows = rng.getValues();
  return rows.map(function(r){
    const obj = {};
    headers.forEach(function(h, i){ obj[h] = (r[i] !== null && r[i] !== undefined) ? String(r[i]) : ''; });
    return obj;
  }).filter(function(o){ return headers.some(function(h){ return (o[h]||'').trim() !== ''; }); });
}

function writeTable_(name, headers, rows){
  const sh = getSheet_(name);
  sh.clearContents();
  if (!rows || rows.length === 0){
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    return;
  }
  const values = rows.map(function(o){ return headers.map(function(h){ return o[h] || ''; }); });
  sh.getRange(1,1,values.length+1, headers.length).setValues([headers].concat(values));
}

function readAll_(){
  const out = {};
  out.profile = { name:'', title:'', summary:'', contacts:{} }; // reserved
  out.about = { text: '' };
  const aboutRows = readTable_(SHEETS.ABOUT.name, SHEETS.ABOUT.headers);
  if (aboutRows[0]) out.about.text = aboutRows[0].text || '';
  out.links = readTable_(SHEETS.LINKS.name, SHEETS.LINKS.headers).map(function(r){ return { title:r.title, href:r.href }; });
  out.skills = {
    languages: readTable_(SHEETS.SK_LANG.name, SHEETS.SK_LANG.headers).map(function(r){ return r.value; }),
    frameworks: readTable_(SHEETS.SK_FW.name, SHEETS.SK_FW.headers).map(function(r){ return r.value; }),
    tools: readTable_(SHEETS.SK_TOOLS.name, SHEETS.SK_TOOLS.headers).map(function(r){ return r.value; }),
    clouds: readTable_(SHEETS.SK_CLOUDS.name, SHEETS.SK_CLOUDS.headers).map(function(r){ return r.value; })
  };
  out.careers = readTable_(SHEETS.CAREERS.name, SHEETS.CAREERS.headers).map(function(r){
    return {
      period: r.period,
      title: r.title,
      industry: r.industry,
      description: (r.description||'').split(';').filter(String),
      languages: (r.languages||'').split(';').filter(String),
      tools: (r.tools||'').split(';').filter(String)
    };
  });
  out.hobbies = readTable_(SHEETS.HOBBIES.name, SHEETS.HOBBIES.headers).map(function(r){ return { title:r.title, code:r.code, desc:r.desc, image:r.image }; });
  out.works = readTable_(SHEETS.WORKS.name, SHEETS.WORKS.headers).map(function(r){ return { title:r.title, desc:r.desc, href:r.href, image:r.image }; });
  return out;
}

function saveAll_(data){
  data = data || {};
  writeTable_(SHEETS.ABOUT.name, SHEETS.ABOUT.headers, [{ text: (data.about && data.about.text) || '' }]);
  writeTable_(SHEETS.LINKS.name, SHEETS.LINKS.headers, (data.links||[]).map(function(x){ return {title:x.title||'', href:x.href||''}; }));
  const sk = data.skills || {};
  writeTable_(SHEETS.SK_LANG.name, SHEETS.SK_LANG.headers, (sk.languages||[]).map(function(v){ return { value:v }; }));
  writeTable_(SHEETS.SK_FW.name, SHEETS.SK_FW.headers, (sk.frameworks||[]).map(function(v){ return { value:v }; }));
  writeTable_(SHEETS.SK_TOOLS.name, SHEETS.SK_TOOLS.headers, (sk.tools||[]).map(function(v){ return { value:v }; }));
  writeTable_(SHEETS.SK_CLOUDS.name, SHEETS.SK_CLOUDS.headers, (sk.clouds||[]).map(function(v){ return { value:v }; }));
  writeTable_(SHEETS.CAREERS.name, SHEETS.CAREERS.headers, (data.careers||[]).map(function(c){
    return {
      period:c.period||'', title:c.title||'', industry:c.industry||'',
      description:(c.description||[]).join(';'), languages:(c.languages||[]).join(';'), tools:(c.tools||[]).join(';')
    };
  }));
  writeTable_(SHEETS.HOBBIES.name, SHEETS.HOBBIES.headers, (data.hobbies||[]).map(function(h){ return { title:h.title||'', code:h.code||'', desc:h.desc||'', image:h.image||'' }; }));
  writeTable_(SHEETS.WORKS.name, SHEETS.WORKS.headers, (data.works||[]).map(function(w){ return { title:w.title||'', desc:w.desc||'', href:w.href||'', image:w.image||'' }; }));
}
/**
 * Returns admin password for production (Apps Script).
 * Set this via Script Properties: ADMIN_PASSWORD.
 */
function getAdminPassword_() {
  const v = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return v || '';
}

/** HTML include helper */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Admin UI RPCs */
function uiGetData() {
  ensureSpreadsheet_();
  return readAll_();
}

function uiSaveData(payload) {
  ensureSpreadsheet_();
  const pw = getAdminPassword_();
  if (!payload || payload.password !== pw) {
    return { ok: false, error: 'Unauthorized' };
  }
  saveAll_(payload.data || {});
  return { ok: true, data: readAll_() };
}

/**
 * Pseudo login for Admin UI.
 * Verifies password and returns ok; no server-side session is created.
 */
function uiLogin(payload) {
  const pw = getAdminPassword_();
  if (payload && payload.password && pw && payload.password === pw) {
    return { ok: true };
  }
  return { ok: false, error: 'Unauthorized' };
}
