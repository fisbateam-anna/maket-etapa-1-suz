import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("task application-deal table mirrors application columns and stays readonly", () => {
  const start = app.indexOf("function renderTaskApplicationContractsReadOnlyTable(rows = [])");
  const end = app.indexOf("\nfunction renderTaskClientContractInfo", start);
  assert.ok(start >= 0 && end > start);
  const context = {
    APPLICATION_DEAL_COLUMNS: ["Продукт", "Номер договора", "Дата договора", "Сумма/лимит сделки", "Валюта сделки"],
    normalizeApplicationPledgeContractLinks: (value = []) => value || [],
    normalizeApplicationDealProduct: (value) => value || "",
    formatDocumentDateCell: (value) => value || "-",
    formatDealLimit: (value) => value ? Number(value).toLocaleString("ru-RU") : "-",
    escapeHtml: (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  };
  vm.runInNewContext(`${app.slice(start, end)}\nglobalThis.render = renderTaskApplicationContractsReadOnlyTable;`, context);
  const html = context.render([{
    product: "Кредит",
    contractNumber: "CR-26/140",
    contractDate: "12.10.2026",
    limit: 12500000,
    currency: "RUB",
    pledgeContractLinks: [{ number: "ZL-26/44", date: "08.10.2026", collateralIds: ["COL-1"] }]
  }]);

  assert.equal((html.match(/<th>/g) || []).length, 6);
  for (const column of ["Продукт", "Номер договора", "Дата договора", "Сумма/лимит сделки", "Валюта сделки", "Договор залога"]) {
    assert.ok(html.includes(`<th>${column}</th>`), `Missing column ${column}`);
  }
  assert.match(html, /<td>CR-26\/140<\/td>\s*<td>12\.10\.2026<\/td>/, "contract number and date should use separate columns");
  assert.match(html, /<td>12\s?500\s?000<\/td>\s*<td>RUB<\/td>/, "amount and currency should use separate columns");
  assert.match(html, /ZL-26\/44 от 08\.10\.2026/, "pledge contract number and date should be displayed together");
  assert.match(html, /class="task-deals-inline"/);
  assert.doesNotMatch(html, /<input|<select|<button/);
  assert.match(context.render([]), /Договоры по заявке не указаны/);
});

test("application collateral table headers use regular weight and parameter labels use dark text", () => {
  assert.match(styles, /\.task-collateral-panel \.task-collateral-table-wrap thead th\s*\{\s*font-weight:\s*400;/);
  assert.match(styles, /\.application-form-group-parameters label\s*\{\s*color:\s*#334155;/);
  assert.match(styles, /\.task-deals-inline-table\s*\{\s*width:\s*100%;\s*min-width:\s*1080px;/);
  assert.doesNotMatch(styles, /\.task-deals-inline-table th:nth-child\(\d\),\s*\.task-deals-inline-table td:nth-child\(\d\)/);
});
