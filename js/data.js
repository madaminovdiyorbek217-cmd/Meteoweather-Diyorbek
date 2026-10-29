'use strict';
/* Данные: запросы к Open-Meteo (погода и качество воздуха), кэш для работы без сети, демонстрационные данные */

const state = {data:{}, aq:{}, current:'tashkent', day:0, demo:false, stale:false, updated:null, override:null, favs:[]};

const LATS = REGIONS.map(r => r.lat).join(','), LONS = REGIONS.map(r => r.lon).join(',');
const API = `https://api.open-meteo.com/v1/forecast?latitude=${LATS}&longitude=${LONS}`
  + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m'
  + '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset'
  + '&hourly=temperature_2m,weather_code,precipitation_probability'
  + '&timezone=Asia%2FTashkent&forecast_days=15';
const AQ_API = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LATS}&longitude=${LONS}`
  + '&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&hourly=us_aqi&timezone=Asia%2FTashkent&forecast_days=5';
const CACHE_KEY = 'uz-weather-cache-v2';

function normalize(o) {
  const c = o.current, d = o.daily, h = o.hourly || {};
  if (!c || !d || !d.time) throw new Error('bad weather response');
  const col = k => d[k] || [];
  return {
    cur:{t:c.temperature_2m, feels:c.apparent_temperature, hum:c.relative_humidity_2m, code:c.weather_code, isDay:!!c.is_day,
         wind:c.wind_speed_10m, dir:c.wind_direction_10m, press:c.surface_pressure},
    days:d.time.map((date, i) => ({
      date, code:d.weather_code[i], max:d.temperature_2m_max[i], min:d.temperature_2m_min[i], feelsMax:col('apparent_temperature_max')[i],
      pop:col('precipitation_probability_max')[i], psum:col('precipitation_sum')[i], wmax:col('wind_speed_10m_max')[i], gust:col('wind_gusts_10m_max')[i],
      wdir:col('wind_direction_10m_dominant')[i], uv:col('uv_index_max')[i], sunrise:d.sunrise[i], sunset:d.sunset[i]
    })),
    hours:{t:h.time || [], temp:h.temperature_2m || [], code:h.weather_code || [], pop:h.precipitation_probability || []}
  };
}

function normalizeAQ(o) {
  const c = o.current || {}, h = o.hourly || {}, byDate = {};
  (h.time || []).forEach((s, i) => {
    const v = h.us_aqi ? h.us_aqi[i] : null; if (v == null) return;
    const k = s.slice(0, 10); byDate[k] = Math.max(byDate[k] === undefined ? 0 : byDate[k], v);
  });
  return {cur:{aqi:c.us_aqi, pm25:c.pm2_5, pm10:c.pm10, o3:c.ozone, no2:c.nitrogen_dioxide}, byDate};
}

/* ---------- Демонстрационные данные: только если нет ни сети, ни сохранённых данных ---------- */
function demoData() {
  const out = {}, now = new Date(), T = tz(now);
  const doy = Math.floor((Date.UTC(T.y, T.m - 1, T.d) - Date.UTC(T.y, 0, 0)) / 864e5);
  const seq = [61,3,0,2,95,0,1,45,63,0,2,3,0,73,1];
  REGIONS.forEach((r, i) => {
    const base = 15 + 14 * Math.cos(2 * Math.PI * (doy - 200) / 365) - (r.lat - 40) * 1.1;
    const days = Array.from({length:15}, (_, d) => {
      const dt = new Date(Date.UTC(T.y, T.m - 1, T.d + d));
      const code = seq[(i + d * 4) % seq.length], snowy = kindOf(code) === 'snow', wet = isWet(code);
      let max = base + 5 + Math.sin((d + i * 1.7) * .6) * 3.2 - (kindOf(code) === 'rain' ? 3 : 0);
      let min = max - 9 - Math.abs(Math.sin(d + i)) * 2;
      if (snowy) { max = Math.min(max, 2); min = Math.min(min, -4); }
      return {date:`${dt.getUTCFullYear()}-${p2(dt.getUTCMonth() + 1)}-${p2(dt.getUTCDate())}`, code, max, min, feelsMax:max - 1,
        pop:wet ? 55 + (d * 7 + i * 5) % 40 : (d * 3 + i) % 15, psum:wet ? 1.5 + (d % 5) * 1.8 : 0,
        wmax:18 + (i * 4 + d * 3) % 22, gust:30 + (i * 6 + d * 5) % 35, wdir:(i * 45 + d * 25) % 360, uv:Math.max(1, Math.round(2 + base / 5)),
        sunrise:`${dt.getUTCFullYear()}-${p2(dt.getUTCMonth() + 1)}-${p2(dt.getUTCDate())}T06:41`, sunset:`${dt.getUTCFullYear()}-${p2(dt.getUTCMonth() + 1)}-${p2(dt.getUTCDate())}T17:52`};
    });
    const hours = {t:[], temp:[], code:[], pop:[]};
    days.forEach(x => {
      const mid = (x.max + x.min) / 2, amp = (x.max - x.min) / 2, wet = isWet(x.code);
      for (let h = 0; h < 24; h++) {
        const bell = Math.max(0, 1 - Math.abs(h - 14) / 9);
        hours.t.push(`${x.date}T${p2(h)}:00`);
        hours.temp.push(mid + amp * Math.cos(2 * Math.PI * (h - 15) / 24));
        hours.code.push(!wet && h % 7 === 0 && x.code > 2 ? 2 : x.code);
        hours.pop.push(Math.round(wet ? x.pop * (.5 + .5 * bell) : x.pop * .4 * bell));
      }
    });
    const d0 = days[0], hNow = Math.min(T.h, 23);
    out[r.id] = {cur:{t:hours.temp[hNow], feels:hours.temp[hNow] - 1, hum:48 + (i * 9) % 40, code:d0.code, isDay:T.h >= 6 && T.h < 18,
      wind:d0.wmax * .6, dir:(i * 45) % 360, press:955 + i * 2}, days, hours};
  });
  return out;
}
function demoAQ() {
  const out = {}, T = tz();
  REGIONS.forEach((r, i) => {
    const base = 38 + (i * 37) % 120, byDate = {};
    for (let d = 0; d < 5; d++) { const dt = new Date(Date.UTC(T.y, T.m - 1, T.d + d)); byDate[`${dt.getUTCFullYear()}-${p2(dt.getUTCMonth() + 1)}-${p2(dt.getUTCDate())}`] = base + 12 + ((d * 19 + i * 7) % 40); }
    out[r.id] = {cur:{aqi:base, pm25:base * .35, pm10:base * .7, o3:30 + i * 4, no2:14 + i * 2}, byDate};
  });
  return out;
}

/* ---------- Кэш ---------- */
function saveCache() { store.set(CACHE_KEY, {t:Date.now(), data:state.data, aq:state.aq}); }
/* Сдвигает сохранённый прогноз так, чтобы первым днём была сегодняшняя дата */
function alignToToday(data) {
  const T = tz(), today = `${T.y}-${p2(T.m)}-${p2(T.d)}`;
  for (const id in data) {
    const d = data[id], k = d.days.findIndex(x => x.date === today);
    if (k < 0) return false;
    if (k > 0) {
      d.days = d.days.slice(k);
      for (const key in d.hours) d.hours[key] = d.hours[key].slice(k * 24);
    }
  }
  return true;
}
function loadCache() {
  const c = store.get(CACHE_KEY, null);
  if (!c || !c.data || Object.keys(c.data).length !== REGIONS.length) return null;
  return alignToToday(c.data) ? c : null;
}

/* ---------- Загрузка ---------- */
async function fetchJSON(url) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, {signal:ctl.signal});
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(to); }
}
const asArr = j => Array.isArray(j) ? j : [j];

async function loadData() {
  const first = !Object.keys(state.data).length;
  const [w, a] = await Promise.allSettled([fetchJSON(API), fetchJSON(AQ_API)]);
  let ok = false;
  if (w.status === 'fulfilled') {
    try {
      const arr = asArr(w.value); if (arr.length !== REGIONS.length) throw new Error('bad length');
      const fresh = {}; REGIONS.forEach((r, i) => fresh[r.id] = normalize(arr[i]));
      state.data = fresh; state.demo = false; state.stale = false; state.updated = new Date(); ok = true;
    } catch (e) { ok = false; }
  }
  if (a.status === 'fulfilled') {
    try {
      const arr = asArr(a.value);
      if (arr.length === REGIONS.length) { const aq = {}; REGIONS.forEach((r, i) => aq[r.id] = normalizeAQ(arr[i])); state.aq = aq; }
    } catch (e) {}
  }
  if (ok) saveCache();
  else if (first) {
    const c = loadCache();
    if (c) { state.data = c.data; state.aq = c.aq || {}; state.updated = new Date(c.t); state.stale = true; state.demo = false; }
    else { state.data = demoData(); state.aq = demoAQ(); state.demo = true; state.stale = false; state.updated = new Date(); }
  } else if (!state.demo) state.stale = true;
  return ok;
}
