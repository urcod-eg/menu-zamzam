/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — واجهة الزبون
   كل البيانات جاية من MenuData (Firestore أو sample-menu.js).
   كل الحسابات (الخصومات، العدّادات، الإتاحة، المفضلة، حجم الخط) على الجهاز.
   ───────────────────────────────────────────────────────────── */
(function () {
"use strict";

/* ═════════ icons ═════════ */
const ICONS = {
  coffee:'<svg class="ic" viewBox="0 0 28 28"><path class="steam" d="M11 3c-1 1.5 1 2.5 0 4"/><path class="steam" d="M16 3c-1 1.5 1 2.5 0 4"/><path d="M6 11h15v5a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6z"/><path d="M21 13h1.5a2.5 2.5 0 0 1 0 5H20"/></svg>',
  burger:'<svg class="ic" viewBox="0 0 28 28"><path class="bun" d="M5 12a9 6 0 0 1 18 0z"/><path d="M4 15.5h20"/><path d="M5 19h18v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/></svg>',
  pizza:'<svg class="ic" viewBox="0 0 28 28"><g class="slice"><path d="M14 24 4.5 7a19 19 0 0 1 19 0z"/><path d="M6 9.5a16 16 0 0 1 16 0"/><circle cx="12" cy="12.5" r="1.3"/><circle cx="16" cy="15.5" r="1.3"/></g></svg>',
  dessert:'<svg class="ic" viewBox="0 0 28 28"><circle class="cherry" cx="14" cy="6" r="2"/><path d="M6 14a8 5 0 0 1 16 0z"/><path d="M7 14l2 9h10l2-9"/><path d="M12 14v9M16 14v9"/></svg>',
  drink:'<svg class="ic" viewBox="0 0 28 28"><path class="bun" d="M15 3l-2 6"/><path d="M8 9h12l-1.5 15h-9z"/><path d="M8.6 14h10.8"/></svg>',
  grill:'<svg class="ic" viewBox="0 0 28 28"><path d="M4 24 24 4"/><g class="bun"><rect x="8" y="12" width="5" height="5" rx="1.5" transform="rotate(-45 10.5 14.5)"/><rect x="12.5" y="7.5" width="5" height="5" rx="1.5" transform="rotate(-45 15 10)"/><rect x="17" y="3" width="4" height="4" rx="1.3" transform="rotate(-45 19 5)"/></g></svg>',
  salad:'<svg class="ic" viewBox="0 0 28 28"><path d="M4 14h20a10 10 0 0 1-20 0z"/><path class="bun" d="M9 14c0-4 3-6 5-7M14 14c0-3 2-5 5-5M11 9c-2-1-4 0-5 2"/></svg>',
  sandwich:'<svg class="ic" viewBox="0 0 28 28"><path d="M3 12 14 6l11 6-11 6z"/><path class="bun" d="M3 16l11 6 11-6"/></svg>',
  chicken:'<svg class="ic" viewBox="0 0 28 28"><path class="bun" d="M16 4a8 8 0 0 1 4 15l-4-4a8 8 0 0 1 0-11z"/><path d="M16 15l-6 6"/><circle cx="8.5" cy="22.5" r="2"/><circle cx="6" cy="20" r="2"/></svg>',
  fish:'<svg class="ic" viewBox="0 0 28 28"><path class="bun" d="M4 14c4-6 12-7 17 0-5 7-13 6-17 0z"/><path d="M21 14l4-4v8z"/><circle cx="9" cy="13" r="1"/></svg>',
  breakfast:'<svg class="ic" viewBox="0 0 28 28"><path d="M14 4c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z"/><circle class="cherry" cx="14" cy="15" r="3"/></svg>',
  plate:'<svg class="ic" viewBox="0 0 28 28"><circle cx="14" cy="15" r="9"/><circle class="cherry" cx="14" cy="15" r="5"/><path d="M4 4v6M6 4v6M5 10v14M24 4c-2 2-2 6 0 8v12"/></svg>',
  fav:'<svg class="ic heart-ic" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z"/></svg>',
  offers:'<svg class="ic" viewBox="0 0 24 24"><g class="flame"><path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-3.6 3-5.8 3.6-9.3 2.4 1.4 3.4 3.4 3.4 5.2 1-1 1.6-2.2 1.7-3.6 2.5 2 4.3 4.8 4.3 7.7 0 3.6-2.5 6.2-6.5 6.2Z"/><path class="core" d="M12 21c-1.7 0-2.8-1.1-2.8-2.7 0-1.6 1.3-2.6 2.8-4.3 1.5 1.7 2.8 2.7 2.8 4.3 0 1.6-1.1 2.7-2.8 2.7Z"/></g></svg>',
  top:'<svg class="ic" viewBox="0 0 24 24"><g class="medal"><path d="M8 3h8l-2 6h-4z"/><circle cx="12" cy="15" r="5.5"/><path d="M12 12.4l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z"/></g></svg>',
  new:'<svg class="ic" viewBox="0 0 24 24"><path class="spark" d="M11 3l1.6 4.6L17 9.2l-4.4 1.6L11 15.4 9.4 10.8 5 9.2l4.4-1.6z"/><path class="spark s2" d="M18 14l.8 2.2 2.2.8-2.2.8L18 20l-.8-2.2-2.2-.8 2.2-.8z"/><path class="spark s3" d="M5 16l.6 1.4L7 18l-1.4.6L5 20l-.6-1.4L3 18l1.4-.6z"/></svg>'
};
const icon = k => ICONS[k] || ICONS.plate;
const I = {
  heart:'<svg class="ic" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z"/></svg>',
  scoot:'<svg class="ic" viewBox="0 0 24 24"><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7M15 17l-2-8h-3M17 9h-3"/></svg>',
  bag:'<svg class="ic" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  na:'<svg class="ic" viewBox="0 0 24 24" style="width:1rem;height:1rem"><circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/></svg>',
  close:'<svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  clock:'<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M10 2.5h4"/></svg>',
  truck:'<svg class="ic" viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  gift:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13"/><path d="M12 7C10 3 6.5 4 7.5 6.5 8 7.5 12 7 12 7Zm0 0c2-4 5.5-3 4.5-.5C16 7.5 12 7 12 7Z"/></svg>',
  back:'<svg class="ic" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  phone:'<svg class="ic" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  chat:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>',
  pin:'<svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  link:'<svg class="ic" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  lock:'<svg class="ic" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  share:'<svg class="ic" viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  wifi:'<svg class="ic" viewBox="0 0 24 24"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/><path d="M3 3l18 18"/></svg>'
};

/* ═════════ UI strings (restaurant content comes from data) ═════════ */
const T = {
 ar:{search:"ابحث عن صنف…",pinned:"مثبّت ١٥ ث",cur:"ج.م",na:"غير متاح حاليًا",both:"دليفري واستلام",delivery_only:"دليفري فقط",pickup_only:"استلام فقط",
  new:"جديد",secOff:"القسم متوقف",favs:"المفضلة",offers:"عروضنا",newSec:"جديد",
  favEmpty:"لسه مفيش حاجة في المفضلة. دوس على القلب فوق أي صنف عشان تلاقيه هنا.",offersEmpty:"مفيش عروض شغالة دلوقتي. ارجع تاني قريب.",
  noResults:"مفيش أصناف بالاسم ده.",from:"من",size:"اختار الحجم",close:"إغلاق",addFav:"إضافة للمفضلة",remFav:"شيل من المفضلة",items:"صنف",
  offersHead:"عروض لفترة محدودة",offersSub:"الأسعار دي سارية لحد ما العداد يخلص",newHead:"وصل جديد",newSub:"أصناف لسه نازلة المنيو، جرّبها الأول",
  endsIn:"ينتهي خلال",soonest:"أقرب عرض بيخلص خلال",d:"يوم",h:"ساعة",m:"دقيقة",s:"ثانية",ds:"ي",hs:"س",ms:"د",ss:"ث",
  off:"خصم",save:"وفّر",freeDel:"توصيل مجاني",freeDelLong:"التوصيل مجاني على الصنف ده طول فترة العرض",special:"عرض خاص",
  pctWhat:"خصم على كل الأحجام",amtWhat:"خصم ثابت من السعر",priceWhat:"سعر مخفّض لفترة محدودة",until:"العرض لحد",
  aboutR:"عن المطعم",aboutSub:"العنوان والمواعيد والتواصل",urcodSub:"المطوّر وأنظمتنا",madeBy:"صُمِّمَ بواسطة",back:"رجوع",copy:"نسخ",copied:"اتنسخ",
  phone:"تليفون",wa:"واتساب",address:"العنوان",map:"افتح الخريطة",hoursT:"مواعيد العمل",social:"تابعنا",aboutT:"عن المطعم",contactT:"التواصل",
  days:["الأحد","الاتنين","التلات","الأربع","الخميس","الجمعة","السبت"],urcodT:"عن URCOD",
  urcodAbout:"URCOD بتبني أنظمة جاهزة ومخصّصة للمطاعم والشركات، شغالة على الموبايل والكمبيوتر، وكل عميل بياخد نسخة بهويته.",
  devT:"المطوّر",sysT:"أنظمتنا",sys:["المنيو الإلكتروني","إدارة المطاعم","إدارة الجيم","المرتبات والحضور","ERP عملاء ومخازن","مواقع احترافية"],
  getCopy:"عايز نسخة لمطعمك أو نظام مخصّص؟",ver:"الإصدار",
  topSec:"الأكثر طلبًا",topHead:"الأكثر طلبًا",topSub:"الأصناف اللي زباينّا بيحبوها أكتر",addons:"إضافات",share:"مشاركة",
  openNow:"مفتوح الآن",closedNow:"مقفول دلوقتي",closesAt:"بيقفل {t}",opensAt:"بيفتح {t}",branches:"فروعنا",
  install:"تثبيت التطبيق",installSub:"افتح المنيو من الشاشة الرئيسية",installT:"نزّل المنيو على موبايلك",installP:"يفتح أسرع، ومن غير ما تدوّر على اللينك.",installGo:"تثبيت",
  installed:"التطبيق اتثبّت على موبايلك.",iosT:"تثبيت المنيو على الآيفون",ios1:"دوس على زرار المشاركة {i} تحت في Safari",ios2:"اختار «إضافة إلى الشاشة الرئيسية» (Add to Home Screen)",ios3:"دوس «إضافة»، وهتلاقي المنيو جنب تطبيقاتك",
  adminLogin:"دخول إدارة المطعم",devLogin:"دخول المطوّر",email:"البريد الإلكتروني",pass:"كلمة السر",word:"كلمة الأمان",passAgain:"كلمة السر تاني",
  setupTitle:"تجهيز النسخة لأول مرة",setupHint:"اختار كلمة سر وكلمة أمان للمطوّر. هتدخل بيهم بعد كده بـ ١٠ ضغطات على لوجو URCOD.",setupGo:"تجهيز ودخول",errTaken:"حساب المطوّر للنسخة دي معمول قبل كده بكلمة سر تانية. لو مش إنت اللي عملته: امسحه من Firebase › Authentication › Users وجرّب تاني.",errSetupShort:"لحساب المطوّر: كلمة السر ٨ حروف على الأقل، وكلمة الأمان ٤.",
  errShort:"كلمة السر ٦ حروف على الأقل، وكلمة الأمان ٣ على الأقل.",errMatch:"كلمتين السر مش زي بعض.",noAdmin:"لسه مفيش حساب إدارة للمطعم ده. كلّم URCOD.",enter:"دخول",entering:"جاري الدخول…",
  closedT:"المنيو مش متاح دلوقتي",closedP:"المطعم هيرجّع المنيو قريب. تقدر تتواصل معاهم من «عن المطعم».",
  offlineT:"مفيش اتصال بالإنترنت",offlineP:"أول مرة المنيو محتاج إنترنت عشان يتحمّل. بعد كده هيفتح حتى من غير نت.",
  emptyT:"المنيو لسه بيتجهّز",emptyP:"الأصناف هتظهر هنا أول ما الإدارة تضيفها.",updated:"المنيو اتحدّث",
  loginSample:"الدخول بيشتغل بعد ربط Firebase في config.js.",errCred:"كلمة السر أو كلمة الأمان غلط.",errMany:"محاولات كتير. استنى دقيقة وجرّب تاني.",
  errRole:"الحساب ده مالوش صلاحية الدخول هنا.",errNet:"مفيش اتصال. اتأكد من النت وجرّب تاني.",okGo:"تم الدخول، بيفتح اللوحة…"},
 en:{search:"Search the menu…",pinned:"Pinned 15s",cur:"EGP",na:"Currently unavailable",both:"Delivery & pickup",delivery_only:"Delivery only",pickup_only:"Pickup only",
  new:"New",secOff:"Section paused",favs:"Favorites",offers:"Offers",newSec:"New",
  favEmpty:"Nothing saved yet. Tap the heart on any item to keep it here.",offersEmpty:"No offers running right now. Check back soon.",
  noResults:"No items match that name.",from:"From",size:"Choose a size",close:"Close",addFav:"Add to favorites",remFav:"Remove from favorites",items:"items",
  offersHead:"Limited-time offers",offersSub:"These prices hold until the timer runs out",newHead:"Just landed",newSub:"Fresh on the menu. Be the first to try them",
  endsIn:"Ends in",soonest:"Next offer ends in",d:"days",h:"hours",m:"min",s:"sec",ds:"d",hs:"h",ms:"m",ss:"s",
  off:"OFF",save:"Save",freeDel:"Free delivery",freeDelLong:"Delivery is free on this item while the offer runs",special:"Special",
  pctWhat:"Off every size",amtWhat:"Flat discount off the price",priceWhat:"Reduced price for a limited time",until:"Offer runs until",
  aboutR:"About us",aboutSub:"Address, hours and contact",urcodSub:"Developer and our systems",madeBy:"Designed by",back:"Back",copy:"Copy",copied:"Copied",
  phone:"Phone",wa:"WhatsApp",address:"Address",map:"Open map",hoursT:"Opening hours",social:"Follow us",aboutT:"About the restaurant",contactT:"Contact",
  days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],urcodT:"About URCOD",
  urcodAbout:"URCOD builds ready-made and custom systems for restaurants and businesses, on phone and desktop, with each client getting a copy in its own brand.",
  devT:"Developer",sysT:"Our systems",sys:["Digital menu","Restaurant management","Gym management","Payroll & attendance","ERP: customers & stock","Professional websites"],
  getCopy:"Want a copy for your restaurant or a custom system?",ver:"Version",
  topSec:"Most popular",topHead:"Most popular",topSub:"The dishes our guests love most",addons:"Add-ons",share:"Share",
  openNow:"Open now",closedNow:"Closed now",closesAt:"closes {t}",opensAt:"opens {t}",branches:"Our branches",
  install:"Install the app",installSub:"Open the menu from your home screen",installT:"Add the menu to your phone",installP:"Opens faster, no need to look for the link.",installGo:"Install",
  installed:"The app is installed.",iosT:"Install on iPhone",ios1:"Tap the Share button {i} at the bottom of Safari",ios2:"Choose \u201cAdd to Home Screen\u201d",ios3:"Tap \u201cAdd\u201d. The menu now sits with your apps",
  adminLogin:"Restaurant admin login",devLogin:"Developer login",email:"Email",pass:"Password",word:"Security word",passAgain:"Password again",
  setupTitle:"First-time setup",setupHint:"Choose the developer password and security word. You'll use them with 10 taps on the URCOD logo.",setupGo:"Set up and sign in",errTaken:"The developer account already exists with another password. If it wasn't you, delete it in Firebase › Authentication › Users and try again.",errSetupShort:"Developer account: password at least 8 characters, security word at least 4.",
  errShort:"Password needs 6+ characters and the security word 3+.",errMatch:"The passwords don't match.",noAdmin:"No admin account yet. Contact URCOD.",enter:"Sign in",entering:"Signing in…",
  closedT:"The menu is not available right now",closedP:"The restaurant will bring it back soon. You can still reach them from About us.",
  offlineT:"No internet connection",offlineP:"The menu needs the internet the first time. After that it opens offline too.",
  emptyT:"The menu is being prepared",emptyP:"Items will appear here as soon as the restaurant adds them.",updated:"Menu updated",
  loginSample:"Sign-in works once Firebase is set in config.js.",errCred:"Wrong password or security word.",errMany:"Too many attempts. Wait a minute and try again.",
  errRole:"This account can't sign in here.",errNet:"No connection. Check the internet and try again.",okGo:"Signed in, opening the panel…"}
};

const DEV = { name:{ar:"محمود جمال الدين",en:"Mahmoud Gamal Eldeen"}, role:{ar:"مبرمج ومطوّر",en:"Programmer & Developer"},
  phone:"01508613866", linkedin:"https://www.linkedin.com/in/mahmoud-gamal-eldeen-073967440/", version:"1.0" };
const AD_BG = { green:"linear-gradient(120deg,#1f5a3d,#3c8a5f)", amber:"linear-gradient(120deg,#8a4b12,#d08a24)",
  rose:"linear-gradient(120deg,#7a2338,#c2455e)", blue:"linear-gradient(120deg,#1f4fb0,#4f7fe0)", dark:"linear-gradient(120deg,#11161f,#2c3442)" };

/* ═════════ state ═════════ */
const C = window.URCOD_CONFIG, NS = "urcod." + C.clientId + ".";
const store = { get(k,d){try{const v=localStorage.getItem(NS+k);return v==null?d:JSON.parse(v)}catch{return d}}, set(k,v){try{localStorage.setItem(NS+k,JSON.stringify(v))}catch{}} };
const $ = s => document.querySelector(s), root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const H = 36e5;

let M = null, META = null;                 /* menu + meta */
let CATS = [], MAINS = [], ALL = [], ADS = [];
let favs = new Set(store.get("favs", [])), fs = store.get("fs", 1);
let lang = store.get("lang", null), active = null, q = "", openId = null;

const L = o => o == null ? "" : typeof o === "string" ? o : (o[lang] || o.ar || o.en || "");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const fmt = n => (+n).toLocaleString(lang === "ar" ? "ar-EG" : "en", { maximumFractionDigits: 2 });
const pad = v => (v < 10 ? fmt(0) : "") + fmt(v);
const pct = () => lang === "ar" ? "٪" : "%";
const safeUrl = (u, protos = ["https:"]) => { try { const x = new URL(u); return protos.includes(x.protocol) ? x.href : ""; } catch { return ""; } };
const cur = () => L(M?.settings?.currency) || T[lang].cur;

/* ═════════ data model helpers ═════════ */
function prepare(menu) {
  M = menu || {};
  const cats = (M.categories || []).filter(c => !c.hidden).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const byId = Object.fromEntries(cats.map(c => [c.id, c]));
  CATS = cats; MAINS = cats.filter(c => !c.parentId);
  ALL = (M.products || []).filter(p => byId[p.categoryId] && !p.hidden).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map(p => {
    const cat = byId[p.categoryId], main = cat.parentId ? byId[cat.parentId] : cat;
    return Object.assign({}, p, { cat, main: main || cat });
  });
  const now = Date.now();
  ADS = (M.ads || []).filter(a => a.enabled !== false && (!a.startAt || new Date(a.startAt) <= now) && (!a.endAt || new Date(a.endAt) > now))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}
/* final availability = item AND its subcategory AND its main category (stored states untouched) */
const isAvail = p => p.available !== false && p.cat.available !== false && p.main.available !== false;
const catAvail = c => c.available !== false && (!c.parentId || CATS.find(x => x.id === c.parentId)?.available !== false);

function liveOffer(p) {
  const o = p.offer; if (!o || o.enabled === false) return null;
  const n = Date.now();
  if (o.startAt && new Date(o.startAt) > n) return null;
  if (!o.endAt || new Date(o.endAt) <= n) return null;
  return o;
}
const CUTS = ["percent", "amount", "price"];
function sale(p, vid, base) {
  const o = liveOffer(p); if (!o || !CUTS.includes(o.type)) return null;
  let v = null;
  if (o.type === "percent") v = Math.round(base * (1 - (+o.value || 0) / 100));
  else if (o.type === "amount") v = Math.max(0, base - (+o.value || 0));
  else v = o.prices ? o.prices[vid] ?? null : o.price ?? null;
  return v != null && v < base ? v : null;     /* never show a "discount" that isn't one */
}
function rows(p) {
  if (p.priceType === "variants" && p.variants?.length)
    return p.variants.map(v => ({ vid: v.id, label: L(v.label) || v.id, base: +v.price, now: sale(p, v.id, +v.price) }));
  return [{ vid: null, label: "", base: +p.price || 0, now: sale(p, null, +p.price || 0) }];
}
const cheapest = p => rows(p).reduce((a, b) => ((b.now ?? b.base) < (a.now ?? a.base) ? b : a));
const hasSizes = p => p.priceType === "variants" && p.variants?.length > 1;

function stamp(p) {
  const o = liveOffer(p), t = T[lang]; if (!o) return null;
  if (o.type === "percent") return { html: `−${fmt(o.value)}${pct()}<br>${t.off}` };
  if (o.type === "amount") return { html: `${t.save}<br>${fmt(o.value)}` };
  if (o.type === "price") { const r = cheapest(p); if (r.now == null) return null; return { html: `−${fmt(Math.round((1 - r.now / r.base) * 100))}${pct()}<br>${t.off}` }; }
  if (o.type === "free_delivery") return { html: I.truck, alt: 1 };
  return { html: I.gift, alt: 1 };
}
function left(ms) { const s = Math.max(0, Math.floor(ms / 1e3)); return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 }; }
function shortLeft(ends) {
  const t = T[lang], l = left(new Date(ends) - Date.now());
  return l.d ? `${fmt(l.d)}${t.ds} ${fmt(l.h)}${t.hs}` : l.h ? `${fmt(l.h)}${t.hs} ${fmt(l.m)}${t.ms}` : `${fmt(l.m)}${t.ms} ${fmt(l.s)}${t.ss}`;
}
const endDate = e => new Date(e).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

/* ═════════ fragments ═════════ */
function thumb(p, extra = "", id = "") {
  const img = p.image && safeUrl(p.image) ? `<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" onload="this.classList.add('ok')" onerror="this.remove()">` : "";
  return `<div class="thumb" ${id ? `id="${id}"` : `data-thumb="${esc(p.id)}"`} ${extra}>${icon(p.main.icon)}${img}${p.isNew ? `<span class="newtag">${T[lang].new}</span>` : ""}</div>`;
}
function priceHTML(p, r, showFrom) {
  const from = showFrom && hasSizes(p) ? `<span class="from">${T[lang].from}</span>` : "";
  if (r.now != null) return `<div class="price cut">${from}<span class="old">${fmt(r.base)}</span><span class="now"><span class="v">${fmt(r.now)}</span> <span class="cur">${cur()}</span></span></div>`;
  return `<div class="price">${from}<span class="now"><span class="v">${fmt(r.base)}</span></span> <span class="cur">${cur()}</span></div>`;
}
function perk(p) {
  const o = liveOffer(p), t = T[lang]; if (!o) return "";
  if (o.type === "free_delivery") return `<span class="perk">${I.truck}${t.freeDel}</span>`;
  if (o.type === "custom") return `<span class="perk">${I.gift}${esc(L(o.text))}</span>`;
  return "";
}
function timer(p) {
  const o = liveOffer(p); if (!o) return "";
  const urgent = new Date(o.endAt) - Date.now() < 24 * H;
  return `<span class="timer ${urgent ? "urgent" : ""}" data-ends="${o.endAt}">${I.clock}<span>${T[lang].endsIn} ${shortLeft(o.endAt)}</span></span>`;
}
const favBtn = p => { const on = favs.has(p.id), t = T[lang];
  return `<button class="fav ${on ? "on" : ""}" data-fav="${esc(p.id)}" aria-pressed="${on}" aria-label="${on ? t.remFav : t.addFav}">${I.heart}</button>`; };
function card(p, n) {
  const av = isAvail(p), o = liveOffer(p), st = stamp(p), t = T[lang];
  return `<article class="card ${av ? "" : "na"} ${o ? "has-offer" : ""} ${p.isNew && active === "new" ? "is-new" : ""}" style="--i:${n}" data-id="${esc(p.id)}" tabindex="0" role="button" aria-label="${esc(L(p.name))}">
    ${thumb(p)}
    ${st ? `<span class="stamp ${st.alt ? "alt" : ""}">${st.html}</span>` : ""}
    ${favBtn(p)}
    <div class="c-body">
      <h3>${esc(L(p.name))}</h3>
      ${L(p.desc) ? `<p class="c-desc">${esc(L(p.desc))}</p>` : ""}
      <div class="c-foot">
        <span class="na-tag">${I.na}${t.na}</span>
        ${perk(p)}${priceHTML(p, cheapest(p), true)}${timer(p)}
      </div>
    </div></article>`;
}

/* ═════════ sections ═════════ */
const SPECIAL = { offers: "k-offers", top: "k-top", new: "k-new", fav: "k-fav" };
function itemsFor(id) {
  if (id === "offers") return ALL.filter(liveOffer).sort((a, b) => new Date(a.offer.endAt) - new Date(b.offer.endAt));
  if (id === "new") return ALL.filter(p => p.isNew);
  if (id === "top") return ALL.filter(p => p.featured);
  if (id === "fav") return ALL.filter(p => favs.has(p.id));
  return ALL.filter(p => p.main.id === id);
}
function rail() {
  const t = T[lang], s = M.settings || {}, nOff = itemsFor("offers").length, nNew = itemsFor("new").length, nTop = itemsFor("top").length;
  const chips = [
    s.showOffersTab !== false && nOff ? { id: "offers", name: t.offers, count: nOff } : null,
    s.showFeaturedTab !== false && nTop ? { id: "top", name: t.topSec } : null,
    s.showNewTab !== false && nNew ? { id: "new", name: t.newSec } : null,
    { id: "fav", name: t.favs, count: favs.size, cid: "favCount" },
    ...MAINS.map(c => ({ id: c.id, name: L(c.name), icon: c.icon, off: c.available === false }))
  ].filter(Boolean);
  if (!chips.some(c => c.id === active)) active = chips.find(c => c.id !== "fav")?.id || "fav";
  $("#rail").innerHTML = '<span class="indicator" id="ind"></span>' + chips.map(c =>
    `<button class="chip ${SPECIAL[c.id] || ""} ${c.id === active ? "on" : ""} ${c.off ? "off" : ""}" data-id="${esc(c.id)}" aria-pressed="${c.id === active}">
      ${SPECIAL[c.id] ? ICONS[c.id] : icon(c.icon)}<span>${esc(c.name)}</span>${c.count ? `<span class="count" ${c.cid ? `id="${c.cid}"` : ""}>${fmt(c.count)}</span>` : ""}</button>`).join("");
  moveInd(true);
}
function moveInd(instant) {
  const on = $(".chip.on"), ind = $("#ind"); if (!on || !ind) return;
  if (instant) { ind.style.transition = "none"; requestAnimationFrame(() => requestAnimationFrame(() => ind.style.transition = "")); }
  ind.className = "indicator " + (SPECIAL[active] || "");
  ind.style.width = on.offsetWidth + "px"; ind.style.transform = `translateX(${on.offsetLeft}px)`;
  on.scrollIntoView({ behavior: reduce || instant ? "auto" : "smooth", inline: "center", block: "nearest" });
}
function setActive(id) {
  active = id; q = ""; $("#q").value = "";
  document.querySelectorAll(".chip").forEach(c => { const on = c.dataset.id === id; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on);
    if (on) c.querySelectorAll("svg *").forEach(n => { n.style.animation = "none"; void n.offsetWidth; n.style.animation = ""; }); });
  moveInd(false); grid();
}
function head(items) {
  const t = T[lang];
  if (q) return `<div class="sec"><h2>«${esc(q)}»</h2><small>${fmt(items.length)} ${t.items}</small></div>`;
  if (active === "offers") { const f = items[0];
    return `<div class="hero-sec offers"><svg class="ic big" viewBox="0 0 24 24"><path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-3.6 3-5.8 3.6-9.3 2.4 1.4 3.4 3.4 3.4 5.2 1-1 1.6-2.2 1.7-3.6 2.5 2 4.3 4.8 4.3 7.7 0 3.6-2.5 6.2-6.5 6.2Z"/></svg>
      <h2>${t.offersHead}</h2><p>${t.offersSub}</p>${f ? `<span class="soon" data-soon="${f.offer.endAt}">${I.clock.replace('class="ic"', 'class="ic" style="width:1rem;height:1rem"')}<span>${t.soonest} ${shortLeft(f.offer.endAt)}</span></span>` : ""}</div>`; }
  if (active === "top") return `<div class="hero-sec top"><svg class="ic big" viewBox="0 0 24 24"><path d="M8 3h8l-2 6h-4z"/><circle cx="12" cy="15" r="5.5"/></svg><h2>${t.topHead}</h2><p>${t.topSub}</p></div>`;
  if (active === "new") return `<div class="hero-sec new"><svg class="ic big" viewBox="0 0 24 24"><path d="M11 3l1.6 4.6L17 9.2l-4.4 1.6L11 15.4 9.4 10.8 5 9.2l4.4-1.6z"/></svg><h2>${t.newHead}</h2><p>${t.newSub}</p></div>`;
  if (active === "fav") return `<div class="sec"><h2>${t.favs}</h2>${items.length ? `<small>${fmt(items.length)} ${t.items}</small>` : ""}</div>`;
  const c = MAINS.find(c => c.id === active);
  return `<div class="sec"><h2>${esc(L(c.name))}</h2><small>${fmt(items.length)} ${t.items}</small>${c.available === false ? `<small>${t.secOff}</small>` : ""}</div>`;
}
function grid() {
  const t = T[lang];
  let items, html = "";
  if (q) items = ALL.filter(p => (L(p.name) + " " + (p.name?.ar || "") + " " + (p.name?.en || "") + " " + L(p.desc)).toLowerCase().includes(q));
  else items = itemsFor(active);
  $("#secHead").innerHTML = head(items);
  if (!items.length) {
    const msg = q ? t.noResults : active === "offers" ? t.offersEmpty : t.favEmpty;
    $("#grid").innerHTML = `<div class="empty">${active === "offers" && !q ? ICONS.offers : ICONS.fav}${msg}</div>`; return;
  }
  const main = !q && MAINS.find(c => c.id === active);
  if (main) {
    /* items directly in the main category, then one block per subcategory */
    let n = 0;
    const direct = items.filter(p => p.cat.id === main.id);
    html += direct.map(p => card(p, n++)).join("");
    CATS.filter(c => c.parentId === main.id).forEach(sub => {
      const list = items.filter(p => p.cat.id === sub.id); if (!list.length) return;
      html += `<div class="sub ${catAvail(sub) ? "" : "na"}" style="--i:${n}">${esc(L(sub.name))}${catAvail(sub) ? "" : ` <small>${t.secOff}</small>`}</div>`;
      html += list.map(p => card(p, n++)).join("");
    });
  } else html = items.map(card).join("");
  $("#grid").innerHTML = html;
}

/* ═════════ favorites (device only) ═════════ */
function toggleFav(id, btn) {
  favs.has(id) ? favs.delete(id) : favs.add(id); store.set("favs", [...favs]);
  const on = favs.has(id), t = T[lang];
  document.querySelectorAll(`[data-fav="${CSS.escape(id)}"]`).forEach(b => { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", on ? t.remFav : t.addFav); });
  if (on && btn && !reduce) {
    btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
    const b = document.createElement("span"); b.className = "burst"; b.innerHTML = [...Array(8)].map((_, k) => `<i style="--a:${k * 45}deg"></i>`).join("");
    btn.appendChild(b); setTimeout(() => b.remove(), 650);
  }
  const fc = $('.chip[data-id="fav"]'); let cnt = $("#favCount");
  if (favs.size) { if (!cnt) { cnt = document.createElement("span"); cnt.className = "count"; cnt.id = "favCount"; fc.appendChild(cnt); }
    cnt.textContent = fmt(favs.size); cnt.classList.remove("bump"); void cnt.offsetWidth; cnt.classList.add("bump"); }
  else cnt?.remove();
  if (active === "fav" && !q && !$("#sheet").classList.contains("open")) grid();
}

/* ═════════ product sheet ═════════ */
function coupon(p) {
  const o = liveOffer(p), t = T[lang]; if (!o) return "";
  let big, what;
  if (o.type === "percent") { big = `−${fmt(o.value)}${pct()}`; what = t.pctWhat; }
  else if (o.type === "amount") { big = `−${fmt(o.value)} <small style="font-size:.9rem">${cur()}</small>`; what = t.amtWhat; }
  else if (o.type === "price") { const r = cheapest(p); big = r.now != null ? `−${fmt(Math.round((1 - r.now / r.base) * 100))}${pct()}` : I.gift; what = t.priceWhat; }
  else if (o.type === "free_delivery") { big = I.truck; what = t.freeDelLong; }
  else { big = I.gift; what = esc(L(o.text)); }
  const l = left(new Date(o.endAt) - Date.now());
  return `<div class="coupon"><div class="lbl">${o.type === "custom" ? t.special : o.type === "free_delivery" ? t.freeDel : t.offersHead}</div>
    <div class="head"><div class="bigv">${big}</div><div class="what">${what}</div></div>
    <div class="clock" id="clock" data-ends="${o.endAt}">${[["d", t.d], ["h", t.h], ["m", t.m], ["s", t.s]].map(([k, lb]) => `<div class="u"><b data-k="${k}"><span>${pad(l[k])}</span></b><small>${lb}</small></div>`).join("")}</div>
    <div class="ends">${t.until} ${endDate(o.endAt)}</div></div>`;
}
function sheetHTML(p) {
  const t = T[lang], av = isAvail(p), r = rows(p), st = stamp(p);
  return `<div class="grab"></div>
  <div class="s-hero">${thumb(p, av ? "" : 'style="filter:grayscale(1);opacity:.55"', "sThumb")}
    ${st ? `<span class="stamp ${st.alt ? "alt" : ""}">${st.html}</span>` : ""}
    <button class="s-close" id="sClose" aria-label="${t.close}">${I.close}</button></div>
  <div class="s-body">
    <div class="s-head"><h2 id="sTitle">${esc(L(p.name))}</h2><div class="s-acts"><button class="fav share" id="sShare" aria-label="${t.share}">${I.share}</button>${favBtn(p)}</div></div>
    ${L(p.desc) ? `<p class="s-desc">${esc(L(p.desc))}</p>` : ""}
    ${hasSizes(p) ? `<div><div style="font-weight:800;margin-bottom:8px">${t.size}</div><div class="sizes">${r.map((x, j) => `<button class="size ${j ? "" : "on"}" data-j="${j}" ${av ? "" : "disabled"}>${esc(x.label)}${x.now != null ? `<s>${fmt(x.base)}</s><span>${fmt(x.now)} ${cur()}</span>` : `<span>${fmt(x.base)} ${cur()}</span>`}</button>`).join("")}</div></div>` : ""}
    <div class="s-price" id="sPrice">${priceHTML(p, r[0], false)}</div>
    ${p.addons?.length ? `<div class="addons"><div style="font-weight:800;margin-bottom:6px">${t.addons}</div>${p.addons.map(a => `<div class="addon"><span>${esc(L(a.name))}</span><b>+${fmt(a.price)} <small>${cur()}</small></b></div>`).join("")}</div>` : ""}
    ${coupon(p)}
    <div class="facts">${av ? "" : `<span class="fact warn">${I.na}${t.na}</span>`}
      <span class="fact">${p.service !== "pickup_only" ? I.scoot : ""}${p.service !== "delivery_only" ? I.bag : ""}${t[p.service] || t.both}</span></div>
  </div>`;
}
function openSheet(id) {
  const p = ALL.find(i => i.id === id); if (!p) return; openId = id;
  const src = document.querySelector(`[data-thumb="${CSS.escape(id)}"]`);
  const vt = !!document.startViewTransition && !reduce && src;
  const show = () => { if (src) src.style.viewTransitionName = "";
    $("#sheet").innerHTML = sheetHTML(p); $("#sThumb").style.viewTransitionName = vt ? "hero" : "";
    $("#sheet").scrollTop = 0; $("#sheet").classList.add("open"); $("#scrim").classList.add("open"); document.body.style.overflow = "hidden"; };
  if (vt) { src.style.viewTransitionName = "hero"; document.startViewTransition(show); } else show();
  setTimeout(() => $("#sClose")?.focus({ preventScroll: true }), 350);
}
function closeSheet() {
  if (!openId) return; const id = openId; openId = null;
  const dst = document.querySelector(`[data-thumb="${CSS.escape(id)}"]`), s = $("#sThumb");
  const vt = !!document.startViewTransition && !reduce && dst && s;
  const hide = () => { $("#sheet").classList.remove("open"); $("#scrim").classList.remove("open"); document.body.style.overflow = pageOpen ? "hidden" : "";
    if (s) s.style.viewTransitionName = ""; if (dst) dst.style.viewTransitionName = vt ? "hero" : ""; };
  if (vt) { $("#sheet").style.transition = "none"; document.startViewTransition(hide).finished.finally(() => { if (dst) dst.style.viewTransitionName = ""; $("#sheet").style.transition = ""; }); }
  else hide();
  if (active === "fav") grid();
  document.querySelector(`.card[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
}

/* ═════════ countdowns: one interval, no network ═════════ */
setInterval(() => {
  let expired = false;
  document.querySelectorAll("[data-ends]").forEach(el => {
    const ms = new Date(el.dataset.ends) - Date.now();
    if (ms <= 0) { expired = true; return; }
    if (el.id === "clock") { const l = left(ms); el.querySelectorAll("b").forEach(b => { const v = pad(l[b.dataset.k]), sp = b.firstElementChild;
        if (sp.textContent !== v) { sp.textContent = v; sp.classList.remove("roll"); void sp.offsetWidth; sp.classList.add("roll"); } }); }
    else { el.lastElementChild.textContent = `${T[lang].endsIn} ${shortLeft(el.dataset.ends)}`; el.classList.toggle("urgent", ms < 24 * H); }
  });
  const s = $("[data-soon]"); if (s) s.lastElementChild.textContent = `${T[lang].soonest} ${shortLeft(s.dataset.soon)}`;
  if (expired) { rail(); grid(); if (openId) openSheet(openId); }
}, 1000);

/* ═════════ ads: rotate, tap pins 15 s ═════════ */
const ROTATE = 4500, PIN = 15000; let adIdx = 0, adTimer = null, pinTimer = null;
function buildAds() {
  const box = $("#ads"); box.querySelectorAll(".ad").forEach(a => a.remove());
  box.hidden = !ADS.length; if (!ADS.length) return;
  adIdx = Math.min(adIdx, ADS.length - 1);
  ADS.forEach((a, i) => {
    const d = document.createElement("div"); const img = a.image && safeUrl(a.image);
    d.className = "ad" + (i === adIdx ? " on" : "") + (img ? " has-img" : ""); d.dataset.i = i;
    d.style.background = img ? `url("${img.replace(/"/g, "%22")}")` : (AD_BG[a.theme] || AD_BG.green);
    d.innerHTML = `${img ? "" : `<div class="art">${icon(a.icon)}</div>`}<div class="txt">${L(a.kicker) ? `<small>${esc(L(a.kicker))}</small>` : ""}<b>${esc(L(a.title))}</b>${L(a.body) ? `<p>${esc(L(a.body))}</p>` : ""}</div>`;
    box.insertBefore(d, $("#dots"));
  });
  $("#dots").innerHTML = ADS.length > 1 ? ADS.map((_, i) => `<button class="dot ${i === adIdx ? "on" : ""}" data-i="${i}" aria-label="${i + 1}"></button>`).join("") : "";
  $("#dots").style.setProperty("--dur", ROTATE + "ms");
}
function showAd(i) {
  if (!ADS.length) return; adIdx = (i + ADS.length) % ADS.length;
  document.querySelectorAll(".ad").forEach(a => a.classList.toggle("on", +a.dataset.i === adIdx));
  document.querySelectorAll(".dot").forEach(d => { d.classList.remove("on"); void d.offsetWidth; d.classList.toggle("on", +d.dataset.i === adIdx); });
}
function autoplay() { clearInterval(adTimer); if (reduce || ADS.length < 2) return; adTimer = setInterval(() => showAd(adIdx + 1), ROTATE); }
function pinAd(i) {
  clearInterval(adTimer); clearTimeout(pinTimer); showAd(i);
  const box = $("#ads"); box.classList.remove("pinned"); void box.offsetWidth; box.classList.add("pinned", "paused");
  pinTimer = setTimeout(() => { box.classList.remove("pinned", "paused"); showAd(adIdx + 1); autoplay(); }, PIN);
}
let sx = null, swiped = false;
$("#ads").addEventListener("pointerdown", e => { sx = e.clientX; swiped = false; });
$("#ads").addEventListener("pointerup", e => { if (sx == null) return; const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 40 && ADS.length > 1) { swiped = true; pinAd(adIdx + (lang === "ar" ? 1 : -1) * Math.sign(dx)); } });
$("#ads").addEventListener("click", e => { if (swiped) return; const d = e.target.closest(".dot"); if (d) return pinAd(+d.dataset.i);
  const a = e.target.closest(".ad"); if (a) pinAd(+a.dataset.i); });
document.addEventListener("visibilitychange", () => { if (document.hidden) clearInterval(adTimer); else if (!$("#ads").classList.contains("pinned")) autoplay(); });

/* ═════════ text size ═════════ */
const STEPS = [.9, 1, 1.1, 1.2, 1.3]; if (!STEPS.includes(fs)) fs = 1;
function applyFs() {
  root.style.setProperty("--fs", fs); store.set("fs", fs); const k = STEPS.indexOf(fs);
  $("#meter").innerHTML = STEPS.map((s, j) => `<i class="${j <= k ? "on" : ""}" style="height:${30 + j * 17}%"></i>`).join("");
  $("#fOut").textContent = fmt(Math.round(fs * 100)) + "%"; $("#fMinus").disabled = k === 0; $("#fPlus").disabled = k === STEPS.length - 1;
  setTimeout(() => moveInd(true), 320);
}
$("#fMinus").onclick = () => { fs = STEPS[Math.max(0, STEPS.indexOf(fs) - 1)]; applyFs(); };
$("#fPlus").onclick = () => { fs = STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(fs) + 1)]; applyFs(); };

/* ═════════ drawers, menu, theme, language ═════════ */
function drawer(btn, box, focus) {
  const open = !$(box).classList.contains("open"); $("#menu").classList.remove("open");
  document.querySelectorAll(".drawer").forEach(d => d.classList.remove("open"));
  document.querySelectorAll(".tools [aria-expanded]").forEach(b => b.setAttribute("aria-expanded", "false"));
  if (open) { $(box).classList.add("open"); $(btn).setAttribute("aria-expanded", "true"); if (focus) setTimeout(() => $(focus).focus(), 220); }
}
$("#searchBtn").onclick = () => drawer("#searchBtn", "#searchBox", "#q");
$("#fontBtn").onclick = () => drawer("#fontBtn", "#fontDrawer");
let qT; $("#q").oninput = e => { clearTimeout(qT); qT = setTimeout(() => { q = e.target.value.trim().toLowerCase(); grid(); }, 120); };
function menu(open) {
  const m = $("#menu"), b = $("#moreBtn"); open = open ?? !m.classList.contains("open");
  if (open) { document.querySelectorAll(".drawer").forEach(d => d.classList.remove("open")); document.querySelectorAll(".tools [aria-expanded]").forEach(x => x.setAttribute("aria-expanded", "false")); }
  m.classList.toggle("open", open); b.setAttribute("aria-expanded", open); if (open) setTimeout(() => $("#openAbout").focus({ preventScroll: true }), 120);
}
$("#moreBtn").onclick = e => { e.stopPropagation(); menu(); };
document.addEventListener("click", e => { if (!e.target.closest("#menu") && $("#menu").classList.contains("open")) menu(false); });
$("#openAbout").onclick = () => { menu(false); openPage("pAbout"); };
$("#openUrcod").onclick = () => { menu(false); openPage("pUrcod"); };

function isDark() { const d = root.dataset.theme; return d ? d === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
const syncTheme = () => { $("#themeBtn").classList.toggle("is-dark", isDark());
  const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = getComputedStyle(root).getPropertyValue("--surface").trim() || "#ffffff"; };
$("#themeBtn").onclick = () => { root.dataset.theme = isDark() ? "light" : "dark"; store.set("theme", root.dataset.theme); syncTheme(); };
$("#langBtn").onclick = e => { lang = lang === "ar" ? "en" : "ar"; store.set("lang", lang); e.currentTarget.classList.toggle("spin"); render(); };

/* ═════════ about pages ═════════ */
const bar = (id, title) => `<div class="page-bar"><button class="icon-btn back" data-close aria-label="${T[lang].back}">${I.back}</button><h2 id="${id}T">${title}</h2></div>`;
const crow = (ic, label, val) => `<div class="row">${ic}<div class="v"><small>${label}</small><span class="ltr">${esc(val)}</span></div><button class="copy" data-copy="${esc(val)}">${T[lang].copy}</button></div>`;
/* لوجو المطعم: الرابط من الإعدادات، وإلا أيقونة التطبيق نفسها (icons/icon-192.png)، وإلا أول حرف من الاسم */
function logoHTML() {
  const b = (M && M.brand) || {}, letter = esc(L(b.initial) || (L(b.name) || "•").trim()[0]);
  const src = b.logoUrl && safeUrl(b.logoUrl) ? esc(b.logoUrl) : "icons/icon-192.png";
  return `<img src="${src}" alt="" onerror="this.replaceWith(document.createTextNode('${letter.replace(/'/g, "")}'))">`;
}
/* ═════════ share an item ═════════ */
const baseUrl = () => location.href.split("#")[0];
async function shareItem(p) {
  if (!p) return; const r = cheapest(p), price = r.now ?? r.base, url = baseUrl() + "#item-" + encodeURIComponent(p.id);
  const text = `${L(p.name)} — ${fmt(price)} ${cur()}\n${L(M.brand?.name)}`;
  if (navigator.share) { try { await navigator.share({ title: L(p.name), text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank", "noopener");
}
/* ═════════ open now / closed (from opening hours, overnight aware) ═════════ */
const minsOf = v => { const [h, m] = String(v || "0:0").split(":"); return (+h || 0) * 60 + (+m || 0); };
function openState() {
  const hours = M?.contact?.hours; if (!hours?.length) return null;
  const now = new Date(), cur0 = now.getHours() * 60 + now.getMinutes(), d = now.getDay();
  const hY = hours.find(h => h.day === (d + 6) % 7), hT = hours.find(h => h.day === d);
  if (hY && minsOf(hY.close) <= minsOf(hY.open) && cur0 < minsOf(hY.close)) return { open: true, at: hY.close };
  if (hT) { const o = minsOf(hT.open), c = minsOf(hT.close);
    if (c <= o ? cur0 >= o : cur0 >= o && cur0 < c) return { open: true, at: hT.close };
    if (cur0 < o) return { open: false, at: hT.open }; }
  return { open: false };
}
const clock12 = v => { const d = new Date(); d.setHours(+String(v).split(":")[0] || 0, +String(v).split(":")[1] || 0, 0, 0);
  return d.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en", { hour: "numeric", minute: "2-digit" }); };
function openBadge() {
  const el = $("#ostat"), st = M && openState(); if (!el) return;
  if (!st) { el.hidden = true; return; }
  const t = T[lang]; el.hidden = false; el.className = "ostat " + (st.open ? "on" : "off");
  const more = st.at ? (st.open ? t.closesAt : t.opensAt).replace("{t}", clock12(st.at)) : "";
  el.textContent = st.open ? t.openNow : t.closedNow;
  if (more) { const s = document.createElement("i"); s.className = "os-more"; s.textContent = " · " + more; el.appendChild(s); }
  el.title = el.textContent;
}
setInterval(openBadge, 60000);
function pages() {
  const t = T[lang], b = M.brand || {}, c = M.contact || {}, today = new Date().getDay();
  const maps = safeUrl(c.mapsUrl), wa = (c.whatsapp || "").replace(/\D/g, "");
  $("#pAbout").innerHTML = bar("pAbout", t.aboutT) + `<div class="page-in">
    <div class="panel r-hero"><span class="logo" aria-hidden="true">${logoHTML()}</span><b>${esc(L(b.name))}</b><span>${esc(L(b.tagline))}</span></div>
    ${L(b.about) ? `<div class="panel"><h3>${t.aboutT}</h3><p>${esc(L(b.about))}</p></div>` : ""}
    <div class="panel"><h3>${t.contactT}</h3>
      ${c.phone ? crow(I.phone, t.phone, c.phone) : ""}
      ${wa ? `<div class="row">${I.chat}<div class="v"><small>${t.wa}</small><span class="ltr">+${esc(wa)}</span></div><a class="copy" style="display:grid;place-items:center;text-decoration:none" href="https://wa.me/${wa}" target="_blank" rel="noopener">${t.wa}</a></div>` : ""}
      ${L(c.address) ? `<div class="row">${I.pin}<div class="v"><small>${t.address}</small><span>${esc(L(c.address))}</span></div>${maps ? `<a class="copy" style="display:grid;place-items:center;text-decoration:none" href="${esc(maps)}" target="_blank" rel="noopener">${t.map}</a>` : ""}</div>` : ""}
    </div>
    ${(c.branches || []).length ? `<div class="panel"><h3>${t.branches}</h3><div class="branches">${c.branches.map(br => { const bw = (br.whatsapp || "").replace(/\D/g, ""), bm = safeUrl(br.mapsUrl);
      return `<div class="branch"><b>${esc(L(br.name))}</b>${L(br.address) ? `<span>${esc(L(br.address))}</span>` : ""}${br.phone ? `<span class="ltr">${esc(br.phone)}</span>` : ""}
        <div class="row" style="gap:6px;border:0;padding:0">${br.phone ? `<button class="copy" data-copy="${esc(br.phone)}">${t.copy}</button>` : ""}${bw ? `<a class="copy" style="display:grid;place-items:center;text-decoration:none" href="https://wa.me/${bw}" target="_blank" rel="noopener">${t.wa}</a>` : ""}${bm ? `<a class="copy" style="display:grid;place-items:center;text-decoration:none" href="${esc(bm)}" target="_blank" rel="noopener">${t.map}</a>` : ""}</div></div>`; }).join("")}</div></div>` : ""}
    ${c.hours?.length ? `<div class="panel"><h3>${t.hoursT} ${(() => { const st = openState(); return st ? `<em class="ostat ${st.open ? "on" : "off"}">${st.open ? t.openNow : t.closedNow}</em>` : ""; })()}</h3><div class="hours">${c.hours.map(h => `<span class="${h.day === today ? "today" : ""}">${t.days[h.day]}</span><span class="ltr ${h.day === today ? "today" : ""}" style="text-align:start">${esc(h.open)} – ${esc(h.close)}</span>`).join("")}</div></div>` : ""}
    ${c.social?.length ? `<div class="panel"><h3>${t.social}</h3><div class="socials">${c.social.filter(s => safeUrl(s.url)).map(s => `<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">${I.link}${esc(s.name)}</a>`).join("")}</div></div>` : ""}
  </div>`;
  $("#pUrcod").innerHTML = bar("pUrcod", t.urcodT) + `<div class="page-in">
    <div class="u-hero"><button id="uLogo" aria-hidden="true" tabindex="-1"><img src="assets/urcod-logo.jpg" alt="URCOD — Your Code. Your Business."></button><p>${t.urcodAbout}</p></div>
    <div class="panel"><h3>${t.devT}</h3><div class="u-dev"><span class="av">${lang === "ar" ? "م" : "M"}</span><div><b>${DEV.name[lang]}</b><small>${DEV.role[lang]}</small></div></div></div>
    <div class="panel"><h3>${t.sysT}</h3><div class="u-sys">${t.sys.map(x => `<span>${x}</span>`).join("")}</div></div>
    <div class="panel"><h3>${t.getCopy}</h3>${crow(I.phone, t.phone + " · " + t.wa, DEV.phone)}
      <div class="row">${I.link}<div class="v"><small>LinkedIn</small><span>${DEV.name.en}</span></div><a class="copy" style="display:grid;place-items:center;text-decoration:none" href="${DEV.linkedin}" target="_blank" rel="noopener">LinkedIn</a></div></div>
    <p class="u-ver">URCOD Digital Menu · ${t.ver} ${DEV.version}</p></div>`;
  taps($("#uLogo"), 10, () => loginSheet("dev"));
}
let pageOpen = null, pageFrom = null;
function openPage(id) { pageFrom = document.activeElement; pageOpen = id; $("#" + id).scrollTop = 0; $("#" + id).classList.add("open"); document.body.style.overflow = "hidden";
  setTimeout(() => $("#" + id + " .back")?.focus({ preventScroll: true }), 300); }
function closePage() { if (!pageOpen) return; $("#" + pageOpen).classList.remove("open"); pageOpen = null; document.body.style.overflow = ""; pageFrom?.focus?.({ preventScroll: true }); }
document.addEventListener("click", e => {
  if (e.target.closest("[data-close]")) return closePage();
  const c = e.target.closest("[data-copy]"); if (!c) return;
  const done = () => { c.textContent = T[lang].copied; c.classList.add("done"); setTimeout(() => { c.textContent = T[lang].copy; c.classList.remove("done"); }, 1600); };
  const sel = () => { const sp = c.parentElement.querySelector(".v span"); const r = document.createRange(); r.selectNodeContents(sp); const w = getSelection(); w.removeAllRanges(); w.addRange(r); };
  try { navigator.clipboard.writeText(c.dataset.copy).then(done, sel); } catch { sel(); }
});

/* ═════════ hidden sign-in (7 taps restaurant logo / 10 taps URCOD logo) ═════════ */
function taps(el, n, fn) { if (!el) return; let c = 0, tm; el.addEventListener("click", () => { c++; clearTimeout(tm); tm = setTimeout(() => c = 0, 1500); if (c >= n) { c = 0; fn(); } }); }
/* دخول مخفي بكلمة سر + كلمة أمان (من غير بريد).
   الإدارة: ٧ ضغطات على لوجو المطعم. المطوّر: ١٠ ضغطات على لوجو URCOD (وأول مرة بيجهّز النسخة). */
async function loginSheet(kind) {
  const t = T[lang]; openId = null;
  let setup = false;
  if (kind === "dev" && !C.useSample) { try { const m = await MenuData.meta(); setup = !m || !m.devReady; } catch {} }
  $("#sheet").innerHTML = `<div class="grab"></div><form class="s-body login" id="loginF" novalidate>
    <h3 id="sTitle">${setup ? t.setupTitle : kind === "dev" ? t.devLogin : t.adminLogin}</h3>
    ${setup ? `<p class="demo">${t.setupHint}</p>` : ""}
    <label>${t.pass}<input id="lPass" type="password" autocomplete="off" required></label>
    ${setup ? `<label>${t.passAgain}<input id="lPass2" type="password" autocomplete="off" required></label>` : ""}
    <label>${t.word}<input id="lWord" type="password" autocomplete="off" required></label>
    <p class="err" id="lErr" role="alert"></p>
    <button class="go" type="submit">${setup ? t.setupGo : t.enter}</button></form>`;
  $("#sheet").classList.add("open"); $("#scrim").classList.add("open"); document.body.style.overflow = "hidden";
  $("#loginF").onsubmit = e => { e.preventDefault(); signIn(kind, setup); };
  setTimeout(() => $("#lPass").focus(), 300);
}
async function signIn(kind, setup) {
  const t = T[lang], err = $("#lErr"), btn = $("#loginF .go"), label = btn.textContent;
  const lock = store.get("lock", 0); if (Date.now() < lock) { err.textContent = t.errMany; return; }
  if (C.useSample) { err.textContent = t.loginSample; return; }
  const pass = $("#lPass").value, word = $("#lWord").value.trim();
  if (pass.length < 6 || word.length < 3) { err.textContent = t.errShort; return; }
  if (setup && (pass.length < 8 || word.length < 4)) { err.textContent = t.errSetupShort; return; }
  if (setup && pass !== $("#lPass2").value) { err.textContent = t.errMatch; return; }
  btn.disabled = true; btn.textContent = t.entering; err.textContent = "";
  try {
    const { A, auth } = await MenuData.auth(), { db, fs } = await MenuData.firebase(), key = MenuData.secret(pass, word);
    if (kind === "dev") {
      if (setup) {
        try { await A.createUserWithEmailAndPassword(auth, MenuData.devLogin, key); }
        catch (x) { if (!/email-already-in-use/.test(x.code || "")) throw x;
          try { await A.signInWithEmailAndPassword(auth, MenuData.devLogin, key); }
          catch { err.textContent = t.errTaken; return; } }
        const ref = fs.doc(db, "public", "meta"), m = await fs.getDoc(ref);
        if (m.exists()) await fs.updateDoc(ref, { devReady: true });
        else await fs.setDoc(ref, { version: 0, devReady: true, updatedAt: fs.serverTimestamp(),
          license: { status: "active", plan: "trial", endsAt: fs.Timestamp.fromDate(new Date(Date.now() + 7 * 864e5)), menuOnExpiry: "show" } });
      } else await A.signInWithEmailAndPassword(auth, MenuData.devLogin, key);
      store.set("fails", 0); location.href = "dev.html"; return;
    }
    const m = await MenuData.meta();
    if (!m || !m.adminLogin) { err.textContent = t.noAdmin; return; }
    const cred = await A.signInWithEmailAndPassword(auth, m.adminLogin, key);
    if (cred.user.uid !== m.adminUid) { await A.signOut(auth); err.textContent = t.errCred; return; }
    store.set("fails", 0); location.href = "admin.html";
  } catch (e) {
    const code = e.code || "";
    err.textContent = /network/.test(code) ? t.errNet : /too-many/.test(code) ? t.errMany : /permission/.test(code) ? t.errRole : t.errCred;
    const f = store.get("fails", 0) + 1; store.set("fails", f);
    if (f >= 5) { store.set("lock", Date.now() + 60e3); store.set("fails", 0); }
  } finally { btn.disabled = false; btn.textContent = label; }
}
taps($("#rLogo"), 7, () => loginSheet("admin"));

/* ═════════ global events ═════════ */
function closeAny() {
  if ($("#menu").classList.contains("open")) return menu(false);
  if ($("#sheet").classList.contains("open")) { if (openId) return closeSheet();
    $("#sheet").classList.remove("open"); $("#scrim").classList.remove("open"); document.body.style.overflow = pageOpen ? "hidden" : ""; return; }
  if (pageOpen) closePage();
}
$("#rail").addEventListener("click", e => { const c = e.target.closest(".chip"); if (c && c.dataset.id !== active) setActive(c.dataset.id); });
$("#grid").addEventListener("click", e => { const f = e.target.closest(".fav"); if (f) { e.stopPropagation(); return toggleFav(f.dataset.fav, f); }
  const c = e.target.closest(".card"); if (c) openSheet(c.dataset.id); });
$("#grid").addEventListener("keydown", e => { const c = e.target.closest(".card"); if (c && e.target === c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openSheet(c.dataset.id); } });
$("#sheet").addEventListener("click", e => {
  if (e.target.closest("#sClose")) return closeSheet();
  if (e.target.closest("#sShare")) return shareItem(ALL.find(i => i.id === openId));
  const f = e.target.closest(".fav"); if (f && f.dataset.fav) return toggleFav(f.dataset.fav, f);
  const b = e.target.closest(".size"); if (!b) return;
  const p = ALL.find(i => i.id === openId); b.parentElement.querySelectorAll(".size").forEach(x => x.classList.toggle("on", x === b));
  $("#sPrice").innerHTML = priceHTML(p, rows(p)[+b.dataset.j], false); $("#sPrice").firstElementChild.style.setProperty("--i", -6);
  $("#sPrice").querySelector(".now .v").classList.add("roll");
});
$("#scrim").onclick = closeAny;
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAny(); });
let sy = null;
$("#sheet").addEventListener("touchstart", e => { if ($("#sheet").scrollTop <= 0) sy = e.touches[0].clientY; }, { passive: true });
$("#sheet").addEventListener("touchend", e => { if (sy != null && e.changedTouches[0].clientY - sy > 90) closeAny(); sy = null; });
addEventListener("resize", () => moveInd(true));

/* ═════════ render ═════════ */
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); setTimeout(() => el.classList.remove("on"), 2400); }
function stateScreen(kind) {
  const t = T[lang], ic = { closed: I.lock, offline: I.wifi, empty: ICONS.plate }[kind];
  $("#state").innerHTML = `${ic}<b>${t[kind + "T"]}</b><p>${t[kind + "P"]}</p>`; $("#state").hidden = false;
  ["#ads", ".rail-wrap", "#secHead", "#grid"].forEach(s => $(s).hidden = true);
}
function skeleton() {
  $("#grid").innerHTML = Array.from({ length: 6 }, () => '<div class="skel"><i></i><i></i><i></i></div>').join("");
}
function licenseClosed() {
  const l = META?.license; if (!l) return false;
  const expired = l.status !== "active" || (l.endsAt && new Date(l.endsAt) <= Date.now());
  return expired && l.menuOnExpiry === "hide";
}
function applyBrand() {
  const b = M.brand || {}, s = M.settings || {}, c = M.contact || {};
  if (!lang) lang = s.defaultLang === "en" ? "en" : "ar";
  if (s.allowLang === false) lang = s.defaultLang === "en" ? "en" : "ar";
  $("#langBtn").hidden = s.allowLang === false;
  const userTheme = store.get("theme", null);
  if (s.allowTheme === false) { $("#themeBtn").hidden = true; if (s.defaultTheme && s.defaultTheme !== "system") root.dataset.theme = s.defaultTheme; else delete root.dataset.theme; }
  else if (userTheme) root.dataset.theme = userTheme;
  else if (s.defaultTheme && s.defaultTheme !== "system") root.dataset.theme = s.defaultTheme;
  if (b.palette && b.palette !== "green") root.dataset.palette = b.palette; else delete root.dataset.palette;
  root.lang = lang; root.dir = lang === "ar" ? "rtl" : "ltr";
  $("#rLogo").innerHTML = logoHTML();
  $("[data-t='rname']").textContent = L(b.name); $("[data-t='tag']").textContent = L(b.tagline); document.title = L(b.name) || "Menu";
  const ou = safeUrl(c.orderUrl); $("#orderBtn").hidden = !(c.orderEnabled && ou);
  if (ou) { $("#orderBtn").href = ou; $("#orderLbl").textContent = L(c.orderLabel) || (lang === "ar" ? "اطلب أونلاين" : "Order online"); }
  syncTheme();
}
function render() {
  applyBrand();
  document.querySelectorAll("[data-t]").forEach(e => { const k = e.dataset.t; if (T[lang][k] != null) e.textContent = T[lang][k]; });
  $("#q").placeholder = T[lang].search;
  pages(); applyFs();
  if (licenseClosed()) return stateScreen("closed");
  $("#state").hidden = true; ["#ads", ".rail-wrap", "#secHead", "#grid"].forEach(s => $(s).hidden = false);
  if (!ALL.length) { buildAds(); return stateScreen("empty"); }
  buildAds(); rail(); grid(); autoplay(); openBadge();
  if (openId) openSheet(openId);
  else if (!render.linked) { render.linked = true; const m = location.hash.match(/^#item-(.+)$/); if (m) { const id = decodeURIComponent(m[1]); if (ALL.some(p => p.id === id)) setTimeout(() => openSheet(id), 350); } }
}

/* ═════════ boot ═════════ */
lang = lang || "ar"; root.lang = lang; root.dir = lang === "ar" ? "rtl" : "ltr";
const savedTheme = store.get("theme", null); if (savedTheme) root.dataset.theme = savedTheme;
/* ═════════ install as an app ═════════
   أندرويد/كروم: زرار بيفتح نافذة التثبيت الرسمية. آيفون: خطوات «مشاركة › إضافة للشاشة الرئيسية».
   الشريط بيظهر مرة واحدة بعد ثواني، ولو اتقفل مابيظهرش تاني؛ والزرار فاضل في قايمة النقط. */
let deferredInstall = null;
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function installReady() {
  if (standalone()) return;
  $("#installItem").hidden = $("#installSep").hidden = false;
  if (!store.get("installDismissed", false)) setTimeout(() => { if (!standalone() && !$("#sheet").classList.contains("open")) $("#installBar").hidden = false; }, 6000);
}
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; installReady(); });
addEventListener("appinstalled", () => { $("#installBar").hidden = true; $("#installItem").hidden = $("#installSep").hidden = true; toast(T[lang].installed); });
if (isIOS() && !standalone()) installReady();
async function doInstall() {
  $("#installBar").hidden = true; menu(false);
  if (deferredInstall) { deferredInstall.prompt(); const r = await deferredInstall.userChoice.catch(() => ({})); deferredInstall = null;
    if (r.outcome === "accepted") { $("#installItem").hidden = $("#installSep").hidden = true; } return; }
  const t = T[lang], share = '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/></svg>';
  $("#sheet").innerHTML = `<div class="grab"></div><div class="s-body"><h2 id="sTitle">${t.iosT}</h2>
    <ol class="ios-steps"><li>${t.ios1.replace("{i}", share)}</li><li>${t.ios2}</li><li>${t.ios3}</li></ol></div>`;
  $("#sheet").classList.add("open"); $("#scrim").classList.add("open"); document.body.style.overflow = "hidden";
}
$("#installItem").onclick = doInstall; $("#ibGo").onclick = doInstall;
$("#ibX").onclick = () => { $("#installBar").hidden = true; store.set("installDismissed", true); };

syncTheme(); skeleton(); $("#rLogo").innerHTML = logoHTML();
let first = true;
MenuData.load(res => {
  if (res.error || res.empty) { M = M || { brand: {}, settings: {}, contact: {} }; if (!ALL.length) { lang = lang || "ar"; pages(); stateScreen(res.error ? "offline" : "empty"); } return; }
  const wasLoaded = !first; first = false;
  META = res.meta; prepare(res.menu);
  if (!store.get("lang", null)) lang = null;      /* first visit follows the restaurant's default language */
  render();
  if (wasLoaded && res.updated) toast(T[lang].updated);
});
document.fonts?.ready.then(() => moveInd(true));
})();
