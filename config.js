/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — إعدادات نسخة العميل
   الملف ده الوحيد اللي بيتغيّر لكل مطعم وقت التسليم.
   مفيش هنا أي أسرار: إعدادات Firebase للويب مكشوفة بطبيعتها،
   والحماية الحقيقية في firestore.rules.
   ───────────────────────────────────────────────────────────── */
window.URCOD_CONFIG = {
  clientId: "menu-zamzam",

  useSample: false,

  firebase: {
    apiKey: "AIzaSyDk4odieXA96C_c_7CW8rKqA8w9BvyIBy0",
    authDomain: "menu-zamzam.firebaseapp.com",
    projectId: "menu-zamzam",
    appId: "1:108755766743:web:2a312e29b8f72ffb19cf92"
  },

  metaCheckMinutes: 5,

  firebaseSdk: "10.12.2"
};
