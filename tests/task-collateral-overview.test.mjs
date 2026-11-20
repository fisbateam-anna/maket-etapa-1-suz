import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function extractFunction(startMarker, endMarker, context, exportName) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing function marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.result = ${exportName};`, context);
  return context.result;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

test("task collateral table uses pledge number, required columns and exclusion at the end", () => {
  const tableSource = appSource.slice(
    appSource.indexOf("function renderTaskCollateralObjectsInfo"),
    appSource.indexOf("\nfunction getLatestCollateralEvaluation", appSource.indexOf("function renderTaskCollateralObjectsInfo"))
  );
  assert.doesNotMatch(tableSource, /Раскройте группу вида залога|<p class="hint">/);
  assert.match(tableSource, /<h2 class="shared-component-title">Информация по объектам залога<\/h2>/);
  const labels = [
    "Номер залога", "Идентификатор залога", "Подвид залога", "Наименование залога", "Адрес объекта",
    "Договор залога", "Дата последнего осмотра", "Дата последней оценки", "Ликвидность",
    "Залоговая стоимость", "Рыночная стоимость", "Справедливая стоимость"
  ];
  let previous = -1;
  for (const label of labels) {
    const position = tableSource.indexOf(`<th>${label}</th>`);
    assert.ok(position > previous, `${label} is present in the required order`);
    previous = position;
  }
  assert.doesNotMatch(tableSource, /<th>Залогодатель<\/th>/);
  assert.match(tableSource, /showExclusionColumn \? "<th>Исключен<\/th>" : ""/);
  assert.match(tableSource, /allowApplicationRemove \? '<th><span class="visually-hidden">Действия<\/span><\/th>' : ""/);
  assert.match(tableSource, /\(showExclusionColumn \? 13 : 12\) \+ \(allowApplicationRemove \? 1 : 0\)/);

  const rowContext = {
    escapeHtml,
    getContract: () => null,
    getLatestCollateralEvaluation: () => ({ market: 20, pledge: 15, date: "2026-10-12" }),
    getEvaluationFairValue: () => 12,
    getCollateralSuzNumber: () => "ZLG-2026-1042",
    getLatestInspectionScheduleItem: () => ({ date: "2026-10-10" }),
    getCollateralRegistryLatestAppraisalDate: () => "2026-10-12",
    hasNegativeCollateralCheckResult: () => true,
    getTaskCollateralCardRoute: () => "/app/collaterals/COL-1",
    getCollateralSubtype: () => "Квартира",
    getCollateralObjectIdentifier: () => "77:01:0001:42",
    getCollateralName: () => "Квартира на улице Мира",
    getCollateralRegistryAddress: () => "Новосибирск, ул. Мира, 10",
    getTaskCollateralPledgeContractText: () => "PL-2026-1 от 2026-10-01",
    formatFullMoney: (value) => Number(value).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    getCollateralLiquidity: () => "Высокая",
    formatShortMoney: (value) => String(value),
    formatRegistryDateTime: (value) => value,
    isTaskCollateralExcluded: () => false
  };
  const renderRow = extractFunction("function renderTaskCollateralRow", "\nfunction canMarkTaskCollateralExcluded", rowContext, "renderTaskCollateralRow");
  const html = renderRow({ id: "TSK-1" }, { id: "COL-1" }, null, { canMarkExcluded: true, showExclusionColumn: true, selectable: false });
  assert.match(html, /ZLG-2026-1042/);
  assert.match(html, /class="[^"]*has-negative-check-result/);
  assert.ok(html.indexOf("Дата") === -1, "date cells contain values, not duplicate labels");
  assert.ok(html.indexOf("77:01:0001:42") < html.indexOf("Квартира"));
  assert.ok(html.indexOf("PL-2026-1 от 2026-10-01") < html.indexOf("2026-10-10"));
  assert.ok(html.includes("15,00"));
  assert.ok(html.includes("20,00"));
  assert.ok(html.includes("12,00"));
  assert.ok(html.indexOf("2026-10-10") < html.indexOf("2026-10-12"));
  assert.ok(html.indexOf("2026-10-12") < html.indexOf("Высокая"));
  assert.ok(html.lastIndexOf("task-collateral-excluded-cell") > html.lastIndexOf("task-collateral-money"));
  assert.doesNotMatch(html, /COL-1<\/button>|Имущество залогодателя|Залогодатель/);

  const singleObjectHtml = renderRow({ id: "TSK-1" }, { id: "COL-1" }, null, { canMarkExcluded: false, showExclusionColumn: true });
  assert.match(singleObjectHtml, /task-collateral-excluded-cell/);
  assert.match(singleObjectHtml, /type="checkbox"[^>]*disabled/);
});

test("full money and pledge-contract formatters retain precision and date", () => {
  const moneyContext = {};
  const formatFullMoney = extractFunction("function formatFullMoney", "\nfunction getContractDebtRub", moneyContext, "formatFullMoney");
  assert.equal(formatFullMoney(1000000), "1 000 000,00");
  assert.equal(formatFullMoney(1250000.5), "1 250 000,50");
  assert.equal(formatFullMoney(""), "-");

  const pledgeContext = { formatDocumentDateCell: (value) => String(value).slice(0, 10) };
  const formatPledgeContract = extractFunction("function getTaskCollateralPledgeContractText", "\nfunction renderTaskSpecificBlocks", pledgeContext, "getTaskCollateralPledgeContractText");
  assert.equal(formatPledgeContract({ encumbrances: [{ number: "ZL-26/52", date: "2026-10-08T00:00:00" }] }), "ZL-26/52 от 2026-10-08");
  assert.equal(formatPledgeContract({ encumbrances: [] }), "-");
});

test("task collateral columns keep their content readable and active marker is scoped away from documents", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const documentsRenderer = appSource.slice(
    appSource.indexOf("function renderDocumentWidget"),
    appSource.indexOf("\nfunction getDocumentFilterKey", appSource.indexOf("function renderDocumentWidget"))
  );
  const collateralRenderer = appSource.slice(
    appSource.indexOf("function renderTaskCollateralObjectsInfo"),
    appSource.indexOf("\nfunction getLatestCollateralEvaluation", appSource.indexOf("function renderTaskCollateralObjectsInfo"))
  );
  const collateralRowRenderer = appSource.slice(
    appSource.indexOf("function renderTaskCollateralRow"),
    appSource.indexOf("\nfunction canMarkTaskCollateralExcluded", appSource.indexOf("function renderTaskCollateralRow"))
  );
  assert.doesNotMatch(documentsRenderer, /Активный залог/);
  assert.match(collateralRenderer, /task-active-collateral-badge/);
  assert.match(collateralRowRenderer, /class="link task-collateral-cell task-collateral-number"/);
  assert.match(styles, /\.task-collateral-info \.task-collateral-cell\s*\{[^}]*overflow:\s*visible;[^}]*overflow-wrap:\s*anywhere;/s);
  assert.match(styles, /\.task-collateral-info \.task-collateral-number\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*box-sizing:\s*border-box;/s);
  assert.match(styles, /\.task-active-collateral-badge\s*\{/);
});

test("only explicitly negative checks on real estate and vehicles mark the collateral row", () => {
  const context = {
    isRealEstateCollateralType: (type) => /недвиж/i.test(type),
    isAutoVehicleCollateralType: (type) => /транспорт/i.test(type),
    isSelfPropelledCollateralType: (type) => /самоход/i.test(type),
    getCollateralObjectCheckRows: (_task, collateral) => collateral.checkRows || []
  };
  const source = appSource.slice(
    appSource.indexOf("function isObjectCheckFailedStatus"),
    appSource.indexOf("\nfunction isObjectCheckControlStatus", appSource.indexOf("function isObjectCheckFailedStatus"))
  );
  vm.runInNewContext(`${source}\nglobalThis.isNegative = hasNegativeCollateralCheckResult;`, context);
  assert.equal(context.isNegative({ type: "Объекты недвижимости", checkRows: [{ status: "Не пройдена" }] }), true);
  assert.equal(context.isNegative({ type: "Транспортные средства", checkRows: [{ status: "Пройдена", result: "Право собственности не подтверждено" }] }), true);
  assert.equal(context.isNegative({ type: "Объекты недвижимости", checkRows: [{ status: "Пройдена", result: "Аресты и ограничения не выявлены" }] }), false);
  assert.equal(context.isNegative({ type: "Объекты недвижимости", checkRows: [{ status: "Пройдена", result: "Аресты не выявлены, но запрет установлен" }] }), true);
  assert.equal(context.isNegative({ type: "Оборудование", checkRows: [{ status: "Не пройдена" }] }), false);
});

test("task main tab groups inspection and contacts above documents for every task type", async () => {
  const tabSource = appSource.slice(
    appSource.indexOf("function renderTaskCardTabContent"),
    appSource.indexOf("\nfunction getTaskDisplayType", appSource.indexOf("function renderTaskCardTabContent"))
  );
  assert.ok(tabSource.indexOf("renderTaskCollateralContext(task, collaterals, collateral)") < tabSource.indexOf("renderTaskMainInspectionContactsGroup(task, collateral)"));
  assert.ok(tabSource.indexOf("renderTaskMainInspectionContactsGroup(task, collateral)") < tabSource.indexOf("renderTaskDocumentsPanel(task, collaterals, collateral)"));
  assert.ok(tabSource.indexOf("renderTaskDocumentsPanel(task, collaterals, collateral)") < tabSource.indexOf("renderTaskMainAdditionalBlocks(task, collateral, collaterals)"));

  const groupSource = appSource.slice(
    appSource.indexOf("function renderTaskMainInspectionContactsGroup"),
    appSource.indexOf("\nfunction renderTaskMainContactPersonsBlock", appSource.indexOf("function renderTaskMainInspectionContactsGroup"))
  );
  assert.match(groupSource, /class="panel application-form-group application-form-group-inspection-contacts task-main-inspection-contacts-group"/);
  assert.ok(groupSource.indexOf("renderTaskApplicationPreInspectionBlock(task)") < groupSource.indexOf("renderTaskMainContactPersonsBlock(task, collateral)"));
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.task-main-inspection-contacts-group\s*\{[^}]*display:\s*grid;[^}]*padding:\s*18px;/s);
  assert.match(styles, /\.task-main-inspection-contacts-group > \.inspection-contacts-panel\s*\{[^}]*background:\s*transparent;[^}]*border:\s*0;/s);
  assert.match(styles, /\.application-form-group-inspection-contacts \.inspection-contacts-panel[^}]*border-top:\s*1px solid var\(--line\);/s);

  const additionalBlocksSource = appSource.slice(
    appSource.indexOf("function renderTaskMainAdditionalBlocks"),
    appSource.indexOf("\nfunction getTaskDisplayType", appSource.indexOf("function renderTaskMainAdditionalBlocks"))
  );
  assert.match(additionalBlocksSource, /isInspectionCardTaskType\(task\?\.type\) \|\| isDefectInspectionTaskType\(task\?\.type\)/);
  assert.match(additionalBlocksSource, /return renderTaskGeneralBlocks\(task, collateral, collaterals\)/);

  const readOnlyContext = {
    escapeHtml,
    getApplicabilityOptions: () => [{ value: "application::", label: "Вся заявка" }]
  };
  const renderBlock = extractFunction("function renderApplicationPreInspectionBlock", "\nfunction renderTaskApplicationPreInspectionBlock", readOnlyContext, "renderApplicationPreInspectionBlock");
  const html = renderBlock({ completed: true, mobileAppraiserLink: "https://mobile.example/visit/42", actFile: "Акт.pdf" }, { readOnly: true });
  assert.match(html, /Проведенный выездной осмотр/);
  assert.match(html, /type="checkbox"[^>]* disabled checked/);
  assert.match(html, /value="https:\/\/mobile\.example\/visit\/42"[^>]*readonly/);
  assert.match(html, /<span>Применяется к<\/span>/);
  assert.match(html, /<option value="application::" selected>Вся заявка<\/option>/);
  assert.match(html, /<select[^>]*disabled/);
  assert.match(html, /Акт\.pdf/);
  assert.doesNotMatch(html, /type="file"|data-new-task-field/);
  assert.doesNotMatch(html, /data-action="add-application-preinspection-row"|data-action="remove-application-preinspection-row"/);
});

test("common task contacts render for every task family without duplicating inspection contacts", () => {
  const context = {
    isInspectionCardTaskType: (type) => type === "Первичный осмотр" || type === "Плановый мониторинг",
    isDefectInspectionTaskType: (type) => type === "Дефектовка",
    renderTaskContactsWithoutActiveCollateral: (task) => `empty-context:${task.type}`,
    renderInspectionContactsBlock: (task, collateral) => `${task.type}:${collateral.id}`
  };
  const renderContacts = extractFunction(
    "function renderTaskMainContactPersonsBlock",
    "\nfunction renderTaskContactsWithoutActiveCollateral",
    context,
    "renderTaskMainContactPersonsBlock"
  );

  assert.equal(renderContacts({ type: "Единичная переоценка" }, { id: "COL-1" }), "Единичная переоценка:COL-1");
  assert.equal(renderContacts({ type: "Регистрация залога" }, { id: "COL-2" }), "Регистрация залога:COL-2");
  assert.equal(renderContacts({ type: "Первичный осмотр" }, { id: "COL-3" }), "Первичный осмотр:COL-3");
  assert.equal(renderContacts({ type: "Дефектовка" }, { id: "COL-4" }), "Дефектовка:COL-4");
  assert.equal(renderContacts({ type: "Первичный осмотр" }, null), "empty-context:Первичный осмотр");
  assert.equal(renderContacts({ type: "Единичная переоценка" }, null), "empty-context:Единичная переоценка");
});

test("without an active collateral the task contacts block shows only application- or task-bound contacts", () => {
  const application = { id: "APP-1" };
  const task = { id: "TSK-1" };
  const contacts = [
    { role: "Инициатор", name: "Анна Иванова", phone: "+7 900 000-00-01", applyScope: "application", applyValue: "" },
    { role: "Исполнитель", name: "Петр Петров", phone: "+7 900 000-00-02", applyScope: "task", applyValue: "TSK-1" },
    { role: "Контакт объекта", name: "Не показывать COL-1", applyScope: "collateral", applyValue: "COL-1" },
    { role: "Контакт другой задачи", name: "Не показывать TSK-2", applyScope: "task", applyValue: "TSK-2" }
  ];
  const context = {
    escapeHtml,
    getTaskApplication: () => application,
    getApplicationCollaterals: () => [{ id: "COL-1" }],
    getApplicationContactRows: () => contacts,
    normalizeApplicationContactRow: (contact) => contact,
    formatContactCallDateValue: (value) => value
  };
  context.doesApplicationContactApplyToTarget = extractFunction(
    "function doesApplicationContactApplyToTarget",
    "\nfunction addApplicationContactRow",
    context,
    "doesApplicationContactApplyToTarget"
  );
  context.renderContactPersonsBlock = extractFunction(
    "function renderContactPersonsBlock",
    "\nfunction renderContactPersonEditableCells",
    context,
    "renderContactPersonsBlock"
  );
  const renderEmptyContext = extractFunction(
    "function renderTaskContactsWithoutActiveCollateral",
    "\nfunction getTaskDisplayType",
    context,
    "renderTaskContactsWithoutActiveCollateral"
  );
  const html = renderEmptyContext(task);

  assert.match(html, /Контактные лица/);
  assert.match(html, /Анна Иванова/);
  assert.match(html, /Петр Петров/);
  assert.doesNotMatch(html, /Не показывать COL-1|Не показывать TSK-2/);
  assert.doesNotMatch(html, /<input|<textarea|<button/);
});

test("task main tab keeps the pre-inspection block visible when no result applies", () => {
  const tabSource = appSource.slice(
    appSource.indexOf("function renderTaskCardTabContent"),
    appSource.indexOf("\nfunction getTaskDisplayType", appSource.indexOf("function renderTaskCardTabContent"))
  );
  assert.ok(tabSource.indexOf("renderTaskMainInspectionContactsGroup(task, collateral)") < tabSource.indexOf("renderTaskDocumentsPanel(task, collaterals, collateral)"));

  const context = {
    escapeHtml,
    getApplicabilityOptions: () => [{ value: "application::", label: "Вся заявка" }],
    createApplicationPreInspectionRow: () => ({
      completed: false,
      applyScope: "application",
      applyValue: "",
      mobileAppraiserLink: "",
      actFile: ""
    }),
    getTaskApplicationPreInspections: () => [],
    getTaskApplication: () => ({ id: "APP-1" }),
    getTaskCollaterals: () => []
  };
  context.renderApplicationPreInspectionBlock = extractFunction(
    "function renderApplicationPreInspectionBlock",
    "\nfunction renderTaskApplicationPreInspectionBlock",
    context,
    "renderApplicationPreInspectionBlock"
  );
  const renderTaskBlock = extractFunction(
    "function renderTaskApplicationPreInspectionBlock",
    "\nfunction attachApplicationInspectionAct",
    context,
    "renderTaskApplicationPreInspectionBlock"
  );
  const html = renderTaskBlock({ id: "tsk-1" });

  assert.match(html, /Проведенный выездной осмотр/);
  assert.match(html, /Осмотр произведен/);
  assert.match(html, /Применяется к/);
  assert.match(html, /Ссылка на мобильный оценщик/);
  assert.match(html, /Акт осмотра/);
  assert.match(html, /<option value="application::" selected>Вся заявка<\/option>/);
  assert.match(html, /type="checkbox"[^>]* disabled/);
  assert.doesNotMatch(html, /data-action="add-application-preinspection-row"|data-action="remove-application-preinspection-row"/);
});
