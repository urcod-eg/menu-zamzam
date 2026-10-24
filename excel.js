/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — استيراد وتصدير Excel
   • كل الشغل على جهاز الأدمن (مكتبة SheetJS بتتحمّل بس لما يفتح الاستيراد).
   • الاستيراد مابيكتبش في Firebase: بيعدّل نسخة التعديلات، والأدمن ينشر بعدها (كتابتين بس).
   • وضعين: update (تحديث بالمعرّفات، اللي مش في الملف بيفضل) و create (يستبدل الأقسام والأصناف).
   ───────────────────────────────────────────────────────────── */
window.MenuExcel = (function () {
"use strict";
/* النسخة الرسمية الأحدث أولًا، ولو مش متاحة نرجع لنسخة cdnjs */
const LIBS = ["https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];
const MAX_BYTES = 5 * 1024 * 1024, MAX_ROWS = 3000;

let libP = null;
function load(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true;
  s.onload = () => window.XLSX ? res(window.XLSX) : rej(new Error("lib")); s.onerror = () => { s.remove(); rej(new Error("lib")); }; document.head.appendChild(s); }); }
function lib() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return libP ||= LIBS.reduce((p, src) => p.catch(() => load(src)), Promise.reject()).catch(e => { libP = null; throw e; });
}

/* ═════════ sheet + column definitions (same keys as templates/menu-template.xlsx) ═════════ */
const SHEETS = {
  categories: { names: ["الأقسام", "categories", "category"], label: "الأقسام", cols: [
    ["category_id", "معرّف القسم *"], ["name_ar", "الاسم بالعربي *", ["category_name_ar"]], ["name_en", "الاسم بالإنجليزي", ["category_name_en"]],
    ["parent_category_id", "القسم الرئيسي (للفرعي بس)"], ["icon", "الأيقونة"], ["sort_order", "الترتيب"], ["is_available", "متاح؟"], ["is_hidden", "مخفي؟"]] },
  products: { names: ["الأصناف", "products", "items"], label: "الأصناف", cols: [
    ["product_id", "معرّف الصنف *"], ["category_id", "معرّف القسم *"], ["name_ar", "الاسم بالعربي *"], ["name_en", "الاسم بالإنجليزي"],
    ["description_ar", "الوصف بالعربي"], ["description_en", "الوصف بالإنجليزي"], ["price_type", "نوع السعر *"], ["price", "السعر (للسعر الواحد)"],
    ["image_url", "رابط الصورة (https)"], ["availability", "الإتاحة"], ["service_type", "نوع الخدمة"], ["sort_order", "الترتيب"],
    ["is_new", "جديد؟"], ["is_featured", "مميز؟"]] },
  variants: { names: ["الأحجام", "variants", "sizes"], label: "الأحجام", cols: [
    ["product_id", "معرّف الصنف *"], ["variant_code", "رمز الحجم *", ["variant_name"]], ["variant_name_ar", "اسم الحجم بالعربي"],
    ["variant_name_en", "اسم الحجم بالإنجليزي"], ["price", "السعر *"], ["sort_order", "الترتيب"]] },
  offers: { names: ["العروض", "offers"], label: "العروض", cols: [
    ["product_id", "معرّف الصنف *"], ["offer_type", "نوع العرض *"], ["value", "القيمة (نسبة أو مبلغ)"], ["new_price", "السعر الجديد", ["offer_price"]],
    ["variant_code", "رمز الحجم (للسعر الجديد)"], ["text_ar", "نص العرض بالعربي", ["title_ar"]], ["text_en", "نص العرض بالإنجليزي", ["title_en"]],
    ["start_at", "يبدأ (اختياري)"], ["end_at", "ينتهي *"], ["is_enabled", "مفعّل؟"]] }
};

/* ═════════ value normalizers (Arabic + English accepted) ═════════ */
const digits = s => String(s).replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776);
const str = v => v == null ? "" : (v instanceof Date ? v.toISOString() : String(v)).trim();
const key = v => str(v).toLowerCase().replace(/[ـ\s_\-]+/g, " ").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
function num(v) {
  if (typeof v === "number") return isFinite(v) ? Math.round(v * 100) / 100 : NaN;
  const s = digits(str(v)).replace(/[٫,]/g, ".").replace(/\s|ج\.?م|egp|le/gi, "");
  return s && /^\d*\.?\d+$/.test(s) ? Math.round(parseFloat(s) * 100) / 100 : NaN;
}
function pick(v, map) { const k = key(v); if (!k) return undefined; for (const [out, list] of map) if (list.some(x => key(x) === k)) return out; return null; }
const BOOL = [[true, ["1", "true", "yes", "y", "نعم", "ايوه", "أيوة", "اه", "صح", "✓", "x"]], [false, ["0", "false", "no", "n", "لا", "خطأ", "غلط"]]];
const PRICE_T = [["single", ["single", "سعر واحد", "واحد", "سعر", "ثابت"]], ["variants", ["variants", "variant", "sizes", "أحجام", "احجام", "حجم", "بالحجم", "حسب الحجم"]]];
const AVAIL = [[true, ["available", "متاح", "1", "نعم", "yes"]], [false, ["unavailable", "غير متاح", "مش متاح", "0", "لا", "no"]]];
const SERVICE = [["both", ["both", "دليفري واستلام", "الاتنين", "كلاهما", "توصيل واستلام"]], ["delivery_only", ["delivery_only", "delivery", "دليفري فقط", "دليفري", "توصيل فقط", "توصيل"]],
  ["pickup_only", ["pickup_only", "pickup", "استلام فقط", "استلام", "تيك اواي", "takeaway"]]];
const OFFER_T = [["percent", ["percent", "percentage", "نسبة خصم", "نسبة", "%", "٪"]], ["amount", ["amount", "خصم مبلغ", "مبلغ", "خصم ثابت"]],
  ["price", ["price", "new_price", "سعر جديد", "سعر مخفض", "تخفيض"]], ["free_delivery", ["free_delivery", "توصيل مجاني", "دليفري مجاني", "دليفري ببلاش"]],
  ["custom", ["custom", "عرض مكتوب", "نص", "مكتوب", "عرض خاص"]]];
const ICON = [["coffee", ["coffee", "قهوة", "مشروبات ساخنة"]], ["drink", ["drink", "مشروبات", "عصائر", "مشروبات باردة"]], ["burger", ["burger", "برجر"]],
  ["pizza", ["pizza", "بيتزا"]], ["sandwich", ["sandwich", "ساندوتشات", "سندوتشات"]], ["chicken", ["chicken", "فراخ", "دجاج"]], ["grill", ["grill", "مشويات"]],
  ["fish", ["fish", "أسماك", "سمك"]], ["salad", ["salad", "سلطات", "سلطة"]], ["breakfast", ["breakfast", "فطار", "فطور"]], ["dessert", ["dessert", "حلويات"]], ["plate", ["plate", "أطباق", "عام"]]];

/* date: Date cell, Excel serial, or text like 2026-12-31 23:59 / 31/12/2026 23:59 */
function date(v) {
  if (v === "" || v == null) return undefined;
  if (v instanceof Date && !isNaN(v)) return new Date(Math.round(v.getTime() / 6e4) * 6e4).toISOString();
  if (typeof v === "number") {   /* Excel serial = wall-clock time; rebuild it as local time on this device */
    const u = new Date(Math.round((v - 25569) * 1440) * 6e4); if (isNaN(u)) return null;
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(), u.getUTCHours(), u.getUTCMinutes()).toISOString(); }
  const s = digits(str(v)).replace(/\//g, "-").replace("T", " ").replace(/\s+/g, " ");
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?: (\d{1,2}):(\d{2}))?$/), y, mo, d, h = 23, mi = 59;
  if (m) [, y, mo, d] = m; else if ((m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?: (\d{1,2}):(\d{2}))?$/))) [, d, mo, y] = m; else return null;
  if (m[4] != null) { h = +m[4]; mi = +m[5]; }
  const dt = new Date(+y, +mo - 1, +d, h, mi);
  return isNaN(dt) || dt.getMonth() !== +mo - 1 ? null : dt.toISOString();
}
const colName = i => { let s = ""; i++; while (i) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
const isEx = id => /^ex-/i.test(str(id));

/* ═════════ read one sheet into [{row, v:{key:value}, col:{key:letter}}] ═════════ */
function readSheet(XLSX, wb, spec) {
  const name = wb.SheetNames.find(n => spec.names.some(x => key(x) === key(n)));
  if (!name) return null;
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: "", blankrows: true });
  const first = spec.cols[0][0];
  let h = -1, map = {};
  for (let r = 0; r < Math.min(rows.length, 5) && h < 0; r++) {
    const m = {};
    rows[r].forEach((c, i) => { const k = key(c).replace(/ /g, "_").replace(/\*$/, "").replace(/_+$/, "");
      const col = spec.cols.find(([kk, , al]) => kk === k || (al || []).includes(k)); if (col) m[col[0]] = i; });
    if (first in m) { h = r; map = m; }
  }
  if (h < 0) return { name, missingHeader: true, list: [] };
  const list = [];
  for (let r = h + 1; r < rows.length; r++) {
    const row = rows[r]; if (!row || row.every(c => str(c) === "")) continue;
    const v = {}, col = {};
    for (const k in map) { v[k] = row[map[k]]; col[k] = colName(map[k]); }
    if (isEx(v[first])) continue;
    list.push({ row: r + 1, v, col });
  }
  return { name, list, map };
}

/* ═════════ parse + validate + build the merged result ═════════ */
async function analyze(file, menu, mode) {
  const XLSX = await lib();
  const errors = [], warnings = [];
  const E = (sheet, rec, k, msg) => errors.push({ sheet: SHEETS[sheet].label, row: rec ? rec.row : "", col: rec && k ? (rec.col[k] || "") + " · " + k : "", msg });
  const W = (sheet, rec, msg) => warnings.push({ sheet: SHEETS[sheet].label, row: rec ? rec.row : "", msg });
  if (file.size > MAX_BYTES) return { fatal: "الملف أكبر من ٥ ميجا." };
  if (!/\.(xlsx|xlsm|xls)$/i.test(file.name)) return { fatal: "الملف لازم يكون Excel (.xlsx)." };
  let wb; try { wb = XLSX.read(await file.arrayBuffer(), { cellDates: false }); } catch { return { fatal: "الملف ده مش بيتفتح. اتأكد إنه Excel سليم." }; }

  const S = {}; for (const k in SHEETS) S[k] = readSheet(XLSX, wb, SHEETS[k]);
  if (!S.products && !S.categories) return { fatal: "مالقيتش ورقة «الأقسام» ولا «الأصناف». استخدم القالب ومتغيّرش أسماء الأوراق." };
  for (const k in S) if (S[k]?.missingHeader) E(k, null, null, `ورقة «${S[k].name}» مافيهاش صف أسماء الأعمدة (زي ${SHEETS[k].cols[0][0]}).`);
  const total = Object.values(S).reduce((n, s) => n + (s?.list.length || 0), 0);
  if (total > MAX_ROWS) return { fatal: `الملف فيه ${total} صف، والحد ${MAX_ROWS}.` };
  const update = mode === "update";
  const oldCats = update ? (menu.categories || []) : [], oldProds = update ? (menu.products || []) : [];
  const oldCat = id => oldCats.find(c => c.id === id), oldProd = id => oldProds.find(p => p.id === id);

  /* ── categories ── */
  const fileCats = new Map();
  for (const rec of S.categories?.list || []) {
    const v = rec.v, id = str(v.category_id);
    if (!id) { E("categories", rec, "category_id", "معرّف القسم فاضي."); continue; }
    if (fileCats.has(id)) { E("categories", rec, "category_id", `المعرّف «${id}» متكرر في الورقة.`); continue; }
    const prev = oldCat(id), c = prev ? JSON.parse(JSON.stringify(prev)) : { id, name: { ar: "", en: "" }, parentId: null, icon: "plate", available: true, hidden: false };
    const ar = str(v.name_ar), en = str(v.name_en);
    if (ar) c.name.ar = ar; if (en) c.name.en = en; if (!update && !en) c.name.en = "";
    if (!c.name.ar && !c.name.en) E("categories", rec, "name_ar", "اسم القسم فاضي.");
    const par = str(v.parent_category_id); if (par || !update) c.parentId = par || null;
    if (str(v.icon)) { const ic = pick(v.icon, ICON); if (ic) c.icon = ic; else W("categories", rec, `أيقونة «${str(v.icon)}» مش معروفة، هتبقى «أطباق».`); }
    if (str(v.sort_order)) { const n = num(v.sort_order); if (isNaN(n)) E("categories", rec, "sort_order", "الترتيب لازم يكون رقم."); else c.sort = n; }
    for (const [k, f] of [["is_available", "available"], ["is_hidden", "hidden"]]) { const b = pick(v[k], BOOL); if (b === null) E("categories", rec, k, `القيمة «${str(v[k])}» لازم تكون نعم أو لا.`); else if (b !== undefined) c[f] = b; }
    c._rec = rec; c._isNew = !prev; fileCats.set(id, c);
  }
  const allCat = id => fileCats.get(id) || oldCat(id);
  for (const c of fileCats.values()) {
    if (!c.parentId) continue;
    const p = allCat(c.parentId);
    if (c.parentId === c.id) E("categories", c._rec, "parent_category_id", "القسم مينفعش يكون فرعي من نفسه.");
    else if (!p) E("categories", c._rec, "parent_category_id", `القسم الرئيسي «${c.parentId}» مش موجود.`);
    else if (p.parentId) E("categories", c._rec, "parent_category_id", `«${c.parentId}» قسم فرعي، والقسم الفرعي مينفعش يبقى جواه أقسام.`);
  }

  /* ── products ── */
  const fileProds = new Map();
  for (const rec of S.products?.list || []) {
    const v = rec.v, id = str(v.product_id);
    if (!id) { E("products", rec, "product_id", "معرّف الصنف فاضي."); continue; }
    if (fileProds.has(id)) { E("products", rec, "product_id", `المعرّف «${id}» متكرر في الورقة.`); continue; }
    const prev = oldProd(id);
    const p = prev ? JSON.parse(JSON.stringify(prev)) : { id, name: { ar: "", en: "" }, desc: { ar: "", en: "" }, priceType: "single", image: "", available: true, service: "both", isNew: false, featured: false };
    p.desc ||= { ar: "", en: "" };
    const cat = str(v.category_id);
    if (!cat && !prev) E("products", rec, "category_id", "معرّف القسم فاضي.");
    else if (cat) { if (!allCat(cat)) E("products", rec, "category_id", `القسم «${cat}» مش موجود في ورقة الأقسام${update ? " ولا في المنيو الحالي" : ""}.`); p.categoryId = cat; }
    for (const [k, f, sub] of [["name_ar", "name", "ar"], ["name_en", "name", "en"], ["description_ar", "desc", "ar"], ["description_en", "desc", "en"]]) {
      const t = str(v[k]); if (t) p[f][sub] = t; else if (!update) p[f][sub] = ""; }
    if (!p.name.ar && !p.name.en) E("products", rec, "name_ar", "اسم الصنف فاضي.");
    const pt = pick(v.price_type, PRICE_T);
    if (pt === null) E("products", rec, "price_type", `نوع السعر «${str(v.price_type)}» لازم يكون «سعر واحد» أو «أحجام».`);
    else if (pt) p.priceType = pt;
    else if (!prev) { p.priceType = str(v.price) ? "single" : "variants"; }
    if (p.priceType === "single") {
      if (str(v.price)) { const n = num(v.price); if (isNaN(n) || n < 0) E("products", rec, "price", `السعر «${str(v.price)}» مش رقم صحيح.`); else p.price = n; }
      else if (p.price == null || (prev && prev.priceType !== "single")) E("products", rec, "price", "الصنف ده سعره واحد، فلازم تكتب السعر.");
      delete p.variants;
    } else if (str(v.price)) W("products", rec, "الصنف ده بأحجام، فعمود السعر اتجاهل. الأسعار من ورقة الأحجام.");
    const img = str(v.image_url);
    if (img) { if (!/^https:\/\/[^\s]+$/i.test(img)) E("products", rec, "image_url", "رابط الصورة لازم يبدأ بـ https:// ومن غير مسافات."); else p.image = img; }
    else if (!update) p.image = "";
    const av = pick(v.availability, AVAIL); if (av === null) E("products", rec, "availability", `الإتاحة «${str(v.availability)}» لازم تكون متاح أو غير متاح.`); else if (av !== undefined) p.available = av;
    const sv = pick(v.service_type, SERVICE); if (sv === null) E("products", rec, "service_type", `نوع الخدمة «${str(v.service_type)}» مش من القيم المسموحة.`); else if (sv) p.service = sv;
    if (str(v.sort_order)) { const n = num(v.sort_order); if (isNaN(n)) E("products", rec, "sort_order", "الترتيب لازم يكون رقم."); else p.sort = n; }
    for (const [k, f] of [["is_new", "isNew"], ["is_featured", "featured"]]) { const b = pick(v[k], BOOL); if (b === null) E("products", rec, k, `القيمة «${str(v[k])}» لازم تكون نعم أو لا.`); else if (b !== undefined) p[f] = b; }
    p._rec = rec; p._isNew = !prev; fileProds.set(id, p);
  }
  const allProd = id => fileProds.get(id) || oldProd(id);

  /* ── variants ── */
  const vars = new Map();
  for (const rec of S.variants?.list || []) {
    const v = rec.v, pid = str(v.product_id), code = str(v.variant_code);
    if (!pid) { E("variants", rec, "product_id", "معرّف الصنف فاضي."); continue; }
    const p = allProd(pid);
    if (!p) { E("variants", rec, "product_id", `الصنف «${pid}» مش موجود.`); continue; }
    if (p.priceType !== "variants") { E("variants", rec, "product_id", `الصنف «${pid}» نوع سعره «سعر واحد». غيّره لـ «أحجام» أو امسح الصف ده.`); continue; }
    if (!code) { E("variants", rec, "variant_code", "رمز الحجم فاضي (مثلًا S أو M أو L)."); continue; }
    const list = vars.get(pid) || []; if (list.some(x => x.id === code)) { E("variants", rec, "variant_code", `الحجم «${code}» متكرر لنفس الصنف.`); continue; }
    const n = num(v.price); if (isNaN(n) || n < 0) { E("variants", rec, "price", `السعر «${str(v.price)}» مش رقم صحيح.`); continue; }
    const so = str(v.sort_order) ? num(v.sort_order) : list.length + 1;
    list.push({ id: code, label: { ar: str(v.variant_name_ar) || code, en: str(v.variant_name_en) || code }, price: n, _s: isNaN(so) ? list.length + 1 : so });
    vars.set(pid, list);
  }
  for (const [pid, list] of vars) { const p = allProd(pid); list.sort((a, b) => a._s - b._s); list.forEach(x => delete x._s);
    if (fileProds.has(pid)) p.variants = list; else { const cp = JSON.parse(JSON.stringify(p)); cp.variants = list; cp._isNew = false; cp._viaVariants = true; fileProds.set(pid, cp); } }
  for (const p of fileProds.values()) if (p.priceType === "variants" && !(p.variants?.length)) E("products", p._rec, "price_type", `الصنف «${p.id}» بأحجام ومالوش ولا صف في ورقة الأحجام.`);

  /* ── offers ── */
  const offerRows = new Map();
  for (const rec of S.offers?.list || []) { const pid = str(rec.v.product_id); if (!pid) { E("offers", rec, "product_id", "معرّف الصنف فاضي."); continue; }
    (offerRows.get(pid) || offerRows.set(pid, []).get(pid)).push(rec); }
  for (const [pid, recs] of offerRows) {
    let p = fileProds.get(pid);
    if (!p) { const o = oldProd(pid); if (!o) { E("offers", recs[0], "product_id", `الصنف «${pid}» مش موجود.`); continue; } p = JSON.parse(JSON.stringify(o)); p._isNew = false; fileProds.set(pid, p); }
    const r0 = recs[0], v = r0.v, t = pick(v.offer_type, OFFER_T);
    if (!t) { E("offers", r0, "offer_type", `نوع العرض «${str(v.offer_type)}» مش من القيم المسموحة.`); continue; }
    if (recs.length > 1 && !(t === "price" && p.priceType === "variants")) { E("offers", recs[1], "product_id", "الصنف ده ليه أكتر من صف عرض. الصفوف المتعددة للـ «سعر جديد» على الأحجام بس."); continue; }
    const o = { enabled: true, type: t, startAt: null, endAt: null };
    const en = pick(v.is_enabled, BOOL); if (en === null) E("offers", r0, "is_enabled", "لازم نعم أو لا."); else if (en === false) o.enabled = false;
    const st = date(v.start_at), ed = date(v.end_at);
    if (st === null) E("offers", r0, "start_at", `التاريخ «${str(v.start_at)}» مش مفهوم. اكتبه كده: 2026-12-31 23:59`); else if (st) o.startAt = st;
    if (!ed) E("offers", r0, "end_at", ed === null ? `التاريخ «${str(v.end_at)}» مش مفهوم. اكتبه كده: 2026-12-31 23:59` : "تاريخ الانتهاء مطلوب.");
    else o.endAt = ed;
    if (o.startAt && o.endAt && new Date(o.startAt) >= new Date(o.endAt)) E("offers", r0, "end_at", "تاريخ الانتهاء قبل البداية.");
    if (o.endAt && new Date(o.endAt) <= Date.now()) W("offers", r0, "العرض ده تاريخه خلص، ومش هيظهر للزبون.");
    const bases = p.priceType === "variants" ? (p.variants || []).map(x => [x.id, +x.price]) : [[null, +p.price]];
    if (t === "percent") { o.value = num(v.value); if (isNaN(o.value) || o.value <= 0 || o.value >= 100) E("offers", r0, "value", "النسبة لازم تكون من ١ لـ ٩٩."); }
    if (t === "amount") { o.value = num(v.value);
      if (isNaN(o.value) || o.value <= 0) E("offers", r0, "value", "اكتب مبلغ الخصم.");
      else if (bases.some(([, b]) => o.value >= b)) E("offers", r0, "value", "مبلغ الخصم أكبر من أو بيساوي سعر حجم من الأحجام."); }
    if (t === "price") {
      if (p.priceType === "variants") { o.prices = {};
        for (const rec of recs) { const code = str(rec.v.variant_code), np = num(rec.v.new_price), base = bases.find(b => b[0] === code);
          if (!code) { E("offers", rec, "variant_code", "الصنف ده بأحجام، فاكتب رمز الحجم في كل صف."); continue; }
          if (!base) { E("offers", rec, "variant_code", `الحجم «${code}» مش موجود للصنف ده.`); continue; }
          if (isNaN(np) || np < 0 || np >= base[1]) { E("offers", rec, "new_price", `سعر العرض لازم يكون أقل من ${base[1]}.`); continue; }
          o.prices[code] = np; }
      } else { o.price = num(v.new_price); if (isNaN(o.price) || o.price < 0 || o.price >= bases[0][1]) E("offers", r0, "new_price", `السعر الجديد لازم يكون أقل من ${bases[0][1]}.`); }
    }
    if (t === "custom") { o.text = { ar: str(v.text_ar), en: str(v.text_en) }; if (!o.text.ar && !o.text.en) E("offers", r0, "text_ar", "اكتب نص العرض."); }
    p.offer = o; p._offer = true;
  }

  /* ── merge ── */
  const strip = x => { const c = Object.assign({}, x); for (const k in c) if (k.startsWith("_")) delete c[k]; return c; };
  /* meaning-only comparison: key order, empty/false values and seconds don't count as a change */
  const canon = v => {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === "object") { const o = {};
      if ("price" in v && "id" in v && v.label && (v.label.ar || v.id) === v.id && (v.label.en || v.id) === v.id) v = Object.assign({}, v, { label: undefined }); /* size label = its code */
      Object.keys(v).sort().forEach(k => { if (k.startsWith("_")) return; const c = canon(v[k]);
      if (c === null || c === undefined || c === "" || c === false || (typeof c === "object" && !Array.isArray(c) && !Object.keys(c).length)) return; o[k] = c; }); return o; }
    if (typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(v)) return v.slice(0, 16);
    return v;
  };
  const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
  const pickNew = (oldX, newX) => same(oldX, newX) ? oldX : strip(newX);
  let categories, products;
  if (update) {
    categories = (menu.categories || []).map(c => fileCats.has(c.id) ? pickNew(c, fileCats.get(c.id)) : c);
    for (const c of fileCats.values()) if (c._isNew) categories.push(strip(c));
    products = (menu.products || []).map(p => fileProds.has(p.id) ? pickNew(p, fileProds.get(p.id)) : p);
    for (const p of fileProds.values()) if (p._isNew) products.push(strip(p));
  } else {
    categories = [...fileCats.values()].map(strip); products = [...fileProds.values()].map(strip);
    if (!categories.length) errors.push({ sheet: SHEETS.categories.label, row: "", col: "", msg: "وضع «منيو جديد» محتاج أقسام في الملف." });
  }
  /* default sort = order in the file */
  const seq = {}; for (const c of categories) if (c.sort == null) c.sort = (seq["c" + (c.parentId || "")] = (seq["c" + (c.parentId || "")] || 0) + 1);
  for (const p of products) if (p.sort == null) p.sort = (seq["p" + p.categoryId] = (seq["p" + p.categoryId] || 0) + 1);
  /* categories that would end up with a missing parent, products in deleted categories */
  const ids = new Set(categories.map(c => c.id));
  for (const p of products) if (!ids.has(p.categoryId) && !errors.some(e => e.msg.includes(`«${p.categoryId}»`))) errors.push({ sheet: SHEETS.products.label, row: "", col: "", msg: `الصنف «${p.id}» في قسم «${p.categoryId}» اللي مش موجود.` });

  const changed = (list, oldList) => { let n = 0, a = 0; const om = new Map(oldList.map(x => [x.id, x]));
    for (const x of list) { if (!om.has(x.id)) a++; else if (!same(om.get(x.id), x)) n++; } return { added: a, updated: n }; };
  const cs = changed(categories, menu.categories || []), ps = changed(products, menu.products || []);
  const summary = {
    mode, categoriesAdded: cs.added, categoriesUpdated: cs.updated, productsAdded: ps.added, productsUpdated: ps.updated,
    productsRemoved: update ? 0 : (menu.products || []).filter(p => !products.some(x => x.id === p.id)).length,
    categoriesRemoved: update ? 0 : (menu.categories || []).filter(c => !categories.some(x => x.id === c.id)).length,
    variantRows: S.variants?.list.length || 0, offers: [...fileProds.values()].filter(p => p._offer).length,
    rows: { categories: S.categories?.list.length || 0, products: S.products?.list.length || 0, variants: S.variants?.list.length || 0, offers: S.offers?.list.length || 0 }
  };
  return { errors, warnings, summary, result: { categories, products } };
}

/* ═════════ export (re-importable, same columns as the template) ═════════ */
const YES = b => b ? "نعم" : "لا";
const OUT = {
  price_type: { single: "سعر واحد", variants: "أحجام" }, service: { both: "دليفري واستلام", delivery_only: "دليفري فقط", pickup_only: "استلام فقط" },
  offer: { percent: "نسبة خصم", amount: "خصم مبلغ", price: "سعر جديد", free_delivery: "توصيل مجاني", custom: "عرض مكتوب" },
  icon: Object.fromEntries(ICON.map(([k, l]) => [k, l[1]]))
};
const fmtDate = iso => { if (!iso) return ""; const d = new Date(iso); if (isNaN(d)) return ""; const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
function sheetFrom(XLSX, spec, rows) {
  const ws = XLSX.utils.aoa_to_sheet([spec.cols.map(c => c[1]), spec.cols.map(c => c[0]), ...rows]);
  ws["!cols"] = spec.cols.map(([k]) => ({ wch: /desc|text|image/.test(k) ? 36 : /name/.test(k) ? 22 : 14 }));
  ws["!freeze"] = { xSplit: 1, ySplit: 2 };
  return ws;
}
async function exportMenu(menu, filename) {
  const XLSX = await lib(), wb = XLSX.utils.book_new();
  const cats = (menu.categories || []).slice().sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0) || (a.sort ?? 0) - (b.sort ?? 0));
  const prods = (menu.products || []).slice().sort((a, b) => String(a.categoryId).localeCompare(b.categoryId) || (a.sort ?? 0) - (b.sort ?? 0));
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, SHEETS.categories, cats.map(c => [c.id, c.name?.ar || "", c.name?.en || "", c.parentId || "", OUT.icon[c.icon] || "أطباق", c.sort ?? "", YES(c.available !== false), YES(!!c.hidden)])), SHEETS.categories.label);
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, SHEETS.products, prods.map(p => [p.id, p.categoryId, p.name?.ar || "", p.name?.en || "", p.desc?.ar || "", p.desc?.en || "",
    OUT.price_type[p.priceType === "variants" ? "variants" : "single"], p.priceType === "variants" ? "" : (p.price ?? ""), p.image && !p.image.startsWith("blob:") ? p.image : "",
    p.available === false ? "غير متاح" : "متاح", OUT.service[p.service || "both"], p.sort ?? "", YES(!!p.isNew), YES(!!p.featured)])), SHEETS.products.label);
  const vr = []; prods.forEach(p => { if (p.priceType === "variants") (p.variants || []).forEach((v, i) => vr.push([p.id, v.id, v.label?.ar || v.id, v.label?.en || v.id, v.price, i + 1])); });
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, SHEETS.variants, vr), SHEETS.variants.label);
  const or = []; prods.forEach(p => { const o = p.offer; if (!o) return;
    const base = [p.id, OUT.offer[o.type] || o.type];
    const tail = [o.text?.ar || "", o.text?.en || "", fmtDate(o.startAt), fmtDate(o.endAt), YES(o.enabled !== false)];
    if (o.type === "price" && o.prices) Object.entries(o.prices).forEach(([code, np]) => or.push([...base, "", np, code, ...tail]));
    else or.push([...base, o.value ?? "", o.type === "price" ? o.price ?? "" : "", "", ...tail]); });
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, SHEETS.offers, or), SHEETS.offers.label);
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.writeFile(wb, filename || "menu.xlsx");
}
async function exportErrors(errors, warnings) {
  const XLSX = await lib(), wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["النوع", "الورقة", "الصف", "العمود", "المشكلة"],
    ...errors.map(e => ["خطأ", e.sheet, e.row, e.col, e.msg]), ...warnings.map(w => ["تنبيه", w.sheet, w.row, "", w.msg])]);
  ws["!cols"] = [{ wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws, "الأخطاء"); wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.writeFile(wb, "menu-import-errors.xlsx");
}

return { lib, analyze, exportMenu, exportErrors, _test: { num, date, pick, BOOL, PRICE_T, OFFER_T } };
})();
