import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

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

const escapeHtml = (value) => String(value ?? "");

test("task collateral block exposes pick and edit actions, edit requires an active object", () => {
  const context = run(extract("renderTaskCollateralActions", "renderTaskCollateralObjectsInfo"), {
    escapeHtml,
    isTaskCollateralExcluded: (_task, id) => id === "COL-X"
  }, ["renderTaskCollateralActions"]);
  const html = context.renderTaskCollateralActions({ id: "tsk-1" }, [{ id: "COL-1" }], { id: "COL-1" });
  assert.match(html, /data-context="taskCard"/);
  assert.match(html, /Выбрать объект залога/);
  assert.match(html, /data-action="edit-task-collateral"[^>]*data-collateral="COL-1"/);
  assert.match(context.renderTaskCollateralActions({ id: "tsk-1" }, [], null), /data-action="edit-task-collateral"[^>]*disabled/);
});

test("task picker adds selected collateral to the existing task without mutating the application draft", () => {
  const task = { id: "tsk-1", collateralId: "COL-1", collateralIds: ["COL-1"] };
  const events = [];
  let saved = 0;
  const context = run(extract("mergeCollateralPickerSelection", "submitCollateralPicker"), {
    state: { modal: { context: "taskCard", taskId: "tsk-1", selectedCollateralIds: ["COL-1", "COL-2"] }, newTask: { selectedCollateralIds: ["DRAFT-COL"] }, taskActiveCollateral: { "tsk-1": "COL-1" } },
    document: { querySelectorAll: () => [{ dataset: { modalCollateralChoice: "COL-2" } }, { dataset: { modalCollateralChoice: "COL-3" } }] },
    getTask: () => task,
    getTaskCollateralIds: (item) => [...new Set([...(item.collateralIds || []), item.collateralId].filter(Boolean))],
    addTaskHistoryEvent: (_task, event) => events.push(event),
    persistTaskState: () => { saved += 1; }
  }, ["mergeCollateralPickerSelection"]);

  assert.deepEqual(JSON.parse(JSON.stringify(context.mergeCollateralPickerSelection())), ["COL-1", "COL-2", "COL-3"]);
  assert.deepEqual(JSON.parse(JSON.stringify(task.collateralIds)), ["COL-1", "COL-2", "COL-3"]);
  assert.equal(task.collateralId, "COL-1");
  assert.deepEqual(context.state.newTask.selectedCollateralIds, ["DRAFT-COL"]);
  assert.equal(events.length, 1);
  assert.equal(saved, 1);
});

test("active collateral is a searchable list containing only non-excluded objects", () => {
  const context = run(extract("renderTaskClientContractInfo", "getCollateralChoiceLabel"), {
    escapeHtml,
    isTaskCollateralExcluded: (_task, id) => id === "COL-X",
    getCollateralChoiceLabel: (collateral) => `${collateral.id} · ${collateral.name}`
  }, ["renderTaskClientContractInfo"]);
  const html = context.renderTaskClientContractInfo(
    { id: "s-1126-0001" },
    { id: "COL-1", name: "Склад" },
    [],
    [{ id: "COL-1", name: "Склад" }, { id: "COL-X", name: "Исключен" }]
  );
  assert.match(html, /data-task-active-collateral-search/);
  assert.match(html, /<datalist/);
  assert.match(html, /COL-1 · Склад/);
  assert.doesNotMatch(html, /COL-X · Исключен/);
});

test("inspection executor is saved in the plan and becomes the returned visit executor", () => {
  const task = {};
  const context = run(extract("updateInspectionPlanField", "toggleInspectionPlanIndividual"), {
    getTask: () => task,
    INSPECTION_VISIT_METHOD_OPTIONS: ["Мобильный оценщик (МО)"],
    persistTaskState: () => {}
  }, ["updateInspectionPlanField"]);
  context.updateInspectionPlanField({ dataset: { task: "tsk-1", inspectionPlanField: "executor", inspectionPlanScope: "task" }, value: "Елена Морозова" });
  assert.equal(task.inspectionPlan.executor, "Елена Морозова");
  assert.equal(task.inspectionVisitExecutor, "Елена Морозова");

  const resultContext = run(extract("buildFieldInspectionResult", "getFieldInspectionRequestId"), {
    formatTaskHistoryDate: () => "2026-11-23 10:00:00",
    getCollateralPhotoAngles: () => [],
    getFieldInspectionRequestId: () => "VISIT-1",
    getFieldInspectionExecutor: () => "Исполнитель интеграции",
    getFieldInspectionGeolocation: () => "55.0, 37.0",
    isRealEstateCollateralType: () => false
  }, ["buildFieldInspectionResult"]);
  assert.equal(resultContext.buildFieldInspectionResult({}, { id: "COL-1" }, "Мобильный оценщик (МО)", { executor: "Елена Морозова" }).executor, "Елена Морозова");
});

test("individual inspection executor updates only the selected collateral plan", () => {
  const task = {
    id: "s-1126-0001",
    inspectionPlan: { executor: "Общий исполнитель" },
    inspectionPlanByCollateral: { "COL-1": { enabled: true, executor: "Старый исполнитель" } }
  };
  let saved = 0;
  const context = run(extract("updateInspectionPlanField", "toggleInspectionPlanIndividual"), {
    getTask: () => task,
    INSPECTION_VISIT_METHOD_OPTIONS: ["Мобильный оценщик (МО)"],
    persistTaskState: () => { saved += 1; }
  }, ["updateInspectionPlanField"]);
  context.updateInspectionPlanField({
    dataset: { task: task.id, collateral: "COL-1", inspectionPlanField: "executor", inspectionPlanScope: "collateral" },
    value: "Новый исполнитель"
  });
  assert.equal(task.inspectionPlanByCollateral["COL-1"].executor, "Новый исполнитель");
  assert.equal(task.inspectionPlan.executor, "Общий исполнитель");
  assert.equal(task.inspectionVisitExecutor, undefined);
  assert.equal(saved, 1);
});

test("inspection exceptions offer a multi-select marker and no reason field", () => {
  let receivedField;
  const context = run(extract("renderInspectionExceptionRow", "addInspectionExceptionRow"), {
    escapeHtml,
    getCollateralChoiceLabel: (collateral) => `${collateral.id} · ${collateral.description}`,
    getInspectionResolutionResultOptions: () => ["Положительный", "Условно-положительный", "Отрицательный", "Осмотр не проведен"],
    INSPECTION_PROBLEM_MARKER_OPTIONS: ["перепланировка", "обременение", "присутствие третьих лиц", "несоответствие площади/адреса", "ограничение по транспортному средству", "другие признаки"],
    renderTaskMultiSelectField: (field) => { receivedField = field; return `MULTI:${field.value.join(",")}:${field.options.join(",")}`; }
  }, ["renderInspectionExceptionRow"]);
  const html = context.renderInspectionExceptionRow({ id: "tsk-1" }, [{ id: "COL-1", description: "Дом" }], {
    collateralId: "COL-1", result: "Отрицательный", markers: ["обременение", "перепланировка"], comment: "Есть ограничение"
  });
  assert.match(html, /MULTI:обременение,перепланировка/);
  assert.match(html, /data-inspection-exception-object-search/);
  assert.match(html, /<datalist/);
  assert.equal(receivedField.label, "");
  assert.equal(receivedField.attrs.includes('data-inspection-exception-field="markers"'), true);
  assert.doesNotMatch(html, /Причина замечания|>Причина</);
});

test("inspection exception collateral search stores only a selected matching object", () => {
  const task = { id: "s-1126-0001", inspectionResolutions: { "COL-1": { individualResult: true } }, inspectionResultModelVersion: 3 };
  let saves = 0;
  const context = run(extract("updateInspectionExceptionField", "getTaskExpertAttachment"), {
    getTask: () => task,
    getTaskCollaterals: () => [
      { id: "COL-1", name: "Склад" },
      { id: "COL-2", name: "Офис" }
    ],
    getCollateralChoiceLabel: (collateral) => `${collateral.id} · ${collateral.name}`,
    hasIndividualInspectionResult: (value, collateral) => Boolean(value.inspectionResolutions?.[collateral.id]?.individualResult),
    isTaskCollateralExcluded: () => false,
    persistTaskState: () => { saves += 1; }
  }, ["updateInspectionExceptionField"]);
  const input = { dataset: { task: task.id, collateral: "COL-1", inspectionExceptionField: "collateralId" }, value: "COL" };
  context.updateInspectionExceptionField(input);
  assert.equal(task.inspectionResolutions["COL-1"].individualResult, true);
  assert.equal(saves, 0);
  input.value = "COL-2 · Офис";
  context.updateInspectionExceptionField(input);
  assert.equal(task.inspectionResolutions["COL-1"], undefined);
  assert.equal(task.inspectionResolutions["COL-2"].individualResult, true);
  assert.equal(saves, 1);
});

test("checklist renders every comment and marks negative answers required; empty checklist gets the specified text", () => {
  const source = extract("renderInspectionChecklistBlock", "getInspectionFactorGroups");
  const context = run(source, {
    escapeHtml,
    badge: (value) => `<span>${value}</span>`,
    isInspectionChecklistNegative: (item) => item.selected.status === "bad",
    getInspectionChecklistCommentValue: () => ""
  }, ["renderInspectionChecklistBlock"]);
  const task = { id: "tsk-1" };
  const collateral = { id: "COL-1", type: "Недвижимость" };
  const emptyHtml = context.renderInspectionChecklistBlock(task, collateral, { groups: [] });
  assert.match(emptyHtml, /Для выбранного вида залога чек-лист осмотра не предусмотрен/);
  const checklistHtml = context.renderInspectionChecklistBlock(task, collateral, { groups: [{ title: "Права", items: [{ code: "CAD", name: "Кадастровый номер", source: "ЕГРН", documents: "Выписка", values: [{ code: "bad", label: "Не подтверждено" }], selected: { code: "bad", label: "Не подтверждено", status: "bad" } }] }] });
  assert.match(checklistHtml, /Кадастровый номер/);
  assert.match(checklistHtml, /<option value="bad" selected>Не подтверждено/);
  assert.match(checklistHtml, /data-inspection-checklist-comment[^>]*required aria-required="true"/);
});

test("negative checklist comments block completion until every required comment is filled", () => {
  const source = [extract("completeTask", "getInspectionChecklistMissingComments"), extract("getInspectionChecklistMissingComments", "shouldSendTaskToApprover")].join("\n");
  const task = { id: "tsk-1", type: "Первичный осмотр", status: "В работе" };
  const toasts = [];
  const context = run(source, {
    getTask: () => task,
    isTaskClosed: () => false,
    canCompleteTask: () => true,
    isInspectionTaskType: () => false,
    isInspectionCardTaskType: () => true,
    isDocumentaryInspectionTask: () => false,
    getTaskCollaterals: () => [{ id: "COL-1" }],
    isTaskCollateralExcluded: () => false,
    getInspectionFactorGroups: () => [{ items: [{ code: "X", name: "Сверка номера" }] }],
    getInspectionSelectedOption: () => ({ code: "bad", status: "bad" }),
    isInspectionChecklistNegative: () => true,
    addToast: (...args) => toasts.push(args),
    addTaskHistoryEvent: () => {},
    normalizeTaskStatus: (value) => value,
    persistTaskState: () => {}
  }, ["completeTask"]);
  context.completeTask("tsk-1");
  assert.equal(task.status, "В работе");
  assert.equal(toasts.length, 1);
  task.inspectionChecklistComments = { "COL-1": { X: "Номер проверен повторно" } };
  context.completeTask("tsk-1");
  assert.equal(task.status, "Завершена");
});

test("mismatch result uses plain status text instead of a status badge", () => {
  const context = run(extract("renderInspectionMismatchTable", "getInspectionProblemChecklistComment"), {
    escapeHtml,
    badge: (value) => `<span class="badge">${value}</span>`
  }, ["renderInspectionMismatchTable"]);
  const html = context.renderInspectionMismatchTable([{ name: "Проверка", status: "Критично", tone: "danger", value: "Не подтверждено", marker: "обременение", comment: "" }]);
  assert.match(html, /<span class="inspection-mismatch-status">Критично<\/span>/);
  assert.doesNotMatch(html, /class="badge">Критично/);
  assert.doesNotMatch(html, /пункт\(ов\)|class="badge"/);
});

test("inspection resolution and linked mismatch panels do not render result or count badges", () => {
  const resolution = run(extract("renderInspectionResultPanel", "getInspectionResolutionResultOptions"), {
    escapeHtml,
    hasIndividualInspectionResult: () => true,
    getInspectionResolutionOverrides: () => ({ individualResult: true, markers: ["обременение"] }),
    getInspectionResolutionResultValue: () => "Отрицательный",
    getInspectionConditionAssessmentValue: () => "Неудовлетворительное",
    getInspectionPhysicalWearPercentValue: () => 71,
    getInspectionResolutionCommentValue: () => "",
    getInspectionProblemChecklistRows: () => [],
    getInspectionResolutionFieldAttrs: () => "",
    getInspectionResolutionResultOptions: () => ["Положительный", "Отрицательный", "Осмотр не проведен"],
    getInspectionConditionAssessmentOptions: () => ["Неудовлетворительное"],
    renderTaskFormGrid: (fields) => fields.map((field) => `<span>${field.label}: ${field.value}</span>`).join(""),
    renderTaskMultiSelectField: (field) => `<span>${field.value.join(",")}</span>`,
    INSPECTION_PROBLEM_MARKER_OPTIONS: ["обременение"],
    renderInspectionMismatchTable: () => "<div>Выявленные несоответствия</div>"
  }, ["renderInspectionResultPanel"]);
  const resolutionHtml = resolution.renderInspectionResultPanel({ id: "s-1126-0001" }, { id: "COL-1" }, {});
  assert.match(resolutionHtml, /Отрицательный/);
  assert.match(resolutionHtml, /data-inspection-individual-result-toggle/);
  assert.match(resolutionHtml, /Задать индивидуальный результат/);
  assert.doesNotMatch(resolutionHtml, /data-action="set-individual-inspection-result"|data-action="use-general-inspection-result"/);
  assert.doesNotMatch(resolutionHtml, /class="badge"|badge\(/);

  const linked = run(extract("renderValuationInspectionProblemChecklist", "getValuationInspectionPrefill"), {
    escapeHtml,
    badge: () => "<span class=\"badge\">badge</span>"
  }, ["renderValuationInspectionProblemChecklist"]);
  const linkedHtml = linked.renderValuationInspectionProblemChecklist({
    problemChecklistRows: [{ name: "Осмотр", status: "Критично", tone: "danger", value: "Отрицательный" }]
  });
  assert.match(linkedHtml, /<span class="inspection-mismatch-status">Критично<\/span>/);
  assert.doesNotMatch(linkedHtml, /1 пункт\(ов\)|class="badge"/);
});

test("submitted application collateral table shows an immutable exclusion column", () => {
  let rowOptions;
  const list = run(extract("renderTaskCollateralObjectsInfo", "getLatestCollateralEvaluation"), {
    escapeHtml,
    isDraftApplication: () => false,
    canMarkTaskCollateralExcluded: () => false,
    isTaskCollateralExcluded: () => false,
    getTaskCollateralVisibleColumns: ({ showExclusionColumn } = {}) => [
      ...Array.from({ length: 12 }, (_, index) => ({ key: `column-${index}`, width: 100, label: `Column ${index}` })),
      ...(showExclusionColumn ? [{ key: "excluded", width: 68, label: "Исключен" }] : [])
    ],
    renderTaskCollateralColumnSettings: () => "",
    buildTaskCollateralGroups: () => [{ key: "pledgor", types: [{ key: "type" }] }],
    isTaskCollateralGroupExpanded: () => true,
    renderTaskCollateralGroupedRows: (_task, _groups, _active, options) => { rowOptions = options; return "<tr></tr>"; },
    pluralize: () => "объект"
  }, ["renderTaskCollateralObjectsInfo"]);
  const html = list.renderTaskCollateralObjectsInfo({ id: "s-1126-0001" }, [{ id: "COL-1" }], null, {
    selectable: false,
    sourceApplication: { id: "app-23112026-001", status: "Новая" }
  });
  assert.match(html, /<th data-task-collateral-column="excluded"[^>]*>Исключен<\/th>/);
  assert.match(html, /has-exclusion-column/);
  assert.equal(rowOptions.showExclusionColumn, true);
  assert.equal(rowOptions.canMarkExcluded, false);

  const row = run(extract("renderTaskCollateralRow", "isCollateralExcludedInApplicationTasks"), {
    escapeHtml,
    isDraftApplication: () => false,
    isTaskCollateralExcluded: () => false,
    isCollateralExcludedInApplicationTasks: () => true,
    getLatestCollateralEvaluation: () => ({}),
    getCollateralSuzNumber: () => "COL-1",
    getLatestInspectionScheduleItem: () => null,
    getCollateralRegistryLatestAppraisalDate: () => "-",
    hasNegativeCollateralCheckResult: () => false,
    getEvaluationFairValue: () => 0,
    getTaskCollateralCardRoute: () => "#/collateral",
    getCollateralObjectIdentifier: () => "ID-1",
    getCollateralSubtype: () => "Офис",
    getCollateralName: () => "Офисный объект",
    getCollateralRegistryAddress: () => "Новосибирск",
    getTaskCollateralPledgeContractText: () => "ZL-1 от 01.01.2026",
    formatRegistryDateTime: () => "-",
    getCollateralLiquidity: () => "Высокая",
    formatFullMoney: () => "1 000,00",
    getTaskCollateralColumns: ({ showExclusionColumn } = {}) => [
      ...Array.from({ length: 12 }, (_, index) => ({ key: `column-${index}`, width: 100 })),
      ...(showExclusionColumn ? [{ key: "excluded", width: 68 }] : [])
    ],
    getTaskCollateralVisibleColumns: (options) => [
      ...Array.from({ length: 12 }, (_, index) => ({ key: `column-${index}`, width: 100 })),
      ...(options.showExclusionColumn ? [{ key: "excluded", width: 68 }] : [])
    ],
    renderTaskCollateralVisibleCells: (columns, cells) => columns.map(({ key }) => cells[key]).join("")
  }, ["renderTaskCollateralRow"]);
  const rowHtml = row.renderTaskCollateralRow({ id: "s-1126-0001" }, { id: "COL-1" }, null, {
    sourceApplication: { id: "app-23112026-001", status: "Новая" },
    showExclusionColumn: true,
    canMarkExcluded: false
  });
  assert.match(rowHtml, /data-task-collateral-excluded[^>]*checked disabled/);
});

test("task contacts expose applicability and keep task binding separate from application data", () => {
  const context = run(extract("getInspectionApplicableApplicationContacts", "getInspectionContactKey"), {
    getTaskApplication: () => ({ id: "APP-1" }),
    getApplicationCollaterals: () => [{ id: "COL-1" }],
    getApplicationContactRows: () => [
      { id: "app", applyScope: "application", applyValue: "" },
      { id: "task", applyScope: "task", applyValue: "TSK-1" },
      { id: "other-task", applyScope: "task", applyValue: "TSK-2" },
      { id: "object", applyScope: "collateral", applyValue: "COL-1" }
    ],
    getInspectionContactKey: (contact) => contact.id,
    parseApplicationContactBinding: (value) => {
      const [scope, ...rest] = value.split("::");
      return { scope, value: rest.join("::") };
    },
    doesApplicationContactApplyToTarget: (contact, _app, task, collateral) => contact.applyScope === "application"
      || (contact.applyScope === "task" && contact.applyValue === task.id)
      || (contact.applyScope === "collateral" && contact.applyValue === collateral?.id)
  }, ["getInspectionApplicableApplicationContacts"]);
  const task = { id: "TSK-1", inspectionContactBindings: { app: "task::TSK-1" } };
  const rows = context.getInspectionApplicableApplicationContacts(task, null);
  assert.deepEqual(JSON.parse(JSON.stringify(rows.map((row) => row.id))), ["app", "task"]);
  assert.equal(rows[0].applyScope, "task");

  const selectSource = extract("renderTaskContactApplySelect", "getTaskContactApplicabilityLabel");
  const selectContext = run(selectSource, {
    escapeHtml,
    getTaskCollaterals: () => [{ id: "COL-1" }],
    getApplicabilityOptions: () => [
      { value: "task::TSK-1", label: "Текущая задача" },
      { value: "application::", label: "Вся заявка" },
      { value: "collateral::COL-1", label: "Объект: COL-1" }
    ],
    getApplicationContactBindingValue: (contact) => `${contact.applyScope}::${contact.applyValue}`
  }, ["renderTaskContactApplySelect"]);
  const html = selectContext.renderTaskContactApplySelect({ contactKey: "app", applyScope: "application", applyValue: "" }, task, "COL-1", [{ id: "COL-1" }]);
  assert.match(html, /data-inspection-contact-field="applyBinding"/);
  assert.match(html, /<option value="task::TSK-1" selected>Текущая задача/);
});

test("new task contact rows honor task and object applicability and can be removed without touching application contacts", () => {
  const task = { id: "TSK-1", inspectionTaskContacts: [] };
  const applicationContact = { id: "APP-CONTACT", applyScope: "application", applyValue: "" };
  const context = run([
    extract("addInspectionContactRow", "removeInspectionContactRow"),
    extract("removeInspectionContactRow", "updateInspectionContactField"),
    extract("updateInspectionContactField", "updateInspectionResolutionField")
  ].join("\n"), {
    getTask: () => task,
    addTaskHistoryEvent: () => {},
    persistTaskState: () => {},
    addToast: () => {},
    parseApplicationContactBinding: (value) => {
      const [scope, ...rest] = value.split("::");
      return { scope, value: rest.join("::") };
    },
    ensureInspectionContactRows: () => []
  }, ["addInspectionContactRow", "removeInspectionContactRow", "updateInspectionContactField"]);

  context.addInspectionContactRow("TSK-1", "COL-1");
  const row = task.inspectionTaskContacts[0];
  assert.equal(row.applyScope, "task");
  context.updateInspectionContactField({
    dataset: { task: "TSK-1", collateral: "COL-1", contactId: row.id, contactScope: "task", inspectionContactField: "applyBinding" },
    value: "collateral::COL-2"
  });
  assert.equal(row.applyScope, "collateral");
  assert.equal(row.applyValue, "COL-2");
  assert.deepEqual(applicationContact, { id: "APP-CONTACT", applyScope: "application", applyValue: "" });

  const rowsContext = run(extract("getAdditionalInspectionContactRows", "getInspectionRightsFields"), {
    getTaskApplication: () => ({ id: "APP-1" }),
    doesApplicationContactApplyToTarget: (contact, _application, currentTask, collateral) => contact.applyScope === "application"
      || (contact.applyScope === "task" && contact.applyValue === currentTask.id)
      || (contact.applyScope === "collateral" && contact.applyValue === collateral?.id)
  }, ["getAdditionalInspectionContactRows"]);
  assert.equal(rowsContext.getAdditionalInspectionContactRows(task, { id: "COL-1" }).length, 0);
  assert.equal(rowsContext.getAdditionalInspectionContactRows(task, { id: "COL-2" }).length, 1);
  context.removeInspectionContactRow("TSK-1", "COL-1", -1, row.id, "task");
  assert.equal(task.inspectionTaskContacts.length, 0);
});
