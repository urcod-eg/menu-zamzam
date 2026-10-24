/* ─────────────────────────────────────────────────────────────
   QR Code للمنيو — بيترسم على الجهاز (من غير أي سيرفر ولا استهلاك)
   مربع QR بلوجو المطعم في النص (مربعات عادية عشان أي كاميرا تقراه) + اسم المطعم + «امسح الكود…» ، جاهز للطباعة 1200×1500
   ───────────────────────────────────────────────────────────── */
window.MenuQR = (function () {
  const LIB = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
  let p = null;
  const lib = () => window.qrcode ? Promise.resolve(window.qrcode) : p ||= new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = LIB; s.onload = () => res(window.qrcode); s.onerror = () => { p = null; rej(new Error("lib")); }; document.head.appendChild(s); });
  const img = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

  async function draw(canvas, { url, title = "", sub = "", color = "#111111", logo = "icons/icon-192.png" }) {
    const qrcode = await lib();
    const q = qrcode(0, "H"); q.addData(url, "Byte"); q.make();
    const n = q.getModuleCount(), W = 1200, H = 1500, pad = 120, box = W - pad * 2, cell = box / n;
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext("2d");
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
    /* classic square modules: the most reliable to scan on every phone camera */
    c.fillStyle = color;
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++)
      if (q.isDark(r, k)) c.fillRect(Math.floor(pad + k * cell), Math.floor(pad + r * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
    /* logo in the middle (error correction H keeps it scannable) */
    const li = await img(logo);
    if (li) {
      const s = box * .2, x = (W - s) / 2, y = pad + (box - s) / 2;
      c.fillStyle = "#ffffff"; rr(c, x - 14, y - 14, s + 28, s + 28, 28); c.fill();
      c.save(); rr(c, x, y, s, s, 20); c.clip(); c.drawImage(li, x, y, s, s); c.restore();
    }
    /* text */
    try { await document.fonts?.load('800 64px "Cairo"'); } catch {}
    c.textAlign = "center"; c.direction = document.documentElement.dir || "rtl";
    c.fillStyle = "#111111"; c.font = '800 66px "Cairo", "Segoe UI", Tahoma, sans-serif';
    c.fillText(title, W / 2, pad + box + 120, W - 120);
    c.fillStyle = "#555555"; c.font = '600 40px "Cairo", "Segoe UI", Tahoma, sans-serif';
    c.fillText(sub, W / 2, pad + box + 190, W - 120);
    c.fillStyle = "#999999"; c.font = '500 26px "Cairo", sans-serif'; c.direction = "ltr";
    c.fillText(url.replace(/^https?:\/\//, "").replace(/\/$/, ""), W / 2, H - 50, W - 120);
    return canvas;
  }
  function download(canvas, name) {
    const a = document.createElement("a"); a.download = name || "menu-qr.png"; a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a); a.click(); a.remove();
  }
  return { draw, download };
})();
