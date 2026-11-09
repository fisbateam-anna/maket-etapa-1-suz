import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function extractBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const pledgeEntrySource = extractBetween(appSource, "function getCollateralPledgeContractEntries(collateral)", "\nfunction getCollateralApplicationPledgeContractAssociations");
const applicationAssociationSource = extractBetween(appSource, "function getCollateralApplicationPledgeContractAssociations(collateral)", "\nfunction getCollateralContractTableRows(collateral)");
const pledgeLinkSource = extractBetween(appSource, "function normalizeApplicationPledgeContractLinks(value = [])", "\nfunction normalizeApplicationDealRow");
const pledgeOptionsSource = extractBetween(appSource, "function getApplicationPledgeContractOptions(collaterals = [])", "\nfunction getApplicationPledgeContractLinksForSave");
const pledgeSaveSource = extractBetween(appSource, "function getApplicationPledgeContractLinksForSave(value, options = [])", "\nfunction syncApplicationDealLegacyFields");
const selectedPledgeKeysSource = extractBetween(appSource, "function getApplicationPledgeContractSelectedKeys(value, options = [])", "\nfunction normalizeApplicationDealsForSave");

function createPledgeHelpersContext(overrides = {}) {
  return {
    uniqueItems: (items) => [...new Set(items)],
    getCollateralObjectIdentifier: (collateral) => collateral?.profileIdentifier || collateral?.id || "",
    getCollateralTypeLabel: (collateral) => collateral?.type || "",
    formatDocumentDateCell: (value) => value,
    escapeHtml,
    ...overrides
  };
}

test("application pledge choices keep identical agreements separate by collateral", () => {
  const sandbox = createPledgeHelpersContext();
  vm.runInNewContext(`${pledgeEntrySource}\n${pledgeLinkSource}\n${pledgeOptionsSource}\nglobalThis.options = getApplicationPledgeContractOptions;`, sandbox);
  const collaterals = [
    { id: "COL-1", type: "Оборудование", profileIdentifier: "EQ-01", pledgeContracts: [{ number: "ZL-26/10", date: "2026-10-01" }] },
    { id: "COL-2", type: "Оборудование", profileIdentifier: "EQ-02", pledgeContracts: [{ number: "ZL-26/10", date: "2026-10-01" }, { number: "ZL-26/11", date: "2026-10-02" }] },
    { id: "COL-3", type: "Недвижимость", profileIdentifier: "77:01:01:1", pledgeContracts: [] }
  ];
  const options = sandbox.options(collaterals);
  assert.equal(options.length, 3);
  const firstAgreement = options.filter((option) => option.number === "ZL-26/10");
  assert.equal(firstAgreement.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(firstAgreement[0].collateralIds)), ["COL-1"]);
  assert.deepEqual(JSON.parse(JSON.stringify(firstAgreement[1].collateralIds)), ["COL-2"]);
  assert.notEqual(firstAgreement[0].key, firstAgreement[1].key);
  assert.match(firstAgreement[0].label, /EQ-01/);
  assert.doesNotMatch(firstAgreement[0].label, /EQ-02/);
  assert.match(firstAgreement[1].label, /EQ-02/);
  assert.doesNotMatch(firstAgreement[1].label, /EQ-01/);
  const expandedOptions = sandbox.options([...collaterals, { id: "COL-4", type: "Машина", profileIdentifier: "VIN-04", pledgeContracts: [{ number: "ZL-26/10", date: "2026-10-01" }] }]);
  assert.equal(expandedOptions.find((option) => option.collateralIds[0] === "COL-1").key, firstAgreement[0].key);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.options([collaterals[2]]))), []);
});

test("pledge agreement links remain in application deal rows and are trimmed to selected collateral", () => {
  const context = createPledgeHelpersContext({
    getContract: () => null,
    getContractByNumber: () => null,
    parseNumericInput: (value) => Number(String(value || "").replace(/\s/g, "")) || 0,
    normalizeApplicationDealProduct: (value) => value || "",
    getDealContractDate: (row) => row.contractDate || "",
    parseListValue: () => []
  });
  const normalizeDealSource = extractBetween(appSource, "function normalizeApplicationDealRow(row = {}, index = 0)", "\nfunction getApplicationDealRows(application)");
  const saveSource = extractBetween(appSource, "function getApplicationPledgeContractLinksForSave(value, options = [])", "\nfunction syncApplicationDealLegacyFields");
  vm.runInNewContext(`${pledgeLinkSource}\n${normalizeDealSource}\n${saveSource}\nglobalThis.normalizeDeal = normalizeApplicationDealRow; globalThis.trimLinks = getApplicationPledgeContractLinksForSave; globalThis.normalizeDealsForSave = normalizeApplicationDealsForSave;`, context);
  const stored = context.normalizeDeal({
    contractNumber: "CR-26/7",
    pledgeContractLinks: [{ number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1", "COL-2"] }]
  });
  assert.deepEqual(JSON.parse(JSON.stringify(stored.pledgeContractLinks)), [
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1", "COL-2"] }
  ]);
  const options = [
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1"] },
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-2"] }
  ];
  const trimmed = context.trimLinks(stored.pledgeContractLinks, options);
  assert.deepEqual(JSON.parse(JSON.stringify(trimmed)), [
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1"] },
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-2"] }
  ]);
  const deals = context.normalizeDealsForSave([stored], "ООО Клиент", "7700000001", options);
  assert.equal(deals.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(deals[0].pledgeContractLinks)), [
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1"] },
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-2"] }
  ]);
});

test("previously grouped selections remain selected as separate collateral options", () => {
  const sandbox = createPledgeHelpersContext();
  vm.runInNewContext(`${pledgeLinkSource}\n${selectedPledgeKeysSource}\nglobalThis.selectedKeys = getApplicationPledgeContractSelectedKeys;`, sandbox);
  const options = [
    { key: "option-1", number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1"] },
    { key: "option-2", number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-2"] },
    { key: "option-3", number: "ZL-26/11", date: "2026-10-02", collateralIds: ["COL-2"] }
  ];
  const keys = sandbox.selectedKeys([
    { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1", "COL-2"] }
  ], options);
  assert.deepEqual([...keys], ["option-1", "option-2"]);
});

test("application deal table appends the pledge selector and preserves multi-selection", () => {
  const pickerSource = extractBetween(appSource, "function renderApplicationDealPledgeContractPicker(row, index, collaterals)", "\nfunction renderApplicationDealsTable");
  const tableSource = extractBetween(appSource, "function renderApplicationDealsTable(rows, selectedCollaterals, contractOptions, productOptions)", "\nfunction getApplicationPreInspection");
  const option = { number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1"], key: '["zl-26/10","2026-10-01",["COL-1"]]', label: "Договор залога № ZL-26/10 от 2026-10-01 — EQ-01 · Оборудование" };
  const sandbox = {
    APPLICATION_DEAL_COLUMNS: ["Продукт", "Номер договора", "Дата договора", "Сумма/лимит сделки", "Валюта сделки"],
    getApplicationPledgeContractOptions: () => [option],
    normalizeApplicationPledgeContractLinks: (links) => links || [],
    getApplicationPledgeContractLinkKey: (link) => JSON.stringify([link.number.toLowerCase(), link.date, link.collateralIds]),
    formatDocumentDateCell: (value) => value,
    escapeHtml,
    renderApplicationDealProductOptions: (value) => `<option>${value}</option>`,
    getDocumentDateInputValue: (value) => value || "",
    renderCurrencyOptions: (value) => `<option>${value}</option>`,
    renderApplicationDealPledgeContractPicker: null
  };
  vm.runInNewContext(`${selectedPledgeKeysSource}\n${pickerSource}\n${tableSource}\nglobalThis.renderPicker = renderApplicationDealPledgeContractPicker; globalThis.renderTable = renderApplicationDealsTable;`, sandbox);
  const selectedRow = { pledgeContractLinks: [{ number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1"] }] };
  const picker = sandbox.renderPicker(selectedRow, 0, [{ id: "COL-1" }]);
  assert.match(picker, /data-application-deal-field="pledgeContractLinks"[^>]*checked/);
  assert.match(picker, /<summary>№ ZL-26\/10 от 2026-10-01<\/summary>/);
  const table = sandbox.renderTable([selectedRow], [{ id: "COL-1" }], "", "");
  assert.ok(table.indexOf("Валюта сделки") < table.indexOf("Договор залога"));
  assert.match(table, /data-application-deal-field="pledgeContractLinks"/);
  assert.match(table, /data-action="remove-application-deal"/);
});

test("collateral contract table resolves pledge links from the saved application deals", () => {
  const rowsSource = extractBetween(appSource, "function getCollateralContractTableRows(collateral)", "\nfunction renderCollateralContracts(collateral)");
  const deal = {
    id: "deal-1",
    contractId: "CREDIT-1",
    contractNumber: "CR-26/7",
    contractDate: "2026-09-25",
    product: "Кредит",
    limit: 2500000,
    currency: "RUB",
    pledgeContractLinks: [{ number: "ZL-26/10", date: "2026-10-01", collateralIds: ["COL-1"] }]
  };
  const contract = { id: "CREDIT-1", number: "CR-26/7", startDate: "2026-09-25", product: "Кредит", limit: 2500000, currency: "RUB" };
  const sandbox = createPledgeHelpersContext({
    state: { data: { applications: [{ id: "APP-1", deals: [deal] }] } },
    getApplicationDealRows: (application) => application.deals,
    getApplicationDealContract: () => contract,
    getCollateralRelatedContracts: () => [],
    getContractByNumber: () => null,
    normalizeCollateralContractProduct: (value) => value || ""
  });
  vm.runInNewContext(`${pledgeEntrySource}\n${pledgeLinkSource}\n${applicationAssociationSource}\n${rowsSource}\nglobalThis.rows = getCollateralContractTableRows;`, sandbox);
  const rows = sandbox.rows({ id: "COL-1", pledgeContracts: [{ number: "ZL-26/10", date: "2026-10-01" }] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].creditContractNumber, "CR-26/7");
  assert.equal(rows[0].pledgeContractNumber, "ZL-26/10");
  assert.equal(rows[0].product, "Кредит");
  const otherCollateralRows = sandbox.rows({ id: "COL-2", pledgeContracts: [{ number: "ZL-26/10", date: "2026-10-01" }] });
  assert.ok(otherCollateralRows.every((row) => row.creditContractNumber !== "CR-26/7"));
});

test("application object block precedes deals, contact stripe is local, and task deal table stays unchanged", () => {
  const applicationRender = extractBetween(appSource, "function renderApplicationCreate(query, options = {})", "\nfunction renderTaskCreate(query)");
  const taskDeals = extractBetween(appSource, "function renderTaskApplicationDealsTable(rows, taskCollaterals = [])", "\nfunction renderTaskApplicationContractsCompactList");
  assert.ok(applicationRender.indexOf("renderApplicationCollateralObjectsInfo(draftTask") < applicationRender.indexOf("renderApplicationDealsTable(dealRows"));
  assert.match(stylesSource, /\.task-create-layout \.application-contacts-panel::before\s*\{\s*display:\s*none;/);
  assert.doesNotMatch(taskDeals, /Договор залога/);
});
