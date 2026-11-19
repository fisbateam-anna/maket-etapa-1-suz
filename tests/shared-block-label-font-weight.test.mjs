import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function cssRule(selector) {
  const start = styles.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `Missing CSS rule: ${selector}`);
  const end = styles.indexOf("}", start);
  return styles.slice(start, end);
}

test("shared block field labels use normal font weight", () => {
  for (const selector of [
    ".application-preinspection-block .application-preinspection-field",
    ".application-preinspection-block .application-preinspection-check > span",
    ".contact-persons-table-wrap thead th",
    ".task-deals-table thead th",
    ".application-deals-table thead th",
    ".collateral-deals-table thead th",
    ".task-collateral-panel .task-collateral-table-wrap thead th"
  ]) {
    assert.match(cssRule(selector), /font-weight:\s*400\s*;/, selector);
  }
});

test("pre-inspection utility classes retain their original weights outside the target block", () => {
  assert.match(cssRule(".application-preinspection-field"), /font-weight:\s*700\s*;/);
  assert.match(cssRule(".application-preinspection-check > span"), /font-weight:\s*600\s*;/);
});

test("contact applicability select uses neutral styling without changing applicability fields", () => {
  const rule = cssRule(".application-contact-apply-select");
  assert.match(rule, /color:\s*var\(--text\)\s*;/);
  assert.match(rule, /background-color:\s*#ffffff\s*;/);
  assert.match(rule, /border:\s*1px solid var\(--line-strong\)\s*;/);
  assert.match(rule, /font-weight:\s*400\s*;/);
  assert.doesNotMatch(rule, /#eff6ff|#bfdbfe|var\(--accent-dark\)|font-weight:\s*700/);
  assert.match(app, /class="application-contact-apply-select" data-application-contact-field="applyBinding"/);
  assert.match(app, /data-application-preinspection-field="applyBinding"/);
});

test("collateral contract and security table has a scoped style hook", () => {
  assert.match(app, /<table class="collateral-deals-table">/);
});
