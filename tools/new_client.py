#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
URCOD Digital Menu — تجهيز نسخة عميل جديد على جهازك في خطوة واحدة.

مثال:
  python tools/new_client.py --id cafe-elnil --name-ar "كافيه النيل" --name-en "Nile Cafe" \
      --palette navy --logo ~/clients/nile/logo.png --dev-email you@example.com \
      --firebase ~/clients/nile/firebase.txt

بيعمل:
  • نسخة كاملة من المشروع في مجلد جديد (افتراضيًا جنب المشروع الأصلي باسم المعرّف)
  • config.js: المعرّف، إعدادات Firebase، رابط لوحة المطوّر، ويقفل الوضع التجريبي
  • firestore.rules: بريد المطوّر
  • manifest + عنوان الصفحة + لون الثيم
  • الأيقونات من لوجو العميل (لو Pillow متسطّب)
  • رقم إصدار الـ service worker خاص بالعميل
  • HANDOVER.md: قايمة الخطوات اللي فاضلة بالقيم بتاعة العميل ده
"""
import argparse, html, json, os, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PALETTES = {  # theme_color, background
    "green": ("#1f5a3d", "#f3f5f1"), "navy": ("#1d3b6e", "#f2f4f9"), "maroon": ("#7a1f33", "#f8f2f3"),
    "coffee": ("#5b3a24", "#f7f3ef"), "teal": ("#0f5e63", "#f0f6f6"),
}
SKIP = {".git", "node_modules", "__pycache__", ".DS_Store"}


def die(msg):
    print("✗ " + msg, file=sys.stderr); sys.exit(1)


def parse_firebase(src):
    if not src:
        return None
    p = Path(os.path.expanduser(src))
    txt = p.read_text(encoding="utf-8") if p.exists() else src
    out = {}
    for k in ("apiKey", "authDomain", "projectId", "appId"):
        m = re.search(k + r"""\s*["']?\s*:\s*["']([^"']+)["']""", txt)
        out[k] = m.group(1) if m else ""
    if not out["apiKey"] or not out["projectId"]:
        die("مالقيتش apiKey و projectId في إعدادات Firebase.")
    return out


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def sub_once(text, pattern, repl, label):
    fn = repl if callable(repl) else (lambda m, r=repl: r)
    new, n = re.subn(pattern, fn, text, count=1, flags=re.S)
    if n != 1:
        die(f"ماقدرتش أعدّل {label}. اتأكد إن الملف ماتغيّرش شكله.")
    return new


def make_icons(dest, logo, theme, bg):
    try:
        from PIL import Image
    except ImportError:
        print("! Pillow مش متسطّب، الأيقونات فضلت زي ما هي. (pip install pillow)"); return False
    src = Image.open(os.path.expanduser(logo)).convert("RGBA")

    def fit(size, pad):
        canvas = Image.new("RGBA", (size, size), bg)
        inner = int(size * (1 - 2 * pad))
        im = src.copy(); im.thumbnail((inner, inner), Image.LANCZOS)
        canvas.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
        return canvas.convert("RGB")

    icons = dest / "icons"
    fit(192, .08).save(icons / "icon-192.png", optimize=True)
    fit(512, .08).save(icons / "icon-512.png", optimize=True)
    fit(512, .20).save(icons / "maskable-512.png", optimize=True)   # safe zone for Android masks
    return True


def main():
    ap = argparse.ArgumentParser(description="تجهيز نسخة عميل من URCOD Digital Menu")
    ap.add_argument("--id", required=True, help="معرّف العميل: حروف إنجليزي صغيرة وأرقام و - (مثال cafe-elnil)")
    ap.add_argument("--name-ar", required=True); ap.add_argument("--name-en", default="")
    ap.add_argument("--palette", default="green", choices=PALETTES.keys())
    ap.add_argument("--logo", help="صورة لوجو العميل (PNG مربعة يفضّل)")
    ap.add_argument("--dev-email", help=argparse.SUPPRESS)        # old option, not needed anymore
    ap.add_argument("--dev-panel-url", help=argparse.SUPPRESS)    # old option, not needed anymore
    ap.add_argument("--firebase", help="ملف فيه كود إعدادات Firebase من الـ Console، أو الكود نفسه بين علامتين")
    ap.add_argument("--owner", default="urcod-eg", help="حساب GitHub اللي هيترفع عليه (لمعاينة اللينك في واتساب)")
    ap.add_argument("--out", help="مكان النسخة (افتراضيًا جنب المشروع باسم المعرّف)")
    ap.add_argument("--force", action="store_true", help="امسح المجلد لو موجود")
    a = ap.parse_args()

    cid = a.id.strip().lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,39}", cid):
        die("المعرّف لازم يكون حروف إنجليزي صغيرة وأرقام و - بس (من ٢ لـ ٤٠ حرف).")
    fb = parse_firebase(a.firebase)
    dest = Path(os.path.expanduser(a.out)) if a.out else ROOT.parent / cid
    if dest.resolve() == ROOT:
        die("مينفعش النسخة تبقى في نفس مجلد المشروع الأصلي.")
    if dest.exists():
        if not a.force:
            die(f"المجلد {dest} موجود. استخدم --force لو عايز تستبدله.")
        shutil.rmtree(dest)

    shutil.copytree(ROOT, dest, ignore=lambda d, names: [n for n in names if n in SKIP])
    theme, bg = PALETTES[a.palette]
    name_en = a.name_en or a.name_ar

    # config.js
    cfg = (dest / "config.js").read_text(encoding="utf-8")
    cfg = sub_once(cfg, r'clientId:\s*"[^"]*"', f'clientId: {js_str(cid)}', "clientId")
    if fb:
        cfg = sub_once(cfg, r'useSample:\s*(true|false)', 'useSample: false', "useSample")
        block = "firebase: {\n" + ",\n".join(f"    {k}: {js_str(v)}" for k, v in fb.items()) + "\n  }"
        cfg = sub_once(cfg, r'firebase:\s*\{.*?\n  \}', block, "firebase")
    (dest / "config.js").write_text(cfg, encoding="utf-8")

    # rules
    rules = (dest / "firestore.rules").read_text(encoding="utf-8")
    if "__DEV_LOGIN__" not in rules:
        die("firestore.rules مافيهاش __DEV_LOGIN__.")
    dev_login = f"dev.{cid}@urcod.app"   # must match MenuData.devLogin in data.js
    (dest / "firestore.rules").write_text(rules.replace("__DEV_LOGIN__", dev_login), encoding="utf-8")

    # manifest
    man = json.loads((dest / "manifest.webmanifest").read_text(encoding="utf-8"))
    man.update(name=f"{a.name_ar} — المنيو", short_name=a.name_ar[:12], theme_color=theme, background_color=bg)
    (dest / "manifest.webmanifest").write_text(json.dumps(man, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # index + admin titles / theme colour
    for f, title in (("index.html", a.name_ar), ("admin.html", f"إدارة {a.name_ar}")):
        h = (dest / f).read_text(encoding="utf-8")
        h = sub_once(h, r"<title>.*?</title>", f"<title>{title}</title>", f + " title")
        h = sub_once(h, r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{theme}">', f + " theme-color")
        (dest / f).write_text(h, encoding="utf-8")

    # link preview (WhatsApp / Facebook): absolute URLs on GitHub Pages
    base = f"https://{a.owner.strip().lower()}.github.io/{cid}/"
    h = (dest / "index.html").read_text(encoding="utf-8")
    title = a.name_ar if not a.name_en else f"{a.name_ar} | {a.name_en}"
    for prop, val in (("og:site_name", a.name_ar), ("og:title", title),
                      ("og:description", f"منيو {a.name_ar} — الأصناف والأسعار والعروض"),
                      ("og:image", base + "icons/icon-512.png"), ("og:url", base)):
        h = sub_once(h, rf'<meta property="{prop}" content="[^"]*">', f'<meta property="{prop}" content="{html.escape(val, quote=True)}">', prop)
    h = sub_once(h, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{html.escape("منيو " + a.name_ar, quote=True)}">', "description")
    (dest / "index.html").write_text(h, encoding="utf-8")

    # sample menu brand (used by the demo mode and the per-client seed tool)
    sm = (dest / "sample-menu.js").read_text(encoding="utf-8")
    sm = sub_once(sm, r'name: t\("اسم المطعم", "Restaurant Name"\)', f'name: t({js_str(a.name_ar)}, {js_str(name_en)})', "sample name")
    sm = sub_once(sm, r'initial: t\("م", "R"\)', f'initial: t({js_str(a.name_ar.strip()[0])}, {js_str(name_en.strip()[0].upper())})', "sample initial")
    sm = sub_once(sm, r'palette: "green"', f'palette: {js_str(a.palette)}', "sample palette")
    (dest / "sample-menu.js").write_text(sm, encoding="utf-8")

    # service worker cache name
    sw = (dest / "sw.js").read_text(encoding="utf-8")
    sw = sub_once(sw, r'const VERSION = "urcod-menu-([^"]+)";', lambda m: f'const VERSION = "{cid}-{m.group(1)}";', "sw VERSION")
    (dest / "sw.js").write_text(sw, encoding="utf-8")

    icons = make_icons(dest, a.logo, theme, bg) if a.logo else False
    (dest / "tools" / "new_client.py").unlink(missing_ok=True)   # the copy doesn't need the generator

    proj = fb["projectId"] if fb else "<projectId>"
    handover = f"""# تسليم {a.name_ar} ({cid})

## اتعمل تلقائيًا
- [x] config.js{" + إعدادات Firebase (" + proj + ")" if fb else ""}
- [x] firestore.rules (حساب المطوّر: {dev_login})
- [x] الاسم واللون في الصفحات والـ manifest
- [{"x" if icons else " "}] الأيقونات من اللوجو

## فاضل
- [ ] {"" if fb else "مشروع Firebase جديد وحط إعداداته في config.js (useSample: false) ← "}Firestore Database (Production) + Authentication › Email/Password
- [ ] Authentication › Settings › Authorized domains › {a.owner.strip().lower()}.github.io
- [ ] Firestore › Rules › الصق firestore.rules › Publish
- [ ] repo جديد (Public) › ارفع كل الملفات › Settings › Pages › main
- [ ] افتح المنيو › «صُنع بواسطة URCOD» › ١٠ ضغطات على لوجو URCOD › اختار كلمة سر وكلمة أمان للمطوّر (أول مرة بس) — اعمله على طول بعد الرفع
- [ ] صفحة المطوّر: الهوية › حفظ، الترخيص، واتساب صاحب المطعم › توليد › إنشاء حساب الإدارة › إرسال واتساب
- [ ] صاحب المطعم: ٧ ضغطات على لوجو المطعم › كلمة السر + كلمة الأمان
"""
    (dest / "HANDOVER.md").write_text(handover, encoding="utf-8")
    print(f"✓ نسخة {a.name_ar} اتعملت في: {dest}")
    print("  الخطوات اللي فاضلة في HANDOVER.md")


if __name__ == "__main__":
    main()
