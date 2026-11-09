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

function createSortHelpers(state = {}) {
  const dateParser = getSourceBlock("function getDateTimeSortValue(", "\nfunction matchesNumericRange");
  const sortHelpers = getSourceBlock("function compareRegistrySortValues(", "\nfunction renderRegistrySortHeader");
  const context = { state, window: { scrollY: 0, scrollX: 0 }, resetRegistryPagination() {} };
  vm.runInNewContext(`${dateParser}\n${sortHelpers}\nglobalThis.compare = compareRegistrySortValues; globalThis.sortRows = sortRegistryRows;`, context);
  return context;
}

test("registry sorting compares numeric and date values and keeps empty values last", () => {
  const helpers = createSortHelpers();
  assert.equal(helpers.compare("9", "12", "number", "asc"), -1);
  assert.equal(helpers.compare("12", "9", "number", "desc"), -1);
  assert.equal(helpers.compare("2026-10-30", "2026-10-29", "date", "desc"), -1);
  assert.equal(helpers.compare("", "2026-10-29", "date", "asc"), 1);
  assert.equal(helpers.compare("-", "2026-10-29", "text", "desc"), 1);
});

test("overdue tasks stay first regardless of direction while values sort within each group", () => {
  const helpers = createSortHelpers();
  const sort = (direction) => helpers.sortRows([
    { id: "future", days: 5 },
    { id: "overdue-old", days: -128 },
    { id: "today", days: 0 },
    { id: "overdue-recent", days: -2 }
  ], [{ key: "days", sortType: "overdue-first-number", sortValue: (row) => row.days }], [{ key: "days", direction }]);

  assert.deepEqual(Array.from(sort("asc"), (row) => row.id), ["overdue-old", "overdue-recent", "today", "future"]);
  assert.deepEqual(Array.from(sort("desc"), (row) => row.id), ["overdue-recent", "overdue-old", "future", "today"]);
  assert.equal(helpers.compare(-128, 5, "overdue-first-number", "desc"), -1);
  assert.equal(helpers.compare(null, -128, "overdue-first-number", "asc"), 1);
});

test("task remaining term uses the current local calendar date and FT display values", () => {
  const block = getSourceBlock("function getTaskRegistryRemainingDays(", "function getTaskRegistryExpertComment(");
  const context = {
    getDateOnly(value) {
      const text = String(value || "");
      const iso = text.match(/\d{4}-\d{2}-\d{2}/);
      if (iso) return iso[0];
      const ru = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      return ru ? `${ru[3]}-${ru[2]}-${ru[1]}` : "";
    }
  };
  vm.runInNewContext(`${block}\nglobalThis.days = getTaskRegistryRemainingDays; globalThis.term = getTaskRegistryRemainingTerm; globalThis.tone = getTaskRegistryRemainingTermTone;`, context);
  const today = new Date(2026, 9, 30, 12);

  assert.equal(context.days({ dueDate: "2026-06-24" }, today), -128);
  assert.equal(context.days({ dueDate: "2026-10-30" }, today), 0);
  assert.equal(context.days({ dueDate: "2026-10-31" }, today), 1);
  assert.equal(context.days({ dueDate: "" }, today), null);
  assert.equal(context.term({ dueDate: "2026-06-24" }, today), "Просрочена");
  assert.equal(context.term({ dueDate: "2026-10-30" }, today), "Осталось 0 дней");
  assert.equal(context.term({ dueDate: "2026-10-31" }, today), "Осталось 1 день");
  assert.equal(context.tone({ dueDate: "2026-06-24" }, today), "danger");
  assert.equal(context.tone({ dueDate: "" }, today), "neutral");
});

test("date range filters render date-only controls and normalize legacy datetime values", () => {
  const dateHelpers = getSourceBlock("function getDateOnly(", "\nfunction getDateTimeSortValue(");
  const block = getSourceBlock("function filterDateRange(", "\nfunction filterSelect(");
  const context = {
    state: { filters: { applications: { createdFrom: "2026-10-30 12:34:56", createdTo: "2026-10-31T23:59:59" } } },
    escapeHtml: (value) => String(value ?? "")
  };
  vm.runInNewContext(`${dateHelpers}\n${block}\nglobalThis.renderRange = filterDateRange; globalThis.matches = matchesDateOnlyRange;`, context);
  const markup = context.renderRange("applications", "createdFrom", "createdTo", "Дата создания");
  assert.match(markup, /type="date" value="2026-10-30"/);
  assert.match(markup, /type="date" value="2026-10-31"/);
  assert.doesNotMatch(markup, /datetime-local|12:34:56|23:59:59/);
  assert.equal(context.matches("2026-10-30T23:59:59", "2026-10-30", "2026-10-31"), true);
  assert.equal(context.matches("2026-10-31T23:59:59", "2026-10-30", "2026-10-31"), true);
  assert.equal(context.matches("2026-11-01T00:00:00", "2026-10-30", "2026-10-31"), false);
  assert.equal(context.matches("2026-10-30T23:59:59", "2026-10-30T08:00:00", "2026-10-30T12:00:00"), true);
});

test("registry sorting supports stable multi-column ordering", () => {
  const helpers = createSortHelpers();
  const rows = [
    { id: "first", total: 5, client: "Вега" },
    { id: "second", total: 5, client: "Альфа" },
    { id: "third", total: 2, client: "Омега" },
    { id: "fourth", total: 5, client: "Альфа" },
    { id: "empty", total: null, client: "Альфа" }
  ];
  const columns = [
    { key: "total", sortType: "number", sortValue: (row) => row.total },
    { key: "client", sortType: "text", sortValue: (row) => row.client }
  ];
  const result = helpers.sortRows(rows, columns, [
    { key: "total", direction: "desc" },
    { key: "client", direction: "asc" }
  ]);
  assert.deepEqual(Array.from(result, (row) => row.id), ["second", "fourth", "first", "third", "empty"]);
});

test("registry sort state toggles a primary key and adds Shift-selected levels", () => {
  const state = { registrySorts: { applications: [{ key: "createdAt", direction: "desc" }] }, pendingScrollRestore: null };
  const helpers = createSortHelpers(state);
  const update = getSourceBlock("function getRegistrySortEntries(", "\nfunction compareRegistrySortValues");
  vm.runInNewContext(`${update}\nglobalThis.update = updateRegistrySort;`, helpers);

  helpers.update("applications", "", "type", false);
  assert.deepEqual(Array.from(state.registrySorts.applications, (item) => [item.key, item.direction]), [["type", "asc"]]);
  helpers.update("applications", "", "createdAt", true);
  assert.deepEqual(Array.from(state.registrySorts.applications, (item) => [item.key, item.direction]), [["type", "asc"], ["createdAt", "asc"]]);
  helpers.update("applications", "", "createdAt", true);
  assert.deepEqual(Array.from(state.registrySorts.applications, (item) => [item.key, item.direction]), [["type", "asc"], ["createdAt", "desc"]]);
  helpers.update("applications", "", "type", false);
  assert.deepEqual(Array.from(state.registrySorts.applications, (item) => [item.key, item.direction]), [["type", "desc"]]);
});

test("all registries define the FT newest-first default sort", () => {
  assert.match(appSource, /tasks:\s*\{\s*evaluation:\s*\[\{\s*key:\s*"createdAt",\s*direction:\s*"desc"\s*\}\],\s*inspection:\s*\[\{\s*key:\s*"createdAt",\s*direction:\s*"desc"\s*\}\],\s*registration:\s*\[\{\s*key:\s*"createdAt",\s*direction:\s*"desc"\s*\}\]/s);
  assert.match(appSource, /applications:\s*\[\{\s*key:\s*"createdAt",\s*direction:\s*"desc"\s*\}\]/);
  assert.match(appSource, /collaterals:\s*\[\{\s*key:\s*"createdAt",\s*direction:\s*"desc"\s*\}\]/);
});
