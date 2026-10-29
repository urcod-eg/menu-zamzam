/* ─────────────────────────────────────────────────────────────
   URCOD Digital Menu — إضافة طباعة المنيو الاحترافية (A4)
   • معاينة حية وتوزيع ذكي للأقسام على صفحات A4.
   • دعم الاتجاه الرأسي والأفقي، مع مراعاة مساحات وهوامش الطباعة.
   • فصل تام: المأكولات مع المأكولات، والمشروبات مع المشروبات.
   • صور زخرفية لموضوع القسم/الصفحة (وليست لكل صنف).
   • تخصيص الهوية البصرية (اللون الأساسي، الشعار، بيانات التواصل).
   • قراءة حية لبيانات المنيو (الأسعار، الأوصاف، الأصناف) دون تكرار أو مساس بالتشغيل.
   • حفظ إعدادات الطباعة فقط في التخزين المحلي (localStorage).
   ───────────────────────────────────────────────────────────── */
window.MenuPrint = (function () {
  "use strict";

  const C = window.URCOD_CONFIG || {};
  const NS = "urcod." + (C.clientId || "menu") + ".admin.print.";
  const STORAGE_KEY = NS + "settings";

  /* دوال مساعدة عامة */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = o => !o ? "" : typeof o === "string" ? o : (o.ar || o.en || "");
  const fmt = n => (+n).toLocaleString("ar-EG", { maximumFractionDigits: 2 });
  const clone = o => JSON.parse(JSON.stringify(o));
  const safeUrl = (u) => { try { const x = new URL(u); return (x.protocol === "https:" || x.protocol === "http:" || u.startsWith("data:")) ? u : ""; } catch { return u?.startsWith("data:") ? u : ""; } };

  /* صور زخرفية مقترحة عالية الجودة للأقسام الشائعة */
  const PRESET_IMAGES = {
    pizza: {
      name: "بيتزا إيطالية فاخرة",
      url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop&q=80"
    },
    burger: {
      name: "برجر مشوي فاخر",
      url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop&q=80"
    },
    coffee: {
      name: "قهوة ومشروبات ساخنة",
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&auto=format&fit=crop&q=80"
    },
    drink: {
      name: "عصائر ومشروبات منعشة",
      url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=900&auto=format&fit=crop&q=80"
    },
    dessert: {
      name: "حلويات وشوكولاتة",
      url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&auto=format&fit=crop&q=80"
    },
    grill: {
      name: "مشويات وكباب على الفحم",
      url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop&q=80"
    },
    chicken: {
      name: "دجاج مقرمش ومشوي",
      url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900&auto=format&fit=crop&q=80"
    },
    salad: {
      name: "سلطات ومقبلات طازجة",
      url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&auto=format&fit=crop&q=80"
    },
    sandwich: {
      name: "ساندوتشات ووجبات سريعة",
      url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&auto=format&fit=crop&q=80"
    },
    breakfast: {
      name: "فطور ومخبوزات",
      url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=900&auto=format&fit=crop&q=80"
    },
    fish: {
      name: "أسماك ومأكولات بحرية",
      url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=900&auto=format&fit=crop&q=80"
    }
  };

  /* باليتات الألوان المقترحة للهوية البصرية */
  const COLOR_PALETTES = [
    { id: "amber", name: "دهبي فاخر", color: "#b48325" },
    { id: "green", name: "أخضر زمردي", color: "#1f5a3d" },
    { id: "maroon", name: "عنابي ملكي", color: "#8b263e" },
    { id: "navy", name: "كحلي كلاسيك", color: "#1d3b6e" },
    { id: "coffee", name: "بني قهوة", color: "#5b3a24" },
    { id: "charcoal", name: "فحمي عصري", color: "#222629" }
  ];

  /* كشف تلقائي لنوع القسم: مأكولات (food) أو مشروبات (drinks) أو حلويات (desserts) */
  function detectCategoryType(cat) {
    const icon = String(cat?.icon || "").toLowerCase();
    const name = (L(cat?.name) + " " + (cat?.name?.ar || "") + " " + (cat?.name?.en || "")).toLowerCase();
    if (icon === "coffee" || icon === "drink" || /مشروب|عصير|قهوة|شاي|كوكتيل|drink|coffee|tea|juice|beverage/i.test(name)) {
      return "drinks";
    }
    if (icon === "dessert" || /حلو|كيك|تورت|كريب|وافل|أيس كريم|ايس كريم|dessert|sweet|cake|ice cream/i.test(name)) {
      return "desserts";
    }
    return "food";
  }

  /* صورة افتراضية مقترحة بحسب أيقونة أو اسم القسم */
  function defaultImageForCategory(cat) {
    const icon = String(cat?.icon || "").toLowerCase();
    if (PRESET_IMAGES[icon]) return PRESET_IMAGES[icon].url;
    const name = (L(cat?.name) + " " + (cat?.name?.ar || "")).toLowerCase();
    if (/بيتزا|pizza/i.test(name)) return PRESET_IMAGES.pizza.url;
    if (/برجر|burger/i.test(name)) return PRESET_IMAGES.burger.url;
    if (/قهوة|شاي|ساخن|coffee/i.test(name)) return PRESET_IMAGES.coffee.url;
    if (/عصير|بارد|مشروب|drink|juice/i.test(name)) return PRESET_IMAGES.drink.url;
    if (/حلو|كيك|dessert|sweet/i.test(name)) return PRESET_IMAGES.dessert.url;
    if (/مشو|كباب|كفتة|grill|bbq/i.test(name)) return PRESET_IMAGES.grill.url;
    if (/دجاج|فراخ|chicken/i.test(name)) return PRESET_IMAGES.chicken.url;
    if (/سمك|بحري|fish|seafood/i.test(name)) return PRESET_IMAGES.fish.url;
    if (/سلط|مقبل|salad/i.test(name)) return PRESET_IMAGES.salad.url;
    if (/فطور|breakfast/i.test(name)) return PRESET_IMAGES.breakfast.url;
    return "";
  }

  /* تحميل الإعدادات من localStorage مع تعبئة الافتراضيات */
  function loadSettings(menu) {
    let saved = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}

    const brand = menu?.brand || {};
    const contact = menu?.contact || {};

    const defaultColor = (brand.palette && COLOR_PALETTES.find(p => p.id === brand.palette)?.color) || "#1f5a3d";

    const settings = {
      primaryColor: saved.primaryColor || defaultColor,
      orientation: saved.orientation || "portrait", // portrait | landscape
      density: saved.density || "balanced", // compact | balanced | spacious
      showLogo: saved.showLogo !== undefined ? saved.showLogo : true,
      customLogoUrl: saved.customLogoUrl || "",
      restaurantNameAr: saved.restaurantNameAr || brand.name?.ar || "",
      restaurantNameEn: saved.restaurantNameEn || brand.name?.en || "",
      taglineAr: saved.taglineAr || brand.tagline?.ar || "",
      showTagline: saved.showTagline !== undefined ? saved.showTagline : true,
      showPhone: saved.showPhone !== undefined ? saved.showPhone : true,
      showWhatsapp: saved.showWhatsapp !== undefined ? saved.showWhatsapp : true,
      showAddress: saved.showAddress !== undefined ? saved.showAddress : true,
      showPageNumbers: saved.showPageNumbers !== undefined ? saved.showPageNumbers : true,
      showDecorativeImages: saved.showDecorativeImages !== undefined ? saved.showDecorativeImages : true,
      showItemDescriptions: saved.showItemDescriptions !== undefined ? saved.showItemDescriptions : true,
      showCurrency: saved.showCurrency !== undefined ? saved.showCurrency : true,
      categorySettings: saved.categorySettings || {}
    };

    // التأكد من وجود إعدادات لكل قسم موجود في المنيو
    const categories = (menu?.categories || []).filter(c => !c.parentId && !c.hidden);
    categories.forEach((c, idx) => {
      if (!settings.categorySettings[c.id]) {
        settings.categorySettings[c.id] = {
          enabled: true,
          type: detectCategoryType(c),
          customOrder: idx + 1,
          forceNewPage: false,
          decorativeImage: defaultImageForCategory(c)
        };
      } else {
        // تأكيد الحقول الافتراضية
        const cs = settings.categorySettings[c.id];
        if (cs.enabled === undefined) cs.enabled = true;
        if (!cs.type) cs.type = detectCategoryType(c);
        if (cs.customOrder === undefined) cs.customOrder = idx + 1;
        if (cs.decorativeImage === undefined) cs.decorativeImage = defaultImageForCategory(c);
      }
    });

    return settings;
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }

  function resetSettings(menu) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    return loadSettings(menu);
  }

  /* ضغط الصور محليًا عبر Canvas حتى لا تستهلك مساحة التخزين */
  function compressImage(file, maxSide = 900) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxSide || h > maxSide) {
            if (w > h) { h = Math.round((h * maxSide) / w); w = maxSide; }
            else { w = Math.round((w * maxSide) / h); h = maxSide; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("decode"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    });
  }

  /* فحص العرض النشط على الصنف لاستخراج السعر الفعلي */
  function getEffectivePrice(p) {
    const o = p.offer;
    if (!o || o.enabled === false) return null;
    const now = Date.now();
    if (o.startAt && new Date(o.startAt) > now) return null;
    if (o.endAt && new Date(o.endAt) <= now) return null;

    if (p.priceType === "single") {
      const base = +p.price || 0;
      let salePrice = null;
      if (o.type === "percent") salePrice = Math.round(base * (1 - (+o.value || 0) / 100));
      else if (o.type === "amount") salePrice = Math.max(0, base - (+o.value || 0));
      else if (o.type === "price") salePrice = +o.price || null;
      if (salePrice != null && salePrice < base) return { base, now: salePrice, type: o.type };
    }
    return null;
  }

  /* خوارزمية التقسيم الذكي للصفحات (Smart Paging Engine) */
  function buildPages(menu, settings) {
    const allCats = menu?.categories || [];
    const allProds = menu?.products || [];
    const catMap = new Map(allCats.map(c => [c.id, c]));

    // الأقسام الرئيسية فقط التي لم تُخفَ والمفعلة للطباعة
    const mainCats = allCats
      .filter(c => !c.parentId && !c.hidden)
      .map(c => {
        const cs = settings.categorySettings[c.id] || {};
        return {
          cat: c,
          id: c.id,
          enabled: cs.enabled !== false,
          type: cs.type || detectCategoryType(c),
          order: cs.customOrder ?? (c.sort ?? 0),
          forceNewPage: !!cs.forceNewPage,
          decorativeImage: settings.showDecorativeImages ? (cs.decorativeImage || "") : ""
        };
      })
      .filter(x => x.enabled)
      .sort((a, b) => a.order - b.order);

    // تجهيز الأصناف لكل قسم (يشمل أصناف الأقسام الفرعية التابعة له)
    const categoryData = mainCats.map(item => {
      const subCatIds = allCats.filter(sc => sc.parentId === item.id && !sc.hidden).map(sc => sc.id);
      const validCatIds = [item.id, ...subCatIds];

      const prods = allProds
        .filter(p => validCatIds.includes(p.categoryId) && !p.hidden)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

      return {
        ...item,
        products: prods
      };
    });

    // سعة الصفحة بالوحدات النسبية بناءً على الاتجاه والكثافة
    // في الوضع الرأسي (عمودان للأصناف)
    let pageCapacity = 22; // الوضع المتوازن
    if (settings.density === "compact") pageCapacity = 26;
    else if (settings.density === "spacious") pageCapacity = 18;

    if (settings.orientation === "landscape") {
      // الوضع الأفقي (3 أعمدة للأصناف)
      pageCapacity = settings.density === "compact" ? 32 : (settings.density === "spacious" ? 22 : 27);
    }

    const pages = [];
    let currentPage = {
      sections: [],
      usedUnits: 0,
      groupType: null
    };

    function flushPage() {
      if (currentPage.sections.length > 0) {
        pages.push(currentPage);
        currentPage = {
          sections: [],
          usedUnits: 0,
          groupType: null
        };
      }
    }

    categoryData.forEach(catItem => {
      const prods = catItem.products;
      if (prods.length === 0) return; // تجاوز الأقسام الفارغة

      // تكلفة ترويسة القسم
      const headerCost = catItem.decorativeImage ? 4.5 : 2.5;

      // حساب وزن كل صنف (بين 1.0 إلى 1.3 وحدة بحسب وجود أحجام أو وصف طويل)
      const itemWeights = prods.map(p => {
        let w = 1.0;
        if (p.priceType === "variants" && p.variants?.length > 1) w += 0.35;
        if (p.desc?.ar && p.desc.ar.length > 70) w += 0.25;
        return w;
      });

      const totalItemsWeight = itemWeights.reduce((a, b) => a + b, 0);
      const totalCatWeight = headerCost + totalItemsWeight;

      // شرط الفصل حسب نوع المنتج: المأكولات مع المأكولات، المشروبات مع المشروبات
      // لا يُسمح بدمج مأكولات مع مشروبات في الصفحة نفسها قطعيًا
      const isDifferentGroup = currentPage.sections.length > 0 && currentPage.groupType !== catItem.type;
      const mustForceNewPage = catItem.forceNewPage || isDifferentGroup;

      if (mustForceNewPage) {
        flushPage();
      }

      // هل القسم كبير ولا يتسع في صفحة واحدة؟
      if (totalCatWeight > pageCapacity) {
        // قسم كبير: يبدأ في صفحة جديدة إن لم تكن الصفحة فارغة بالفعل
        if (currentPage.sections.length > 0) {
          flushPage();
        }

        // توزيع أصناف القسم الكبير على صفحات متتالية مع رأس للمتابعة
        let itemIndex = 0;
        let isFirstPageOfCat = true;

        while (itemIndex < prods.length) {
          const isFirst = isFirstPageOfCat;
          const currentHeaderCost = isFirst ? headerCost : 2.0; // رأس المتابعة أقل حجمًا
          let availableUnits = pageCapacity - currentHeaderCost;
          let batch = [];
          let batchUnits = 0;

          while (itemIndex < prods.length) {
            const w = itemWeights[itemIndex];
            if (batchUnits + w > availableUnits && batch.length > 0) {
              break;
            }
            batch.push(prods[itemIndex]);
            batchUnits += w;
            itemIndex++;
          }

          pages.push({
            sections: [{
              cat: catItem.cat,
              decorativeImage: isFirst ? catItem.decorativeImage : "",
              isContinuation: !isFirst,
              products: batch
            }],
            usedUnits: currentHeaderCost + batchUnits,
            groupType: catItem.type
          });

          isFirstPageOfCat = false;
        }

      } else {
        // قسم صغير أو متوسط
        // هل يتسع في الصفحة الحالية مع الأقسام السابقة من نفس النوع؟
        if (currentPage.sections.length > 0 && (currentPage.usedUnits + totalCatWeight <= pageCapacity)) {
          // يتسع: دمج الأقسام من نفس النوع في الصفحة نفسها
          currentPage.sections.push({
            cat: catItem.cat,
            decorativeImage: catItem.decorativeImage,
            isContinuation: false,
            products: prods
          });
          currentPage.usedUnits += totalCatWeight;
        } else {
          // لا يتسع: نقل لصفحة جديدة
          if (currentPage.sections.length > 0) {
            flushPage();
          }
          currentPage.sections.push({
            cat: catItem.cat,
            decorativeImage: catItem.decorativeImage,
            isContinuation: false,
            products: prods
          });
          currentPage.usedUnits = totalCatWeight;
          currentPage.groupType = catItem.type;
        }
      }
    });

    flushPage();
    return pages;
  }

  /* رندرة صنف واحد في بطاقة أنيقة قابلة للطباعة */
  function renderItemHTML(p, settings, currencyStr) {
    const name = esc(L(p.name)) || "صنف بدون اسم";
    const desc = settings.showItemDescriptions ? esc(L(p.desc)) : "";
    const offer = getEffectivePrice(p);

    let priceHTML = "";
    if (p.priceType === "variants" && p.variants?.length) {
      // أصناف ذات أحجام متعددة
      priceHTML = `<div class="pi-variants">${p.variants.map(v => {
        const lbl = esc(v.label?.ar || v.label?.en || v.id);
        const pr = fmt(v.price);
        return `<span class="pi-variant"><span class="pi-v-lbl">${lbl}</span> <b class="pi-v-pr">${pr}</b></span>`;
      }).join('<span class="pi-v-sep">·</span>')}${settings.showCurrency ? ` <small class="pi-cur">${currencyStr}</small>` : ""}</div>`;
    } else {
      // صنف بسعر واحد
      if (offer) {
        priceHTML = `<div class="pi-price-box cut">
          <s class="pi-old-pr">${fmt(offer.base)}</s>
          <b class="pi-pr">${fmt(offer.now)}</b>
          ${settings.showCurrency ? `<small class="pi-cur">${currencyStr}</small>` : ""}
        </div>`;
      } else {
        const pr = fmt(p.price || 0);
        priceHTML = `<div class="pi-price-box">
          <b class="pi-pr">${pr}</b>
          ${settings.showCurrency ? `<small class="pi-cur">${currencyStr}</small>` : ""}
        </div>`;
      }
    }

    return `
      <article class="print-item">
        <div class="pi-header">
          <span class="pi-name">${name}</span>
          <span class="pi-leader" aria-hidden="true"></span>
          <div class="pi-price-wrap">${priceHTML}</div>
        </div>
        ${desc ? `<p class="pi-desc">${desc}</p>` : ""}
      </article>
    `;
  }

  /* رندرة رأس صفحة A4 (الشعار + اسم المطعم + العبارة التعريفية) */
  function renderPageHeaderHTML(settings, menu) {
    const brand = menu?.brand || {};
    const name = esc(settings.restaurantNameAr || brand.name?.ar || "المنيو");
    const tagline = settings.showTagline ? esc(settings.taglineAr || brand.tagline?.ar || "") : "";
    const logoUrl = settings.customLogoUrl || brand.logoUrl || "";

    return `
      <header class="a4-page-header">
        <div class="a4-header-main">
          ${(settings.showLogo && logoUrl) ? `
            <div class="a4-logo-box">
              <img src="${esc(logoUrl)}" alt="${name}" onerror="this.remove()">
            </div>
          ` : ""}
          <div class="a4-title-box">
            <h1 class="a4-restaurant-name">${name}</h1>
            ${tagline ? `<p class="a4-tagline">${tagline}</p>` : ""}
          </div>
        </div>
        <div class="a4-header-decor" aria-hidden="true">
          <span class="a4-line"></span>
          <span class="a4-ornament">✦</span>
          <span class="a4-line"></span>
        </div>
      </header>
    `;
  }

  /* رندرة تذييل صفحة A4 (بيانات التواصل + أرقام الصفحات) */
  function renderPageFooterHTML(settings, menu, pageIndex, totalPages) {
    const contact = menu?.contact || {};
    const parts = [];

    if (settings.showPhone && contact.phone) {
      parts.push(`<span>📞 ${esc(contact.phone)}</span>`);
    }
    if (settings.showWhatsapp && contact.whatsapp) {
      parts.push(`<span>🛵 طلبات/واتساب: ${esc(contact.whatsapp)}</span>`);
    }
    if (settings.showAddress && L(contact.address)) {
      parts.push(`<span>📍 ${esc(L(contact.address))}</span>`);
    }

    const pageStr = settings.showPageNumbers ? `صفحة ${fmt(pageIndex + 1)} من ${fmt(totalPages)}` : "";

    return `
      <footer class="a4-page-footer">
        <div class="a4-footer-contact">${parts.join('<span class="a4-f-sep">|</span>')}</div>
        ${pageStr ? `<div class="a4-page-num">${pageStr}</div>` : ""}
      </footer>
    `;
  }

  /* رندرة ترويسة القسم وصورته الزخرفية */
  function renderCategorySectionHTML(section, settings, currencyStr) {
    const cat = section.cat;
    const catName = esc(L(cat.name)) + (section.isContinuation ? ' <span class="cat-cont">(تابع)</span>' : '');
    const imgUrl = section.decorativeImage;

    return `
      <section class="a4-category-section ${imgUrl ? "has-banner" : "no-banner"}">
        ${imgUrl ? `
          <div class="a4-cat-banner">
            <img src="${esc(imgUrl)}" alt="" loading="lazy" onerror="this.parentElement.remove()">
            <div class="a4-banner-overlay">
              <h2 class="a4-cat-title">${catName}</h2>
            </div>
          </div>
        ` : `
          <div class="a4-cat-header-clean">
            <span class="a4-c-line"></span>
            <h2 class="a4-cat-title">${catName}</h2>
            <span class="a4-c-line"></span>
          </div>
        `}

        <div class="a4-items-grid">
          ${section.products.map(p => renderItemHTML(p, settings, currencyStr)).join("")}
        </div>
      </section>
    `;
  }

  /* رندرة الصفحات المكتملة */
  function renderPagesHTML(pages, settings, menu) {
    const currencyStr = esc(L(menu?.settings?.currency) || "ج.م");
    const totalPages = pages.length;

    if (totalPages === 0) {
      return `
        <div class="print-empty-state">
          <svg class="ic" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/></svg>
          <h3>لم يتم تحديد أي أقسام للطباعة</h3>
          <p>يرجى تفعيل قسم واحد على الأقل من قائمة الأقسام الجانبية لعرض المنيو.</p>
        </div>
      `;
    }

    return pages.map((page, idx) => `
      <div class="a4-sheet-wrapper">
        <div class="a4-sheet-meta no-print">
          <span class="a4-meta-badge">ورقة A4 · صفحة ${fmt(idx + 1)} من ${fmt(totalPages)} (${page.groupType === "drinks" ? "مشروبات" : page.groupType === "desserts" ? "حلويات" : "مأكولات"})</span>
        </div>
        <div class="a4-page ${settings.orientation}" data-page="${idx + 1}">
          <div class="a4-page-inner">
            ${renderPageHeaderHTML(settings, menu)}
            <main class="a4-page-content">
              ${page.sections.map(sec => renderCategorySectionHTML(sec, settings, currencyStr)).join("")}
            </main>
            ${renderPageFooterHTML(settings, menu, idx, totalPages)}
          </div>
        </div>
      </div>
    `).join("");
  }

  /* واجهة التحكم وإعدادات الهوية والأقسام */
  function renderControlsHTML(settings, menu) {
    const cats = (menu?.categories || []).filter(c => !c.parentId && !c.hidden);
    const brand = menu?.brand || {};

    return `
      <div class="print-dashboard-header no-print">
        <div class="pd-head-info">
          <h1>طباعة المنيو الاحترافية (A4)</h1>
          <p class="muted">معاينة وتخصيص المنيو للطباعة أو الحفظ كـ PDF دون أي تأثير على بيانات التشغيل.</p>
        </div>
        <div class="pd-head-actions">
          <button class="btn ghost sm" data-pact="backHome">الرجوع للوحة</button>
          <button class="btn" data-pact="toggleSettingsPanel" id="btnToggleSettings">
            <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>
            تخصيص الهوية والصور
          </button>
          <button class="btn primary pd-print-btn" data-pact="printNow">
            <svg class="ic" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            <span>طباعة المنيو (PDF)</span>
          </button>
        </div>
      </div>

      <!-- لوحة التحكم الجانبية القابلة للطي -->
      <aside class="print-settings-drawer no-print" id="printSettingsDrawer">
        <div class="ps-drawer-header">
          <h2>إعدادات الهوية والطباعة</h2>
          <button class="icon-btn" data-pact="toggleSettingsPanel" aria-label="إغلاق">${'<svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'}</button>
        </div>

        <div class="ps-drawer-body">
          <!-- تبويبات الإعدادات -->
          <div class="seg" id="psSubTabs">
            <button type="button" data-v="design" aria-pressed="true">الهوية البصرية</button>
            <button type="button" data-v="categories" aria-pressed="false">الأقسام والصور الزخرفية</button>
          </div>

          <!-- قسم الهوية البصرية -->
          <div class="ps-panel" id="panelDesign">
            <fieldset>
              <legend>اللون الأساسي للهوية</legend>
              <p class="hint">يُستخدم في العناوين والخطوط الفاصلة والأسعار مع خلفية فاتحة وموفرة للحبر.</p>
              <div class="ps-color-picker-row">
                <input type="color" id="pColorCustom" value="${settings.primaryColor}">
                <div class="swatches" id="psColorSwatches">
                  ${COLOR_PALETTES.map(p => `
                    <button type="button" class="sw" style="background:${p.color}" data-color="${p.color}" title="${p.name}" aria-pressed="${settings.primaryColor.toLowerCase() === p.color.toLowerCase()}"></button>
                  `).join("")}
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>إعدادات الورق والتنسيق</legend>
              <label class="f">اتجاه الورقة (A4)
                <div class="seg" id="psOrientation">
                  <button type="button" data-v="portrait" aria-pressed="${settings.orientation === "portrait"}">رأسي (Portrait)</button>
                  <button type="button" data-v="landscape" aria-pressed="${settings.orientation === "landscape"}">أفقي (Landscape)</button>
                </div>
              </label>

              <label class="f">كثافة توزيع الأصناف
                <div class="seg" id="psDensity">
                  <button type="button" data-v="compact" aria-pressed="${settings.density === "compact"}">مكثفة (أصناف أكثر)</button>
                  <button type="button" data-v="balanced" aria-pressed="${settings.density === "balanced"}">متوازنة (موصى بها)</button>
                  <button type="button" data-v="spacious" aria-pressed="${settings.density === "spacious"}">مريحة وواسعة</button>
                </div>
              </label>
            </fieldset>

            <fieldset>
              <legend>اسم المطعم والشعار</legend>
              <label class="f">اسم المطعم في الطباعة
                <input class="in" id="pRestName" value="${esc(settings.restaurantNameAr)}">
              </label>
              <label class="f">العبارة التعريفية
                <input class="in" id="pTagline" value="${esc(settings.taglineAr)}">
              </label>
              <label class="check">
                <input type="checkbox" id="pShowTagline" ${settings.showTagline ? "checked" : ""}>
                <span>إظهار العبارة التعريفية في رأس الصفحة</span>
              </label>
              <label class="check">
                <input type="checkbox" id="pShowLogo" ${settings.showLogo ? "checked" : ""}>
                <span>إظهار شعار المطعم</span>
              </label>
              <label class="f">رابط شعار مخصص للطباعة (اختياري)
                <input class="in" id="pCustomLogo" dir="ltr" placeholder="https://..." value="${esc(settings.customLogoUrl)}">
              </label>
            </fieldset>

            <fieldset>
              <legend>معلومات التواصل بالتذييل</legend>
              <label class="check">
                <input type="checkbox" id="pShowPhone" ${settings.showPhone ? "checked" : ""}>
                <span>إظهار رقم الهاتف</span>
              </label>
              <label class="check">
                <input type="checkbox" id="pShowWhatsapp" ${settings.showWhatsapp ? "checked" : ""}>
                <span>إظهار رقم الطلبات / واتساب</span>
              </label>
              <label class="check">
                <input type="checkbox" id="pShowAddress" ${settings.showAddress ? "checked" : ""}>
                <span>إظهار العنوان الرئيسي</span>
              </label>
              <label class="check">
                <input type="checkbox" id="pShowPageNumbers" ${settings.showPageNumbers ? "checked" : ""}>
                <span>إظهار ترقيم الصفحات (صفحة X من Y)</span>
              </label>
            </fieldset>

            <fieldset>
              <legend>خيارات تفاصيل الأصناف</legend>
              <label class="check">
                <input type="checkbox" id="pShowItemDesc" ${settings.showItemDescriptions ? "checked" : ""}>
                <span>إظهار وصف الأصناف أسفل الأسماء</span>
              </label>
              <label class="check">
                <input type="checkbox" id="pShowCurrency" ${settings.showCurrency ? "checked" : ""}>
                <span>إظهار رمز العملة بجوار الأسعار</span>
              </label>
              <label class="check">
                <input type="checkbox" id="pShowDecoImages" ${settings.showDecorativeImages ? "checked" : ""}>
                <span>تفعيل الصور الزخرفية للأقسام</span>
              </label>
            </fieldset>

            <div class="row" style="margin-top:10px">
              <button class="btn danger sm" data-pact="resetDefaults">استعادة الإعدادات الافتراضية</button>
            </div>
          </div>

          <!-- قسم الأقسام والصور الزخرفية -->
          <div class="ps-panel" id="panelCategories" hidden>
            <p class="hint">الصور هنا <b>زخرفية لموضوع القسم</b> (مثل صورة بيتزا لصفحة البيتزا) لتجميل الورقة وليست صورًا لكل صنف.</p>
            <div class="ps-cat-list" id="psCategoryList">
              ${cats.map((c, idx) => {
                const cs = settings.categorySettings[c.id] || {};
                const isEnabled = cs.enabled !== false;
                const type = cs.type || detectCategoryType(c);
                const img = cs.decorativeImage || "";

                return `
                  <div class="ps-cat-card ${isEnabled ? "" : "disabled"}" data-cid="${c.id}">
                    <div class="ps-cat-head">
                      <label class="check">
                        <input type="checkbox" class="ps-cat-toggle" data-cid="${c.id}" ${isEnabled ? "checked" : ""}>
                        <b>${esc(L(c.name))}</b>
                      </label>
                      <div class="ps-cat-reorder">
                        <button type="button" class="btn sm ghost" data-pact="catUp" data-cid="${c.id}" ${idx === 0 ? "disabled" : ""} title="تحريك لأعلى">▲</button>
                        <button type="button" class="btn sm ghost" data-pact="catDown" data-cid="${c.id}" ${idx === cats.length - 1 ? "disabled" : ""} title="تحريك لأسفل">▼</button>
                      </div>
                    </div>

                    <div class="ps-cat-options">
                      <div class="two">
                        <label class="f">نوع القسم
                          <select class="in ps-cat-type" data-cid="${c.id}">
                            <option value="food" ${type === "food" ? "selected" : ""}>مأكولات 🍔</option>
                            <option value="drinks" ${type === "drinks" ? "selected" : ""}>مشروبات ☕</option>
                            <option value="desserts" ${type === "desserts" ? "selected" : ""}>حلويات 🍰</option>
                          </select>
                        </label>
                        <label class="check" style="margin-top:24px">
                          <input type="checkbox" class="ps-cat-force-page" data-cid="${c.id}" ${cs.forceNewPage ? "checked" : ""}>
                          <span>بدء في صفحة جديدة</span>
                        </label>
                      </div>

                      <div class="ps-cat-img-box">
                        <div class="ps-cat-img-preview" id="prev_${c.id}">
                          ${img ? `<img src="${esc(img)}" alt="">` : `<span class="muted">لا توجد صورة</span>`}
                        </div>
                        <div class="ps-cat-img-controls">
                          <label class="btn sm">
                            رفع صورة من الجهاز
                            <input type="file" accept="image/*" class="ps-file-input" data-cid="${c.id}" hidden>
                          </label>
                          <input class="in ps-img-url" data-cid="${c.id}" placeholder="أو الصق رابط صورة https://" value="${esc(img)}">
                          <div class="row" style="gap:6px">
                            <select class="in ps-preset-select" data-cid="${c.id}" style="max-width:180px">
                              <option value="">اختيار صورة مقترحة…</option>
                              ${Object.entries(PRESET_IMAGES).map(([k, p]) => `<option value="${p.url}">${p.name}</option>`).join("")}
                            </select>
                            ${img ? `<button type="button" class="btn sm danger ghost" data-pact="removeCatImg" data-cid="${c.id}">حذف</button>` : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  /* الرندرة الرئيسية للمكون في الصفحة */
  function view(menu) {
    const settings = loadSettings(menu);
    const pages = buildPages(menu, settings);

    return `
      <div class="print-feature-root" style="--print-brand: ${settings.primaryColor}">
        ${renderControlsHTML(settings, menu)}
        <div class="print-preview-container" id="printPreviewContainer">
          ${renderPagesHTML(pages, settings, menu)}
        </div>
      </div>
    `;
  }

  /* ربط الأحداث التفاعلية */
  function init(menu) {
    let settings = loadSettings(menu);

    function updateView() {
      saveSettings(settings);
      const container = document.getElementById("printPreviewContainer");
      if (container) {
        const pages = buildPages(menu, settings);
        container.innerHTML = renderPagesHTML(pages, settings, menu);
      }
      const rootEl = document.querySelector(".print-feature-root");
      if (rootEl) {
        rootEl.style.setProperty("--print-brand", settings.primaryColor);
      }
    }

    // إغلاق أو فتح لوحة الإعدادات
    const drawer = document.getElementById("printSettingsDrawer");
    const toggleBtn = document.getElementById("btnToggleSettings");

    document.addEventListener("click", e => {
      const btn = e.target.closest("[data-pact]");
      if (!btn) return;
      const act = btn.dataset.pact;

      if (act === "printNow") {
        window.print();
      }

      if (act === "backHome") {
        if (window.go) window.go("home");
      }

      if (act === "toggleSettingsPanel") {
        if (drawer) drawer.classList.toggle("open");
      }

      if (act === "resetDefaults") {
        if (confirm("هل تريد استعادة جميع إعدادات الطباعة الافتراضية؟")) {
          settings = resetSettings(menu);
          if (window.render) window.render();
        }
      }

      if (act === "removeCatImg") {
        const cid = btn.dataset.cid;
        if (settings.categorySettings[cid]) {
          settings.categorySettings[cid].decorativeImage = "";
          updateView();
          const prev = document.getElementById(`prev_${cid}`);
          if (prev) prev.innerHTML = '<span class="muted">لا توجد صورة</span>';
          const inp = document.querySelector(`.ps-img-url[data-cid="${cid}"]`);
          if (inp) inp.value = "";
        }
      }

      if (act === "catUp" || act === "catDown") {
        const cid = btn.dataset.cid;
        const cats = (menu?.categories || []).filter(c => !c.parentId && !c.hidden);
        const curOrder = settings.categorySettings[cid]?.customOrder ?? 1;
        const targetOrder = act === "catUp" ? curOrder - 1 : curOrder + 1;

        const otherCat = cats.find(c => (settings.categorySettings[c.id]?.customOrder ?? 1) === targetOrder);
        if (otherCat) {
          settings.categorySettings[otherCat.id].customOrder = curOrder;
          settings.categorySettings[cid].customOrder = targetOrder;
          updateView();
          if (window.render) window.render();
        }
      }
    });

    // تبديل تبويبات لوحة الإعدادات (الهوية مقابل الأقسام)
    const subTabs = document.getElementById("psSubTabs");
    if (subTabs) {
      subTabs.addEventListener("click", e => {
        const b = e.target.closest("[data-v]");
        if (!b) return;
        subTabs.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b));
        const pDesign = document.getElementById("panelDesign");
        const pCats = document.getElementById("panelCategories");
        if (pDesign && pCats) {
          pDesign.hidden = b.dataset.v !== "design";
          pCats.hidden = b.dataset.v !== "categories";
        }
      });
    }

    // منتقي الألوان والباليتات
    const customColorInp = document.getElementById("pColorCustom");
    if (customColorInp) {
      customColorInp.addEventListener("input", e => {
        settings.primaryColor = e.target.value;
        updateView();
      });
    }

    const swatches = document.getElementById("psColorSwatches");
    if (swatches) {
      swatches.addEventListener("click", e => {
        const sw = e.target.closest("[data-color]");
        if (!sw) return;
        swatches.querySelectorAll(".sw").forEach(x => x.setAttribute("aria-pressed", x === sw));
        settings.primaryColor = sw.dataset.color;
        if (customColorInp) customColorInp.value = settings.primaryColor;
        updateView();
      });
    }

    // اتجاه الورقة
    const orientSeg = document.getElementById("psOrientation");
    if (orientSeg) {
      orientSeg.addEventListener("click", e => {
        const b = e.target.closest("[data-v]");
        if (!b) return;
        orientSeg.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b));
        settings.orientation = b.dataset.v;
        updateView();
      });
    }

    // كثافة الأصناف
    const densitySeg = document.getElementById("psDensity");
    if (densitySeg) {
      densitySeg.addEventListener("click", e => {
        const b = e.target.closest("[data-v]");
        if (!b) return;
        densitySeg.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b));
        settings.density = b.dataset.v;
        updateView();
      });
    }

    // نصوص وتعديلات الرأس والتذييل
    const bindInput = (id, key, isBool = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => {
        settings[key] = isBool ? el.checked : el.value.trim();
        updateView();
      });
      if (!isBool) {
        el.addEventListener("input", () => {
          settings[key] = el.value.trim();
          updateView();
        });
      }
    };

    bindInput("pRestName", "restaurantNameAr");
    bindInput("pTagline", "taglineAr");
    bindInput("pShowTagline", "showTagline", true);
    bindInput("pShowLogo", "showLogo", true);
    bindInput("pCustomLogo", "customLogoUrl");
    bindInput("pShowPhone", "showPhone", true);
    bindInput("pShowWhatsapp", "showWhatsapp", true);
    bindInput("pShowAddress", "showAddress", true);
    bindInput("pShowPageNumbers", "showPageNumbers", true);
    bindInput("pShowItemDesc", "showItemDescriptions", true);
    bindInput("pShowCurrency", "showCurrency", true);
    bindInput("pShowDecoImages", "showDecorativeImages", true);

    // تفاعلات قائمة الأقسام
    const catList = document.getElementById("psCategoryList");
    if (catList) {
      // تفعيل/تعطيل قسم
      catList.addEventListener("change", e => {
        const toggle = e.target.closest(".ps-cat-toggle");
        if (toggle) {
          const cid = toggle.dataset.cid;
          settings.categorySettings[cid].enabled = toggle.checked;
          toggle.closest(".ps-cat-card").classList.toggle("disabled", !toggle.checked);
          updateView();
          return;
        }

        const typeSel = e.target.closest(".ps-cat-type");
        if (typeSel) {
          const cid = typeSel.dataset.cid;
          settings.categorySettings[cid].type = typeSel.value;
          updateView();
          return;
        }

        const forcePage = e.target.closest(".ps-cat-force-page");
        if (forcePage) {
          const cid = forcePage.dataset.cid;
          settings.categorySettings[cid].forceNewPage = forcePage.checked;
          updateView();
          return;
        }

        const presetSel = e.target.closest(".ps-preset-select");
        if (presetSel && presetSel.value) {
          const cid = presetSel.dataset.cid;
          const url = presetSel.value;
          settings.categorySettings[cid].decorativeImage = url;
          const urlInp = catList.querySelector(`.ps-img-url[data-cid="${cid}"]`);
          if (urlInp) urlInp.value = url;
          const prev = document.getElementById(`prev_${cid}`);
          if (prev) prev.innerHTML = `<img src="${url}" alt="">`;
          presetSel.value = "";
          updateView();
          return;
        }
      });

      // كتابة رابط صورة مباشر
      catList.addEventListener("input", e => {
        const urlInp = e.target.closest(".ps-img-url");
        if (urlInp) {
          const cid = urlInp.dataset.cid;
          const url = urlInp.value.trim();
          settings.categorySettings[cid].decorativeImage = url;
          const prev = document.getElementById(`prev_${cid}`);
          if (prev) {
            prev.innerHTML = url ? `<img src="${url}" alt="" onerror="this.remove()">` : '<span class="muted">لا توجد صورة</span>';
          }
          updateView();
        }
      });

      // رفع صورة من الجهاز للقسم
      catList.addEventListener("change", async e => {
        const fileInp = e.target.closest(".ps-file-input");
        if (!fileInp || !fileInp.files || !fileInp.files[0]) return;
        const file = fileInp.files[0];
        const cid = fileInp.dataset.cid;
        fileInp.value = "";

        const prev = document.getElementById(`prev_${cid}`);
        if (prev) prev.innerHTML = '<span class="muted">جاري المعالجة…</span>';

        try {
          const dataUrl = await compressImage(file, 900);
          settings.categorySettings[cid].decorativeImage = dataUrl;
          if (prev) prev.innerHTML = `<img src="${dataUrl}" alt="">`;
          const urlInp = catList.querySelector(`.ps-img-url[data-cid="${cid}"]`);
          if (urlInp) urlInp.value = "";
          updateView();
        } catch {
          if (prev) prev.innerHTML = '<span class="err">فشلت معالجة الصورة</span>';
        }
      });
    }
  }

  return {
    view,
    init,
    loadSettings,
    saveSettings,
    resetSettings,
    buildPages
  };
})();

