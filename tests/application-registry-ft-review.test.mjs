import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function getSourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

test("application status registry values match FT and map internal return states for display", () => {
  const block = getSourceBlock("function getApplicationRegistryStatus(", "function getApplicationTypeFilterOptions(");
  const context = {
    APPLICATION_STATUSES: ["Новая", "В работе", "Требуется доработка", "Завершена"],
    APPLICATION_REGISTRY_STATUSES: ["Черновик", "Новая", "В работе", "Требуется доработка", "Завершена"]
  };
  vm.runInNewContext(`${block}\nglobalThis.getStatus = getApplicationRegistryStatus; globalThis.getOptions = getApplicationStatusOptions;`, context);

  assert.deepEqual(Array.from(context.getOptions()), ["Черновик", "Новая", "В работе", "Требуется доработка", "Завершена"]);
  assert.equal(context.getStatus("Черновик"), "Черновик");
  assert.equal(context.getStatus("На доработке инициатором"), "Требуется доработка");
  assert.equal(context.getStatus("Ожидание документов"), "Требуется доработка");
  assert.equal(context.getStatus("Закрыта"), "Завершена");
  assert.equal(context.getStatus("В работе"), "В работе");
  assert.match(appSource, /status: APPLICATION_REGISTRY_STATUSES\.filter\(\(status\) => status !== "Завершена"\)/);
});

test("application registry does not add a collateral type filter absent from FT table 15", () => {
  const registry = getSourceBlock("function renderApplicationsRegistry()", "function renderCollateralControlPanel");
  assert.doesNotMatch(registry, /filterSelect\("applications", "collateralType"/);
  assert.doesNotMatch(registry, /filters\.collateralType/);
});

test("task registry client filter searches only the parent application's name and INN", () => {
  const block = getSourceBlock("function getTaskRegistryClientSearch(", "\nfunction getTaskRegistryPledgorSearch(");
  const context = {
    getApplicationClientName: (application) => application?.clientName || "",
    getApplicationInn: (application) => application?.clientInn || ""
  };
  vm.runInNewContext(`${block}\nglobalThis.search = getTaskRegistryClientSearch;`, context);

  const query = context.search({ clientName: "ООО Альфа", clientInn: "7700000000" });
  const matching = getSourceBlock("function matches(value, filter)", "function matchesSelectedValues(");
  vm.runInNewContext(`${matching}\nglobalThis.matches = matches;`, context);

  assert.equal(context.matches(query, "альфа"), true);
  assert.equal(context.matches(query, "7700000000"), true);
  assert.equal(context.matches(query, "бета"), false);
});

function createApplicationDrawer(collaterals) {
  const application = { id: "app-test", number: "app-30102026-001" };
  const scrollContent = { scrollTop: 6, scrollHeight: 100, clientHeight: 50, innerHTML: "" };
  const context = {
    state: { applicationRegistryCollateralDrawer: { applicationId: application.id, applicationNumber: application.number, limit: 40 } },
    app: { querySelector: () => scrollContent },
    getApplicationByIdOrNumber: () => application,
    getApplicationCollaterals: () => collaterals,
    getCollateralSuzNumber: (collateral) => collateral.suzNumber || collateral.id,
    getCollateralObjectIdentifier: (collateral) => collateral.profileIdentifier || collateral.id,
    getCollateralTypeLabel: (collateral) => collateral.type,
    getCollateralStatusForFt: (collateral) => collateral.status || "Новый",
    hasPermission: () => true,
    getRole: () => ({}),
    getCollateralCardRoute: (id, options) => `/app/collaterals/${id}?application=${options.application.id}`,
    escapeHtml,
    pluralize
  };
  const block = getSourceBlock("const APPLICATION_REGISTRY_COLLATERAL_PAGE_SIZE = 40;", "function renderApplicationContractLinks(");
  const linkBlock = getSourceBlock("function renderRegistryRecordLink(", "function renderApplicationRegistryNumberLink(");
  vm.runInNewContext(`${block}\n${linkBlock}\nglobalThis.renderCount = renderApplicationCollateralLinks; globalThis.renderDrawer = renderApplicationRegistryCollateralDrawer; globalThis.renderContent = renderApplicationRegistryCollateralDrawerContent; globalThis.loadNext = loadNextApplicationRegistryCollateralBatch; globalThis.fill = fillApplicationRegistryCollateralDrawerUntilScrollable;`, context);
  return { context, application, scrollContent };
}

test("application collateral count opens an in-place right drawer with a compact, batched list", () => {
  const collaterals = Array.from({ length: 45 }, (_, index) => ({
    id: `COL-${index + 1}`,
    suzNumber: `P-${index + 1}`,
    profileIdentifier: `ASSET-${index + 1}`,
    type: index % 2 ? "Автотранспорт" : "Недвижимость",
    status: index % 2 ? "В залоге" : "Новый",
    createdAt: "30.10.2026",
    pledgors: [{ name: "ООО Альфа" }, { name: "ООО Альфа" }, { name: "Иванов И.И." }]
  }));
  const { context, application, scrollContent } = createApplicationDrawer(collaterals);

  const count = context.renderCount(application);
  assert.match(count, /45 залогов/);
  assert.match(count, /data-action="open-application-collateral-drawer"/);
  assert.doesNotMatch(count, /ASSET-1/);

  const drawer = context.renderDrawer();
  assert.match(drawer, /id="applicationRegistryCollateralDrawer"/);
  assert.match(drawer, /Объекты залога/);
  assert.match(drawer, /<th>Номер залога<\/th><th>Идентификатор залога<\/th><th>Вид залога<\/th><th>Статус объекта<\/th><th>Залогодатель<\/th>/);
  assert.match(drawer, /href="#\/app\/collaterals\/COL-1\?application=app-test" target="_blank"[^>]*>P-1<\/a>/);
  assert.match(drawer, /<td>ASSET-1<\/td>/);
  assert.match(drawer, /<td>Новый<\/td>/);
  assert.equal((drawer.match(/<td>/g) || []).length, 200);
  assert.doesNotMatch(drawer, /Дата создания/);
  assert.doesNotMatch(drawer, /Поиск|Фильтр|Всего|Сводка/);

  assert.equal(context.loadNext(scrollContent), true);
  assert.equal(context.state.applicationRegistryCollateralDrawer.limit, 45);
  assert.match(scrollContent.innerHTML, /ASSET-45/);
  assert.equal(scrollContent.scrollTop, 6);
});
