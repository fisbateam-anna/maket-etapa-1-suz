import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const standaloneFiles = [
  new URL("../Залоговый_модуль/index.html", import.meta.url),
  new URL("../Залоговый_модуль_Р_автономный.html", import.meta.url)
];

test("standalone pages initialize numbering helpers before demo data", async () => {
  for (const fileUrl of standaloneFiles) {
    const html = await readFile(fileUrl, "utf8");
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script, `${fileUrl.pathname} contains an inline application script`);

    const appStart = script.indexOf('const app = document.getElementById("app");');
    assert.notEqual(appStart, -1, "application bootstrap marker is present");
    const moduleBootstrap = script.slice(0, appStart);
    const numberingDeclaration = moduleBootstrap.indexOf("const collateralNumberPattern");
    const dataNormalization = moduleBootstrap.indexOf("normalizeCollateralSuzNumbers(initialData.collaterals)");

    assert.notEqual(numberingDeclaration, -1, "numbering helpers are embedded");
    assert.notEqual(dataNormalization, -1, "demo data is normalized during initialization");
    assert.ok(numberingDeclaration < dataNormalization, "numbering helpers run before data normalization");
    vm.runInNewContext(moduleBootstrap, { window: {} }, { timeout: 5000 });
  }
});
