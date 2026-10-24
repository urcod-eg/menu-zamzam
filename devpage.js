/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — صفحة المطوّر (مخفية)
   الدخول: ١٠ ضغطات على لوجو URCOD في صفحة «صُنع بواسطة URCOD».
   من هنا: هوية المطعم، الترخيص، حساب الإدارة (وإرساله واتساب)، الصور، الملاحظات.
   ───────────────────────────────────────────────────────────── */
(function () {
"use strict";
const C = window.URCOD_CONFIG, SDK = n => `https://www.gstatic.com/firebasejs/${C.firebaseSdk}/${n}.js`;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const fmt = n => (+n).toLocaleString("ar-EG");
const day = 864e5;
const dateAr = iso => iso ? new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "";
const dtAr = iso => iso ? new Date(iso).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
const toLocal = iso => { if (!iso) return ""; const d = new Date(iso); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
const toMenu = () => location.replace("./");
const menuUrl = () => location.href.replace(/[^/]*([?#].*)?$/, "");
const PLANS = { trial: "تجريبي", monthly: "شهري", custom: "مدة مخصّصة", annual: "سنوي", lifetime: "دائم" };
const PALETTES = [["green", "#1f5a3d", "أخضر"], ["navy", "#1d3b6e", "كحلي"], ["maroon", "#7a1f33", "نبيتي"], ["coffee", "#5b3a24", "بني"], ["teal", "#0f5e63", "تركواز"]];
const ACT = { publish_menu: "نشر المنيو", seed_menu: "رفع منيو تجريبي", license_update: "تعديل الترخيص", admin_account: "حساب إدارة جديد",
  brand_update: "تعديل الهوية", github_config: "إعداد رفع الصور", dev_password: "تغيير بيانات المطوّر" };
function toast(m, bad) { const t = $("#toast"); t.textContent = m; t.className = "toast on" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "toast", 3200); }
const errMsg = e => { const c = e?.code || e?.message || "";
  if (/permission/.test(c)) return "مرفوض من قواعد الأمان. اتأكد إن firestore.rules متلصقة ومنشورة في المشروع ده.";
  if (/requires-recent-login/.test(c)) return "لأمانك: اخرج وادخل تاني، وبعدين غيّرها على طول.";
  if (/network|unavailable/.test(c)) return "مفيش اتصال.";
  if (/weak-password/.test(c)) return "كلمة السر ضعيفة.";
  if (/operation-not-allowed/.test(c)) return "Email/Password مش مفعّل في Authentication للمشروع ده.";
  return "حصلت مشكلة: " + c; };
function licState(l) {
  if (!l) return { t: "بدون ترخيص", pill: "draft" };
  if (l.status === "suspended") return { t: "موقوف", pill: "paused" };
  if (l.endsAt && new Date(l.endsAt) <= Date.now()) return { t: "منتهي", pill: "ended" };
  if (!l.endsAt) return { t: "دائم", pill: "active" };
  const d = Math.ceil((new Date(l.endsAt) - Date.now()) / day);
  return { t: `باقي ${fmt(d)} يوم`, pill: d <= 7 ? "scheduled" : "active" };
}
/* random secrets without look-alike characters */
function gen(n, set = "abcdefghjkmnpqrstuvwxyz23456789") { const a = crypto.getRandomValues(new Uint32Array(n)); return [...a].map(x => set[x % set.length]).join(""); }

/* ═════════ backend (Firebase, or in-memory for sample mode) ═════════ */
let FB, A, auth, user;
let meta = null, menu = null, adminPriv = {}, notes = "", gh = null, logs = [];
const api = C.useSample ? {
  async load() { meta = clone(window.SAMPLE_META); meta.devReady = true; menu = clone(window.SAMPLE_MENU); adminPriv = { phone: "" }; notes = ""; gh = null;
    logs = [{ action: "publish_menu", note: "3 changes", at: new Date(Date.now() - 36e5).toISOString() }]; },
  async saveMenu(m) { menu = clone(m); meta.version = (meta.version || 0) + 1; },
  async saveLicense(l) { meta.license = clone(l); },
  async createAdmin(secret, phone) { const uid = "adm_" + gen(6); meta.adminUid = uid; meta.adminLogin = `admin.${gen(5)}.${C.clientId}@urcod.app`; meta.adminSince = new Date().toISOString(); adminPriv = { phone }; },
  async savePhone(phone) { adminPriv.phone = phone; },
  async saveNotes(t) { notes = t; }, async saveGh(g) { gh = clone(g); }, async changeDev() {}, async log() {}, async logout() { toMenu(); }
} : {
  async load() {
    const { db, fs } = FB, D = (...p) => fs.doc(db, ...p);
    const [m, mm, a, n, g] = await Promise.all([fs.getDoc(D("public", "meta")), fs.getDoc(D("public", "menu")), fs.getDoc(D("private", "admin")),
      fs.getDoc(D("private", "devNotes")), fs.getDoc(D("secure", "github"))]);
    meta = m.exists() ? MenuData.plain(m.data()) : null; menu = mm.exists() ? MenuData.plain(mm.data()) : null; delete menu?.updatedAt;
    adminPriv = a.exists() ? a.data() : {}; notes = n.exists() ? n.data().text || "" : ""; gh = g.exists() ? g.data() : null;
    try { const q = fs.query(fs.collection(db, "auditLogs"), fs.orderBy("at", "desc"), fs.limit(30)); logs = (await fs.getDocs(q)).docs.map(d => MenuData.plain(d.data())); } catch { logs = []; }
  },
  async saveMenu(m) { const { db, fs } = FB, b = fs.writeBatch(db), mref = fs.doc(db, "public", "meta");
    b.set(fs.doc(db, "public", "menu"), Object.assign(clone(m), { updatedAt: fs.serverTimestamp() }));
    if (meta) b.update(mref, { version: (meta.version || 0) + 1, updatedAt: fs.serverTimestamp() });
    else b.set(mref, { version: 1, devReady: true, updatedAt: fs.serverTimestamp(), license: null });
    await b.commit(); meta = meta || { version: 0, devReady: true }; meta.version = (meta.version || 0) + 1; menu = clone(m); },
  async saveLicense(l) { const { db, fs } = FB;
    await fs.updateDoc(fs.doc(db, "public", "meta"), { license: { status: l.status, plan: l.plan, menuOnExpiry: l.menuOnExpiry,
      endsAt: l.endsAt ? fs.Timestamp.fromDate(new Date(l.endsAt)) : null, renewedAt: fs.serverTimestamp() } });
    meta.license = clone(l); },
  async createAdmin(secret, phone) {
    /* كل «تغيير» = حساب جديد. القديم بيبطل على طول لأن القواعد بتقبل الرقم المكتوب في meta.adminUid بس */
    const { db, fs } = FB, appMod = await import(SDK("firebase-app"));
    const tmp = appMod.initializeApp(C.firebase, "mk_" + Date.now()), ta = A.getAuth(tmp);
    const login = `admin.${Date.now().toString(36)}.${C.clientId}@urcod.app`.toLowerCase();
    try { const cr = await A.createUserWithEmailAndPassword(ta, login, secret); const uid = cr.user.uid; await A.signOut(ta);
      await fs.updateDoc(fs.doc(db, "public", "meta"), { adminUid: uid, adminLogin: login, adminSince: fs.serverTimestamp() });
      await fs.setDoc(fs.doc(db, "private", "admin"), { phone, updatedAt: fs.serverTimestamp() });
      meta.adminUid = uid; meta.adminLogin = login; meta.adminSince = new Date().toISOString(); adminPriv = { phone };
    } finally { appMod.deleteApp(tmp).catch(() => {}); } },
  async savePhone(phone) { const { db, fs } = FB; await fs.setDoc(fs.doc(db, "private", "admin"), { phone, updatedAt: fs.serverTimestamp() }); adminPriv.phone = phone; },
  async saveNotes(t) { const { db, fs } = FB; await fs.setDoc(fs.doc(db, "private", "devNotes"), { text: t, updatedAt: fs.serverTimestamp() }); notes = t; },
  async saveGh(g) { const { db, fs } = FB; await fs.setDoc(fs.doc(db, "secure", "github"), g); gh = clone(g); },
  async changeDev(secret) { await A.updatePassword(auth.currentUser, secret); },
  async log(action, target, note = "") { const { db, fs } = FB;
    fs.addDoc(fs.collection(db, "auditLogs"), { uid: user.uid, action, target, note, at: fs.serverTimestamp() }).catch(() => {}); },
  async logout() { await A.signOut(auth); toMenu(); }
};

async function boot() {
  if (C.useSample) { await api.load(); return render(); }
  try {
    FB = await MenuData.firebase(); A = await import(SDK("firebase-auth")); auth = A.getAuth(FB.app);
    A.onAuthStateChanged(auth, async u => {
      if (!u || (u.email || "").toLowerCase() !== MenuData.devLogin) return toMenu();
      user = u;
      try { await api.load(); render(); } catch (e) { $("#view").innerHTML = `<div class="card"><p class="err">${esc(errMsg(e))}</p></div>`; }
    });
  } catch { $("#view").innerHTML = `<div class="card"><p class="err">مفيش اتصال.</p><a class="btn" href="./">رجوع للمنيو</a></div>`; }
}
$("#logoutBtn").onclick = () => api.logout();

/* ═════════ render ═════════ */
const L2 = (o, k) => esc(o?.[k] || "");
function render() {
  const b = menu?.brand || {}, l = meta?.license, st = licState(l);
  $("#rName").textContent = b.name?.ar || b.name?.en || "مطعم جديد";
  $("#view").innerHTML = `<div class="view">
  ${C.useSample ? `<div class="banner info"><div class="grow">وضع تجريبي: التعديلات هنا مش بتتحفظ.</div></div>` : ""}
  <div class="row"><h1 class="grow">لوحة المطوّر</h1><span class="pill ${st.pill}">${st.t}</span></div>
  <div class="row" style="gap:6px"><a class="btn sm" href="./">فتح المنيو</a><a class="btn sm" href="admin.html">لوحة الإدارة</a></div>

  <fieldset><legend>١. هوية المطعم</legend>
    <div class="two stack"><label class="f">الاسم بالعربي<input class="in" id="bNar" value="${L2(b.name, "ar")}"></label>
      <label class="f">الاسم بالإنجليزي<input class="in" id="bNen" dir="ltr" value="${L2(b.name, "en")}"></label></div>
    <div class="two stack"><label class="f">العبارة (Tagline) بالعربي<input class="in" id="bTar" value="${L2(b.tagline, "ar")}"></label>
      <label class="f">بالإنجليزي<input class="in" id="bTen" dir="ltr" value="${L2(b.tagline, "en")}"></label></div>
    <div class="two"><label class="f">حرف اللوجو<input class="in" id="bIar" maxlength="2" value="${L2(b.initial, "ar")}"><small>لو مفيش صورة</small></label>
      <label class="f">بالإنجليزي<input class="in" id="bIen" dir="ltr" maxlength="2" value="${L2(b.initial, "en")}"></label></div>
    <label class="f">رابط صورة اللوجو (اختياري)<input class="in" id="bLogo" dir="ltr" inputmode="url" placeholder="فاضي = أيقونة التطبيق icons/icon-192.png" value="${esc(b.logoUrl || "")}"></label>
    <div class="row"><div class="logo-prev"><img id="bPrev" src="${esc(b.logoUrl || "icons/icon-192.png")}" alt="" onerror="this.style.opacity=.2"></div>
      <p class="hint grow">الأسهل: ارفع لوجو المطعم مكان ملفات مجلد <b>icons</b> في الـ repo، وسيب الرابط فاضي.</p></div>
    <label class="f">لون المطعم</label>
    <div class="swatches" id="bPal">${PALETTES.map(([k, c, n]) => `<button type="button" class="sw" style="background:${c}" data-v="${k}" aria-label="${n}" aria-pressed="${(b.palette || "green") === k}"></button>`).join("")}</div>
    <button class="btn primary" id="bSave">حفظ الهوية</button>
    ${menu ? "" : `<p class="hint">المنيو لسه فاضي، فالحفظ هيبدأ بمنيو تجريبي يعدّل عليه الأدمن.</p>`}
  </fieldset>

  <fieldset><legend>٢. الترخيص</legend>
    <p class="muted" style="margin:0">${l ? `${PLANS[l.plan] || "—"} · ${l.endsAt ? "ينتهي " + dateAr(l.endsAt) : "بدون تاريخ انتهاء"} · المنيو بعد الانتهاء: ${l.menuOnExpiry === "hide" ? "يتقفل" : "يفضل ظاهر"}` : "مفيش ترخيص."}</p>
    <div class="quick">${[[7, "+٧ أيام", "trial"], [30, "+شهر", "monthly"], [60, "+شهرين", "custom"], [365, "+سنة", "annual"], [0, "دائم", "lifetime"]]
      .map(([d, t, p]) => `<button class="btn" data-renew="${d}" data-plan="${p}">${t}</button>`).join("")}</div>
    <div class="two stack"><label class="f">الحالة<select class="in" id="lS"><option value="active" ${l?.status !== "suspended" ? "selected" : ""}>نشط</option><option value="suspended" ${l?.status === "suspended" ? "selected" : ""}>موقوف</option></select></label>
      <label class="f">الخطة<select class="in" id="lP">${Object.entries(PLANS).map(([k, t]) => `<option value="${k}" ${l?.plan === k ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
    <div class="two stack"><label class="f">ينتهي في<input class="in" id="lE" type="datetime-local" value="${toLocal(l?.endsAt)}"><small>فاضي = دائم</small></label>
      <label class="f">المنيو بعد الانتهاء<select class="in" id="lM"><option value="show" ${l?.menuOnExpiry !== "hide" ? "selected" : ""}>يفضل ظاهر للزبون</option><option value="hide" ${l?.menuOnExpiry === "hide" ? "selected" : ""}>يتقفل للزبون</option></select></label></div>
    <button class="btn primary" id="lSave">حفظ الترخيص</button>
  </fieldset>

  <fieldset><legend>٣. حساب الإدارة</legend>
    <p class="muted" style="margin:0">${meta?.adminUid ? `فيه حساب إدارة شغال من ${dtAr(meta.adminSince)}. لو عملت بيانات جديدة، القديمة بتبطل على طول.` : "لسه مفيش حساب إدارة."}</p>
    <label class="f">واتساب صاحب المطعم<input class="in" id="aPhone" dir="ltr" inputmode="tel" placeholder="01xxxxxxxxx" value="${esc(adminPriv.phone || "")}"></label>
    <div class="two stack"><label class="f">كلمة السر<input class="in" id="aPass" dir="ltr" autocomplete="off" placeholder="٦ حروف على الأقل"></label>
      <label class="f">كلمة الأمان<input class="in" id="aWord" dir="ltr" autocomplete="off" placeholder="٣ حروف على الأقل"></label></div>
    <div class="row"><button class="btn" id="aGen">توليد تلقائي</button><button class="btn primary grow" id="aMake">${meta?.adminUid ? "تغيير بيانات دخول الإدارة" : "إنشاء حساب الإدارة"}</button></div>
    <div id="aOut"></div>
  </fieldset>

  <fieldset><legend>QR Code للترابيزات</legend>
    <div class="qrbox"><canvas id="qrCanvas"></canvas><div class="grow"><p class="hint" style="margin:0">ده نفس الـ QR اللي الأدمن بيلاقيه في الإعدادات. نزّله واطبعه للمطعم.</p>
      <button class="btn primary" id="qrDl">تنزيل الصورة (PNG)</button></div></div>
  </fieldset>

  <fieldset><legend>٤. المنيو</legend>
    <p class="muted" style="margin:0">${menu ? `${fmt((menu.categories || []).length)} قسم · ${fmt((menu.products || []).length)} صنف · ${fmt((menu.ads || []).length)} إعلان · إصدار ${fmt(meta?.version || 0)}` : "المنيو لسه فاضي."}</p>
    <button class="btn ${menu ? "danger" : "primary"}" id="seedBtn">${menu ? "استبدال بالمنيو التجريبي" : "رفع منيو تجريبي"}</button>
  </fieldset>

  <fieldset><legend>٥. رفع الصور من الجهاز (اختياري)</legend>
    <p class="hint">repo عام للصور بس + Fine-grained token بصلاحية Contents: Read and write عليه بس. من غيره، الأدمن يقدر يحط روابط صور عادي.</p>
    <div class="two stack"><label class="f">owner<input class="in" id="gO" dir="ltr" value="${esc(gh?.owner)}" placeholder="urcod-eg"></label><label class="f">repo<input class="in" id="gR" dir="ltr" value="${esc(gh?.repo)}" placeholder="${esc(C.clientId)}-img"></label></div>
    <label class="f">Token<input class="in" id="gT" dir="ltr" type="password" autocomplete="off" placeholder="${gh?.token ? "محفوظ — اكتب جديد لو عايز تغيّره" : "github_pat_…"}"></label>
    <button class="btn" id="gSave">حفظ</button>
  </fieldset>

  <fieldset><legend>٦. ملاحظات خاصة بيك</legend>
    <textarea class="in" id="nT" style="min-height:120px" placeholder="الاتفاق، المدفوعات، طلبات التعديل…">${esc(notes)}</textarea>
    <button class="btn" id="nSave">حفظ</button>
  </fieldset>

  <fieldset><legend>٧. بيانات دخولك كمطوّر</legend>
    <div class="two stack"><label class="f">كلمة سر جديدة<input class="in" id="dPass" type="password" autocomplete="new-password"></label>
      <label class="f">كلمة أمان جديدة<input class="in" id="dWord" type="password" autocomplete="off"></label></div>
    <button class="btn" id="dSave">تغيير</button>
  </fieldset>

  <div class="card"><h2>آخر العمليات</h2>${logs.length ? `<div class="list" style="margin-top:8px">${logs.map(r => `<div class="item"><div class="t"><b>${esc(ACT[r.action] || r.action)}</b><small>${dtAr(r.at)}${r.note ? " · " + esc(r.note) : ""}</small></div></div>`).join("")}</div>` : `<p class="hint">مفيش.</p>`}</div>
  </div>`;
  bind();
}

/* ═════════ actions ═════════ */
function bind() {
  const cv = $("#qrCanvas");
  if (cv && window.MenuQR) MenuQR.draw(cv, { url: menuUrl(), title: menu?.brand?.name?.ar || menu?.brand?.name?.en || "المنيو", sub: "امسح الكود عشان تشوف المنيو" }).catch(() => {});
  $("#qrDl").onclick = () => cv?.width > 300 ? MenuQR.download(cv, "qr-" + C.clientId + ".png") : toast("الـ QR لسه بيتجهّز.", true);
  $("#bLogo").addEventListener("input", e => $("#bPrev").src = e.target.value.trim() || "icons/icon-192.png");
  $$("#bPal [data-v]").forEach(b => b.onclick = () => $$("#bPal [data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)));

  $("#bSave").onclick = async () => {
    const logo = $("#bLogo").value.trim();
    if (logo && !/^https:\/\//.test(logo)) return toast("رابط اللوجو لازم يبدأ بـ https://", true);
    if (!$("#bNar").value.trim() && !$("#bNen").value.trim()) return toast("اكتب اسم المطعم.", true);
    const m = menu ? clone(menu) : clone(window.SAMPLE_MENU);
    m.brand = Object.assign(m.brand || {}, {
      name: { ar: $("#bNar").value.trim(), en: $("#bNen").value.trim() }, tagline: { ar: $("#bTar").value.trim(), en: $("#bTen").value.trim() },
      initial: { ar: $("#bIar").value.trim() || ($("#bNar").value.trim()[0] || ""), en: $("#bIen").value.trim() || ($("#bNen").value.trim()[0] || "").toUpperCase() },
      logoUrl: logo, palette: $("#bPal [aria-pressed=true]")?.dataset.v || "green" });
    try { await api.saveMenu(m); api.log("brand_update", "public/menu"); toast("الهوية اتحفظت، وهتظهر للزبون في خلال ٥ دقايق."); render(); } catch (e) { toast(errMsg(e), true); }
  };

  const saveLic = async lic => { try { await api.saveLicense(lic); api.log("license_update", "public/meta", `${lic.status} / ${lic.plan} / ${lic.endsAt ? dateAr(lic.endsAt) : "دائم"}`); toast("الترخيص اتحفظ."); render(); } catch (e) { toast(errMsg(e), true); } };
  $$("[data-renew]").forEach(b => b.onclick = () => {
    const d = +b.dataset.renew, l = meta?.license, base = l?.endsAt && new Date(l.endsAt) > Date.now() ? new Date(l.endsAt).getTime() : Date.now();
    saveLic({ status: "active", plan: b.dataset.plan, menuOnExpiry: $("#lM").value, endsAt: d ? new Date(base + d * day).toISOString() : null });
  });
  $("#lSave").onclick = () => saveLic({ status: $("#lS").value, plan: $("#lP").value, menuOnExpiry: $("#lM").value, endsAt: $("#lE").value ? new Date($("#lE").value).toISOString() : null });

  $("#aGen").onclick = () => { $("#aPass").value = gen(8); $("#aWord").value = gen(4, "23456789"); };
  $("#aMake").onclick = async () => {
    const pass = $("#aPass").value.trim(), word = $("#aWord").value.trim(), phone = $("#aPhone").value.trim();
    if (pass.length < 6 || word.length < 3) return toast("كلمة السر ٦ حروف على الأقل، وكلمة الأمان ٣.", true);
    if (!meta) return toast("احفظ الهوية الأول عشان النسخة تتجهّز.", true);
    const btn = $("#aMake"); btn.disabled = true; btn.textContent = "بيتعمل…";
    try { await api.createAdmin(MenuData.secret(pass, word), phone); api.log("admin_account", "public/meta");
      render(); showCreds(pass, word); toast("حساب الإدارة جاهز."); }
    catch (e) { toast(errMsg(e), true); btn.disabled = false; btn.textContent = "إنشاء حساب الإدارة"; }
  };

  $("#seedBtn").onclick = async () => {
    if (menu && !confirm2("#seedBtn", "دوس تاني للتأكيد: المنيو الحالي هيتمسح")) return;
    const m = clone(window.SAMPLE_MENU); if (menu?.brand) m.brand = clone(menu.brand);
    try { await api.saveMenu(m); api.log("seed_menu", "public/menu"); toast("المنيو التجريبي اترفع."); render(); } catch (e) { toast(errMsg(e), true); }
  };

  $("#gSave").onclick = async () => {
    const g = { owner: $("#gO").value.trim(), repo: $("#gR").value.trim(), branch: "main", publicBase: "", token: $("#gT").value.trim() || gh?.token || "" };
    if (!g.owner || !g.repo || !g.token) return toast("املأ owner و repo و token.", true);
    try { await api.saveGh(g); api.log("github_config", "secure/github", g.owner + "/" + g.repo); toast("رفع الصور اتفعّل."); render(); } catch (e) { toast(errMsg(e), true); }
  };
  $("#nSave").onclick = async () => { try { await api.saveNotes($("#nT").value); toast("اتحفظت."); } catch (e) { toast(errMsg(e), true); } };
  $("#dSave").onclick = async () => {
    const p = $("#dPass").value, w = $("#dWord").value.trim();
    if (p.length < 6 || w.length < 3) return toast("كلمة السر ٦ حروف على الأقل، وكلمة الأمان ٣.", true);
    try { await api.changeDev(MenuData.secret(p, w)); api.log("dev_password", "auth"); $("#dPass").value = $("#dWord").value = ""; toast("بيانات دخولك اتغيّرت."); } catch (e) { toast(errMsg(e), true); }
  };
}
/* two-tap confirmation without dialogs */
function confirm2(sel, msg) {
  const b = $(sel); if (b.dataset.armed) return true;
  b.dataset.armed = "1"; const old = b.textContent; b.textContent = msg; setTimeout(() => { delete b.dataset.armed; b.textContent = old; }, 4000); return false;
}
function showCreds(pass, word) {
  const name = menu?.brand?.name?.ar || menu?.brand?.name?.en || "المطعم", url = menuUrl();
  const text = `بيانات دخول إدارة منيو ${name}\n\nالرابط: ${url}\nللدخول: اضغط على لوجو المطعم ٧ مرات ورا بعض.\n\nكلمة السر: ${pass}\nكلمة الأمان: ${word}\n\nماتشاركش البيانات دي مع حد.\nURCOD`;
  const ph = (adminPriv.phone || "").replace(/\D/g, "").replace(/^0/, "20");
  $("#aOut").innerHTML = `<div class="cred"><pre dir="rtl">${esc(text)}</pre>
    <div class="row"><button class="btn" id="cCopy">نسخ</button>${ph ? `<a class="btn primary grow" href="https://wa.me/${ph}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">إرسال واتساب</a>` : `<span class="hint">اكتب رقم الواتساب فوق عشان يظهر زرار الإرسال.</span>`}</div>
    <p class="hint">البيانات دي مش بتتحفظ في أي مكان. ابعتها أو انسخها دلوقتي.</p></div>`;
  $("#cCopy").onclick = () => { const done = () => toast("اتنسخت."); try { navigator.clipboard.writeText(text).then(done, () => sel()); } catch { sel(); }
    function sel() { const r = document.createRange(); r.selectNodeContents($("#aOut pre")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } };
  $("#aOut").scrollIntoView({ behavior: "smooth", block: "center" });
}

boot();
})();
