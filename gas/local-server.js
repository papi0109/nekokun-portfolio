// Local mock of Google Apps Script endpoint for portfolio data
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8888;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-api-password';

app.use(cors({ origin: '*', methods: ['GET','POST'] }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  // Allow admin endpoints to use POST
  if (req.method !== 'GET' && !req.path.startsWith('/admin')) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  next();
});

// Default portfolio data to simulate GAS response
const defaultData = {
  profile: {
    name: 'ねこくん',
    title: '自称PM/PL・自称AIエンジニア・自称フルサイクルエンジニア',
    summary: 'パフォーマンスと開発体験を重視し、クリーンでアクセシブル、保守しやすい Web をつくります。',
    contacts: {
      email: 'your.name@example.com',
      github: 'https://github.com/your-github',
      linkedin: 'https://www.linkedin.com/in/your-linkedin'
    }
  },
  about: {
    text: 'パフォーマンスとアクセシビリティ、保守性を重視したプロダクトをつくっています。型安全なコード、クリーンアーキテクチャ、心地よい UX が好きです。'
  },
  skills: {
    languages: ['TypeScript', 'JavaScript', 'Python'],
    frameworks: ['React', 'Next.js', 'Fastify'],
    tools: ['Git', 'Docker', 'Terraform'],
    clouds: ['GCP', 'Vercel', 'Cloudflare']
  },
  careers: [
    {
      period: '2019 — 2020',
      title: 'フロントエンドエンジニア',
      industry: 'toC向けWebサービス / インターネット業界',
      description: [
        'フロント設計・実装・運用',
        'パフォーマンス/アクセシビリティ改善',
        'デザインシステム導入'
      ],
      languages: ['TypeScript', 'JavaScript'],
      tools: ['React', 'Next.js', 'Vite']
    },
    {
      period: '2020 — 2021',
      title: 'バックエンドエンジニア',
      industry: 'SaaS / B2B',
      description: [
        'BFF/API 設計・実装',
        '監視・アラート整備',
        'DB チューニング'
      ],
      languages: ['TypeScript', 'Python'],
      tools: ['Node.js', 'Fastify', 'PostgreSQL']
    },
    {
      period: '2021 — 2022',
      title: 'DevOps エンジニア',
      industry: 'クラウド / SRE',
      description: [
        'CI/CD パイプライン整備',
        'IaC による構成管理',
        'コンテナ運用'
      ],
      languages: ['Bash', 'TypeScript'],
      tools: ['Docker', 'Terraform', 'GitHub Actions']
    },
    {
      period: '2022 — 2024',
      title: 'フルスタックエンジニア',
      industry: '業務システム / 内製開発',
      description: [
        'GAS による社内自動化',
        'フロント〜APIまで一貫開発',
        '品質改善と運用効率化'
      ],
      languages: ['TypeScript', 'Python'],
      tools: ['GAS', 'Node.js', 'Docker']
    }
  ]
  ,
  links: [
    { title: 'GitHub', desc: 'コードとリポジトリはこちら', href: 'https://github.com/your-github', image: 'assets/images/nekokun.jpeg' },
    { title: 'LinkedIn', desc: '職務経歴とネットワーク', href: 'https://www.linkedin.com/in/your-linkedin', image: 'assets/images/nekokun.jpeg' },
    { title: 'Blog', desc: '技術メモや発信', href: '#', image: 'assets/images/nekokun.jpeg' },
    { title: 'X(Twitter)', desc: '日々のつぶやき', href: '#', image: 'assets/images/nekokun.jpeg' }
  ]
  ,
  hobbies: [
    { title: 'スプラトゥーン3', code: 'SW-1234-5678-9012', desc: 'ナワバリ・サーモンラン中心。気軽に誘ってください。', image: 'assets/images/nekokun.jpeg' },
    { title: '原神', code: 'UID: 800000000', desc: '探索と撮影が好き。のんびり勢です。', image: 'assets/images/nekokun.jpeg' },
    { title: 'FF14', code: 'Ridill / Nekokun', desc: '極～零式たまに行きます。ギャザクラも嗜みます。', image: 'assets/images/nekokun.jpeg' },
    { title: 'ポケモンSV', code: 'SW-2222-3333-4444', desc: 'レイド・育成・図鑑埋めなど。', image: 'assets/images/nekokun.jpeg' }
  ]
  ,
  works: [
    { title: 'ポートフォリオサイト', desc: '本サイト一式（SPA/Pages/GAS）', href: '#', image: 'assets/images/nekokun.jpeg' },
    { title: '管理ツール', desc: 'GAS + スプレッドシート自動化', href: '#', image: 'assets/images/nekokun.jpeg' },
    { title: 'UI コンポーネント', desc: 'React コンポーネントのミニライブラリ', href: '#', image: 'assets/images/nekokun.jpeg' },
    { title: 'API サンプル', desc: 'Node/Express のサンプルAPI', href: '#', image: 'assets/images/nekokun.jpeg' }
  ]
};

// CSV helpers
function ensureDataDir(){ fs.mkdirSync(DATA_DIR, { recursive: true }); }

function toCSVRow(values){
  return values.map(v => {
    const s = String(v ?? '').replace(/\r?\n/g, ' ').trim();
    if (s.includes(',') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(',');
}

function writeCSV(file, header, rows){
  const out = [header.join(',')].concat(rows.map(r => toCSVRow(r))).join('\n');
  fs.writeFileSync(path.join(DATA_DIR, file), out, 'utf8');
}

function readCSV(file){
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) return null;
  const txt = fs.readFileSync(full, 'utf8');
  const lines = txt.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines.shift().split(',');
  return lines.map(line => {
    // naive CSV split (no embedded commas handling beyond quotes removed above)
    let cols = [];
    let cur = '';
    let inQ = false;
    for (let i=0;i<line.length;i++){
      const ch = line[i];
      if (ch === '"'){
        if (inQ && line[i+1] === '"'){ cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ){ cols.push(cur); cur=''; }
      else cur += ch;
    }
    cols.push(cur);
    const obj = {};
    header.forEach((h, idx) => obj[h.trim()] = (cols[idx] ?? '').trim());
    return obj;
  });
}

function bootstrapCSV(data){
  ensureDataDir();
  if (!readCSV('about.csv')) writeCSV('about.csv', ['text'], [[data.about?.text || '']]);
  if (!readCSV('links.csv')) writeCSV('links.csv', ['title','href'], (data.links||[]).map(l=>[l.title,l.href]));
  if (!readCSV('skills_languages.csv')) writeCSV('skills_languages.csv', ['value'], (data.skills?.languages||[]).map(v=>[v]));
  if (!readCSV('skills_frameworks.csv')) writeCSV('skills_frameworks.csv', ['value'], (data.skills?.frameworks||[]).map(v=>[v]));
  if (!readCSV('skills_tools.csv')) writeCSV('skills_tools.csv', ['value'], (data.skills?.tools||[]).map(v=>[v]));
  if (!readCSV('skills_clouds.csv')) writeCSV('skills_clouds.csv', ['value'], (data.skills?.clouds||[]).map(v=>[v]));
  if (!readCSV('careers.csv')) writeCSV('careers.csv', ['period','title','industry','description','languages','tools'],
    (data.careers||[]).map(c=>[c.period,c.title,c.industry,(c.description||[]).join(';'),(c.languages||[]).join(';'),(c.tools||[]).join(';')]));
  if (!readCSV('hobbies.csv')) writeCSV('hobbies.csv', ['title','code','desc','image'], (data.hobbies||[]).map(h=>[h.title,h.code,h.desc,h.image]));
  if (!readCSV('works.csv')) writeCSV('works.csv', ['title','desc','href','image'], (data.works||[]).map(w=>[w.title,w.desc,w.href,w.image]));
}

function loadFromCSV(){
  ensureDataDir();
  const loaded = JSON.parse(JSON.stringify(defaultData));
  const about = readCSV('about.csv'); if (about && about[0]) loaded.about = { text: about[0].text };
  const links = readCSV('links.csv'); if (links) loaded.links = links.map(r=>({title:r.title, href:r.href}));
  const sl = readCSV('skills_languages.csv'); if (sl) loaded.skills.languages = sl.map(r=>r.value).filter(Boolean);
  const sf = readCSV('skills_frameworks.csv'); if (sf) loaded.skills.frameworks = sf.map(r=>r.value).filter(Boolean);
  const st = readCSV('skills_tools.csv'); if (st) loaded.skills.tools = st.map(r=>r.value).filter(Boolean);
  const sc = readCSV('skills_clouds.csv'); if (sc) loaded.skills.clouds = sc.map(r=>r.value).filter(Boolean);
  const careers = readCSV('careers.csv'); if (careers) loaded.careers = careers.map(r=>({
    period:r.period, title:r.title, industry:r.industry,
    description:(r.description||'').split(';').filter(Boolean),
    languages:(r.languages||'').split(';').filter(Boolean),
    tools:(r.tools||'').split(';').filter(Boolean)
  }));
  const hobbies = readCSV('hobbies.csv'); if (hobbies) loaded.hobbies = hobbies.map(r=>({title:r.title, code:r.code, desc:r.desc, image:r.image}));
  const works = readCSV('works.csv'); if (works) loaded.works = works.map(r=>({title:r.title, desc:r.desc, href:r.href, image:r.image}));
  return loaded;
}

function saveToCSV(payload){
  ensureDataDir();
  const d = payload || {};
  const about = (d.about && d.about.text) ? String(d.about.text) : '';
  writeCSV('about.csv', ['text'], [[about]]);
  writeCSV('links.csv', ['title','href'], (d.links||[]).map(l=>[l.title||'', l.href||'']));
  const skills = d.skills||{};
  writeCSV('skills_languages.csv', ['value'], (skills.languages||[]).map(v=>[v]));
  writeCSV('skills_frameworks.csv', ['value'], (skills.frameworks||[]).map(v=>[v]));
  writeCSV('skills_tools.csv', ['value'], (skills.tools||[]).map(v=>[v]));
  writeCSV('skills_clouds.csv', ['value'], (skills.clouds||[]).map(v=>[v]));
  writeCSV('careers.csv', ['period','title','industry','description','languages','tools'],
    (d.careers||[]).map(c=>[
      c.period||'', c.title||'', c.industry||'', (c.description||[]).join(';'), (c.languages||[]).join(';'), (c.tools||[]).join(';')
    ]));
  writeCSV('hobbies.csv', ['title','code','desc','image'], (d.hobbies||[]).map(h=>[h.title||'',h.code||'',h.desc||'',h.image||'']));
  writeCSV('works.csv', ['title','desc','href','image'], (d.works||[]).map(w=>[w.title||'',w.desc||'',w.href||'',w.image||'']));
}

ensureDataDir();
bootstrapCSV(defaultData);
let data = loadFromCSV();

app.get('/api/portfolio', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Admin auth
app.post('/admin/api/login', (req, res) => {
  const pw = (req.body && req.body.password) || '';
  if (pw && pw === ADMIN_PASSWORD){
    res.cookie('adm', '1', { httpOnly: true, sameSite: 'lax' });
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Unauthorized' });
});

app.post('/admin/api/logout', (req, res) => {
  try{
    res.clearCookie('adm', { httpOnly: true, sameSite: 'lax' });
  }catch(_){}
  return res.json({ ok: true });
});

// Gate admin routes (except login)
app.use('/admin', (req, res, next) => {
  if (req.path === '/api/login' || req.path === '/api/logout') return next();
  const authed = req.cookies && req.cookies.adm === '1';
  if (!authed){
    // Serve login page for HTML requests
    if ((req.headers.accept || '').includes('text/html')){
      return res.sendFile(path.join(__dirname, 'admin', 'login.html'));
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Admin UI (static)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Admin API to save JSON into CSVs
app.post('/admin/api/save', (req, res) => {
  try{
    const payload = req.body && (req.body.data || req.body);
    if (!payload) return res.status(400).json({ error: 'Missing data' });
    saveToCSV(payload);
    data = loadFromCSV();
    res.json({ ok: true });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Local GAS mock listening on http://0.0.0.0:${PORT}`);
});
