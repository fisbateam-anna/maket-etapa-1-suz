import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { navItems, roles } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const rendererStart = appSource.indexOf("function renderSidebarNavItems(");
const rendererEnd = appSource.indexOf("\nfunction renderRoute(", rendererStart);
assert.notEqual(rendererStart, -1);
assert.notEqual(rendererEnd, -1);

const sandbox = {
  escapeHtml: (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char])
};
vm.runInNewContext(`${appSource.slice(rendererStart, rendererEnd)}\nglobalThis.renderSidebarNavItems = renderSidebarNavItems;`, sandbox);

function availableItems(role) {
  return navItems.filter((item) => role.permissions?.[item.permission] || role.menu?.includes(item.id));
}

function renderFor(role, path, activeTaskPath = "") {
  return sandbox.renderSidebarNavItems(availableItems(role), path, activeTaskPath);
}

function routeOrder(markup) {
  return [...markup.matchAll(/data-route="([^"]+)"/g)].map((match) => match[1]);
}

test("renders requested top-level order and always-visible task submenu for full-access role", () => {
  const manager = roles.find((role) => role.id === "evaluationManager");
  const markup = renderFor(manager, "/app/applications");
  assert.deepEqual(routeOrder(markup), [
    "/app/applications",
    "/app/collaterals",
    "/app/tasks/evaluation",
    "/app/tasks/inspection",
    "/app/tasks/registration"
  ]);
  assert.ok(markup.indexOf("Заявки") < markup.indexOf("Залоги"));
  assert.ok(markup.indexOf("Залоги") < markup.indexOf("Задачи"));
  assert.match(markup, /<div class="nav-group" role="group" aria-labelledby="task-nav-heading">\s*<div class="nav-group-heading" id="task-nav-heading">/);
  assert.match(markup, /<div class="nav-submenu">[\s\S]*Оценка[\s\S]*Осмотр[\s\S]*Регистрация[\s\S]*<\/div>/);
  assert.doesNotMatch(markup, /<details|<summary|\bopen>/);
  assert.match(markup, /aria-label="Оценка" title="Оценка"/);
});

test("hides task group when role has no task registry and filters child registries", () => {
  const initiator = roles.find((role) => role.id === "initiator");
  const inspector = roles.find((role) => role.id === "inspector");
  const initiatorMarkup = renderFor(initiator, "/app/applications");
  const inspectorMarkup = renderFor(inspector, "/app/collaterals");

  assert.deepEqual(routeOrder(initiatorMarkup), ["/app/applications"]);
  assert.doesNotMatch(initiatorMarkup, /class="nav-group/);
  assert.deepEqual(routeOrder(inspectorMarkup), ["/app/collaterals", "/app/tasks/inspection"]);
  assert.match(inspectorMarkup, /Задачи[\s\S]*Осмотр/);
  assert.doesNotMatch(inspectorMarkup, /Оценка|Регистрация/);
});

test("keeps only the selected task registry active for direct task-card routes", () => {
  const manager = roles.find((role) => role.id === "evaluationManager");
  const markup = renderFor(manager, "/app/tasks/tsk-27102026-004", "/app/tasks/inspection");
  assert.match(markup, /<div class="nav-group" role="group" aria-labelledby="task-nav-heading">\s*<div class="nav-group-heading"/);
  assert.doesNotMatch(markup, /class="nav-group active"/);
  assert.match(markup, /data-route="\/app\/tasks\/inspection"[^>]*aria-current="page"/);
  assert.doesNotMatch(markup, /data-route="\/app\/tasks\/evaluation"[^>]*aria-current="page"/);
});

test("renders task children in the requested visual order", () => {
  const manager = roles.find((role) => role.id === "evaluationManager");
  const markup = renderFor(manager, "/app/applications");
  assert.deepEqual(routeOrder(markup).slice(2), [
    "/app/tasks/evaluation",
    "/app/tasks/inspection",
    "/app/tasks/registration"
  ]);
});

test("keeps task submenu labels visible in the compact desktop layout", () => {
  const compactStart = stylesSource.indexOf("@media (min-width: 761px) and (max-width: 1180px)");
  const compactEnd = stylesSource.indexOf("@media (max-width: 760px)", compactStart);
  assert.notEqual(compactStart, -1);
  assert.notEqual(compactEnd, -1);
  const compactStyles = stylesSource.slice(compactStart, compactEnd);
  assert.match(compactStyles, /\.arm-sidebar \.top-nav \.nav-group-heading\s*\{[^}]*font-size: 13px/s);
  assert.match(compactStyles, /\.arm-sidebar \.nav-submenu button\s*\{[^}]*justify-content: flex-start/s);
  assert.match(stylesSource, /\.arm-sidebar \.nav-submenu button\s*\{[^}]*background: transparent/s);
  assert.match(stylesSource, /\.arm-sidebar \.nav-submenu button\.active\s*\{[^}]*background: linear-gradient/s);
  assert.match(stylesSource, /\.arm-sidebar \.top-nav button:hover\s*\{[^}]*background: rgba\(255, 255, 255, 0\.10\)/s);
  assert.match(stylesSource, /\.arm-sidebar \.top-nav button\.active\s*\{[^}]*background: #3211c8/s);
});

test("preserves route definitions and role permissions independent of menu display order", () => {
  assert.deepEqual(navItems.map((item) => item.path), [
    "/app/tasks/evaluation",
    "/app/tasks/inspection",
    "/app/tasks/registration",
    "/app/applications",
    "/app/collaterals"
  ]);
  for (const role of roles) {
    const renderedRoutes = routeOrder(renderFor(role, "/app/applications"));
    for (const route of renderedRoutes) {
      const item = navItems.find((candidate) => candidate.path === route);
      assert.ok(item);
      assert.ok(role.permissions?.[item.permission] || role.menu?.includes(item.id));
    }
  }
});
