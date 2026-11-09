import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function sourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

function createDeleteHelpers(options = {}) {
  const draft = { id: "app-draft-1", number: "app-30102026-003", status: "Черновик" };
  const role = { permissions: { appDelete: options.allowed !== false } };
  const context = {
    state: { data: { applications: [draft] }, modal: null },
    getApplicationRegistryStatus: (status) => status || "-",
    renderApplicationRegistryNumberLink: (application) => `<a>${application.number}</a>`,
    getRole: () => role,
    hasPermission: (currentRole, permission) => Boolean(currentRole.permissions?.[permission]),
    escapeHtml: (value) => String(value ?? ""),
    getApplicationTasks: () => options.tasks || [],
    resetRegistryPagination() {},
    persistTaskState() { context.persisted = true; },
    addToast(title, text) { context.toast = { title, text }; },
    persistTaskStateKey: "test"
  };
  const block = sourceBlock("function isDraftApplication(", "function renderApplicationLinkedTasksField(");
  vm.runInNewContext(`let deletedApplicationIds = [];\n${block}\nglobalThis.isDraft = isDraftApplication; globalThis.renderCell = renderApplicationRegistryNumberCell; globalThis.renderDeleteAction = renderApplicationRegistryDeleteAction; globalThis.open = openApplicationDeleteConfirmation; globalThis.confirm = confirmApplicationDelete; globalThis.deleted = () => deletedApplicationIds;`, context);
  return { context, draft };
}

test("application link stays clean and delete action is permission-gated in its own cell", () => {
  const authorized = createDeleteHelpers();
  const forbidden = createDeleteHelpers({ allowed: false });
  const active = createDeleteHelpers();
  active.draft.status = "Новая";

  assert.doesNotMatch(authorized.context.renderCell(authorized.draft), /open-delete-application/);
  assert.match(authorized.context.renderDeleteAction(authorized.draft), /data-action="open-delete-application"/);
  assert.doesNotMatch(forbidden.context.renderDeleteAction(forbidden.draft), /open-delete-application/);
  assert.match(active.context.renderDeleteAction(active.draft), /data-action="open-delete-application"[^>]*disabled aria-disabled="true"/);
});
test("application delete action is modeled as its own final column", () => {
  const block = sourceBlock("function getApplicationRegistryColumns(", "\nfunction isApplicationVisibleInRegistry(");
  const emptyValue = () => "";
  const context = Object.fromEntries([
    "getApplicationType", "getApplicationSubtype", "getApplicationPurpose", "getApplicationInitiator",
    "getApplicationRegistrySegment", "getApplicationClientName", "getApplicationInn", "getApplicationRegistryStatus"
  ].map((name) => [name, emptyValue]));
  vm.runInNewContext(`${block}\nglobalThis.getColumns = getApplicationRegistryColumns;`, context);
  const columns = Array.from(context.getColumns(true));

  assert.equal(columns.at(-1).key, "actions");
  assert.equal(columns.at(-1).label, "Действия");
  assert.match(columns.at(-1).headerMarkup, /visually-hidden/);
  assert.equal(columns.at(-1).draggable, false);
  assert.equal(columns.find((column) => column.key === "contract").headerMarkup, "Кредитный<br>договор");
  assert.equal(Array.from(context.getColumns(false)).some((column) => column.key === "actions"), false);
  assert.match(appSource, /visibleColumns\.filter\(\(column\) => column\.key !== "actions"\), deleteActionColumn/);
  assert.match(stylesSource, /\.applications-table\.has-delete-action th:last-child,[\s\S]*?\.applications-table\.has-delete-action td:last-child\s*\{[^}]*border-left:[^}]*padding-left:/);
});

test("registry table renderers no longer show the column-settings button", () => {
  assert.doesNotMatch(appSource, /renderRegistryColumnSettings\(allColumns,\s*"(?:tasks|applications|collaterals)"/);
});

test("draft deletion requires confirmation and guards against tasks linked to a draft", () => {
  const helpers = createDeleteHelpers();
  helpers.context.open(helpers.draft.id);
  assert.deepEqual({ ...helpers.context.state.modal }, { type: "deleteApplication", applicationId: helpers.draft.id });

  helpers.context.confirm(helpers.draft.id);
  assert.equal(helpers.context.state.data.applications.length, 0);
  assert.deepEqual(Array.from(helpers.context.deleted()), [helpers.draft.id, helpers.draft.number]);
  assert.equal(helpers.context.persisted, true);
  assert.equal(helpers.context.state.modal, null);

  const linked = createDeleteHelpers({ tasks: [{ id: "tsk-linked" }] });
  linked.context.open(linked.draft.id);
  assert.equal(linked.context.state.modal, null);
  assert.equal(linked.context.toast.title, "Заявку нельзя удалить");
  assert.match(appSource, /<p>Вы действительно хотите удалить заявку \$\{escapeHtml\(application\.number \|\| application\.id\)\}\?<\/p>/);
  assert.match(appSource, /id="deleteApplicationTitle">Удалить черновик заявки\?/);
  assert.match(appSource, /data-action="close-modal">Отменить<\/button>/);
  assert.match(appSource, /data-action="confirm-delete-application"[^>]*>Удалить<\/button>/);
});

test("draft deletion confirmation renders the FT wording and both actions", () => {
  const application = { id: "app-draft-2", number: "app-31102026-007", status: "Черновик" };
  const context = {
    state: { modal: { type: "deleteApplication", applicationId: application.id }, data: { applications: [application] } },
    escapeHtml: (value) => String(value ?? "")
  };
  const block = sourceBlock("function renderModal() {", "\nfunction renderDeferTaskModal() {");
  vm.runInNewContext(`${block}\nglobalThis.render = renderModal;`, context);

  const html = context.render();
  assert.match(html, /Вы действительно хотите удалить заявку app-31102026-007\?/);
  assert.match(html, /data-action="close-modal">Отменить<\/button>/);
  assert.match(html, /data-action="confirm-delete-application" data-application="app-draft-2">Удалить<\/button>/);
});

test("deleted application IDs are excluded when fixture data is restored", () => {
  const start = appSource.indexOf("function buildRuntimeData() {");
  const end = appSource.indexOf("\nfunction restoreLegacyApplicationInitialTaskMarkers", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const application = { id: "app-draft-1", number: "app-30102026-003", status: "Черновик" };
  const data = { applications: [application], collaterals: [], tasks: [] };
  const context = {
    initialData: data,
    clone: (value) => JSON.parse(JSON.stringify(value)),
    readSavedStateSnapshot: () => ({ state: { deletedApplicationIds: [application.id, application.number] } }),
    migrateSavedObjectNumbers: (snapshot) => ({ state: snapshot.state, aliases: {}, changed: false }),
    remapScreenshotFixtureIdsForSavedState: (value) => value,
    normalizeCollateralCreationDates: (items) => items,
    normalizeCollateralRecordsForFtV7: (items) => items,
    normalizeDataApplicationSingleClient: (_data, item) => item,
    normalizeTaskRecord: (item) => item,
    mergeSavedCollateralWithBase: (saved) => saved,
    ensureTaskRegistryExamples: (value) => value,
    restoreLegacyApplicationInitialTaskMarkers: (value) => value,
    ensureDocumentFollowupExamples: (value) => value,
    ensureApplicationsHaveInitialTasks: (value) => value,
    enrichTaskApplications: (value) => value,
    sanitizeMvp1Data: (value) => value,
    ensureTaskSetterComments: (value) => value,
    TASK_STATE_STORAGE_KEY: "test-state",
    legacyObjectNumberAliases: {}
  };
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.build = buildRuntimeData;`, context);
  assert.deepEqual(Array.from(context.build().applications), []);
});

test("collateral registry waits for a search criterion and treats application context as an explicit search", () => {
  const block = sourceBlock("function hasCollateralRegistrySearchCriteria(", "function renderCollateralsRegistry(");
  const context = {};
  vm.runInNewContext(`${block}\nglobalThis.hasCriteria = hasCollateralRegistrySearchCriteria;`, context);

  assert.equal(context.hasCriteria({ status: ["Новый", "В залоге"] }), false);
  assert.equal(context.hasCriteria({ status: ["Новый"] }), false);
  assert.equal(context.hasCriteria({ status: ["Новый", "В залоге"], name: "квартира" }), true);
  assert.equal(context.hasCriteria({}, "app-30102026-001"), true);
});
