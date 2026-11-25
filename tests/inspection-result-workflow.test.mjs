import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

function extract(name, nextName) {
  const start = app.indexOf(`function ${name}(`);
  const end = app.indexOf(`\nfunction ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `${name} source must exist`);
  return app.slice(start, end);
}

function run(source, context, names) {
  vm.runInNewContext(`${source}\n${names.map((name) => `globalThis.${name} = ${name};`).join("\n")}`, context);
  return context;
}

const modelHelpers = [
  extract("getInspectionResolutionOverrides", "getInspectionConditionAssessmentOptions"),
  extract("ensureInspectionResultModel", "addInspectionExceptionRow"),
  extract("getInspectionActiveCollaterals", "renderInspectionGeneralResultPanel"),
  extract("getInspectionResultCompletionIssues", "getInspectionChecklistMissingComments")
].join("\n");

test("valuation route offers inspection creation only while task is in work", () => {
  const context = run(extract("getTaskRouteActionButtons", "renderTaskHistory"), {
    canSplitTaskByCollateral: () => false,
    canUseRouteAction: (task) => task.status === "В работе",
    canSendTaskToRevision: () => false,
    getRouteValuationTaskType: () => "Единичная оценка",
    isInspectionTaskType: () => false,
    isMonitoringTaskType: () => false,
    isValuationTaskType: (type) => String(type).toLowerCase().includes("оцен"),
    escapeHtml: (value) => String(value ?? ""),
    getRole: () => ({ permissions: {} }),
    isManagerRole: () => false
  }, ["getTaskRouteActionButtons"]);
  const actions = context.getTaskRouteActionButtons({ id: "c-1126-0001", type: "Единичная оценка", status: "В работе" }).join("");
  assert.match(actions, /data-task-type="Первичный осмотр">Создать задачу на осмотр/);
  assert.doesNotMatch(context.getTaskRouteActionButtons({ type: "Единичная оценка", status: "Назначена" }).join(""), /Создать задачу на осмотр/);
});

test("root page uses fresh matching cache keys for changed app and styles", () => {
  const scriptKey = html.match(/src="src\/app\.js\?v=([^"]+)"/)?.[1];
  const styleKey = html.match(/href="src\/styles\.css\?v=([^"]+)"/)?.[1];
  assert.ok(scriptKey);
  assert.equal(styleKey, scriptKey);
  assert.match(scriptKey, /collateral-column-picker-compact-20261125-r1/);
});

test("individual result checkbox copies common values and returns to current common values when cleared", () => {
  const functions = [
    extract("getInspectionResolutionOverrides", "getInspectionConditionAssessmentOptions"),
    extract("getInspectionResolutionResultValue", "getInspectionConditionAssessmentOptions"),
    extract("setIndividualInspectionResult", "useGeneralInspectionResult"),
    extract("useGeneralInspectionResult", "removeInspectionExceptionRow")
  ].join("\n");
  const task = {
    id: "s-1126-0001",
    collateralIds: ["COL-1"],
    inspectionGeneralResult: { result: "Положительный", comment: "Общий комментарий" },
    inspectionResolutions: { "COL-1": { markers: ["обременение"] } }
  };
  const context = run(functions, {
    getTask: () => task,
    getTaskCollaterals: () => [{ id: "COL-1" }],
    isTaskCollateralExcluded: () => false,
    ensureInspectionResultModel: (value) => { value.inspectionResolutions = value.inspectionResolutions || {}; },
    persistTaskState: () => {}
  }, ["setIndividualInspectionResult", "useGeneralInspectionResult", "getInspectionResolutionResultValue"]);

  context.setIndividualInspectionResult(task.id, "COL-1");
  assert.equal(task.inspectionResolutions["COL-1"].individualResult, true);
  assert.equal(task.inspectionResolutions["COL-1"].resolutionResult, "Положительный");
  assert.equal(task.inspectionResolutions["COL-1"].resultComment, "Общий комментарий");
  task.inspectionGeneralResult = { result: "Отрицательный", comment: "Новый общий комментарий" };
  assert.equal(context.getInspectionResolutionResultValue(null, task, { id: "COL-1" }), "Положительный");

  context.useGeneralInspectionResult(task.id, "COL-1");
  assert.equal(context.getInspectionResolutionResultValue(null, task, { id: "COL-1" }), "Отрицательный");
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionResolutions["COL-1"])), { markers: ["обременение"] });

  context.setIndividualInspectionResult(task.id, "COL-1");
  assert.equal(task.inspectionResolutions["COL-1"].resolutionResult, "Отрицательный");
  assert.equal(task.inspectionResolutions["COL-1"].resultComment, "Новый общий комментарий");
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionResolutions["COL-1"].markers)), ["обременение"]);
});

test("inspection method appears in reassign/subtask modals only for inspection task context", () => {
  const reassign = extract("renderReassignModal", "renderInspectionVisitMethodField");
  const subtask = extract("renderSubtaskModal", "renderReassignModal");
  assert.match(reassign, /isInspectionTaskType\(task\.type\)[\s\S]*renderInspectionVisitMethodField\("reassignInspectionMethod"/);
  assert.match(subtask, /isInspectionTaskType\(parent\.type\)[\s\S]*renderInspectionVisitMethodField\("subtaskInspectionMethod"/);
  const modal = extract("renderModal", "renderDeferTaskModal");
  assert.match(modal, /isInspection && isValuationTaskType\(parent\?\.type\)/);
  assert.match(modal, /renderInspectionVisitMethodField\("followupInspectionMethod"/);
});

test("reassignment persists a changed inspection method and records it in task history", () => {
  const task = { id: "s-1126-0001", type: "Первичный осмотр", status: "В работе", assignee: "Анна", inspectionVisitMethod: "Мобильный оценщик (МО)" };
  const history = [];
  let persisted = 0;
  const fields = {
    reassignAssignee: { value: "Анна" },
    reassignComment: { value: "" },
    reassignInspectionMethod: { value: "Сюрвейер (СК)" }
  };
  const context = run(extract("submitTaskReassign", "confirmTaskApprover"), {
    getTask: () => task,
    getRole: () => ({ user: "Руководитель" }),
    isManagerRole: () => true,
    isTaskClosed: () => false,
    getInspectionVisitMethod: (value) => value.inspectionVisitMethod,
    normalizeInspectionVisitMethodForTask: (_task, value) => value,
    document: { getElementById: (id) => fields[id] || null },
    addTaskHistoryEvent: (_task, event) => history.push(event),
    persistTaskState: () => { persisted += 1; },
    state: { modal: { type: "reassign" } },
    addToast: () => {}
  }, ["submitTaskReassign"]);
  context.submitTaskReassign(task.id);
  assert.equal(task.inspectionVisitMethod, "Сюрвейер (СК)");
  assert.equal(history.length, 1);
  assert.equal(history[0].action, "Изменение способа проведения осмотра");
  assert.equal(persisted, 1);
});

test("inspection follow-up from valuation carries the same application and collateral set", () => {
  const parent = { id: "c-1126-0001", type: "Единичная оценка", collateralId: "COL-1", applicationNumber: "app-1126-001", collateralIds: ["COL-1", "COL-2"] };
  const created = [];
  const state = { modal: { parentTaskId: parent.id, taskType: "Первичный осмотр" } };
  const context = run(extract("submitFollowup", "submitSubtask"), {
    state,
    getTask: (id) => id === parent.id ? parent : null,
    isTaskClosed: () => false,
    getTaskApplicationNumber: (task) => task.applicationNumber,
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    isInspectionTaskType: (type) => String(type).includes("осмотр"),
    isValuationTaskType: (type) => String(type).includes("оцен"),
    normalizeInspectionVisitMethod: (value) => value,
    document: { getElementById: (id) => ({ value: ({ followupInspectionMethod: "Мобильный оценщик (МО)", followupAssignee: "Исполнитель", followupDue: "2026-11-30", followupComment: "Провести выезд" })[id] ?? "" }) },
    addToast: (...args) => { throw new Error(args.join(" ")); },
    getTaskApplication: () => ({ source: "Заявка" }),
    normalizeApplicationDealProduct: (value) => value,
    getTaskApplicationSubtypeValue: () => "Физический осмотр",
    createTask: (payload) => { created.push(payload); return { id: "s-1126-0001", type: payload.type, assignee: payload.assignee, inspectionVisitMethod: payload.inspectionVisitMethod }; },
    addTaskHistoryEvent: () => {},
    window: { location: { hash: "" } },
    getTaskCardRoute: () => "#/task",
    addToast: () => {},
    employees: ["Исполнитель"]
  }, ["submitFollowup"]);
  context.submitFollowup();
  assert.equal(created.length, 1);
  assert.deepEqual(created[0].collateralIds, ["COL-1", "COL-2"]);
  assert.equal(created[0].applicationNumber, "app-1126-001");
  assert.equal(created[0].inspectionVisitMethod, "Мобильный оценщик (МО)");
});

test("legacy object resolutions and exception rows migrate into one result model", () => {
  const task = {
    id: "s-1126-0001",
    inspectionResultModelVersion: 2,
    inspectionResolutions: {
      "COL-1": { comment: "Наблюдение по объекту", conditionAssessment: "Хорошее" },
      "COL-2": { resultComment: "Сохраненный комментарий" },
      "COL-3": { resultComment: "Актуальный комментарий" }
    },
    inspectionExceptions: [
      { collateralId: "COL-2", result: "Отрицательный", markers: ["обременение"], comment: "Есть обременение" },
      { collateralId: "COL-3", result: "Условно-положительный", comment: "" },
      { collateralId: "COL-MISSING", result: "Отрицательный", problematic: true, comment: "Старый объект не найден" }
    ]
  };
  const context = run(extract("ensureInspectionResultModel", "addInspectionExceptionRow"), {
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }, { id: "COL-3" }],
    uniqueItems: (values) => [...new Set(values)],
    persistTaskState: () => {}
  }, ["ensureInspectionResultModel"]);
  context.ensureInspectionResultModel(task, [{ id: "COL-1" }, { id: "COL-2" }, { id: "COL-3" }]);
  assert.equal(task.inspectionResultModelVersion, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionResolutions["COL-1"])), {
    conditionAssessment: "Хорошее", observationComment: "Наблюдение по объекту"
  });
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionResolutions["COL-2"])), {
    individualResult: true, resolutionResult: "Отрицательный", resultComment: "Сохраненный комментарий\nЕсть обременение", markers: ["обременение"]
  });
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionResolutions["COL-3"])), {
    individualResult: true, resolutionResult: "Условно-положительный", resultComment: "Актуальный комментарий"
  });
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionResolutions["COL-MISSING"])), {
    individualResult: true, resolutionResult: "Отрицательный", resultComment: "Старый объект не найден", markers: ["другие признаки"], legacyUnmatched: true
  });
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionExceptions)), []);
});

test("unmatched migrated exceptions remain visible for resolution", () => {
  const task = {
    id: "s-1126-0001",
    inspectionResultModelVersion: 3,
    inspectionResolutions: { "COL-MISSING": { individualResult: true, resolutionResult: "Отрицательный", legacyUnmatched: true, resultComment: "Связь не найдена" } }
  };
  const context = run([
    extract("getInspectionExceptionRows", "ensureInspectionResultModel"),
    extract("ensureInspectionResultModel", "addInspectionExceptionRow"),
    extract("hasIndividualInspectionResult", "addInspectionExceptionRow")
  ].join("\n"), {
    getTaskCollaterals: () => [],
    getInspectionActiveCollaterals: () => [],
    persistTaskState: () => {}
  }, ["getInspectionExceptionRows"]);
  assert.deepEqual(JSON.parse(JSON.stringify(context.getInspectionExceptionRows(task, []))), [{
    collateralId: "COL-MISSING", result: "Отрицательный", markers: [], comment: "Связь не найдена", unresolved: true
  }]);
});

test("using the common result removes the result override but preserves collateral-specific fields", () => {
  const task = {
    id: "s-1126-0001",
    inspectionResultModelVersion: 3,
    inspectionGeneralResult: { result: "Положительный", comment: "Общий осмотр пройден" },
    inspectionResolutions: { "COL-2": { individualResult: true, resolutionResult: "Отрицательный", resultComment: "Есть замечание", markers: ["обременение"], conditionAssessment: "Удовлетворительное", observationComment: "Осмотрено отдельно" } }
  };
  const functions = [
    extract("ensureInspectionResultModel", "addInspectionExceptionRow"),
    extract("getInspectionResolutionOverrides", "getInspectionConditionAssessmentOptions"),
    extract("useGeneralInspectionResult", "updateInspectionExceptionField")
  ].join("\n");
  const context = run(functions, {
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    getTask: () => task,
    persistTaskState: () => {}
  }, ["getInspectionResolutionResultValue", "useGeneralInspectionResult"]);
  assert.equal(context.getInspectionResolutionResultValue(null, task, { id: "COL-1" }), "Положительный");
  assert.equal(context.getInspectionResolutionResultValue(null, task, { id: "COL-2" }), "Отрицательный");
  context.useGeneralInspectionResult(task.id, "COL-2");
  assert.equal(context.getInspectionResolutionResultValue(null, task, { id: "COL-2" }), "Положительный");
  assert.deepEqual(JSON.parse(JSON.stringify(task.inspectionResolutions["COL-2"])), {
    markers: ["обременение"], conditionAssessment: "Удовлетворительное", observationComment: "Осмотрено отдельно"
  });
});

test("overall result changes affect inherited objects but preserve individual overrides", () => {
  const task = {
    id: "s-1126-0001",
    inspectionResultModelVersion: 3,
    inspectionGeneralResult: { result: "Положительный", comment: "Сначала общий" },
    inspectionResolutions: { "COL-2": { individualResult: true, resolutionResult: "Отрицательный", resultComment: "Индивидуальный", markers: ["обременение"] } }
  };
  const context = run([
    extract("ensureInspectionResultModel", "addInspectionExceptionRow"),
    extract("getInspectionResolutionOverrides", "getInspectionConditionAssessmentOptions"),
    extract("updateInspectionGeneralResultField", "getInspectionActiveCollaterals")
  ].join("\n"), {
    getTask: () => task,
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    persistTaskState: () => {}
  }, ["getInspectionResolutionResultValue", "updateInspectionGeneralResultField"]);
  context.updateInspectionGeneralResultField({ dataset: { task: task.id, inspectionGeneralResultField: "result" }, value: "Условно-положительный" });
  assert.equal(context.getInspectionResolutionResultValue(null, task, { id: "COL-1" }), "Условно-положительный");
  assert.equal(context.getInspectionResolutionResultValue(null, task, { id: "COL-2" }), "Отрицательный");
});

test("completion requires an effective result for every active object and complete exception fields", () => {
  const task = {
    id: "s-1126-0001",
    inspectionResultModelVersion: 3,
    inspectionGeneralResult: { result: "Положительный", comment: "Общий комментарий" },
    inspectionResolutions: { "COL-2": { individualResult: true, resolutionResult: "Отрицательный", resultComment: "Есть ограничение", markers: [] } }
  };
  const context = run(modelHelpers, {
    getTaskCollaterals: () => [{ id: "COL-1" }, { id: "COL-2" }],
    isTaskCollateralExcluded: () => false,
    getCollateralObjectIdentifier: (collateral) => collateral.id,
    persistTaskState: () => {}
  }, ["getInspectionResultCompletionIssues"]);
  let validation = context.getInspectionResultCompletionIssues(task);
  assert.deepEqual(JSON.parse(JSON.stringify(validation.missingResults)), []);
  assert.deepEqual(JSON.parse(JSON.stringify(validation.missingExceptions)), ["COL-2"]);
  task.inspectionResolutions["COL-2"].markers = ["обременение"];
  validation = context.getInspectionResultCompletionIssues(task);
  assert.deepEqual(JSON.parse(JSON.stringify(validation)), { missingResults: [], missingExceptions: [] });
  task.inspectionGeneralResult.result = "";
  validation = context.getInspectionResultCompletionIssues(task);
  assert.deepEqual(JSON.parse(JSON.stringify(validation.missingResults)), ["COL-1"]);
});
