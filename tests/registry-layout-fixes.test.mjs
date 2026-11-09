import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function sourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

test("application identifiers have enough width and wrap when the viewport narrows", () => {
  const widthsBlock = sourceBlock("const REGISTRY_COLUMN_WIDTHS = {", "function getTaskRegistrySortContext(");
  const context = {};
  vm.runInNewContext(`${widthsBlock}\nglobalThis.widths = REGISTRY_COLUMN_WIDTHS;`, context);

  for (const direction of ["evaluation", "inspection", "registration"]) {
    assert.ok(context.widths.tasks[direction].application >= 150, `${direction} application column remains readable and wraps`);
  }
  assert.ok(context.widths.applications.application >= 160, "application register number column remains readable and wraps");
  assert.match(styles, /\.registry-work-area \.task-table-modern td:nth-child\(2\)[\s\S]*?white-space:\s*normal;\s*overflow-wrap:\s*anywhere;/);
  assert.match(styles, /\.registry-work-area \.applications-table td:nth-child\(1\)[\s\S]*?white-space:\s*normal;\s*overflow-wrap:\s*anywhere;/);
});

test("date-only registry ranges use one filter-grid column and compact paired controls", () => {
  const desktopDateFilter = styles.match(/\.main\.registry-main \.registry-filter-grid \.filter-date-range\s*\{([^}]*)\}/)?.[1] || "";
  assert.match(desktopDateFilter, /grid-column:\s*auto;/);
  assert.doesNotMatch(desktopDateFilter, /span\s+3/);
  assert.match(styles, /\.main\.registry-main \.filter-date-range \.date-range-inputs\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(styles, /\.main\.registry-main \.filter-date-range input\[type="date"\]\s*\{[^}]*font-size:\s*12px;/s);
});

test("collateral registry actions are primary buttons with requested labels", () => {
  const block = sourceBlock("function renderCollateralsRegistry(", "function renderCollateralRegistryContractsCell(");
  assert.match(block, /class="btn btn-primary" data-action="open-new-collateral-form"[^>]*>Добавить объект залога<\/button>/);
  assert.match(block, /class="btn btn-primary" data-action="open-import-collaterals">Загрузить объекты залога<\/button>/);
  assert.doesNotMatch(block, /class="btn btn-secondary" data-action="open-(?:new-collateral-form|import-collaterals)"/);
});

test("collateral count cells do not append a slash-like chevron", () => {
  const taskCell = sourceBlock("function renderTaskRegistryCollateralCell(", "function getCollateralCardRoute(");
  const taskContext = {
    state: { taskRegistryCollateralDrawer: null },
    escapeHtml: (value) => String(value ?? ""),
    pluralize: () => "объектов"
  };
  vm.runInNewContext(`${taskCell}\nglobalThis.render = renderTaskRegistryCollateralCell;`, taskContext);
  const taskMarkup = taskContext.render({ id: "tsk-31102026-001" }, [{}]);
  assert.doesNotMatch(taskMarkup.replace(/<[^>]+>/g, ""), /\//);
  assert.doesNotMatch(taskMarkup, /collateral-count-icon/);

  const applicationCell = sourceBlock("function renderApplicationCollateralLinks(", "function renderApplicationRegistryCollateralDrawerContent(");
  const applicationContext = {
    state: { applicationRegistryCollateralDrawer: null },
    getApplicationCollaterals: () => [{}],
    escapeHtml: (value) => String(value ?? ""),
    pluralize: () => "залогов"
  };
  vm.runInNewContext(`${applicationCell}\nglobalThis.render = renderApplicationCollateralLinks;`, applicationContext);
  const applicationMarkup = applicationContext.render({ id: "app-31102026-001", number: "app-31102026-001" });
  assert.doesNotMatch(applicationMarkup.replace(/<[^>]+>/g, ""), /\//);
  assert.doesNotMatch(applicationMarkup, /collateral-count-icon/);
});
