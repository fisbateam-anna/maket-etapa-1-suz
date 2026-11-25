import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Function ${name} should exist`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `Function ${name} should be complete`);
  return source.slice(start, end + 2);
}

function createTaskAccessContext(task) {
  const source = [
    extractFunction(app, "hasTaskEnteredWork"),
    extractFunction(app, "getTaskSplitEligibleCollaterals"),
    extractFunction(app, "hasTaskApplicationRecord"),
    extractFunction(app, "canSplitTaskByCollateral"),
    "globalThis.api = { task, hasTaskEnteredWork, canSplitTaskByCollateral };"
  ].join("\n");
  const application = Object.hasOwn(task, "application") ? task.application : { id: "app-1", number: "app-1" };
  const context = {
    task,
    normalizeTaskStatus: (status) => status || "Назначена",
    normalizeTaskHistoryEvent: (event) => ({ ...event, action: event.action || "" }),
    normalizeTaskHistoryAction: (action) => action,
    getTaskApplication: () => application,
    getTaskApplicationNumber: () => application?.number || "",
    getApplicationByNumber: (number) => application?.number === number ? application : null,
    getTaskCollaterals: (current) => current.collaterals || [],
    isTaskCollateralExcluded: (current, id) => (current.excludedCollateralIds || []).includes(id),
    isTaskClosed: (current) => current?.status === "Завершена"
  };
  vm.runInNewContext(source, context);
  return context.api;
}

function createSubmitContext({ selectedIds, status = "Назначена", history = [], applicationExists = true, persistResult = true } = {}) {
  const application = {
    id: "app-record-1",
    number: "app-1126-001",
    source: "Ручное создание",
    taskIds: ["tsk-parent"],
    collateralIds: ["COL-1", "COL-3"]
  };
  const parent = {
    id: "tsk-parent",
    type: "Списочная оценка",
    status,
    applicationNumber: "app-1126-001",
    applicationSource: "Ручное создание",
    inspectionFormat: "Первичная оценка",
    assignee: "Исполнитель",
    dueDate: "2026-11-30",
    contractNumber: "CR-1",
    dealProduct: "Кредит",
    collateralId: "COL-1",
    collateralIds: ["COL-1", "COL-2", "COL-3"],
    collaterals: [{ id: "COL-1" }, { id: "COL-2" }, { id: "COL-3" }],
    applicationId: application.id,
    history
  };
  const state = {
    modal: { type: "subtask", taskId: parent.id },
    taskActiveCollateral: { [parent.id]: "COL-1" },
    data: { tasks: [parent], applications: [application] }
  };
  const calls = { create: 0, persist: 0, history: [], toasts: [] };
  let payload;
  const context = {
    state,
    parent,
    calls,
    clone: (value) => JSON.parse(JSON.stringify(value)),
    document: {
      querySelectorAll: () => selectedIds.map((id) => ({ dataset: { subtaskCollateral: id } })),
      getElementById: (id) => ({
        subtaskAssignee: { value: "New executor" },
        subtaskDue: { value: "2026-12-01" },
        subtaskComment: { value: "Split selected work" },
        subtaskInspectionMethod: { value: "" }
      })[id] || null
    },
    window: { location: { hash: "" } },
    getTask: () => parent,
    isTaskClosed: (task) => task?.status === "Завершена",
    hasTaskEnteredWork: (task) => task?.status === "В работе" || (task?.history || []).some((event) => event.status === "В работе" || event.oldValue === "В работе" || event.newValue === "В работе" || event.action === "Принятие в работу"),
    getTaskApplicationNumber: (task) => task.applicationNumber,
    getTaskApplication: () => applicationExists ? application : null,
    getApplicationByNumber: (number) => applicationExists && number === application.number ? application : null,
    uniqueItems: (items) => [...new Set(items.filter(Boolean))],
    getTaskSplitEligibleCollaterals: (task) => task.collaterals.filter((item) => !(task.excludedCollateralIds || []).includes(item.id)),
    addToast: (...args) => calls.toasts.push(args),
    isInspectionTaskType: () => false,
    normalizeInspectionVisitMethodForTask: (_task, method) => method,
    createTask: (nextPayload) => {
      calls.create += 1;
      payload = nextPayload;
      const child = {
        id: "tsk-child",
        type: nextPayload.type,
        status: "Назначена",
        collateralId: nextPayload.collateralId,
        collateralIds: nextPayload.collateralIds,
        parentTaskId: nextPayload.parentTaskId,
        applicationId: application.id,
        applicationNumber: application.number,
        history: []
      };
      application.collateralIds = [...new Set([...application.collateralIds, ...nextPayload.collateralIds])];
      application.clientName = "Изменено общим helper";
      state.data.tasks.unshift(child);
      application.taskIds.push(child.id);
      return child;
    },
    normalizeApplicationDealProduct: (value) => value,
    getTaskApplicationSubtypeValue: () => "",
    employees: ["Employee"],
    getTaskCollateralIds: (task) => [...new Set([...(task.collateralIds || []), task.collateralId].filter(Boolean))],
    formatTaskHistoryDate: () => "2026-11-24 14:30",
    addTaskHistoryEvent: (task, event, options) => {
      task.history.unshift({ ...event });
      calls.history.push({ taskId: task.id, event, options });
    },
    persistTaskState: () => { calls.persist += 1; return persistResult; },
    getTaskCardRoute: (task) => `#/app/tasks/${task.id}`,
    getTaskDisplayType: (task) => task.type,
    pluralize: () => "объекта"
  };
  vm.runInNewContext(`${extractFunction(app, "submitSubtask")}\nglobalThis.submit = submitSubtask;`, context);
  return { context, parent, state, calls, getPayload: () => payload };
}

test("task split action is available only before the first transition to in progress", () => {
  const access = createTaskAccessContext({ status: "Назначена", collaterals: [{ id: "COL-1" }, { id: "COL-2" }] });
  assert.equal(access.canSplitTaskByCollateral(access.task), true);
  const noApplication = { status: "Назначена", collaterals: [{ id: "COL-1" }, { id: "COL-2" }], application: null };
  assert.equal(createTaskAccessContext(noApplication).canSplitTaskByCollateral(noApplication), false);

  const startedThenReturned = {
    status: "Назначена",
    collaterals: [{ id: "COL-1" }, { id: "COL-2" }],
    history: [{ action: "Принятие в работу", status: "В работе", newValue: "В работе" }]
  };
  const returnedAccess = createTaskAccessContext(startedThenReturned);
  assert.equal(returnedAccess.hasTaskEnteredWork(startedThenReturned), true);
  assert.equal(returnedAccess.canSplitTaskByCollateral(startedThenReturned), false);

  const startedByHistoricalValue = {
    status: "Ожидание",
    collaterals: [{ id: "COL-1" }, { id: "COL-2" }],
    history: [{ action: "Возврат заявки на инициатора", oldValue: "В работе", newValue: "Ожидание" }]
  };
  assert.equal(createTaskAccessContext(startedByHistoricalValue).canSplitTaskByCollateral(startedByHistoricalValue), false);
  for (const status of ["В работе", "Ожидание", "Отложена", "Завершена"]) {
    const nonPreWork = { status, collaterals: [{ id: "COL-1" }, { id: "COL-2" }] };
    assert.equal(createTaskAccessContext(nonPreWork).canSplitTaskByCollateral(nonPreWork), false, `${status} must not allow splitting`);
  }
});

test("split button is always visible, enabled only when allowed, and adjacent to return action", () => {
  const renderer = extractFunction(app, "getTaskRouteActionButtons");
  const context = {
    canSplitTaskByCollateral: (task) => task.status === "Назначена",
    canUseRouteAction: (task) => task.status === "В работе",
    escapeHtml: (value) => String(value ?? ""),
    getRole: () => ({}),
    canSendTaskToRevision: () => true,
    isInspectionTaskType: () => false,
    isMonitoringTaskType: () => false,
    isValuationTaskType: () => false
  };
  vm.runInNewContext(`${renderer}\nglobalThis.render = getTaskRouteActionButtons;`, context);
  const assignedHtml = context.render({ id: "tsk-1", status: "Назначена" }).join("");
  assert.match(assignedHtml, /data-action="open-subtask"[^>]*>Разделить задачу<\/button>/);
  assert.doesNotMatch(assignedHtml, /data-action="open-subtask"[^>]*disabled/);

  const inProgressHtml = context.render({ id: "tsk-1", status: "В работе" }).join("");
  assert.match(inProgressHtml, /data-action="open-subtask"[^>]*disabled[^>]*>Разделить задачу<\/button>/);
  assert.match(inProgressHtml, /Разделить задачу<\/button><button[^>]*>Вернуть на инициатора<\/button>/);
  assert.doesNotMatch(assignedHtml, /Создать задачу по заявке/);

  for (const status of ["Новая", "Назначена", "В работе", "Ожидание", "Отложена", "Завершена"]) {
    assert.match(context.render({ id: "tsk-1", status }).join(""), /Разделить задачу/);
  }
});

test("task header actions do not include launch-field-inspection button", () => {
  const start = app.indexOf("function renderTaskHeaderActions(");
  const end = app.indexOf("\nfunction getTaskHeaderTitle", start);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(app.slice(start, end), /launch-task-field-inspection|Запустить выездной осмотр/);
});

test("split moves the selected objects, creates same-type linked task, writes both histories and persists once", () => {
  const { context, parent, state, calls, getPayload } = createSubmitContext({ selectedIds: ["COL-2"] });
  context.submit(parent.id);

  const payload = getPayload();
  assert.equal(calls.create, 1);
  assert.equal(payload.type, parent.type);
  assert.equal(payload.applicationNumber, parent.applicationNumber);
  assert.equal(payload.parentTaskId, parent.id);
  assert.equal(payload.deferPersist, true);
  assert.deepEqual(payload.collateralIds, ["COL-2"]);
  assert.equal(state.data.tasks[0].applicationId, state.data.applications[0].id);
  assert.equal(state.data.tasks[0].applicationNumber, state.data.applications[0].number);
  assert.equal(parent.collateralId, "COL-1");
  assert.deepEqual(parent.collateralIds, ["COL-1", "COL-3"]);
  assert.deepEqual(state.data.applications[0].collateralIds, ["COL-1", "COL-3"]);
  assert.equal("clientName" in state.data.applications[0], false);
  assert.deepEqual(state.data.applications[0].taskIds, ["tsk-parent", "tsk-child"]);
  assert.equal(calls.history.length, 2);
  assert.deepEqual(calls.history.map((row) => row.event.action), ["Разделение задачи", "Разделение задачи"]);
  assert.ok(calls.history.every((row) => row.options.persist === false));
  assert.match(calls.history[0].event.comment, /tsk-child/);
  assert.match(calls.history[0].event.comment, /COL-2/);
  assert.match(calls.history[1].event.comment, /tsk-parent/);
  assert.equal(calls.persist, 1);
  assert.equal(state.modal, null);
  assert.equal(state.taskActiveCollateral[parent.id], "COL-1");
  assert.equal(state.taskActiveCollateral["tsk-child"], "COL-2");
  assert.equal(context.window.location.hash, "#/app/tasks/tsk-child");
});

test("split rejects transferring every active object without creating or persisting a task", () => {
  const { context, parent, calls, getPayload } = createSubmitContext({ selectedIds: ["COL-1", "COL-2", "COL-3"] });
  const originalIds = [...parent.collateralIds];
  context.submit(parent.id);

  assert.equal(calls.create, 0);
  assert.equal(getPayload(), undefined);
  assert.deepEqual(parent.collateralIds, originalIds);
  assert.equal(calls.history.length, 0);
  assert.equal(calls.persist, 0);
  assert.match(calls.toasts[0][0], /Нельзя передать все объекты/);
});

test("split rejects stale object IDs and a task that has already entered work", () => {
  const stale = createSubmitContext({ selectedIds: ["COL-99"] });
  stale.context.submit(stale.parent.id);
  assert.equal(stale.calls.create, 0);
  assert.equal(stale.calls.persist, 0);
  assert.match(stale.calls.toasts[0][0], /Состав задачи изменился/);

  const alreadyWorked = createSubmitContext({ selectedIds: ["COL-1"], status: "Назначена", history: [{ action: "Принятие в работу", status: "В работе", newValue: "В работе" }] });
  alreadyWorked.context.submit(alreadyWorked.parent.id);
  assert.equal(alreadyWorked.calls.create, 0);
  assert.equal(alreadyWorked.calls.persist, 0);
  assert.match(alreadyWorked.calls.toasts[0][0], /Разделение недоступно/);
});

test("split rejects a missing linked application without creating a replacement application", () => {
  const { context, parent, calls } = createSubmitContext({ selectedIds: ["COL-1"], applicationExists: false });
  context.submit(parent.id);
  assert.equal(calls.create, 0);
  assert.equal(calls.persist, 0);
  assert.deepEqual(parent.collateralIds, ["COL-1", "COL-2", "COL-3"]);
  assert.match(calls.toasts[0][0], /Связанная заявка не найдена/);
});

test("failed storage write rolls back the new task, application link, parent composition and histories", () => {
  const { context, parent, state, calls } = createSubmitContext({ selectedIds: ["COL-1"], persistResult: false });
  context.submit(parent.id);
  assert.equal(calls.create, 1);
  assert.equal(calls.persist, 1);
  assert.equal(state.data.tasks.length, 1);
  assert.deepEqual(state.data.applications[0].taskIds, ["tsk-parent"]);
  assert.equal(parent.collateralId, "COL-1");
  assert.deepEqual(parent.collateralIds, ["COL-1", "COL-2", "COL-3"]);
  assert.equal(parent.history.length, 0);
  assert.equal(state.taskActiveCollateral[parent.id], "COL-1");
  assert.equal(state.taskActiveCollateral["tsk-child"], undefined);
  assert.equal(state.modal?.type, "subtask");
  assert.match(calls.toasts[0][0], /Разделение не сохранено/);
});

test("persistTaskState reports a localStorage write failure to the caller", () => {
  const context = {
    state: { data: { tasks: [], applications: [], collaterals: [] } },
    legacyObjectNumberAliases: {},
    deletedApplicationIds: [],
    TASK_STATE_STORAGE_KEY: "task-state",
    localStorage: { setItem: () => { throw new Error("quota"); } },
    console: { warn: () => {} }
  };
  vm.runInNewContext(`${extractFunction(app, "persistTaskState")}\nglobalThis.persist = persistTaskState;`, context);
  assert.equal(context.persist(), false);
});

test("subtask modal only lists eligible objects and explains that they leave the source task", () => {
  const renderer = extractFunction(app, "renderSubtaskModal");
  assert.match(renderer, /canSplitTaskByCollateral\(parent\)/);
  assert.match(renderer, /getTaskSplitEligibleCollaterals\(parent\)/);
  assert.match(renderer, /Разделить задачу/);
  assert.match(renderer, /будут удалены из состава исходной задачи/);
  assert.match(renderer, /минимум один активный объект/);
});
