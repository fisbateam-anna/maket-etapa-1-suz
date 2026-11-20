import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function sourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source start: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source end: ${endMarker}`);
  return appSource.slice(start, end);
}

function extractFunction(startMarker, endMarker, context, exportName) {
  vm.runInNewContext(`${sourceBlock(startMarker, endMarker)}\nglobalThis.result = ${exportName};`, context);
  return context.result;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

test("application collateral rows get a rightmost remove action only in unsent application forms", () => {
  const appComponent = extractFunction(
    "function renderApplicationCollateralObjectsInfo(",
    "\nfunction canRemoveApplicationCollateralLink",
    {
      renderTaskCollateralObjectsInfo: (...args) => args[3],
      renderApplicationCollateralActions: () => "",
      isDraftApplication: (application) => application?.status === "Черновик",
      state: { newTask: { applicationSelectedCollateralId: "" } }
    },
    "renderApplicationCollateralObjectsInfo"
  );

  assert.equal(appComponent({}, [], null, null).allowApplicationRemove, true);
  assert.equal(appComponent({}, [], null, { status: "Черновик" }).allowApplicationRemove, true);
  assert.equal(appComponent({}, [], null, { status: "Новая" }).allowApplicationRemove, false);
  assert.match(appSource, /const allowApplicationRemove = options\.allowApplicationRemove === true/);
  assert.match(appSource, /\(showExclusionColumn \? 13 : 12\) \+ \(allowApplicationRemove \? 1 : 0\)/);

  const rowContext = {
    escapeHtml,
    isTaskCollateralExcluded: () => false,
    getLatestCollateralEvaluation: () => ({ market: 20, pledge: 15 }),
    getEvaluationFairValue: () => 12,
    getCollateralSuzNumber: () => "ZLG-1",
    getLatestInspectionScheduleItem: () => null,
    getCollateralRegistryLatestAppraisalDate: () => "-",
    hasNegativeCollateralCheckResult: () => false,
    getTaskCollateralCardRoute: () => "/app/collaterals/COL-1",
    getCollateralSubtype: () => "Квартира",
    getCollateralObjectIdentifier: () => "77:01:0001:42",
    getCollateralName: () => "Квартира",
    getCollateralRegistryAddress: () => "Новосибирск",
    getTaskCollateralPledgeContractText: () => "ZL-1",
    formatFullMoney: (value) => String(value),
    getCollateralLiquidity: () => "Высокая",
    formatRegistryDateTime: (value) => value,
    state: {}
  };
  const renderRow = extractFunction("function renderTaskCollateralRow", "\nfunction canMarkTaskCollateralExcluded", rowContext, "renderTaskCollateralRow");
  const rowHtml = renderRow({ id: "new-task-draft" }, { id: "COL-1" }, null, { selectable: false, allowApplicationRemove: true });
  assert.match(rowHtml, /class="task-collateral-remove-cell">\s*<button[^>]+data-action="remove-application-collateral"[^>]*>×<\/button>/);
  assert.ok(rowHtml.lastIndexOf("task-collateral-remove-cell") > rowHtml.lastIndexOf("task-collateral-money"));
  assert.doesNotMatch(renderRow({ id: "TSK-1" }, { id: "COL-1" }, null, { selectable: false }), /remove-application-collateral/);

  const groupsContext = {
    isTaskCollateralGroupExpanded: () => true,
    escapeHtml,
    pluralize: (count, one, few, many) => count === 1 ? one : count < 5 ? few : many,
    formatShortMoney: String,
    renderTaskCollateralRow: () => "<tr><td>item</td></tr>"
  };
  const renderGroups = extractFunction("function renderTaskCollateralGroupedRows", "\nfunction buildTaskCollateralGroups", groupsContext, "renderTaskCollateralGroupedRows");
  const groupHtml = renderGroups({ id: "application-create" }, [{
    key: "pledgor:a", pledgor: "ООО Альфа", count: 1, pledgeValue: 10,
    types: [{ key: "type:a", type: "Оборудование", count: 1, pledgeValue: 10, items: [{ id: "COL-1" }] }]
  }], null, { columnCount: 13, groupStateId: "application-create" });
  assert.equal((groupHtml.match(/colspan="13"/g) || []).length, 2);
  assert.match(stylesSource, /\.task-collateral-info\.has-application-remove-column th:last-child,[\s\S]*?\.task-collateral-info\.has-application-remove-column td:last-child\s*\{[^}]*width:\s*48px/s);
});

test("removing a collateral changes only the draft application links and related pledge-contract links", () => {
  const application = { id: "APP-1", number: "app-20112026-001", status: "Черновик", collateralIds: ["COL-1", "COL-2"] };
  const collateralRecords = [
    { id: "COL-1", name: "Объект 1", fields: { "Заводской номер": "EQ-1" } },
    { id: "COL-2", name: "Объект 2", fields: { "Заводской номер": "EQ-2" } }
  ];
  const draft = {
    key: "application-card:APP-1",
    applicationNumber: application.number,
    selectedCollateralIds: ["COL-1", "COL-2"],
    applicationSelectedCollateralId: "COL-1",
    applicationDeals: [{
      collateralIds: ["COL-1", "COL-2"],
      pledgeContractLinks: [
        { number: "ZL-1", date: "2026-01-01", collateralIds: ["COL-1"] },
        { number: "ZL-2", date: "2026-02-01", collateralIds: ["COL-2"] },
        { number: "ZL-BOTH", date: "2026-03-01", collateralIds: ["COL-1", "COL-2"] }
      ]
    }]
  };
  const state = { newTask: draft, taskActiveCollateral: { "new-task-draft": "COL-1" }, data: { applications: [application], collaterals: collateralRecords } };
  const collateralBefore = JSON.stringify(collateralRecords);
  const context = {
    state,
    getApplicationByNumber: (number) => state.data.applications.find((item) => item.number === number || item.id === number),
    isDraftApplication: (item) => item?.status === "Черновик",
    normalizeApplicationPledgeContractLinks: (links) => links || [],
    addToast: (title, message, type) => { context.toast = { title, message, type }; }
  };
  const helperBlock = sourceBlock("function canRemoveApplicationCollateralLink()", "\nfunction renderApplicationDealPledgeContractPicker");
  vm.runInNewContext(`${helperBlock}\nglobalThis.canRemove = canRemoveApplicationCollateralLink; globalThis.remove = removeApplicationCollateralFromDraft;`, context);

  assert.equal(context.canRemove(), true);
  assert.equal(context.remove("COL-1"), true);
  assert.deepEqual(Array.from(draft.selectedCollateralIds), ["COL-2"]);
  assert.deepEqual(Array.from(draft.applicationDeals[0].collateralIds), ["COL-2"]);
  assert.deepEqual(
    draft.applicationDeals[0].pledgeContractLinks.map((link) => [link.number, Array.from(link.collateralIds)]),
    [["ZL-2", ["COL-2"]], ["ZL-BOTH", ["COL-2"]]]
  );
  assert.equal(draft.applicationSelectedCollateralId, "COL-2");
  assert.equal(state.taskActiveCollateral["new-task-draft"], "COL-2");
  assert.equal(JSON.stringify(collateralRecords), collateralBefore);
  assert.deepEqual(Array.from(application.collateralIds), ["COL-1", "COL-2"], "persisted application changes only when the draft is saved");
  assert.match(context.toast.message, /Карточка залога сохранена в реестре/);
});

test("removed collateral stays out after saving and re-opening a draft application", () => {
  const application = {
    id: "APP-3",
    number: "app-20112026-003",
    status: "Черновик",
    taskIds: [],
    applicationType: "Осмотр имущества",
    applicationSubtype: "Физический осмотр",
    applicationPurpose: "Проверка предмета залога",
    initiator: "Анна Инициатор",
    initiatorSegment: "МСБ",
    bank: "Банк 1",
    financialGroupParticipant: "Лизинг",
    clientName: "ООО Север",
    participantInn: "1234567890",
    deals: [],
    preInspections: [],
    contacts: [],
    documents: []
  };
  const collateralRecords = [{ id: "COL-3" }, { id: "COL-4" }];
  const state = {
    data: { applications: [application], collaterals: collateralRecords, tasks: [] },
    newTask: {
      key: "application-card:APP-3",
      applicationNumber: application.number,
      applicationType: application.applicationType,
      applicationSubtype: application.applicationSubtype,
      applicationPurpose: application.applicationPurpose,
      initiator: application.initiator,
      initiatorSegment: application.initiatorSegment,
      bank: application.bank,
      financialGroupParticipant: application.financialGroupParticipant,
      dealClientName: application.clientName,
      dealClientInn: application.participantInn,
      applicationComment: "Осмотреть предмет залога",
      applicationStatus: "Черновик",
      applicationDeals: [{ product: "Кредит", contractNumber: "CR-3", limit: 1000, currency: "RUB", collateralIds: ["COL-3", "COL-4"], pledgeContractLinks: [] }],
      selectedCollateralIds: ["COL-3", "COL-4"],
      applicationPreInspections: [],
      applicationContacts: [],
      documents: []
    },
    taskActiveCollateral: { "new-task-draft": "COL-3" }
  };
  const fields = {
    newTaskInitiatorSegment: "МСБ",
    newTaskDealClientName: "ООО Север",
    newTaskDealClientInn: "1234567890",
    newTaskApplicationType: "Осмотр имущества",
    newTaskApplicationSubtype: "Физический осмотр",
    newTaskApplicationPurpose: "Проверка предмета залога",
    newTaskBank: "Банк 1",
    newTaskFinancialGroupParticipant: "Лизинг",
    newTaskComment: "Осмотреть предмет залога"
  };
  const context = {
    state,
    document: { getElementById: (id) => ({ value: fields[id] || "" }) },
    window: { location: { hash: "" } },
    getApplication: (key) => state.data.applications.find((item) => item.id === key || item.number === key) || null,
    getApplicationByNumber: (number) => state.data.applications.find((item) => item.number === number || item.id === number) || null,
    getApplicationTasks: () => [],
    isDraftApplication: (item) => item?.status === "Черновик",
    getCollateral: (id) => collateralRecords.find((item) => item.id === id) || null,
    getNextDataApplicationIdentity: () => ({ id: "APP-3", number: application.number }),
    formatTaskHistoryDate: () => "20.11.2026 09:00:00",
    getRole: () => ({ user: "Анна Инициатор" }),
    normalizeApplicationType: (value) => value,
    normalizeApplicationSubtype: (_type, value) => value,
    normalizeApplicationPurpose: (_type, _subtype, value) => value,
    getApplicationPledgeContractOptions: () => [],
    normalizeApplicationPledgeContractLinks: (links) => links || [],
    normalizeApplicationDealsForSave: (rows) => rows,
    getDraftApplicationDeals: () => state.newTask.applicationDeals,
    getApplicationParameterValidation: () => [],
    showApplicationValidationToast: (missing) => Boolean(missing.length),
    uniqueItems: (values) => [...new Set(values)],
    getContract: () => null,
    parseNumericInput: (value) => Number(value) || 0,
    getSerializableApplicationContacts: () => [],
    getDraftApplicationPreInspectionPayloads: () => [],
    createApplicationPreInspectionRow: () => ({}),
    addToast() {},
    persistTaskState() {},
    getApplicationCardRoute: (item) => `/app/applications/${item.number}`,
    getApplicationCollaterals: (item) => item.collateralIds.map((id) => collateralRecords.find((collateral) => collateral.id === id)).filter(Boolean),
    getApplicationContracts: () => [],
    getApplicationDealRows: (item) => item.deals || [],
    getApplicationClientName: (item) => item.clientName,
    getApplicationInn: (item) => item.participantInn,
    getApplicationProducts: (item) => item.products || [],
    getApplicationPreInspectionRecords: (item) => item.preInspections || [],
    getApplicationType: (item) => item.applicationType,
    getApplicationSubtype: (item) => item.applicationSubtype,
    getApplicationPurpose: (item) => item.applicationPurpose,
    getApplicationInitiator: (item) => item.initiator,
    getApplicationInitiatorSegment: (item) => item.initiatorSegment,
    getApplicationContactRows: () => [],
    getCollateralRegistrationScenario: () => "",
    createDraftApplicationDeal: () => ({})
  };
  const lifecycle = sourceBlock("function buildApplicationFromForm(status, existingApplication = null)", "\nfunction saveApplicationCard(applicationId)");
  const reopen = sourceBlock("function ensureApplicationCardDraft(application)", "\nfunction renderApplicationCard");
  const removal = sourceBlock("function canRemoveApplicationCollateralLink()", "\nfunction renderApplicationDealPledgeContractPicker");
  vm.runInNewContext(`${removal}\n${lifecycle}\n${reopen}\nglobalThis.remove = removeApplicationCollateralFromDraft; globalThis.saveDraft = saveNewApplicationDraft; globalThis.reopen = ensureApplicationCardDraft;`, context);

  assert.equal(context.remove("COL-3"), true);
  context.saveDraft("APP-3");
  assert.deepEqual(Array.from(application.collateralIds), ["COL-4"]);
  assert.deepEqual(collateralRecords.map((item) => item.id), ["COL-3", "COL-4"]);

  state.newTask = { key: "" };
  context.reopen(application);
  assert.deepEqual(Array.from(state.newTask.selectedCollateralIds), ["COL-4"]);
});

test("remove action rejects sent applications, non-application contexts, and unlinked objects", () => {
  const application = { id: "APP-2", number: "app-20112026-002", status: "Новая" };
  const state = {
    newTask: { key: "application-card:APP-2", applicationNumber: application.number, selectedCollateralIds: ["COL-1"], applicationDeals: [] },
    taskActiveCollateral: { "new-task-draft": "COL-1" },
    data: { applications: [application], collaterals: [{ id: "COL-1" }] }
  };
  const context = {
    state,
    getApplicationByNumber: () => application,
    isDraftApplication: (item) => item?.status === "Черновик",
    normalizeApplicationPledgeContractLinks: (links) => links || [],
    addToast() {}
  };
  const helperBlock = sourceBlock("function canRemoveApplicationCollateralLink()", "\nfunction renderApplicationDealPledgeContractPicker");
  vm.runInNewContext(`${helperBlock}\nglobalThis.canRemove = canRemoveApplicationCollateralLink; globalThis.remove = removeApplicationCollateralFromDraft;`, context);
  assert.equal(context.canRemove(), false);
  assert.equal(context.remove("COL-1"), false);
  assert.deepEqual(Array.from(state.newTask.selectedCollateralIds), ["COL-1"]);
  assert.equal(context.remove("COL-OTHER"), false);

  state.newTask.key = "task-create";
  assert.equal(context.canRemove(), false);
});

