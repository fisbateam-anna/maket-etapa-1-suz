import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createObjects(count, excludedIds = []) {
  return Array.from({ length: count }, (_, index) => ({
    id: `COL-${String(index + 1).padStart(3, "0")}`,
    suzNumber: `P-${String(index + 1).padStart(3, "0")}`,
    profileIdentifier: `ASSET-${String(index + 1).padStart(3, "0")}`,
    type: index % 2 ? "Автотранспорт" : "Недвижимость",
    status: index % 2 ? "В залоге" : "Новый",
    name: `Объект ${index + 1}`,
    clientName: index % 2 ? "ООО Волга" : "ООО Север",
    pledgors: [{ name: index % 2 ? "ООО Волга" : "ООО Север" }],
    ...(index === 2 ? {} : { createdAt: `2026-10-${String(index % 28 + 1).padStart(2, "0")} 11:30` }),
    excluded: excludedIds.includes(`COL-${String(index + 1).padStart(3, "0")}`)
  }));
}

function createRenderers(task) {
  const context = {
    state: { taskRegistryCollateralDrawer: null },
    getTask: () => task,
    getTaskDirection: (item) => item.direction,
    getTaskCollaterals: (item) => item.collaterals,
    getCollateral: (id) => task.collaterals.find((item) => item.id === id),
    getCollateralSuzNumber: (item) => item.suzNumber || item.id,
    getCollateralObjectIdentifier: (item) => item.profileIdentifier || item.id,
    getCollateralTypeLabel: (item) => item.type,
    getCollateralStatusForFt: (item) => item.status || "Новый",
    getCollateralName: (item) => item.name,
    getMainPledgor: (item) => ({ name: item.clientName }),
    isTaskCollateralExcluded: (_task, id) => task.excludedCollateralIds.includes(id),
    formatProfileIdentifierDate: (value) => {
      const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return match ? `${match[3]}.${match[2]}.${match[1]}` : String(value || "");
    },
    pluralize: (value, one, few, many) => {
      const mod10 = value % 10;
      const mod100 = value % 100;
      if (mod10 === 1 && mod100 !== 11) return one;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
      return many;
    },
    escapeHtml,
    hasPermission: () => true,
    getRole: () => ({}),
    getCollateralCardRoute: (id) => `/app/collaterals/${id}`
  };
  const cellStart = appSource.indexOf("const TASK_REGISTRY_COLLATERAL_PAGE_SIZE = 40;");
  const cellEnd = appSource.indexOf("\nfunction getCollateralCardRoute", cellStart);
  const drawerStart = appSource.indexOf("function renderTaskRegistryCollateralDrawerContent", cellEnd);
  const drawerEnd = appSource.indexOf("\nfunction renderTasksRegistry", drawerStart);
  const linkStart = appSource.indexOf("function renderRegistryRecordLink(");
  const linkEnd = appSource.indexOf("\nfunction renderApplicationRegistryNumberLink", linkStart);
  assert.notEqual(cellStart, -1);
  assert.notEqual(cellEnd, -1);
  assert.notEqual(drawerStart, -1);
  assert.notEqual(drawerEnd, -1);
  assert.notEqual(linkStart, -1);
  assert.notEqual(linkEnd, -1);
  vm.runInNewContext(`${appSource.slice(cellStart, cellEnd)}\n${appSource.slice(drawerStart, drawerEnd)}\n${appSource.slice(linkStart, linkEnd)}\nglobalThis.renderCell = renderTaskRegistryCollateralCell;\nglobalThis.renderDrawer = renderTaskRegistryCollateralDrawer;\nglobalThis.renderDrawerContent = renderTaskRegistryCollateralDrawerContent;\nglobalThis.fillDrawer = fillTaskRegistryCollateralDrawerUntilScrollable;`, context);
  return context;
}

test("task registry collateral cell shows a compact count rather than object identifiers", () => {
  const task = { id: "tsk-test", direction: "inspection", collateralIds: [], excludedCollateralIds: [], collaterals: createObjects(100) };
  const renderers = createRenderers(task);
  const markup = renderers.renderCell(task, task.collaterals);

  assert.match(markup, />100 объектов</);
  assert.match(markup, /data-action="open-task-collateral-drawer"/);
  assert.doesNotMatch(markup, /ASSET-001|ASSET-100/);
  assert.match(renderers.renderCell(task, [task.collaterals[0]]), />1 объект</);
});

test("collateral drawer follows the FT five-column list and loads rows incrementally", () => {
  const task = {
    id: "tsk-100-assets",
    type: "Физический осмотр",
    direction: "inspection",
    excludedCollateralIds: ["COL-002", "COL-100"],
    collaterals: createObjects(100)
  };
  const renderers = createRenderers(task);
  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id, limit: 40 };
  const markup = renderers.renderDrawer("inspection");

  assert.match(markup, /<th>Номер залога<\/th><th>Идентификатор залога<\/th><th>Вид залога<\/th><th>Статус объекта<\/th><th>Залогодатель<\/th>/);
  assert.match(markup, /P-001/);
  assert.match(markup, /ASSET-001/);
  assert.match(markup, /<td>Новый<\/td>/);
  assert.match(markup, /Залогодатель/);
  assert.equal((markup.match(/<td>/g) || []).length, 200);
  assert.match(markup, /ASSET-001/);
  assert.match(markup, /<td>ООО Север<\/td>/);
  assert.doesNotMatch(markup, /Дата создания/);
  assert.doesNotMatch(markup, /Исключен|Найти объект|Всего|В рассмотрении|Исключено|Показать еще|data-task-registry-collateral-search/);
  assert.doesNotMatch(markup, /ASSET-100/);

  renderers.state.taskRegistryCollateralDrawer.limit = 80;
  const nextPage = renderers.renderDrawer("inspection");
  assert.equal((nextPage.match(/<td>/g) || []).length, 400);
  assert.match(nextPage, /ASSET-080/);

  renderers.state.taskRegistryCollateralDrawer.limit = 100;
  const foundLastObject = renderers.renderDrawerContent(task, task.collaterals);
  assert.equal((foundLastObject.match(/<td>/g) || []).length, 500);
  assert.match(foundLastObject, /ASSET-100/);
});

test("drawer links by pledge number and keeps profile identifier as a separate column", () => {
  const task = {
    id: "tsk-links",
    direction: "inspection",
    excludedCollateralIds: [],
    collaterals: createObjects(2)
  };
  const renderers = createRenderers(task);
  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id, limit: 40 };
  const markup = renderers.renderDrawer("inspection");
  assert.match(markup, /href="#\/app\/collaterals\/COL-001" target="_blank"[^>]*>P-001<\/a>/);
  assert.match(markup, /<td>ASSET-001<\/td>/);
  assert.match(markup, /ООО Север/);
  assert.match(markup, /ООО Волга/);
  assert.doesNotMatch(markup, /Дата создания|Найти объект|Показано/);
});

test("drawer lists all pledgors once, separated by commas, and escapes names", () => {
  const task = {
    id: "tsk-multiple-pledgors",
    direction: "inspection",
    excludedCollateralIds: [],
    collaterals: [{
      id: "COL-MULTI",
      profileIdentifier: "ASSET-MULTI",
      type: "Недвижимость",
      createdAt: "2026-10-20 10:00",
      pledgors: [
        { name: "ООО Альфа" },
        { name: "Иванов <И.И.>" },
        { name: "ООО Альфа" }
      ]
    }]
  };
  const renderers = createRenderers(task);
  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id, limit: 40 };
  const markup = renderers.renderDrawer("inspection");

  assert.match(markup, /<td>ООО Альфа, Иванов &lt;И\.И\.&gt;<\/td>/);
  assert.equal((markup.match(/ООО Альфа/g) || []).length, 1);
});

test("drawer does not substitute the client for a missing pledgor", () => {
  const task = {
    id: "tsk-missing-pledgor",
    direction: "inspection",
    excludedCollateralIds: [],
    collaterals: [{
      id: "COL-NO-PLEDGOR",
      profileIdentifier: "ASSET-NO-PLEDGOR",
      type: "Недвижимость",
      clientName: "ООО Заемщик",
      pledgors: []
    }]
  };
  const renderers = createRenderers(task);
  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id, limit: 40 };
  const markup = renderers.renderDrawer("inspection");

  assert.match(markup, /<td>—<\/td>/);
  assert.doesNotMatch(markup, /ООО Заемщик/);
});

test("drawer renders all seeded objects with five FT columns", () => {
  const task = {
    id: "tsk-seeded-collaterals",
    direction: "inspection",
    excludedCollateralIds: [],
    collaterals: initialData.collaterals
  };
  const renderers = createRenderers(task);
  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id, limit: 100 };
  const markup = renderers.renderDrawer("inspection");

  const rows = [...markup.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1);
  assert.equal(rows.length, initialData.collaterals.length);
  for (const [, rowMarkup] of rows) {
    const cells = [...rowMarkup.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(([, content]) => content);
    assert.equal(cells.length, 5);
    assert.notEqual(cells[0], "—");
    assert.notEqual(cells[1], "—");
    assert.notEqual(cells[2], "—");
    assert.notEqual(cells[3], "—");
  }
});

test("drawer adds the next batch when the user scrolls near the list end", () => {
  const task = { id: "tsk-scroll", direction: "inspection", excludedCollateralIds: [], collaterals: createObjects(100) };
  const renderers = createRenderers(task);
  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id, limit: 40 };
  let scrollHandler;
  renderers.document = { addEventListener: (name, handler, capture) => {
    if (name === "scroll") {
      assert.equal(capture, true);
      scrollHandler = handler;
    }
  } };
  const content = {
    scrollTop: 650,
    clientHeight: 300,
    scrollHeight: 900,
    innerHTML: ""
  };
  vm.runInNewContext(
    appSource.slice(appSource.indexOf('document.addEventListener("scroll"'), appSource.indexOf('\ndocument.addEventListener("input"', appSource.indexOf('document.addEventListener("scroll"'))),
    renderers
  );

  scrollHandler({ target: { closest: () => content } });

  assert.equal(renderers.state.taskRegistryCollateralDrawer.limit, 80);
  assert.equal((content.innerHTML.match(/<td>/g) || []).length, 400);
  assert.match(content.innerHTML, /ASSET-080/);
  assert.equal(content.scrollTop, 650);
});

test("drawer fills until scrolling is available when the first batch fits", () => {
  const task = { id: "tsk-tall-screen", direction: "inspection", excludedCollateralIds: [], collaterals: createObjects(100) };
  const renderers = createRenderers(task);
  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id, limit: 40 };
  let markup = "";
  const content = {
    clientHeight: 2000,
    scrollTop: 0,
    get scrollHeight() { return ((markup.match(/<td>/g) || []).length / 3) * 45 + 70; },
    set innerHTML(value) { markup = value; }
  };
  renderers.app = { querySelector: () => content };

  renderers.fillDrawer();

  assert.equal(renderers.state.taskRegistryCollateralDrawer.limit, 80);
  assert.ok(content.scrollHeight > content.clientHeight);
  assert.match(markup, /ASSET-080/);
  assert.doesNotMatch(markup, /ASSET-081/);
});

test("drawer focus moves inside on open and returns to its task counter on close", () => {
  const task = { id: "tsk-focus", direction: "inspection", excludedCollateralIds: [], collaterals: createObjects(1) };
  const renderers = createRenderers(task);
  const focused = [];
  const closeButton = { focus: (options) => focused.push({ target: "close", options }) };
  const counterButton = { dataset: { task: task.id }, focus: (options) => focused.push({ target: "counter", options }) };
  const helperStart = appSource.indexOf("function focusPendingTaskRegistryCollateralDrawerTarget()");
  const helperEnd = appSource.indexOf("\nfunction renderTopbar", helperStart);
  assert.notEqual(helperStart, -1);
  assert.notEqual(helperEnd, -1);
  renderers.app = {
    querySelector: () => closeButton,
    querySelectorAll: () => [counterButton]
  };
  vm.runInNewContext(appSource.slice(helperStart, helperEnd), renderers);
  renderers.focusPendingTaskRegistryCollateralDrawerTarget = renderers.focusPendingTaskRegistryCollateralDrawerTarget;

  renderers.state.taskRegistryCollateralDrawer = { taskId: task.id };
  renderers.state.pendingTaskRegistryCollateralDrawerFocusTaskId = task.id;
  renderers.focusPendingTaskRegistryCollateralDrawerTarget();
  assert.equal(focused[0].target, "close");
  assert.deepEqual(JSON.parse(JSON.stringify(focused[0].options)), { preventScroll: true });

  renderers.state.taskRegistryCollateralDrawer = null;
  renderers.state.pendingTaskRegistryCollateralDrawerFocusTaskId = task.id;
  renderers.focusPendingTaskRegistryCollateralDrawerTarget();
  assert.equal(focused[1].target, "counter");
  assert.equal(renderers.state.pendingTaskRegistryCollateralDrawerFocusTaskId, "");
});

test("collateral drawer has a responsive fixed-width presentation", () => {
  assert.match(styles, /\.task-registry-collateral-drawer\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(styles, /task-registry-collateral-slide-in/);
  assert.match(styles, /\.task-registry-collateral-drawer-content\s*\{[\s\S]*?overflow:\s*auto/);
  assert.match(styles, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.task-registry-collateral-drawer/);
});

test("drawer column headers wrap at spaces without breaking words", () => {
  assert.match(styles, /\.task-registry-collateral-table th\s*\{[\s\S]*?overflow-wrap:\s*normal/);
  assert.match(styles, /\.task-registry-collateral-table td\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(styles, /\.task-registry-collateral-table th:nth-child\(1\)\s*\{\s*width:\s*20%/);
  assert.match(styles, /\.task-registry-collateral-table th:nth-child\(5\)\s*\{\s*width:\s*20%/);
  assert.match(styles, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.task-registry-collateral-table th:nth-child\(1\)\s*\{\s*width:\s*19%/);
  assert.match(styles, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.task-registry-collateral-table th:nth-child\(5\)\s*\{\s*width:\s*22%/);
});
