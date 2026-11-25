import assert from "node:assert/strict";
import test from "node:test";
import { employees, initialData, seedTaskNumberAliases } from "../src/data.js";
import {
  getNextMonthlyApplicationNumber,
  getMonthlyTaskDateStamp,
  getNextMonthlyTaskNumber,
  getTaskNumberPrefix,
  getNextMonthlyCollateralNumber,
  migrateSavedObjectNumbers,
  normalizeCollateralSuzNumbers
} from "../src/object-numbering.js";
import { resolveTaskAuthorName } from "../src/task-author.js";

test("task number uses MMYY and independent four-digit counters per type", () => {
  assert.equal(getMonthlyTaskDateStamp(new Date(2026, 9, 15, 0, 5)), "1026");
  assert.equal(getTaskNumberPrefix("Единичная переоценка"), "c");
  assert.equal(getTaskNumberPrefix("Первичный осмотр"), "s");
  assert.equal(getTaskNumberPrefix("Регистрация залога"), "r");
  assert.equal(getTaskNumberPrefix("Плановый мониторинг"), "m");
  assert.equal(getNextMonthlyTaskNumber("Первичный осмотр", [{ id: "s-1026-0003" }], "2026-10-15"), "s-1026-0004");
  assert.equal(getNextMonthlyTaskNumber("Единичная переоценка", [{ id: "s-1026-0003" }], "2026-10-15"), "c-1026-0001");
  assert.equal(getNextMonthlyTaskNumber("Первичный осмотр", [{ id: "s-0926-9999" }], "2026-10-01"), "s-1026-0001");
  assert.equal(getNextMonthlyTaskNumber("Первичный осмотр", [{ id: "s-1126-0001" }], "2026-11-01"), "s-1126-0002");
});

test("application number uses MMYY and an independent three-digit monthly counter", () => {
  assert.equal(getNextMonthlyApplicationNumber([{ id: "app-1026-003" }], "2026-10-15"), "app-1026-004");
  assert.equal(getNextMonthlyApplicationNumber([{ number: "app-1025-999" }], "2026-10-15"), "app-1026-001");
  assert.equal(getNextMonthlyApplicationNumber([{ id: "app-1126-001" }], "2026-11-15"), "app-1126-002");
  assert.throws(() => getNextMonthlyApplicationNumber([{ number: "app-1026-999" }], "2026-10-15"), RangeError);
});

test("application and collateral generators reject invalid calendar months", () => {
  assert.throws(() => getNextMonthlyApplicationNumber([], "2026-13-01"), RangeError);
  assert.throws(() => getNextMonthlyApplicationNumber([], "01.00.2026"), RangeError);
  assert.throws(() => getNextMonthlyCollateralNumber([], "2026-00-01"), RangeError);
  assert.throws(() => getNextMonthlyCollateralNumber([], "01.13.2026"), RangeError);
});

test("application and collateral generators validate complete calendar dates", () => {
  assert.equal(getNextMonthlyApplicationNumber([], "2024-02-29"), "app-0224-001");
  assert.equal(getNextMonthlyCollateralNumber([], "29.02.2024"), "col-0224-001");
  assert.equal(getNextMonthlyApplicationNumber([], "2026-11-24 09:30:00"), "app-1126-001");
  assert.equal(getNextMonthlyCollateralNumber([], "24.11.2026 09:30:00"), "col-1126-001");
  assert.throws(() => getNextMonthlyApplicationNumber([], "2026-02-31"), RangeError);
  assert.throws(() => getNextMonthlyCollateralNumber([], "31.02.2026"), RangeError);
  assert.throws(() => getNextMonthlyApplicationNumber([], "2026-02-29"), RangeError);
  assert.throws(() => getNextMonthlyCollateralNumber([], "not-a-date"), RangeError);
  assert.throws(() => getNextMonthlyApplicationNumber([], "2026-11"), RangeError);
  assert.throws(() => getNextMonthlyCollateralNumber([], "2026/02/31"), RangeError);
  assert.throws(() => getNextMonthlyApplicationNumber([], "11"), RangeError);
  assert.throws(() => getNextMonthlyApplicationNumber([], "2026-11-24T25:00:00Z"), RangeError);
  assert.throws(() => getNextMonthlyApplicationNumber([], "2026-11-24T09:30:00garbage"), RangeError);
});

test("migration replaces zero application and collateral sequences with the first available number", () => {
  const savedState = {
    numberingVersion: 2,
    applications: [{ id: "app-1126-000", number: "app-1126-000", createdAt: "2026-11-16 09:30" }],
    collaterals: [{
      id: "COL-ZERO",
      suzNumber: "col-1126-000",
      profileIdentifierType: "Номер карточки залога",
      profileIdentifier: "col-1126-000",
      createdAt: "2026-11-16 09:30"
    }]
  };
  const result = migrateSavedObjectNumbers(savedState, { applications: [], tasks: [], collaterals: [] });
  assert.equal(result.state.applications[0].id, "app-1126-001");
  assert.equal(result.state.collaterals[0].suzNumber, "col-1126-001");
  assert.equal(result.state.collaterals[0].profileIdentifier, "col-1126-001");
});

test("saved application colliding with a different seed application gets a free number and its links follow", () => {
  for (const numberingVersion of [2, 3]) {
    const seedApplication = {
      id: "app-1026-002",
      number: "app-1026-002",
      createdAt: "2026-10-27 10:00",
      initiator: "Анна Кузнецова",
      clientName: "ООО СибТрансСервис"
    };
    const seedData = { tasks: [], applications: [seedApplication], collaterals: [] };
    const savedState = {
      numberingVersion,
      tasks: [{
        id: "s-1026-0001",
        number: "s-1026-0001",
        type: "Первичный осмотр",
        createdAt: "2026-10-15 09:00",
        applicationId: "app-1026-002",
        applicationNumber: "app-1026-002"
      }, {
        id: "s-1026-0002",
        number: "s-1026-0002",
        type: "Первичный осмотр",
        createdAt: "2026-10-27 10:15",
        applicationId: "app-1026-002",
        applicationNumber: "app-1026-002"
      }],
      applications: [{
        id: "app-1026-002",
        number: "app-1026-002",
        createdAt: "2026-10-15 09:00",
        initiator: "Елена Морозова",
        clientName: "АО Северный Терминал",
        taskIds: ["s-1026-0001"]
      }],
      collaterals: [{
        id: "COL-UNCHANGED",
        suzNumber: "col-1026-001",
        profileIdentifierType: "VIN",
        profileIdentifier: "VIN-TEST-1",
        createdAt: "2026-10-15 09:00"
      }]
    };

    const result = migrateSavedObjectNumbers(savedState, seedData);

    assert.equal(result.state.numberingVersion, 4);
    assert.equal(result.state.applications[0].id, "app-1026-003");
    assert.equal(result.state.applications[0].number, "app-1026-003");
    assert.equal(result.state.tasks[0].applicationId, "app-1026-003");
    assert.equal(result.state.tasks[0].applicationNumber, "app-1026-003");
    assert.equal(result.state.tasks[1].applicationId, "app-1026-002", "unlinked references continue to point to the seed application");
    assert.equal(result.state.tasks[1].applicationNumber, "app-1026-002");
    assert.deepEqual(result.state.tasks.map((task) => task.id), ["s-1026-0001", "s-1026-0002"]);
    assert.equal(result.state.collaterals[0].id, "COL-UNCHANGED");
    assert.equal(result.state.collaterals[0].suzNumber, "col-1026-001");
    assert.equal(result.state.collaterals[0].profileIdentifier, "VIN-TEST-1");
    assert.equal(seedApplication.id, "app-1026-002", "the seed application keeps its number");
    assert.notEqual(result.state.applications[0].id, seedApplication.id);
    assert.equal(migrateSavedObjectNumbers(result.state, seedData).changed, false, "version 4 migration is idempotent");
  }
});

test("legacy saved task and application ids migrate with links and payload preserved", () => {
  const seedData = {
    tasks: [{ id: "s-1026-0001", createdAt: "2026-10-15", type: "Первичный осмотр" }],
    applications: [{ id: "app-1026-001", number: "app-1026-001", createdAt: "2026-10-15" }]
  };
  const savedState = {
    tasks: [
      {
        id: "TSK-2026-1081",
        createdAt: "2026-06-01",
        type: "Плановый мониторинг",
        applicationId: "APP-2026-0417",
        applicationNumber: "APP-26/0417",
        parentTaskId: "TSK-2026-0999",
        history: [{ comment: "Связана с TSK-2026-0999" }],
        customData: "preserve me; ref TSK-2026-10810 and APP-26/04170",
        legacyLink: "#/app/tasks/TSK-2026-1081",
        encodedApplicationLink: "#/app/applications/APP-26%2F0417"
      },
      { id: "TSK-2026-8000", createdAt: "2026-10-15", type: "Первичный осмотр", history: [] }
    ],
    applications: [
      { id: "APP-2026-0417", number: "APP-26/0417", createdAt: "2026-06-01", taskIds: ["TSK-2026-1081"] },
      { id: "APP-2026-9000", number: "APP-26/9000", createdAt: "2026-10-15", taskIds: ["TSK-2026-8000"] }
    ],
    collaterals: [{ id: "COL-001", customData: "keep" }]
  };

  const result = migrateSavedObjectNumbers(savedState, seedData, seedTaskNumberAliases);
  assert.equal(result.changed, true);
  assert.equal(result.state.numberingVersion, 4);
  assert.equal(result.state.tasks[0].id, "m-0626-0001");
  assert.equal(result.state.tasks[0].applicationId, "app-0626-001");
  assert.equal(result.state.tasks[0].applicationNumber, "app-0626-001");
  assert.equal(result.state.tasks[0].parentTaskId, "s-0626-0001");
  assert.equal(result.state.tasks[0].history[0].comment, "Связана с s-0626-0001");
  assert.equal(result.state.tasks[0].customData, "preserve me; ref TSK-2026-10810 and APP-26/04170");
  assert.equal(result.state.tasks[0].legacyLink, "#/app/tasks/m-0626-0001");
  assert.equal(result.state.tasks[0].encodedApplicationLink, "#/app/applications/app-0626-001");
  assert.equal(result.state.tasks[1].id, "s-1026-0002");
  assert.equal(result.state.applications[0].id, "app-0626-001");
  assert.equal(result.state.applications[0].number, "app-0626-001");
  assert.deepEqual(result.state.applications[0].taskIds, ["m-0626-0001"]);
  assert.equal(result.state.applications[1].id, "app-1026-002");
  assert.equal(result.state.collaterals[0].customData, "keep");
  assert.equal(result.aliases["TSK-2026-1081"], "m-0626-0001");
  assert.equal(migrateSavedObjectNumbers(result.state, seedData, seedTaskNumberAliases).changed, false, "version 3 migration is idempotent");
});

test("version 1 saved state migrates task IDs and references to monthly numbering", () => {
  const seedData = { tasks: [], applications: [] };
  const savedState = {
    numberingVersion: 1,
    tasks: [
      {
        id: "tsk-19072027-001",
        number: "tsk-19072027-001",
        type: "Первичный осмотр",
        createdAt: "2027-07-19 09:00:00",
        applicationId: "app-19072027-001",
        parentTaskId: "tsk-19072027-002",
        history: [{ comment: "Связана с tsk-19072027-002" }],
        link: "#/app/tasks/tsk-19072027-001",
        customData: "preserve"
      },
      {
        id: "tsk-19072027-002",
        number: "tsk-19072027-002",
        type: "Повторный осмотр",
        createdAt: "2027-07-19 10:00:00",
        applicationId: "app-19072027-001"
      }
    ],
    applications: [
      {
        id: "app-19072027-001",
        number: "app-19072027-001",
        createdAt: "2027-07-19",
        taskIds: ["tsk-19072027-001", "tsk-19072027-002"],
        customData: "application data"
      }
    ]
  };

  const result = migrateSavedObjectNumbers(savedState, seedData, seedTaskNumberAliases);
  assert.equal(result.changed, true);
  assert.equal(result.state.numberingVersion, 4);
  assert.deepEqual(result.state.tasks.map((task) => task.id), ["s-0727-0001", "s-0727-0002"]);
  assert.deepEqual(result.state.tasks.map((task) => task.number), ["s-0727-0001", "s-0727-0002"]);
  assert.equal(result.state.tasks[0].parentTaskId, "s-0727-0002");
  assert.equal(result.state.tasks[0].history[0].comment, "Связана с s-0727-0002");
  assert.equal(result.state.tasks[0].link, "#/app/tasks/s-0727-0001");
  assert.equal(result.state.tasks[0].applicationId, "app-0727-001");
  assert.equal(result.state.tasks[0].customData, "preserve");
  assert.equal(result.state.applications[0].id, "app-0727-001");
  assert.deepEqual(result.state.applications[0].taskIds, ["s-0727-0001", "s-0727-0002"]);
  assert.equal(result.state.applications[0].customData, "application data");
  assert.equal(migrateSavedObjectNumbers(result.state, seedData, seedTaskNumberAliases).changed, false);
});

test("version 2 saved applications and collateral cards migrate numbers and linked references", () => {
  const seedData = {
    tasks: [],
    applications: [{ id: "app-1126-013", number: "app-1126-013", createdAt: "2026-11-16" }],
    collaterals: []
  };
  const savedState = {
    numberingVersion: 2,
    tasks: [{
      id: "s-1126-9999",
      type: "Первичный осмотр",
      createdAt: "2026-11-22",
      applicationId: "app-16112026-001",
      applicationNumber: "app-16112026-001",
      note: "Связана с заявкой app-16112026-001 и залогом ZLG-OLD-1"
    }],
    applications: [{
      id: "app-16112026-001",
      number: "app-16112026-001",
      createdAt: "2026-11-16",
      taskIds: ["s-1126-9999"]
    }],
    collaterals: [{
      id: "COL-SAVED-1",
      suzNumber: "ZLG-OLD-1",
      profileIdentifierType: "Номер карточки залога",
      profileIdentifier: "ZLG-OLD-1",
      createdAt: "2026-11-03"
    }]
  };
  const aliases = { "app-16112026-001": "app-1126-013" };

  const result = migrateSavedObjectNumbers(savedState, seedData, aliases);
  assert.equal(result.state.numberingVersion, 4);
  assert.equal(result.state.applications[0].id, "app-1126-013");
  assert.equal(result.state.applications[0].number, "app-1126-013");
  assert.equal(result.state.tasks[0].applicationId, "app-1126-013");
  assert.equal(result.state.tasks[0].applicationNumber, "app-1126-013");
  assert.match(result.state.tasks[0].note, /app-1126-013 и залогом col-1126-001/);
  assert.equal(result.state.collaterals[0].id, "COL-SAVED-1");
  assert.equal(result.state.collaterals[0].suzNumber, "col-1126-001");
  assert.equal(result.state.collaterals[0].profileIdentifier, "col-1126-001");
  assert.equal(migrateSavedObjectNumbers(result.state, seedData, aliases).changed, false);
});

test("task monthly sequence is capped at 9999", () => {
  assert.throws(() => getNextMonthlyTaskNumber("Первичный осмотр", [{ id: "s-1026-9999" }], "2026-10-15"), RangeError);
});

test("collateral number increments monthly and ignores numbers from other months", () => {
  const records = [
    { suzNumber: "col-1126-003" },
    { suzNumber: "col-1026-999" },
    { collateralNumber: "col-1126-001" }
  ];
  assert.equal(getNextMonthlyCollateralNumber(records, "2026-11-05"), "col-1126-004");
  assert.equal(getNextMonthlyCollateralNumber(records, "05.11.2026"), "col-1126-004");
  assert.equal(getNextMonthlyCollateralNumber(records, "2026-12-01"), "col-1226-001");
});

test("collateral monthly sequence is capped at 999", () => {
  assert.throws(() => getNextMonthlyCollateralNumber([{ suzNumber: "col-1126-999" }], "2026-11-05"), RangeError);
});

test("legacy collateral numbers are normalized once and retain profile identifiers", () => {
  const collaterals = [
    { id: "COL-A", createdAt: "2026-11-02", suzNumber: "col-1126-001", profileIdentifier: "VIN-A" },
    { id: "COL-B", createdAt: "2026-11-03", suzNumber: "col-1126-001", profileIdentifier: "COL-B" },
    { id: "COL-C", createdAt: "2026-12-01", profileIdentifier: "" }
  ];
  normalizeCollateralSuzNumbers(collaterals);
  assert.deepEqual(collaterals.map((item) => item.suzNumber), ["col-1126-001", "col-1126-002", "col-1226-001"]);
  assert.deepEqual(collaterals.map((item) => item.profileIdentifier), ["VIN-A", "col-1126-002", "col-1226-001"]);
});

test("all initial task and application fixtures follow the new format with intact links", () => {
  const taskGroups = new Map();
  initialData.tasks.forEach((task) => {
    const match = String(task.id).match(/^([csrm])-(\d{2})(\d{2})-(\d{4})$/);
    assert.ok(match, `Invalid task id: ${task.id}`);
    assert.equal(match[1], getTaskNumberPrefix(task.type), `Prefix mismatch for ${task.id}`);
    assert.equal(`${match[2]}${match[3]}`, getMonthlyTaskDateStamp(task.createdAt), `Month mismatch for ${task.id}`);
    const dateKey = `${match[1]}-${match[2]}${match[3]}`;
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
    const match = String(application.id).match(/^app-(\d{2})(\d{2})-(\d{3})$/);
    assert.ok(match, `Invalid application id: ${application.id}`);
    assert.equal(application.number, application.id);
    assert.equal(`${match[1]}${match[2]}`, getMonthlyTaskDateStamp(application.createdAt));
    const dateKey = `${match[1]}${match[2]}`;
    applicationGroups.set(dateKey, [...(applicationGroups.get(dateKey) || []), Number(match[3])]);
    (application.taskIds || []).forEach((id) => assert.ok(initialData.tasks.some((task) => task.id === id), `Missing task ${id}`));
  });
  applicationGroups.forEach((sequences, date) => {
    sequences.sort((a, b) => a - b);
    assert.deepEqual(sequences, sequences.map((_, index) => index + 1), `Application counter gap on ${date}`);
  });

  const collateralGroups = new Map();
  const collateralIds = new Set();
  initialData.collaterals.forEach((collateral) => {
    assert.match(collateral.suzNumber || "", /^col-\d{4}-\d{3}$/, `Invalid collateral number on ${collateral.id}`);
    assert.ok(!collateralIds.has(collateral.suzNumber), `Duplicate collateral number ${collateral.suzNumber}`);
    collateralIds.add(collateral.suzNumber);
    const match = collateral.suzNumber.match(/^col-(\d{2})(\d{2})-(\d{3})$/);
    assert.equal(`${match[1]}${match[2]}`, getMonthlyTaskDateStamp(collateral.createdAt));
    const dateKey = `${match[1]}${match[2]}`;
    collateralGroups.set(dateKey, [...(collateralGroups.get(dateKey) || []), Number(match[3])]);
    assert.ok(collateral.id.startsWith("COL-"), "Internal collateral IDs remain stable");
  });
  collateralGroups.forEach((sequences, date) => {
    sequences.sort((a, b) => a - b);
    assert.deepEqual(sequences, sequences.map((_, index) => index + 1), `Collateral counter gap on ${date}`);
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
  const task = initialData.tasks.find((item) => item.id === seedTaskNumberAliases["tsk-16062026-005"]);
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

  const scheduledTask = initialData.tasks.find((task) => task.id === seedTaskNumberAliases["tsk-16062026-002"]);
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
