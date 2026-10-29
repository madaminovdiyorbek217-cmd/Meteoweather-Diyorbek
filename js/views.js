'use strict';
/* Отрисовка блоков страницы. Каждая функция принимает элемент и заполняет его разметкой. */

const SECS = ['alerts', 'hero', 'hourly', 'week', 'air', 'tips', 'map'];
const secEl = n => $('#s-' + n);
const region = () => regionById(state.current);
const curData = () => state.data[state.current];
const dayIdx = d => Math.min(state.day, d.days.length - 1);

/* ---------- Предупреждения ---------- */
const ALERT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/></svg>';
function renderAlerts(el) {
  const list = alertsFor(state.current).slice(0, 4);
  if (!list.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="alerts-grid">${list.map((a, k) => {
    const tag = a.day !== state.day ? ` <em>${dayTitle(a.date, a.day)}</em>` : '';
    return `<div class="alert lv-${a.lvl} anim" style="--i:${k}" role="note">${ALERT_ICON}<div><b>${t('al_' + a.key)}${tag}</b><span>${t('al_' + a.key + '_t', a.vars)}</span></div></div>`;
  }).join('')}</div>`;
}

/* ---------- Главный блок ---------- */
let shown = null, tempRaf = 0;
function countTo(el, to) {
  const from = shown === null ? to : shown; shown = to;
  cancelAnimationFrame(tempRaf);
  if (calm || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) tempRaf = requestAnimationFrame(step);
  };
  tempRaf = requestAnimationFrame(step);
}
function dayTag(date, i) {
  const o = ymd(date);
  return (i === 1 ? t('tomorrow') : i === 2 ? t('dayAfter') : nm().wdL[o.wd]) + ' · ' + dmLong(o);
}
function renderHero(el) {
  const r = region(), d = curData();
  if (!d) { el.innerHTML = `<div class="panel loading">${t('loading')}</div>`; return; }
  const i = dayIdx(d), x = d.days[i], c = d.cur, now = i === 0;
  const code = now ? c.code : x.code, isDay = now ? c.isDay : true, big = tv(now ? c.t : x.max);
  const name = rname(r);
  let n = 0;
  const nameHtml = name.split(' ').map(w => `<span class="w">${[...w].map(ch => `<span class="ch" style="--c:${n++}">${ch}</span>`).join('')}</span>`).join(' ');
  const pop = x.pop != null ? x.pop : 0;
  const facts = now ? [
    [t('humidity'), Math.round(c.hum) + '%'],
    [t('windFact'), windStr(c.wind), windUnit() + ' ' + dirOf(c.dir)],
    [t('pressureFact'), pressStr(c.press), pressUnit()],
    [t('precipToday'), pop + '%'],
    [t('sunrise'), x.sunrise.slice(-5)],
    [t('sunset'), x.sunset.slice(-5)]
  ] : [
    [t('windUpTo'), windStr(x.wmax || 0), windUnit() + ' ' + dirOf(x.wdir)],
    [t('precip'), num1(x.psum || 0), t('mm')],
    [t('popProb'), pop + '%'],
    [t('uv'), x.uv != null ? num1(x.uv) : '–'],
    [t('sunrise'), x.sunrise.slice(-5)],
    [t('sunset'), x.sunset.slice(-5)]
  ];
  const lines = now
    ? [t('feels', {t:tt(c.feels)}), t('todayRange', {a:tt(x.min), b:tt(x.max)})]
    : [t('dayRange', {a:tt(x.max), b:tt(x.min)}), x.feelsMax != null ? t('dayFeels', {t:tt(x.feelsMax)}) : ''];
  el.innerHTML = `
    <section class="panel hero">
      <div class="sub anim" style="--i:0">${rsub(r)}</div>
      <h1 class="name anim" style="--i:1" aria-label="${name}">${nameHtml}</h1>
      <div class="dline anim" style="--i:2">
        <span class="dtag">${now ? t('now') : dayTag(x.date, i)}</span>
        ${now ? '' : `<button type="button" class="back" data-back>${t('back')}</button>`}
      </div>
      <div class="tempRow anim" style="--i:3">
        <div class="temp"><span id="bigTemp">${fmt(big)}</span><sup>°</sup></div>
        <div class="cond">${icon(code, isDay, 'big')}<div>
          <div class="ct">${textOf(code)}</div>
          ${lines.filter(Boolean).map(s => `<div class="cf">${s}</div>`).join('')}
        </div></div>
      </div>
      <div class="facts">${facts.map((f, k) => `<div class="fact anim" style="--i:${4 + k}"><b>${f[0]}</b><span>${f[1]}</span>${f[2] ? `<small>${f[2]}</small>` : ''}</div>`).join('')}</div>
    </section>`;
  countTo($('#bigTemp'), big);
}

/* ---------- Почасовой график ---------- */
function smoothPath(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k - 1] || pts[k], b = pts[k], c = pts[k + 1], e = pts[k + 2] || c;
    d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d;
}
function renderHourly(el) {
  const d = curData();
  if (!d || !d.hours || !d.hours.temp.length) { el.innerHTML = ''; return; }
  const i = dayIdx(d), pts = hourSlice(d, i);
  if (pts.length < 2) { el.innerHTML = ''; return; }
  const COL = 54, TOP = 46, CH = 92, ICON = 156, BAR = 248, BARH = 34, LAB = 270, HGT = 282, W = pts.length * COL;
  const temps = pts.map(p => p.temp), mn = Math.min(...temps), mx = Math.max(...temps), span = Math.max(3, mx - mn);
  const X = k => COL * (k + .5), Y = v => TOP + (mx - v) / span * CH;
  const xy = pts.map((p, k) => [X(k), Y(p.temp)]);
  const line = smoothPath(xy), area = `${line}L${X(pts.length - 1)} ${TOP + CH + 16}L${X(0)} ${TOP + CH + 16}Z`;
  let g = '<defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ink);stop-opacity:.2"/><stop offset="1" style="stop-color:var(--ink);stop-opacity:0"/></linearGradient></defs>';
  g += i === 0 ? `<rect class="hc-now" x="3" y="4" width="${COL - 6}" height="${HGT - 8}" rx="14"/>` : '';
  g += `<path class="hc-area" d="${area}"/><path class="hc-line" d="${line}"/>`;
  pts.forEach((p, k) => {
    const x = X(k), y = xy[k][1];
    if (p.hh === 0 && k > 0) g += `<line class="hc-sep" x1="${COL * k}" y1="10" x2="${COL * k}" y2="${HGT - 6}"/><text class="hc-day" x="${COL * k + 7}" y="20">${dayTitle(d.days[p.di].date, p.di)}</text>`;
    g += `<circle class="hc-dot" cx="${x}" cy="${y.toFixed(1)}" r="4.5" fill="${tempColor(p.temp)}"/>`;
    g += `<text class="hc-t" x="${x}" y="${(y - 11).toFixed(1)}" text-anchor="middle">${fmt(tv(p.temp))}°</text>`;
    g += iconAt(p.code, p.isDay, x - 14, ICON, 28);
    if (p.pop != null && p.pop > 0) {
      const h = Math.max(3, p.pop / 100 * BARH);
      g += `<rect class="hc-bar" x="${x - 9}" y="${(BAR - h).toFixed(1)}" width="18" height="${h.toFixed(1)}" rx="4"/>`;
      if (p.pop >= 20) g += `<text class="hc-pop" x="${x}" y="${(BAR - h - 5).toFixed(1)}" text-anchor="middle">${p.pop}%</text>`;
    }
    g += `<text class="hc-h${i === 0 && k === 0 ? ' now' : ''}" x="${x}" y="${LAB}" text-anchor="middle">${i === 0 && k === 0 ? t('hourNow') : p2(p.hh) + ':00'}</text>`;
  });
  const title = i === 0 ? t('next24') : t('day24', {day:dayTitle(d.days[i].date, i)});
  el.innerHTML = `
    <section class="panel hourly anim" style="--i:3">
      <div class="ph"><h2>${t('hourlyTitle')}</h2><div class="hint">${title}</div></div>
      <div class="legend"><span><i class="lg-t"></i>${t('temperatureLine')}</span><span><i class="lg-p"></i>${t('rainProb')}</span></div>
      <div class="hscroll" tabindex="0" role="group" aria-label="${t('hourlyTitle')}">
        <svg class="hc" width="${W}" height="${HGT}" viewBox="0 0 ${W} ${HGT}" role="img" aria-label="${t('hourlyTitle')}: ${title}">${g}</svg>
      </div>
      <div class="subhint">${t('hourlyHint')}</div>
    </section>`;
}

/* ---------- Прогноз на 15 дней ---------- */
function renderWeek(el) {
  const r = region(), d = curData();
  if (!d) { el.innerHTML = ''; return; }
  const gmin = Math.min(...d.days.map(x => x.min)), gmax = Math.max(...d.days.map(x => x.max)), span = Math.max(1, gmax - gmin);
  const rows = d.days.map((x, i) => {
    const o = ymd(x.date), l1 = i === 0 ? t('today') : i === 1 ? t('tomorrow') : nm().wdS[o.wd], l2 = dmShort(o);
    const left = (x.min - gmin) / span * 100, width = Math.max(7, (x.max - x.min) / span * 100);
    return `<li><button type="button" class="row" data-day="${i}" aria-pressed="${i === state.day}" aria-label="${l1}, ${l2}: ${textOf(x.code)}, ${tt(x.min)} … ${tt(x.max)}">`
      + `<span><span class="d1">${l1}</span><br><span class="d2">${l2}</span></span>${icon(x.code, true)}`
      + `<span class="lo">${tt(x.min)}</span><span class="bar"><span class="fill" style="--i:${i};left:${left}%;width:${Math.min(width, 100 - left)}%;background:linear-gradient(90deg,${tempColor(x.min)},${tempColor(x.max)})"></span></span>`
      + `<span class="hi">${tt(x.max)}</span><span class="pop">${x.pop != null && x.pop >= 15 ? x.pop + '%' : ''}</span></button></li>`;
  }).join('');
  el.innerHTML = `
    <section class="panel week">
      <div class="anim" style="--i:3"><h2>${t('weekTitle')}</h2><div class="hint">${t('weekHint', {name:rname(r)})}</div></div>
      <ul class="rows anim" style="--i:4">${rows}</ul>
    </section>`;
}

/* ---------- Качество воздуха ---------- */
function renderAir(el) {
  const d = curData(); if (!d) { el.innerHTML = ''; return; }
  const aq = state.aq[state.current], i = dayIdx(d), x = d.days[i];
  let aqi = null, maxToday = null;
  if (aq) {
    if (i === 0 && aq.cur.aqi != null) { aqi = aq.cur.aqi; maxToday = aq.byDate[x.date]; }
    else if (aq.byDate[x.date] != null) aqi = aq.byDate[x.date];
  }
  let body;
  if (aqi == null) {
    body = `<p class="empty">${aq && i > 0 ? t('airFar') : t('noAir')}</p>`;
  } else {
    const cat = aqiCat(aqi), pos = Math.min(aqi, 400) / 400 * 100, c = aq.cur;
    const pol = i === 0 ? [['pm25', c.pm25], ['pm10', c.pm10], ['o3', c.o3], ['no2', c.no2]].filter(p => p[1] != null)
      .map(p => `<div class="pol"><b>${t(p[0])}</b><span>${Math.round(p[1])}</span><small>µg/m³</small></div>`).join('') : '';
    body = `
      <div class="aqrow">
        <div class="aqv">${Math.round(aqi)}</div>
        <div class="aqt"><span class="aqpill" style="background:${cat.color};color:${cat.ink}">${t('cat_' + cat.key)}</span>
          <div class="aqa">${t('adv_' + cat.key)}</div></div>
      </div>
      <div class="aqbar" role="img" aria-label="AQI ${Math.round(aqi)}"><i style="left:${pos}%"></i></div>
      <div class="aqticks"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300</span></div>
      ${pol ? `<div class="pols">${pol}</div>` : ''}
      ${i > 0 ? `<div class="subhint">${t('maxDay')}</div>` : maxToday != null ? `<div class="subhint">${t('maxDay')}: ${Math.round(maxToday)}</div>` : ''}`;
  }
  el.innerHTML = `<section class="panel air anim" style="--i:5"><div class="ph"><h2>${t('airTitle')}</h2><div class="hint">${t('aqiLabel')}</div></div>${body}</section>`;
}

/* ---------- Советы: одежда, Луна, садоводам ---------- */
function moonSVG(f, size) {
  const r = size / 2 - 2, c = size / 2, k = Math.cos(2 * Math.PI * f), rx = Math.abs(k) * r;
  let lit = '';
  if (f > .015 && f < .985) {
    if (Math.abs(f - .5) < .012) lit = `<circle class="moon-lit" cx="${c}" cy="${c}" r="${r}"/>`;
    else if (f < .5) lit = `<path class="moon-lit" d="M${c} ${c - r}A${r} ${r} 0 0 1 ${c} ${c + r}A${rx.toFixed(2)} ${r} 0 0 ${k > 0 ? 0 : 1} ${c} ${c - r}Z"/>`;
    else lit = `<path class="moon-lit" d="M${c} ${c - r}A${r} ${r} 0 0 0 ${c} ${c + r}A${rx.toFixed(2)} ${r} 0 0 ${k < 0 ? 0 : 1} ${c} ${c - r}Z"/>`;
  }
  return `<svg class="moon" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="moon-dark" cx="${c}" cy="${c}" r="${r}"/>${lit}</svg>`;
}
function renderTips(el) {
  const d = curData(); if (!d) { el.innerHTML = ''; return; }
  const i = dayIdx(d), x = d.days[i];
  const outfit = outfitFor(d, i).map(k => `<li>${t(k)}</li>`).join('');
  const m = moonInfo(x.date), next = m.toFull <= m.toNew ? t('nextFull', {n:m.toFull}) : t('nextNew', {n:m.toNew});
  const fm = farmInfo(d);
  const frost = fm.frost.length ? t('frostOn', {days:fm.frost.slice(0, 3).map(s => dmShort(ymd(s))).join(', ') + (fm.frost.length > 3 ? '…' : '')}) : t('noFrost');
  el.innerHTML = `
    <section class="panel tips anim" style="--i:6">
      <div class="ph"><h2>${t('tipsTitle')}</h2></div>
      <div class="tipgrid">
        <div class="tip"><h3>${t('outfit')}</h3><ul class="outfit">${outfit}</ul></div>
        <div class="tip"><h3>${t('moon')}</h3>
          <div class="moonrow">${moonSVG(m.f, 64)}<div><div class="mnm">${t('ph' + m.idx)}</div><div class="ms">${t('illum', {n:m.illum})}</div><div class="ms">${next}</div></div></div></div>
        <div class="tip"><h3>${t('farm')}</h3>
          <dl class="farm"><div><dt>${t('rain7')}</dt><dd>${num1(fm.rain)} ${t('mm')}</dd></div>
          <div><dt>${t('frost')}</dt><dd>${frost}</dd></div>
          <div><dt>${t('water')}</dt><dd>${t(fm.water)}</dd></div></dl></div>
      </div>
    </section>`;
}

/* ---------- Карта ---------- */
const MAP_SHORT = {'tashkent-o':{ru:'Ташк. обл.', uz:'Toshkent v.'}};
const mapName = r => (MAP_SHORT[r.id] && MAP_SHORT[r.id][LANG]) || rname(r);
function renderMap(el) {
  const d = curData(); if (!d || typeof UZMAP === 'undefined') { el.innerHTML = ''; return; }
  const i = dayIdx(d);
  const val = id => { const z = state.data[id]; return z ? (i === 0 ? z.cur.t : z.days[Math.min(i, z.days.length - 1)].max) : null; };
  const order = REGIONS.filter(r => r.id !== state.current && r.id !== 'tashkent').concat(state.current !== 'tashkent' ? [region()] : [], [regionById('tashkent')]);
  let paths = '', labels = '';
  order.forEach(r => {
    const m = UZMAP.regions[r.id], v = val(r.id); if (!m || v == null) return;
    const sel = r.id === state.current;
    paths += `<path class="reg${sel ? ' sel' : ''}" data-id="${r.id}" d="${m.d}" fill="${tempColor(v)}" tabindex="0" role="button" aria-label="${rname(r)}: ${tt(v)}"${sel ? ' aria-current="true"' : ''}><title>${rname(r)}: ${tt(v)}</title></path>`;
    if (r.id === 'tashkent') paths += `<circle class="hit" data-id="tashkent" cx="${m.x}" cy="${m.y}" r="9"/>`;
  });
  REGIONS.forEach(r => {
    const m = UZMAP.regions[r.id], v = val(r.id); if (!m || v == null || r.id === 'tashkent') return;
    const big = m.a >= 1500;
    labels += (big ? `<text class="mn" x="${m.x}" y="${m.y - 4}">${mapName(r)}</text>` : '') + `<text class="mt" x="${m.x}" y="${m.y + (big ? 9 : 4)}">${tt(v)}</text>`;
  });
  const cv = val(state.current), code = i === 0 ? d.cur.code : d.days[i].code;
  el.innerHTML = `
    <section class="panel map anim" style="--i:7">
      <div class="ph"><h2>${t('mapTitle')}</h2><div class="hint">${t('mapHint')}</div></div>
      <svg class="uzmap" viewBox="0 0 ${UZMAP.w} ${UZMAP.h}" role="group" aria-label="${t('mapTitle')}">${paths}${labels}</svg>
      <div class="mapcap"><b>${rname(region())}</b> · ${cv != null ? tt(cv) : ''} · ${textOf(code)}</div>
      <div class="maplegend"><span>${tt(-10)}</span><i></i><span>${tt(40)}</span></div>
    </section>`;
}

/* ---------- Выпадающий список регионов, избранное ---------- */
const STAR = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';
function regionInfo(r) {
  const d = state.data[r.id]; if (!d) return null;
  if (state.day === 0) return {t:d.cur.t, code:d.cur.code, isDay:d.cur.isDay};
  const x = d.days[Math.min(state.day, d.days.length - 1)]; return {t:x.max, code:x.code, isDay:true};
}
function renderMenu() {
  const menu = $('#menu'), favs = state.favs.filter(id => regionById(id));
  const item = (r, k) => {
    const info = regionInfo(r), fav = favs.includes(r.id);
    return `<button type="button" class="opt" role="option" data-id="${r.id}" aria-selected="${r.id === state.current}" tabindex="-1" style="--i:${k}">`
      + `<span class="oi">${info ? icon(info.code, info.isDay) : ''}</span><span class="on">${rname(r)}</span>${fav ? `<span class="of">${STAR}</span>` : ''}<span class="od">${info ? tt(info.t) : '–'}</span></button>`;
  };
  let k = 0, html = '';
  if (favs.length) {
    html += `<div class="grp">${t('favorites')}</div>` + favs.map(id => item(regionById(id), k++)).join('')
      + `<div class="grp">${t('allRegions')}</div>` + REGIONS.filter(r => !favs.includes(r.id)).map(r => item(r, k++)).join('');
  } else html = REGIONS.map(r => item(r, k++)).join('');
  const had = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.id : null;
  menu.innerHTML = html;
  if (had && menu.contains(document.activeElement) === false && menuOpen) { const b = menu.querySelector(`[data-id="${had}"]`); if (b) b.focus({preventScroll:true}); }
}
function renderSelBtn() {
  const r = region(), info = regionInfo(r), fav = state.favs.includes(r.id);
  $('#selName').textContent = rname(r);
  $('#selIcon').innerHTML = info ? icon(info.code, info.isDay) : '';
  $('#selDeg').textContent = info ? tt(info.t) : '–';
  const fb = $('#favbtn'); fb.setAttribute('aria-pressed', fav);
  fb.title = fav ? t('removeFav') : t('addFav');
  fb.setAttribute('aria-label', fb.title);
}
function renderFavs() {
  const el = $('#favs'), list = state.favs.filter(id => regionById(id));
  el.hidden = !list.length;
  el.innerHTML = list.map(id => {
    const r = regionById(id), info = regionInfo(r);
    return `<button type="button" class="fchip" data-id="${id}" aria-pressed="${id === state.current}">${info ? icon(info.code, info.isDay) : ''}<span>${rname(r)}</span><b>${info ? tt(info.t) : ''}</b></button>`;
  }).join('');
}

/* ---------- Статические тексты ---------- */
function renderChrome() {
  document.documentElement.lang = LANG;
  document.title = t('title');
  $$('[data-i]').forEach(e => e.textContent = t(e.dataset.i));
  $$('[data-t]').forEach(e => { const s = t(e.dataset.t); e.title = s; e.setAttribute('aria-label', s); });
  $('#menu').setAttribute('aria-label', t('regionsList'));
  $('#langseg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG));
}
