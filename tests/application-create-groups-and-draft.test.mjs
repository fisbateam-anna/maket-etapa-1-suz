import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

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
  assertInOrder(renderer.slice(parametersStart, parametersEnd), [
    "Номер заявки<input",
    "Тип заявки<select",
    "Подтип заявки<select",
    "Цель<select",
    "Инициатор<input",
    "Сегмент инициатора<select",
    "Клиент<input",
    "ИНН клиента<input",
    "${statusField}",
    "Суть обращения / комментарий<textarea"
  ]);
  assert.match(stylesSource, /\.application-form-group-parameters label\s*\{\s*color:\s*#334155;/);
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
});

test("related tasks have a separate framed panel above collateral and one linked task-number column", () => {
  const renderer = sourceBlock("function renderApplicationCreate(query, options = {})", "\nfunction renderTaskCreate(query)");
  const linkedTasksPanel = renderer.indexOf('renderApplicationLinkedTasksTable(application)');
  const collateralPanel = renderer.indexOf('class="panel application-form-group application-form-group-collateral-deals"');
  assert.ok(linkedTasksPanel >= 0 && linkedTasksPanel < collateralPanel);

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

test("saving creates a registry draft without a task; sending reuses it and creates one task", () => {
  const lifecycle = sourceBlock("function buildApplicationFromForm(status, existingApplication = null)", "\nfunction saveApplicationCard(applicationId)");
  const applications = [];
  const tasks = [];
  const state = {
    data: { applications, tasks, collaterals: [], contracts: [] },
    newTask: {
      applicationNumber: "app-18112026-001",
      initiator: "Анна Инициатор",
      initiatorSegment: "МСБ",
      applicationType: "Оценка залога",
      applicationSubtype: "Первоначальная оценка",
      applicationPurpose: "Новый кредит / новая сделка",
      dealClientName: "ООО Север",
      dealClientInn: "1234567890",
      dealCurrency: "RUB",
      applicationDeals: [{ product: "Кредит", currency: "RUB", limit: 1000 }],
      selectedCollateralIds: ["COL-001"],
      applicationPreInspections: [],
      applicationContacts: [],
      documents: []
    },
    taskActiveCollateral: {}
  };
  const fields = {
    newTaskApplicationNumber: "app-18112026-001",
    newTaskInitiatorSegment: "МСБ",
    newTaskDealClientName: "ООО Север",
    newTaskDealClientInn: "1234567890",
    newTaskApplicationType: "Оценка залога",
    newTaskApplicationSubtype: "Первоначальная оценка",
    newTaskApplicationPurpose: "Новый кредит / новая сделка",
    newTaskComment: "Осмотреть объект залога"
  };
  let persisted = 0;
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
    getApplicationParameterValidation: () => [],
    showApplicationValidationToast: (missing) => Boolean(missing.length),
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
    parseNumericInput: Number,
    getSerializableApplicationContacts: () => [],
    getDraftApplicationPreInspectionPayloads: () => [{}],
    createApplicationPreInspectionRow: () => ({}),
    persistTaskState: () => { persisted += 1; },
    getApplicationCardRoute: (application) => `/app/applications/${application.number}`,
    createInitialTaskForApplication: (application) => {
      const task = { id: "tsk-18112026-001", applicationNumber: application.number };
      tasks.push(task);
      return task;
    },
    resetNewTaskDraft: () => { state.newTask = {}; },
    addToast: () => {},
    console
  };
  vm.runInNewContext(`${lifecycle}\nglobalThis.saveDraft = saveNewApplicationDraft; globalThis.send = submitNewApplication;`, context);

  context.saveDraft();
  assert.equal(applications.length, 1);
  assert.equal(applications[0].status, "Черновик");
  assert.equal(tasks.length, 0);
  assert.equal(applications[0].taskIds.length, 0);
  assert.equal(windowHash(context), "/app/applications/app-18112026-001");

  context.send(applications[0].id);
  assert.equal(applications.length, 1);
  assert.equal(applications[0].status, "Новая");
  assert.equal(applications[0].taskIds.join(","), "tsk-18112026-001");
  assert.equal(tasks.length, 1);
  assert.equal(persisted, 2);
});

function windowHash(context) {
  return context.window.location.hash;
}
