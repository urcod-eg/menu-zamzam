/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — إعدادات نسخة العميل
   الملف ده الوحيد اللي بيتغيّر لكل مطعم وقت التسليم.
   مفيش هنا أي أسرار: إعدادات Firebase للويب مكشوفة بطبيعتها،
   والحماية الحقيقية في firestore.rules.
   ───────────────────────────────────────────────────────────── */
window.URCOD_CONFIG = {
  /* معرّف ثابت للعميل (بيتكتب في السجلات ومفتاح التخزين على الجهاز) */
  clientId: "menu-zamzam",

  /* true = يشتغل على بيانات sample-menu.js من غير Firebase (للتجربة والديمو)
     false = يقرا من Firestore */
  useSample: false,

  /* انسخها من Firebase Console › Project settings › Your apps › Web app */
  firebase: {
    apiKey: "AIzaSyDk4odieXA96C_c_7CW8rKqA8w9BvyIBy0",
    authDomain: "menu-zamzam.firebaseapp.com",
    projectId: "menu-zamzam",
    appId: "1:108755766743:web:2a312e29b8f72ffb19cf92"
  },

  /* أقل مدة بين فحصين لرقم الإصدار على نفس الجهاز.
     ٥ دقايق = لو الزبون عمل refresh كتير مش هيتحسب عليه قراءات.
     التعديلات بتوصل للزبون في خلال المدة دي بالكتير. */
  metaCheckMinutes: 5,

  /* رابط لوحة المطور (urcod-dev-panel). ١٠ ضغطات على لوجو URCOD بتفتحها.
     لو فاضي، بتفتح tools/seed.html في نفس النسخة. */
  devPanelUrl: "https://urcod-eg.github.io/menu-hub/",

  /* نسخة مكتبة Firebase (ثابتة عمدًا، ماتتغيّرش من غير تجربة) */
  firebaseSdk: "10.12.2"
};
