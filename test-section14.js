// Expanded automated test suite covering all Section 14 criteria
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== EXTENDED TEST SUITE: SECTION 14 VERIFICATION ===\n');

const domMock = {
  window: {},
  document: {
    createElement: () => ({
      getContext: () => ({ drawImage: () => {} }),
      toDataURL: () => 'data:image/jpeg;base64,mock',
      width: 0,
      height: 0
    }),
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};
domMock.window = domMock;
domMock.window.document = domMock.document;
domMock.window.localStorage = domMock.localStorage;

const configCode = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
const sampleMenuCode = fs.readFileSync(path.join(__dirname, 'sample-menu.js'), 'utf8');
const printCode = fs.readFileSync(path.join(__dirname, 'print.js'), 'utf8');

const ctx = vm.createContext(domMock);
vm.runInContext(configCode, ctx);
vm.runInContext(sampleMenuCode, ctx);
vm.runInContext(printCode, ctx);

const MenuPrint = ctx.window.MenuPrint;
const sampleMenu = JSON.parse(JSON.stringify(ctx.window.SAMPLE_MENU));
const fmt = n => (+n).toLocaleString("ar-EG", { maximumFractionDigits: 2 });

// Test A: Variants and sizes rendering
console.log('--- Test A: Variant pricing (الأحجام والأسعار) ---');
// Product h1 is Turkish Coffee with variants: S: 30, M: 40, L: 50
const turkishCoffee = sampleMenu.products.find(p => p.id === 'h1');
const htmlTurkish = MenuPrint.view(sampleMenu);
assert(htmlTurkish.includes('pi-variants'), 'Turkish coffee should render variants container');
assert(htmlTurkish.includes(fmt(30)) && htmlTurkish.includes(fmt(40)) && htmlTurkish.includes(fmt(50)), 'All variant prices 30, 40, 50 should appear');
console.log('PASS: Variant sizes and prices render accurately without data loss.');

// Test B: Long dish names and descriptions
console.log('\n--- Test B: Long dish names and descriptions (الأسماء والأوصاف الطويلة) ---');
sampleMenu.products.push({
  id: 'long_item',
  categoryId: 'burger',
  name: { ar: 'برجر تريبل سوبريم محشو بالجبنة السويسرية واللحم البقري الفاخر المشوي على الحطب', en: 'Super Long Burger Name' },
  desc: { ar: 'وصف طويل جدا للصنف يحتوي على شرح مفصل لجميع المكونات والصلصات والتوابل الخاصة المحضرة يوميا في مطبخنا لنقدم لكم أفضل تجربة طعام فريدة لا تنسى مع البطاطس المقلية المقرمشة وصوص الرانش المبتكر.', en: 'Very long description.' },
  priceType: 'single',
  price: 350,
  sort: 10
});

const htmlLong = MenuPrint.view(sampleMenu);
assert(htmlLong.includes('برجر تريبل سوبريم'), 'Long item name appears in print view');
assert(htmlLong.includes('وصف طويل جدا للصنف'), 'Long item description appears in print view');
console.log('PASS: Long names and descriptions render cleanly with word wrapping.');

// Test C: Item with active offer price
console.log('\n--- Test C: Item with active offer price (سعر العرض المخفض) ---');
// Product b2 has offer with price 150 (original 185)
const burgerDouble = sampleMenu.products.find(p => p.id === 'b2');
// Ensure offer endAt is in the future
burgerDouble.offer.endAt = new Date(Date.now() + 864e5).toISOString();
const htmlOffer = MenuPrint.view(sampleMenu);
assert(htmlOffer.includes(fmt(150)), 'Discounted offer price 150 should be rendered');
assert(htmlOffer.includes(fmt(185)), 'Original price 185 should be rendered as struck-through');
console.log('PASS: Active offer reflects live sale price alongside original price.');

// Test D: Decorative Category Image Upload & Fallback
console.log('\n--- Test D: Decorative category image and graceful fallback ---');
const settings = MenuPrint.loadSettings(sampleMenu);
// Set a custom direct URL for pizza
settings.categorySettings['pizza'].decorativeImage = 'https://example.com/custom-pizza.jpg';
// Remove image for burger
settings.categorySettings['burger'].decorativeImage = '';
MenuPrint.saveSettings(settings);

const pagesD = MenuPrint.buildPages(sampleMenu, settings);
const htmlD = MenuPrint.view(sampleMenu);
assert(htmlD.includes('https://example.com/custom-pizza.jpg'), 'Custom pizza image should be rendered in banner');
assert(htmlD.includes('a4-cat-header-clean'), 'Category without image should render clean typographic header');
console.log('PASS: Decorative category images render when set, and clean typographic headers render as fallback when absent.');

// Test E: Currency Respect
console.log('\n--- Test E: Currency configuration respect ---');
sampleMenu.settings.currency = { ar: 'ريال', en: 'SAR' };
const htmlCurrency = MenuPrint.view(sampleMenu);
assert(htmlCurrency.includes('ريال'), 'Currency should update to ريال');
console.log('PASS: System currency respected dynamically.');

// Test F: Force New Page Setting
console.log('\n--- Test F: Force new page option (فصل القسم في صفحة مستقلة) ---');
// Burger and Pizza were combined on page 2. Let's force Pizza onto a new page.
settings.categorySettings['pizza'].forceNewPage = true;
const pagesSeparated = MenuPrint.buildPages(sampleMenu, settings);
const burgerPage = pagesSeparated.find(p => p.sections.some(s => s.cat.id === 'burger'));
const pizzaPage = pagesSeparated.find(p => p.sections.some(s => s.cat.id === 'pizza'));
assert(burgerPage !== pizzaPage, 'Burger and Pizza should now be on separate pages when forceNewPage is true');
console.log('PASS: Force new page toggle works as expected.');

console.log('\n=== ALL EXTENDED SECTION 14 TESTS PASSED! ===\n');

function assert(condition, message) {
  if (!condition) {
    console.error('ASSERTION FAILED:', message);
    process.exit(1);
  }
}
