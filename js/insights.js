'use strict';
/* Умные подсказки: предупреждения, что надеть, фаза Луны, советы садоводам, качество воздуха, ближайший регион.
   Здесь только расчёты, без работы со страницей. */

const AQI_CATS = [
  {max:50,  key:'good',          color:'#6fd08c', ink:'#10301a'},
  {max:100, key:'moderate',      color:'#ffd24d', ink:'#3a2c00'},
  {max:150, key:'sensitive',     color:'#ff9d3d', ink:'#3d1f00'},
  {max:200, key:'unhealthy',     color:'#ff6159', ink:'#3d0905'},
  {max:300, key:'veryUnhealthy', color:'#b479f2', ink:'#fff'},
  {max:Infinity, key:'hazardous', color:'#c4435f', ink:'#fff'}
];
const aqiCat = a => AQI_CATS.find(c => a <= c.max);

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180, dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function nearestRegion(lat, lon) {
  let best = null, bd = Infinity;
  for (const r of REGIONS) { const d = haversine(lat, lon, r.lat, r.lon); if (d < bd) { bd = d; best = r; } }
  return {region:best, km:Math.round(bd)};
}

const dayTitle = (date, i) => i === 0 ? t('today') : i === 1 ? t('tomorrow') : nm().wdL[ymd(date).wd];

/* ---------- Предупреждения ---------- */
const LV = {danger:0, warn:1, info:2};
function alertsFor(rid) {
  const d = state.data[rid]; if (!d) return [];
  const aq = state.aq[rid], scope = state.day === 0 ? [0, 1, 2] : [state.day], out = [];
  for (const i of scope) {
    const x = d.days[i]; if (!x) continue;
    const add = (lvl, key, vars) => out.push({lvl, key, vars:vars || {}, day:i, date:x.date});
    if (x.max >= 40) add('danger', 'extremeHeat', {t:tt(x.max)}); else if (x.max >= 35) add('warn', 'heat', {t:tt(x.max)});
    if (x.min <= -20) add('danger', 'severeFrost', {t:tt(x.min)}); else if (x.min <= -10) add('warn', 'severeFrost', {t:tt(x.min)});
    else if (x.min <= 0) add('info', 'frost', {t:tt(x.min)});
    const gust = x.gust != null ? x.gust : x.wmax;
    if (gust >= 70) add('danger', 'wind', {w:windStr(gust) + ' ' + windUnit()}); else if (gust >= 50) add('warn', 'wind', {w:windStr(gust) + ' ' + windUnit()});
    if (x.code === 96 || x.code === 99) add('danger', 'hail'); else if (x.code === 95) add('warn', 'storm');
    if (x.psum >= 30) add('danger', 'rain', {mm:num1(x.psum) + ' ' + t('mm')}); else if (x.psum >= 15) add('warn', 'rain', {mm:num1(x.psum) + ' ' + t('mm')});
    if (x.code === 75 || x.code === 86 || (kindOf(x.code) === 'snow' && x.psum >= 10)) add('warn', 'snow');
    if (x.code === 45 || x.code === 48) add('info', 'fog');
    if (x.uv >= 11) add('danger', 'uv', {n:num1(x.uv)}); else if (x.uv >= 8) add('warn', 'uv', {n:num1(x.uv)});
    if (aq) {
      const a = i === 0 && aq.cur.aqi != null ? aq.cur.aqi : aq.byDate[x.date];
      if (a >= 200) add('danger', 'air', {n:Math.round(a)}); else if (a >= 150) add('warn', 'air', {n:Math.round(a)});
    }
  }
  /* Одно и то же предупреждение на разные дни показываем один раз: самое серьёзное, при равенстве самое раннее */
  const best = new Map();
  for (const a of out.sort((p, q) => LV[p.lvl] - LV[q.lvl] || p.day - q.day)) if (!best.has(a.key)) best.set(a.key, a);
  return [...best.values()];
}

/* ---------- Что надеть ---------- */
function outfitFor(d, i) {
  const x = d.days[i], now = i === 0;
  const feel = now ? d.cur.feels : (x.feelsMax != null ? x.feelsMax : x.max);
  const keys = [];
  if (feel <= -10) keys.push('o_winter'); else if (feel <= 0) keys.push('o_cold'); else if (feel <= 8) keys.push('o_cool');
  else if (feel <= 15) keys.push('o_mild'); else if (feel <= 22) keys.push('o_warm'); else if (feel <= 30) keys.push('o_hot');
  else if (feel <= 37) keys.push('o_veryHot'); else keys.push('o_extreme');
  const kind = kindOf(x.code);
  if (kind === 'snow') keys.push('o_snow');
  else if (['rain', 'drizzle', 'storm'].includes(kind) || (x.pop != null && x.pop >= 60)) keys.push('o_rain');
  if (x.uv >= 6 && feel > 8) keys.push('o_sun');
  if ((x.gust != null ? x.gust : x.wmax) >= 40) keys.push('o_wind');
  if (x.max - x.min >= 14 && x.max >= 12) keys.push('o_range');
  return keys;
}

/* ---------- Луна ---------- */
function moonInfo(dateStr) {
  const o = ymd(dateStr), SYN = 29.530588853;
  const days = (Date.UTC(o.y, o.m - 1, o.d, 12) - Date.UTC(2000, 0, 6, 18, 14)) / 864e5;
  const age = ((days % SYN) + SYN) % SYN, f = age / SYN;
  return {f, illum:Math.round((1 - Math.cos(2 * Math.PI * f)) / 2 * 100), idx:Math.round(f * 8) % 8,
          toFull:Math.round(((SYN / 2 - age) % SYN + SYN) % SYN), toNew:Math.round((SYN - age) % SYN)};
}

/* ---------- Садоводам и фермерам ---------- */
function farmInfo(d) {
  const w = d.days.slice(0, 7);
  const rain = w.reduce((s, x) => s + (x.psum || 0), 0);
  const avgMax = w.reduce((s, x) => s + x.max, 0) / w.length;
  const frost = w.filter(x => x.min <= 0).map(x => x.date);
  const water = rain < 3 && avgMax >= 28 ? 'waterDryHot' : rain < 5 ? 'waterDry' : rain < 25 ? 'waterOk' : 'waterWet';
  return {rain, frost, water};
}

/* ---------- Почасовые данные для графика ---------- */
const mins = s => { const [h, m] = s.slice(-5).split(':').map(Number); return h * 60 + m; };
function hourSlice(d, dayIdx) {
  const H = d.hours; if (!H || !H.temp.length) return [];
  const start = dayIdx === 0 ? Math.min(tz().h, 23) : dayIdx * 24, out = [];
  for (let i = start; i < start + 24 && i < H.temp.length; i++) {
    const di = Math.floor(i / 24), hh = i % 24, day = d.days[di]; if (!day) break;
    const m = hh * 60 + 30;
    out.push({hh, di, temp:H.temp[i], code:H.code[i], pop:H.pop[i], isDay:m >= mins(day.sunrise) && m <= mins(day.sunset)});
  }
  return out;
}
