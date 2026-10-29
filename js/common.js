'use strict';
/* Общее: настройки, регионы, виды погоды, единицы измерения, иконки */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- Настройки ---------- */
const OPTS = {lang:LANGS, theme:['dark', 'light'], temp:['c', 'f'], wind:['ms', 'kmh'], press:['mmhg', 'hpa']};
const settings = {lang:'ru', theme:'dark', temp:'c', wind:'ms', press:'mmhg'};
(function loadSettings() {
  const saved = store.get('uz-weather-settings', null);
  if (saved) {
    for (const k in OPTS) if (OPTS[k].includes(saved[k])) settings[k] = saved[k];
  } else {
    settings.lang = /^uz/i.test(navigator.language || '') ? 'uz' : 'ru';
  }
  LANG = settings.lang;
})();
function saveSettings() { store.set('uz-weather-settings', settings); }
function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', settings.theme === 'light' ? '#cfe3f7' : '#0c1a36');
}

/* ---------- Регионы ---------- */
const REGIONS = [
  {id:'tashkent',    lat:41.2995, lon:69.2401, n:{ru:'Ташкент', uz:'Toshkent'},                s:{ru:'Город Ташкент · столица', uz:'Toshkent shahri · poytaxt'}},
  {id:'tashkent-o',  lat:41.0167, lon:69.3600, n:{ru:'Ташкентская обл.', uz:'Toshkent viloyati'}, s:{ru:'Ташкентская область · Нурафшон', uz:'Toshkent viloyati · Nurafshon'}},
  {id:'andijan',     lat:40.7821, lon:72.3442, n:{ru:'Андижан', uz:'Andijon'},                  s:{ru:'Андижанская область · Андижан', uz:'Andijon viloyati · Andijon'}},
  {id:'bukhara',     lat:39.7747, lon:64.4286, n:{ru:'Бухара', uz:'Buxoro'},                    s:{ru:'Бухарская область · Бухара', uz:'Buxoro viloyati · Buxoro'}},
  {id:'fergana',     lat:40.3864, lon:71.7864, n:{ru:'Фергана', uz:'Farg‘ona'},                 s:{ru:'Ферганская область · Фергана', uz:'Farg‘ona viloyati · Farg‘ona'}},
  {id:'jizzakh',     lat:40.1158, lon:67.8422, n:{ru:'Джизак', uz:'Jizzax'},                    s:{ru:'Джизакская область · Джизак', uz:'Jizzax viloyati · Jizzax'}},
  {id:'namangan',    lat:40.9983, lon:71.6726, n:{ru:'Наманган', uz:'Namangan'},                s:{ru:'Наманганская область · Наманган', uz:'Namangan viloyati · Namangan'}},
  {id:'navoi',       lat:40.0844, lon:65.3792, n:{ru:'Навои', uz:'Navoiy'},                     s:{ru:'Навоийская область · Навои', uz:'Navoiy viloyati · Navoiy'}},
  {id:'kashkadarya', lat:38.8606, lon:65.7891, n:{ru:'Кашкадарья', uz:'Qashqadaryo'},           s:{ru:'Кашкадарьинская область · Карши', uz:'Qashqadaryo viloyati · Qarshi'}},
  {id:'samarkand',   lat:39.6542, lon:66.9597, n:{ru:'Самарканд', uz:'Samarqand'},              s:{ru:'Самаркандская область · Самарканд', uz:'Samarqand viloyati · Samarqand'}},
  {id:'syrdarya',    lat:40.4897, lon:68.7842, n:{ru:'Сырдарья', uz:'Sirdaryo'},                s:{ru:'Сырдарьинская область · Гулистан', uz:'Sirdaryo viloyati · Guliston'}},
  {id:'surkhandarya',lat:37.2242, lon:67.2783, n:{ru:'Сурхандарья', uz:'Surxondaryo'},          s:{ru:'Сурхандарьинская область · Термез', uz:'Surxondaryo viloyati · Termiz'}},
  {id:'khorezm',     lat:41.5500, lon:60.6333, n:{ru:'Хорезм', uz:'Xorazm'},                    s:{ru:'Хорезмская область · Ургенч', uz:'Xorazm viloyati · Urganch'}},
  {id:'karakalpak',  lat:42.4531, lon:59.6103, n:{ru:'Каракалпакстан', uz:'Qoraqalpog‘iston'},  s:{ru:'Республика Каракалпакстан · Нукус', uz:'Qoraqalpog‘iston Respublikasi · Nukus'}}
];
const rname = r => r.n[LANG] || r.n.ru;
const rsub = r => r.s[LANG] || r.s.ru;
const regionById = id => REGIONS.find(r => r.id === id);

/* Виды погоды по кодам WMO: [тип, сила осадков] */
const WX = {
  0:['clear'],1:['mclear'],2:['part'],3:['over'],45:['fog'],48:['fog'],
  51:['drizzle',.25],53:['drizzle',.4],55:['drizzle',.55],56:['drizzle',.4],57:['drizzle',.55],
  61:['rain',.5],63:['rain',.75],65:['rain',1],66:['rain',.6],67:['rain',.9],
  71:['snow',.4],73:['snow',.7],75:['snow',1],77:['snow',.35],80:['rain',.6],81:['rain',.85],82:['rain',1],
  85:['snow',.6],86:['snow',1],95:['storm'],96:['storm'],99:['storm']
};
const kindOf = c => (WX[c] || WX[0])[0];
const isWet = c => ['drizzle', 'rain', 'snow', 'storm'].includes(kindOf(c));

/* ---------- Единицы измерения (данные хранятся в °C, км/ч и гПа) ---------- */
const tv = c => settings.temp === 'f' ? c * 9 / 5 + 32 : c;
const fmt = n => { const r = Math.round(n); return r === 0 ? '0' : (r < 0 ? '−' : '') + Math.abs(r); };
const tt = c => fmt(tv(c)) + '°';
const num1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
const windVal = kmh => settings.wind === 'kmh' ? Math.round(kmh) : kmh / 3.6;
const windStr = kmh => settings.wind === 'kmh' ? String(Math.round(kmh)) : num1(kmh / 3.6);
const windUnit = () => t(settings.wind);
const pressStr = h => settings.press === 'hpa' ? String(Math.round(h)) : String(Math.round(h * 0.75006));
const pressUnit = () => t(settings.press);

/* Цвет температуры (по °C) */
const STOPS = [[-15,[127,180,255]],[0,[138,212,255]],[10,[143,227,192]],[20,[255,224,122]],[30,[255,176,74]],[40,[255,106,61]]];
function tempColor(c) {
  if (c <= STOPS[0][0]) return `rgb(${STOPS[0][1]})`;
  for (let i = 1; i < STOPS.length; i++) {
    if (c <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], k = (c - a) / (b - a);
      return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * k))})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1][1]})`;
}

/* ---------- Иконки ---------- */
const P = {
  sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M5.35 5.35l1.7 1.7M16.95 16.95l1.7 1.7M18.65 5.35l-1.7 1.7M7.05 16.95l-1.7 1.7"/>',
  moon:'<path d="M20.2 14.4A8.3 8.3 0 0 1 9.6 3.8a8.3 8.3 0 1 0 10.6 10.6z"/>',
  cloud:'<path d="M7.2 19.2a4.3 4.3 0 0 1-.6-8.56 6 6 0 0 1 11.5-.9 4.7 4.7 0 0 1-.6 9.46z"/>'
};
const grp = (tr, body) => `<g transform="${tr}">${body}</g>`;
function iconBody(code, isDay) {
  switch (kindOf(code)) {
    case 'clear': case 'mclear': return isDay ? P.sun : P.moon;
    case 'part': return grp('translate(.4 .4) scale(.62)', isDay ? P.sun : P.moon) + grp('translate(3.4 3.2) scale(.78)', P.cloud);
    case 'over': return P.cloud;
    case 'fog': return '<path d="M3.5 8h12M6.5 12h14M3.5 16h10M9 20h9"/>';
    case 'drizzle': case 'rain': return grp('translate(0 -3.2)', P.cloud) + '<path d="M8 18.6l-.9 2.6M12.6 18.6l-.9 2.6M17.2 18.6l-.9 2.6"/>';
    case 'snow': return grp('translate(0 -3.2)', P.cloud) + '<path d="M8 19v.01M12 21v.01M16 19v.01M12 17.5v.01" stroke-width="2.4"/>';
    case 'storm': return grp('translate(0 -3.2)', P.cloud) + '<path d="M12.6 15.6l-2.8 3.7h3l-1.4 3 3.9-4.6h-3l1.2-2.1z"/>';
    default: return P.cloud;
  }
}
const SVGA = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const icon = (code, isDay = true, cls = '') => `<svg class="ic ${cls}" ${SVGA} aria-hidden="true">${iconBody(code, isDay)}</svg>`;
/* Иконка внутри другого SVG (для графика) */
const iconAt = (code, isDay, x, y, s) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" ${SVGA} aria-hidden="true">${iconBody(code, isDay)}</svg>`;
