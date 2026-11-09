import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { navItems, roles } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

function getRegistryFilterSchema(block, scope) {
  const schema = [];
  const pattern = /filter(Input|Select|InnInput|MultiSelect|AmountInput)\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"|filter(DateRange|DateTimeRange|AmountRange)\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"(?:,\s*[^)]*)?\)/g;
  for (const match of block.matchAll(pattern)) {
    if (match[1] && match[2] === scope) {
      const kind = { Input: "input", Select: "select", InnInput: "inn", MultiSelect: "multiSelect", AmountInput: "amount" }[match[1]];
      schema.push([kind, match[3], match[4]]);
    } else if (match[6] === scope) {
      const kind = { DateRange: "dateRange", DateTimeRange: "dateTimeRange", AmountRange: "amountRange" }[match[5]];
      schema.push([kind, `${match[7]},${match[8]}`, match[9]]);
    }
  }
  return schema;
}

function getTableHeaderLabels(block, tableClass) {
  const tableStart = block.indexOf(`<table class="${tableClass}"`);
  assert.notEqual(tableStart, -1, `Missing table ${tableClass}`);
  const headerRow = block.slice(tableStart).match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/)?.[1];
  assert.ok(headerRow, `Missing header row for ${tableClass}`);
  return Array.from(headerRow.matchAll(/<th>([^<]*)<\/th>/g), (match) => match[1]);
}

function createRegistryHelpers() {
  const context = {
    state: {
      filters: {
        tasks: { number: "", clientName: "ООО Альфа" },
        applications: { status: "" },
        collaterals: { type: "Недвижимость" }
      },
      visualFilters: {
        tasks: { urgency: "", status: "Просрочены" },
        applications: {},
        collaterals: {}
      },
      registryFiltersExpanded: {}
    },
    escapeHtml
  };
  const start = appSource.indexOf("const REGISTRY_RESULT_LABELS = {");
  const end = appSource.indexOf("\nfunction renderNotFound", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.renderCount = renderRegistryResultCount;\nglobalThis.renderFilters = renderRegistryFilterPanel;`, context);
  return context;
}

test("registry result counters use one label pattern and the matching entity", () => {
  const helpers = createRegistryHelpers();

  assert.match(helpers.renderCount("tasks", 9787), /^<span class="registry-result-count">Задач найдено: /);
  assert.match(helpers.renderCount("applications", 12), /^<span class="registry-result-count">Заявок найдено: /);
  assert.match(helpers.renderCount("collaterals", 1200), /^<span class="registry-result-count">Залогов найдено: /);
  assert.ok(helpers.renderCount("tasks", 9787).includes((9787).toLocaleString("ru-RU")));
});

test("registry filters start expanded, show active filter count and can be collapsed", () => {
  const helpers = createRegistryHelpers();
  const grid = '<div class="filter-grid"><input data-filter-name="number"></div>';

  const expanded = helpers.renderFilters("tasks", grid);
  assert.match(expanded, /aria-expanded="true"/);
  assert.match(expanded, /id="registry-filters-tasks" class="registry-filter-content"><div/);

  helpers.state.registryFiltersExpanded.tasks = false;
  const collapsed = helpers.renderFilters("tasks", grid);
  assert.match(collapsed, /data-action="toggle-registry-filters" data-scope="tasks" aria-expanded="false"/);
  assert.match(collapsed, /Активно: 2/);
  assert.match(collapsed, /registry-filter-content" hidden/);
  assert.doesNotMatch(collapsed, /id="registry-filters-tasks" class="registry-filter-content"><div/);
  assert.match(styles, /\.registry-filter-toggle > span:first-child\s*\{[^}]*font-weight:\s*700/s);
});

test("an empty multi-select is unfilled and does not constrain results", () => {
  const predicate = getSourceBlock("function matchesSelectedValues(", "\nfunction matchesDateRange");
  const renderer = getSourceBlock("function filterMultiSelect(", "\nfunction matches(");
  const context = {
    state: { filters: { applications: { status: [] } }, registryMultiSelectExpanded: {} },
    escapeHtml
  };
  vm.runInNewContext(`${predicate}\n${renderer}\nglobalThis.matchesSelectedValues = matchesSelectedValues; globalThis.renderMulti = filterMultiSelect;`, context);
  assert.equal(context.matchesSelectedValues("В работе", []), true);
  assert.equal(context.matchesSelectedValues("В работе", ["В работе"]), true);
  const emptySummary = context.renderMulti("applications", "status", "Статус", ["В работе"]);
  assert.match(emptySummary, /<summary data-registry-multi-toggle><\/summary>/);
  assert.doesNotMatch(emptySummary, /Все|Ничего не выбрано/);
});

test("unfilled single- and multi-select filters display no catch-all label", () => {
  const single = getSourceBlock("function filterSelect(", "function filterMultiSelect(");
  const multi = getSourceBlock("function filterMultiSelect(", "function matches(");
  const context = {
    state: { filters: { tasks: { type: "" }, applications: { status: [] } }, registryMultiSelectExpanded: {} },
    escapeHtml
  };
  vm.runInNewContext(`${single}\n${multi}\nglobalThis.single = filterSelect; globalThis.multi = filterMultiSelect;`, context);

  const selectMarkup = context.single("tasks", "type", "Тип задачи", ["", "Оценка"]);
  assert.match(selectMarkup, /<option value="" selected><\/option>/);
  assert.doesNotMatch(selectMarkup, /Все/);

  const emptyMultiMarkup = context.multi("applications", "status", "Статус", ["Новая", "В работе"]);
  assert.match(emptyMultiMarkup, /<summary data-registry-multi-toggle><\/summary>/);
  assert.doesNotMatch(emptyMultiMarkup, /Все|Ничего не выбрано/);

  context.state.filters.applications.status = ["Новая", "В работе"];
  const selectedMultiMarkup = context.multi("applications", "status", "Статус", ["Новая", "В работе"]);
  assert.match(selectedMultiMarkup, /<summary data-registry-multi-toggle>Выбрано: 2<\/summary>/);
  assert.doesNotMatch(selectedMultiMarkup, /Все значения/);
});

test("collateral monetary ranges render as three FT filters with paired bounds", () => {
  const block = getSourceBlock("function filterAmountRange(", "function filterDateRange(");
  const context = {
    state: { filters: { collaterals: { marketFrom: "100.00", marketTo: "250.00" } } },
    escapeHtml
  };
  vm.runInNewContext(`${block}\nglobalThis.renderRange = filterAmountRange;`, context);
  const markup = context.renderRange("collaterals", "marketFrom", "marketTo", "Рыночная стоимость");
  assert.match(markup, /<span class="filter-label">Рыночная стоимость<\/span>/);
  assert.match(markup, /data-filter-name="marketFrom" aria-label="Рыночная стоимость: от"/);
  assert.match(markup, /data-filter-name="marketTo" aria-label="Рыночная стоимость: до"/);
  assert.equal((markup.match(/type="number"/g) || []).length, 2);
});

test("collateral Client and Pledgor filters include both names and INNs", () => {
  const block = getSourceBlock("function getCollateralRegistryClientSearchText(", "function getCollateralRegistryCreditContractText(");
  const matchesBlock = getSourceBlock("function matches(value, filter)", "function matchesExact(value, filter)");
  const context = {
    getContract: (id) => id === "contract-1" ? { clientName: "ООО Север", inn: "7701234567" } : null,
    getMainPledgor: () => ({ name: "Иванов Иван", idn: "500123456789" }),
    uniqueItems: (values) => [...new Set(values)]
  };
  vm.runInNewContext(`${block}\n${matchesBlock}\nglobalThis.clientSearch = getCollateralRegistryClientSearchText; globalThis.pledgorSearch = getCollateralRegistryPledgorSearchText; globalThis.matches = matches;`, context);

  const collateral = { clientName: "ООО Север", clientId: "7701234567", contractIds: ["contract-1"], pledgors: [{ name: "Иванов Иван", idn: "500123456789" }] };
  assert.equal(context.matches(context.clientSearch(collateral), "7701234567"), true);
  assert.equal(context.matches(context.pledgorSearch(collateral).join(" "), "500123456789"), true);
});

test("default active statuses are not counted as a user-applied filter", () => {
  const block = getSourceBlock("function getRegistryActiveFilterCount(", "\nfunction renderRegistryFilterPanel");
  const appStatuses = ["Новая", "В работе", "Требуется доработка"];
  const collateralStatuses = ["Новый", "В залоге", "Недействующий"];
  const context = {
    state: {
      filters: {
        applications: { status: appStatuses },
        collaterals: { status: ["Новый", "В залоге"] }
      },
      visualFilters: {}
    },
    getApplicationStatusOptions: () => [...appStatuses, "Завершена"],
    COLLATERAL_STATUS_OPTIONS: collateralStatuses
  };
  vm.runInNewContext(`${block}\nglobalThis.count = getRegistryActiveFilterCount;`, context);
  assert.equal(context.count("applications"), 0);
  assert.equal(context.count("collaterals"), 0);
  context.state.filters.applications.status = ["В работе"];
  assert.equal(context.count("applications"), 1);
});

test("task slices render labels without counts or helper paragraphs", () => {
  const block = getSourceBlock("function renderTaskRegistryTabs(", "\nfunction renderKpiGrid");
  const role = { permissions: { tasksAllView: true } };
  const context = { escapeHtml, getRole: () => role, hasPermission: (currentRole, permission) => Boolean(currentRole?.permissions?.[permission]) };
  vm.runInNewContext(`${block}\nglobalThis.renderTabs = renderTaskRegistryTabs;`, context);
  const markup = context.renderTabs("mine");

  assert.match(markup, /Мои задачи/);
  assert.match(markup, /Все активные задачи/);
  assert.doesNotMatch(markup, /Все задачи/);
  assert.match(markup, /Завершенные задачи/);
  assert.match(markup, /aria-selected="true"/);
  assert.doesNotMatch(markup, /<strong>\d+<\/strong>/);
  assert.doesNotMatch(markup, /доступные задачи направления|архив|в работе у текущего пользователя/);
  assert.match(styles, /\.task-registry-toolbar \.registry-tabs button\s*\{[^}]*min-height:\s*38px/s);
  assert.doesNotMatch(context.renderTabs("mine", { permissions: {} }), /data-tab="all"/);
});

test("FT registry permissions cover all-task visibility, draft deletion and collateral editing", () => {
  const permissions = Object.fromEntries(roles.map((role) => [role.id, role.permissions]));
  for (const id of ["evaluationManager", "evaluationManagerLevel2", "inspectionManager"]) {
    assert.equal(permissions[id].tasksAllView, true, `${id}: all tasks`);
    assert.equal(permissions[id].appDelete, true, `${id}: draft deletion`);
    assert.equal(permissions[id].collateralEdit, true, `${id}: collateral edit`);
  }
  assert.equal(permissions.verifier.tasksAllView, true);
  assert.equal(permissions.verifier.appDelete, false);
  assert.equal(permissions.initiator.appDelete, false);
  assert.equal(permissions.registrar.appCreateEdit, false);
  assert.equal(permissions.registrar.tasksAllView, true);
  assert.equal(permissions.appraiser.inspectTaskView, true);
  assert.ok(roles.find((role) => role.id === "appraiser").menu.includes("tasksInspection"));
  for (const id of ["initiator", "verifier", "registrar"]) {
    assert.equal(permissions[id].collateralEdit, true, `${id}: collateral edit`);
  }
  for (const id of ["evaluationManager", "evaluationManagerLevel2", "inspectionManager"]) {
    assert.equal(permissions[id].inspectTaskApprove, true, `${id}: inspect task approval`);
  }
});

test("all menu registries use compact filters, entity counters and no duplicate table title", () => {
  const menuPaths = navItems.map((item) => item.path);
  const expectedPaths = [
    "/app/tasks/evaluation",
    "/app/tasks/inspection",
    "/app/tasks/registration",
    "/app/applications",
    "/app/collaterals"
  ];
  for (const path of expectedPaths) assert.ok(menuPaths.includes(path), `Missing menu registry ${path}`);

  const tasks = getSourceBlock("function renderTasksRegistry(", "\nfunction renderContractsRegistry");
  const applications = getSourceBlock("function renderApplicationsRegistry(", "\nfunction renderCollateralControlPanel");
  const collaterals = getSourceBlock("function renderCollateralsRegistry(", "\nfunction renderCollateralRegistryContractsCell");

  for (const [scope, block] of [["tasks", tasks], ["applications", applications], ["collaterals", collaterals]]) {
    assert.match(block, new RegExp(`renderRegistryFilterPanel\\("${scope}"`));
    assert.match(block, new RegExp(`renderRegistryResultCount\\("${scope}"`));
    assert.doesNotMatch(block, /<div class="panel-title"><h2>/);
  }
  assert.match(tasks, /renderRegistryPageHeader\(config\.title\)/);
  assert.match(applications, /renderRegistryPageHeader\("Реестр заявок"/);
  assert.match(collaterals, /renderRegistryPageHeader\("Реестр залогов"/);
  assert.match(applications, /filterInput\("applications", "number"/);
  assert.match(applications, /filterDateRange\("applications", "createdFrom", "createdTo", "Дата создания заявки"\)/);
  assert.doesNotMatch(tasks, /filterDateTimeRange/);
  assert.doesNotMatch(applications, /filterDateTimeRange/);
  assert.match(collaterals, /filterInput\("collaterals", "number", "Номер залога"/);
  assert.match(collaterals, /filterDateRange\("collaterals", "appraisalDateFrom"/);
  assert.match(tasks, /task-created-date-filter/);
  assert.match(tasks, /task-due-date-filter/);
  assert.match(tasks, /task-completed-date-filter/);
  assert.match(collaterals, /collateral-created-date-filter/);
  assert.match(collaterals, /collateral-appraisal-date-filter/);
  assert.match(styles, /\.tasks-filter-grid \.task-created-date-filter\s*\{\s*grid-column:\s*1;\s*grid-row:\s*4;/s);
  assert.match(styles, /\.tasks-filter-grid \.task-due-date-filter\s*\{\s*grid-column:\s*2;\s*grid-row:\s*4;/s);
  assert.match(styles, /\.tasks-filter-grid \.task-completed-date-filter\s*\{\s*grid-column:\s*3;\s*grid-row:\s*4;/s);
  assert.match(styles, /\.collaterals-filter-grid \.collateral-created-date-filter\s*\{\s*grid-column:\s*1;\s*grid-row:\s*2;/s);
  assert.match(styles, /\.collaterals-filter-grid \.collateral-appraisal-date-filter\s*\{\s*grid-column:\s*1;\s*grid-row:\s*3;/s);
  assert.match(styles, /\.collaterals-filter-grid \.collateral-fair-value-filter\s*\{\s*grid-column:\s*4;\s*grid-row:\s*3;/s);
  assert.match(styles, /@media \(max-width: 1180px\)[\s\S]*?\.tasks-filter-grid \.task-created-date-filter[\s\S]*?grid-column:\s*auto;\s*grid-row:\s*auto;/);
});

test("menu registries preserve every filter field, filter predicate and table column", () => {
  const tasks = getSourceBlock("function renderTasksRegistry(", "\nfunction renderContractsRegistry");
  const applications = getSourceBlock("function renderApplicationsRegistry()", "\nfunction renderCollateralControlPanel");
  const collaterals = getSourceBlock("function renderCollateralsRegistry(", "\nfunction renderCollateralRegistryContractsCell");

  assert.deepEqual(getRegistryFilterSchema(tasks, "tasks"), [
    ["select", "author", "Автор задачи"],
    ["select", "assignee", "Исполнитель задачи"],
    ["input", "number", "Номер задачи"],
    ["select", "type", "Тип задачи"],
    ["select", "status", "Статус задачи"],
    ["input", "applicationNumber", "Номер заявки"],
    ["input", "clientName", "Клиент"],
    ["input", "contractNumber", "Кредитный договор"],
    ["select", "initiator", "Инициатор заявки"],
    ["select", "initiatorSegment", "Сегмент инициатора"],
    ["input", "collateralId", "Идентификатор залога"],
    ["input", "collateralName", "Наименование залога"],
    ["select", "collateralType", "Вид залога"],
    ["input", "pledgor", "Залогодатель"],
    ["dateRange", "createdFrom,createdTo", "Дата создания задачи"],
    ["dateRange", "dueFrom,dueTo", "Срок исполнения задачи"],
    ["dateRange", "completedFrom,completedTo", "Дата завершения задачи"]
  ]);
  assert.deepEqual(getRegistryFilterSchema(applications, "applications"), [
    ["input", "number", "Номер заявки"],
    ["select", "type", "Тип заявки"],
    ["select", "subtype", "Подтип заявки"],
    ["select", "purpose", "Цель заявки"],
    ["multiSelect", "status", "Статус заявки"],
    ["select", "initiator", "Инициатор заявки"],
    ["select", "initiatorSegment", "Сегмент инициатора"],
    ["input", "clientName", "Клиент"],
    ["select", "product", "Продукт"],
    ["input", "contractNumber", "Кредитный договор"],
    ["input", "collateralId", "Идентификатор залога"],
    ["input", "collateralName", "Наименование залога"],
    ["dateRange", "createdFrom,createdTo", "Дата создания заявки"]
  ]);
  assert.deepEqual(getRegistryFilterSchema(collaterals, "collaterals"), [
    ["input", "number", "Номер залога"],
    ["input", "collateralId", "Идентификатор залога"],
    ["input", "name", "Наименование залога"],
    ["select", "type", "Вид залога"],
    ["multiSelect", "status", "Статус объекта"],
    ["input", "address", "Адрес объекта"],
    ["dateRange", "createdFrom,createdTo", "Дата создания залога"],
    ["input", "clientName", "Клиент"],
    ["input", "pledgor", "Залогодатель"],
    ["input", "creditContractNumber", "Кредитный договор"],
    ["input", "pledgeContractNumber", "Договор залога"],
    ["dateRange", "appraisalDateFrom,appraisalDateTo", "Дата последней оценки"],
    ["amountRange", "marketFrom,marketTo", "Рыночная стоимость"],
    ["amountRange", "pledgeFrom,pledgeTo", "Залоговая стоимость"],
    ["amountRange", "fairFrom,fairTo", "Справедливая стоимость"]
  ]);
  assert.match(tasks, /matchesDateOnlyRange\(getTaskCreatedDateTime\(task\), filters\.createdFrom, filters\.createdTo\)/);
  assert.match(tasks, /matchesDateOnlyRange\(task\.dueDate, filters\.dueFrom, filters\.dueTo\)/);
  assert.match(applications, /matchesDateOnlyRange\(getApplicationCreatedDate\(application\), filters\.createdFrom, filters\.createdTo\)/);

  for (const [block, scope, schema] of [
    [tasks, "tasks", getRegistryFilterSchema(tasks, "tasks")],
    [applications, "applications", getRegistryFilterSchema(applications, "applications")],
    [collaterals, "collaterals", getRegistryFilterSchema(collaterals, "collaterals")]
  ]) {
    for (const [, key] of schema) {
      for (const field of key.split(",")) assert.match(block, new RegExp(`filters\\.${field}\\b`), `${scope}.${field} must still be applied`);
    }
  }

  const taskColumnsBlock = getSourceBlock("function getTaskRegistryColumns(", "\nfunction renderTaskRegistryTable");
  const appColumnsBlock = getSourceBlock("function getApplicationRegistryColumns(", "\nfunction renderApplicationsRegistry");
  const collateralColumnsBlock = getSourceBlock("function getCollateralRegistryColumns()", "\nfunction renderCollateralsRegistry");
  const emptyValue = () => "";
  const context = Object.fromEntries([
    "getApplicationType", "getApplicationSubtype", "getApplicationPurpose", "getApplicationInitiator",
    "getApplicationRegistrySegment", "getApplicationClientName", "getApplicationInn",
    "getCollateralRegistryName", "getCollateralTypeLabel", "getCollateralRegistryPledgorSearchText",
    "getCollateralRegistryCreditContractText", "getCollateralRegistryLatestAppraisalDate", "getCollateralRegistryAddress",
    "getCollateralStatusForFt"
  ].map((name) => [name, emptyValue]));
  vm.runInNewContext(`${taskColumnsBlock}\n${appColumnsBlock}\n${collateralColumnsBlock}\nglobalThis.taskColumns = getTaskRegistryColumns; globalThis.appColumns = getApplicationRegistryColumns; globalThis.collateralColumns = getCollateralRegistryColumns;`, context);
  const taskColumns = (direction) => Array.from(context.taskColumns(direction), (column) => String(column.label));
  const sortableKeys = (columns) => Array.from(columns).filter((column) => column.sortValue).map((column) => String(column.key));
  const taskColumnConfigs = (direction) => Array.from(context.taskColumns(direction));
  assert.deepEqual(taskColumns("inspection"), ["Номер задачи", "Номер заявки", "Клиент", "ИНН клиента", "Тип задачи", "Автор задачи", "Сегмент инициатора", "Инициатор заявки", "Цель заявки", "Кредитный договор", "Залог", "Вид залога", "Залогодатель", "Город", "Исполнитель задачи", "Дата создания задачи", "Срок исполнения задачи", "Статус задачи", "Способ проведения осмотра", "Осталось дней"]);
  assert.deepEqual(taskColumns("evaluation"), ["Номер задачи", "Номер заявки", "Клиент", "ИНН клиента", "Тип задачи", "Автор задачи", "Сегмент инициатора", "Инициатор заявки", "Цель заявки", "Кредитный договор", "Залог", "Исполнитель задачи", "Дата создания задачи", "Срок исполнения задачи", "Статус задачи", "Осмотр произведен", "Осталось дней"]);
  assert.deepEqual(taskColumns("registration"), ["Номер задачи", "Номер заявки", "Клиент", "ИНН клиента", "Тип задачи", "Сегмент инициатора", "Инициатор заявки", "Цель заявки", "Кредитный договор", "Залог", "Вид залога", "Залогодатель", "Исполнитель задачи", "Дата создания задачи", "Срок исполнения задачи", "Статус задачи", "Статус регистрации", "Регистрационный номер / дата"]);
  assert.deepEqual(sortableKeys(taskColumnConfigs("evaluation")), ["client", "type", "initiatorSegment", "purpose", "executor", "createdAt", "dueDate", "status", "inspectionDone", "remainingTerm"]);
  assert.deepEqual(sortableKeys(taskColumnConfigs("inspection")), ["client", "type", "author", "initiatorSegment", "initiator", "purpose", "collateralType", "city", "executor", "createdAt", "dueDate", "status", "inspectionMethod", "remainingTerm"]);
  assert.deepEqual(sortableKeys(taskColumnConfigs("registration")), ["client", "type", "initiatorSegment", "initiator", "purpose", "collateralType", "executor", "createdAt", "dueDate", "status", "registrationStatus"]);
  assert.deepEqual(sortableKeys(Array.from(context.taskColumns("evaluation", "completed"))), ["client", "type", "initiatorSegment", "purpose", "executor", "createdAt", "dueDate", "status", "inspectionDone", "completedAt"]);
  assert.deepEqual(sortableKeys(Array.from(context.taskColumns("registration", "completed"))).slice(-1), ["completedAt"]);
  const appColumnConfigs = Array.from(context.appColumns());
  assert.deepEqual(appColumnConfigs.map((column) => String(column.label)), ["Номер заявки", "Дата создания заявки", "Тип заявки", "Подтип заявки", "Цель заявки", "Инициатор заявки", "Сегмент инициатора", "Клиент", "ИНН клиента", "Статус заявки", "Задачи", "Залог", "Кредитный договор"]);
  assert.deepEqual(sortableKeys(appColumnConfigs), ["createdAt", "type", "subtype", "purpose", "initiator", "initiatorSegment", "client", "status"]);
  const collateralColumnConfigs = Array.from(context.collateralColumns());
  assert.deepEqual(collateralColumnConfigs.map((column) => String(column.label)), ["Номер залога", "Наименование залога", "Вид залога", "Идентификатор залога", "Дата создания залога", "Залогодатель", "Клиент", "Кредитный договор", "Договор залога", "Адрес объекта", "Рыночная стоимость", "Залоговая стоимость", "Справедливая стоимость", "Дата последней оценки", "Статус объекта"]);
  assert.deepEqual(sortableKeys(collateralColumnConfigs), ["name", "type", "createdAt", "pledgor", "client", "creditContract", "address", "marketValue", "pledgeValue", "fairValue", "appraisalDate", "status"]);
});

test("filter toggle action updates scoped state and the drawer stays responsive", () => {
  assert.match(appSource, /action === "toggle-registry-filters"[\s\S]{0,220}registryFiltersExpanded\[scope\] = !state\.registryFiltersExpanded\[scope\]/);
  assert.match(styles, /\.registry-filter-content\[hidden\]\s*\{\s*display:\s*none/s);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*?\.task-registry-toolbar \.registry-tabs button/s);
});
