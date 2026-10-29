'use strict';
/* Анимированное небо на canvas: солнце, луна, звёзды, облака, туман, дождь, снег, молнии.
   Sky.set(код_погоды, день_ли, скорость_ветра_кмч) плавно переключает сцену. */

const Sky = (() => {
  const cv = $('#sky'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mix = (a, b, t) => a + (b - a) * t;
  const rgb = (r, g, b) => `rgb(${r|0},${g|0},${b|0})`;
  const rgba = (c, a) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
  const speed = calm ? .3 : 1;

  function resize() {
    const w = innerWidth, h = innerHeight;
    if (w === W && Math.abs(h - H) < 80) return;
    W = w; H = h; dpr = Math.min(devicePixelRatio || 1, 1.75);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  const PAL = {
    clear: {d:[[30,110,200],[84,160,230],[170,214,245]], n:[[5,9,28],[12,22,56],[26,40,84]]},
    cloudy:{d:[[88,106,128],[118,136,156],[160,174,190]], n:[[14,20,34],[26,36,54],[44,56,76]]},
    rain:  {d:[[52,66,86],[78,94,114],[112,128,146]],     n:[[8,12,22],[18,26,40],[32,42,60]]},
    snow:  {d:[[96,112,136],[132,150,174],[176,190,210]], n:[[20,28,46],[40,52,76],[70,84,110]]},
    storm: {d:[[30,36,52],[50,58,78],[78,88,108]],        n:[[6,8,16],[14,18,32],[26,30,48]]},
    fog:   {d:[[112,124,138],[140,152,164],[170,180,190]],n:[[22,28,38],[38,46,58],[58,68,80]]}
  };
  const flat = A => [].concat(...A);
  const mixPal = (A, B, t) => flat(A).map((v, i) => mix(v, flat(B)[i], t));

  const KEYS = ['rain','snow','cloud','fog','storm','stars','sun','dark','night','wind'];
  const cur = {rain:0,snow:0,cloud:.1,fog:0,storm:0,stars:0,sun:1,dark:0,night:0,wind:.2, sky:flat(PAL.clear.d)};
  let tgt = JSON.parse(JSON.stringify(cur));

  function set(code, isDay, windKmh) {
    const w = WX[code] || WX[0], k = w[0], p = w[1] || 1;
    const t = {rain:0,snow:0,cloud:.08,fog:0,storm:0,stars:0,sun:0,dark:0,night:isDay ? 0 : 1,wind:Math.min(1,(windKmh || 0) / 45)};
    let pal = 'clear', m = 0;
    switch (k) {
      case 'mclear': t.cloud = .2; m = .12; break;
      case 'part':   t.cloud = .5; m = .4; t.dark = .1; break;
      case 'over':   t.cloud = 1; pal = 'cloudy'; t.dark = .4; break;
      case 'fog':    t.cloud = .55; t.fog = 1; pal = 'fog'; t.dark = .25; break;
      case 'drizzle':t.cloud = .9; t.rain = p; pal = 'rain'; t.dark = .55; break;
      case 'rain':   t.cloud = 1; t.rain = p; pal = 'rain'; t.dark = .6; break;
      case 'snow':   t.cloud = .85; t.snow = p; pal = 'snow'; t.dark = .15; break;
      case 'storm':  t.cloud = 1; t.rain = 1; t.storm = 1; pal = 'storm'; t.dark = .9; break;
    }
    const open = {clear:1,mclear:.9,part:.55,over:.1}[k] || 0;
    if (isDay) t.sun = open; else t.stars = open;
    const s = isDay ? 'd' : 'n';
    t.sky = mixPal(PAL[pal][s], PAL.cloudy[s], m);
    tgt = t;
  }

  /* частицы */
  const stars = Array.from({length:150}, () => ({x:Math.random(), y:Math.random() * .7, r:rnd(.4,1.5), ph:rnd(0,6.28), sp:rnd(.6,2)}));
  const clouds = Array.from({length:12}, (_, i) => ({
    x:rnd(-.3,1.2), y:rnd(.03,.42), s:rnd(.7,1.5), sp:rnd(.004,.014), thr:i / 12 * .9,
    puffs:[[-.45,.05,.28],[-.2,-.08,.34],[.08,-.14,.38],[.35,-.04,.32],[.55,.06,.26],[0,.08,.4]].map(p => [p[0] + rnd(-.04,.04), p[1] + rnd(-.03,.03), p[2] * rnd(.9,1.1)])
  }));
  const fogs = Array.from({length:7}, () => ({x:rnd(-.2,1.2), y:rnd(.35,.98), s:rnd(.8,1.6), sp:rnd(.008,.02)}));
  const NR = 280, rain = Array.from({length:NR}, () => ({x:Math.random(), y:Math.random(), v:rnd(650,1000), l:rnd(12,26)}));
  const NS = 180, snow = Array.from({length:NS}, () => ({x:Math.random(), y:Math.random(), r:rnd(1,3.3), v:rnd(28,80), ph:rnd(0,6.28), sw:rnd(.5,1.6)}));
  let nextBolt = 3, flash = 0, blink = 0, bolt = null;

  /* Положение Солнца и Луны: на широком экране в свободной части шапки, на узком выше середины */
  const celestial = () => W > 960 ? [W * .52, 70] : [W * (W > 700 ? .78 : .74), H * (W > 700 ? .2 : .17)];
  function drawSun(t) {
    const a = cur.sun; if (a < .01) return;
    const [sx, sy] = celestial(), R = Math.min(Math.max(W, H) * .5, 620);
    let g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
    g.addColorStop(0, `rgba(255,246,205,${.85 * a})`); g.addColorStop(.12, `rgba(255,226,150,${.4 * a})`); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * .025 * speed);
    const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .9);
    rg.addColorStop(0, `rgba(255,244,200,${.16 * a})`); rg.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = rg;
    for (let i = 0; i < 9; i++) { ctx.rotate(Math.PI * 2 / 9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * .9, -R * .07); ctx.lineTo(R * .9, R * .07); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = `rgba(255,252,236,${a})`; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, 6.2832); ctx.fill();
  }
  function drawMoon() {
    const a = cur.stars; if (a < .01) return;
    const [mx, my] = celestial(), am = a * (1 - cur.cloud * .6);
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, 190);
    g.addColorStop(0, `rgba(200,215,255,${.32 * am})`); g.addColorStop(1, 'rgba(200,215,255,0)');
    ctx.fillStyle = g; ctx.fillRect(mx - 200, my - 200, 400, 400);
    ctx.fillStyle = `rgba(238,242,255,${am})`; ctx.beginPath(); ctx.arc(mx, my, 26, 0, 6.2832); ctx.fill();
    ctx.fillStyle = `rgba(150,165,205,${.28 * am})`;
    [[-8,-6,6],[7,5,5],[-3,10,3.5],[10,-9,3]].forEach(c => { ctx.beginPath(); ctx.arc(mx + c[0], my + c[1], c[2], 0, 6.2832); ctx.fill(); });
  }
  function drawStars(t) {
    const a = cur.stars * (1 - cur.cloud * .85); if (a < .01) return;
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = a * (.35 + .65 * (.5 + .5 * Math.sin(t * s.sp + s.ph)));
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawClouds(dt) {
    const nt = cur.night;
    const base = [255 - 105 * nt, 255 - 90 * nt, 255 - 55 * nt], dk = [92 - 54 * nt, 100 - 54 * nt, 118 - 50 * nt];
    const col = [mix(base[0], dk[0], cur.dark), mix(base[1], dk[1], cur.dark), mix(base[2], dk[2], cur.dark)];
    const veil = .5 * cur.cloud * cur.cloud;
    if (veil > .01) {
      const g = ctx.createLinearGradient(0, 0, 0, H * .85);
      g.addColorStop(0, rgba(col, veil)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const u0 = Math.min(Math.max(W * .24, 170), 360);
    clouds.forEach(c => {
      c.x += dt * c.sp * (1 + cur.wind * 2.2) * speed;
      if (c.x > 1.35) c.x = -.4;
      const vis = Math.max(0, Math.min(1, (cur.cloud - c.thr) * 4)); if (vis < .01) return;
      const u = u0 * c.s, cx = c.x * W, cy = c.y * H;
      for (const p of c.puffs) {
        const px = cx + p[0] * u, py = cy + p[1] * u, r = p[2] * u;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, rgba(col, vis * .5)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
      }
    });
  }
  function drawFog(dt) {
    const a = cur.fog; if (a < .01) return;
    const k = 1 - cur.night * .5, col = [215 * k, 224 * k, 235 * k];
    fogs.forEach(f => {
      f.x += dt * f.sp * speed; if (f.x > 1.4) f.x = -.4;
      const r = Math.max(W, 600) * .35 * f.s;
      ctx.save(); ctx.translate(f.x * W, f.y * H); ctx.scale(1.8, .55);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, rgba(col, .26 * a)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill(); ctx.restore();
    });
  }
  function drawRain(dt) {
    const amt = cur.rain; if (amt < .01) return;
    const n = Math.floor(NR * amt * (calm ? .6 : 1)), slant = .1 + cur.wind * .35;
    const fade = Math.min(1, amt * 2.2 + .1);
    ctx.lineCap = 'round';
    for (let layer = 0; layer < 2; layer++) {
      ctx.beginPath();
      for (let i = layer; i < n; i += 2) {
        const d = rain[i], vy = d.v * (layer ? 1.25 : .8) * speed;
        if (d.sx === undefined) { d.sx = d.x * (W + H * .5) - H * .3; d.sy = d.y * H; }
        d.sy += vy * dt; d.sx += vy * slant * dt;
        if (d.sy > H + 30) { d.sy = -30 - Math.random() * 100; d.sx = Math.random() * (W + H * .5) - H * .3; }
        const len = d.l * (layer ? 1.2 : .8);
        ctx.moveTo(d.sx, d.sy); ctx.lineTo(d.sx - slant * len, d.sy - len);
      }
      ctx.strokeStyle = layer ? `rgba(215,232,255,${.38 * fade})` : `rgba(190,212,245,${.22 * fade})`;
      ctx.lineWidth = layer ? 1.4 : .9; ctx.stroke();
    }
    const g = ctx.createLinearGradient(0, H * .7, 0, H);
    g.addColorStop(0, 'rgba(190,210,240,0)'); g.addColorStop(1, `rgba(190,210,240,${.16 * fade})`);
    ctx.fillStyle = g; ctx.fillRect(0, H * .7, W, H * .3);
  }
  function drawSnow(t, dt) {
    const amt = cur.snow; if (amt < .01) return;
    const n = Math.floor(NS * amt * (calm ? .6 : 1)), fade = Math.min(1, amt * 2 + .1);
    for (let big = 0; big < 2; big++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const f = snow[i]; if ((f.r > 2) !== !!big) continue;
        if (f.sx === undefined) { f.sx = f.x * W; f.sy = f.y * H; }
        f.sy += f.v * dt * speed; f.sx += (Math.sin(t * f.sw + f.ph) * 18 + cur.wind * 60) * dt * speed;
        if (f.sy > H + 10) { f.sy = -10; f.sx = Math.random() * W; }
        if (f.sx > W + 10) f.sx = -10; else if (f.sx < -10) f.sx = W + 10;
        ctx.moveTo(f.sx + f.r, f.sy); ctx.arc(f.sx, f.sy, f.r, 0, 6.2832);
      }
      ctx.fillStyle = `rgba(255,255,255,${(big ? .85 : .6) * fade})`; ctx.fill();
    }
  }
  function makeBolt() {
    let x = W * rnd(.2, .8), y = -10; const pts = [[x, y]], end = H * rnd(.4, .7);
    while (y < end) { x += rnd(-35, 35); y += rnd(25, 60); pts.push([x, y]); }
    return pts;
  }
  function drawLightning(dt) {
    if (cur.storm < .5 || calm) { flash = 0; return; }
    nextBolt -= dt;
    if (nextBolt <= 0) { nextBolt = rnd(3, 10); flash = 1; blink = .14; bolt = makeBolt(); }
    if (blink > 0) { blink -= dt; if (blink <= 0) flash = .85; }
    flash *= Math.exp(-dt * 6);
    if (flash < .02) return;
    ctx.fillStyle = `rgba(215,228,255,${flash * .35 * cur.storm})`; ctx.fillRect(0, 0, W, H);
    if (bolt) {
      ctx.strokeStyle = `rgba(240,245,255,${Math.min(1, flash * 1.2)})`; ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(170,200,255,1)'; ctx.shadowBlur = 16; ctx.lineJoin = 'round';
      ctx.beginPath(); bolt.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.shadowBlur = 0;
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 1.6);
    KEYS.forEach(key => cur[key] += (tgt[key] - cur[key]) * k);
    for (let i = 0; i < 9; i++) cur.sky[i] += (tgt.sky[i] - cur.sky[i]) * k;
    const s = cur.sky, t = now / 1000;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(s[0], s[1], s[2])); g.addColorStop(.55, rgb(s[3], s[4], s[5])); g.addColorStop(1, rgb(s[6], s[7], s[8]));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawSun(t); drawMoon(); drawStars(t); drawClouds(dt); drawFog(dt); drawRain(dt); drawSnow(t, dt); drawLightning(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {set};
})();
