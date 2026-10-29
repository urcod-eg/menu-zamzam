/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — لوحة إدارة المطعم
   • بتقرا المنيو مرة واحدة، وكل التعديلات بتحصل على نسخة محلية (draft).
   • «نشر التعديلات» = batch واحد: مستند المنيو + رفع رقم الإصدار (كتابتين بس).
   • الـ draft بيتحفظ على الجهاز تلقائيًا، فلو الصفحة اتقفلت مفيش حاجة بتضيع.
   • الصور: رابط مباشر، أو ملف من الجهاز يتضغط هنا ويترفع على repo صور GitHub.
   ───────────────────────────────────────────────────────────── */
(function () {
"use strict";
const C = window.URCOD_CONFIG, NS = "urcod." + C.clientId + ".admin.";
const SDK = v => "https://www.gstatic.com/firebasejs/" + C.firebaseSdk + "/" + v + ".js";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const store = { get(k, d) { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch {} }, del(k) { try { localStorage.removeItem(NS + k); } catch {} } };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const nid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const L = o => !o ? "" : typeof o === "string" ? o : (o.ar || o.en || "");
const fmt = n => (+n).toLocaleString("ar-EG", { maximumFractionDigits: 2 });
/* بيقبل أرقام عربي وإنجليزي، والفاصلة العشرية «٫» أو «.» أو «,» */
function num(v) {
  const s = String(v ?? "").trim().replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776)
    .replace(/[٫,]/g, ".").replace(/\s/g, "");
  if (!s || !/^\d*\.?\d+$/.test(s)) return NaN;
  return Math.round(parseFloat(s) * 100) / 100;
}
const httpsOk = u => { try { return new URL(u).protocol === "https:"; } catch { return false; } };
const toLocal = iso => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
const fromLocal = v => v ? new Date(v).toISOString() : null;
const ICONS_LIST = [["coffee", "قهوة ومشروبات ساخنة"], ["drink", "مشروبات باردة وعصائر"], ["burger", "برجر"], ["pizza", "بيتزا"], ["sandwich", "ساندوتشات"],
  ["chicken", "فراخ"], ["grill", "مشويات"], ["fish", "أسماك"], ["salad", "سلطات"], ["breakfast", "فطار"], ["dessert", "حلويات"], ["plate", "أطباق عامة"]];
const PALETTES = [["green", "#1f5a3d", "أخضر"], ["navy", "#1d3b6e", "كحلي"], ["maroon", "#7a1f33", "نبيتي"], ["coffee", "#5b3a24", "بني"], ["teal", "#0f5e63", "تركواز"]];
const AD_THEMES = [["green", "linear-gradient(120deg,#1f5a3d,#3c8a5f)", "أخضر"], ["amber", "linear-gradient(120deg,#8a4b12,#d08a24)", "دهبي"],
  ["rose", "linear-gradient(120deg,#7a2338,#c2455e)", "أحمر"], ["blue", "linear-gradient(120deg,#1f4fb0,#4f7fe0)", "أزرق"], ["dark", "linear-gradient(120deg,#11161f,#2c3442)", "غامق"]];
const SERVICE = [["both", "دليفري واستلام"], ["delivery_only", "دليفري فقط"], ["pickup_only", "استلام فقط"]];
const OFFER_TYPES = [["percent", "نسبة خصم"], ["amount", "خصم مبلغ"], ["price", "سعر جديد"], ["free_delivery", "توصيل مجاني"], ["custom", "عرض مكتوب"]];
const STATUS = { active: "نشط", scheduled: "مجدول", ended: "منتهي", paused: "متوقف", draft: "مسودة" };
const DAYS = ["الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];
const MAX_IMG = 15 * 1024 * 1024;
const I = {
  up: '<svg class="ic" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>', down: '<svg class="ic" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  plus: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>', x: '<svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  img: '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/></svg>',
  upload: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
  warn: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  info: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  dl: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></svg>',
  sheet: '<svg class="ic" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/></svg>',
  edit: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  trash: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};
/* زراير تعديل وحذف واضحة في كل صف */
const rowActs = (kind, id, name) => `<div class="acts"><button class="ib" data-act="edit${kind}" data-id="${id}" aria-label="تعديل ${esc(name)}" title="تعديل">${I.edit}</button><button class="ib del" data-act="del${kind}" data-id="${id}" aria-label="حذف ${esc(name)}" title="حذف">${I.trash}</button></div>`;

/* ═════════ state ═════════ */
let FB = null, A = null, auth = null, user = null, role = null;
let meta = null, menu = null, base = "", gh = undefined;
let tab = "home", filt = { cat: "all", q: "" }, sessionUploads = [], pendingDeletes = [];

function toast(m, bad) { const t = $("#toast"); t.textContent = m; t.className = "toast on" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "toast", 2600); }
const licOk = () => { const l = meta?.license; return !!l && l.status === "active" && (!l.endsAt || new Date(l.endsAt) > Date.now()); };
function offerStatus(o) {
  if (!o) return null; if (o.enabled === false) return "paused"; if (!o.endAt) return "draft";
  const n = Date.now(); if (o.startAt && new Date(o.startAt) > n) return "scheduled"; return new Date(o.endAt) <= n ? "ended" : "active";
}
function adStatus(a) { if (a.enabled === false) return "paused"; const n = Date.now();
  if (a.startAt && new Date(a.startAt) > n) return "scheduled"; if (a.endAt && new Date(a.endAt) <= n) return "ended"; return "active"; }
const pill = s => s ? `<span class="pill ${s}">${STATUS[s]}</span>` : "";
const cats = () => (menu.categories || []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
const mains = () => cats().filter(c => !c.parentId);
const subsOf = id => cats().filter(c => c.parentId === id);
const catById = id => menu.categories.find(c => c.id === id);
const prods = () => (menu.products || []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
function priceSummary(p) {
  if (p.priceType === "variants" && p.variants?.length) { const ps = p.variants.map(v => +v.price); const lo = Math.min(...ps), hi = Math.max(...ps);
    return lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`; }
  return fmt(+p.price || 0);
}
const catPath = id => { const c = catById(id); if (!c) return "بدون قسم"; const p = c.parentId && catById(c.parentId); return p ? `${L(p.name)} › ${L(c.name)}` : L(c.name); };

/* ═════════ dirty tracking + draft ═════════ */
function changeCount() {
  if (!menu) return 0; const b = JSON.parse(base || "{}"); let n = 0;
  for (const k of ["categories", "products", "ads"]) {
    const bm = new Map((b[k] || []).map(x => [x.id, JSON.stringify(x)])), cm = new Map((menu[k] || []).map(x => [x.id, JSON.stringify(x)]));
    cm.forEach((v, id) => { if (bm.get(id) !== v) n++; }); bm.forEach((_, id) => { if (!cm.has(id)) n++; });
  }
  for (const k of ["brand", "settings", "contact"]) if (JSON.stringify(b[k] || {}) !== JSON.stringify(menu[k] || {})) n++;
  return n;
}
function markDirty() {
  const n = changeCount();
  store.set("draft", n ? { version: meta.version, menu, sessionUploads, pendingDeletes } : null);
  $("#publishBtn").disabled = !n || !licOk(); $("#dirtyN").hidden = !n; $("#dirtyN").textContent = fmt(n);
}

/* ═════════ boot / auth ═════════
   الصفحة دي مخفية: الدخول بيحصل من المنيو (٧ ضغطات على اللوجو). لو مفيش دخول، بترجع للمنيو. */
const toMenu = () => location.replace("./");
async function boot() {
  if (C.useSample) {
    user = { email: "demo@urcod" }; role = "admin";
    meta = clone(window.SAMPLE_META); menu = clone(window.SAMPLE_MENU); base = JSON.stringify(menu); gh = null;
    return start();
  }
  try {
    FB = await MenuData.firebase(); A = await import(SDK("firebase-auth"));
    auth = A.getAuth(FB.app);
    A.onAuthStateChanged(auth, u => u ? afterLogin(u) : toMenu());
  } catch (e) { showLogin("مفيش اتصال. اتأكد من النت وافتح الصفحة تاني."); }
}
function showLogin(msg) { $("#top").hidden = $("#tabs").hidden = true; $("#view").innerHTML = `<div class="card login"><p class="err">${esc(msg)}</p><a class="btn" href="./">رجوع للمنيو</a></div>`; }
async function afterLogin(u) {
  const { db, fs } = FB;
  try {
    const m = await fs.getDoc(fs.doc(db, "public", "meta"));
    let mm; try { mm = await fs.getDoc(fs.doc(db, "public", "menu")); }
    catch (e) { if (/permission/.test(e.code || "")) return showLogin("الترخيص انتهى والمنيو متقفل. كلّم URCOD عشان تجدّد."); throw e; }
    meta = m.exists() ? MenuData.plain(m.data()) : { version: 0, license: null };
    role = (u.email || "").toLowerCase() === MenuData.devLogin ? "dev" : (meta.adminUid && u.uid === meta.adminUid) ? "admin" : null;
    if (!role) { await A.signOut(auth); return toMenu(); }
    user = u;
    menu = mm.exists() ? MenuData.plain(mm.data()) : clone(window.SAMPLE_MENU);
    delete menu.updatedAt; base = JSON.stringify(menu);
    start();
  } catch (e) { showLogin("حصلت مشكلة في التحميل. جرّب تاني."); console.error(e); }
}
$("#logoutBtn").onclick = async () => {
  if (changeCount() && !await confirmBox("فيه تعديلات لسه ماتنشرتش", "التعديلات هتفضل محفوظة على الجهاز ده، وتقدر تكمّلها لما تدخل تاني.", "خروج")) return;
  if (auth) await A.signOut(auth); toMenu();
};
function ensureShape() {
  menu.categories ||= []; menu.products ||= []; menu.ads ||= []; menu.brand ||= {}; menu.settings ||= {}; menu.contact ||= {};
  for (const k of ["name", "tagline", "about", "initial"]) menu.brand[k] ||= { ar: "", en: "" };
  menu.settings.currency ||= { ar: "ج.م", en: "EGP" }; menu.contact.address ||= { ar: "", en: "" };
  menu.contact.orderLabel ||= { ar: "اطلب أونلاين", en: "Order online" }; menu.contact.social ||= []; menu.contact.hours ||= []; menu.contact.branches ||= [];
  menu.schemaVersion ||= 1;
}
function start() {
  ensureShape();
  const d = store.get("draft", null);
  restoreOffer = d && d.version === meta.version && JSON.stringify(d.menu) !== base ? d : null;
  if (d && d.version !== meta.version) store.del("draft");
  $("#top").hidden = $("#tabs").hidden = false;
  $("#rName").textContent = L(menu.brand.name) || "المنيو";
  licLine(); markDirty(); go(store.get("tab", "home"));
}
let restoreOffer = null;
function licLine() {
  const l = meta.license; let t = "بدون ترخيص";
  if (l) { if (!licOk()) t = l.status === "suspended" ? "الترخيص موقوف" : "الترخيص منتهي";
    else if (!l.endsAt) t = "ترخيص دائم"; else { const d = Math.ceil((new Date(l.endsAt) - Date.now()) / 864e5); t = `الترخيص ساري · ${fmt(d)} يوم`; } }
  $("#licLine").textContent = (C.useSample ? "وضع تجريبي · " : "") + t;
}

/* ═════════ tabs ═════════ */
function go(t) {
  tab = t; store.set("tab", t);
  $$(".tabs button").forEach(b => { if (b.dataset.tab === t) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  const on = $(`.tabs button[data-tab="${t}"]`), ind = $("#tabInd");
  if (on) { ind.style.width = on.offsetWidth + "px"; ind.style.transform = `translateX(${on.offsetLeft}px)`; }
  render(); scrollTo({ top: 0 });
}
window.go = go;
$("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) go(b.dataset.tab); });
addEventListener("resize", () => { const on = $(".tabs button[aria-current]"); if (on) { $("#tabInd").style.width = on.offsetWidth + "px"; $("#tabInd").style.transform = `translateX(${on.offsetLeft}px)`; } });
function render() {
  const v = { home, cats: catsView, items: itemsView, ads: adsView, settings: settingsView, print: () => window.MenuPrint ? window.MenuPrint.view(menu) : "" }[tab];
  $("#view").innerHTML = `<div class="view">${v()}</div>`;
  if (tab === "settings") drawQR();
  if (tab === "print" && window.MenuPrint) window.MenuPrint.init(menu);
}
const menuLink = () => location.href.replace(/[^/]*([?#].*)?$/, "");
function drawQR() {
  const cv = $("#qrCanvas"); if (!cv || !window.MenuQR) return;
  MenuQR.draw(cv, { url: menuLink(), title: L(menu.brand.name) || "المنيو", sub: "امسح الكود عشان تشوف المنيو" })
    .catch(() => { const e = $("#qrErr"); if (e) e.textContent = "مكتبة الـ QR ماتحمّلتش. اتأكد من النت."; });
}

/* ═════════ HOME ═════════ */
function home() {
  const P = menu.products || [], l = meta.license;
  const live = P.filter(p => ["active", "scheduled"].includes(offerStatus(p.offer)));
  const avail = P.filter(p => p.available !== false).length;
  let banners = "";
  if (!licOk()) banners += `<div class="banner bad">${I.warn}<div class="grow"><b>${l?.status === "suspended" ? "الترخيص موقوف" : "الترخيص منتهي"}</b><br>تقدر تشوف المنيو، بس الحفظ مقفول لحد ما الترخيص يتجدّد. كلّم URCOD على 01508613866.</div></div>`;
  else if (l?.endsAt) { const d = (new Date(l.endsAt) - Date.now()) / 864e5; if (d < 7) banners += `<div class="banner warn">${I.warn}<div class="grow"><b>الترخيص هينتهي خلال ${fmt(Math.ceil(d))} يوم</b><br>جدّد قبل الميعاد عشان التعديل مايتقفلش.</div></div>`; }
  if (restoreOffer) banners += `<div class="banner info">${I.info}<div class="grow"><b>فيه تعديلات مانشرتهاش من آخر مرة</b><br>اتحفظت على الجهاز ده.</div><button class="btn sm" data-act="restore">استرجاع</button><button class="btn sm ghost" data-act="dropDraft">تجاهل</button></div>`;
  if (C.useSample) banners += `<div class="banner info">${I.info}<div class="grow">ده وضع تجريبي. التعديلات بتتحفظ على الجهاز بس لحد ما تربط Firebase في config.js.</div></div>`;
  return `${banners}
  <h1>أهلًا</h1>
  <div class="stats">
    <div class="stat"><b>${fmt(mains().length)}</b><span>قسم رئيسي</span></div>
    <div class="stat"><b>${fmt(P.length)}</b><span>صنف</span></div>
    <div class="stat"><b>${fmt(avail)}</b><span>متاح دلوقتي</span></div>
    <div class="stat"><b>${fmt(P.filter(p => offerStatus(p.offer) === "active").length)}</b><span>عرض نشط</span></div>
  </div>
  <div class="quick">
    <button class="btn primary" data-act="newItem">${I.plus}صنف جديد</button>
    <button class="btn" data-act="newCat">${I.plus}قسم جديد</button>
    <button class="btn" data-act="newAd">${I.plus}إعلان جديد</button>
  </div>
  <button class="btn" data-act="menuPrint" style="border:1.5px solid var(--brand);color:var(--brand);font-weight:800;background:var(--surface)">
    <svg class="ic" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
    طباعة المنيو الاحترافية | Menu Print (A4)
  </button>
  <button class="btn" data-act="excel">${I.sheet}استيراد أو تصدير المنيو بـ Excel</button>
  <div class="card"><div class="row" style="margin-bottom:10px"><h2 class="grow">العروض النشطة والمجدولة</h2><span class="muted">${fmt(live.length)}</span></div>
    ${live.length ? `<div class="list">${live.sort((a, b) => new Date(a.offer.endAt) - new Date(b.offer.endAt)).map((p, i) => itemRow(p, i)).join("")}</div>` : `<div class="empty">مفيش عروض شغالة. افتح أي صنف وفعّل «عليه عرض».</div>`}
  </div>
  <div class="card"><h2>الترخيص</h2><p class="muted" style="margin:6px 0 0">${l ? `الخطة: ${({ trial: "تجريبي", monthly: "شهري", custom: "مدة مخصّصة", annual: "سنوي", lifetime: "دائم" })[l.plan] || "—"} · ${l.endsAt ? "ينتهي " + new Date(l.endsAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "بدون تاريخ انتهاء"}` : "لسه ماتسجّلش ترخيص."}<br>تجديد الترخيص أو تغييره من URCOD بس.</p></div>`;
}

/* ═════════ CATEGORIES ═════════ */
function catRow(c, i, isSub, siblings) {
  const n = (menu.products || []).filter(p => p.categoryId === c.id || subsOf(c.id).some(s => s.id === p.categoryId)).length;
  const idx = siblings.findIndex(x => x.id === c.id);
  return `<div class="item ${isSub ? "sub" : ""} ${c.available === false || c.hidden ? "off" : ""}" style="--i:${i}">
    <div class="order"><button data-act="catUp" data-id="${c.id}" aria-label="لفوق" ${idx === 0 ? "disabled" : ""}>${I.up}</button><button data-act="catDown" data-id="${c.id}" aria-label="لتحت" ${idx === siblings.length - 1 ? "disabled" : ""}>${I.down}</button></div>
    <div class="t" data-act="editCat" data-id="${c.id}"><b>${esc(L(c.name)) || "بدون اسم"}</b><small>${isSub ? "قسم فرعي" : "قسم رئيسي"} · ${fmt(n)} صنف${c.hidden ? " · مخفي" : ""}${c.available === false ? " · متوقف" : ""}</small></div>
    ${rowActs("Cat", c.id, L(c.name))}
    <button class="switch" role="switch" aria-checked="${c.available !== false}" aria-label="متاح" data-act="catAvail" data-id="${c.id}"></button>
  </div>`;
}
function catsView() {
  const M = mains(); let i = 0;
  return `<div class="row"><h1 class="grow">الأقسام</h1><button class="btn primary" data-act="newCat">${I.plus}قسم</button></div>
  <p class="hint">لما توقف قسم، كل أصنافه بتظهر للزبون «غير متاح حاليًا» من غير ما حالة كل صنف تتغيّر. ولما ترجّعه، كل صنف بيرجع لحالته.</p>
  ${M.length ? `<div class="list">${M.map(c => catRow(c, i++, false, M) + subsOf(c.id).map((s, _, arr) => catRow(s, i++, true, arr)).join("")).join("")}</div>` : `<div class="empty">مفيش أقسام لسه.</div>`}`;
}
function reorder(list, id, dir) {
  const arr = list.slice(), k = arr.findIndex(x => x.id === id), j = k + dir; if (j < 0 || j >= arr.length) return;
  [arr[k], arr[j]] = [arr[j], arr[k]]; arr.forEach((x, n) => x.sort = n + 1);
}
function catEditor(id) {
  const isNew = !id; const c = isNew ? { id: nid("c"), parentId: null, name: { ar: "", en: "" }, icon: "plate", available: true, hidden: false } : clone(catById(id));
  const hasSubs = !isNew && subsOf(c.id).length;
  sheet(isNew ? "قسم جديد" : "تعديل القسم", `<div class="form">
    <div class="two stack"><label class="f">الاسم بالعربي<input class="in" id="cAr" value="${esc(c.name?.ar)}"></label>
    <label class="f">الاسم بالإنجليزي<input class="in" id="cEn" dir="ltr" value="${esc(c.name?.en)}"></label></div>
    <label class="f">نوعه<select class="in" id="cParent" ${hasSubs ? "disabled" : ""}><option value="">قسم رئيسي</option>${mains().filter(m => m.id !== c.id).map(m => `<option value="${m.id}" ${c.parentId === m.id ? "selected" : ""}>فرعي جوه: ${esc(L(m.name))}</option>`).join("")}</select>
      ${hasSubs ? `<small>جواه أقسام فرعية، فلازم يفضل رئيسي.</small>` : ""}</label>
    <label class="f">الأيقونة<select class="in" id="cIcon">${ICONS_LIST.map(([k, n]) => `<option value="${k}" ${c.icon === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    ${sw("cAvail", c.available !== false, "متاح", "لو قفلته، أصنافه بتظهر باهتة ومكتوب عليها «غير متاح حاليًا».")}
    ${sw("cHidden", !!c.hidden, "مخفي من المنيو", "مابيظهرش للزبون خالص، والأصناف بتفضل محفوظة.")}
    <p class="err" id="cErr"></p></div>`,
    [isNew ? null : ["حذف", "danger", () => deleteCat(c.id)], ["تطبيق", "primary", () => {
      c.name = { ar: $("#cAr").value.trim(), en: $("#cEn").value.trim() };
      if (!c.name.ar && !c.name.en) return void ($("#cErr").textContent = "اكتب اسم القسم.");
      c.parentId = $("#cParent").disabled ? c.parentId : ($("#cParent").value || null);
      c.icon = $("#cIcon").value; c.available = swv("cAvail"); c.hidden = swv("cHidden");
      if (isNew) { c.sort = (c.parentId ? subsOf(c.parentId) : mains()).length + 1; menu.categories.push(c); }
      else Object.assign(catById(c.id), c);
      closeSheet(); markDirty(); render(); toast(isNew ? "القسم اتضاف" : "التعديل اتطبّق");
    }]]);
}
function deleteItem(id, fromEditor) {
  const p = menu.products.find(x => x.id === id); if (!p) return;
  confirmBox("حذف «" + (L(p.name) || "الصنف") + "»؟", "الحذف نهائي ومفيش سلة محذوفات. (بيبان للزبون بعد «نشر التعديلات»)", "حذف").then(ok => {
    if (!ok) return fromEditor ? itemEditor(id) : undefined;
    forgetImage(p.image); menu.products = menu.products.filter(x => x.id !== id); markDirty(); render(); toast("الصنف اتمسح"); });
}
function deleteAd(id, fromEditor) {
  const a = menu.ads.find(x => x.id === id); if (!a) return;
  confirmBox("حذف الإعلان؟", "الحذف نهائي.", "حذف").then(ok => {
    if (!ok) return fromEditor ? adEditor(id) : undefined;
    forgetImage(a.image); menu.ads = menu.ads.filter(x => x.id !== id); markDirty(); render(); toast("الإعلان اتمسح"); });
}
function deleteCat(id, fromRow) {
  const c = catById(id), subs = subsOf(id), items = (menu.products || []).filter(p => p.categoryId === id);
  if (subs.length) { const m = "جوه القسم ده أقسام فرعية. انقلها أو امسحها الأول."; return void ($("#cErr") && !fromRow ? $("#cErr").textContent = m : toast(m, true)); }
  const others = cats().filter(x => x.id !== id);
  sheet("حذف «" + (L(c.name) || "القسم") + "»", `<div class="form">
    ${items.length ? `<p>جوه القسم ده ${fmt(items.length)} صنف. تحب تعمل فيهم إيه؟</p>
      <div class="seg" id="dMode"><button type="button" aria-pressed="true" data-v="move">أنقلهم لقسم تاني</button><button type="button" aria-pressed="false" data-v="del">أمسحهم معاه</button></div>
      <label class="f" id="dTo">ينقلوا لـ<select class="in" id="dTarget">${others.map(o => `<option value="${o.id}">${esc(catPath(o.id))}</option>`).join("")}</select></label>` : `<p>القسم فاضي. الحذف نهائي ومفيش سلة محذوفات.</p>`}
    <p class="err" id="dErr"></p></div>`,
    [["رجوع", "", () => fromRow ? closeSheet() : catEditor(id)], ["حذف نهائي", "danger", () => {
      if (items.length) {
        const mode = $("#dMode [aria-pressed=true]").dataset.v;
        if (mode === "move") { if (!others.length) return void ($("#dErr").textContent = "مفيش قسم تاني تنقل له."); const to = $("#dTarget").value; items.forEach(p => p.categoryId = to); }
        else { items.forEach(p => forgetImage(p.image)); menu.products = menu.products.filter(p => p.categoryId !== id); }
      }
      menu.categories = menu.categories.filter(x => x.id !== id); closeSheet(); markDirty(); render(); toast("القسم اتمسح");
    }]]);
  segBind("#dMode", v => $("#dTo") && ($("#dTo").hidden = v !== "move"));
}

/* ═════════ PRODUCTS ═════════ */
function thumbHTML(url) { return url ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">` : I.img; }
function itemRow(p, i) {
  const os = offerStatus(p.offer);
  return `<div class="item ${p.available === false ? "off" : ""}" style="--i:${i}">
    <div class="thumb">${thumbHTML(p.image)}</div>
    <div class="t" data-act="editItem" data-id="${p.id}"><b>${esc(L(p.name)) || "بدون اسم"}</b>
      <small>${priceSummary(p)} ${esc(L(menu.settings.currency) || "ج.م")} · ${esc(catPath(p.categoryId))}</small>
      <span class="row" style="gap:4px;margin-top:2px">${os && os !== "draft" ? pill(os) : ""}${p.isNew ? '<span class="pill new">جديد</span>' : ""}${p.featured ? '<span class="pill scheduled">الأكثر طلبًا</span>' : ""}</span></div>
    ${rowActs("Item", p.id, L(p.name))}
    <button class="switch" role="switch" aria-checked="${p.available !== false}" aria-label="متاح" data-act="itemAvail" data-id="${p.id}"></button>
  </div>`;
}
function itemsView() {
  const q = filt.q.trim().toLowerCase();
  let list = prods();
  if (filt.cat === "offers") list = list.filter(p => ["active", "scheduled"].includes(offerStatus(p.offer)));
  else if (filt.cat === "off") list = list.filter(p => p.available === false);
  else if (filt.cat === "new") list = list.filter(p => p.isNew);
  else if (filt.cat === "top") list = list.filter(p => p.featured);
  else if (filt.cat !== "all") { const ids = [filt.cat, ...subsOf(filt.cat).map(s => s.id)]; list = list.filter(p => ids.includes(p.categoryId)); }
  if (q) list = list.filter(p => (p.name?.ar + " " + p.name?.en).toLowerCase().includes(q));
  const chips = [["all", "الكل"], ["offers", "عليها عروض"], ["new", "جديد"], ["top", "الأكثر طلبًا"], ["off", "غير متاح"], ...mains().map(c => [c.id, L(c.name)])];
  return `<div class="row"><h1 class="grow">الأصناف</h1><button class="btn" data-act="excel">${I.sheet}Excel</button><button class="btn primary" data-act="newItem">${I.plus}صنف</button></div>
  <input class="search" id="itemQ" type="search" placeholder="ابحث باسم الصنف…" value="${esc(filt.q)}">
  <div class="filters">${chips.map(([k, n]) => `<button class="chip ${filt.cat === k ? "on" : ""}" data-act="filt" data-id="${k}">${esc(n)}</button>`).join("")}</div>
  ${list.length ? `<div class="list" id="itemList">${list.map(itemRow).join("")}</div>` : `<div class="empty">مفيش أصناف هنا.</div>`}`;
}
function variantRows(vs) {
  return vs.map((v, k) => `<div class="vrow" data-k="${k}">
    <label class="f">الرمز<input class="in v-id" dir="ltr" value="${esc(v.id)}" placeholder="S"></label>
    <label class="f">الاسم<input class="in v-ar" value="${esc(v.label?.ar || "")}" placeholder="صغير"></label>
    <label class="f">السعر<input class="in v-price" inputmode="decimal" value="${v.price ?? ""}"></label>
    <button type="button" class="x" data-act="vDel" aria-label="شيل الحجم">${I.x}</button></div>`).join("");
}
function addonRows(list) {
  return list.map(a => `<div class="vrow arow" style="grid-template-columns:1.2fr 1fr .8fr 40px">
    <label class="f">الاسم<input class="in a-ar" value="${esc(a.name?.ar || "")}" placeholder="جبنة زيادة"></label>
    <label class="f">بالإنجليزي<input class="in a-en" dir="ltr" value="${esc(a.name?.en || "")}"></label>
    <label class="f">السعر<input class="in a-price" inputmode="decimal" value="${a.price ?? ""}"></label>
    <button type="button" class="x" data-act="adDel" aria-label="شيل الإضافة">${I.x}</button></div>`).join("");
}
function readAddons() { return $$("#adList .arow").map(r => ({ name: { ar: r.querySelector(".a-ar").value.trim(), en: r.querySelector(".a-en").value.trim() }, price: num(r.querySelector(".a-price").value), _el: r })); }
function readVariants() {
  return $$("#vList .vrow").map(r => ({ id: r.querySelector(".v-id").value.trim(), label: { ar: r.querySelector(".v-ar").value.trim(), en: r.querySelector(".v-id").value.trim() }, price: num(r.querySelector(".v-price").value), _el: r }));
}
function itemEditor(id, catId) {
  const isNew = !id;
  const firstCat = catId || (filt.cat !== "all" && catById(filt.cat) ? filt.cat : cats()[0]?.id);
  const p = isNew ? { id: nid("p"), categoryId: firstCat, name: { ar: "", en: "" }, desc: { ar: "", en: "" }, priceType: "single", price: "", variants: [],
    image: "", available: true, service: "both", isNew: false, featured: false } : clone(menu.products.find(x => x.id === id));
  if (!cats().length) return toast("اعمل قسم الأول قبل ما تضيف أصناف.", true);
  const o = p.offer || { enabled: false, type: "percent", value: "", endAt: null };
  const vs = p.variants?.length ? p.variants : [{ id: "S", label: { ar: "صغير" }, price: "" }, { id: "M", label: { ar: "وسط" }, price: "" }, { id: "L", label: { ar: "كبير" }, price: "" }];
  sheet(isNew ? "صنف جديد" : "تعديل الصنف", `<div class="form">
    <fieldset><legend>الصورة</legend>${imgPicker("pImg", p.image, "items")}</fieldset>
    <fieldset><legend>البيانات</legend>
      <div class="two stack"><label class="f">الاسم بالعربي<input class="in" id="pAr" value="${esc(p.name?.ar)}"></label>
      <label class="f">الاسم بالإنجليزي<input class="in" id="pEn" dir="ltr" value="${esc(p.name?.en)}"></label></div>
      <label class="f">الوصف بالعربي<textarea class="in" id="pDAr">${esc(p.desc?.ar)}</textarea></label>
      <label class="f">الوصف بالإنجليزي<textarea class="in" id="pDEn" dir="ltr">${esc(p.desc?.en)}</textarea></label>
      <label class="f">القسم<select class="in" id="pCat">${cats().filter(c => !c.parentId).map(m => `<option value="${m.id}" ${p.categoryId === m.id ? "selected" : ""}>${esc(L(m.name))}</option>` +
        subsOf(m.id).map(s => `<option value="${s.id}" ${p.categoryId === s.id ? "selected" : ""}>— ${esc(L(m.name))} › ${esc(L(s.name))}</option>`).join("")).join("")}</select></label>
    </fieldset>
    <fieldset><legend>السعر</legend>
      <div class="seg" id="pType"><button type="button" data-v="single" aria-pressed="${p.priceType !== "variants"}">سعر واحد</button><button type="button" data-v="variants" aria-pressed="${p.priceType === "variants"}">أحجام وأسعار</button></div>
      <label class="f" id="pSingle">السعر (${esc(L(menu.settings.currency) || "ج.م")})<input class="in" id="pPrice" inputmode="decimal" value="${p.price ?? ""}"><small>تقدر تكتب أرقام عربي أو إنجليزي، وكسور زي ٢٢٫٥</small></label>
      <div id="pVars"><div id="vList" style="display:flex;flex-direction:column;gap:8px">${variantRows(vs)}</div>
        <button type="button" class="btn sm" data-act="vAdd" style="margin-top:8px">${I.plus}حجم</button></div>
    </fieldset>
    <fieldset><legend>الإتاحة</legend>
      ${sw("pAvail", p.available !== false, "متاح", "لو قفلته، بيفضل ظاهر للزبون باهت ومكتوب عليه «غير متاح حاليًا».")}
      <label class="f">نوع الخدمة</label>
      <div class="seg" id="pSvc">${SERVICE.map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${(p.service || "both") === k}">${n}</button>`).join("")}</div>
      ${sw("pNew", !!p.isNew, "جديد", "بيظهر في قسم «جديد» وعليه شارة.")}
      ${sw("pTop", !!p.featured, "الأكثر طلبًا", "بيظهر في قسم «الأكثر طلبًا» أول المنيو.")}
    </fieldset>
    <fieldset><legend>إضافات (اختياري)</legend>
      <p class="hint" style="margin:0">زي «جبنة زيادة» أو «صوص». بتظهر في تفاصيل الصنف بسعرها.</p>
      <div id="adList" style="display:flex;flex-direction:column;gap:8px">${addonRows(p.addons || [])}</div>
      <button type="button" class="btn sm" data-act="adAdd">${I.plus}إضافة</button>
    </fieldset>
    <fieldset><legend>العرض</legend>
      ${sw("oOn", !!p.offer && o.enabled !== false, "عليه عرض", "بيظهر في «عروضنا» لحد تاريخ الانتهاء، وبعدها بيختفي لوحده.")}
      <div id="oBox" class="form">
        <div class="seg" id="oType">${OFFER_TYPES.map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${o.type === k}">${n}</button>`).join("")}</div>
        <label class="f" data-o="percent">نسبة الخصم ٪<input class="in" id="oPct" inputmode="decimal" value="${o.type === "percent" ? o.value ?? "" : ""}"><small>بتتطبق على كل الأحجام.</small></label>
        <label class="f" data-o="amount">مبلغ الخصم<input class="in" id="oAmt" inputmode="decimal" value="${o.type === "amount" ? o.value ?? "" : ""}"><small>بيتطرح من سعر كل حجم.</small></label>
        <div data-o="price" id="oPrices"></div>
        <div data-o="custom" class="two stack"><label class="f">نص العرض بالعربي<input class="in" id="oTAr" value="${esc(o.text?.ar)}" placeholder="اشتري ٢ والتالت هدية"></label>
          <label class="f">نص العرض بالإنجليزي<input class="in" id="oTEn" dir="ltr" value="${esc(o.text?.en)}"></label></div>
        <p class="hint" data-o="free_delivery">الزبون هيشوف «توصيل مجاني» على الصنف، والسعر زي ما هو.</p>
        <div class="two stack"><label class="f">يبدأ<input class="in" id="oStart" type="datetime-local" value="${toLocal(o.startAt)}"><small>فاضي = من دلوقتي</small></label>
          <label class="f">ينتهي<input class="in" id="oEnd" type="datetime-local" value="${toLocal(o.endAt)}"></label></div>
        <div class="row" style="gap:6px"><span class="hint">مدة سريعة:</span>${[[1, "يوم"], [3, "٣ أيام"], [7, "أسبوع"], [30, "شهر"]].map(([d, n]) => `<button type="button" class="chip" data-act="oDur" data-d="${d}">${n}</button>`).join("")}</div>
        <p class="hint" id="oPrev"></p>
      </div>
    </fieldset>
    <p class="err" id="pErr"></p></div>`,
    [isNew ? null : ["حذف", "danger", () => deleteItem(id, true)],
     ["تطبيق", "primary", () => applyItem(p, isNew)]]);

  const showType = v => { $("#pSingle").hidden = v !== "single"; $("#pVars").hidden = v !== "variants"; offerPrices(); preview(); };
  segBind("#pType", showType); showType(p.priceType === "variants" ? "variants" : "single");
  segBind("#pSvc");
  const showOffer = () => { const on = swv("oOn"); $("#oBox").hidden = !on; const t = segv("#oType"); $$("[data-o]").forEach(e => e.hidden = e.dataset.o !== t); preview(); };
  segBind("#oType", showOffer); $("#oOn").addEventListener("click", () => setTimeout(showOffer)); showOffer();
  function offerPrices() {
    const multi = segv("#pType") === "variants", prev = o.type === "price" ? o : {};
    $("#oPrices").innerHTML = multi
      ? `<div class="two">${readVariants().filter(v => v.id).map(v => `<label class="f">سعر ${esc(v.label.ar || v.id)} في العرض<input class="in o-vp" data-v="${esc(v.id)}" inputmode="decimal" value="${prev.prices?.[v.id] ?? ""}"><small>بدل ${isNaN(v.price) ? "—" : fmt(v.price)}</small></label>`).join("")}</div>`
      : `<label class="f">السعر الجديد<input class="in" id="oNew" inputmode="decimal" value="${prev.price ?? ""}"><small>بدل ${isNaN(num($("#pPrice").value)) ? "—" : fmt(num($("#pPrice").value))}</small></label>`;
  }
  function preview() {
    if (!swv("oOn")) return void ($("#oPrev").textContent = "");
    const t = segv("#oType"), multi = segv("#pType") === "variants";
    const basePrices = multi ? readVariants().filter(v => v.id && !isNaN(v.price)).map(v => [v.label.ar || v.id, v.price, v.id]) : [["", num($("#pPrice").value), null]];
    const after = ([n, b, vid]) => {
      let a = b; if (t === "percent") a = Math.round(b * (1 - (num($("#oPct").value) || 0) / 100)); else if (t === "amount") a = Math.max(0, b - (num($("#oAmt").value) || 0));
      else if (t === "price") a = multi ? num($(`.o-vp[data-v="${CSS.escape(vid)}"]`)?.value) : num($("#oNew")?.value); else return null;
      return isNaN(a) || isNaN(b) ? null : `${n ? n + ": " : ""}${fmt(a)} بدل ${fmt(b)}`;
    };
    const lines = basePrices.map(after).filter(Boolean);
    $("#oPrev").textContent = lines.length ? "الزبون هيشوف: " + lines.join(" · ") : "";
  }
  $("#sheetBody").addEventListener("input", e => { if (e.target.closest("#vList")) offerPrices(); preview(); });
  $("#sheetBody").addEventListener("click", e => {
    const a = e.target.closest("[data-act]")?.dataset.act;
    if (a === "vAdd") { const list = readVariants().map(v => ({ id: v.id, label: v.label, price: isNaN(v.price) ? "" : v.price })); list.push({ id: "", label: { ar: "" }, price: "" }); $("#vList").innerHTML = variantRows(list); offerPrices(); }
    if (a === "vDel") { e.target.closest(".vrow").remove(); offerPrices(); preview(); }
    if (a === "adAdd") { const list = readAddons().map(x => ({ name: x.name, price: isNaN(x.price) ? "" : x.price })); list.push({ name: { ar: "", en: "" }, price: "" }); $("#adList").innerHTML = addonRows(list); $("#adList .arow:last-child .a-ar").focus(); }
    if (a === "adDel") e.target.closest(".arow").remove();
    if (a === "oDur") { const s = $("#oStart").value ? new Date($("#oStart").value) : new Date(); $("#oEnd").value = toLocal(new Date(+s + e.target.dataset.d * 864e5).toISOString()); }
  });
}
function applyItem(p, isNew) {
  const err = m => { $("#pErr").textContent = m; $("#pErr").scrollIntoView({ block: "center", behavior: "smooth" }); };
  $$("#sheetBody .in.bad").forEach(x => x.classList.remove("bad"));
  p.name = { ar: $("#pAr").value.trim(), en: $("#pEn").value.trim() };
  if (!p.name.ar && !p.name.en) { $("#pAr").classList.add("bad"); return err("اكتب اسم الصنف."); }
  p.desc = { ar: $("#pDAr").value.trim(), en: $("#pDEn").value.trim() };
  p.categoryId = $("#pCat").value;
  const img = $("#pImg").value.trim(); if (img && !httpsOk(img) && !img.startsWith("blob:")) { $("#pImg").classList.add("bad"); return err("رابط الصورة لازم يبدأ بـ https://"); }
  if (p.image && p.image !== img) forgetImage(p.image); p.image = img;
  p.priceType = segv("#pType");
  if (p.priceType === "single") {
    const v = num($("#pPrice").value); if (isNaN(v) || v < 0) { $("#pPrice").classList.add("bad"); return err("السعر لازم يكون رقم صحيح (مثال: ٤٥ أو ٢٢٫٥)."); }
    p.price = v; delete p.variants;
  } else {
    const vs = readVariants(); if (!vs.length) return err("ضيف حجم واحد على الأقل.");
    const seen = new Set();
    for (const v of vs) {
      if (!v.id) { v._el.querySelector(".v-id").classList.add("bad"); return err("كل حجم محتاج رمز (زي S أو M أو L)."); }
      if (seen.has(v.id)) { v._el.querySelector(".v-id").classList.add("bad"); return err("الرمز «" + v.id + "» متكرر."); } seen.add(v.id);
      if (isNaN(v.price) || v.price < 0) { v._el.querySelector(".v-price").classList.add("bad"); return err("سعر الحجم «" + v.id + "» مش رقم صحيح."); }
    }
    p.variants = vs.map(v => ({ id: v.id, label: { ar: v.label.ar || v.id, en: v.id }, price: v.price })); delete p.price;
  }
  p.available = swv("pAvail"); p.service = segv("#pSvc"); p.isNew = swv("pNew"); p.featured = swv("pTop");
  const ads = readAddons().filter(x => x.name.ar || x.name.en || x._el.querySelector(".a-price").value.trim());
  for (const x of ads) {
    if (!x.name.ar && !x.name.en) { x._el.querySelector(".a-ar").classList.add("bad"); return err("كل إضافة محتاجة اسم."); }
    if (isNaN(x.price) || x.price < 0) { x._el.querySelector(".a-price").classList.add("bad"); return err("سعر الإضافة «" + (x.name.ar || x.name.en) + "» مش رقم صحيح."); }
  }
  if (ads.length) p.addons = ads.map(x => ({ name: x.name, price: x.price })); else delete p.addons;
  if (swv("oOn")) {
    const t = segv("#oType"), o = { enabled: true, type: t, startAt: fromLocal($("#oStart").value), endAt: fromLocal($("#oEnd").value) };
    if (!o.endAt) { $("#oEnd").classList.add("bad"); return err("حدّد تاريخ انتهاء العرض."); }
    if (o.startAt && new Date(o.startAt) >= new Date(o.endAt)) { $("#oEnd").classList.add("bad"); return err("تاريخ الانتهاء لازم يكون بعد البداية."); }
    const bases = p.priceType === "variants" ? p.variants.map(v => [v.id, v.price]) : [[null, p.price]];
    if (t === "percent") { o.value = num($("#oPct").value); if (isNaN(o.value) || o.value <= 0 || o.value >= 100) { $("#oPct").classList.add("bad"); return err("النسبة لازم تكون بين ١ و ٩٩."); } }
    if (t === "amount") { o.value = num($("#oAmt").value); if (isNaN(o.value) || o.value <= 0) { $("#oAmt").classList.add("bad"); return err("اكتب مبلغ الخصم."); }
      if (bases.some(([, b]) => o.value >= b)) { $("#oAmt").classList.add("bad"); return err("الخصم أكبر من أو بيساوي سعر حجم من الأحجام."); } }
    if (t === "price") {
      if (p.priceType === "variants") { o.prices = {};
        for (const [vid, b] of bases) { const el = $(`.o-vp[data-v="${CSS.escape(vid)}"]`), v = num(el?.value);
          if (el?.value.trim() === "") continue;
          if (isNaN(v) || v < 0 || v >= b) { el?.classList.add("bad"); return err("سعر العرض لحجم «" + vid + "» لازم يكون أقل من سعره الأصلي."); } o.prices[vid] = v; }
        if (!Object.keys(o.prices).length) return err("اكتب سعر العرض لحجم واحد على الأقل.");
      } else { o.price = num($("#oNew").value); if (isNaN(o.price) || o.price < 0 || o.price >= p.price) { $("#oNew").classList.add("bad"); return err("السعر الجديد لازم يكون أقل من " + fmt(p.price) + "."); } }
    }
    if (t === "custom") { o.text = { ar: $("#oTAr").value.trim(), en: $("#oTEn").value.trim() }; if (!o.text.ar && !o.text.en) { $("#oTAr").classList.add("bad"); return err("اكتب نص العرض."); } }
    p.offer = o;
  } else if (p.offer) p.offer.enabled = false;
  if (isNew) { p.sort = (menu.products || []).filter(x => x.categoryId === p.categoryId).length + 1; menu.products.push(p); }
  else { const k = menu.products.findIndex(x => x.id === p.id); menu.products[k] = p; }
  closeSheet(); markDirty(); render(); toast(isNew ? "الصنف اتضاف" : "التعديل اتطبّق");
}

/* ═════════ ADS ═════════ */
function adsView() {
  const list = (menu.ads || []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return `<div class="row"><h1 class="grow">الإعلانات</h1><button class="btn primary" data-act="newAd">${I.plus}إعلان</button></div>
  <p class="hint">الإعلانات بتتقلب لوحدها فوق المنيو، ولو الزبون داس على إعلان بيثبت ١٥ ثانية.</p>
  ${list.length ? `<div class="list">${list.map((a, i) => `<div class="item ${a.enabled === false ? "off" : ""}" style="--i:${i}">
    <div class="order"><button data-act="adUp" data-id="${a.id}" ${i === 0 ? "disabled" : ""} aria-label="لفوق">${I.up}</button><button data-act="adDown" data-id="${a.id}" ${i === list.length - 1 ? "disabled" : ""} aria-label="لتحت">${I.down}</button></div>
    <div class="thumb" style="background:${a.image ? "var(--soft)" : (AD_THEMES.find(t => t[0] === a.theme) || AD_THEMES[0])[1]}">${a.image ? thumbHTML(a.image) : ""}</div>
    <div class="t" data-act="editAd" data-id="${a.id}"><b>${esc(L(a.title)) || "بدون عنوان"}</b><small>${esc(L(a.kicker))}</small><span>${pill(adStatus(a))}</span></div>
    ${rowActs("Ad", a.id, L(a.title))}
    <button class="switch" role="switch" aria-checked="${a.enabled !== false}" aria-label="ظاهر" data-act="adOn" data-id="${a.id}"></button></div>`).join("")}</div>` : `<div class="empty">مفيش إعلانات.</div>`}`;
}
function adEditor(id) {
  const isNew = !id, a = isNew ? { id: nid("ad"), enabled: true, theme: "green", icon: "plate", image: "", kicker: { ar: "", en: "" }, title: { ar: "", en: "" }, body: { ar: "", en: "" } } : clone(menu.ads.find(x => x.id === id));
  sheet(isNew ? "إعلان جديد" : "تعديل الإعلان", `<div class="form">
    <fieldset><legend>النص</legend>
      <div class="two stack"><label class="f">سطر صغير فوق<input class="in" id="aKAr" value="${esc(a.kicker?.ar)}" placeholder="خصم ٢٠٪"></label><label class="f">بالإنجليزي<input class="in" id="aKEn" dir="ltr" value="${esc(a.kicker?.en)}"></label></div>
      <div class="two stack"><label class="f">العنوان<input class="in" id="aTAr" value="${esc(a.title?.ar)}"></label><label class="f">بالإنجليزي<input class="in" id="aTEn" dir="ltr" value="${esc(a.title?.en)}"></label></div>
      <div class="two stack"><label class="f">سطر تحت<input class="in" id="aBAr" value="${esc(a.body?.ar)}"></label><label class="f">بالإنجليزي<input class="in" id="aBEn" dir="ltr" value="${esc(a.body?.en)}"></label></div>
    </fieldset>
    <fieldset><legend>الشكل</legend>
      <label class="f">لون الخلفية</label><div class="swatches" id="aTheme">${AD_THEMES.map(([k, g, n]) => `<button type="button" class="sw" style="background:${g}" data-v="${k}" aria-label="${n}" aria-pressed="${a.theme === k}"></button>`).join("")}</div>
      <label class="f">الأيقونة<select class="in" id="aIcon">${ICONS_LIST.map(([k, n]) => `<option value="${k}" ${a.icon === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="f">أو صورة بدل اللون والأيقونة</label>${imgPicker("aImg", a.image, "ads")}
    </fieldset>
    <fieldset><legend>المدة</legend>
      <div class="two stack"><label class="f">يبدأ<input class="in" id="aStart" type="datetime-local" value="${toLocal(a.startAt)}"><small>فاضي = من دلوقتي</small></label>
      <label class="f">ينتهي<input class="in" id="aEnd" type="datetime-local" value="${toLocal(a.endAt)}"><small>فاضي = لحد ما توقفه</small></label></div>
      ${sw("aOn", a.enabled !== false, "ظاهر", "")}
    </fieldset><p class="err" id="aErr"></p></div>`,
    [isNew ? null : ["حذف", "danger", () => deleteAd(id, true)],
     ["تطبيق", "primary", () => {
      a.kicker = { ar: $("#aKAr").value.trim(), en: $("#aKEn").value.trim() }; a.title = { ar: $("#aTAr").value.trim(), en: $("#aTEn").value.trim() };
      a.body = { ar: $("#aBAr").value.trim(), en: $("#aBEn").value.trim() };
      if (!a.title.ar && !a.title.en) return void ($("#aErr").textContent = "اكتب عنوان الإعلان.");
      const img = $("#aImg").value.trim(); if (img && !httpsOk(img) && !img.startsWith("blob:")) return void ($("#aErr").textContent = "رابط الصورة لازم يبدأ بـ https://");
      if (a.image && a.image !== img) forgetImage(a.image);
      a.image = img; a.theme = $("#aTheme [aria-pressed=true]")?.dataset.v || "green"; a.icon = $("#aIcon").value;
      a.startAt = fromLocal($("#aStart").value); a.endAt = fromLocal($("#aEnd").value); a.enabled = swv("aOn");
      if (a.startAt && a.endAt && new Date(a.startAt) >= new Date(a.endAt)) return void ($("#aErr").textContent = "تاريخ الانتهاء لازم يكون بعد البداية.");
      if (isNew) { a.sort = menu.ads.length + 1; menu.ads.push(a); } else menu.ads[menu.ads.findIndex(x => x.id === a.id)] = a;
      closeSheet(); markDirty(); render(); toast(isNew ? "الإعلان اتضاف" : "التعديل اتطبّق");
    }]]);
  segBind("#aTheme");
}

/* ═════════ SETTINGS (bound straight to the draft) ═════════ */
const bind = (path, v, attrs = "") => `<input class="in" data-bind="${path}" value="${esc(v)}" ${attrs}>`;
function settingsView() {
  const b = menu.brand, s = menu.settings, c = menu.contact;
  const hours = DAYS.map((d, k) => { const h = c.hours.find(x => x.day === k); return `<span>${d}</span>
    <input class="in" type="time" data-hour="${k}" data-f="open" value="${h?.open || ""}" ${h ? "" : "disabled"} aria-label="يفتح ${d}">
    <input class="in" type="time" data-hour="${k}" data-f="close" value="${h?.close || ""}" ${h ? "" : "disabled"} aria-label="يقفل ${d}">
    <button class="switch" role="switch" aria-checked="${!!h}" aria-label="شغّال ${d}" data-act="dayOn" data-id="${k}"></button>`; }).join("");
  return `<h1>الإعدادات</h1>
  <p class="hint">أي تغيير هنا بيتحفظ في التعديلات على طول، وبيوصل للزبون لما تدوس «نشر التعديلات».</p>
  <fieldset><legend>QR Code للترابيزات</legend>
    <div class="qrbox"><canvas id="qrCanvas" aria-label="QR Code لرابط المنيو"></canvas>
      <div class="grow"><p class="hint" style="margin:0">اطبعه وحطه على الترابيزات والكاشير وباب المحل. الزبون يصوّره بكاميرا الموبايل فيفتح المنيو على طول.</p>
        <button class="btn primary" data-act="qrDl">تنزيل الصورة (PNG للطباعة)</button><p class="hint" id="qrErr" style="margin:0"></p></div></div>
  </fieldset>
  <fieldset><legend>طباعة المنيو (A4)</legend>
    <div class="row">
      <div class="grow"><p class="hint" style="margin:0">معاينة المنيو وطباعته أو حفظه كملف PDF بتصميم A4 احترافي، مع إمكانية تخصيص الألوان والصور الزخرفية للأقسام.</p></div>
      <button class="btn primary" type="button" data-act="menuPrint">
        <svg class="ic" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
        فتح طباعة المنيو
      </button>
    </div>
  </fieldset>
  <fieldset><legend>هوية المطعم</legend>
    <div class="two stack"><label class="f">الاسم بالعربي${bind("brand.name.ar", b.name.ar)}</label><label class="f">بالإنجليزي${bind("brand.name.en", b.name.en, 'dir="ltr"')}</label></div>
    <div class="two stack"><label class="f">العبارة التعريفية${bind("brand.tagline.ar", b.tagline.ar)}</label><label class="f">بالإنجليزي${bind("brand.tagline.en", b.tagline.en, 'dir="ltr"')}</label></div>
    <label class="f">نبذة عن المطعم<textarea class="in" data-bind="brand.about.ar">${esc(b.about.ar)}</textarea></label>
    <label class="f">بالإنجليزي<textarea class="in" dir="ltr" data-bind="brand.about.en">${esc(b.about.en)}</textarea></label>
    <div class="two"><label class="f">حرف اللوجو${bind("brand.initial.ar", b.initial.ar, 'maxlength="2"')}<small>بيظهر لو مفيش صورة لوجو</small></label><label class="f">بالإنجليزي${bind("brand.initial.en", b.initial.en, 'maxlength="2" dir="ltr"')}</label></div>
    <label class="f">صورة اللوجو</label>${imgPicker("bLogo", b.logoUrl || "", "brand", true)}
    <label class="f">لون المطعم<small>كل الألوان متجرّبة إنها تفضل مقروءة في الفاتح والداكن.</small></label>
    <div class="swatches" id="bPal">${PALETTES.map(([k, c2, n]) => `<button type="button" class="sw" style="background:${c2}" data-v="${k}" aria-label="${n}" aria-pressed="${(b.palette || "green") === k}"></button>`).join("")}</div>
  </fieldset>
  <fieldset><legend>زرار «اطلب أونلاين»</legend>
    <div class="check"><span class="grow">ظاهر للزبون<small>بيفتح رابط تطبيق أو موقع الطلبات. المنيو نفسه مابيعملش طلبات.</small></span><button class="switch" role="switch" aria-checked="${!!c.orderEnabled}" data-act="toggle" data-id="contact.orderEnabled"></button></div>
    <label class="f">الرابط${bind("contact.orderUrl", c.orderUrl || "", 'dir="ltr" inputmode="url" placeholder="https://" data-url="1"')}</label>
    <div class="two stack"><label class="f">نص الزرار${bind("contact.orderLabel.ar", c.orderLabel.ar)}</label><label class="f">بالإنجليزي${bind("contact.orderLabel.en", c.orderLabel.en, 'dir="ltr"')}</label></div>
  </fieldset>
  <fieldset><legend>التواصل</legend>
    <div class="two stack"><label class="f">التليفون${bind("contact.phone", c.phone || "", 'dir="ltr" inputmode="tel"')}</label><label class="f">واتساب (بكود الدولة)${bind("contact.whatsapp", c.whatsapp || "", 'dir="ltr" inputmode="tel" placeholder="2010…"')}</label></div>
    <div class="two stack"><label class="f">العنوان${bind("contact.address.ar", c.address.ar)}</label><label class="f">بالإنجليزي${bind("contact.address.en", c.address.en, 'dir="ltr"')}</label></div>
    <label class="f">رابط الخريطة${bind("contact.mapsUrl", c.mapsUrl || "", 'dir="ltr" inputmode="url" placeholder="https://maps.google.com/…" data-url="1"')}</label>
    <label class="f">السوشيال ميديا</label>
    <div class="list" id="socials">${c.social.map((x, k) => `<div class="two" style="grid-template-columns:1fr 2fr 40px"><input class="in" data-soc="${k}" data-f="name" value="${esc(x.name)}" placeholder="Facebook"><input class="in" dir="ltr" data-soc="${k}" data-f="url" value="${esc(x.url)}" placeholder="https://"><button class="btn sm danger" data-act="socDel" data-id="${k}" aria-label="شيل">${I.x}</button></div>`).join("")}</div>
    <button class="btn sm" data-act="socAdd">${I.plus}رابط</button>
  </fieldset>
  <fieldset><legend>الفروع (اختياري)</legend>
    <p class="hint" style="margin:0">لو المطعم له أكتر من فرع، بتظهر في «عن المطعم» بأرقامها وخرايطها.</p>
    <div class="list" id="branches">${(c.branches || []).map((br, k) => `<div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div class="two stack"><label class="f">اسم الفرع<input class="in" data-br="${k}" data-f="name.ar" value="${esc(br.name?.ar)}"></label><label class="f">بالإنجليزي<input class="in" dir="ltr" data-br="${k}" data-f="name.en" value="${esc(br.name?.en)}"></label></div>
      <div class="two stack"><label class="f">العنوان<input class="in" data-br="${k}" data-f="address.ar" value="${esc(br.address?.ar)}"></label><label class="f">بالإنجليزي<input class="in" dir="ltr" data-br="${k}" data-f="address.en" value="${esc(br.address?.en)}"></label></div>
      <div class="two stack"><label class="f">التليفون<input class="in" dir="ltr" inputmode="tel" data-br="${k}" data-f="phone" value="${esc(br.phone)}"></label><label class="f">واتساب (بكود الدولة)<input class="in" dir="ltr" inputmode="tel" data-br="${k}" data-f="whatsapp" value="${esc(br.whatsapp)}" placeholder="2010…"></label></div>
      <label class="f">رابط الخريطة<input class="in" dir="ltr" inputmode="url" data-br="${k}" data-f="mapsUrl" value="${esc(br.mapsUrl)}" placeholder="https://"></label>
      <button class="btn sm danger" data-act="brDel" data-id="${k}">${I.x}شيل الفرع</button></div>`).join("")}</div>
    <button class="btn sm" data-act="brAdd">${I.plus}فرع</button>
  </fieldset>
  <fieldset><legend>مواعيد العمل</legend><div class="hours">${hours}</div><p class="hint">اقفل اليوم اللي المطعم مابيشتغلش فيه.</p></fieldset>
  <fieldset><legend>الواجهة</legend>
    <label class="f">اللغة الافتراضية</label><div class="seg" data-seg="settings.defaultLang"><button type="button" data-v="ar" aria-pressed="${s.defaultLang !== "en"}">العربي</button><button type="button" data-v="en" aria-pressed="${s.defaultLang === "en"}">English</button></div>
    <label class="f">الثيم الافتراضي</label><div class="seg" data-seg="settings.defaultTheme">${[["system", "حسب الموبايل"], ["light", "فاتح"], ["dark", "داكن"]].map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${(s.defaultTheme || "system") === k}">${n}</button>`).join("")}</div>
    ${tog("settings.allowLang", s.allowLang !== false, "الزبون يقدر يغيّر اللغة")}
    ${tog("settings.allowTheme", s.allowTheme !== false, "الزبون يقدر يغيّر الثيم")}
    ${tog("settings.showOffersTab", s.showOffersTab !== false, "إظهار قسم «عروضنا»")}
    ${tog("settings.showNewTab", s.showNewTab !== false, "إظهار قسم «جديد»")}
    ${tog("settings.showFeaturedTab", s.showFeaturedTab !== false, "إظهار قسم «الأكثر طلبًا»")}
    <div class="two"><label class="f">العملة${bind("settings.currency.ar", s.currency.ar)}</label><label class="f">بالإنجليزي${bind("settings.currency.en", s.currency.en, 'dir="ltr"')}</label></div>
  </fieldset>
  <fieldset><legend>رفع الصور</legend><p class="hint" id="ghState">${gh === undefined ? "هيتأكد أول ما ترفع صورة." : gh ? "مفعّل" : "مش مفعّل. تقدر تحط روابط صور، أو تطلب من URCOD تفعيل الرفع من الجهاز."}</p></fieldset>`;
}
const tog = (path, on, label) => `<div class="check"><span class="grow">${label}</span><button class="switch" role="switch" aria-checked="${on}" data-act="toggle" data-id="${path}"></button></div>`;
function setPath(path, v) { const k = path.split("."); let o = menu; while (k.length > 1) { const x = k.shift(); o[x] ??= {}; o = o[x]; } o[k[0]] = v; }
function getPath(path) { return path.split(".").reduce((o, k) => o?.[k], menu); }

/* ═════════ shared form bits ═════════ */
const sw = (id, on, label, hint) => `<div class="check"><span class="grow">${label}${hint ? `<small>${hint}</small>` : ""}</span><button type="button" class="switch" role="switch" id="${id}" aria-checked="${on}" data-act="sw"></button></div>`;
const swv = id => $("#" + id).getAttribute("aria-checked") === "true";
const segv = sel => $(sel + " [aria-pressed=true]")?.dataset.v;
function segBind(sel, fn) { const el = $(sel); if (!el) return; el.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (!b) return;
  el.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); fn?.(b.dataset.v); }); }

/* ═════════ sheet + confirm ═════════ */
function sheet(title, body, actions) {
  $("#sheetT").textContent = title; $("#sheetBody").innerHTML = body;
  const old = $("#sheetBody"), fresh = old.cloneNode(true); old.replaceWith(fresh);     /* drop listeners from the previous editor */
  const acts = actions.filter(Boolean), left = acts.filter(a => a[1] === "danger"), right = acts.filter(a => a[1] !== "danger");
  $("#sheetFoot").innerHTML = left.map((a, i) => `<button class="btn ${a[1]}" data-k="l${i}">${a[0]}</button>`).join("") +
    `<div class="grow"><button class="btn" data-k="cancel">إلغاء</button>${right.map((a, i) => `<button class="btn ${a[1]}" data-k="r${i}">${a[0]}</button>`).join("")}</div>`;
  $("#sheetFoot").onclick = e => { const k = e.target.closest("[data-k]")?.dataset.k; if (!k) return; if (k === "cancel") return closeSheet();
    (k[0] === "l" ? left : right)[+k.slice(1)][2](); };
  $("#sheet").classList.add("open"); $("#scrim").classList.add("open"); document.body.style.overflow = "hidden"; $("#sheetBody").scrollTop = 0;
  setTimeout(() => $("#sheetBody input:not([type=file]),#sheetBody select")?.focus({ preventScroll: true }), 380);
}
function closeSheet() { $("#sheet").classList.remove("open"); $("#scrim").classList.remove("open"); document.body.style.overflow = ""; }
function confirmBox(title, text, okLabel) {
  return new Promise(res => { sheet(title, `<p>${text}</p>`, [[okLabel, "danger", () => { closeSheet(); res(true); }]]);
    const cancel = $("#sheetFoot [data-k=cancel]"); cancel.onclick = e => { e.stopPropagation(); closeSheet(); res(false); }; });
}
$("#scrim").onclick = closeSheet; $("#sheetX").onclick = closeSheet;
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#sheet").classList.contains("open")) closeSheet(); });

/* ═════════ images ═════════ */
function imgPicker(id, url, folder, bound) {
  return `<div class="imgbox" data-img="${id}" data-folder="${folder}" ${bound ? 'data-bound="brand.logoUrl"' : ""}>
    <div class="imgprev" id="${id}Prev">${url ? `<img src="${esc(url)}" alt="" onerror="this.remove()">` : I.img}</div>
    <div class="grow">
      <label class="btn sm">${I.upload}رفع صورة من الجهاز<input type="file" accept="image/*,.heic,.heif,.avif" hidden data-file="${id}"></label>
      <input class="in" id="${id}" dir="ltr" inputmode="url" placeholder="أو الصق رابط صورة https://" value="${esc(url)}" ${bound ? `data-bind="brand.logoUrl" data-url="1"` : ""}>
      ${url ? `<button type="button" class="btn sm ghost" data-act="imgClear" data-id="${id}">شيل الصورة</button>` : ""}
      <p class="hint" id="${id}Msg">أي صيغة صور (PNG، JPG، WebP، GIF…). بتتصغّر وتتضغط تلقائيًا.</p>
    </div></div>`;
}
async function loadGh() {
  if (gh !== undefined) return gh;
  if (C.useSample) return gh = null;
  try { const s = await FB.fs.getDoc(FB.fs.doc(FB.db, "secure", "github")); gh = s.exists() && s.data().token ? s.data() : null; } catch { gh = null; }
  const st = $("#ghState"); if (st) st.textContent = gh ? "مفعّل" : "مش مفعّل.";
  return gh;
}
async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch {}
  return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("decode")); im.src = u; });
}
async function compress(file, maxSide) {
  if (file.size > MAX_IMG) throw new Error("big");
  const src = await decode(file), w0 = src.width, h0 = src.height, k = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.round(w0 * k), h = Math.round(h0 * k), cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high";
  const toBlob = (type, q) => new Promise(r => cv.toBlob(r, type, q));
  ctx.drawImage(src, 0, 0, w, h);
  let blob = await toBlob("image/webp", .82);
  if (!blob || blob.type !== "image/webp") { ctx.globalCompositeOperation = "destination-over"; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); blob = await toBlob("image/jpeg", .85); }
  return { blob, ext: blob.type === "image/webp" ? "webp" : "jpg", w, h };
}
const b64 = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
async function ghUpload(blob, ext, folder) {
  const g = await loadGh(); if (!g) throw new Error("nogh");
  const path = `img/${folder}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const r = await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${path}`, { method: "PUT",
    headers: { Authorization: "Bearer " + g.token, Accept: "application/vnd.github+json" },
    body: JSON.stringify({ message: "menu image " + path, content: await b64(blob), branch: g.branch || "main" }) });
  if (!r.ok) throw new Error("gh" + r.status);
  return publicUrl(g, path);
}
const publicUrl = (g, path) => (g.publicBase || `https://${g.owner.toLowerCase()}.github.io/${g.repo}`).replace(/\/$/, "") + "/" + path;
function pathOf(url) { if (!gh || !url) return null; const b = publicUrl(gh, ""); return url.startsWith(b) ? url.slice(b.length) : null; }
function forgetImage(url) { if (url && !pendingDeletes.includes(url)) pendingDeletes.push(url); }
async function cleanupImages() {
  if (!gh) return; const json = JSON.stringify(menu);
  const cand = [...new Set([...pendingDeletes, ...sessionUploads])].filter(u => !json.includes(u));
  for (const u of cand) { const p = pathOf(u); if (!p) continue;
    try { const h = { Authorization: "Bearer " + gh.token, Accept: "application/vnd.github+json" };
      const g = await fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}/contents/${p}?ref=${gh.branch || "main"}`, { headers: h }); if (!g.ok) continue;
      const { sha } = await g.json();
      await fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}/contents/${p}`, { method: "DELETE", headers: h, body: JSON.stringify({ message: "remove unused " + p, sha, branch: gh.branch || "main" }) });
    } catch {} }
  pendingDeletes = []; sessionUploads = sessionUploads.filter(u => json.includes(u));
}
document.addEventListener("change", async e => {
  const f = e.target.closest("[data-file]"); if (!f || !f.files[0]) return;
  const id = f.dataset.file, box = f.closest("[data-img]"), msg = $("#" + id + "Msg"), prev = $("#" + id + "Prev"), file = f.files[0]; f.value = "";
  const max = box.dataset.folder === "ads" ? 1400 : box.dataset.folder === "brand" ? 512 : 900;
  msg.textContent = "بيتضغط…"; prev.insertAdjacentHTML("beforeend", '<span class="prog"></span>');
  try {
    const { blob, ext, w, h } = await compress(file, max);
    const local = URL.createObjectURL(blob); prev.innerHTML = `<img src="${local}" alt=""><span class="prog"></span>`;
    msg.textContent = `${fmt(w)}×${fmt(h)} · ${fmt(Math.round(blob.size / 1024))} ك.ب · بيترفع…`;
    let url;
    if (C.useSample) { url = local; msg.textContent = "وضع تجريبي: الصورة ظاهرة على الجهاز ده بس."; }
    else { url = await ghUpload(blob, ext, box.dataset.folder); sessionUploads.push(url); msg.textContent = `اترفعت (${fmt(Math.round(blob.size / 1024))} ك.ب). هتظهر للزبون بعد النشر بحوالي دقيقة.`; }
    const inp = $("#" + id); inp.value = url; inp.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (x) {
    const m = x.message;
    msg.textContent = m === "big" ? "الصورة أكبر من ١٥ ميجا." : m === "decode" ? "المتصفح ده مش بيفتح الصيغة دي (زي HEIC على أندرويد). جرّب صورة JPG أو PNG." :
      m === "nogh" ? "رفع الصور من الجهاز مش مفعّل للنسخة دي. حط رابط صورة، أو كلّم URCOD يفعّله." : m.startsWith("gh") ? "الرفع فشل (" + m.slice(2) + "). اتأكد من النت وجرّب تاني." : "حصلت مشكلة في الصورة.";
    msg.style.color = "var(--bad)";
  } finally { prev.querySelector(".prog")?.remove(); }
});

/* ═════════ Excel import / export ═════════ */
const xl = { file: null, last: null };
function excelSheet() {
  xl.file = null; xl.last = null;
  sheet("استيراد وتصدير Excel", `<div class="form">
    <fieldset><legend>١. جهّز الملف</legend>
      <div class="row"><a class="btn" href="templates/menu-template.xlsx" download="قالب-المنيو.xlsx">${I.dl}القالب الفاضي</a>
        <button type="button" class="btn" data-act="xlExport">${I.dl}المنيو الحالي</button></div>
      <p class="hint">ورقة واحدة اسمها «المنيو»، وصف لكل صنف، ومن غير أي أكواد: اكتب اسم القسم واسم الصنف والسعر. لو الصنف بأحجام اكتب في «الأحجام والأسعار»: صغير 30، وسط 40، كبير 50. والقالب فيه ورقة «مثال» تبص عليها. تعديل منيو موجود: نزّل «المنيو الحالي»، عدّل فيه، وارفعه تاني.</p>
    </fieldset>
    <fieldset><legend>٢. طريقة الاستيراد</legend>
      <div class="seg" id="xlMode"><button type="button" data-v="update" aria-pressed="true">تحديث المنيو الحالي</button><button type="button" data-v="create" aria-pressed="false">منيو جديد بالكامل</button></div>
      <p class="hint" id="xlHint"></p>
    </fieldset>
    <fieldset><legend>٣. اختار الملف</legend>
      <label class="btn primary">${I.upload}اختار ملف Excel<input type="file" id="xlFile" accept=".xlsx,.xlsm,.xls" hidden></label>
      <div id="xlOut"></div>
    </fieldset></div>`, [["تطبيق على التعديلات", "primary", applyImport]]);
  const hint = m => $("#xlHint").textContent = m === "create"
    ? "الأقسام والأصناف الحالية هتتشال، ويتحط مكانها اللي في الملف. الإعلانات والإعدادات مش هتتغيّر."
    : "الصنف اللي اسمه موجود في نفس القسم بيتعدّل، والجديد بيتضاف، واللي مش في الملف بيفضل زي ما هو. الخانة الفاضية = سيب القيمة القديمة.";
  hint("update"); applyBtn().disabled = true;
  segBind("#xlMode", m => { hint(m); if (xl.file) runAnalyze(); });
  $("#xlFile").addEventListener("change", e => { xl.file = e.target.files[0] || null; e.target.value = ""; if (xl.file) runAnalyze(); });
}
const applyBtn = () => $("#sheetFoot [data-k=r0]");
async function runAnalyze() {
  const out = $("#xlOut"), mode = segv("#xlMode");
  applyBtn().disabled = true; out.innerHTML = `<p class="hint">بيقرا «${esc(xl.file.name)}»…</p>`;
  let r; try { r = await MenuExcel.analyze(xl.file, menu, mode); }
  catch (e) { out.innerHTML = `<p class="err">${e.message === "lib" ? "مكتبة Excel ماتحمّلتش. اتأكد من النت وجرّب تاني." : "حصلت مشكلة في قراية الملف."}</p>`; return; }
  if (r.fatal) { out.innerHTML = `<p class="err">${esc(r.fatal)}</p>`; return; }
  xl.last = r; const s = r.summary, n = x => fmt(x);
  const hasOld = (menu.products || []).length || (menu.categories || []).length;
  out.innerHTML = `
    <div class="stats" style="margin-top:4px">
      <div class="stat"><b>${n(s.categoriesAdded)}</b><span>قسم جديد</span></div>
      <div class="stat"><b>${n(s.categoriesUpdated)}</b><span>قسم هيتعدّل</span></div>
      <div class="stat"><b>${n(s.productsAdded)}</b><span>صنف جديد</span></div>
      <div class="stat"><b>${n(s.productsUpdated)}</b><span>صنف هيتعدّل</span></div>
    </div>
    <p class="hint">في الملف: ${n(s.rows.categories)} قسم، ${n(s.rows.products)} صنف، ${n(s.rows.variants)} حجم، ${n(s.rows.addons || 0)} إضافة، ${n(s.rows.offers)} عرض.
      ${mode === "create" && (s.productsRemoved || s.categoriesRemoved) ? `<b style="color:var(--bad)">هيتشال ${n(s.categoriesRemoved)} قسم و${n(s.productsRemoved)} صنف من المنيو الحالي.</b>` : ""}</p>
    ${r.errors.length ? `<div class="banner bad">${I.warn}<div class="grow"><b>${n(r.errors.length)} خطأ</b> لازم يتصلّحوا في الملف قبل الاستيراد. مفيش أي حاجة اتغيّرت.</div>
        <button type="button" class="btn sm" data-act="xlErrors">${I.dl}تقرير</button></div>
      <div class="xt"><table><thead><tr><th>الورقة</th><th>الصف</th><th>العمود</th><th>المشكلة</th></tr></thead><tbody>
        ${r.errors.slice(0, 150).map(e => `<tr><td>${esc(e.sheet)}</td><td>${e.row ? n(e.row) : "—"}</td><td dir="ltr">${esc(e.col) || "—"}</td><td>${esc(e.msg)}</td></tr>`).join("")}
      </tbody></table></div>${r.errors.length > 150 ? `<p class="hint">ظاهر أول ١٥٠ خطأ. نزّل التقرير عشان تشوف الكل.</p>` : ""}`
    : `<div class="banner info">${I.info}<div class="grow"><b>الملف سليم.</b> دوس «تطبيق على التعديلات»، وراجع الأصناف، وبعدين «نشر التعديلات».</div></div>`}
    ${r.warnings.length ? `<details><summary class="hint" style="cursor:pointer">${n(r.warnings.length)} تنبيه (مش بيمنع الاستيراد)</summary><ul class="hint">${r.warnings.slice(0, 80).map(w => `<li>${esc(w.sheet)}${w.row ? " · صف " + n(w.row) : ""}: ${esc(w.msg)}</li>`).join("")}</ul></details>` : ""}
    ${mode === "create" && hasOld && !r.errors.length ? `<div class="check"><span class="grow">فاهم إن الأقسام والأصناف الحالية هتتشال<small>مفيش سلة محذوفات. لو مش متأكد، نزّل «المنيو الحالي» الأول كنسخة احتياطية.</small></span><button type="button" class="switch" role="switch" id="xlSure" aria-checked="false" data-act="sw"></button></div>` : ""}`;
  applyBtn().disabled = !!r.errors.length;
}
function applyImport() {
  const r = xl.last; if (!r || r.errors.length) return;
  const mode = segv("#xlMode");
  if (mode === "create" && $("#xlSure") && !swv("xlSure")) return toast("فعّل «فاهم إن الأقسام والأصناف الحالية هتتشال» الأول.", true);
  const keep = new Set(r.result.products.map(p => p.image));
  (menu.products || []).forEach(p => { if (p.image && !keep.has(p.image)) forgetImage(p.image); });
  menu.categories = r.result.categories; menu.products = r.result.products;
  closeSheet(); markDirty(); filt = { cat: "all", q: "" }; go("items");
  toast("الملف اتطبّق على التعديلات. راجع، وبعدين دوس «نشر التعديلات».");
}

/* ═════════ delegated actions ═════════ */
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return; const a = el.dataset.act, id = el.dataset.id;
  const flip = () => { const v = el.getAttribute("aria-checked") !== "true"; el.setAttribute("aria-checked", v); return v; };
  switch (a) {
    case "sw": flip(); break;
    case "newItem": itemEditor(null); break;
    case "editItem": itemEditor(id); break;
    case "delItem": deleteItem(id); break;
    case "delCat": deleteCat(id, true); break;
    case "delAd": deleteAd(id); break;
    case "itemAvail": { const p = menu.products.find(x => x.id === id); p.available = flip(); el.closest(".item").classList.toggle("off", !p.available); markDirty(); toast(p.available ? "اتعمل متاح" : "اتعمل غير متاح"); break; }
    case "newCat": catEditor(null); break;
    case "editCat": catEditor(id); break;
    case "catAvail": { const c = catById(id); c.available = flip(); markDirty(); render(); toast(c.available ? "القسم رجع" : "القسم اتوقف"); break; }
    case "catUp": case "catDown": { const c = catById(id); reorder(c.parentId ? subsOf(c.parentId) : mains(), id, a === "catUp" ? -1 : 1); markDirty(); render(); break; }
    case "newAd": adEditor(null); break;
    case "editAd": adEditor(id); break;
    case "adOn": { const x = menu.ads.find(v => v.id === id); x.enabled = flip(); el.closest(".item").classList.toggle("off", !x.enabled); markDirty(); break; }
    case "adUp": case "adDown": reorder(menu.ads.slice().sort((p, q) => (p.sort ?? 0) - (q.sort ?? 0)), id, a === "adUp" ? -1 : 1); markDirty(); render(); break;
    case "filt": filt.cat = id; render(); break;
    case "toggle": setPath(id, flip()); markDirty(); break;
    case "dayOn": { const k = +id, on = flip(); if (on) menu.contact.hours.push({ day: k, open: "10:00", close: "23:00" }); else menu.contact.hours = menu.contact.hours.filter(h => h.day !== k);
      menu.contact.hours.sort((p, q) => ((p.day + 1) % 7) - ((q.day + 1) % 7)); markDirty(); render(); break; }
    case "socAdd": menu.contact.social.push({ name: "", url: "" }); markDirty(); render(); break;
    case "socDel": menu.contact.social.splice(+id, 1); markDirty(); render(); break;
    case "brAdd": (menu.contact.branches ||= []).push({ name: { ar: "", en: "" }, address: { ar: "", en: "" }, phone: "", whatsapp: "", mapsUrl: "" }); markDirty(); render(); break;
    case "brDel": menu.contact.branches.splice(+id, 1); markDirty(); render(); break;
    case "imgClear": { const inp = $("#" + id); inp.value = ""; $("#" + id + "Prev").innerHTML = I.img; el.remove(); inp.dispatchEvent(new Event("change", { bubbles: true })); break; }
    case "restore": { menu = restoreOffer.menu; sessionUploads = restoreOffer.sessionUploads || []; pendingDeletes = restoreOffer.pendingDeletes || []; restoreOffer = null; ensureShape(); markDirty(); render(); toast("التعديلات رجعت"); break; }
    case "dropDraft": restoreOffer = null; store.del("draft"); render(); break;
    case "excel": excelSheet(); break;
    case "menuPrint": go("print"); break;
    case "qrDl": { const cv = $("#qrCanvas"); if (cv?.width > 300) MenuQR.download(cv, "qr-" + (C.clientId || "menu") + ".png"); else toast("الـ QR لسه بيتجهّز، ثانية وجرّب.", true); break; }
    case "xlExport": { const d = new Date(), p = n => String(n).padStart(2, "0");
      el.disabled = true; MenuExcel.exportMenu(menu, `menu-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.xlsx`)
        .catch(() => toast("مكتبة Excel ماتحمّلتش. اتأكد من النت وجرّب تاني.", true)).finally(() => el.disabled = false); break; }
    case "xlErrors": if (xl.last) MenuExcel.exportErrors(xl.last.errors, xl.last.warnings).catch(() => toast("مكتبة Excel ماتحمّلتش.", true)); break;
  }
});
document.addEventListener("click", e => { const s = e.target.closest("[data-seg]"), b = e.target.closest("[data-seg] [data-v]"); if (!s || !b) return;
  s.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); setPath(s.dataset.seg, b.dataset.v); markDirty(); });
document.addEventListener("click", e => { const b = e.target.closest("#bPal [data-v]"); if (!b) return;
  $$("#bPal [data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); menu.brand.palette = b.dataset.v; markDirty(); });
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "itemQ") { filt.q = t.value; const l = $("#itemList"); clearTimeout(t._t); t._t = setTimeout(() => { render(); const q = $("#itemQ"); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 200); return; }
  if (t.dataset.br != null) { const br = menu.contact.branches[+t.dataset.br], [k, sub] = t.dataset.f.split(".");
    if (sub) { br[k] ||= {}; br[k][sub] = t.value.trim(); } else br[k] = t.value.trim(); markDirty(); return; }
  if (t.dataset.soc != null) { menu.contact.social[+t.dataset.soc][t.dataset.f] = t.value.trim(); markDirty(); return; }
  if (t.dataset.hour != null) { const h = menu.contact.hours.find(x => x.day === +t.dataset.hour); if (h) { h[t.dataset.f] = t.value; markDirty(); } return; }
});
document.addEventListener("change", e => {
  const t = e.target; if (!t.dataset?.bind) return;
  const v = t.value.trim();
  if (t.dataset.url && v && !httpsOk(v) && !v.startsWith("blob:")) { t.classList.add("bad"); toast("الرابط لازم يبدأ بـ https://", true); return; }
  t.classList.remove("bad");
  if (t.dataset.bind === "brand.logoUrl" && menu.brand.logoUrl && menu.brand.logoUrl !== v) forgetImage(menu.brand.logoUrl);
  setPath(t.dataset.bind, v); markDirty();
  if (t.dataset.bind.startsWith("brand.name")) $("#rName").textContent = L(menu.brand.name) || "المنيو";
});

/* ═════════ publish ═════════ */
function cleanForSave(m) {
  const out = clone(m);
  (out.products || []).forEach(p => { for (const k of Object.keys(p)) if (p[k] === undefined || k.startsWith("_")) delete p[k]; });
  return out;
}
$("#publishBtn").onclick = async () => {
  const b = $("#publishBtn"); if (b.disabled) return;
  if (!licOk()) return toast("الترخيص مش ساري، والنشر مقفول.", true);
  const data = cleanForSave(menu), size = new Blob([JSON.stringify(data)]).size;
  if (size > 950000) return toast("المنيو كبير قوي (" + fmt(Math.round(size / 1024)) + " ك.ب). قصّر الأوصاف أو امسح أصناف قديمة.", true);
  if (data.products.some(p => p.image?.startsWith("blob:")) && !C.useSample) return toast("فيه صورة لسه مارفعتش. ارفعها تاني أو حط رابط.", true);
  b.disabled = true; b.classList.add("busy");
  try {
    if (C.useSample) { await new Promise(r => setTimeout(r, 600)); window.SAMPLE_MENU = clone(data); }
    else {
      const { db, fs } = FB, batch = fs.writeBatch(db);
      batch.set(fs.doc(db, "public", "menu"), Object.assign(data, { updatedAt: fs.serverTimestamp() }));
      batch.update(fs.doc(db, "public", "meta"), { version: (meta.version || 0) + 1, updatedAt: fs.serverTimestamp() });
      await batch.commit();
      fs.addDoc(fs.collection(db, "auditLogs"), { uid: user.uid, action: "publish_menu", target: "public/menu", note: changeCount() + " changes", at: fs.serverTimestamp() }).catch(() => {});
    }
    meta.version = (meta.version || 0) + 1; base = JSON.stringify(menu); store.del("draft"); restoreOffer = null;
    toast("اتنشر. الزبون هيشوف التعديلات في خلال ٥ دقايق بالكتير.");
    cleanupImages();
  } catch (e) {
    console.error(e);
    if (/permission/.test(e.code || "")) {
      try { const m = await FB.fs.getDoc(FB.fs.doc(FB.db, "public", "meta")); const mm = MenuData.plain(m.data());
        if (mm.version !== meta.version) toast("المنيو اتعدّل من جهاز تاني. تعديلاتك محفوظة هنا؛ افتح الصفحة تاني عشان تشوف آخر نسخة.", true);
        else { meta.license = mm.license; licLine(); toast("النشر اترفض: الترخيص مش ساري أو الصلاحية اتشالت.", true); }
      } catch { toast("النشر اترفض.", true); }
    } else toast("مفيش اتصال. التعديلات محفوظة على الجهاز، جرّب تاني.", true);
  } finally { b.classList.remove("busy"); markDirty(); if (tab === "home") render(); }
};
addEventListener("beforeunload", e => { if (menu && changeCount()) { e.preventDefault(); e.returnValue = ""; } });

boot();
})();
