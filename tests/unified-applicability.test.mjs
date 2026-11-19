import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function extractFunction(startMarker, endMarker, context, exportName) {
  vm.runInNewContext(`${functionSource(startMarker, endMarker)}\nglobalThis.result = ${exportName};`, context);
  return context.result;
}

function functionSource(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing function marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
  return appSource.slice(start, end);
}

const collaterals = [
  { id: "COL-1", profileIdentifier: "VIN-001", description: "Грузовой автомобиль" },
  { id: "COL-2", profileIdentifier: "77:01:0001:42", description: "Квартира" }
];
const tasks = [
  { id: "tsk-18112026-001", number: "tsk-18112026-001" },
  { id: "tsk-18112026-002", number: "tsk-18112026-002" }
];
const plain = (value) => JSON.parse(JSON.stringify(value));

function getApplicabilityOptions(context, extras = {}) {
  const optionContext = { getCollateralObjectIdentifier: (collateral) => collateral.profileIdentifier };
  return plain(extractFunction(
    "function getApplicabilityOptions",
    "\nfunction getApplicationContactBindingValue",
    optionContext,
    "getApplicabilityOptions"
  )(context, { ...extras, collaterals: extras.collaterals || collaterals }));
}

test("application applicability choices are the whole application, exact collaterals and existing tasks", () => {
  const options = getApplicabilityOptions("application", { collaterals, relatedTasks: tasks });
  assert.deepEqual(options.map(({ value }) => value), [
    "application::",
    "collateral::COL-1",
    "collateral::COL-2",
    "task::tsk-18112026-001",
    "task::tsk-18112026-002"
  ]);
  assert.deepEqual(options.map(({ label }) => label), [
    "Вся заявка",
    "Объект: VIN-001, Грузовой автомобиль",
    "Объект: 77:01:0001:42, Квартира",
    "Задача tsk-18112026-001",
    "Задача tsk-18112026-002"
  ]);
  assert.ok(options.every(({ label }) => !label.includes("Все объекты залога")));
});

test("task applicability choices contain current task, application and task collaterals in order", () => {
  const options = getApplicabilityOptions("task", { task: tasks[0], collaterals });
  assert.deepEqual(options.map(({ value }) => value), [
    "task::tsk-18112026-001",
    "application::",
    "collateral::COL-1",
    "collateral::COL-2"
  ]);
  assert.deepEqual(options.map(({ label }) => label), [
    "Текущая задача",
    "Вся заявка",
    "Объект: VIN-001, Грузовой автомобиль",
    "Объект: 77:01:0001:42, Квартира"
  ]);
  assert.ok(options.every(({ label }) => !label.includes("Все объекты залога")));
});

test("document and contact application option builders use the shared choice set", () => {
  const sharedOptions = getApplicabilityOptions("application", { collaterals, relatedTasks: tasks });
  const taskOptions = getApplicabilityOptions("task", { task: tasks[0], collaterals });
  const contactBuilder = extractFunction(
    "function getApplicationContactApplyOptions",
    "\nfunction getApplicabilityOptions",
    { getApplicabilityOptions: () => sharedOptions },
    "getApplicationContactApplyOptions"
  );
  const documentBuilder = extractFunction(
    "function getDocumentApplyOptions",
    "\nfunction renderDocumentRelationSelect",
    {
      getApplicabilityOptions: (context, params) => context === "task" ? taskOptions : sharedOptions,
      getTaskApplication: () => ({ id: "APP-1" })
    },
    "getDocumentApplyOptions"
  );
  assert.deepEqual(contactBuilder(collaterals, {}, tasks), sharedOptions);
  assert.deepEqual(documentBuilder("applicationDraft", "draft", null, collaterals, null, "COL-1", {}, tasks), sharedOptions);
  assert.deepEqual(documentBuilder("task", tasks[0].id, tasks[0], collaterals), taskOptions);
});

test("inspection applicability field renders the context's shared options", () => {
  const applicationOptions = getApplicabilityOptions("application", { collaterals, relatedTasks: tasks });
  const taskOptions = getApplicabilityOptions("task", { task: tasks[0], collaterals });
  const renderBlock = extractFunction(
    "function renderApplicationPreInspectionBlock",
    "\nfunction renderTaskApplicationPreInspectionBlock",
    {
      escapeHtml: (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"),
      getApplicabilityOptions: (context) => context === "task" ? taskOptions : applicationOptions
    },
    "renderApplicationPreInspectionBlock"
  );
  const preInspection = { completed: true, applyScope: "application", applyValue: "", mobileAppraiserLink: "", actFile: "" };
  const applicationHtml = renderBlock(preInspection, { application: {}, collaterals, relatedTasks: tasks });
  const taskHtml = renderBlock(preInspection, { readOnly: true, application: {}, task: tasks[0], collaterals });
  const applicationFieldOrder = [
    "application-preinspection-check",
    "application-preinspection-apply",
    "application-preinspection-link",
    "application-inspection-act-drop"
  ].map((marker) => applicationHtml.indexOf(marker));
  assert.ok(applicationFieldOrder.every((position) => position >= 0));
  assert.deepEqual([...applicationFieldOrder].sort((left, right) => left - right), applicationFieldOrder);
  assert.match(applicationHtml, /application-preinspection-apply\">\s*<span>Применяется к<\/span>\s*<select/);
  assert.match(applicationHtml, /application-preinspection-link\">\s*<span>Ссылка на мобильный оценщик<\/span>\s*<input/);
  assert.match(applicationHtml, /application-inspection-act-drop\">\s*<span>Акт осмотра<\/span>\s*<span class="application-inspection-act-control">/);
  for (const option of applicationOptions) assert.ok(applicationHtml.includes(`value="${option.value}"`));
  for (const option of taskOptions) assert.ok(taskHtml.includes(`value="${option.value}"`));
  assert.match(taskHtml, /<select[^>]*disabled/);
  assert.match(applicationHtml, /data-action="add-application-preinspection-row">Добавить строку/);
  assert.match(applicationHtml, /data-action="remove-application-preinspection-row"/);
  assert.doesNotMatch(taskHtml, /data-action="add-application-preinspection-row"|data-action="remove-application-preinspection-row"/);
  assert.doesNotMatch(applicationHtml, /Все объекты залога/);
  assert.doesNotMatch(taskHtml, /Все объекты залога/);
});

test("legacy all-collateral document binding expands to individual object choices", () => {
  const options = collaterals.map((collateral) => ({ value: `collateral::${collateral.id}`, label: collateral.description }));
  const getSelectedValues = extractFunction(
    "function getDocumentSelectedApplyValues",
    "\nfunction getDocumentExplicitTargetValues",
    {
      uniqueItems: (items) => [...new Set(items.filter(Boolean))],
      parseDocumentBinding: (value) => {
        const [scope, ...rest] = value.split("::");
        return { scope, value: scope === "application" ? "" : rest.join("::") };
      },
      getNormalizedDocumentBinding: (doc) => ({ scope: doc.applyScope, value: doc.applyValue }),
      getDocumentBindingValue: ({ applyScope, applyValue }) => `${applyScope}::${applyValue || ""}`,
      getDocumentExplicitTargetValues: () => [],
      getDocumentApplyOptionValueForTarget: () => "",
      getDocumentExplicitCollateralIds: () => []
    },
    "getDocumentSelectedApplyValues"
  );
  const selected = getSelectedValues({ applyScope: "collaterals", applyValue: "all" }, options);
  assert.deepEqual(selected, ["collateral::COL-1", "collateral::COL-2"]);
  assert.ok(selected.every((value) => options.some((option) => option.value === value)));
});

test("document relation keeps each selected task and collateral target", () => {
  const getRelation = extractFunction(
    "function getDocumentRelationFromSelectedValues",
    "\nfunction getDocumentDefaultBindingForContext",
    {
      uniqueItems: (items) => [...new Set(items.filter(Boolean))],
      parseDocumentBinding: (value) => {
        const [scope, ...rest] = value.split("::");
        return { scope, value: scope === "application" ? "" : rest.join("::") };
      },
      getDocumentBindingValue: ({ applyScope, applyValue }) => `${applyScope}::${applyValue || ""}`,
      getDocumentTargetIdsForBinding: (binding) => [binding.value || "application"],
      getDocumentStorageTarget: () => "task",
      getDocumentDefaultBindingForContext: () => ({ scope: "task", value: "task" }),
      splitDocumentCollateralBindingValue: (value) => value.split(",").filter(Boolean)
    },
    "getDocumentRelationFromSelectedValues"
  );
  const relation = getRelation([
    "application::",
    "task::tsk-18112026-001",
    "task::tsk-18112026-002",
    "collateral::COL-1"
  ], { docContext: "applicationDraft", docOwner: "draft", docTarget: "application" }, collaterals);
  assert.equal(relation.applyScope, "task");
  assert.equal(relation.applyValue, "tsk-18112026-002");
  assert.deepEqual(relation.targetIds, ["application", "tsk-18112026-001", "tsk-18112026-002", "COL-1"]);
  assert.deepEqual(relation.collateralIds, ["COL-1"]);
});

test("contact application is scoped to the selected task or exact collateral", () => {
  const applies = extractFunction(
    "function doesApplicationContactApplyToTarget",
    "\nfunction addApplicationContactRow",
    { normalizeApplicationContactRow: (contact) => contact },
    "doesApplicationContactApplyToTarget"
  );
  const task = { id: tasks[0].id };
  const collateral = collaterals[0];
  assert.equal(applies({ applyScope: "application" }, null, task, collateral), true);
  assert.equal(applies({ applyScope: "task", applyValue: task.id }, null, task, collateral), true);
  assert.equal(applies({ applyScope: "task", applyValue: tasks[1].id }, null, task, collateral), false);
  assert.equal(applies({ applyScope: "collateral", applyValue: collateral.id }, null, task, collateral), true);
  assert.equal(applies({ applyScope: "collateral", applyValue: collaterals[1].id }, null, task, collateral), false);
});

test("legacy contact links by pledgor normalize to an existing concrete collateral", () => {
  const normalize = extractFunction(
    "function getNormalizedApplicationContactBinding",
    "\nfunction normalizeApplicationContactBinding",
    {
      normalizeApplicationContactBinding: (scope, value) => ({ scope, value }),
      parseApplicationContactBinding: (value) => {
        const [scope, ...rest] = value.split("::");
        return { scope, value: rest.join("::") };
      },
      inferApplicationContactBindingFromCollateralIds: () => ({ scope: "application", value: "" })
    },
    "getNormalizedApplicationContactBinding"
  );
  assert.deepEqual(plain(normalize({ applyScope: "pledgor", applyValue: "770100001" }, ["COL-1", "COL-2"])), {
    scope: "collateral",
    value: "COL-1"
  });
});

test("pre-inspection visibility follows its application, task or collateral binding", () => {
  const applies = extractFunction(
    "function doesPreInspectionApplyToTask",
    "\nfunction getDraftApplicationPreInspection",
    { getTaskCollateralIds: (task) => task.collateralIds || [] },
    "doesPreInspectionApplyToTask"
  );
  const task = { id: tasks[0].id, collateralIds: ["COL-1"] };
  assert.equal(applies({ applyScope: "application" }, task), true);
  assert.equal(applies({ applyScope: "task", applyValue: task.id }, task), true);
  assert.equal(applies({ applyScope: "task", applyValue: tasks[1].id }, task), false);
  assert.equal(applies({ applyScope: "collateral", applyValue: "COL-1" }, task), true);
  assert.equal(applies({ applyScope: "collateral", applyValue: "COL-2" }, task), false);
});

test("multiple pre-inspection rows are filtered independently for each linked task", () => {
  const context = {
    isTruthyFlag: (value) => value === true || value === "true" || value === "ДА",
    getTaskApplication: (task) => task.application,
    getTaskCollateralIds: (task) => task.collateralIds || []
  };
  vm.runInNewContext(
    `${functionSource("function getApplicationPreInspection(application = {})", "\nfunction getDraftApplicationPreInspection")}\nglobalThis.getVisible = getTaskApplicationPreInspections;`,
    context
  );
  const application = { preInspections: [
    { completed: true, applyScope: "application", mobileAppraiserLink: "application-result" },
    { completed: true, applyScope: "task", applyValue: tasks[0].id, mobileAppraiserLink: "task-one-result" },
    { completed: true, applyScope: "task", applyValue: tasks[1].id, mobileAppraiserLink: "task-two-result" },
    { completed: true, applyScope: "collateral", applyValue: "COL-1", mobileAppraiserLink: "vehicle-result" },
    { completed: true, applyScope: "collateral", applyValue: "COL-2", mobileAppraiserLink: "property-result" }
  ] };
  const visible = context.getVisible({ ...tasks[0], application, collateralIds: ["COL-1"] });
  assert.deepEqual(plain(visible).map((record) => record.mobileAppraiserLink), [
    "application-result", "task-one-result", "vehicle-result"
  ]);
});

test("legacy singleton pre-inspection is read as a one-row list", () => {
  const normalize = extractFunction(
    "function getApplicationPreInspection(application = {})",
    "\nfunction getTaskApplicationPreInspection",
    { isTruthyFlag: (value) => value === true || value === "true" },
    "getApplicationPreInspectionRecords"
  );
  const records = plain(normalize({ preInspection: {
    completed: true,
    applyScope: "task",
    applyValue: tasks[0].id,
    mobileAppraiserLink: "https://mobile.example/old"
  } }));
  assert.equal(records.length, 1);
  assert.equal(records[0].completed, true);
  assert.equal(records[0].applyValue, tasks[0].id);
  assert.equal(records[0].mobileAppraiserLink, "https://mobile.example/old");
});

test("add and remove inspection rows preserve at least one independent row", () => {
  const state = { newTask: { applicationPreInspections: [
    { completed: true, mobileAppraiserLink: "first" },
    { completed: false, mobileAppraiserLink: "second" }
  ] } };
  const context = {
    state,
    getDraftApplicationPreInspections: () => state.newTask.applicationPreInspections,
    createApplicationPreInspectionRow: () => ({ completed: false, mobileAppraiserLink: "", applyScope: "application", applyValue: "" }),
    syncLegacyApplicationPreInspectionDraft: () => {},
    addToast: () => {}
  };
  vm.runInNewContext(
    `${functionSource("function addApplicationPreInspectionRow", "\nfunction syncLegacyApplicationPreInspectionDraft")}\nglobalThis.add = addApplicationPreInspectionRow; globalThis.remove = removeApplicationPreInspectionRow;`,
    context
  );
  context.add();
  assert.equal(state.newTask.applicationPreInspections.length, 3);
  context.remove(1);
  assert.deepEqual(state.newTask.applicationPreInspections.map((row) => row.mobileAppraiserLink), ["first", ""]);
  context.remove(0);
  assert.equal(state.newTask.applicationPreInspections.length, 1);
  assert.equal(state.newTask.applicationPreInspections[0].completed, false);
});

test("inspection fields and act uploads update only the selected row", () => {
  const state = { newTask: { applicationPreInspections: [
    { completed: true, mobileAppraiserLink: "first", actFile: "first.pdf", recordedAt: "yesterday" },
    { completed: false, mobileAppraiserLink: "second", actFile: "", recordedAt: "" }
  ] } };
  const context = {
    state,
    getDraftApplicationPreInspections: () => state.newTask.applicationPreInspections,
    parseDocumentBinding: (value) => {
      const [scope, ...parts] = value.split("::");
      return { scope, value: parts.join("::") };
    },
    formatTaskHistoryDate: () => "today",
    syncLegacyApplicationPreInspectionDraft: () => {},
    addToast: () => {}
  };
  vm.runInNewContext(
    `${functionSource("function updateApplicationPreInspectionField", "\nfunction renderApplicationPreInspectionBlock")}\n${functionSource("function attachApplicationInspectionAct", "\nfunction ensureNewApplicationDraft")}\nglobalThis.update = updateApplicationPreInspectionField; globalThis.attach = attachApplicationInspectionAct;`,
    context
  );
  context.update({ dataset: { index: "1", applicationPreinspectionField: "mobileAppraiserLink" }, value: "second-updated" });
  context.update({ dataset: { index: "1", applicationPreinspectionField: "applyBinding" }, value: "collateral::COL-2" });
  context.attach({ dataset: { index: "1" }, files: [{ name: "second-act.pdf" }] });
  assert.equal(state.newTask.applicationPreInspections[0].mobileAppraiserLink, "first");
  assert.equal(state.newTask.applicationPreInspections[0].actFile, "first.pdf");
  assert.equal(state.newTask.applicationPreInspections[1].mobileAppraiserLink, "second-updated");
  assert.equal(state.newTask.applicationPreInspections[1].applyValue, "COL-2");
  assert.equal(state.newTask.applicationPreInspections[1].actFile, "second-act.pdf");
  assert.equal(state.newTask.applicationPreInspections[1].completed, true);
  assert.equal(state.newTask.applicationPreInspections[1].recordedAt, "today");
});

test("a saved pre-inspection target remains authoritative before result fields are filled", () => {
  const context = {
    isTruthyFlag: (value) => value === true || value === "true" || value === "ДА",
    getTaskApplication: (task) => task.application,
    getTaskCollateralIds: (task) => task.collateralIds || []
  };
  vm.runInNewContext(
    `${functionSource("function getApplicationPreInspection(application = {})", "\nfunction getDraftApplicationPreInspection")}\nglobalThis.preInspection = getTaskApplicationPreInspection;`,
    context
  );
  const preInspection = context.preInspection;
  const application = { preInspection: { applyScope: "task", applyValue: tasks[0].id } };
  const matching = preInspection({ id: tasks[0].id, application });
  const unrelated = preInspection({ id: tasks[1].id, application });
  assert.equal(matching.applyScope, "task");
  assert.equal(matching.applyValue, tasks[0].id);
  assert.equal(matching.visible, true);
  assert.equal(unrelated.visible, false);
});

test("valuation prefill matches task bindings and exact collateral panels", () => {
  const context = {
    isTruthyFlag: (value) => value === true || value === "true" || value === "ДА",
    getTaskApplication: (task) => task.application,
    getTaskCollateralIds: (task) => task.collateralIds || [],
    findRelatedInspectionTaskForValuation: () => null,
    getInspectionResult: () => ({}),
    getInspectionProblemChecklistRows: () => [],
    getInspectionResolutionResultValue: () => "",
    getInspectionConditionAssessmentValue: () => "",
    getInspectionPhysicalWearPercentValue: () => "",
    getInspectionResolutionCommentValue: () => "",
    getApplicationPreInspectionValuationComment: () => ""
  };
  vm.runInNewContext(
    `${functionSource("function getValuationInspectionPrefill", "\nfunction getApplicationPreInspectionValuationComment")}\n${functionSource("function getApplicationPreInspection(application = {})", "\nfunction getDraftApplicationPreInspection")}\nglobalThis.prefill = getValuationInspectionPrefill;`,
    context
  );
  const prefill = context.prefill;
  const application = { preInspection: {
    completed: true,
    applyScope: "task",
    applyValue: tasks[0].id,
    mobileAppraiserLink: "https://mobile.example/inspection/1",
    actFile: "inspection-act.pdf"
  } };
  const matchingTask = { ...tasks[0], application, collateralIds: ["COL-1"] };
  const unrelatedTask = { ...tasks[1], application, collateralIds: ["COL-1"] };
  const matching = prefill(matchingTask, collaterals[0]);
  const unrelated = prefill(unrelatedTask, collaterals[0]);

  assert.equal(matching.applicationInspection.mobileAppraiserLink, application.preInspection.mobileAppraiserLink);
  assert.equal(matching.completed, "ДА");
  assert.equal(unrelated.applicationInspection, null);
  assert.equal(unrelated.completed, "НЕТ");

  application.preInspection.applyScope = "collateral";
  application.preInspection.applyValue = "COL-1";
  const multiCollateralTask = { ...matchingTask, collateralIds: ["COL-1", "COL-2"] };
  assert.equal(prefill(multiCollateralTask, collaterals[0]).applicationInspection.actFile, "inspection-act.pdf");
  assert.equal(prefill(multiCollateralTask, collaterals[1]).applicationInspection, null);
  assert.equal(prefill({ ...matchingTask, collateralIds: ["COL-2"] }, collaterals[1]).applicationInspection, null);
  application.preInspection.applyValue = "COL-2";
  assert.equal(prefill(multiCollateralTask, collaterals[0]).applicationInspection, null);
  assert.equal(prefill(multiCollateralTask, collaterals[1]).applicationInspection.actFile, "inspection-act.pdf");

  application.preInspections = [
    { completed: true, applyScope: "collateral", applyValue: "COL-2", actFile: "other-act.pdf" },
    { completed: true, applyScope: "collateral", applyValue: "COL-1", actFile: "matching-act.pdf" }
  ];
  assert.equal(prefill(multiCollateralTask, collaterals[0]).applicationInspection.actFile, "matching-act.pdf");
  assert.equal(prefill(multiCollateralTask, collaterals[1]).applicationInspection.actFile, "other-act.pdf");
});

test("saving an application normalizes a legacy all-collateral document without editing its selector", () => {
  const application = {
    id: "APP-1",
    number: "app-18112026-001",
    status: "В работе",
    documents: []
  };
  const legacy = {
    title: "Выписка",
    applyScope: "collaterals",
    applyValue: "all",
    target: "COL-1",
    targetIds: ["COL-1", "COL-2"],
    collateralIds: ["COL-1", "COL-2"]
  };
  const context = {
    state: { newTask: { selectedCollateralIds: ["COL-1", "COL-2"], documents: [legacy] } },
    window: { location: { hash: "" } },
    uniqueItems: (items) => [...new Set(items.filter(Boolean))],
    getApplication: () => application,
    getApplicationInitiatorSegment: () => "Корпоративный",
    getApplicationClientName: () => "ООО Тест",
    getApplicationInn: () => "7701000000",
    getApplicationType: () => "Оценка",
    getApplicationSubtype: () => "Первичная",
    getApplicationPurpose: () => "Принятие залога",
    getRole: () => ({ user: "Инициатор" }),
    getApplicationParameterValidation: () => ({}),
    showApplicationValidationToast: () => false,
    getCollateral: (id) => collaterals.find((item) => item.id === id),
    getApplicationPledgeContractOptions: () => [],
    normalizeApplicationDealsForSave: () => [],
    getDraftApplicationDeals: () => [],
    getContract: () => null,
    parseNumericInput: () => 0,
    getSerializableApplicationContacts: () => [],
    getDraftApplicationPreInspectionPayloads: () => [
      { applyScope: "application", applyValue: "", mobileAppraiserLink: "first-result" },
      { applyScope: "collateral", applyValue: "COL-2", actFile: "second-act.pdf" }
    ],
    getApplicationTasks: () => [],
    getApplicabilityOptions: () => [
      { value: "application::", label: "Вся заявка" },
      { value: "collateral::COL-1", label: "Объект: VIN-001" },
      { value: "collateral::COL-2", label: "Объект: квартира" }
    ],
    persistTaskState: () => {},
    getApplicationCardRoute: (item) => `/app/applications/${item.id}`,
    addToast: () => {}
  };
  const documentFunctions = [
    functionSource("function getDocumentSelectedApplyValues", "\nfunction normalizeDocumentTypeLabel"),
    functionSource("function normalizeDocumentTarget", "\nfunction getPrimaryDocumentTarget"),
    functionSource("function getDocumentRelationFromSelectedValues", "\nfunction updateDocumentApplyFilter"),
    functionSource("function getDocumentTargetIdsForBinding", "\nfunction deleteDocument"),
    functionSource("function saveApplicationCard", "\nfunction submitNewTask")
  ].join("\n");
  vm.runInNewContext(`${documentFunctions}\nglobalThis.save = saveApplicationCard;`, context);
  context.save("APP-1");

  assert.equal(application.preInspection.mobileAppraiserLink, "first-result");
  assert.equal(application.preInspections.length, 2);
  assert.equal(application.preInspections[1].applyValue, "COL-2");
  assert.equal(application.preInspections[1].actFile, "second-act.pdf");
  const savedDocument = application.documents[0];
  assert.equal(savedDocument.applyScope, "collaterals");
  assert.equal(savedDocument.applyValue, "COL-1,COL-2");
  assert.deepEqual(plain(savedDocument.targetIds), ["COL-1", "COL-2"]);
  assert.deepEqual(plain(savedDocument.collateralIds), ["COL-1", "COL-2"]);
  assert.equal(savedDocument.applyAllCollaterals, false);
  assert.equal(legacy.applyValue, "all", "save persists normalized copy without mutating the source document");
});
