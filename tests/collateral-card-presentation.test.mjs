import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const basisDocumentSource = appSource.slice(
  appSource.indexOf("function getCollateralBasisDocument(collateral)"),
  appSource.indexOf("function getCollateralTypeDisplayFieldLabels(typeLabel)")
);

function extractBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

test("collateral overview renders type fields, shared fields, basis and address in the requested panels", () => {
  const source = extractBetween("function renderCollateralOverview(collateral)", "function renderCollateralDisplayFieldGrid");
  let typeFields = {};
  const commonFields = Object.fromEntries([
    ["Единица измерения", "Штука"],
    ["Значение, в указанных ед.изм.", "1"],
    ["Дополнительная информация", "На складе"]
  ]);
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    COLLATERAL_CHARACTERISTIC_COMMON_FIELDS: ["Единица измерения", "Значение, в указанных ед.изм.", "Дополнительная информация"],
    getCollateralTypeLabel: (collateral) => collateral.type,
    getCollateralSubtype: () => "",
    getCollateralClientType: (collateral) => collateral.clientType || "",
    getCollateralTypeSpecificFields: () => typeFields,
    getCollateralTypeSpecificValue: (_collateral, label) => typeFields[label],
    getCollateralCadastralFlag: (collateral) => collateral.hasCadastralNumber === true ? "Да" : collateral.hasCadastralNumber === false ? "Нет" : "",
    getNewCollateralProfileSource: () => null,
    getNewCollateralProfileIdentifierType: (draft) => draft.profileIdentifierType || "",
    getNewCollateralCharacteristicTypeFields: (_draft, groups) => groups.typeSpecific,
    getCollateralMainInfoFields: () => commonFields,
    getCollateralAddressFields: () => ({}),
    getNewCollateralFieldGroups: (_typeLabel, draft) => ({ typeSpecific: Object.keys(draft.typeFields), address: [] }),
    isCollateralAddressApplicable: () => true,
    renderCollateralDisplayFieldGrid: (fields, className) => `<div class="${className}">${Object.keys(fields).map((key) => `<span>${key}</span>`).join("")}</div>`,
    renderCollateralAddressView: () => "",
    escapeHtml: (value) => String(value)
  };
  vm.runInNewContext(`${basisDocumentSource}\n${source}\nglobalThis.render = renderCollateralOverview;`, sandbox);
  const scenarios = [
    { type: "Оборудование", fields: { "Подвид залога": "Экскаватор", "Заводской номер": "EX-2025" } },
    { type: "Объекты недвижимости", fields: { "Подвид залога": "Помещения", "Кадастровый номер": "16:50:010101:100", "Условный номер": "УС-100" } },
    { type: "Транспортные средства, прицепы (полуприцепы)", fields: { "Подвид залога": "Залог автотранспортного средства категории В", "Идентификационный номер транспортного средства (VIN)": "XW8ZZZ61ZJG000001" } }
  ];
  const expectedBasis = ["Вид документа-основания", "Дата документа-основания", "Номер документа-основания", "Серия документа-основания"];
  const expectedShared = Object.keys(commonFields);
  for (const scenario of scenarios) {
    typeFields = scenario.fields;
    const html = sandbox.render({ id: "COL-001", type: scenario.type, addressFields: {}, basisDocument: { type: "Выписка ЕГРН", date: "2026-10-20", series: "", number: "ЕГРН-001" } });
    assert.ok(html.indexOf("collateral-overview-type-fields") < html.indexOf("collateral-overview-common-fields"));
    assert.ok(html.indexOf("collateral-overview-common-fields") < html.indexOf("collateral-overview-basis-section"));
    assert.ok(html.indexOf("collateral-overview-basis-section") < html.indexOf("collateral-overview-address-panel"));
    const labels = Array.from(html.matchAll(/<span>([^<]+)<\/span>/g), (match) => match[1]);
    assert.deepEqual(labels, [...Object.keys(scenario.fields), ...expectedShared, ...expectedBasis]);
    assert.match(html, /<h3>Документ-основание<\/h3>/);
    assert.doesNotMatch(html, /collateral-overview-basis-panel/);
    assert.doesNotMatch(html, /Признак группы залога|Номер договора залога|Дата договора залога|Тип обеспечения|Идентификатор в АБС|Признак включения в отчетные данные|Общие атрибуты|Поля по виду залога|Сохранить|8 полей/);
    assert.doesNotMatch(html, /<input|<select|<textarea|data-collateral-overview-field/);
  }
  assert.doesNotMatch(source, /Для выбранного вида залога типовые поля не предусмотрены\./);
  typeFields = {};
  const emptyTypeFieldsHtml = sandbox.render({
    id: "COL-EMPTY",
    type: "Животные",
    fields: {},
    addressFields: {},
    basisDocument: {}
  });
  assert.match(emptyTypeFieldsHtml, /collateral-overview-common-fields/);
  assert.doesNotMatch(emptyTypeFieldsHtml, /Для выбранного вида залога типовые поля не предусмотрены\.|collateral-overview-type-fields/);
  assert.doesNotMatch(appSource, /saveCollateralOverview|save-collateral-overview|updateCollateralOverviewField/);
});

test("control event detail fields use the same read-only field component as general information", () => {
  const inspection = extractBetween("function renderLastInspectionPanel(collateral)", "function normalizeInspectionTypeForCollateralCard");
  const valuation = extractBetween("function renderLatestValuationPanel(collateral, note = \"\")", "function formatExplicitCollateralFairValue");
  assert.match(inspection, /renderCollateralDisplayFieldGrid\(/);
  assert.match(valuation, /renderCollateralDisplayFieldGrid\(/);
  assert.match(inspection, /collateral-control-info-fields/);
  assert.match(valuation, /collateral-control-info-fields/);
  assert.match(appSource, /function renderCollateralReadOnlyField[\s\S]*?renderCollateralFieldShell\(/);
  assert.match(appSource, /function renderNewCollateralField[\s\S]*?return renderCollateralFieldShell\(/);
  assert.match(stylesSource, /\.new-collateral-fields\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(stylesSource, /\.new-collateral-field\.is-readonly input:disabled[\s\S]*?background:\s*#fff;/);
});

test("collateral control tab omits the separate inspection-provided panel", () => {
  const tabSource = extractBetween("function renderCollateralControlEvents(collateral)", "function getLatestInspectionScheduleItem");
  assert.doesNotMatch(tabSource, /renderCollateralInspectionProvidedPanel|Осмотр проведен/);
  assert.match(tabSource, /renderLastInspectionPanel\(collateral\)/);
  assert.match(tabSource, /renderLatestValuationPanel\(collateral/);
  assert.match(tabSource, /renderCollateralUnifiedControlSchedule\(collateral\)/);
  assert.doesNotMatch(stylesSource, /collateral-inspection-provided-panel|collateral-inspection-provided-fields/);
});

test("collateral change history combines user and source into one column", () => {
  const historyRenderer = extractBetween("function renderCollateralHistory(collateral)", "function getNewTaskDraftContext");
  const sandbox = {
    escapeHtml: (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  };
  vm.runInNewContext(`${historyRenderer}\nglobalThis.render = renderCollateralHistory;`, sandbox);
  const html = sandbox.render({ history: [
    { date: "2026-11-10", user: "Иван Петров", source: "АРМ пользователя", field: "Статус", oldValue: "Новый", newValue: "В залоге", reason: "Регистрация" },
    { date: "2026-11-09", user: "Система", source: "АБС", field: "Проверка", oldValue: "Ожидает", newValue: "Выполнена", reason: "Синхронизация" },
    { date: "2026-11-08", user: "Иван Петров", source: "Иван Петров", field: "Адрес", oldValue: "-", newValue: "Новосибирск", reason: "Уточнение" },
    { date: "2026-11-07", user: "Мария Соколова", source: "", field: "Документ", oldValue: "-", newValue: "Паспорт", reason: "Загрузка" },
    { date: "2026-11-06", user: "", source: "", field: "Проверка", oldValue: "-", newValue: "-", reason: "" },
    { date: "2026-11-05", user: "<img src=x>", source: "<em>АБС</em>", field: "Источник", oldValue: "-", newValue: "-", reason: "Проверка экранирования" }
  ] });
  const headers = Array.from(html.matchAll(/<th>(.*?)<\/th>/g), (match) => match[1]);
  assert.deepEqual(headers, ["Дата", "Пользователь / источник", "Поле", "Было", "Стало", "Основание"]);
  assert.match(html, /Иван Петров \/ АРМ пользователя/);
  assert.match(html, /Система \/ АБС/);
  assert.equal((html.match(/Иван Петров/g) || []).length, 2, "matching user and source are rendered once");
  assert.match(html, /<td>Мария Соколова<\/td>/);
  const rows = Array.from(html.matchAll(/<tr>(.*?)<\/tr>/gs), (match) => match[1]);
  const actorCell = (row) => row.match(/<td>.*?<\/td><td>(.*?)<\/td>/)?.[1];
  assert.equal(actorCell(rows[5]), "-", "an empty user/source pair has a placeholder");
  assert.equal(actorCell(rows[6]), "&lt;img src=x&gt; / &lt;em&gt;АБС&lt;/em&gt;");
  assert.doesNotMatch(html, /<img src=x>|<em>АБС/);

  const taskHistory = extractBetween("function renderTaskHistory(task)", "function formatLatestTaskHistoryEvent");
  const taskHeaders = Array.from(taskHistory.matchAll(/<th>(.*?)<\/th>/g), (match) => match[1]);
  assert.deepEqual(taskHeaders, ["Дата", "Действие", "Пользователь", "Статус", "Было", "Стало", "Комментарий"]);
});

test("collateral header uses the latest completed valuation task for the collateral", () => {
  const source = extractBetween("function getCollateralLatestCompletedTaskFairValue(collateral)", "function renderTaskCollateralGroupSummary");
  const sandbox = {
    state: { data: { tasks: [
      { id: "older", type: "Единичная переоценка", status: "Завершена", collateralIds: ["COL-1"], fair: 100, history: [{ date: "2026-10-20", status: "Завершена" }] },
      { id: "newer", type: "Единичная оценка", status: "Завершена", collateralIds: ["COL-1"], fair: 300, history: [{ date: "2026-10-25", status: "Завершена" }] },
      { id: "open", type: "Единичная оценка", status: "В работе", collateralIds: ["COL-1"], fair: 900, history: [{ date: "2026-11-01" }] },
      { id: "other", type: "Единичная оценка", status: "Завершена", collateralIds: ["COL-2"], fair: 600, history: [{ date: "2026-10-30", status: "Завершена" }] }
    ] } },
    isTaskClosed: (task) => task.status === "Завершена",
    getTaskCollateralIds: (task) => task.collateralIds,
    getLatestCollateralEvaluation: () => ({}),
    getEvaluationFairValue: () => 50,
    isListRevaluationTaskType: () => false,
    getMarketAnalogMatrix: () => ({}),
    getMvp1SingleRevaluationCalculation: (_collateral, _matrix, task) => ({ fairValue: task.fair })
  };
  vm.runInNewContext(`${source}\nglobalThis.getFairValue = getCollateralLatestCompletedTaskFairValue;`, sandbox);
  assert.equal(sandbox.getFairValue({ id: "COL-1" }), 300);
  sandbox.state.data.tasks = [];
  assert.equal(sandbox.getFairValue({ id: "COL-1" }), 50, "legacy evaluation value remains the fallback");
  assert.match(appSource, /<span class="collateral-header-fair-value"><strong>Справедливая стоимость<\/strong>\$\{formatMoney\(fairValue\)\}<\/span>/);
});

test("collateral card reuses disabled form controls with the same field shell", () => {
  const shell = extractBetween("function renderCollateralFieldShell", "function renderCollateralAddressView");
  const formField = extractBetween("function renderNewCollateralField(label, group, value, draft, options = [], { readOnly = false, wide = false, fieldClass = \"\", inputTypeOverride = \"\", derived = false } = {})", "function renderNewCollateralPrivateHouse");
  const requiredFieldSource = extractBetween("function isNewCollateralRequiredTypeField", "function normalizeNewCollateralDate");
  const sandbox = {
    escapeHtml: (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    getCollateralTypeCodeFromLabel: (value) => value,
    getCollateralEditableOptions: (_collateral, group) => group === "type" ? ["Энергетическое оборудование", "Иное"] : [],
    getNewCollateralValidationFieldError: () => "",
    getCollateralEditableInputType: (label) => label === "Дополнительная информация" ? "textarea" : "text",
    getNewCollateralFieldMaxLength: () => 0,
    getNewCollateralProfileIdentifier: () => "",
    isCollateralCheckboxField: () => false,
    isAffirmativeValue: (value) => value === "Да",
    getNewCollateralSubtypeField: () => "Подвид залога"
  };
  vm.runInNewContext(`${shell}\n${requiredFieldSource}\n${formField}\nglobalThis.render = renderNewCollateralField;`, sandbox);
  const draft = { typeLabel: "Оборудование", typeFields: {}, addressFields: {} };
  const textField = sandbox.render("Заводской номер", "type", "EQ-01", draft, [], { readOnly: true });
  const selectField = sandbox.render("Группа", "type", "Энергетическое оборудование", draft, [], { readOnly: true });
  const textareaField = sandbox.render("Дополнительная информация", "main", "На складе", draft, [], { readOnly: true });
  for (const html of [textField, selectField, textareaField]) {
    assert.match(html, /class="new-collateral-field [^"]*is-readonly/);
    assert.match(html, /disabled aria-readonly="true"/);
    assert.doesNotMatch(html, /data-new-collateral-field=/);
  }
  assert.match(selectField, /<select disabled aria-readonly="true"[\s\S]*selected/);
  assert.match(textareaField, /<textarea disabled aria-readonly="true"/);
});

test("collateral card escapes user-provided markup in read-only fields", () => {
  const renderer = extractBetween("function renderCollateralDisplayFieldGrid", "function renderCollateralAddressView");
  const sandbox = {
    escapeHtml: (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"),
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    getCollateralEditableInputType: (label) => label === "Дополнительная информация" ? "textarea" : "text"
  };
  vm.runInNewContext(`${renderer}\nglobalThis.render = renderCollateralDisplayFieldGrid;`, sandbox);
  const html = sandbox.render({ "Дополнительная информация": "<img src=x onerror=alert(1)>" });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /new-collateral-readonly-control is-multiline/);
});

test("legacy collateral read-only grid escapes values unless a field is explicitly trusted", () => {
  const renderer = extractBetween("function renderReadonlyFieldGrid(items", "function getCollateralTypeLabel(collateral)");
  const sandbox = {
    escapeHtml: (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"),
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-"
  };
  vm.runInNewContext(`${renderer}\nglobalThis.render = renderReadonlyFieldGrid;`, sandbox);
  const html = sandbox.render({
    "Дополнительная информация": "<img src=x onerror=alert(1)>",
    "Задача оценки": '<button class="link">tsk-001</button>'
  }, ["Задача оценки"]);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /<button class="link">tsk-001<\/button>/);
});

test("card address reuses the add-form layout with a read-only mode switch", () => {
  const addressSource = extractBetween("function renderCollateralAddressView(collateral, fields)", "function isCollateralResidentialAddress");
  const addressTemplateSource = extractBetween("function renderNewCollateralPrivateHouse", "function getNewCollateralFieldMaxLength");
  const sandbox = {
    isTruthyFlag: (value) => value === true || value === "Да",
    isAffirmativeValue: (value) => value === true || value === "Да",
    getCollateralTypeLabel: (collateral) => collateral.type,
    getCollateralClientType: () => "ЮЛ",
    getCollateralSubtype: () => "",
    getCollateralTypeSpecificFields: () => ({}),
    getNewCollateralFieldGroups: () => ({ address: ["Адрес / место нахождения", "Город"] }),
    renderNewCollateralField: (label, _group, value, _draft, _options, { readOnly } = {}) => `<div class="new-collateral-field ${readOnly ? "is-readonly" : ""}"><span>${label}</span><input value="${value}" ${readOnly ? 'disabled aria-readonly="true"' : ""}></div>`,
    getCollateralTypeCodeFromLabel: (value) => value,
    getCollateralEditableOptions: () => [],
    getNewCollateralValidationFieldError: () => "",
    getCollateralEditableInputType: () => "text",
    getNewCollateralFieldMaxLength: () => 0,
    getNewCollateralProfileIdentifier: () => "",
    isCollateralCheckboxField: () => false,
    getNewCollateralSubtypeField: () => "",
    escapeHtml: (value) => String(value),
    isNewCollateralResidentialDraft: () => false,
    renderCollateralDisplayFieldGrid: (fields, className) => `<div class="${className}">${Object.keys(fields).join("")}</div>`
  };
  vm.runInNewContext(`${extractBetween("function renderCollateralFieldShell", "function renderCollateralAddressView")}\n${addressTemplateSource}\n${addressSource}\nglobalThis.render = renderCollateralAddressView;`, sandbox);
  const html = sandbox.render({ id: "COL-001", type: "Оборудование", address: "г. Казань", addressFields: { manualEntry: "Нет" } }, { "Адрес / место нахождения": "г. Казань", "Город": "Казань" });
  assert.match(html, /new-collateral-address-summary-row/);
  assert.match(html, /role="switch" aria-label="Ввести вручную" disabled aria-readonly="true"/);
  assert.match(html, /disabled aria-readonly="true"/);
  assert.doesNotMatch(html, /data-new-collateral-field=|data-new-collateral-address-toggle/);
  assert.match(addressSource, /renderNewCollateralAddress\(fieldDraft, getNewCollateralFieldGroups\(fieldDraft.typeLabel, fieldDraft\), \{ readOnly: true \}\)/);
});

test("add/edit modal address toggle uses matching switch presentation", () => {
  const addressSource = extractBetween("function renderNewCollateralAddress(draft, groups,", "function getNewCollateralFieldMaxLength");
  assert.match(addressSource, /new-collateral-address-summary-row[\s\S]*renderNewCollateralField\("Адрес \/ место нахождения"[\s\S]*role="switch" aria-label="Ввести вручную"/);
  assert.match(stylesSource, /\.new-collateral-address-summary-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(stylesSource, /\.new-collateral-address-toggle input\s*\{[\s\S]*width:\s*36px;[\s\S]*opacity:\s*0;/);
});

test("legacy document basis category is displayed in singular form", () => {
  const normalization = extractBetween("function normalizeDocumentTypeLabel(type = \"\")", "function getDocumentTargetIds");
  const folderTitle = extractBetween("function getDocumentFolderTitle(doc)", "function getDocumentRecordTitle");
  const recordTitle = extractBetween("function getDocumentRecordTitle(doc, name)", "function getDocumentWidgetRules");
  const sandbox = {};
  vm.runInNewContext(`${normalization}\n${folderTitle}\n${recordTitle}\nglobalThis.renderFolder = getDocumentFolderTitle; globalThis.renderRecord = getDocumentRecordTitle;`, sandbox);
  assert.equal(sandbox.renderFolder({ title: "Документы-основания" }), "Документ-основание");
  assert.equal(sandbox.renderRecord({ title: "Документы-основания" }, "Договор.pdf"), "Документ-основание");
});
