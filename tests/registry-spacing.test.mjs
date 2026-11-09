import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { navItems } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function getSourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

test("menu registry headers omit breadcrumbs while retaining H1 and actions", () => {
  const block = getSourceBlock("function renderPageHeader(", "const REGISTRY_RESULT_LABELS = {");
  const context = {
    escapeHtml,
    getRole: () => ({ id: "test-role" }),
    getDefaultRouteForRole: () => "/app/home"
  };
  vm.runInNewContext(`${block}\nglobalThis.renderHeader = renderPageHeader; globalThis.renderRegistryHeader = renderRegistryPageHeader;`, context);

  const registryHeader = context.renderRegistryHeader("Реестр задач оценки", '<button>Создать</button>');
  assert.doesNotMatch(registryHeader, /breadcrumbs|Главная/);
  assert.match(registryHeader, /<h1>Реестр задач оценки<\/h1>/);
  assert.match(registryHeader, /<button>Создать<\/button>/);

  const regularHeader = context.renderHeader("Карточка заявки", "Описание");
  assert.match(regularHeader, /class="breadcrumbs"/);
  assert.match(regularHeader, /Главная/);
});

test("compact main spacing is limited to the five menu registry routes", () => {
  const expectedMenuRoutes = [
    "/app/tasks/evaluation",
    "/app/tasks/inspection",
    "/app/tasks/registration",
    "/app/applications",
    "/app/collaterals"
  ];
  const expectedRoutes = ["/", "/app", "/app/tasks", ...expectedMenuRoutes];
  const routeBlock = getSourceBlock("const COMPACT_REGISTRY_ROUTES = new Set([", "function renderRegistryPageHeader");
  const compactRoutes = Array.from(routeBlock.matchAll(/"([^\"]+)"/g), (match) => match[1]);
  const menuRoutes = navItems.map((item) => item.path).filter((path) => expectedMenuRoutes.includes(path));

  assert.deepEqual(compactRoutes, expectedRoutes);
  for (const route of expectedMenuRoutes) assert.ok(menuRoutes.includes(route), `Missing menu route ${route}`);
  assert.match(appSource, /COMPACT_REGISTRY_ROUTES\.has\(path\)/);
  assert.match(appSource, /<main class="\$\{mainClass\}">/);
  assert.match(getSourceBlock("function renderTasksRegistry(", "\nfunction renderContractsRegistry"), /renderRegistryPageHeader\(config\.title\)/);
  assert.match(getSourceBlock("function renderApplicationsRegistry()", "\nfunction renderCollateralControlPanel"), /renderRegistryPageHeader\("Реестр заявок"/);
  assert.match(getSourceBlock("function renderCollateralsRegistry(", "\nfunction renderCollateralRegistryContractsCell"), /renderRegistryPageHeader\("Реестр залогов"/);
});

test("registry vertical rhythm is compact without changing table-cell padding", () => {
  assert.match(styles, /\.main\.registry-main\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*calc\(100vh - 68px\);[^}]*padding:\s*10px 16px 12px;/s);
  assert.match(styles, /\.main\.registry-main \.registry-work-area\s*\{[^}]*padding:\s*8px;[^}]*margin-bottom:\s*0;/s);
  assert.match(styles, /\.main\.registry-main \.registry-work-area \.panel\s*\{\s*margin-bottom:\s*0;/s);
  assert.match(styles, /\.main\.registry-main \.registry-work-area \.task-registry-workspace\s*\{[^}]*gap:\s*4px;/s);
  assert.match(styles, /\.main\.registry-main \.registry-work-area \.table-panel\s*\{[^}]*padding:\s*8px;/s);
  assert.match(styles, /\.main\.registry-main \.registry-results-summary\s*\{\s*min-height:\s*22px;\s*padding-bottom:\s*4px;\s*margin-bottom:\s*4px;/s);
  assert.match(styles, /\.registry-table-scroll\s*\{[^}]*flex:\s*1 1 auto;[^}]*overflow:\s*auto;/s);
  assert.match(styles, /\.main\.registry-main \.registry-table-scroll > table\s*\{[^}]*min-height:\s*0;[^}]*height:\s*auto;/s);
  assert.match(styles, /\.main\.registry-main \.registry-filter-panel,\s*\.main\.registry-main \.task-registry-toolbar\s*\{\s*flex:\s*0 0 auto;/s);
  assert.match(styles, /@media \(max-width: 720px\)\s*\{\s*\.main\.registry-main\s*\{\s*padding:\s*8px;/s);
  assert.match(styles, /th,\s*td\s*\{\s*padding:\s*10px 12px;/s);
});

test("registry result counts align right and use a larger readable size", () => {
  assert.match(styles, /\.registry-result-count\s*\{[^}]*margin-left:\s*auto;[^}]*font-size:\s*14px;[^}]*font-weight:\s*700;/s);
});

test("registry filter layouts stay within the mobile viewport", () => {
  assert.match(styles, /@media \(max-width: 760px\)\s*\{[^}]*\.main\.registry-main \.registry-work-area,[\s\S]*?\.main\.registry-main \.registry-filter-grid[\s\S]*?min-width:\s*0;[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/);
});

test("long task registry text is clamped with a native disclosure and complete tooltip", () => {
  assert.match(appSource, /function renderRegistryClampedText\(value\)[\s\S]*?title="\$\{safeText\}"[\s\S]*?<summary>\$\{safeText\}<\/summary>[\s\S]*?registry-cell-full-text/);
  for (const label of ["Статус регистрации", "Регистрационный номер / дата", "Цель заявки"]) {
    const index = appSource.indexOf(`label: "${label}"`);
    assert.notEqual(index, -1, `Missing verbose registry column ${label}`);
    assert.match(appSource.slice(index, index + 220), /renderRegistryClampedText\(/, `${label} should use compact text rendering`);
  }
  assert.match(styles, /\.main\.registry-main \.registry-work-area \.registry-cell-disclosure > summary\s*\{[^}]*-webkit-line-clamp:\s*3;/s);
  assert.match(styles, /\.main\.registry-main \.registry-work-area \.registry-cell-full-text\s*\{/);
});

test("registry disclosure keeps full escaped content and leaves short values simple", () => {
  const block = getSourceBlock("function renderRegistryClampedText(", "\nfunction getTaskRegistryPurpose");
  const context = { escapeHtml };
  vm.runInNewContext(block + "\nglobalThis.render = renderRegistryClampedText;", context);
  const longValue = "Комментарий <объекта> для проверки & сохранения полного текста";
  const disclosure = context.render(longValue);

  assert.match(disclosure, /^<details class="registry-cell-disclosure"/);
  assert.match(disclosure, /<summary>Комментарий &lt;объекта&gt; для проверки &amp; сохранения полного текста<\/summary>/);
  assert.match(disclosure, /<div class="registry-cell-full-text">Комментарий &lt;объекта&gt; для проверки &amp; сохранения полного текста<\/div><\/details>$/);
  assert.equal(context.render("Короткое значение"), "Короткое значение");
});
