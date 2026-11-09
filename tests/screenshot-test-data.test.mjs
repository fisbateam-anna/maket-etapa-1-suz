import assert from "node:assert/strict";
import test from "node:test";
import { initialData, resolveCollateralSubtype } from "../src/data.js";

const addedTaskPrefix = "tsk-09112026-";
const addedApplicationPrefix = "app-09112026-";
const stage1TaskTypes = [
  "Первичный осмотр",
  "Повторный осмотр",
  "Единичная переоценка",
  "Списочная переоценка",
  "Плановый мониторинг",
  "Внеплановый мониторинг",
  "Регистрация залога"
];

const identityFields = [
  "Кадастровый номер",
  "Условный номер",
  "VIN",
  "Идентификационный номер транспортного средства (VIN)",
  "Идентификационный номер самоходной машины",
  "Идентификационный номер ТС или СМ (VIN, PIN, заводской)",
  "Серийный номер",
  "Заводской номер",
  "Инвентарный номер",
  "Номер вагона",
  "Опознавательные знаки воздушного судна",
  "Серийный (заводской) номер",
  "Идентификационный номер",
  "Номер IMO",
  "Договор имущественных прав",
  "Номер договора",
  "Идентификационный признак (значение)"
];

test("screenshot data adds at least three tasks for each Stage 1 type except defect inspection", () => {
  const addedTasks = initialData.tasks.filter((task) => task.id.startsWith(addedTaskPrefix));
  assert.equal(addedTasks.length, 21);
  for (const type of stage1TaskTypes) {
    assert.equal(addedTasks.filter((task) => task.type === type).length, 3, `${type} should have three added tasks`);
  }
  assert.ok(addedTasks.every((task) => task.type !== "Дефектовка"));
  assert.equal(new Set(addedTasks.map((task) => task.id)).size, addedTasks.length);
});

test("added applications and tasks have reciprocal links and populated initiator segments", () => {
  const addedApplications = initialData.applications.filter((application) => application.id.startsWith(addedApplicationPrefix));
  const addedTasks = initialData.tasks.filter((task) => task.id.startsWith(addedTaskPrefix));
  assert.equal(addedApplications.length, 12);

  for (const application of initialData.applications) {
    assert.ok(application.initiatorSegment?.trim(), `${application.id} must have an initiator segment`);
    assert.ok(application.taskIds?.length, `${application.id} must link to at least one task`);
    for (const taskId of application.taskIds) {
      const task = initialData.tasks.find((item) => item.id === taskId);
      assert.ok(task, `${application.id} references missing task ${taskId}`);
      assert.equal(task.applicationId, application.id, `${task.id} must point back to ${application.id}`);
    }
  }

  for (const task of addedTasks) {
    assert.ok(task.initiatorSegment?.trim(), `${task.id} must have an initiator segment for registry display`);
    for (const collateralId of task.collateralIds) {
      assert.ok(initialData.collaterals.some((collateral) => collateral.id === collateralId), `${task.id} references missing collateral ${collateralId}`);
    }
    if (task.createdFromApplicationAutomatically) {
      const application = initialData.applications.find((item) => item.id === task.applicationId);
      assert.ok(application, `${task.id} needs its source application`);
      assert.equal(task.author, application.initiator, `${task.id} author should be the application initiator`);
      assert.equal(task.assignmentComment, application.comment, `${task.id} assignment comment should copy the application comment`);
    }
    if (task.parentTaskId) assert.ok(initialData.tasks.some((item) => item.id === task.parentTaskId), `${task.id} parent task must exist`);
  }

  for (const task of addedTasks.filter((item) => item.type === "Повторный осмотр")) {
    const parent = initialData.tasks.find((item) => item.id === task.parentTaskId);
    assert.equal(parent?.type, "Первичный осмотр", `${task.id} must follow an inspection task`);
    assert.equal(task.applicationId, parent.applicationId, `${task.id} and its parent must belong to the same application`);
    assert.ok(task.collateralIds.every((id) => parent.collateralIds.includes(id)), `${task.id} collateral must be present in its parent task`);
  }
});

test("new task and application creation times follow their daily sequence", () => {
  const addedTasks = initialData.tasks.filter((task) => task.id.startsWith(addedTaskPrefix));
  const addedApplications = initialData.applications.filter((application) => application.id.startsWith(addedApplicationPrefix));
  const isOrdered = (records) => records.every((record, index) => index === 0 || records[index - 1].createdAt <= record.createdAt);
  assert.ok(isOrdered(addedTasks), "task timestamps should increase with task sequence");
  assert.ok(isOrdered(addedApplications), "application timestamps should increase with application sequence");
});

test("all seeded collateral cards have realistic names, identity data, owners, subtype, and creation date", () => {
  assert.ok(initialData.collaterals.length >= 50);
  for (const collateral of initialData.collaterals) {
    assert.ok(collateral.id, "collateral id is required");
    assert.ok(collateral.type, `${collateral.id} needs a collateral type`);
    assert.ok((collateral.name || collateral.description || "").trim(), `${collateral.id} needs an object name`);
    assert.ok(collateral.clientName?.trim(), `${collateral.id} needs a client`);
    assert.ok(collateral.pledgors?.some((pledgor) => pledgor.name?.trim() && pledgor.role?.trim() && pledgor.idn?.trim()), `${collateral.id} needs a named pledgor with tax ID`);
    assert.ok(Object.keys(collateral.fields || {}).length >= 3, `${collateral.id} needs type-specific attributes`);
    assert.ok(identityFields.some((field) => String(collateral.fields?.[field] || "").trim()), `${collateral.id} needs a type-specific identifier`);
    assert.match(collateral.createdAt || "", /^\d{4}-\d{2}-\d{2}$/, `${collateral.id} needs a creation date`);
    assert.ok(resolveCollateralSubtype(collateral), `${collateral.id} needs a valid subtype`);

    const visibleContent = [collateral.name, collateral.description, ...Object.values(collateral.fields || {})].join(" ");
    assert.doesNotMatch(visibleContent, /тестовый объект|заполнить позже|не указано/i, `${collateral.id} contains placeholder content`);
  }
});
