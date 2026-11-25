import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { getNextMonthlyTaskNumber } from "../src/object-numbering.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function sourceBlock(start, end) {
  const startIndex = appSource.indexOf(start);
  const endIndex = appSource.indexOf(end, startIndex);
  assert.notEqual(startIndex, -1, `Missing source start: ${start}`);
  assert.notEqual(endIndex, -1, `Missing source end: ${end}`);
  return appSource.slice(startIndex, endIndex);
}

function assertInOrder(source, values) {
  let previous = -1;
  for (const value of values) {
    const index = source.indexOf(value);
    assert.ok(index > previous, `Expected '${value}' after the preceding field`);
    previous = index;
  }
}

test("application create and card render four visual groups without page subtitle", () => {
  const renderer = sourceBlock("function renderApplicationCreate(query, options = {})", "\nfunction renderTaskCreate(query)");
  assert.match(renderer, /if \(!isCard\) state\.newTask\.applicationStatus = "Черновик";/);
  assert.match(renderer, /const applicationStatus = state\.newTask\.applicationStatus \|\| \(isCard \? "Новая" : "Черновик"\)/);
  const groupClasses = [
    "application-form-group-parameters",
    "application-form-group-collateral-deals",
    "application-form-group-inspection-contacts",
    "application-form-group-documents"
  ];
  let previous = -1;
  for (const group of groupClasses) {
    const index = renderer.indexOf(group);
    assert.ok(index > previous, `${group} should follow the previous visual group`);
    previous = index;
  }
  assert.match(renderer, /renderPageHeader\(title, "", headerActions, \{ headerClass: "application-sticky-header" \}\)/);
  assert.doesNotMatch(renderer, /Входящий запрос инициатора, в рамках которого группируются/);
  assert.doesNotMatch(renderer, /Данные заявки, состав залога, договоры, документы и связанные задачи/);
  for (const group of groupClasses.slice(0, 3)) {
    assert.match(renderer, new RegExp(`class="panel application-form-group ${group}"`));
  }
  const parametersStart = renderer.indexOf('class="panel application-form-group application-form-group-parameters"');
  const parametersEnd = renderer.indexOf("</section>", parametersStart);
  assert.ok(parametersStart >= 0 && parametersEnd > parametersStart);
  const parameters = renderer.slice(parametersStart, parametersEnd);
  assert.doesNotMatch(parameters, /Номер заявки<input/);
  assertInOrder(parameters, [
    "Тип заявки<select",
    "Подтип заявки<select",
    "Цель заявки<select",
    "${statusField}",
    "Инициатор<input",
    "Сегмент инициатора<select",
    "Банк<select",
    "Участник финансовой группы<select",
    "Клиент<input",
    "ИНН клиента<input",
    "Суть обращения / комментарий<textarea"
  ]);
  assert.match(renderer, /getApplicationPageTitle\(isCard, application, state\.newTask\.applicationNumber\)/);
  assert.match(parameters, /application-parameter-span-3/);
  assert.match(parameters, /application-parameter-span-6/);
  assert.match(parameters, /application-parameter-span-full/);
  for (const label of ["Тип заявки", "Подтип заявки", "Цель заявки", "Инициатор", "Сегмент инициатора", "Банк", "Участник финансовой группы"]) {
    assert.match(parameters, new RegExp(`class="application-parameter-span-3">${label}`));
  }
  assert.match(renderer, /statusField = `<label class="application-parameter-span-3">Статус заявки/);
  for (const label of ["Клиент", "ИНН клиента"]) {
    assert.match(parameters, new RegExp(`class="application-parameter-span-6">${label}`));
  }
  assert.match(parameters, /class="application-parameter-span-full">Суть обращения \/ комментарий/);
  assert.match(renderer, /renderApplicationReferenceOptions\(APPLICATION_BANK_OPTIONS, state\.newTask\.bank \|\| ""\)/);
  assert.match(renderer, /renderApplicationReferenceOptions\(APPLICATION_FINANCIAL_GROUP_OPTIONS, state\.newTask\.financialGroupParticipant \|\| ""\)/);
  assert.match(stylesSource, /\.application-form-group-parameters label\s*\{\s*color:\s*#334155;/);
  assert.match(stylesSource, /\.application-parameter-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/s);
  assert.match(stylesSource, /\.application-parameter-grid > \.application-parameter-span-3\s*\{\s*grid-column:\s*span 3;/);
  assert.match(stylesSource, /\.application-parameter-grid > \.application-parameter-span-6\s*\{\s*grid-column:\s*span 6;/);
  assert.match(stylesSource, /@media \(max-width: 1100px\)\s*\{\s*\.application-parameter-grid\s*\{[^}]*repeat\(6, minmax\(0, 1fr\)\)/s);
  assert.match(stylesSource, /@media \(max-width: 760px\)\s*\{[\s\S]*?\.application-parameter-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/);
  assert.match(stylesSource, /\.app-shell\.application-page-shell\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;/);
  assert.match(stylesSource, /\.app-shell\.application-page-shell > \.app-header \.role-box\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(stylesSource, /\.main\.application-page-main\s*\{[^}]*width:\s*100%;[^}]*grid-column:\s*auto;/s);
  assert.match(renderer, /className: "application-form-group application-form-group-documents"/);
  assert.match(stylesSource, /\.page-header\.application-sticky-header\s*\{[^}]*position:\s*sticky;[^}]*top:\s*67px;/s);
  assert.match(stylesSource, /\.application-create-layout > \.application-form-group\s*\{[^}]*padding:\s*18px;/s);
  assert.match(stylesSource, /\.application-create-layout > \.application-form-group:not\(\.document-widget\)::before\s*\{\s*display:\s*block;/);
  assert.match(stylesSource, /\.application-form-group-documents\s*\{[^}]*margin:\s*0;/s);
  assert.match(stylesSource, /\.page-header\.application-sticky-header\s*\{\s*top:\s*0;/);
  assert.match(appSource, /application-page-shell/);
  assert.match(stylesSource, /html:has\(\.page-header\.application-sticky-header\),\s*body:has\(\.page-header\.application-sticky-header\)\s*\{[^}]*overflow-x:\s*clip;/s);
  assert.match(stylesSource, /\.app-shell\.application-page-shell,\s*\.main\.application-page-main\s*\{[^}]*overflow-x:\s*clip;/s);
  assert.match(stylesSource, /\.app-shell\.application-page-shell \.arm-sidebar\s*\{\s*position:\s*static;/);
  assert.match(stylesSource, /\.page-header\.application-sticky-header \.header-actions \.btn:last-child:nth-child\(3\)\s*\{\s*grid-column:\s*1 \/ -1;/);
  assert.match(stylesSource, /\.page-header\.application-sticky-header \.header-actions\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);\s*justify-content:\s*stretch;/);
  assert.match(stylesSource, /\.page-header\.application-sticky-header \.header-actions \.btn\s*\{\s*min-width:\s*0;\s*max-width:\s*100%;/);
});

test("related tasks have a separate framed panel above collateral and one linked task-number column", () => {
  const renderer = sourceBlock("function renderApplicationCreate(query, options = {})", "\nfunction renderTaskCreate(query)");
  const linkedTasksPanel = renderer.indexOf('shouldShowApplicationLinkedTasks(application, isCard)');
  const collateralPanel = renderer.indexOf('class="panel application-form-group application-form-group-collateral-deals"');
  assert.ok(linkedTasksPanel >= 0 && linkedTasksPanel < collateralPanel);
  assert.match(appSource, /function shouldShowApplicationLinkedTasks\(application, isCard\)\s*\{\s*return Boolean\(isCard && !isDraftApplication\(application\) && getApplicationTasks\(application\)\.length\);/);
  const visibilityLogic = sourceBlock("function shouldShowApplicationLinkedTasks(application, isCard)", "function renderApplicationReferenceOptions");
  const visibilityContext = {
    getApplicationRegistryStatus: (status) => status,
    getApplicationTasks: (application) => application.tasks || []
  };
  vm.runInNewContext(`function isDraftApplication(application) { return getApplicationRegistryStatus(application?.status) === "Черновик"; }\n${visibilityLogic}\nglobalThis.shouldShow = shouldShowApplicationLinkedTasks;`, visibilityContext);
  assert.equal(visibilityContext.shouldShow({ status: "Черновик", tasks: [{ id: "tsk-1" }] }, true), false);
  assert.equal(visibilityContext.shouldShow({ status: "Новая", tasks: [] }, true), false);
  assert.equal(visibilityContext.shouldShow({ status: "Новая", tasks: [{ id: "tsk-1" }] }, true), true);
  assert.equal(visibilityContext.shouldShow({ status: "Новая" }, false), false);

  const tableRenderer = sourceBlock("function renderApplicationLinkedTasksTable(application)", "\nfunction renderApplicationReturnNotice");
  const linkRenderer = sourceBlock("function renderApplicationLinkedTaskNumberCell(task)", "\nconst APPLICATION_REGISTRY_COLLATERAL_PAGE_SIZE");
  const dateFormatting = `${sourceBlock("function getDateTimeSortValue(value)", "\nfunction matchesNumericRange")}\n${sourceBlock("function formatRegistryDateTime(value)", "\nfunction isDateTimeDisplayLabel")}`;
  const tasks = [
    { id: "tsk-18112026-004", type: "Осмотр", status: "Назначена", assignee: "Мария Петрова", number: "TASK-REF-004", allowed: true },
    { id: "tsk-18112026-005", type: "Оценка", status: "Назначена", assignee: "Иван Иванов", number: "TASK-REF-005", allowed: false }
  ];
  const context = {
    getApplicationTasks: () => tasks,
    canViewTaskRecord: (task) => task.allowed,
    getRole: () => ({}),
    getTaskDisplayType: (task) => task.type,
    badge: (value) => value,
    getTaskCreatedDateTime: () => "18.11.2026 10:00",
    escapeHtml: (value) => String(value),
    getTaskCardRoute: (task) => `/app/tasks/${task.id}`,
    renderRegistryRecordLink: (route, label, className) => `<a class="${className}" href="#${route}">${label}</a>`
  };
  vm.runInNewContext(`${dateFormatting}\n${linkRenderer}\n${tableRenderer}\nglobalThis.renderLinkedTasks = renderApplicationLinkedTasksTable;`, context);
  const html = context.renderLinkedTasks({ id: "app-18112026-001" });
  assert.match(html, /class="panel application-form-group application-form-group-linked-tasks application-linked-tasks-table-section"/);
  assert.match(html, /<th>Номер задачи<\/th>/);
  assert.doesNotMatch(html, /<th>(ID|Номер)<\/th>/);
  assert.equal((html.match(/<th>/g) || []).length, 6);
  assert.match(html, /<a class="link registry-object-link application-linked-task-link" href="#\/app\/tasks\/tsk-18112026-004">TASK-REF-004<\/a>/);
  assert.match(html, /<span class="muted">TASK-REF-005<\/span>/);
  assert.doesNotMatch(html, /<a[^>]+TASK-REF-005/);
  assert.match(stylesSource, /\.application-linked-tasks-table th\s*\{\s*font-weight:\s*400;/);
});

test("application create actions are ordered Back, Save, Send; existing card keeps its own Save", () => {
  const renderer = sourceBlock("function renderApplicationCreate(query, options = {})", "\nfunction renderTaskCreate(query)");
  const back = renderer.indexOf('data-route="/app/applications">Назад');
  const saveDraft = renderer.indexOf('"save-application-draft"');
  const send = renderer.indexOf('data-action="create-application-submit"');
  assert.ok(back >= 0 && back < saveDraft && saveDraft < send);
  assert.match(renderer, /editableDraftCard = isCard && isDraftApplication\(application\)/);
  assert.match(renderer, /data-action="save-application-draft"/);
  assert.match(renderer, /data-action="save-application-submit"/);
  assert.match(renderer, /data-action="create-application-submit"/);
  assert.match(renderer, /parameterReadonlyAttr = isCard && !editableDraftCard/);
  assert.match(appSource, /if \(action === "save-application-draft"\) saveNewApplicationDraft\(actionEl\.dataset\.application \|\| ""\);/);
});

test("application header title distinguishes unsaved, saved draft, and sent application", () => {
  const titleLogic = sourceBlock("function isDraftApplication(application)", "function renderApplicationRegistryNumberCell(application)");
  const context = { getApplicationRegistryStatus: (status) => status };
  vm.runInNewContext(`${titleLogic}\nglobalThis.title = getApplicationPageTitle;`, context);
  assert.equal(context.title(false, null, "app-20112026-001"), "Создание заявки");
  assert.equal(context.title(true, { status: "Черновик", number: "app-20112026-001" }), "Создание заявки app-20112026-001");
  assert.equal(context.title(true, { status: "Новая", number: "app-20112026-002" }), "Карточка заявки app-20112026-002");
});

test("application reference selects have the requested values and retain existing values", () => {
  const helper = sourceBlock("function renderApplicationReferenceOptions(options, selectedValue = \"\")", "function renderApplicationRegistryNumberCell(application)");
  const context = {
    uniqueItems: (items) => [...new Set(items)],
    escapeHtml: (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;")
  };
  vm.runInNewContext(`${helper}\nglobalThis.renderOptions = renderApplicationReferenceOptions;`, context);
  const banks = context.renderOptions(["Банк 1", "Банк 2"], "Банк 2");
  assert.match(banks, /<option value="Банк 1"/);
  assert.match(banks, /<option value="Банк 2" selected/);
  assert.match(context.renderOptions(["Банк 1", "Банк 2"]), /^<option value="" selected><\/option>/);
  assert.doesNotMatch(banks, /Не выбрано/);
  assert.match(context.renderOptions(["Лизинг", "Факторинг"], "Старое значение"), /Старое значение/);
});

test("new application draft starts with blank editable values and automatic initiator/status", () => {
  const initializer = sourceBlock("function ensureNewApplicationDraft(query)", "\nfunction ensureApplicationCardDraft(application)");
  const state = { data: {}, newTask: { key: "previous-draft", applicationType: "old" }, taskActiveCollateral: {} };
  const context = {
    state,
    getCollateral: () => null,
    getContract: () => null,
    getNextDataApplicationIdentity: () => ({ id: "APP-NEW", number: "app-20112026-001" }),
    createDraftApplicationDeal: (overrides = {}) => ({ currency: Object.hasOwn(overrides, "currency") ? overrides.currency : "RUB" }),
    normalizeApplicationDealProducts: () => [],
    sumBy: () => 0,
    uniqueItems: (items) => [...new Set(items)],
    getApplicationInitiatorSegment: () => "Корпоративный бизнес",
    getRole: () => ({ user: "Анна Инициатор" }),
    createApplicationPreInspectionRow: () => ({}),
    createApplicationContactRow: () => ({}),
    buildApplicationFallbackContactRows: () => [],
    getCollateralRegistrationScenario: () => ""
  };
  vm.runInNewContext(`${initializer}\nglobalThis.initializeDraft = ensureNewApplicationDraft;`, context);
  context.initializeDraft({ get: () => "" });

  assert.equal(state.newTask.applicationType, "");
  assert.equal(state.newTask.applicationSubtype, "");
  assert.equal(state.newTask.applicationPurpose, "");
  assert.equal(state.newTask.initiatorSegment, "");
  assert.equal(state.newTask.bank, "");
  assert.equal(state.newTask.financialGroupParticipant, "");
  assert.equal(state.newTask.dealClientName, "");
  assert.equal(state.newTask.dealClientInn, "");
  assert.equal(state.newTask.applicationComment, "");
  assert.equal(state.newTask.applicationDeals[0].currency, "");
  assert.equal(state.newTask.selectedCollateralIds.length, 0);
  assert.equal(state.newTask.initiator, "Анна Инициатор");
  assert.equal(state.newTask.applicationStatus, "Черновик");

  const collateral = { id: "COL-CTX", contractIds: ["CON-CTX"], clientName: "ООО Клиент", clientId: "7700000000" };
  const contract = { id: "CON-CTX", clientName: "ООО Клиент", inn: "7700000000", number: "CR-CTX", product: "Кредит", limit: 1000, currency: "RUB" };
  context.getCollateral = (id) => id === collateral.id ? collateral : null;
  context.getContract = (id) => id === contract.id ? contract : null;
  context.createDraftApplicationDealFromContract = (item) => ({ contractId: item.id, contractNumber: item.number, product: item.product, currency: item.currency });
  context.normalizeApplicationDealProducts = (values) => values.filter(Boolean);
  context.sumBy = (items, selector) => items.reduce((sum, item) => sum + selector(item), 0);
  context.buildApplicationFallbackContactRows = () => [{ role: "Контакт залогодателя" }];
  context.initializeDraft({ get: (key) => key === "collateral" ? collateral.id : "" });
  assert.equal(state.newTask.applicationType, "Оценка залога");
  assert.equal(state.newTask.selectedCollateralIds[0], collateral.id);
  assert.equal(state.newTask.dealClientName, "");
  assert.equal(state.newTask.dealClientInn, "");
  assert.equal(state.newTask.participantName, "");
  assert.equal(state.newTask.participantInn, "");
  assert.equal(state.newTask.contractNumber, contract.number);
  assert.equal(state.newTask.applicationDeals[0].currency, contract.currency);
});

test("selecting collateral does not populate client fields in an application draft", () => {
  const hydrate = sourceBlock("function hydrateNewTaskContextFromSelectedCollaterals()", "\nfunction createDraftApplicationDeal(");
  const collateral = { id: "COL-CTX", contractIds: ["CON-CTX"], clientName: "ООО Клиент", clientId: "7700000000" };
  const contract = { id: "CON-CTX", clientName: "ООО Клиент", inn: "7700000000", number: "CR-CTX", product: "Кредит", limit: 1000, currency: "RUB" };
  const state = {
    newTask: { key: "application-create", selectedCollateralIds: [collateral.id], dealClientName: "", dealClientInn: "", participantName: "", participantInn: "" },
    data: {}
  };
  const context = {
    state,
    getCollateral: () => collateral,
    getContract: () => contract,
    getApplicationByContract: () => null,
    normalizeApplicationDealProduct: (value, fallback) => value || fallback || "",
    getRegistrationScenarioSummary: () => ({ scenario: "" })
  };
  vm.runInNewContext(`${hydrate}\nglobalThis.hydrate = hydrateNewTaskContextFromSelectedCollaterals;`, context);
  context.hydrate();

  assert.equal(state.newTask.dealClientName, "");
  assert.equal(state.newTask.dealClientInn, "");
  assert.equal(state.newTask.participantName, "");
  assert.equal(state.newTask.participantInn, "");
  assert.equal(state.newTask.contractNumber, contract.number);

  state.newTask.dealClientName = "ООО Вручную";
  state.newTask.dealClientInn = "7800000000";
  context.hydrate();
  assert.equal(state.newTask.dealClientName, "ООО Вручную");
  assert.equal(state.newTask.dealClientInn, "7800000000");

  state.newTask = { key: "task-create", selectedCollateralIds: [collateral.id], dealClientName: "", dealClientInn: "", participantName: "", participantInn: "" };
  context.hydrate();
  assert.equal(state.newTask.dealClientName, collateral.clientName);
  assert.equal(state.newTask.dealClientInn, contract.inn);
  assert.equal(state.newTask.participantName, collateral.clientName);
  assert.equal(state.newTask.participantInn, collateral.clientId);
});

test("explicitly blank deal currency stays blank through save normalization", () => {
  const normalizeRow = sourceBlock("function normalizeApplicationDealRow(row = {}, index = 0)", "\nfunction getApplicationDealRows(application)");
  const normalizeForSave = sourceBlock("function normalizeApplicationDealsForSave(rows, clientName, clientInn, pledgeContractOptions)", "\nfunction syncApplicationDealLegacyFields");
  const context = {
    getContract: () => null,
    getContractByNumber: () => null,
    parseNumericInput: (value) => Number(value) || 0,
    getDealContractDate: (row) => row.contractDate || "",
    normalizeApplicationDealProduct: (value) => value || "",
    uniqueItems: (values) => [...new Set(values)],
    parseListValue: () => [],
    normalizeApplicationPledgeContractLinks: (value) => value || [],
    getApplicationPledgeContractLinksForSave: (value) => value || []
  };
  vm.runInNewContext(`${normalizeRow}\n${normalizeForSave}\nglobalThis.saveDeals = normalizeApplicationDealsForSave;`, context);
  const [deal] = context.saveDeals([{ product: "Кредит", contractNumber: "CR-1", limit: 500, currency: "" }], "ООО Клиент", "7700000000", []);
  assert.equal(deal.currency, "");

  const builder = sourceBlock("function buildApplicationFromForm(status, existingApplication = null)", "\nfunction saveApplicationCard(applicationId)");
  assert.match(builder, /deals\.map\(\(row\) => row\.currency\)\.filter\(Boolean\)/);
  assert.match(builder, /currency: currencies\[0\] \|\| state\.newTask\.dealCurrency \|\| ""/);
});

test("blank deal currency is passed to the auto-created task without a fallback", () => {
  const taskBuilder = sourceBlock("function createInitialTaskForApplication(", "\nfunction buildApplicationFromForm(status, existingApplication = null)");
  const context = {
    uniqueItems: (values) => [...new Set(values)],
    clone: (value) => value,
    getCollateral: (id) => id === "COL-1" ? { id, contractIds: [] } : null,
    getApplicationInitialTaskType: () => "Первичный осмотр",
    getContract: () => null,
    getContractByNumber: () => null,
    formatTaskHistoryDate: () => "20.11.2026 09:00:00",
    getDefaultTaskAssigneeForType: () => "Исполнитель",
    getDefaultInitialTaskDueDate: () => "2026-11-23",
    normalizeApplicationDealProduct: (value) => value || "",
    getApplicationInitialInspectionFormat: () => "Физический осмотр",
    isRegistrationTaskType: () => false,
    createTask: (payload) => payload
  };
  vm.runInNewContext(`${taskBuilder}\nglobalThis.createInitial = createInitialTaskForApplication;`, context);
  const task = context.createInitial(
    { number: "app-20112026-001", applicationType: "Осмотр имущества", applicationSubtype: "Первичный осмотр", currency: "" },
    ["COL-1"],
    [],
    [{ currency: "", product: "Кредит" }]
  );
  assert.equal(task.dealCurrency, "");
  const taskFactory = sourceBlock("function createTask(payload)", "\ndocument.addEventListener(\"click\", (event) => {");
  assert.match(taskFactory, /const dealCurrency = payload\.dealCurrency \?\? application\?\.currency \?\? contract\?\.currency \?\? "RUB"/);
});

test("first task from a saved draft uses its submission month, not the draft creation month", () => {
  const taskBuilder = sourceBlock("function createInitialTaskForApplication(", "\nfunction buildApplicationFromForm(status, existingApplication = null)");
  let dueDateInput = "";
  const context = {
    uniqueItems: (values) => [...new Set(values)],
    clone: (value) => JSON.parse(JSON.stringify(value)),
    getCollateral: (id) => id === "COL-1" ? { id, contractIds: [] } : null,
    getApplicationInitialTaskType: () => "Первичный осмотр",
    getContract: () => null,
    getContractByNumber: () => null,
    formatTaskHistoryDate: () => "01.11.2026 00:05:00",
    getDefaultTaskAssigneeForType: () => "Исполнитель",
    getDefaultInitialTaskDueDate: (value) => { dueDateInput = value; return "2026-11-04"; },
    normalizeApplicationDealProduct: (value) => value || "Кредит",
    getApplicationInitialInspectionFormat: () => "Физический осмотр",
    isRegistrationTaskType: () => false,
    REGISTRATION_SCENARIO_MOVABLE: "",
    getNextMonthlyTaskNumber,
    createTask: (payload) => ({ ...payload, id: getNextMonthlyTaskNumber(payload.type, [], payload.createdAt) })
  };
  vm.runInNewContext(`${taskBuilder}\nglobalThis.createInitial = createInitialTaskForApplication;`, context);
  const task = context.createInitial({
    createdAt: "31.10.2026 23:59:00",
    number: "app-31102026-001",
    applicationType: "Осмотр имущества",
    applicationSubtype: "Первичный осмотр",
    clientName: "ООО Клиент",
    clientInn: "7700000000"
  }, ["COL-1"]);

  assert.equal(task.createdAt, "01.11.2026 00:05:00");
  assert.equal(task.id, "s-1126-0001");
  assert.equal(dueDateInput, "01.11.2026 00:05:00");
});

test("new application selects have a blank option and registry action resets stale draft", () => {
  const optionsSource = sourceBlock("function renderApplicationTypeOptions(value)", "function renderApplicationStatusOptions(value)");
  const context = {
    APPLICATION_TYPES: [{ value: "Осмотр имущества" }],
    APPLICATION_PURPOSES: ["Проверка предмета залога"],
    getApplicationSubtypeOptions: () => ["Первичный осмотр"],
    escapeHtml: (value) => String(value)
  };
  vm.runInNewContext(`${optionsSource}\nglobalThis.renderType = renderApplicationTypeOptions; globalThis.renderSubtype = renderApplicationSubtypeOptions; globalThis.renderPurpose = renderApplicationPurposeOptions;`, context);
  for (const html of [context.renderType(""), context.renderSubtype("", ""), context.renderPurpose("")]) {
    assert.match(html, /<option value="" selected><\/option>/);
  }
  assert.equal(context.renderSubtype("", ""), '<option value="" selected></option>');

  const productOptionsSource = sourceBlock("function renderApplicationDealProductOptions(value = \"\")", "const REGISTRATION_SCENARIO_MOVABLE");
  const productContext = {
    APPLICATION_DEAL_PRODUCT_TYPES: ["Кредит", "Лизинг", "Банковская гарантия"],
    normalizeApplicationDealProduct: (value) => value || "",
    escapeHtml: (value) => String(value)
  };
  vm.runInNewContext(`${productOptionsSource}\nglobalThis.renderProduct = renderApplicationDealProductOptions;`, productContext);
  assert.match(productContext.renderProduct(""), /^<option value="" selected><\/option>/);

  const renderer = sourceBlock("function renderApplicationsRegistry()", "\nfunction renderCollateralControlPanel");
  assert.match(renderer, /data-action="start-new-application">Создать заявку/);
  assert.match(appSource, /if \(action === "start-new-application"\)\s*\{\s*state\.newTask = \{ key: "" \};\s*state\.taskActiveCollateral\["new-task-draft"\] = "";\s*window\.location\.hash = "\/app\/applications\/new";/);
});

test("empty application draft can be saved; submission still validates and creates its initial task", () => {
  const validation = sourceBlock("function getApplicationParameterValidation(params, collateralIds = [])", "\nfunction showApplicationValidationToast");
  const validationToast = sourceBlock("function showApplicationValidationToast(missing = [])", "\nfunction createInitialTaskForApplication");
  const taskCreation = sourceBlock("function createInitialTaskForApplication(", "\nfunction buildApplicationFromForm");
  const lifecycle = sourceBlock("function buildApplicationFromForm(status, existingApplication = null)", "\nfunction saveApplicationCard(applicationId)");
  const hydrateDraft = sourceBlock("function ensureApplicationCardDraft(application)", "\nfunction renderApplicationCard");
  const applications = [];
  const tasks = [];
  const state = {
    data: { applications, tasks, collaterals: [], contracts: [] },
    newTask: {
      applicationNumber: "app-18112026-001",
      initiator: "Анна Инициатор",
      initiatorSegment: "",
      applicationType: "",
      applicationSubtype: "",
      applicationPurpose: "",
      bank: "",
      financialGroupParticipant: "",
      dealClientName: "",
      dealClientInn: "",
      dealCurrency: "",
      applicationDeals: [{ product: "", currency: "", limit: "" }],
      selectedCollateralIds: [],
      applicationPreInspections: [],
      applicationContacts: [],
      documents: []
    },
    taskActiveCollateral: {}
  };
  const fields = {
    newTaskApplicationNumber: "app-18112026-001",
    newTaskInitiatorSegment: "",
    newTaskDealClientName: "",
    newTaskDealClientInn: "",
    newTaskApplicationType: "",
    newTaskApplicationSubtype: "",
    newTaskApplicationPurpose: "",
    newTaskBank: "",
    newTaskFinancialGroupParticipant: "",
    newTaskComment: ""
  };
  let persisted = 0;
  const validationMessages = [];
  const createdTaskInputs = [];
  const context = {
    state,
    clone: (value) => JSON.parse(JSON.stringify(value)),
    document: { getElementById: (id) => ({ value: fields[id] || "" }) },
    window: { location: { hash: "" } },
    formatTaskHistoryDate: () => "18.11.2026 10:00",
    getNextDataApplicationIdentity: () => ({ id: "APP-NEW", number: "app-18112026-001" }),
    getApplicationByNumber: (number) => applications.find((item) => item.number === number) || null,
    getApplication: (id) => applications.find((item) => item.id === id || item.number === id) || null,
    isDraftApplication: (application) => application?.status === "Черновик",
    getApplicationTasks: (application) => (application?.taskIds || []).map((id) => tasks.find((task) => task.id === id)).filter(Boolean),
    normalizeApplicationType: (value) => value,
    normalizeApplicationSubtype: (_type, value) => value,
    normalizeApplicationPurpose: (_type, _subtype, value) => value,
    getRole: () => ({ user: "Анна Инициатор" }),
    getCollateral: (id) => id === "COL-001" ? { id } : null,
    uniqueItems: (values) => [...new Set(values)],
    getApplicationPledgeContractOptions: () => [],
    normalizeApplicationDealsForSave: (rows) => rows,
    getDraftApplicationDeals: () => state.newTask.applicationDeals,
    getContract: () => null,
    getContractByNumber: () => null,
    parseNumericInput: Number,
    getSerializableApplicationContacts: () => [],
    getDraftApplicationPreInspectionPayloads: () => [{}],
    createApplicationPreInspectionRow: () => ({}),
    persistTaskState: () => { persisted += 1; },
    getApplicationCardRoute: (application) => `/app/applications/${application.number}`,
    getApplicationInitialTaskType: () => "Первичный осмотр",
    getDefaultTaskAssigneeForType: () => "Мария Петрова",
    getDefaultInitialTaskDueDate: () => "2026-11-25",
    getApplicationInitialInspectionFormat: () => "Физический",
    isRegistrationTaskType: () => false,
    REGISTRATION_SCENARIO_MOVABLE: "Регистрация движимого имущества",
    normalizeApplicationDealProduct: (value) => value || "",
    createTask: (input) => {
      createdTaskInputs.push(input);
      const task = { id: "tsk-18112026-001", ...input };
      tasks.push(task);
      return task;
    },
    resetNewTaskDraft: () => { state.newTask = {}; },
    addToast: (title, message) => {
      if (title === "Заполните заявку") validationMessages.push(message);
    },
    getApplicationCollaterals: () => [],
    getApplicationContracts: () => [],
    getApplicationDealRows: (application) => application.deals || [],
    getApplicationClientName: () => "",
    getApplicationInn: () => "",
    getApplicationProducts: () => [],
    getApplicationPreInspectionRecords: () => [],
    getApplicationType: (application) => application.applicationType || "",
    getApplicationSubtype: (application) => application.applicationSubtype || "",
    getApplicationPurpose: (application) => application.applicationPurpose || "",
    getApplicationInitiator: (application) => application.initiator || "",
    getApplicationInitiatorSegment: (application) => application.initiatorSegment || "",
    getApplicationContactRows: () => [],
    createDraftApplicationDeal: () => ({}),
    sumBy: () => 0,
    console
  };
  vm.runInNewContext(`${validation}\n${validationToast}\n${taskCreation}\n${hydrateDraft}\n${lifecycle}\nglobalThis.saveDraft = saveNewApplicationDraft; globalThis.send = submitNewApplication; globalThis.hydrateDraft = ensureApplicationCardDraft;`, context);

  context.saveDraft();
  assert.equal(applications.length, 1);
  assert.equal(applications[0].status, "Черновик");
  assert.equal(applications[0].applicationType, "");
  assert.equal(applications[0].applicationSubtype, "");
  assert.equal(applications[0].applicationPurpose, "");
  assert.equal(applications[0].clientName, "");
  assert.equal(applications[0].participantInn, "");
  assert.deepEqual(Array.from(applications[0].collateralIds), []);
  assert.equal(applications[0].currency, "");
  assert.equal(tasks.length, 0);
  assert.equal(applications[0].taskIds.length, 0);
  assert.equal(windowHash(context), "/app/applications/app-18112026-001");

  Object.assign(state.newTask, {
    bank: "Банк 2",
    financialGroupParticipant: "Факторинг",
    applicationComment: "Подготовить осмотр объекта"
  });
  Object.assign(fields, {
    newTaskBank: "Банк 2",
    newTaskFinancialGroupParticipant: "Факторинг",
    newTaskComment: "Подготовить осмотр объекта"
  });
  context.saveDraft(applications[0].id);
  assert.equal(applications[0].bank, "Банк 2");
  assert.equal(applications[0].financialGroupParticipant, "Факторинг");
  assert.equal(applications[0].comment, "Подготовить осмотр объекта");
  assert.equal(applications[0].status, "Черновик");
  assert.equal(tasks.length, 0);

  state.newTask = {};
  context.hydrateDraft(applications[0]);
  assert.equal(state.newTask.bank, "Банк 2");
  assert.equal(state.newTask.financialGroupParticipant, "Факторинг");
  assert.equal(state.newTask.applicationComment, "Подготовить осмотр объекта");

  context.send(applications[0].id);
  assert.equal(applications[0].status, "Черновик");
  assert.equal(tasks.length, 0);
  assert.equal(persisted, 2);
  assert.equal(validationMessages.length, 1);

  Object.assign(state.newTask, {
    initiatorSegment: "МСБ",
    applicationType: "Оценка залога",
    applicationSubtype: "Первоначальная оценка",
    applicationPurpose: "Новый кредит / новая сделка",
    bank: "Банк 2",
    financialGroupParticipant: "Факторинг",
    dealClientName: "ООО Север",
    dealClientInn: "1234567890",
    applicationDeals: [{ product: "Кредит", currency: "", limit: 1000 }],
    selectedCollateralIds: ["COL-001"]
  });
  Object.assign(fields, {
    newTaskInitiatorSegment: "МСБ",
    newTaskDealClientName: "ООО Север",
    newTaskDealClientInn: "1234567890",
    newTaskApplicationType: "Оценка залога",
    newTaskApplicationSubtype: "Первоначальная оценка",
    newTaskApplicationPurpose: "Новый кредит / новая сделка",
    newTaskBank: "Банк 2",
    newTaskFinancialGroupParticipant: "Факторинг",
    newTaskComment: "Осмотреть объект залога"
  });

  context.send(applications[0].id);
  assert.equal(applications.length, 1);
  assert.equal(applications[0].status, "Новая");
  assert.equal(applications[0].bank, "Банк 2");
  assert.equal(applications[0].financialGroupParticipant, "Факторинг");
  assert.equal(applications[0].currency, "RUB");
  assert.equal(applications[0].taskIds.join(","), "tsk-18112026-001");
  assert.equal(tasks.length, 1);
  assert.equal(createdTaskInputs.length, 1);
  assert.equal(createdTaskInputs[0].collateralIds.join(","), "COL-001");
  assert.equal(persisted, 3);
  assert.equal(validationMessages.length, 1);
});

function windowHash(context) {
  return context.window.location.hash;
}
