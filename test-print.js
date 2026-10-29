// Comprehensive automated tests for Menu Print (A4) feature
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== STARTING MENU PRINT FEATURE TESTS ===\n');

// 1. Setup mock browser environment
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

// Load config and sample menu
const configCode = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
const sampleMenuCode = fs.readFileSync(path.join(__dirname, 'sample-menu.js'), 'utf8');
const printCode = fs.readFileSync(path.join(__dirname, 'print.js'), 'utf8');

const ctx = vm.createContext(domMock);
vm.runInContext(configCode, ctx);
vm.runInContext(sampleMenuCode, ctx);
vm.runInContext(printCode, ctx);

const MenuPrint = ctx.window.MenuPrint;
if (!MenuPrint) {
  console.error('FAIL: MenuPrint not found on window object!');
  process.exit(1);
}
console.log('PASS: MenuPrint loaded successfully on window object.');

// 2. Test settings loading and persistence
const sampleMenu = JSON.parse(JSON.stringify(ctx.window.SAMPLE_MENU));
let settings = MenuPrint.loadSettings(sampleMenu);

console.log('\n--- Test 1: Settings initialization & defaults ---');
assert(settings.primaryColor, 'Primary color should have a default');
assert(settings.orientation === 'portrait', 'Default orientation should be portrait');
assert(settings.density === 'balanced', 'Default density should be balanced');
assert(Object.keys(settings.categorySettings).length > 0, 'Category settings should be populated for all main categories');
console.log('PASS: Default settings initialized properly.');

console.log('\n--- Test 2: Smart Grouping (Food with Food, Drinks with Drinks) ---');
// In sampleMenu:
// hot (drinks): 4 items
// burger (food): 4 items
// pizza (food): 3 items
// sweet (desserts): 2 items (available=false in sample, let's enable it)
sampleMenu.categories.find(c => c.id === 'sweet').available = true;

const pages = MenuPrint.buildPages(sampleMenu, settings);
console.log(`Generated ${pages.length} pages for sample menu.`);

pages.forEach((p, idx) => {
  const catNames = p.sections.map(s => s.cat.name.ar).join(' + ');
  const types = [...new Set(p.sections.map(s => {
    const cs = settings.categorySettings[s.cat.id];
    return cs?.type || 'unknown';
  }))];
  console.log(`Page ${idx + 1}: [${p.groupType}] ${catNames} (Items: ${p.sections.reduce((sum, s) => sum + s.products.length, 0)})`);
  
  // Verify strictly NO mixing of food and drinks on the same page
  assert(types.length === 1, `Page ${idx + 1} has mixed types: ${types.join(', ')}`);
});
console.log('PASS: Strict separation enforced: Food, Drinks, and Desserts are never mixed on the same page.');

// Check that burger and pizza (both food) are combined on the same page!
const foodPage = pages.find(p => p.groupType === 'food');
assert(foodPage, 'There should be a food page');
const foodCats = foodPage.sections.map(s => s.cat.id);
assert(foodCats.includes('burger') && foodCats.includes('pizza'), 'Small food categories (Burger + Pizza) should be combined on the same page');
console.log('PASS: Small food categories successfully merged to optimize paper usage without mixing types.');

console.log('\n--- Test 3: Large Category Pagination ---');
// Create a test menu with a large category (e.g. 24 pizzas)
const largeMenu = JSON.parse(JSON.stringify(sampleMenu));
const pizzaProds = [];
for (let i = 1; i <= 24; i++) {
  pizzaProds.push({
    id: `pz_test_${i}`,
    categoryId: 'pizza',
    name: { ar: `بيتزا رقم ${i}`, en: `Pizza #${i}` },
    desc: { ar: `وصف تفصيلي للبيتزا رقم ${i} مع مكونات طازجة وجبنة ممتازة`, en: `Description for pizza ${i}` },
    priceType: 'single',
    price: 100 + i * 5,
    sort: i
  });
}
largeMenu.products = pizzaProds;
largeMenu.categories = [{ id: 'pizza', parentId: null, name: { ar: 'بيتزا', en: 'Pizza' }, icon: 'pizza', sort: 1 }];

const largeSettings = MenuPrint.loadSettings(largeMenu);
const largePages = MenuPrint.buildPages(largeMenu, largeSettings);
console.log(`Large category with 24 items generated ${largePages.length} pages.`);
assert(largePages.length > 1, 'Large category should split across more than 1 page');
assert(largePages[0].sections[0].isContinuation === false, 'First page of large category is not a continuation');
assert(largePages[1].sections[0].isContinuation === true, 'Second page of large category is marked as continuation');
console.log('PASS: Large category correctly paginates across multiple pages with continuation header.');

console.log('\n--- Test 4: Live Data Binding (Price, Description, New Item, Deletion) ---');
// Modify price in memory
sampleMenu.products.find(p => p.id === 'b1').price = 250;
sampleMenu.products.find(p => p.id === 'b1').desc.ar = 'وصف جديد ومعدل تجريبي للبرجر الكلاسيك';

const fmt = n => (+n).toLocaleString("ar-EG", { maximumFractionDigits: 2 });

const updatedPages = MenuPrint.buildPages(sampleMenu, settings);
const htmlOutput = MenuPrint.view(sampleMenu);

assert(htmlOutput.includes(fmt(250)), 'Updated price 250 should appear immediately in view HTML');
assert(htmlOutput.includes('وصف جديد ومعدل تجريبي'), 'Updated description should appear immediately in view HTML');

// Add new item
sampleMenu.products.push({
  id: 'b_new',
  categoryId: 'burger',
  name: { ar: 'برجر ترافل فاخر', en: 'Truffle Burger' },
  desc: { ar: 'برجر مع صوص الترافل وجبنة بري', en: 'Burger with truffle' },
  priceType: 'single',
  price: 290,
  sort: 99
});
const htmlWithNew = MenuPrint.view(sampleMenu);
assert(htmlWithNew.includes('برجر ترافل فاخر') && htmlWithNew.includes(fmt(290)), 'Newly added item should appear in burger section with price 290');

// Delete an item
sampleMenu.products = sampleMenu.products.filter(p => p.id !== 'h1');
const htmlAfterDel = MenuPrint.view(sampleMenu);
assert(!htmlAfterDel.includes('قهوة تركي'), 'Deleted item should not appear in print HTML');
console.log('PASS: Live data binding verified: price edits, description edits, additions, and deletions reflect immediately.');

console.log('\n--- Test 5: Visual Customization & Reordering ---');
// Change primary color
settings.primaryColor = '#8b263e';
// Change orientation
settings.orientation = 'landscape';
// Reorder: Move sweet before burger
settings.categorySettings['sweet'].customOrder = 1;
settings.categorySettings['burger'].customOrder = 2;

MenuPrint.saveSettings(settings);
const reloaded = MenuPrint.loadSettings(sampleMenu);
assert(reloaded.primaryColor === '#8b263e', 'Saved custom primary color should persist');
assert(reloaded.orientation === 'landscape', 'Saved orientation should persist');

const landscapePages = MenuPrint.buildPages(sampleMenu, reloaded);
const landscapeHtml = MenuPrint.view(sampleMenu);
assert(landscapeHtml.includes('a4-page landscape'), 'Landscape class should be rendered on pages');
assert(landscapeHtml.includes('--print-brand: #8b263e'), 'Custom color variable should be set in style');
console.log('PASS: Visual identity customizations and landscape mode working as expected.');

console.log('\n--- Test 6: Safety - Operational Menu Invariance ---');
// Ensure operational menu properties were NOT altered
assert(sampleMenu.categories.find(c => c.id === 'sweet').sort === 4, 'Operational category sort must NOT be modified by print customOrder');
console.log('PASS: Operational menu untouched. Print order is strictly isolated.');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');

function assert(condition, message) {
  if (!condition) {
    console.error('ASSERTION FAILED:', message);
    process.exit(1);
  }
}
