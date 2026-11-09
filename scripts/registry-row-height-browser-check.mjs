import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.REGISTRY_CHECK_URL || "http://127.0.0.1:5185/";
const devtoolsUrl = process.env.CHROME_CDP_URL || "http://127.0.0.1:9224";
const routes = [
  "/#/app/tasks/evaluation",
  "/#/app/tasks/inspection",
  "/#/app/tasks/registration",
  "/#/app/applications",
  "/#/app/collaterals"
];
const evidenceDir = fileURLToPath(new URL("../delivery/registry-row-height-20261030/evidence/", import.meta.url));
const reportPath = evidenceDir + "/browser-measurements.json";
await mkdir(evidenceDir, { recursive: true });
const targets = await (await fetch(devtoolsUrl + "/json")).json();
const target = targets.find((item) => item.type === "page");
assert.ok(target, "Chrome DevTools page target not found");

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const handlers = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) handlers.reject(new Error(message.error.message));
  else handlers.resolve(message);
});
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text);
  return response.result.result.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false
});

const results = [];
for (const route of routes) {
  await send("Page.navigate", { url: new URL(route, baseUrl).href });
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (route === "/#/app/applications") {
    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true
    });
    await writeFile(evidenceDir + "/applications-registry.png", Buffer.from(screenshot.result.data, "base64"));
  }
  const expression = [
    "(() => {",
    '  const table = document.querySelector(".main.registry-main .registry-table-scroll > table");',
    '  const scrollArea = document.querySelector(".main.registry-main .registry-table-scroll");',
    '  if (!table || !scrollArea || !table.tBodies[0]?.rows.length) throw new Error("Registry result table is not rendered");',
    "  const body = table.tBodies[0];",
    "  const sampleRow = body.rows[0].outerHTML;",
    "  const headerRow = table.tHead.rows[0];",
    "  const samples = [1, 3, 25].map((count) => {",
    "    body.innerHTML = sampleRow.repeat(count);",
    "    const headerHeight = headerRow.getBoundingClientRect().height;",
    "    const rowHeight = body.rows[0].getBoundingClientRect().height;",
    "    return {",
    "      count,",
    "      headerHeight: Math.round(headerHeight * 10) / 10,",
    "      rowHeight: Math.round(rowHeight * 10) / 10,",
    "      tableHeight: Math.round(table.getBoundingClientRect().height * 10) / 10,",
    "      scrollAreaHeight: Math.round(scrollArea.getBoundingClientRect().height * 10) / 10",
    "    };",
    "  });",
    "  return { route: location.hash, samples };",
    "})()"
  ].join("\n");
  const measurements = await evaluate(expression);

  const [one, three, twentyFive] = measurements.samples;
  for (const sample of measurements.samples) {
    assert.ok(Math.abs(sample.headerHeight - 64) <= 1, route + ": header height is " + sample.headerHeight + "px");
    assert.ok(Math.abs(sample.rowHeight - one.rowHeight) <= 1, route + ": row height changes with row count");
  }
  assert.ok(three.tableHeight < twentyFive.tableHeight, route + ": table height does not grow with rows");
  results.push(measurements);
}

await writeFile(reportPath, JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results, null, 2));
ws.close();
