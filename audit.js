/* playwright audit: hero t=0 visibility, store spacing, infra contrast, console errors */
const pw = require("/home/uwuki/prooflens/node_modules/playwright");

const url = process.argv[2];
const label = process.argv[3] || "run";

function lum(r, g, b) {
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(c1, c2) {
  const L1 = lum(...c1), L2 = lum(...c2);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}
function parseRgb(s) {
  const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
}

(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto(url, { waitUntil: "load", timeout
: 45000 });
  await page.waitForTimeout(250); // t≈0, no scroll yet

  const hero = await page.evaluate(() => {
    const g = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { opacity: cs.opacity, color: cs.color, top: Math.round(r.top), bottom: Math.round(r.bottom), inViewport: r.top < innerHeight && r.bottom > 0, h: Math.round(r.height) };
    };
    return {
      heroIn: g(".hero-in"), kicker: g(".kicker"), h1: g("h1"), lede: g(".lede"),
      cta: g(".hero-cta"), stats: g(".stats"),
      heroVisibleNoScroll: g(".hero-in") && g(".hero-in").opacity === "1",
    };
  });
  await page.screenshot({ path: `/tmp/pfolio2-0905/shots/${label}-hero-t0.png` });

  // settled hero, still zero scroll — proves not scroll-gated
  await page.waitForTimeout(1200);
  const heroSettled = await page.evaluate(() => ({
    scrollY: window.scrollY,
    heroInOpacity: getComputedStyle(document.querySelector(".hero-in")).opacity,
    statsOpacity: getComputedStyle(document.querySelector(".stats")).opacity,
    stat1Opacity: getComputedStyle(document.querySelector(".stat")).opacity,
    h1Visible: getComputedStyle(document.querySelector("h1")).opacity === "1",
  }));
  await page.screenshot({ path: `/tmp/pfolio2-0905/shots/${label}-hero-settled.png` });

  // store spacing
  await page.evaluate(() => document.querySelector("#store").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(2600);
  const store = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".srow")];
    const last = rows[rows.length - 1].getBoundingClientRect();
    const cta = document.querySelector(".catalog-cta").getBoundingClientRect();
    const btn = document.querySelector(".catalog-cta .btn").getBoundingClientRect();
    return {
      rowCount: rows.length,
      gapLastRowToCta: Math.round(cta.top - last.bottom),
      gapLastRowToBtn: Math.round(btn.top - last.bottom),
      ctaMarginTop: getComputedStyle(document.querySelector(".catalog-cta")).marginTop,
      rowGap: getComputedStyle(document.querySelector(".store-list")).rowGap,
    };
  });
  await page.screenshot({ path: `/tmp/pfolio2-0905/shots/${label}-store.png` });

  // infra contrast
  await page.evaluate(() => document.querySelector("#infra").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(2600);
  const infra = await page.evaluate(() => {
    const p = document.querySelector(".icard p");
    const card = document.querySelector(".icard");
    const lbl = document.querySelector(".icard .lbl");
    const cs = getComputedStyle(p);
    const csCard = getComputedStyle(card);
    const pc = cs.color.match(/[\d.]+/g).map(Number).slice(0, 3);
    let bg = csCard.backgroundColor.match(/[\d.]+/g).map(Number).slice(0, 3);
    const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const L1 = lum(...pc), L2 = lum(...bg);
    const contrast = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return {
      pColor: cs.color, cardBg: csCard.backgroundColor, contrast: +contrast.toFixed(2),
      pOpacity: cs.opacity, cardOpacity: csCard.opacity,
      cardTransform: csCard.transform, cardDisplay: csCard.display, cardVisibility: csCard.visibility,
      lblColor: getComputedStyle(lbl).color,
      cardRect: JSON.parse(JSON.stringify(card.getBoundingClientRect())),
    };
  });
  await page.screenshot({ path: `/tmp/pfolio2-0905/shots/${label}-infra.png` });

  console.log(JSON.stringify({ label, url, hero, heroSettled, store, infra, consoleErrors: errors }, null, 2));
  await browser.close();
})().catch((e) => { console.error("AUDIT FAIL", e); process.exit(1); });
