import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { navItems } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const start = appSource.indexOf("const TASK_REGISTRY_DIRECTIONS = {");
const end = appSource.indexOf("\nfunction hasPermission", start);
assert.notEqual(start, -1, "Missing task registry configuration");
assert.notEqual(end, -1, "Missing task registry configuration end");

const context = {};
vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.directions = TASK_REGISTRY_DIRECTIONS;`, context);

test("registration registry page title is concise without changing navigation labels", () => {
  assert.equal(context.directions.registration.title, "Реестр задач регистрации");
  assert.equal(context.directions.evaluation.title, "Реестр задач оценки");
  assert.equal(context.directions.inspection.title, "Реестр задач осмотра");
  assert.equal(context.directions.registration.label, "Регистрация");
  assert.equal(navItems.find((item) => item.id === "tasksRegistration")?.label, "Регистрация");
});
