import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function getFunctionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Function ${name} exists`);
  const next = app.indexOf("\nfunction ", start + 1);
  return app.slice(start, next === -1 ? app.length : next);
}

const runtime = vm.createContext({ Date });
vm.runInContext([
  "getDateTimeSortValue",
  "formatRegistryDateTime",
  "formatHistoryDisplayValue",
  "isDateTimeDisplayLabel",
  "formatDocumentDateCell",
  "formatContactCallDateValue",
  "getTaskCollateralPledgeContractText"
].map(getFunctionSource).join("\n") + `
  globalThis.format = formatRegistryDateTime;
  globalThis.formatDocument = formatDocumentDateCell;
  globalThis.formatContactDate = formatContactCallDateValue;
  globalThis.pledgeContract = getTaskCollateralPledgeContractText;
`, runtime);

test("date-only values use DD.MM.YYYY", () => {
  assert.equal(runtime.format("2026-10-16"), "16.10.2026");
  assert.equal(runtime.format("16.10.2026"), "16.10.2026");
});

test("date-time values always include seconds", () => {
  assert.equal(runtime.format("2026-10-16 12:13"), "16.10.2026 12:13:00");
  assert.equal(runtime.format("2026-10-16T12:13:14"), "16.10.2026 12:13:14");
  assert.equal(runtime.format("16.10.2026 12:13"), "16.10.2026 12:13:00");
});

test("task and collateral history values format date-only and date-time changes", () => {
  const context = vm.createContext({
    Date,
    escapeHtml: (value) => String(value ?? "")
  });
  vm.runInContext([
    getFunctionSource("getDateTimeSortValue"),
    getFunctionSource("formatRegistryDateTime"),
    getFunctionSource("formatHistoryDisplayValue"),
    getFunctionSource("renderTaskHistoryTableRow"),
    getFunctionSource("getTaskHistoryValueText")
  ].join("\n") + `
    globalThis.renderHistoryRow = renderTaskHistoryTableRow;
    globalThis.historyValueText = getTaskHistoryValueText;
  `, context);

  const row = context.renderHistoryRow({
    date: "2026-10-16T12:13:14",
    oldValue: "2026-10-15",
    newValue: "2026-10-16 12:13"
  });
  assert.match(row, /<td>15\.10\.2026<\/td>/);
  assert.match(row, /<td>16\.10\.2026 12:13:00<\/td>/);
  assert.equal(context.historyValueText("До", "2026-10-15"), "До: 15.10.2026");
  assert.equal(context.historyValueText("До", "2026-10-15 12:13"), "До: 15.10.2026 12:13:00");
});

test("document and contact date formatters share the same output rules", () => {
  assert.equal(runtime.formatDocument("2026-10-16"), "16.10.2026");
  assert.equal(runtime.formatDocument("2026-10-16T12:13:14", true), "16.10.2026 12:13:14");
  assert.equal(runtime.formatContactDate("2026-10-16T12:13:14"), "16.10.2026 12:13:14");
});

test("pledge contract date follows the FT display format", () => {
  assert.equal(
    runtime.pledgeContract({ encumbrances: [{ number: "ZL-26/150-001", date: "2026-10-16" }] }),
    "ZL-26/150-001 от 16.10.2026"
  );
});

test("read-only application, task, registry and history renderers use the shared formatter", () => {
  for (const name of [
    "renderInfoGrid",
    "renderTaskInfoField",
    "renderTaskField",
    "renderApplicationLinkedTasksTable",
    "renderTaskHistoryTableRow",
    "renderCollateralContracts",
    "renderCollateralHistory",
    "renderInsurancePoliciesRegistry",
    "renderCollateralRiskRules",
    "getCollateralExternalSourceDetail",
    "renderExternalAttributeCard",
    "renderReports",
    "printField"
  ]) {
    assert.match(getFunctionSource(name), /formatRegistryDateTime|formatHistoryDisplayValue|formatDocumentDateCell|isDateTimeDisplayLabel/, name);
  }
});

test("date inputs and filters keep ISO values while readonly task dates use display format", () => {
  const context = vm.createContext({
    state: { filters: { tasks: { createdFrom: "2026-10-01", createdTo: "2026-10-16" } } },
    escapeHtml: (value) => String(value ?? "")
  });
  vm.runInContext([
    getFunctionSource("getDateOnly"),
    getFunctionSource("renderTaskField"),
    getFunctionSource("filterDateRange"),
    getFunctionSource("getDocumentDateInputValue"),
    getFunctionSource("getDateTimeSortValue"),
    getFunctionSource("formatRegistryDateTime")
  ].join("\n") + `
    globalThis.renderTaskDate = (field) => renderTaskField(field);
    globalThis.renderFilter = () => filterDateRange("tasks", "createdFrom", "createdTo", "Дата создания");
    globalThis.getDocumentDateInputValue = getDocumentDateInputValue;
  `, context);

  const editable = context.renderTaskDate({ label: "Дата осмотра", type: "date", value: "2026-10-16" });
  const readonly = context.renderTaskDate({ label: "Дата создания", type: "date", value: "2026-10-16", readonly: true });
  const filter = context.renderFilter();
  assert.match(editable, /type="date" value="2026-10-16"/);
  assert.match(readonly, /type="text" value="16\.10\.2026" readonly/);
  assert.match(filter, /type="date" value="2026-10-01"/);
  assert.match(filter, /type="date" value="2026-10-16"/);
  assert.equal(context.getDocumentDateInputValue("16.10.2026"), "2026-10-16");
});
