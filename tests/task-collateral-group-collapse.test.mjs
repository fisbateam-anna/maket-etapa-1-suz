import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const taskId = "tsk-16112026-001";
const applicationId = "app-16112026-001";

function hasValidLegalEntityInn(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 10) return false;
  const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
  const controlDigit = weights.reduce((sum, weight, index) => sum + Number(digits[index]) * weight, 0) % 11 % 10;
  return Number(digits[9]) === controlDigit;
}

function buildRenderSandbox() {
  const state = { taskCollateralGroupExpanded: {} };
  const context = {
    state,
    escapeHtml: (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"),
    pluralize: (count, one, few, many) => count === 1 ? one : count >= 2 && count <= 4 ? few : many,
    formatShortMoney: (value) => String(value),
    getLatestCollateralEvaluation: (collateral) => collateral.evaluations?.at(-1) || {},
    getTaskCollateralGroupType: (collateral) => collateral?.type || "Вид не указан",
    getMainPledgor: (collateral) => ({ name: collateral.pledgors?.[0]?.name || "Залогодатель не указан" }),
    renderTaskCollateralRow: (_task, item) => `<tr class="object-row" data-object-id="${item.id}"></tr>`
  };
  const start = appSource.indexOf("function renderTaskCollateralGroupSummary");
  const end = appSource.indexOf("\nfunction renderTaskCollateralRow", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.api = { buildTaskCollateralGroups, renderTaskCollateralGroupedRows, toggleTaskCollateralGroup };`, context);
  return { api: context.api, state };
}

test("the 150-collateral inspection task contains one complete pledgor/type/city group", () => {
  const task = initialData.tasks.find((item) => item.id === taskId);
  const application = initialData.applications.find((item) => item.id === applicationId);
  assert.ok(task);
  assert.ok(application);
  assert.equal(task.type, "Первичный осмотр");
  assert.equal(task.inspectionFormat, "Физический осмотр");
  assert.equal(task.applicationId, application.id);
  assert.ok(application.taskIds.includes(task.id));
  assert.equal(task.collateralIds.length, 150);
  assert.equal(new Set(task.collateralIds).size, 150);
  assert.equal(new Set(initialData.collaterals.map((item) => item.id)).size, initialData.collaterals.length, "fixture IDs must not collide with other seeded collateral IDs");
  assert.ok(task.collateralIds.every((id) => application.collateralIds.includes(id)));

  const collaterals = task.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  assert.ok(collaterals.every(Boolean));
  assert.ok(collaterals.every((item) => item.type === "Объекты недвижимости"));
  assert.ok(collaterals.every((item) => item.pledgors.length === 1 && item.pledgors[0].name === "ООО СибТрансСервис"));
  assert.ok(collaterals.every((item) => item.addressFields?.["Город"] === "Новосибирск"));
  assert.equal(new Set(collaterals.map((item) => item.address)).size, 1, "all objects must be at one inspection site");
  assert.ok(collaterals.every((item) => item.addressFields?.["Дом"] === "10"));
  assert.ok(collaterals.every((item) => item.fields?.["Подвид залога"] === "Здания" && item.fields?.["Кадастровый номер"]));
  const applicationCollaterals = application.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  const pledgors = [...new Map(applicationCollaterals.flatMap((item) => item.pledgors).map((item) => [item.name, item])).values()];
  assert.equal(pledgors.length, 5);
  assert.ok(pledgors.every((pledgor) => hasValidLegalEntityInn(pledgor.idn)), "each legal entity pledgor must have a valid 10-digit INN");
});

test("the parent application is split into five automatically created pledgor/type/city groups", () => {
  const application = initialData.applications.find((item) => item.id === applicationId);
  const tasks = application.taskIds.map((id) => initialData.tasks.find((task) => task.id === id));
  assert.equal(tasks.length, 5);
  assert.ok(tasks.every((task) => task && task.applicationId === application.id && task.createdFromApplicationAutomatically));
  const signatures = tasks.map((task) => {
    const collaterals = task.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
    const owners = [...new Set(collaterals.map((item) => item.pledgors.map((pledgor) => pledgor.name).sort().join(" + ")))];
    const types = [...new Set(collaterals.map((item) => item.type))];
    const cities = [...new Set(collaterals.map((item) => item.addressFields?.["Город"]))];
    assert.equal(owners.length, 1);
    assert.equal(types.length, 1);
    assert.equal(cities.length, 1);
    return [owners[0], types[0], cities[0]].join(" | ");
  });
  assert.equal(new Set(signatures).size, 5, "each task must represent a distinct complete group");
  const collaterals = application.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  assert.ok(new Set(collaterals.map((item) => item.type)).size > 1);
  assert.ok(new Set(collaterals.map((item) => item.addressFields?.["Город"])).size > 1);
  const jointCollateral = collaterals.find((item) => item.pledgors.length === 2);
  assert.ok(jointCollateral);
  assert.ok(jointCollateral.pledgors.every((pledgor) => pledgor.share === "50%"));
  const links = application.deals[0].pledgeContractLinks;
  assert.equal(links.length, 5);
  assert.ok(links.every((link) => link.number && link.date && link.collateralIds.length));
  assert.deepEqual(new Set(links.flatMap((link) => link.collateralIds)), new Set(application.collateralIds));
});

test("pledge groups use the complete pledgor set and count each collateral once", () => {
  const task = initialData.tasks.find((item) => item.id === taskId);
  const collaterals = task.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  const { api } = buildRenderSandbox();
  const groups = api.buildTaskCollateralGroups([...collaterals, collaterals[0]]);

  assert.equal(groups.reduce((sum, group) => sum + group.count, 0), 150);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].pledgors.length, 1);
  assert.equal(groups[0].types.length, 1);
  assert.equal(groups[0].types[0].type, "Объекты недвижимости");
  assert.ok(groups.every((group) => group.types.reduce((sum, typeGroup) => sum + typeGroup.count, 0) === group.count));
  assert.ok(groups.every((group) => group.types.every((typeGroup) => typeGroup.items.length === typeGroup.count)));
  assert.equal(groups.reduce((sum, group) => sum + group.pledgeValue, 0), collaterals.reduce((sum, item) => sum + item.pledgeValue, 0));
  for (const group of groups) {
    assert.equal(group.pledgeValue, group.types.reduce((sum, typeGroup) => sum + typeGroup.pledgeValue, 0));
    for (const typeGroup of group.types) {
      assert.equal(typeGroup.pledgeValue, typeGroup.items.reduce((sum, item) => sum + item.pledgeValue, 0));
    }
  }
});

test("both group levels are visible by default; object rows expand independently", () => {
  const task = initialData.tasks.find((item) => item.id === taskId);
  const collaterals = task.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  const { api, state } = buildRenderSandbox();
  const groups = api.buildTaskCollateralGroups(collaterals);
  const options = { columnCount: 12, groupStateId: task.id };

  const initial = api.renderTaskCollateralGroupedRows(task, groups, null, options);
  const pledgorRows = initial.match(/<tr class="task-collateral-group-row task-collateral-pledgor-row">[\s\S]*?<\/tr>/g) || [];
  const typeRows = initial.match(/<tr class="task-collateral-group-row task-collateral-type-row">[\s\S]*?<\/tr>/g) || [];
  assert.equal(pledgorRows.length, groups.length);
  assert.equal(typeRows.length, groups.reduce((sum, group) => sum + group.types.length, 0));
  assert.doesNotMatch(initial, /class="object-row"/);
  pledgorRows.forEach((row, index) => {
    const group = groups[index];
    const countLabel = group.count === 1 ? "объект" : group.count >= 2 && group.count <= 4 ? "объекта" : "объектов";
    assert.ok(row.includes(`<strong>Залогодатель: ${group.pledgor}</strong>`));
    assert.ok(row.includes(`${group.count} ${countLabel} · Залоговая стоимость ${group.pledgeValue}`));
    assert.doesNotMatch(row, /\d+ вид(?: залога|а залога|ов залога) · Залоговая стоимость/);
    assert.match(row, /aria-expanded="true"/);
  });
  typeRows.forEach((row, index) => {
    const typeGroup = groups.flatMap((group) => group.types)[index];
    const countLabel = typeGroup.count === 1 ? "объект" : typeGroup.count >= 2 && typeGroup.count <= 4 ? "объекта" : "объектов";
    assert.ok(row.includes(`<strong>Вид залога: ${typeGroup.type}</strong>`));
    assert.ok(row.includes(`${typeGroup.count} ${countLabel} · Залоговая стоимость ${typeGroup.pledgeValue}`));
  });
  assert.match(initial, /task-collateral-type-row[\s\S]*?aria-expanded="false"/);

  api.toggleTaskCollateralGroup(task.id, groups[0].key);
  const parentCollapsed = api.renderTaskCollateralGroupedRows(task, groups, null, options);
  assert.equal((parentCollapsed.match(/task-collateral-type-row/g) || []).length, 0);
  assert.match(parentCollapsed, /task-collateral-pledgor-row[\s\S]*?aria-expanded="false"/);

  api.toggleTaskCollateralGroup(task.id, groups[0].key);
  const parentExpanded = api.renderTaskCollateralGroupedRows(task, groups, null, options);
  assert.equal((parentExpanded.match(/task-collateral-type-row/g) || []).length, 1);
  assert.match(parentExpanded, /task-collateral-pledgor-row[\s\S]*?aria-expanded="true"/);

  api.toggleTaskCollateralGroup(task.id, groups[0].types[0].key);
  const typeExpanded = api.renderTaskCollateralGroupedRows(task, groups, null, options);
  assert.equal((typeExpanded.match(/class="object-row"/g) || []).length, groups[0].types[0].count);
  assert.equal((typeExpanded.match(/data-object-id=/g) || []).length, groups[0].types[0].count);
  assert.match(typeExpanded, /task-collateral-type-row[\s\S]*?aria-expanded="true"/);

  api.toggleTaskCollateralGroup(task.id, groups[0].types[0].key);
  const typeCollapsed = api.renderTaskCollateralGroupedRows(task, groups, null, options);
  assert.doesNotMatch(typeCollapsed, /class="object-row"/);
  assert.match(typeCollapsed, /task-collateral-type-row[\s\S]*?aria-expanded="false"/);
});

test("only six showcase collateral rows have explicit negative check results", () => {
  const task = initialData.tasks.find((item) => item.id === taskId);
  const collaterals = task.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  const checkBuildersStart = appSource.indexOf("function getCollateralObjectCheckRows");
  const checkBuildersEnd = appSource.indexOf("\nfunction addSelfPropelledObjectCheckRows", checkBuildersStart);
  assert.notEqual(checkBuildersStart, -1);
  assert.notEqual(checkBuildersEnd, -1);
  const checkBuildersSource = appSource.slice(checkBuildersStart, checkBuildersEnd);
  const negativeCheckSource = appSource.slice(
    appSource.indexOf("function isObjectCheckFailedStatus"),
    appSource.indexOf("\nfunction isObjectCheckControlStatus", appSource.indexOf("function isObjectCheckFailedStatus"))
  );
  const checkResultHelpersSource = appSource.slice(
    appSource.indexOf("function joinCheckResult"),
    appSource.indexOf("\nfunction applyPledgeCheckManualValues", appSource.indexOf("function joinCheckResult"))
  );
  const riskTextSource = appSource.slice(
    appSource.indexOf("function isRiskText"),
    appSource.indexOf("\nfunction formatPercentValue", appSource.indexOf("function isRiskText"))
  );
  const context = {
    isRealEstateCollateralType: (type) => /недвиж/i.test(type),
    isAutoVehicleCollateralType: (type) => /автотранспорт/i.test(type),
    isSelfPropelledCollateralType: () => false,
    getCollateralExternalRows: () => [],
    getCollateralObjectIdentifier: (collateral) => collateral.profileIdentifier,
    getObjectCheckDate: () => "2026-11-16",
    getObjectCheckEvidence: () => "",
    getLatestObjectCheckTask: () => null,
    normalizePledgeCheckStatus: (status) => status,
    applyPledgeCheckManualValues: (_task, _collateral, rows) => rows,
  };
  vm.runInNewContext(`${checkResultHelpersSource}\n${riskTextSource}\n${checkBuildersSource}\n${negativeCheckSource}\nglobalThis.isNegative = hasNegativeCollateralCheckResult;`, context);
  const redIds = collaterals.filter((item) => context.isNegative(item)).map((item) => item.id);
  assert.deepEqual(redIds, [
    "COL-DEMO-150-007", "COL-DEMO-150-042", "COL-DEMO-150-070", "COL-DEMO-150-076",
    "COL-DEMO-150-123", "COL-DEMO-150-139"
  ]);
});

test("the table header is rendered only when an object subgroup is open", () => {
  const source = appSource.slice(
    appSource.indexOf("function renderTaskCollateralObjectsInfo"),
    appSource.indexOf("\nfunction getLatestCollateralEvaluation", appSource.indexOf("function renderTaskCollateralObjectsInfo"))
  );
  assert.match(source, /const hasExpandedObjects = collateralGroups\.some/);
  assert.match(source, /\$\{hasExpandedObjects \? `<thead>/);
  assert.match(appSource, /if \(action === "toggle-task-collateral-group"\)/);
  assert.match(appSource, /aria-expanded="\$\{pledgorExpanded\}"/);
  assert.match(appSource, /aria-expanded="\$\{typeExpanded\}"/);
  assert.match(appSource, /if \(taskId && groupKey\) toggleTaskCollateralGroup\(taskId, groupKey\)/);
});
