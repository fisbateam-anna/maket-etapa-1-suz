import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function sourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

test("registry record link opens its route in a neighboring tab", () => {
  const block = sourceBlock("function renderRegistryRecordLink(", "function renderApplicationRegistryNumberLink(");
  const context = {
    escapeHtml: (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  };
  vm.runInNewContext(`${block}\nglobalThis.renderLink = renderRegistryRecordLink;`, context);

  const markup = context.renderLink("/app/tasks/tsk-001", "tsk-001");
  assert.match(markup, /href="#\/app\/tasks\/tsk-001"/);
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /rel="noopener noreferrer"/);
  assert.doesNotMatch(markup, /data-route/);
});

test("all registry record links use the neighboring-tab link helper", () => {
  const requiredBlocks = [
    ["function renderTaskRegistryApplicationCell(", "function renderApplicationTasksLink(", "task registry application"],
    ["function renderApplicationTasksLink(", "function renderTaskRegistryContractCell(", "application related task list"],
    ["function getTaskRegistryColumns(", "function renderTaskRegistryTable(", "task number"],
    ["function renderTaskRegistryCollateralDrawerContent(", "function renderTaskRegistryCollateralDrawer(", "task collateral drawer"],
    ["function renderApplicationRegistryNumberLink(", "function isDraftApplication(", "application number"],
    ["function renderApplicationCountLink(", "function getApplicationRegistryColumns(", "application task count"],
    ["function renderApplicationRegistryCollateralDrawerContent(", "function renderApplicationContractLinks(", "application collateral drawer"],
    ["function getCollateralRegistryColumns(", "function hasCollateralRegistrySearchCriteria(", "collateral number"]
  ];

  for (const [start, end, label] of requiredBlocks) {
    const block = sourceBlock(start, end);
    assert.match(block, /renderRegistryRecordLink\(/, label);
  }
});
