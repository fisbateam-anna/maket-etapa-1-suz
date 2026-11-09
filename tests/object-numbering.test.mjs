import assert from "node:assert/strict";
import test from "node:test";
import { employees, initialData } from "../src/data.js";
import {
  getDailyDateStamp,
  getNextDailyObjectNumber,
  getNextMonthlyCollateralNumber,
  migrateSavedObjectNumbers,
  normalizeCollateralSuzNumbers
} from "../src/object-numbering.js";
import { resolveTaskAuthorName } from "../src/task-author.js";

test("daily number uses local date and independently increments each prefix", () => {
  assert.equal(getDailyDateStamp(new Date(2026, 9, 15, 0, 5)), "15102026");
  assert.equal(getNextDailyObjectNumber("tsk", [{ id: "tsk-15102026-003" }], "2026-10-15"), "tsk-15102026-004");
  assert.equal(getNextDailyObjectNumber("app", [{ id: "app-15102026-003" }], "2026-10-15"), "app-15102026-004");
  assert.equal(getNextDailyObjectNumber("tsk", [{ id: "tsk-15102026-999" }], "2026-10-16"), "tsk-16102026-001");
});

test("legacy saved task and application ids migrate with links and payload preserved", () => {
  const seedData = {
    tasks: [{ id: "tsk-15102026-001", createdAt: "2026-10-15" }],
    applications: [{ id: "app-15102026-001", number: "app-15102026-001", createdAt: "2026-10-15" }]
  };
  const savedState = {
    tasks: [
      {
        id: "TSK-2026-1081",
        createdAt: "2026-06-01",
        applicationId: "APP-2026-0417",
        applicationNumber: "APP-26/0417",
        parentTaskId: "TSK-2026-0999",
        history: [{ comment: "Связана с TSK-2026-0999" }],
        customData: "preserve me; ref TSK-2026-10810 and APP-26/04170",
        legacyLink: "#/app/tasks/TSK-2026-1081",
        encodedApplicationLink: "#/app/applications/APP-26%2F0417"
      },
      { id: "TSK-2026-8000", createdAt: "2026-10-15", history: [] }
    ],
    applications: [
      { id: "APP-2026-0417", number: "APP-26/0417", createdAt: "2026-06-01", taskIds: ["TSK-2026-1081"] },
      { id: "APP-2026-9000", number: "APP-26/9000", createdAt: "2026-10-15", taskIds: ["TSK-2026-8000"] }
    ],
    collaterals: [{ id: "COL-001", customData: "keep" }]
  };

  const result = migrateSavedObjectNumbers(savedState, seedData);
  assert.equal(result.changed, true);
  assert.equal(result.state.numberingVersion, 1);
  assert.equal(result.state.tasks[0].id, "tsk-01062026-001");
  assert.equal(result.state.tasks[0].applicationId, "app-01062026-001");
  assert.equal(result.state.tasks[0].applicationNumber, "app-01062026-001");
  assert.equal(result.state.tasks[0].parentTaskId, "tsk-05062026-001");
  assert.equal(result.state.tasks[0].history[0].comment, "Связана с tsk-05062026-001");
  assert.equal(result.state.tasks[0].customData, "preserve me; ref TSK-2026-10810 and APP-26/04170");
  assert.equal(result.state.tasks[0].legacyLink, "#/app/tasks/tsk-01062026-001");
  assert.equal(result.state.tasks[0].encodedApplicationLink, "#/app/applications/app-01062026-001");
  assert.equal(result.state.tasks[1].id, "tsk-15102026-002");
  assert.equal(result.state.applications[0].id, "app-01062026-001");
  assert.equal(result.state.applications[0].number, "app-01062026-001");
  assert.deepEqual(result.state.applications[0].taskIds, ["tsk-01062026-001"]);
  assert.equal(result.state.applications[1].id, "app-15102026-002");
  assert.equal(result.state.collaterals[0].customData, "keep");
  assert.equal(result.aliases["TSK-2026-1081"], "tsk-01062026-001");
});

test("daily sequence is capped at 999", () => {
  assert.throws(() => getNextDailyObjectNumber("app", [{ number: "app-15102026-999" }], "2026-10-15"), RangeError);
});

test("collateral number increments monthly and ignores numbers from other months", () => {
  const records = [
    { suzNumber: "col-112026-003" },
    { suzNumber: "col-102026-999" },
    { collateralNumber: "col-112026-001" }
  ];
  assert.equal(getNextMonthlyCollateralNumber(records, "2026-11-05"), "col-112026-004");
  assert.equal(getNextMonthlyCollateralNumber(records, "05.11.2026"), "col-112026-004");
  assert.equal(getNextMonthlyCollateralNumber(records, "2026-12-01"), "col-122026-001");
});

test("collateral monthly sequence is capped at 999", () => {
  assert.throws(() => getNextMonthlyCollateralNumber([{ suzNumber: "col-112026-999" }], "2026-11-05"), RangeError);
});

test("legacy collateral numbers are normalized once and retain profile identifiers", () => {
  const collaterals = [
    { id: "COL-A", createdAt: "2026-11-02", suzNumber: "col-112026-001", profileIdentifier: "VIN-A" },
    { id: "COL-B", createdAt: "2026-11-03", suzNumber: "col-112026-001", profileIdentifier: "COL-B" },
    { id: "COL-C", createdAt: "2026-12-01", profileIdentifier: "" }
  ];
  normalizeCollateralSuzNumbers(collaterals);
  assert.deepEqual(collaterals.map((item) => item.suzNumber), ["col-112026-001", "col-112026-002", "col-122026-001"]);
  assert.deepEqual(collaterals.map((item) => item.profileIdentifier), ["VIN-A", "col-112026-002", "col-122026-001"]);
});

test("all initial task and application fixtures follow the new format with intact links", () => {
  const taskGroups = new Map();
  initialData.tasks.forEach((task) => {
    const match = String(task.id).match(/^tsk-(\d{2})(\d{2})(\d{4})-(\d{3})$/);
    assert.ok(match, `Invalid task id: ${task.id}`);
    assert.equal(`${match[3]}-${match[2]}-${match[1]}`, String(task.createdAt).slice(0, 10));
    const dateKey = `${match[3]}${match[2]}${match[1]}`;
    taskGroups.set(dateKey, [...(taskGroups.get(dateKey) || []), Number(match[4])]);
    if (task.applicationId) assert.ok(initialData.applications.some((item) => item.id === task.applicationId), `Missing application ${task.applicationId}`);
    if (task.parentTaskId) assert.ok(initialData.tasks.some((item) => item.id === task.parentTaskId), `Missing parent task ${task.parentTaskId}`);
  });
  taskGroups.forEach((sequences, date) => {
    sequences.sort((a, b) => a - b);
    assert.deepEqual(sequences, sequences.map((_, index) => index + 1), `Task counter gap on ${date}`);
  });

  const applicationGroups = new Map();
  initialData.applications.forEach((application) => {
    const match = String(application.id).match(/^app-(\d{2})(\d{2})(\d{4})-(\d{3})$/);
    assert.ok(match, `Invalid application id: ${application.id}`);
    assert.equal(application.number, application.id);
    assert.equal(`${match[3]}-${match[2]}-${match[1]}`, String(application.createdAt).slice(0, 10));
    const dateKey = `${match[3]}${match[2]}${match[1]}`;
    applicationGroups.set(dateKey, [...(applicationGroups.get(dateKey) || []), Number(match[4])]);
    (application.taskIds || []).forEach((id) => assert.ok(initialData.tasks.some((task) => task.id === id), `Missing task ${id}`));
  });
  applicationGroups.forEach((sequences, date) => {
    sequences.sort((a, b) => a - b);
    assert.deepEqual(sequences, sequences.map((_, index) => index + 1), `Application counter gap on ${date}`);
  });
});

test("automatic task fixtures have an application initiator and request comment", () => {
  const automaticTasks = initialData.tasks.filter((task) => task.createdFromApplicationAutomatically);
  assert.ok(automaticTasks.length > 0);
  automaticTasks.forEach((task) => {
    const application = initialData.applications.find((item) => item.id === task.applicationId);
    assert.ok(application, `Missing application for ${task.id}`);
    assert.ok(application.initiator, `Missing application initiator for ${task.id}`);
    assert.ok(application.comment || application.applicationComment || application.requestComment, `Missing request comment for ${task.id}`);
  });
});

test("the referenced repeated-inspection example remains a manual task", () => {
  const task = initialData.tasks.find((item) => item.id === "tsk-16062026-005");
  const creation = task?.history?.find((event) => event.action === "Создана задача");
  assert.equal(task?.type, "Повторный осмотр");
  assert.equal(task?.source, "Вручную");
  assert.equal(creation?.user, "Елена Морозова");
  assert.equal(creation?.comment, "Нужна повторная фотофиксация маркировки");
});

test("task author is always a person and auto-created application tasks use the application initiator", () => {
  initialData.tasks.forEach((task) => {
    const application = initialData.applications.find((item) => item.id === task.applicationId || item.number === task.applicationNumber);
    const collateral = initialData.collaterals.find((item) => item.id === task.collateralId);
    const author = resolveTaskAuthorName(task, { application, collateral, employees });
    assert.ok(employees.includes(author), `Non-human author ${author} on ${task.id}`);
    if (task.createdFromApplicationAutomatically) assert.equal(author, application?.initiator, `Application initiator mismatch on ${task.id}`);
  });

  const scheduledTask = initialData.tasks.find((task) => task.id === "tsk-16062026-002");
  const scheduledCollateral = initialData.collaterals.find((item) => item.id === scheduledTask.collateralId);
  assert.equal(resolveTaskAuthorName(scheduledTask, { collateral: scheduledCollateral, employees }), "Мария Петрова");
  assert.equal(resolveTaskAuthorName({ createdFromApplicationAutomatically: true }, {
    application: { initiator: "Система" },
    collateral: { responsible: "Мария Петрова" },
    employees
  }), "Мария Петрова");
  assert.equal(resolveTaskAuthorName({ createdFromApplicationAutomatically: true }, {
    application: { initiator: "Сергей Иванов" },
    collateral: { responsible: "Мария Петрова" },
    employees
  }), "Сергей Иванов");
  for (const technicalName of ["IntegrationWorker", "Integration Worker", "Системный пользователь", "Service Account", "Ручная инициация"]) {
    assert.equal(resolveTaskAuthorName({
      createdFromApplicationAutomatically: true,
      assignee: technicalName
    }, {
      application: { initiator: technicalName },
      collateral: { responsible: technicalName },
      employees
    }), employees[0]);
  }
});

test("four wagon cards share one consist group without including the separate wagon", () => {
  const consist = initialData.collaterals.filter((item) => item.groupIdentificationCode === "RW-CONSIST-26-0411");
  assert.equal(consist.length, 4);
  assert.deepEqual(
    consist.map((item) => item.fields["Номер вагона"]).sort(),
    ["52640178", "54781236", "58824161", "58824182"]
  );
  assert.ok(consist.every((item) => item.type === "Железнодорожный подвижной состав"));
  assert.equal(initialData.collaterals.find((item) => item.id === "COL-057")?.groupIdentificationCode || "", "");
});
