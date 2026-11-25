import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function loadColumnHelpers() {
  const start = appSource.indexOf("const TASK_COLLATERAL_COLUMNS =");
  const end = appSource.indexOf("\nfunction renderTaskCollateralObjectsInfo", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const context = {
    preferences: {},
    getVisibleRegistryColumns(columns, scope, partition) {
      assert.equal(scope, "taskCollateralObjects");
      const hidden = new Set(context.preferences[partition] || []);
      const visible = columns.filter(({ key }) => !hidden.has(key));
      return visible.length ? visible : columns.slice(0, 1);
    },
    renderRegistryColumnSettings: (columns, scope, partition) => `${scope}:${partition}:${columns.map(({ key }) => key).join(",")}`
  };
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.helpers = { getTaskCollateralColumns, getTaskCollateralColumnSettingsPartition, getTaskCollateralVisibleColumns, renderTaskCollateralColumnSettings, renderTaskCollateralVisibleCells };`, context);
  return context;
}

test("collateral table settings expose base and context-dependent columns", () => {
  const { helpers } = loadColumnHelpers();
  const base = helpers.getTaskCollateralColumns();
  assert.equal(base.length, 12);
  assert.equal(base[0].key, "number");
  assert.equal(base.at(-1).key, "fairValue");

  const withExclusion = helpers.getTaskCollateralColumns({ showExclusionColumn: true });
  assert.equal(withExclusion.length, 13);
  assert.equal(withExclusion.at(-1).key, "excluded");
  assert.equal(helpers.getTaskCollateralColumnSettingsPartition({ showExclusionColumn: true }), "excluded");

  const withRemove = helpers.getTaskCollateralColumns({ allowApplicationRemove: true });
  assert.equal(withRemove.length, 13);
  assert.equal(withRemove.at(-1).key, "remove");
  assert.equal(helpers.getTaskCollateralColumnSettingsPartition({ allowApplicationRemove: true }), "remove");
});

test("hidden collateral columns are omitted from rendered cells and preferences are respected", () => {
  const context = loadColumnHelpers();
  context.preferences.base = ["address", "marketValue"];
  const { helpers } = context;
  const visible = helpers.getTaskCollateralVisibleColumns();
  assert.equal(visible.some(({ key }) => key === "address"), false);
  assert.equal(visible.some(({ key }) => key === "marketValue"), false);

  const cells = Object.fromEntries(helpers.getTaskCollateralColumns().map(({ key }) => [key, `<td>${key}</td>`]));
  const html = helpers.renderTaskCollateralVisibleCells(visible, cells);
  assert.doesNotMatch(html, /<td>address<\/td>|<td>marketValue<\/td>/);
  assert.match(html, /^<td>number<\/td>/);
  assert.match(html, /<td>fairValue<\/td>$/);
});

test("column menu and visible-column count are shared by headers, data rows, and group rows", () => {
  const componentStart = appSource.indexOf("function renderTaskCollateralObjectsInfo(");
  const componentEnd = appSource.indexOf("\nfunction getLatestCollateralEvaluation", componentStart);
  const groupsStart = appSource.indexOf("function renderTaskCollateralGroupedRows(");
  const groupsEnd = appSource.indexOf("\nfunction buildTaskCollateralGroups", groupsStart);
  const rowStart = appSource.indexOf("function renderTaskCollateralRow(");
  const rowEnd = appSource.indexOf("\nfunction isCollateralExcludedInApplicationTasks", rowStart);
  const componentSource = appSource.slice(componentStart, componentEnd);
  const groupsSource = appSource.slice(groupsStart, groupsEnd);
  const rowSource = appSource.slice(rowStart, rowEnd);

  assert.match(componentSource, /renderTaskCollateralColumnSettings\(\{ showExclusionColumn, allowApplicationRemove \}\)/);
  assert.match(componentSource, /tableColumns\.map\(\(column\) => `<th data-task-collateral-column=/);
  assert.match(componentSource, /columnCount: tableColumns\.length|columnCount, visibleColumns: tableColumns/);
  assert.match(componentSource, /colspan="\$\{columnCount\}"/);
  assert.match(groupsSource, /colspan="\$\{columnCount\}"/);
  assert.match(rowSource, /renderTaskCollateralVisibleCells\(visibleColumns, cells\)/);
  assert.match(appSource, /if \(scope === "taskCollateralObjects"\)/);
  assert.doesNotMatch(stylesSource, /\.task-collateral-info\s+(?:th|td):nth-child/);
  assert.match(stylesSource, /\[data-task-collateral-column="lastInspection"\],[\s\S]*?\[data-task-collateral-column="lastEvaluation"\]\s*\{[^}]*font-size:\s*12px/s);
});

test("column settings use an accessible chevron and compact scrollable checkbox list", () => {
  const start = appSource.indexOf("function renderRegistryColumnSettings(");
  const end = appSource.indexOf("\nfunction reorderRegistryColumns(", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const context = {
    state: { registryColumnSettingsOpen: "taskCollateralObjects-base" },
    escapeHtml: (value) => String(value ?? ""),
    getRegistryColumnPreferenceKey: (scope, partition) => `${scope}-${partition}`,
    getRegistryColumnPreferences: () => ({ hidden: [] }),
    getOrderedRegistryColumns: (columns) => columns
  };
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.render = renderRegistryColumnSettings;`, context);

  const html = context.render([
    { key: "name", label: "Наименование" },
    { key: "type", label: "Вид залога" }
  ], "taskCollateralObjects", "base");
  assert.doesNotMatch(html, />Столбцы</);
  assert.match(html, /aria-label="Настроить отображение столбцов"/);
  assert.match(html, /title="Настроить отображение столбцов"/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /class="registry-column-settings-chevron"/);
  assert.match(html, /class="registry-column-settings-options"[\s\S]*data-registry-column-visibility/);
  assert.match(html, /class="registry-column-settings-menu" id="registry-columns-taskCollateralObjects-base">/);

  const menuStyles = stylesSource.match(/\.task-collateral-column-settings \.registry-column-settings-options > label input\[type="checkbox"\]\s*\{([^}]+)\}/)?.[1] || "";
  assert.match(menuStyles, /width:\s*16px/);
  assert.match(menuStyles, /height:\s*16px/);
  assert.match(menuStyles, /min-height:\s*16px/);
  assert.match(menuStyles, /padding:\s*0/);
  assert.match(stylesSource, /\.task-collateral-column-settings \.registry-column-settings-options\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(stylesSource, /\.registry-column-settings-chevron\s*\{[^}]*display:\s*block/s);
  assert.match(stylesSource, /\.registry-column-settings-toggle\[aria-expanded="true"\] \.registry-column-settings-chevron\s*\{[^}]*rotate\(225deg\)/s);
});
