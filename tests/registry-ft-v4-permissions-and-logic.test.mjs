import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { employees, roles } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function sourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

test("demo roles match the FT registry and action permission matrix", () => {
  const expected = {
    initiator: [1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0],
    verifier: [1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    appraiser: [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    inspectionVerifier: [1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    inspector: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    registrar: [0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0],
    inspectionManager: [1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    evaluationManager: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    evaluationManagerLevel2: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1]
  };
  const permissionKeys = [
    "appRegView", "collateralView", "evalTaskView", "inspectTaskView", "regTaskView",
    "appCreateEdit", "appDelete", "collateralCreate", "collateralEdit", "evalTaskApprove",
    "inspectTaskApprove", "docDelete", "tasksAllView", "managerLevel1", "managerLevel2"
  ];
  const byId = new Map(roles.map((role) => [role.id, role]));
  assert.deepEqual([...byId.keys()].sort(), Object.keys(expected).sort());
  for (const [id, expectedValues] of Object.entries(expected)) {
    const actual = permissionKeys.map((key) => Number(Boolean(byId.get(id).permissions[key])));
    assert.deepEqual(actual, expectedValues, id);
  }
  assert.deepEqual(byId.get("verifier").menu, ["tasksEvaluation", "applications", "collaterals"]);
  assert.deepEqual(byId.get("inspectionVerifier").menu, ["tasksInspection", "applications", "collaterals"]);
});

test("application registry limits the initiator to their own applications", () => {
  const block = sourceBlock("function isApplicationVisibleInRegistry(", "\nfunction renderApplicationsRegistry()");
  const context = {
    getApplicationInitiator: (application) => application.initiator,
    getRole: () => ({ id: "initiator", user: "Анна Кузнецова" })
  };
  vm.runInNewContext(`${block}\nglobalThis.visible = isApplicationVisibleInRegistry;`, context);

  assert.equal(context.visible({ initiator: "Анна Кузнецова" }), true);
  assert.equal(context.visible({ initiator: "Мария Петрова" }), false);
  assert.equal(context.visible({ initiator: "Мария Петрова" }, { id: "verifier", user: "Мария Петрова" }), true);
});

test("registry user filters include every role user and exclude non-user System", () => {
  const block = sourceBlock("function getRegistryUserOptions(", "\nfunction getTaskRegistryApplicationSearch(");
  const context = {
    roles,
    employees,
    state: { data: { tasks: [], applications: [] } },
    uniqueItems: (items) => [...new Set(items)],
    getTaskRegistryAuthor: (task) => task.author,
    getApplicationInitiator: (application) => application.initiator
  };
  vm.runInNewContext(`${block}\nglobalThis.users = getRegistryUserOptions; globalThis.authors = getTaskRegistryAuthorOptions; globalThis.assignees = getTaskRegistryAssigneeOptions; globalThis.initiators = getApplicationInitiatorOptions;`, context);

  const directoryUsers = Array.from(context.users());
  for (const role of roles) assert.ok(directoryUsers.includes(role.user), role.id);
  assert.ok(Array.from(context.authors("evaluation")).includes("Ирина Белова"));
  assert.ok(Array.from(context.assignees("inspection")).includes("Сергей Иванов"));
  assert.ok(Array.from(context.initiators()).includes("Ирина Белова"));
  assert.ok(!directoryUsers.includes("Система"));
});

test("record-level visibility blocks direct URLs outside the permitted task and application scope", () => {
  const taskScope = sourceBlock("function canViewTask(", "\nfunction getRoute()");
  const context = {
    canViewTaskDirection: (_direction, role) => Boolean(role.permissions.evalTaskView),
    getTaskDirection: () => "evaluation",
    isTaskRegistryStage1Type: (type) => type !== "Дефектовка",
    hasPermission: (role, permission) => Boolean(role.permissions[permission])
  };
  vm.runInNewContext(`${taskScope}\nglobalThis.canViewRecord = canViewTaskRecord;`, context);
  const personalRole = { user: "Мария Петрова", permissions: { evalTaskView: true, tasksAllView: false } };
  const managerRole = { user: "Алексей Соколов", permissions: { evalTaskView: true, tasksAllView: true } };
  assert.equal(context.canViewRecord({ assignee: personalRole.user }, personalRole), true);
  assert.equal(context.canViewRecord({ assignee: "Дмитрий Орлов" }, personalRole), false);
  assert.equal(context.canViewRecord({ assignee: "Дмитрий Орлов" }, managerRole), true);
  assert.equal(context.canViewRecord({ type: "Дефектовка", assignee: "Павел Смирнов" }, {
    user: "Павел Смирнов",
    permissions: { evalTaskView: true, tasksAllView: true }
  }), false, "stage-two task cards remain unavailable even through a direct URL");

  const routes = sourceBlock("function renderRoute(", "\nfunction renderPageHeader(");
  assert.match(routes, /!canViewTaskRecord\(task, role\)/);
  assert.match(routes, /application && !isApplicationVisibleInRegistry\(application, role\)/);
});

test("registry text filters are applied on change/blur, not while typing", () => {
  const inputHandler = sourceBlock('document.addEventListener("input",', '\ndocument.addEventListener("toggle",');
  const changeHandler = sourceBlock('document.addEventListener("change",', '\ndocument.addEventListener("input", (event) => {\n  const fieldEl = event.target.closest?.("input, select, textarea");');
  assert.match(inputHandler, /updateRegistryFilter\(filter\);\s*if \(isMenuRegistryFilter\(filter\)\) return;/);
  assert.match(changeHandler, /if \(event\.target\.matches\("\[data-filter-scope\]"\)\)[\s\S]*?updateRegistryFilter\(event\.target\);[\s\S]*?render\(\);/);
});

test("default and user-selected sorting remains active when its column is hidden", () => {
  const tasks = sourceBlock("function renderTasksRegistry(", "\nfunction renderContractsRegistry(");
  const applications = sourceBlock("function renderApplicationsRegistry()", "\nfunction renderCollateralControlPanel");
  const collaterals = sourceBlock("function renderCollateralsRegistry(", "\nfunction renderCollateralRegistryContractsCell");
  assert.match(tasks, /sortRegistryRows\(rows, allColumns, getRegistrySortEntries\("tasks", direction\)/);
  assert.match(applications, /sortRegistryRows\(rows, allColumns, getRegistrySortEntries\("applications"\)/);
  assert.match(collaterals, /sortRegistryRows\(rows, allColumns, getRegistrySortEntries\("collaterals"\)/);
});

test("author filter options do not include the non-user System author", () => {
  const block = sourceBlock("function getTaskRegistryAuthorOptions(", "\nfunction getApplicationInitiatorOptions(");
  assert.match(block, /name !== "Система"/);
});
