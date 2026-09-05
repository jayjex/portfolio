const pw = require("/home/uwuki/prooflens/node_modules/playwright");
(async () => {
  const b = await pw.chromium.launch();
  // JS disabled
  let ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  let p = await ctx.newPage();
  await p.goto("http://localhost:8123/", { waitUntil: "load" });
  const nojs = await p.evaluate(() => ({
    gatedClass: document.documentElement.className,
    h1Op: getComputedStyle(document.querySelector("h1")).opacity,
    statOp: getComputedStyle(document.querySelector(".stat")).opacity,
    cardOp: getComputedStyle(document.querySelector(".card")).opacity,
  }));
  await p.screenshot({ path: "/tmp/pfolio2-0905/shots/nojs-hero.png" });
  // reduced motion
  ctx = await b.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });
  p = await ctx.newPage();
  await p.goto("http://localhost:8123/", { waitUntil: "load" });
  await p.waitForTimeout(400);
  const rm = await p.evaluate(() => ({
    cls: document.documentElement.className,
    h1Op: getComputedStyle(document.querySelector("h1")).opacity,
    cardOp: getComputedStyle(document.querySelector(".card")).opacity,
    icardOp: getComputedStyle(document.querySelector(".icard")).opacity,
    chipOp: getComputedStyle(document.querySelector(".chip")).opacity,
  }));
  await p.screenshot({ path: "/tmp/pfolio2-0905/shots/reduced-cv.png" });
  console.log(JSON.stringify({ nojs, reducedMotion: rm }, null, 2));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
