import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function extract(startMarker, endMarker, context, exportName) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
  vm.runInNewContext(`${source.slice(start, end)}\nglobalThis.result = ${exportName};`, context);
  return context.result;
}

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

test("shared contact table uses the same ordered columns and distinct comment fields", () => {
  const renderBlock = extract(
    "function renderContactPersonsBlock",
    "\nfunction renderContactPersonEditableCells",
    { escapeHtml },
    "renderContactPersonsBlock"
  );
  const headers = [
    "Роль",
    "ФИО / наименование",
    "Телефон контактного лица",
    "Применяется к",
    "Комментарий инициатора",
    "Комментарий исполнителя",
    "Дата звонка"
  ];
  const html = renderBlock({
    contacts: [],
    showCollateralBinding: true,
    bindingLabel: "Применяется к",
    phoneLabel: "Телефон контактного лица",
    showCallDate: true,
    renderRow: () => ""
  });
  const positions = headers.map((header) => html.indexOf(`<th>${header}</th>`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.equal((html.match(/Комментарий инициатора/g) || []).length, 1);
  assert.equal((html.match(/Комментарий исполнителя/g) || []).length, 1);
});

test("application and task contact rows render both comments as distinct controls", () => {
  const renderCells = extract(
    "function renderContactPersonEditableCells",
    "\nfunction createApplicationContactRow",
    { escapeHtml, formatContactCallDateValue: (value) => value },
    "renderContactPersonEditableCells"
  );
  const applicationHtml = renderCells({
    role: "Представитель",
    name: "Анна Иванова",
    phone: "+7 900 000-00-00",
    initiatorComment: "Звонить после 10:00",
    executorComment: "Задача s-1126-0001, COL-1: связались",
    callDate: ""
  }, "application-contact-field", 'data-index="0"', "<td>Вся заявка</td>", { executorCommentReadOnly: true });
  const taskHtml = renderCells({
    role: "Представитель",
    name: "Анна Иванова",
    phone: "+7 900 000-00-00",
    initiatorComment: "Звонить после 10:00",
    executorComment: "Связались, доступ подтвержден",
    callDate: ""
  }, "inspection-contact-field", 'data-contact-key="contact-1"', "<td>Текущая задача</td>", { initiatorCommentReadOnly: true });

  for (const html of [applicationHtml, taskHtml]) {
    assert.match(html, /aria-label="Комментарий инициатора"/);
    assert.match(html, /aria-label="Комментарий исполнителя"/);
    assert.match(html, /data-application-contact-field="initiatorComment"|data-inspection-contact-field="initiatorComment"/);
    assert.match(html, /data-application-contact-field="executorComment"|data-inspection-contact-field="executorComment"/);
  }
  assert.match(applicationHtml, /data-application-contact-field="executorComment"[^>]*readonly/);
  assert.match(taskHtml, /data-inspection-contact-field="initiatorComment"[^>]*readonly/);
});

test("legacy application comment normalizes to initiator comment, while explicit values stay separate", () => {
  const normalize = extract(
    "function normalizeApplicationContactRow",
    "\nfunction getDraftApplicationContacts",
    {
      uniqueItems: (items) => [...new Set(items)],
      parseListValue: (value) => value ? [value] : [],
      getNormalizedApplicationContactBinding: () => ({ scope: "application", value: "" })
    },
    "normalizeApplicationContactRow"
  );
  const legacy = normalize({ comment: "Комментарий из старой заявки" });
  assert.equal(legacy.initiatorComment, "Комментарий из старой заявки");
  assert.equal(legacy.executorComment, "");

  const current = normalize({ initiatorComment: "Инициатор", executorComment: "Исполнитель", comment: "устаревший" });
  assert.equal(current.initiatorComment, "Инициатор");
  assert.equal(current.executorComment, "Исполнитель");
});

test("legacy task comment normalizes to executor comment without replacing initiator text", () => {
  const applyResult = extract(
    "function applyInspectionContactResult",
    "\nfunction getDefaultInspectionContactRows",
    { getInspectionContactKey: () => "contact-1" },
    "applyInspectionContactResult"
  );
  const contact = { id: "contact-1", comment: "Заметка инициатора", initiatorComment: "Заметка инициатора" };
  const migrated = applyResult(contact, {
    inspectionContactResults: { "COL-1": { "contact-1": { comment: "Старый комментарий исполнителя" } } }
  }, "COL-1");
  assert.equal(migrated.initiatorComment, "Заметка инициатора");
  assert.equal(migrated.executorComment, "Старый комментарий исполнителя");

  const separate = applyResult(contact, {
    inspectionContactResults: { "COL-1": { "contact-1": { initiatorComment: "Новый инициатор", executorComment: "Новый исполнитель" } } }
  }, "COL-1");
  assert.equal(separate.initiatorComment, "Заметка инициатора");
  assert.equal(separate.executorComment, "Новый исполнитель");
});

test("application summarizes task executor comments with task and collateral context", () => {
  const summarize = extract(
    "function getApplicationContactExecutorCommentSummary",
    "\nfunction renderApplicationContactApplySelect",
    {
      getInspectionContactKey: () => "contact-1",
      getTaskCollaterals: (task) => task.collaterals,
      parseApplicationContactBinding: (value) => {
        const [scope, ...rest] = value.split("::");
        return { scope, value: rest.join("::") };
      },
      doesApplicationContactApplyToTarget: (contact, _application, _task, collateral) => contact.applyScope !== "collateral" || contact.applyValue === collateral.id,
      getCollateralObjectIdentifier: (collateral) => collateral.identifier
    },
    "getApplicationContactExecutorCommentSummary"
  );
  const task = {
    id: "s-1126-0001",
    number: "s-1126-0001",
    collaterals: [{ id: "COL-1", identifier: "VIN-001" }, { id: "COL-2", identifier: "VIN-002" }],
    inspectionContactResults: {
      "COL-1": { "contact-1": { executorComment: "Доступ подтвержден" } },
      "COL-2": { "contact-1": { comment: "Ожидается звонок" } }
    }
  };
  const all = summarize({ id: "contact-1", applyScope: "application" }, { id: "APP-1" }, [task]);
  assert.match(all, /s-1126-0001, VIN-001: Доступ подтвержден/);
  assert.match(all, /s-1126-0001, VIN-002: Ожидается звонок/);

  const oneObject = summarize({ id: "contact-1", applyScope: "collateral", applyValue: "COL-2" }, { id: "APP-1" }, [task]);
  assert.equal(oneObject, "Задача s-1126-0001, VIN-002: Ожидается звонок");

  const movedBindingTask = {
    ...task,
    inspectionContactBindings: { "contact-1": "collateral::COL-2" }
  };
  const taskOverride = summarize({ id: "contact-1", applyScope: "collateral", applyValue: "COL-1" }, { id: "APP-1" }, [movedBindingTask]);
  assert.equal(taskOverride, "Задача s-1126-0001, VIN-002: Ожидается звонок");
});

test("task executor comment updates only task state and keeps initiator comment intact", () => {
  const task = {
    id: "s-1126-0001",
    inspectionContactResults: { "COL-1": { "contact-1": { initiatorComment: "Инициатор", executorComment: "Старое", comment: "Старое" } } }
  };
  const applicationContact = { id: "contact-1", initiatorComment: "Инициатор", comment: "Инициатор" };
  const update = extract(
    "function updateInspectionContactField",
    "\nfunction updateInspectionResolutionField",
    {
      getTask: () => task,
      getInspectionContactResultStore: (current, collateralId) => current.inspectionContactResults[collateralId],
      persistTaskState: () => {}
    },
    "updateInspectionContactField"
  );
  update({
    dataset: { task: task.id, collateral: "COL-1", inspectionContactField: "executorComment", contactKey: "contact-1" },
    value: "Новая заметка исполнителя"
  });
  assert.equal(task.inspectionContactResults["COL-1"]["contact-1"].executorComment, "Новая заметка исполнителя");
  assert.equal(task.inspectionContactResults["COL-1"]["contact-1"].initiatorComment, "Инициатор");
  assert.equal(applicationContact.initiatorComment, "Инициатор");
  assert.equal(applicationContact.comment, "Инициатор");
});

test("application accepts initiator comment changes and does not accept executor-comment edits", () => {
  const row = { comment: "Старое", initiatorComment: "Старое", executorComment: "Сводка задачи" };
  const update = extract(
    "function updateApplicationContactField",
    "\nfunction getCollateralObjectIdentifier",
    {
      state: { newTask: { applicationContacts: [row] } },
      getDraftApplicationContacts: () => [row]
    },
    "updateApplicationContactField"
  );
  update({ dataset: { index: "0", applicationContactField: "initiatorComment" }, value: "Новый комментарий инициатора" });
  assert.equal(row.initiatorComment, "Новый комментарий инициатора");
  assert.equal(row.comment, "Новый комментарий инициатора");
  update({ dataset: { index: "0", applicationContactField: "executorComment" }, value: "Подмена" });
  assert.equal(row.executorComment, "Сводка задачи");
});
