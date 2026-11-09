import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function extractFunction(source, startMarker, endMarker, sandbox) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing function marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.result = ${sandbox.exportName};`, sandbox.context);
  return sandbox.context.result;
}

const filterLabels = [
  ["type", "Вид залога"],
  ["profileIdentifier", "Профильный идентификатор"],
  ["name", "Наименование"],
  ["pledgeContractNumber", "Номер договора залога"],
  ["pledgorName", "Наименование Залогодателя"],
  ["pledgorInn", "ИНН Залогодателя"]
];

function createPickerContext(overrides = {}) {
  const { state: stateOverrides = {}, ...helperOverrides } = overrides;
  return {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    state: {
      modal: { type: "collateralPicker", context: "application", search: "" },
      filters: { collateralPicker: Object.fromEntries(filterLabels.map(([key]) => [key, ""])) },
      newTask: { selectedCollateralIds: [] },
      data: { collaterals: [] },
      ...stateOverrides
    },
    APPLICATION_COLLATERAL_PICKER_FILTERS: filterLabels,
    getCollateralTypeLabel: (item) => item.type,
    getCollateralObjectIdentifier: (item) => item.profileIdentifier || "",
    getCollateralName: (item) => item.name || item.description || item.id,
    matches: (value, filter) => String(value ?? "").toLocaleLowerCase("ru-RU").includes(String(filter).toLocaleLowerCase("ru-RU").trim()),
    escapeHtml: (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"),
    ...helperOverrides
  };
}

test("application collateral actions require opening the picker and enable editing only for a selected row", () => {
  const context = {
    state: { newTask: { applicationSelectedCollateralId: "" } },
    escapeHtml: (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;")
  };
  const renderActions = extractFunction(
    appSource,
    "function renderApplicationCollateralActions(collaterals = [], allowEdit = true)",
    "\nfunction renderApplicationCollateralObjectsInfo",
    { context, exportName: "renderApplicationCollateralActions" }
  );
  const html = renderActions();
  assert.equal((html.match(/data-action="open-collateral-registry-picker"/g) || []).length, 1);
  assert.match(html, /data-context="application"/);
  assert.match(html, /data-action="edit-application-collateral" disabled/);
  assert.doesNotMatch(html, /data-action="open-new-collateral-form"/);
  assert.match(html, /Загрузить объекты из таблицы/);
  context.state.newTask.applicationSelectedCollateralId = "COL-1";
  assert.match(renderActions([{ id: "COL-1" }]), /data-action="edit-application-collateral" data-collateral="COL-1"/);
});

test("application picker exposes the six requested filters and matching table columns", () => {
  const sample = {
    id: "COL-TEST-1",
    type: "Оборудование",
    profileIdentifier: "EQ-TEST-1",
    name: "Прессовая линия",
    encumbrances: [{ number: "ZL-26/501-1" }],
    clientName: "ООО Завод",
    clientId: "7701234567"
  };
  const context = createPickerContext({ state: { data: { collaterals: [sample] } } });
  const renderPicker = extractFunction(
    appSource,
    "function getCollateralPickerValues(collateral)",
    "\nfunction renderNewCollateralModal",
    { context, exportName: "renderCollateralRegistryPickerModal" }
  );
  const html = renderPicker();
  assert.match(html, /Задайте параметры поиска/);
  assert.doesNotMatch(html, /data-modal-collateral-choice="COL-TEST-1"/);
  assert.doesNotMatch(html, /data-action="open-new-collateral-from-picker"/);
  context.state.filters.collateralPicker.pledgeContractNumber = "ZL-26/501";
  const searchedHtml = renderPicker();
  filterLabels.forEach(([key, label]) => {
    assert.match(searchedHtml, new RegExp(`data-filter-name="${key}"`));
    assert.match(searchedHtml, new RegExp(`>${label}<input`));
  });
  filterLabels.forEach(([, label]) => assert.match(searchedHtml, new RegExp(`<th>${label}</th>`)));
  assert.match(searchedHtml, /EQ-TEST-1/);
  assert.match(searchedHtml, /ZL-26\/501-1/);
  assert.match(searchedHtml, /ООО Завод/);
  assert.match(searchedHtml, /7701234567/);
  assert.doesNotMatch(searchedHtml, /Признак группы залога|Залоговая стоимость|<th>ID<\/th>|<th>Риск<\/th>/);
});

test("application picker filters independently, searches pledge contract numbers and offers new collateral only after a no-match search", () => {
  const fixtures = [
    { id: "COL-1", type: "Оборудование", profileIdentifier: "EQ-1", name: "Пресс", pledgeContractNumber: "ZL-26/101-1", clientName: "ООО Альфа", clientId: "7700000001" },
    { id: "COL-2", type: "Недвижимость", profileIdentifier: "77:01:0001", name: "Склад", pledgeContractNumber: "ZL-26/102-1", clientName: "ООО Бета", clientId: "7700000002" }
  ];
  const context = createPickerContext({ state: { data: { collaterals: fixtures } } });
  const renderPicker = extractFunction(
    appSource,
    "function getCollateralPickerValues(collateral)",
    "\nfunction renderNewCollateralModal",
    { context, exportName: "renderCollateralRegistryPickerModal" }
  );

  let html = renderPicker();
  assert.match(html, /data-action="submit-collateral-picker"/);
  assert.doesNotMatch(html, /data-action="open-new-collateral-from-picker"/);

  const filterValues = {
    type: "Оборудование",
    profileIdentifier: "EQ-1",
    name: "Пресс",
    pledgeContractNumber: "ZL-26/101",
    pledgorName: "ООО Альфа",
    pledgorInn: "7700000001"
  };
  for (const [key, value] of Object.entries(filterValues)) {
    context.state.filters.collateralPicker = Object.fromEntries(filterLabels.map(([filterKey]) => [filterKey, ""]));
    context.state.filters.collateralPicker[key] = value;
    html = renderPicker();
    assert.match(html, /COL-1/, `Filter ${key} must find the matching row`);
    assert.doesNotMatch(html, /COL-2/, `Filter ${key} must exclude the other row`);
  }

  context.state.filters.collateralPicker = Object.fromEntries(filterLabels.map(([key]) => [key, ""]));
  context.state.filters.collateralPicker.pledgorInn = "9999999999";
  html = renderPicker();
  assert.match(html, /объекты залога не найдены/i);
  assert.match(html, /data-action="open-new-collateral-from-picker"/);
  assert.match(html, /data-action="submit-collateral-picker"/);
  const applicationObjectsSource = appSource.slice(
    appSource.indexOf("function renderApplicationCollateralObjectsInfo"),
    appSource.indexOf("\nfunction renderApplicationDealsTable")
  );
  assert.match(applicationObjectsSource, /Выберите объект залога или загрузите объекты из таблицы/);
  assert.doesNotMatch(applicationObjectsSource, /добавьте новый объект/i);
});

test("checked application collateral survives filtering to zero and opening the new-object form", () => {
  const context = createPickerContext({
    state: {
      data: { collaterals: [{ id: "COL-1", type: "Оборудование", profileIdentifier: "EQ-1", name: "Пресс", pledgeContractNumber: "ZL-26/101-1", clientName: "ООО Альфа", clientId: "7700000001" }] },
      taskActiveCollateral: {}
    }
  });
  context.document = { querySelectorAll: () => [] };
  context.hydrateNewTaskContextFromSelectedCollaterals = () => {};

  const updateSelection = extractFunction(
    appSource,
    "function updateCollateralPickerSelection(modal, collateralId, checked)",
    "\nfunction getCollateralPickerValues",
    { context, exportName: "updateCollateralPickerSelection" }
  );
  updateSelection(context.state.modal, "COL-1", true);

  context.state.filters.collateralPicker.pledgeContractNumber = "NO-MATCH";
  const renderPicker = extractFunction(
    appSource,
    "function getCollateralPickerValues(collateral)",
    "\nfunction renderNewCollateralModal",
    { context, exportName: "renderCollateralRegistryPickerModal" }
  );
  const html = renderPicker();
  assert.match(html, /data-action="open-new-collateral-from-picker"/);
  assert.doesNotMatch(html, /data-modal-collateral-choice="COL-1"/);

  const mergeSelection = extractFunction(
    appSource,
    "function mergeCollateralPickerSelection()",
    "\nfunction submitCollateralPicker",
    { context, exportName: "mergeCollateralPickerSelection" }
  );
  assert.deepEqual(Array.from(mergeSelection()), ["COL-1"]);
  assert.deepEqual(Array.from(context.state.newTask.selectedCollateralIds), ["COL-1"]);
});

test("task collateral picker keeps its existing search and columns", () => {
  const context = createPickerContext({
    state: {
      modal: { type: "collateralPicker", context: "taskCreate", search: "" },
      data: { collaterals: [] }
    }
  });
  const renderPicker = extractFunction(
    appSource,
    "function getCollateralPickerValues(collateral)",
    "\nfunction renderNewCollateralModal",
    { context, exportName: "renderCollateralRegistryPickerModal" }
  );
  const html = renderPicker();
  assert.match(html, /data-modal-collateral-search/);
  assert.match(html, /договору залога/i);
  assert.match(html, /<th>ID<\/th>/);
  assert.match(html, /<th>Залоговая стоимость<\/th>/);
  assert.doesNotMatch(html, /data-action="open-new-collateral-from-picker"/);
});
