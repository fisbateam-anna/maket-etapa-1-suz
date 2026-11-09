import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function extractBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

function createEscapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

test("application card shows every unresolved task return with an individual response action", () => {
  const helperSource = extractBetween("function getApplicationReturnRequests(application)", "function getApplicationCollaterals(application)");
  const renderSource = extractBetween("function renderApplicationReturnNotice(application)", "function renderApplicationLinkedTaskIdCell(task)");
  const activeTask = {
    id: "tsk-23102026-003",
    type: "Физический осмотр",
    status: "Ожидание",
    assignee: "Анна Инициатор",
    returnToInitiator: {
      date: "2026-10-23 11:20",
      user: "Иван Исполнитель",
      initiator: "Анна Инициатор",
      reason: "Недостаточно документов по заявке",
      comment: "Приложите выписку ЕГРН по квартире <COL-1> и подтвердите площадь."
    }
  };
  const olderTask = {
    id: "tsk-22102026-001",
    type: "Оценка залога",
    status: "Ожидание",
    assignee: "Анна Инициатор",
    returnToInitiator: {
      date: "2026-10-22 10:00",
      user: "Мария Верификатор",
      initiator: "Анна Инициатор",
      reason: "Не хватает сведений",
      comment: "Уточните дату предыдущей оценки."
    }
  };
  const resolvedTask = {
    id: "tsk-21102026-002",
    status: "В работе",
    returnToInitiator: { date: "2026-10-21 10:00", resolvedAt: "2026-10-21 13:00" }
  };
  const sandbox = {
    getApplicationTasks: () => [olderTask, activeTask, resolvedTask],
    getTaskApplicationInitiator: () => "Анна Инициатор",
    getTaskDisplayType: (task) => task.type,
    getRole: () => ({ user: "Анна Инициатор" }),
    escapeHtml: createEscapeHtml,
    getTaskCardRoute: (task) => `/app/tasks/${task.id}`
  };
  vm.runInNewContext(`${helperSource}\n${renderSource}\nglobalThis.renderNotice = renderApplicationReturnNotice;`, sandbox);
  const html = sandbox.renderNotice({ id: "app-1" });
  assert.match(html, /Требуется доработка заявки/);
  assert.match(html, /Ответьте отдельно по каждому возврату/);
  assert.doesNotMatch(html, /Активных возвратов:/);
  assert.match(html, /Причина возврата/);
  assert.match(html, /Недостаточно документов по заявке/);
  assert.match(html, /Комментарий при возврате/);
  assert.doesNotMatch(html, /Что нужно сделать/);
  assert.match(html, /Приложите выписку ЕГРН по квартире &lt;COL-1&gt;/);
  assert.match(html, /Уточните дату предыдущей оценки/);
  assert.match(html, /Иван Исполнитель/);
  assert.match(html, /2026-10-23 11:20/);
  assert.match(html, /Дата возврата/);
  assert.doesNotMatch(html, />Дата</);
  assert.doesNotMatch(html, /Ожидает ответа/);
  assert.match(html, /data-route="\/app\/tasks\/tsk-23102026-003"/);
  assert.match(html, /data-application-return-response="tsk-23102026-003" required/);
  assert.match(html, /data-application-return-response="tsk-22102026-001" required/);
  assert.equal((html.match(/data-action="submit-application-return-response"/g) || []).length, 2);
  assert.equal((html.match(/>Вернуть исполнителю<\/button>/g) || []).length, 2);
  assert.doesNotMatch(html, /Отправить задачу/);
  assert.ok(html.indexOf("tsk-23102026-003") < html.indexOf("tsk-22102026-001"), "Newest active return should be listed first");
  assert.doesNotMatch(html, /tsk-21102026-002/, "Resolved returns must not be displayed");
});

test("application card hides the return notice after the task is resumed", () => {
  const helperSource = extractBetween("function getApplicationReturnRequests(application)", "function getApplicationCollaterals(application)");
  const renderSource = extractBetween("function renderApplicationReturnNotice(application)", "function renderApplicationLinkedTaskIdCell(task)");
  const sandbox = {
    getApplicationTasks: () => [{
      id: "tsk-23102026-003",
      status: "В работе",
      returnToInitiator: { reason: "Иное", comment: "Уточните данные", resolvedAt: "2026-10-23 12:00" }
    }],
    escapeHtml: createEscapeHtml,
    getTaskCardRoute: () => "/app/tasks/tsk-1"
  };
  vm.runInNewContext(`${helperSource}\n${renderSource}\nglobalThis.renderNotice = renderApplicationReturnNotice;`, sandbox);
  assert.equal(sandbox.renderNotice({ id: "app-1" }), "");
});

test("return-to-initiator requires a concrete instruction and records it on the linked application", () => {
  const submitSource = extractBetween("function submitReturnToInitiator(taskId)", "function completeTask(taskId)");
  const task = { id: "tsk-23102026-003", status: "В работе", assignee: "Иван Исполнитель", route: [] };
  const application = { id: "app-1", status: "В работе" };
  let comment = "";
  const history = [];
  const toasts = [];
  const sandbox = {
    RETURN_TO_INITIATOR_REASONS: ["Недостаточно документов по заявке", "Иное"],
    state: { modal: { type: "returnToInitiator" } },
    document: { getElementById: (id) => ({ value: id === "returnInitiatorReason" ? "Недостаточно документов по заявке" : comment }) },
    getTask: () => task,
    isTaskClosed: () => false,
    canUseRouteAction: () => true,
    getTaskApplicationInitiator: () => "Анна Инициатор",
    getTaskApplication: () => application,
    getRole: () => ({ user: "Иван Исполнитель" }),
    formatTaskHistoryDate: () => "2026-10-23 11:20",
    addTaskHistoryEvent: (_task, event) => history.push(event),
    addToast: (...args) => toasts.push(args)
  };
  vm.runInNewContext(`${submitSource}\nglobalThis.submit = submitReturnToInitiator;`, sandbox);
  sandbox.submit(task.id);
  assert.equal(task.status, "В работе", "empty instructions must not route the task");
  assert.equal(toasts[0][0], "Уточните, что требуется");

  comment = "Приложите выписку ЕГРН и укажите кадастровый номер.";
  sandbox.submit(task.id);
  assert.equal(task.status, "Ожидание");
  assert.equal(task.assignee, "Анна Инициатор");
  assert.equal(application.status, "На доработке инициатором");
  assert.equal(task.returnToInitiator.reason, "Недостаточно документов по заявке");
  assert.equal(task.returnToInitiator.comment, comment);
  assert.equal(task.returnToInitiator.previousAssignee, "Иван Исполнитель");
  assert.equal(history[0].action, "Возврат заявки на инициатора");
});

test("starting a returned task resolves the current notice and returns it to the previous assignee", () => {
  const startSource = extractBetween("function startTask(taskId)", "function deferTask(taskId)");
  const task = {
    id: "tsk-23102026-003",
    status: "Ожидание",
    assignee: "Анна Инициатор",
    returnToInitiator: {
      initiator: "Анна Инициатор",
      previousAssignee: "Иван Исполнитель",
      reason: "Недостаточно документов по заявке",
      comment: "Приложите выписку ЕГРН.",
      responseComment: "Выписку ЕГРН приложила."
    }
  };
  const application = { id: "app-1", status: "На доработке инициатором" };
  const events = [];
  const sandbox = {
    getTask: () => task,
    isTaskClosed: () => false,
    formatTaskHistoryDate: () => "2026-10-23 12:05",
    getRole: () => ({ user: "Анна Инициатор" }),
    getTaskApplication: () => application,
    getApplicationReturnRequest: () => null,
    addTaskHistoryEvent: (_task, event) => events.push(event),
    addToast: () => {}
  };
  vm.runInNewContext(`${startSource}\nglobalThis.start = startTask;`, sandbox);
  sandbox.start(task.id);
  assert.equal(task.status, "В работе");
  assert.equal(task.assignee, "Иван Исполнитель");
  assert.ok(task.returnToInitiator.resolvedAt);
  assert.equal(application.status, "В работе");
  assert.equal(events[0].action, "Ручное возобновление");
  assert.match(events[0].comment, /Ответ инициатора: Выписку ЕГРН приложила\./);
});

test("sending a return resumes only the selected task and keeps the application pending for others", () => {
  const returnsSource = extractBetween("function getApplicationReturnRequests(application)", "function getApplicationCollaterals(application)");
  const startSource = extractBetween("function startTask(taskId)", "function deferTask(taskId)");
  const submitSource = extractBetween("function submitApplicationReturnResponse(taskId)", "function completeTask(taskId)");
  const taskA = {
    id: "tsk-23102026-003",
    status: "Ожидание",
    assignee: "Анна Инициатор",
    returnToInitiator: {
      date: "2026-10-23 11:20",
      initiator: "Анна Инициатор",
      previousAssignee: "Иван Исполнитель",
      reason: "Недостаточно документов",
      comment: "Приложите выписку ЕГРН."
    }
  };
  const taskB = {
    id: "tsk-22102026-001",
    status: "Ожидание",
    assignee: "Анна Инициатор",
    returnToInitiator: {
      date: "2026-10-22 10:00",
      initiator: "Анна Инициатор",
      previousAssignee: "Мария Верификатор",
      reason: "Нет сведений",
      comment: "Уточните дату оценки."
    }
  };
  const tasks = [taskA, taskB];
  const application = { id: "app-1", status: "На доработке инициатором" };
  const fields = [
    { dataset: { applicationReturnResponse: taskA.id }, value: "Выписку ЕГРН приложила." },
    { dataset: { applicationReturnResponse: taskB.id }, value: "" }
  ];
  const events = [];
  const toasts = [];
  const sandbox = {
    getApplicationTasks: () => tasks,
    getTask: (id) => tasks.find((task) => task.id === id),
    getTaskApplication: () => application,
    getTaskApplicationInitiator: (task) => task.returnToInitiator.initiator,
    getApplicationReturnRequest: (item) => sandbox.getApplicationReturnRequests(item)[0] || null,
    getRole: () => ({ user: "Анна Инициатор" }),
    isTaskClosed: () => false,
    formatTaskHistoryDate: () => "2026-10-24 09:30",
    addTaskHistoryEvent: (task, event) => { events.push({ taskId: task.id, ...event }); },
    addToast: (...args) => toasts.push(args),
    document: { querySelectorAll: () => fields }
  };
  vm.runInNewContext(`${returnsSource}\n${startSource}\n${submitSource}\nglobalThis.submit = submitApplicationReturnResponse;`, sandbox);

  sandbox.submit(taskA.id);
  assert.equal(taskA.status, "В работе");
  assert.equal(taskA.assignee, "Иван Исполнитель");
  assert.equal(taskA.returnToInitiator.responseComment, "Выписку ЕГРН приложила.");
  assert.equal(taskA.returnToInitiator.responseBy, "Анна Инициатор");
  assert.equal(taskB.status, "Ожидание");
  assert.equal(Boolean(taskB.returnToInitiator.resolvedAt), false);
  assert.equal(application.status, "На доработке инициатором");
  assert.match(events.find((event) => event.taskId === taskA.id).comment, /Ответ инициатора: Выписку ЕГРН приложила\./);

  fields[1].value = "Дату предыдущей оценки уточнила.";
  sandbox.submit(taskB.id);
  assert.equal(taskB.status, "В работе");
  assert.equal(taskB.assignee, "Мария Верификатор");
  assert.equal(application.status, "В работе");
});

test("a return cannot be sent without a response or by a non-initiator", () => {
  const startSource = extractBetween("function startTask(taskId)", "function deferTask(taskId)");
  const submitSource = extractBetween("function submitApplicationReturnResponse(taskId)", "function completeTask(taskId)");
  const task = {
    id: "tsk-23102026-003",
    status: "Ожидание",
    assignee: "Анна Инициатор",
    returnToInitiator: { initiator: "Анна Инициатор", previousAssignee: "Иван Исполнитель" }
  };
  let currentUser = "Анна Инициатор";
  const toasts = [];
  const sandbox = {
    getTask: () => task,
    getTaskApplicationInitiator: () => "Анна Инициатор",
    getTaskApplication: () => ({ id: "app-1" }),
    getTaskApplicationNumber: () => "app-1",
    getApplicationReturnRequest: () => null,
    getRole: () => ({ user: currentUser }),
    isTaskClosed: () => false,
    formatTaskHistoryDate: () => "2026-10-24 09:30",
    addTaskHistoryEvent: () => {},
    addToast: (...args) => toasts.push(args),
    document: { querySelectorAll: () => [{ dataset: { applicationReturnResponse: task.id }, value: "  " }] }
  };
  vm.runInNewContext(`${startSource}\n${submitSource}\nglobalThis.submit = submitApplicationReturnResponse;`, sandbox);
  sandbox.submit(task.id);
  assert.equal(task.status, "Ожидание");
  assert.equal(toasts.at(-1)[0], "Укажите комментарий");

  currentUser = "Иван Исполнитель";
  sandbox.submit(task.id);
  assert.equal(task.status, "Ожидание");
  assert.equal(toasts.at(-1)[0], "Ответ недоступен");
});
