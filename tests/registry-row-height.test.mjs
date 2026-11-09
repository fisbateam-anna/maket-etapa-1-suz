import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { navItems } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("menu registries use a fixed-height header and content-sized rows", () => {
  assert.match(styles, /\.main\.registry-main \.registry-table-scroll > table\s*\{[^}]*min-height:\s*0;[^}]*height:\s*auto;/s);
  assert.match(styles, /\.main\.registry-main \.registry-table-scroll > table > thead > tr > th\s*\{[^}]*height:\s*64px;[^}]*padding-top:\s*6px;[^}]*padding-bottom:\s*6px;[^}]*line-height:\s*1\.2;/s);
  assert.match(styles, /\.main\.registry-main \.registry-table-scroll > table > tbody > tr\s*\{\s*height:\s*auto;/s);
  assert.doesNotMatch(styles, /\.registry-table-scroll > table\s*\{[^}]*min-height:\s*100%;[^}]*height:\s*100%;/s);

  const menuRegistryRoutes = [
    "/app/tasks/evaluation",
    "/app/tasks/inspection",
    "/app/tasks/registration",
    "/app/applications",
    "/app/collaterals"
  ];
  for (const route of menuRegistryRoutes) {
    assert.ok(navItems.some((item) => item.path === route), "Missing menu route " + route);
  }
  assert.match(appSource, /class="registry-table-scroll"/);
});
