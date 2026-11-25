import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function latestRuleWith(selector, property) {
  const token = `${selector} {`;
  let start = -1;
  let result = "";
  while ((start = styles.indexOf(token, start + 1)) !== -1) {
    const end = styles.indexOf("}", start);
    const rule = styles.slice(start, end);
    if (rule.includes(`${property}:`)) result = rule;
  }
  assert.notEqual(result, "", `Missing CSS rule for ${selector} with ${property}`);
  return result;
}

test("task origin fields have no horizontal rules and use compact vertical spacing", () => {
  const originRow = latestRuleWith(".task-main-origin-row", "gap");
  const originFields = latestRuleWith(".task-main-origin-row .task-info-field", "min-height");

  assert.match(originRow, /gap:\s*12px;/);
  assert.match(originRow, /padding:\s*0;/);
  assert.match(originRow, /border:\s*0;/);
  assert.doesNotMatch(originRow, /border-top:\s*1px/);
  assert.match(originFields, /min-height:\s*34px;/);
  assert.match(originFields, /padding:\s*2px 0;/);
  assert.match(originFields, /border:\s*0;/);

  const rendererStart = app.indexOf("function renderTaskMainInfo(task, collaterals = getTaskCollaterals(task))");
  const rendererEnd = app.indexOf("\nfunction getTaskApplicationDealRows", rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);
  assert.match(renderer, /renderTaskInfoField\("Источник создания"/);
  assert.match(renderer, /renderTaskInfoField\("Родительский объект"/);
  assert.match(renderer, /renderTaskInfoField\("Комментарий постановщика"/);
  assert.equal((renderer.match(/renderTaskInfoField\("Источник создания"/g) || []).length, 1);
  assert.equal((renderer.match(/renderTaskInfoField\("Родительский объект"/g) || []).length, 1);
  assert.equal((renderer.match(/renderTaskInfoField\("Комментарий постановщика"/g) || []).length, 1);
  assert.ok(renderer.indexOf('renderTaskInfoField("Источник создания"') < renderer.indexOf('renderTaskInfoField("Родительский объект"'));
  assert.ok(renderer.indexOf('renderTaskInfoField("Родительский объект"') < renderer.indexOf('renderTaskInfoField("Комментарий постановщика"'));
});

test("blue accent stripes appear only over task collateral and inspection sections", () => {
  const inspectionStart = app.indexOf("function renderTaskMainInspectionContactsGroup(task, collateral)");
  const inspectionEnd = app.indexOf("\nfunction renderTaskMainContactPersonsBlock", inspectionStart);
  const inspectionRenderer = app.slice(inspectionStart, inspectionEnd);
  assert.match(inspectionRenderer, /task-main-inspection-contacts-group/);

  const emptyCollateral = app.slice(app.indexOf("function renderTaskCollateralContext(task, collaterals, activeCollateral)"), app.indexOf("function renderTaskCollateralObjectsInfo", app.indexOf("function renderTaskCollateralContext(task, collaterals, activeCollateral)")));
  assert.match(emptyCollateral, /sourceTask:\s*task/);
  assert.match(emptyCollateral, /headerActions:\s*renderTaskCollateralActions/);
  const collateralRenderer = app.slice(app.indexOf("function renderTaskCollateralObjectsInfo(task, collaterals, activeCollateral, options = {})"), app.indexOf("\nfunction getLatestCollateralEvaluation", app.indexOf("function renderTaskCollateralObjectsInfo(task, collaterals, activeCollateral, options = {})")));
  assert.match(collateralRenderer, /options\.sourceTask \? "task-main-section-stripe" : ""/);

  assert.match(styles, /\.task-main-section-stripe,\s*\.task-tab-main \.task-main-inspection-contacts-group\s*\{[^}]*position:\s*relative;/s);
  const stripe = styles.match(/\.task-main-section-stripe::before,\s*\.task-tab-main \.task-main-inspection-contacts-group::before\s*\{([^}]*)\}/s)?.[1] || "";
  assert.notEqual(stripe, "", "Missing accent stripe styles");
  assert.match(stripe, /height:\s*3px;/);
  assert.match(stripe, /background:\s*var\(--accent\);/);
  assert.match(stripe, /pointer-events:\s*none;/);
  assert.doesNotMatch(stripe, /overflow/);
  assert.match(styles, /\.task-collateral-info\.table-panel,[\s\S]*?overflow-x:\s*auto;/s);
});

test("collateral stripe is rendered for task cards with zero or many objects, but not application context", () => {
  const contextStart = app.indexOf("function renderTaskCollateralContext(task, collaterals, activeCollateral)");
  const contextEnd = app.indexOf("\nfunction getLatestCollateralEvaluation", contextStart);
  const rendererSource = app.slice(contextStart, contextEnd);
  const context = {
    escapeHtml: (value) => String(value ?? ""),
    getVisibleRegistryColumns: (columns) => columns,
    renderRegistryColumnSettings: () => "",
    isTaskCollateralExcluded: () => false,
    canMarkTaskCollateralExcluded: () => false,
    buildTaskCollateralGroups: () => [],
    isTaskCollateralGroupExpanded: () => false,
    renderTaskCollateralGroupedRows: () => "<tr></tr>",
    pluralize: () => "объект"
  };
  runInNewContext(
    `${rendererSource}
     globalThis.renderTaskContext = renderTaskCollateralContext;
     globalThis.renderCollateralPanel = renderTaskCollateralObjectsInfo;`,
    context
  );

  const emptyTaskPanel = context.renderTaskContext({ id: "task-1" }, [], null);
  const populatedTaskPanel = context.renderTaskContext({ id: "task-1" }, [{ id: "COL-1" }], { id: "COL-1" });
  const applicationPanel = context.renderCollateralPanel(
    { id: "draft-1" },
    [{ id: "COL-1" }],
    { id: "COL-1" },
    { selectable: false }
  );

  assert.match(emptyTaskPanel, /task-collateral-panel[^\"]*task-main-section-stripe/);
  assert.match(populatedTaskPanel, /task-collateral-info task-main-section-stripe/);
  assert.doesNotMatch(applicationPanel, /task-main-section-stripe/);
});
