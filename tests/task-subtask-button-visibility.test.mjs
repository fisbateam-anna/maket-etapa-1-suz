import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Function ${name} should exist`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `Function ${name} should be complete`);
  return source.slice(start, end + 2);
}

test("create-task-by-application action is rendered only while the task is in progress", () => {
  const routeActionPredicate = extractFunction(app, "canUseRouteAction");
  const canUseRouteAction = new Function(
    "isTaskClosed",
    `${routeActionPredicate}; return canUseRouteAction;`
  )((task) => task?.status === "Завершена");

  assert.equal(canUseRouteAction({ status: "В работе" }), true);
  assert.equal(canUseRouteAction({ status: "Назначена" }), false);
  assert.equal(canUseRouteAction({ status: "Отложена" }), false);
  assert.equal(canUseRouteAction({ status: "Завершена" }), false);

  const renderer = extractFunction(app, "getTaskRouteActionButtons");
  assert.match(
    renderer,
    /if \(canUseRouteAction\(task\)\)\s*\{\s*actions\.push\(`<button class="btn btn-secondary" data-action="open-subtask"[\s\S]*?Создать задачу по заявке<\/button>`\);\s*\}/
  );
});
