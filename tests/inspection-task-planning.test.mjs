import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function extract(name, nextName) {
  const start = app.indexOf(`function ${name}(`);
  const end = app.indexOf(`\nfunction ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `${name} source must exist`);
  return app.slice(start, end);
}

function run(source, context, exportNames) {
  vm.runInNewContext(`${source}\n${exportNames.map((name) => `globalThis.${name} = ${name};`).join("\n")}`, context);
  return context;
}

const inspectionPredicateSource = [
  extract("normalizeTaskType", "isInspectionTaskType"),
  extract("isInspectionTaskType", "isPhysicalInspectionVisitTask"),
  extract("isPhysicalInspectionVisitTask", "isInspectionCardTaskType"),
  extract("isMobileInspectionTaskType", "getInspectionFormat"),
  extract("getInspectionFormat", "isDocumentaryInspectionTask"),
  extract("isDocumentaryInspectionTask", "isMonitoringTaskType"),
  extract("isMonitoringTaskType", "isRevaluationTaskType")
].join("\n");

test("physical task header shows one method for the whole task", () => {
  const titleStart = app.indexOf("function getTaskHeaderTitle(");
  const titleEnd = app.indexOf("\nconst TASK_CARD_OPTIONAL_BLOCKS", titleStart);
  const context = run(
    `${inspectionPredicateSource}\n${app.slice(titleStart, titleEnd)}\n${extract("getInspectionVisitMethodHeadingValue", "getInspectionPlan")}`,
    {
      getTaskApplicationSubtypeValue: () => "",
      getTaskDisplayType: () => "Физический осмотр",
      getInspectionVisitMethod: (task) => task.inspectionVisitMethod
    },
    ["getTaskHeaderTitle"]
  );
  assert.equal(context.getTaskHeaderTitle({ id: "s-1126-0007", type: "Первичный осмотр", inspectionVisitMethod: "Мобильный оценщик (МО)" }), "s-1126-0007 - Физический осмотр: Мобильный оценщик");
  assert.equal(context.getTaskHeaderTitle({ id: "s-1126-0008", type: "Первичный осмотр", inspectionVisitMethod: "" }), "s-1126-0008 - Физический осмотр: [уточнить способ]");
});

test("main task information no longer renders inspection planning and monitoring has no method suffix", () => {
  const titleStart = app.indexOf("function getTaskHeaderTitle(");
  const titleEnd = app.indexOf("\nconst TASK_CARD_OPTIONAL_BLOCKS", titleStart);
  const context = run(`${inspectionPredicateSource}\n${app.slice(titleStart, titleEnd)}`, {
    getTaskApplicationSubtypeValue: () => "",
    getTaskDisplayType: (task) => task.type,
    getInspectionVisitMethod: () => "Мобильный оценщик (МО)",
  }, ["getTaskHeaderTitle"]);
  const monitoringTask = { id: "tsk-monitor", type: "Плановый мониторинг" };
  const unplannedMonitoringTask = { id: "tsk-monitor-2", type: "Внеплановый мониторинг" };
  assert.equal(context.isInspectionTaskType(monitoringTask.type), false);
  assert.equal(context.isInspectionTaskType(unplannedMonitoringTask.type), false);
  assert.equal(context.getTaskHeaderTitle(monitoringTask), "tsk-monitor - Плановый мониторинг");
  const mainTabStart = app.indexOf('class="task-detail-main task-tab-main"');
  const mainTabEnd = app.indexOf("function renderTaskMainInspectionContactsGroup", mainTabStart);
  assert.ok(mainTabStart >= 0 && mainTabEnd > mainTabStart);
  assert.doesNotMatch(app.slice(mainTabStart, mainTabEnd), /renderTaskMainInspectionPlanning|renderInspectionPlanningPanel/);
});

test("inspection plan reads individual date/address only when enabled and keeps one task method", () => {
  const context = run(
    extract("getInspectionPlan", "getInspectionReportFields"),
    {
      getTaskCollaterals: () => [{ id: "COL-1", address: "Новосибирск, ул. Ленина, 1" }],
      getInspectionVisitMethod: (task) => task.inspectionVisitMethod
    },
    ["getInspectionPlan"]
  );
  const task = {
    inspectionVisitDate: "2026-11-24",
    inspectionVisitTime: "10:00",
    inspectionVisitMethod: "Мобильный оценщик (МО)",
    inspectionPlanByCollateral: { "COL-1": { enabled: true, dateTime: "2026-11-25T12:30", address: "Индивидуальный адрес" } }
  };
  const collateral = { id: "COL-1", address: "Новосибирск, ул. Ленина, 1" };
  assert.deepEqual(JSON.parse(JSON.stringify(context.getInspectionPlan(task, collateral, false))), {
    dateTime: "2026-11-24T10:00",
    address: "Новосибирск, ул. Ленина, 1",
    method: "Мобильный оценщик (МО)",
    executor: ""
  });
  assert.deepEqual(JSON.parse(JSON.stringify(context.getInspectionPlan(task, collateral, true))), {
    dateTime: "2026-11-25T12:30",
    address: "Индивидуальный адрес",
    method: "Мобильный оценщик (МО)",
    executor: ""
  });
  task.inspectionPlanByCollateral["COL-1"].enabled = false;
  assert.equal(context.getInspectionPlan(task, collateral, true).method, "Мобильный оценщик (МО)");
  assert.equal(context.getInspectionPlan(task, collateral, true).address, "Новосибирск, ул. Ленина, 1");
});

test("one factual-parameters renderer is shared by task and object scopes", () => {
  const source = extract("renderInspectionActualParametersPanel", "hasIndividualInspectionParameters");
  const captured = {};
  const context = run(source, {
    escapeHtml: (value) => String(value ?? ""),
    getTaskCollaterals: () => [{ id: "COL-1" }],
    ensureInspectionActualIndividualModel: () => {},
    getInspectionActualParameters: () => ({ dateTime: "2026-11-24T10:00", address: "Общий адрес", executor: "Мария Петрова" }),
    hasIndividualInspectionParameters: (task, collateral) => Boolean(task.inspectionActualByCollateral?.[collateral.id]?.enabled),
    getInspectionActualParametersForCollateral: (task, collateral, common) => task.inspectionActualByCollateral?.[collateral.id] || common,
    renderTaskFormGrid: (fields, className) => { captured[className] = fields; return "<" + className + "></" + className + ">"; }
  }, ["renderInspectionActualParametersPanel"]);
  const task = { id: "tsk-1", inspectionActualByCollateral: {} };
  const collateral = { id: "COL-1" };
  const grid = "task-form-grid compact inspection-actual-parameters-grid";

  const taskHtml = context.renderInspectionActualParametersPanel(task, [{ id: "COL-1" }]);
  assert.match(taskHtml, /Фактические параметры осмотра/);
  assert.doesNotMatch(taskHtml, /data-inspection-actual-individual-toggle/);
  assert.deepEqual(JSON.parse(JSON.stringify(captured[grid].map(({ label, readonly }) => [label, Boolean(readonly)]))), [
    ["Дата и время посещения", false],
    ["Адрес проведения осмотра", false],
    ["Исполнитель выезда", false]
  ]);

  const inheritedHtml = context.renderInspectionActualParametersPanel(task, [{ id: "COL-1" }], { scope: "collateral", collateral });
  assert.match(inheritedHtml, /data-inspection-actual-individual-toggle/);
  assert.match(inheritedHtml, /Задать индивидуальные параметры/);
  assert.doesNotMatch(inheritedHtml, /Способ проведения осмотра|Запустить выездной осмотр/);
  assert.deepEqual(JSON.parse(JSON.stringify(captured[grid].map(({ label, readonly }) => [label, Boolean(readonly)]))), [
    ["Дата и время посещения", true],
    ["Адрес проведения осмотра", true],
    ["Исполнитель выезда", true]
  ]);

  task.inspectionActualByCollateral["COL-1"] = { enabled: true, address: "Индивидуальный адрес" };
  context.renderInspectionActualParametersPanel(task, [{ id: "COL-1" }], { scope: "collateral", collateral });
  assert.deepEqual(JSON.parse(JSON.stringify(captured[grid].map(({ label, readonly }) => [label, Boolean(readonly)]))), [
    ["Дата и время посещения", false],
    ["Адрес проведения осмотра", false],
    ["Исполнитель выезда", false]
  ]);
  assert.doesNotMatch(app, /Информационный блок осмотра/);
});

test("mobile field visit launch action is absent from the task header", () => {
  const context = run(extract("renderTaskHeaderActions", "getTaskHeaderTitle"), {
    isTaskClosed: () => false,
    isManagerRole: () => false,
    getTaskDirection: () => "inspection",
    getTaskDirectionConfig: () => ({ path: "#tasks" }),
    canTakeTaskToWork: () => false,
    canDeferTask: () => false,
    canCompleteTask: () => false,
    getTaskRouteActionButtons: () => [],
    isPhysicalInspectionVisitTask: () => true,
    getInspectionVisitMethod: (task) => task.inspectionVisitMethod,
    getTaskCollaterals: () => [{ id: "COL-1" }],
    isTaskCollateralExcluded: () => false,
    escapeHtml: (value) => String(value ?? ""),
    getTaskApplication: () => null
  }, ["renderTaskHeaderActions"]);
  const mobile = context.renderTaskHeaderActions({ id: "tsk-1", type: "Первичный осмотр", inspectionVisitMethod: "Мобильный оценщик (МО)" });
  const surveyor = context.renderTaskHeaderActions({ id: "tsk-2", type: "Первичный осмотр", inspectionVisitMethod: "Сюрвейер (СК)" });
  assert.doesNotMatch(mobile, /data-action="launch-task-field-inspection"|Запустить выездной осмотр/);
  assert.doesNotMatch(surveyor, /data-action="launch-task-field-inspection"|Запустить выездной осмотр/);
});

test("individual factual parameters migrate legacy plans and reset to task values", () => {
  const helperSource = [
    extract("ensureInspectionActualIndividualModel", "hasIndividualInspectionParameters"),
    extract("toggleInspectionActualIndividual", "updateInspectionGeneralResultField")
  ].join("\n");
  const task = {
    id: "s-1126-0001",
    collateralIds: ["COL-1", "COL-2"],
    inspectionActual: { dateTime: "2026-11-24T10:00", address: "Общий адрес", executor: "Общий исполнитель" },
    inspectionPlanByCollateral: {
      "COL-1": { enabled: true, dateTime: "2026-11-25T11:00", address: "Старый индивидуальный адрес", executor: "Исполнитель 1" }
    }
  };
  const context = run(helperSource, {
    getTask: () => task,
    getCollateral: () => ({ id: "COL-1" }),
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    isTaskCollateralExcluded: () => false,
    getInspectionActualParameters: () => task.inspectionActual,
    getInspectionPlan: () => ({ dateTime: "2026-11-24T10:00", address: "Общий адрес", executor: "Общий исполнитель" }),
    persistTaskState: () => {}
  }, ["ensureInspectionActualIndividualModel", "toggleInspectionActualIndividual"]);
  context.ensureInspectionActualIndividualModel(task, [{ id: "COL-1" }, { id: "COL-2" }]);
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionActualByCollateral["COL-1"])), {
    enabled: true,
    dateTime: "2026-11-25T11:00",
    address: "Старый индивидуальный адрес",
    executor: "Исполнитель 1"
  });
  context.toggleInspectionActualIndividual(task.id, "COL-1", false);
  assert.equal(task.inspectionActualByCollateral["COL-1"], undefined);
  assert.equal(task.inspectionPlanByCollateral["COL-1"].enabled, false);
  assert.equal(task.inspectionActual.address, "Общий адрес");
});

test("common and individual factual edits update only their matching scope", () => {
  const context = run(extract("updateInspectionActualField", "toggleInspectionActualIndividual"), {
    getTask: () => task,
    getTaskCollaterals: () => [{ id: "COL-1" }],
    isTaskCollateralExcluded: () => false,
    ensureInspectionActualOverrideModel: (value) => { value.inspectionActualOverrides = value.inspectionActualOverrides || {}; },
    persistTaskState: () => {}
  }, ["updateInspectionActualField"]);
  const task = {
    id: "s-1126-0001",
    inspectionActualByCollateral: { "COL-1": { enabled: true, dateTime: "2026-11-24T10:00", address: "Общий адрес", executor: "Общий исполнитель" } },
    inspectionPlanByCollateral: { "COL-1": { enabled: true } },
    inspectionActual: { address: "Общий адрес" },
    fieldInspectionResults: { "COL-1": { completedAt: "2026-11-24T10:00:00", address: "Общий адрес", executor: "Общий исполнитель" } }
  };

  context.updateInspectionActualField({
    dataset: { task: task.id, collateral: "COL-1", inspectionActualScope: "collateral", inspectionActualField: "address" },
    value: "Индивидуальный адрес"
  });
  assert.equal(task.inspectionActualByCollateral["COL-1"].address, "Индивидуальный адрес");
  assert.equal(task.inspectionPlanByCollateral["COL-1"].address, "Индивидуальный адрес");
  assert.equal(task.fieldInspectionResults["COL-1"].address, "Индивидуальный адрес");
  assert.equal(task.inspectionActual.address, "Общий адрес");

  context.updateInspectionActualField({
    dataset: { task: task.id, inspectionActualScope: "task", inspectionActualField: "executor" },
    value: "Новый общий исполнитель"
  });
  assert.equal(task.inspectionActual.executor, "Новый общий исполнитель");
  assert.equal(task.inspectionPlan.executor, "Новый общий исполнитель");
  assert.equal(task.inspectionActualByCollateral["COL-1"].executor, "Общий исполнитель");
});

test("common launch creates object results for non-excluded objects with task-level history", () => {
  const start = app.indexOf("function launchTaskFieldInspection(");
  const end = app.indexOf("\nfunction launchFieldInspection", start);
  const task = { id: "tsk-1", inspectionVisitMethod: "Мобильный оценщик (МО)", status: "В работе" };
  const calls = [];
  const history = [];
  const context = run(app.slice(start, end), {
    getTask: () => task,
    getInspectionVisitMethod: () => "Мобильный оценщик (МО)",
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }, { id: "COL-3" }],
    isTaskCollateralExcluded: (_task, id) => id === "COL-2",
    launchFieldInspection: (...args) => calls.push(args),
    addTaskHistoryEvent: (_task, event) => history.push(event),
    addToast: () => {},
    persistTaskState: () => {}
  }, ["launchTaskFieldInspection"]);
  context.launchTaskFieldInspection("tsk-1");
  assert.deepEqual(calls.map((call) => [call[1], call[2].recordHistory]), [["COL-1", false], ["COL-3", false]]);
  assert.equal(history.length, 2);
  assert.match(history[0].comment, /2 объектов/);
  assert.match(history[1].comment, /2 объектам/);
});

test("unknown physical inspection method stays blank instead of being inferred from collateral type", () => {
  const context = run(extract("getInspectionVisitMethod", "getInspectionVisitMethodHeadingValue"), {
    INSPECTION_VISIT_METHOD_OPTIONS: ["Сюрвейер (СК)", "Мобильный оценщик (МО)"],
    INSPECTION_VISIT_METHOD_WHITE_LIST: "«Белый список»",
    isDocumentaryInspectionTask: () => false,
    getTaskCollaterals: () => [{ type: "Автотранспорт" }]
  }, ["getInspectionVisitMethod"]);
  assert.equal(context.getInspectionVisitMethod({ type: "Первичный осмотр" }), "");
});

test("factual task parameters do not substitute the first object's values when visits differ", () => {
  const functions = [
    extract("getInspectionPlan", "getInspectionReportFields"),
    extract("getInspectionActualParameters", "ensureInspectionActualOverrideModel"),
    extract("ensureInspectionActualOverrideModel", "formatInspectionDateTimeInput"),
    extract("formatInspectionDateTimeInput", "updateInspectionActualField")
  ].join("\n");
  const context = run(functions, {
    getTaskCollaterals: (task) => task.collateralIds.map((id) => ({ id })),
    getInspectionVisitMethod: (task) => task.inspectionVisitMethod || "",
    isTaskCollateralExcluded: () => false,
    getCollateralObjectIdentifier: (collateral) => collateral.id,
    persistTaskState: () => {}
  }, ["getInspectionActualParameters"]);
  const task = {
    collateralIds: ["COL-1", "COL-2"],
    inspectionActual: { dateTime: "2026-11-24T10:00", address: "Первый адрес", method: "Мобильный оценщик (МО)", executor: "Исполнитель 1" },
    inspectionActualSource: "automatic",
    fieldInspectionResults: {
      "COL-1": { completedAt: "2026-11-24T10:00:00", address: "Первый адрес", method: "Мобильный оценщик (МО)", executor: "Исполнитель 1" },
      "COL-2": { completedAt: "2026-11-24T10:00:00", address: "Второй адрес", method: "Мобильный оценщик (МО)", executor: "Исполнитель 2" }
    }
  };
  const actual = context.getInspectionActualParameters(task, [{ id: "COL-1" }, { id: "COL-2" }]);
  assert.equal(actual.dateTime, "2026-11-24T10:00");
  assert.equal(actual.method, "Мобильный оценщик (МО)");
  assert.equal(actual.address, "");
  assert.equal(actual.executor, "");
  assert.deepEqual(JSON.parse(JSON.stringify(actual.differences.map(({ label, groups }) => [label, groups.map(({ value, collaterals }) => [value, collaterals])]))), [
    ["Адрес проведения осмотра", [["Первый адрес", ["COL-1"]], ["Второй адрес", ["COL-2"]]]],
    ["Фактический исполнитель выезда", [["Исполнитель 1", ["COL-1"]], ["Исполнитель 2", ["COL-2"]]]]
  ]);
});

test("shared factual parameters fall back to the saved visit plan before any visit result exists", () => {
  const functions = [
    extract("getInspectionPlan", "getInspectionReportFields"),
    extract("getInspectionActualParameters", "ensureInspectionActualOverrideModel"),
    extract("ensureInspectionActualOverrideModel", "formatInspectionDateTimeInput"),
    extract("formatInspectionDateTimeInput", "updateInspectionActualField")
  ].join("\n");
  const context = run(functions, {
    getTaskCollaterals: () => [{ id: "COL-1", address: "Новосибирск, ул. Ленина, 1" }],
    getInspectionVisitMethod: (task) => task.inspectionVisitMethod || "",
    isTaskCollateralExcluded: () => false,
    getCollateralObjectIdentifier: (collateral) => collateral.id,
    persistTaskState: () => {}
  }, ["getInspectionActualParameters"]);
  const task = {
    inspectionVisitDate: "2026-11-24",
    inspectionVisitTime: "10:00",
    inspectionVisitAddress: "Новосибирск, ул. Ленина, 1",
    inspectionVisitExecutor: "Мария Петрова"
  };
  const actual = context.getInspectionActualParameters(task, [{ id: "COL-1", address: task.inspectionVisitAddress }]);
  assert.equal(actual.dateTime, "2026-11-24T10:00");
  assert.equal(actual.address, "Новосибирск, ул. Ленина, 1");
  assert.equal(actual.executor, "Мария Петрова");
});

test("a new mobile visit recomputes actuals and preserves legacy manual field overrides", () => {
  const task = {
    id: "s-1126-0001",
    collateralIds: ["COL-1", "COL-2"],
    inspectionVisitMethod: "Мобильный оценщик (МО)",
    inspectionActualSource: "automatic",
    inspectionActual: { address: "Ручная сводная правка", executor: "Исполнитель 1" },
    fieldInspectionResults: {
      "COL-1": { completedAt: "2026-11-24T10:00:00", address: "Первый адрес", method: "Мобильный оценщик (МО)", executor: "Исполнитель 1" }
    }
  };
  const newVisit = { completedAt: "2026-11-24T10:00:00", address: "Второй адрес", method: "Мобильный оценщик (МО)", executor: "Исполнитель 2" };
  const functions = [
    extract("launchFieldInspection", "buildFieldInspectionResult"),
    extract("getInspectionActualParameters", "ensureInspectionActualOverrideModel"),
    extract("ensureInspectionActualOverrideModel", "formatInspectionDateTimeInput"),
    extract("formatInspectionDateTimeInput", "updateInspectionActualField")
  ].join("\n");
  const context = run(functions, {
    getTask: () => task,
    getCollateral: (id) => ({ id }),
    normalizeInspectionVisitMethod: (value) => value,
    getInspectionVisitMethod: (value) => value.inspectionVisitMethod,
    isTaskCollateralExcluded: () => false,
    getInspectionPlan: () => ({ address: "Второй адрес", executor: "Исполнитель 2" }),
    addTaskHistoryEvent: () => {},
    buildFieldInspectionResult: () => newVisit,
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    getCollateralObjectIdentifier: (collateral) => collateral.id,
    fillFieldInspectionPhotos: () => {},
    upsertFieldInspectionActDocument: () => {},
    addToast: () => {},
    persistTaskState: () => {}
  }, ["launchFieldInspection"]);
  context.launchFieldInspection(task.id, "COL-2", { silent: true, recordHistory: false });
  assert.equal(task.inspectionActual.address, "Ручная сводная правка");
  assert.equal(task.inspectionActual.executor, "");
  assert.equal(task.inspectionActual.method, "Мобильный оценщик (МО)");
});

test("exception repeaters use the same individual result stored for each collateral", () => {
  const methods = [
    extract("getInspectionActiveCollaterals", "renderInspectionGeneralResultPanel"),
    extract("ensureInspectionResultModel", "addInspectionExceptionRow"),
    extract("addInspectionExceptionRow", "removeInspectionExceptionRow"),
    extract("setIndividualInspectionResult", "updateInspectionExceptionField"),
    extract("updateInspectionExceptionField", "getTaskExpertAttachment"),
    extract("getInspectionResolutionOverrides", "getInspectionConditionAssessmentOptions")
  ].join("\n");
  const task = { id: "tsk-1", collateralIds: ["COL-1"] };
  const context = run(methods, {
    state: { taskActiveCollateral: { "tsk-1": "COL-1" } },
    getTask: () => task,
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    getInspectionActiveCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    isTaskCollateralExcluded: () => false,
    getCollateralChoiceLabel: (collateral) => collateral.id,
    getCollateralObjectIdentifier: (collateral) => collateral.id,
    getInspectionVisitMethod: () => "",
    INSPECTION_VISIT_METHOD_OPTIONS: [],
    getInspectionResolutionResultOptions: () => ["Положительный", "Отрицательный", "Осмотр не проведен"],
    persistTaskState: () => {}
  }, ["addInspectionExceptionRow", "removeInspectionExceptionRow", "updateInspectionExceptionField", "useGeneralInspectionResult", "hasIndividualInspectionResult"]);
  context.addInspectionExceptionRow("tsk-1");
  assert.equal(task.inspectionResolutions["COL-1"].individualResult, true);
  context.updateInspectionExceptionField({
    dataset: { task: "tsk-1", collateral: "COL-1", inspectionExceptionField: "resolutionResult" },
    value: "Отрицательный"
  });
  assert.equal(task.inspectionResolutions["COL-1"].resolutionResult, "Отрицательный");
  context.removeInspectionExceptionRow("tsk-1", "COL-1");
  assert.equal(task.inspectionResolutions["COL-1"], undefined);
  assert.equal(context.hasIndividualInspectionResult(task, { id: "COL-1" }), false);
});

test("inspection expert conclusion orders factual parameters, common result, exceptions, then conclusion", () => {
  const conclusionStart = app.indexOf("function renderTaskExpertConclusion(");
  const conclusionEnd = app.indexOf("\nfunction renderInspectionActualParametersPanel", conclusionStart);
  const context = run(`${inspectionPredicateSource}\n${app.slice(conclusionStart, conclusionEnd)}`, {
    getTaskCollaterals: () => [],
    getTaskApplicationSubtypeValue: () => "",
    getTaskExpertDefaults: () => ({ result: "Положительное", comment: "", conclusion: "" }),
    getSelectedTaskExpertTemplate: () => ({ name: "Осмотр" }),
    getTaskExpertConclusionOutcome: () => "Положительное",
    canGenerateTaskExpertConclusion: () => false,
    getTaskExpertAttachment: () => null,
    isPledgeOperationTaskType: () => false,
    getTaskPrintResultOptions: () => [],
    getInspectionTaskExpertConclusionOutcome: () => "Положительное",
    renderInspectionActualParametersPanel: () => "<h2>Фактические параметры осмотра</h2>",
    renderInspectionGeneralResultPanel: () => "<h2>Общий результат осмотра</h2>",
    renderInspectionExceptionsPanel: () => "<h2>Исключения по объектам</h2>",
    renderTaskFormGrid: () => "",
    renderTaskExpertAttachmentRow: () => "",
    getRole: () => ({ user: "Исполнитель" }),
    escapeHtml: (value) => String(value ?? "")
  }, ["renderTaskExpertConclusion"]);
  assert.doesNotMatch(context.renderTaskExpertConclusion({ id: "tsk-monitor", type: "Физический мониторинг" }), /Исключения по объектам/);
  const physicalHtml = context.renderTaskExpertConclusion({ id: "s-1126-0001", type: "Первичный осмотр" });
  assert.match(physicalHtml, /Исключения по объектам/);
  assert.ok(physicalHtml.indexOf("Фактические параметры осмотра") < physicalHtml.indexOf("Общий результат осмотра"));
  assert.ok(physicalHtml.indexOf("Общий результат осмотра") < physicalHtml.indexOf("Исключения по объектам"));
  assert.ok(physicalHtml.indexOf("Исключения по объектам") < physicalHtml.indexOf("Экспертное заключение по задаче"));
  assert.match(app, /Фактический исполнитель выезда/);
  assert.doesNotMatch(app, /Информационный блок осмотра/);
  const selectedObjectStart = app.indexOf("function renderInspectionTaskSelectedObjectBlock");
  const selectedObjectEnd = app.indexOf("\nfunction renderMobileInspectionTaskBlock", selectedObjectStart);
  assert.match(app.slice(selectedObjectStart, selectedObjectEnd), /renderInspectionActualParametersPanel\(task, getTaskCollaterals\(task\), \{ scope: "collateral"/);
});

test("expert conclusion shows an inspection outcome derived from objects and conditionally shows negative reason", () => {
  const outcomeSource = extract("getInspectionTaskExpertConclusionOutcome", "getTaskExpertConclusionOutcome");
  const outcomeContext = run(outcomeSource, {
    getInspectionActiveCollaterals: (_task, collaterals) => collaterals,
    getInspectionResolutionResultValue: (_result, _task, collateral) => collateral.result
  }, ["getInspectionTaskExpertConclusionOutcome"]);
  const task = { id: "s-1126-0001", type: "Первичный осмотр", expertOutcome: "Положительное" };
  assert.equal(outcomeContext.getInspectionTaskExpertConclusionOutcome(task, [
    { id: "COL-1", result: "Положительный" },
    { id: "COL-2", result: "Условно-положительный" }
  ]), "Положительное с замечаниями");
  assert.equal(outcomeContext.getInspectionTaskExpertConclusionOutcome(task, [
    { id: "COL-1", result: "Положительный" },
    { id: "COL-2", result: "Осмотр не проведен" }
  ]), "Отрицательное");
  assert.equal(outcomeContext.getInspectionTaskExpertConclusionOutcome(task, [
    { id: "COL-1", result: "Положительный" },
    { id: "COL-2", result: "" }
  ]), "");

  const renderStart = app.indexOf("function renderTaskExpertConclusion(");
  const renderEnd = app.indexOf("\nfunction renderInspectionActualParametersPanel", renderStart);
  const renderedFields = {};
  const renderContext = run(`${inspectionPredicateSource}\n${app.slice(renderStart, renderEnd)}`, {
    getTaskCollaterals: () => [],
    getTaskApplicationSubtypeValue: () => "",
    getTaskExpertDefaults: () => ({ result: "Положительное", comment: "", conclusion: "" }),
    getSelectedTaskExpertTemplate: () => ({ name: "Осмотр" }),
    getTaskExpertConclusionOutcome: () => "Положительное",
    getInspectionTaskExpertConclusionOutcome: () => "Положительное",
    canGenerateTaskExpertConclusion: () => false,
    getTaskExpertAttachment: () => null,
    isPledgeOperationTaskType: () => false,
    getTaskPrintResultOptions: () => [],
    renderInspectionActualParametersPanel: () => "",
    renderInspectionGeneralResultPanel: () => "",
    renderInspectionExceptionsPanel: () => "",
    renderTaskFormGrid: (fields) => {
      renderedFields.labels = fields.map(({ label }) => label);
      renderedFields.fields = fields;
      return "";
    },
    renderTaskExpertAttachmentRow: () => "",
    getRole: () => ({ user: "Исполнитель" }),
    escapeHtml: (value) => String(value ?? "")
  }, ["renderTaskExpertConclusion"]);
  const conclusionContext = renderContext;
  const positiveHtml = conclusionContext.renderTaskExpertConclusion(task);
  const outcomeField = renderedFields.fields.find(({ label }) => label === "Итог заключения");
  assert.ok(outcomeField);
  assert.equal(outcomeField.value, "Положительное");
  assert.equal(outcomeField.readonly, true);
  assert.doesNotMatch(positiveHtml, /Причина отрицательного заключения/);

  const negativeTask = { ...task, negativeConclusionReason: "Объект не осмотрен" };
  conclusionContext.getInspectionTaskExpertConclusionOutcome = () => "Отрицательное";
  const negativeHtml = conclusionContext.renderTaskExpertConclusion(negativeTask);
  assert.match(negativeHtml, /Причина отрицательного заключения/);
  assert.match(negativeHtml, /Объект не осмотрен/);
  assert.match(negativeHtml, /data-task-expert="negativeConclusionReason"/);

  const nonInspectionTask = { id: "c-1126-0001", type: "Единичная переоценка", expertOutcome: "Отрицательное" };
  conclusionContext.getTaskExpertConclusionOutcome = () => "Положительное";
  conclusionContext.getTaskExpertDefaults = () => ({ result: "Положительный", comment: "", conclusion: "" });
  conclusionContext.renderTaskExpertConclusion(nonInspectionTask);
  const editableOutcomeField = renderedFields.fields.find(({ label }) => label === "Итог заключения");
  assert.equal(editableOutcomeField.readonly, false);
  assert.equal(editableOutcomeField.value, "Отрицательное");
});

test("overall inspection result panel uses compact two-column fields without divider rules", () => {
  const panelStart = app.indexOf("function renderInspectionGeneralResultPanel(");
  const panelEnd = app.indexOf("\nfunction renderInspectionExceptionsPanel", panelStart);
  const panel = app.slice(panelStart, panelEnd);
  assert.match(panel, /inspection-general-result-grid/);
  assert.doesNotMatch(panel, /wide: true/);
  const gridStyles = css.match(/\.task-form-grid\.compact\.inspection-general-result-grid\s*\{[^}]*\}/)?.[0] || "";
  assert.match(gridStyles, /grid-template-columns:\s*minmax\(220px,\s*0\.85fr\)\s+minmax\(0,\s*2fr\)/);
  const titleStyles = css.match(/\.inspection-general-result-panel\s+\.panel-title\s*\{[^}]*\}/)?.[0] || "";
  assert.match(titleStyles, /border-bottom:\s*0/);
  const commentStyles = css.match(/\.inspection-general-result-panel\s+\.inspection-general-result-grid\s+textarea\s*\{[^}]*\}/)?.[0] || "";
  assert.match(commentStyles, /min-height:\s*56px/);
  const mobileRule = css.slice(css.indexOf("@media (max-width: 720px)"));
  assert.match(mobileRule, /\.task-form-grid\.compact\.inspection-general-result-grid\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  const summaryStyles = css.match(/\.inspection-result-summary\s*\{[^}]*\}/)?.[0] || "";
  assert.ok(summaryStyles);
  assert.doesNotMatch(summaryStyles, /border-top/);
});
