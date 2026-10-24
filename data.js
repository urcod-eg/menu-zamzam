/* ─────────────────────────────────────────────────────────────
   طبقة البيانات — مصمّمة على الخطة المجانية
   • الزبون بيقرا مستندين بس: public/meta (صغير جدًا) و public/menu (المنيو كله).
   • المنيو بيتخزن على الجهاز، ومابيتحمّلش تاني إلا لو رقم الإصدار في meta اتغيّر.
   • فحص الإصدار نفسه مش بيتكرر غير كل metaCheckMinutes دقيقة على نفس الجهاز.
   النتيجة: أول زيارة = قراءتين، الزيارات اللي بعدها = قراءة واحدة أو صفر.
   بنستخدم firestore-lite (أخف بكتير، من غير listeners ولا اتصال مفتوح).
   ───────────────────────────────────────────────────────────── */
window.MenuData = (function () {
  const C = window.URCOD_CONFIG;
  const KEY = "urcod." + C.clientId + ".menu";
  const CHECKED = "urcod." + C.clientId + ".checkedAt";
  const SDK = v => "https://www.gstatic.com/firebasejs/" + C.firebaseSdk + "/" + v + ".js";
  let appMod, fs, app, db;

  async function firebase() {
    if (db) return { app, db, fs };
    appMod = await import(SDK("firebase-app"));
    fs = await import(SDK("firebase-firestore-lite"));
    app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(C.firebase);
    db = fs.getFirestore(app);
    return { app, db, fs };
  }

  /* Timestamp → ISO عشان البيانات تتخزن JSON عادي على الجهاز */
  function plain(v) {
    if (v && typeof v.toDate === "function") return v.toDate().toISOString();
    if (Array.isArray(v)) return v.map(plain);
    if (v && typeof v === "object") { const o = {}; for (const k in v) o[k] = plain(v[k]); return o; }
    return v;
  }
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const readCache = () => { try { return JSON.parse(get(KEY)); } catch { return null; } };

  /* onData بتتنادى مرة من الكاش فورًا، ومرة تانية لو جه إصدار أحدث */
  async function load(onData) {
    if (C.useSample) return onData({ menu: window.SAMPLE_MENU, meta: window.SAMPLE_META, source: "sample" });

    const cached = readCache();
    if (cached) onData(Object.assign({}, cached, { source: "cache" }));

    const last = +get(CHECKED) || 0;
    if (cached && Date.now() - last < C.metaCheckMinutes * 6e4) return;

    try {
      const { db, fs } = await firebase();
      const metaSnap = await fs.getDoc(fs.doc(db, "public", "meta"));          /* قراءة ١ */
      set(CHECKED, String(Date.now()));
      if (!metaSnap.exists()) { if (!cached) onData({ empty: true }); return; }
      const meta = plain(metaSnap.data());

      if (cached && cached.meta && cached.meta.version === meta.version) {
        /* المنيو زي ما هو؛ بس لو حالة الترخيص اتغيّرت نحدّثها */
        if (JSON.stringify(cached.meta.license) !== JSON.stringify(meta.license)) {
          cached.meta = meta; set(KEY, JSON.stringify(cached));
          onData(Object.assign({}, cached, { source: "net" }));
        }
        return;
      }
      const menuSnap = await fs.getDoc(fs.doc(db, "public", "menu"));          /* قراءة ٢ (بس لما يتغيّر) */
      const out = { meta, menu: plain(menuSnap.exists() ? menuSnap.data() : {}) };
      set(KEY, JSON.stringify(out));
      onData(Object.assign({}, out, { source: "net", updated: !!cached }));
    } catch (e) {
      console.warn("[menu] network", e);
      if (!cached) onData({ error: true });
    }
  }

  /* حسابات الدخول داخلية (مش بريد حقيقي): المستخدم بيكتب كلمة سر + كلمة أمان بس */
  const devLogin = ("dev." + C.clientId + "@urcod.app").toLowerCase();
  const secret = (pass, word) => String(pass) + "::" + String(word).trim();
  async function auth() {
    const { app } = await firebase();
    const A = await import(SDK("firebase-auth"));
    return { A, auth: A.getAuth(app) };
  }
  async function meta() {
    const { db, fs } = await firebase();
    const m = await fs.getDoc(fs.doc(db, "public", "meta"));
    return m.exists() ? plain(m.data()) : null;
  }

  return { load, firebase, plain, devLogin, secret, auth, meta };
})();
