/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — إعدادات نسخة العميل
   الملف ده الوحيد اللي بيتغيّر لكل مطعم وقت التسليم.
   مفيش هنا أي أسرار: إعدادات Firebase للويب مكشوفة بطبيعتها،
   والحماية الحقيقية في firestore.rules.
   ───────────────────────────────────────────────────────────── */
window.URCOD_CONFIG = {
  /* معرّف ثابت للعميل (بيتكتب في السجلات ومفتاح التخزين على الجهاز) */
  clientId: "demo-restaurant",

  /* true = يشتغل على بيانات sample-menu.js من غير Firebase (للتجربة والديمو)
     false = يقرا من Firestore */
  useSample: true,

  /* انسخها من Firebase Console › Project settings › Your apps › Web app */
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: ""
  },

  /* أقل مدة بين فحصين لرقم الإصدار على نفس الجهاز.
     ٥ دقايق = لو الزبون عمل refresh كتير مش هيتحسب عليه قراءات.
     التعديلات بتوصل للزبون في خلال المدة دي بالكتير. */
  metaCheckMinutes: 5,

  /* نسخة مكتبة Firebase (ثابتة عمدًا، ماتتغيّرش من غير تجربة) */
  firebaseSdk: "10.12.2"
};
