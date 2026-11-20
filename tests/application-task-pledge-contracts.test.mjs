import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const start = appSource.indexOf("function getTaskApplicationDealRows(");
const end = appSource.indexOf("\nfunction renderTaskApplicationDealsTable", start);
assert.ok(start >= 0 && end > start, "task-deal row selector must exist");

const context = {
  getApplicationDealRows: (application) => application?.deals || [],
  normalizeApplicationPledgeContractLinks: (links = []) => links || [],
  normalizeApplicationDealRow: (row) => row,
  uniqueItems: (items) => [...new Set(items)]
};
vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.getRows = getTaskApplicationDealRows;`, context);

test("each task from app-16112026-001 displays only pledge contracts linked to its collateral", () => {
  const application = initialData.applications.find((item) => item.id === "app-16112026-001");
  assert.ok(application, "showcase application must exist");
  const collateralById = new Map(initialData.collaterals.map((item) => [item.id, item]));
  const tasks = initialData.tasks.filter((task) => task.applicationId === application.id);

  assert.equal(tasks.length, 5, "showcase application should have five grouped inspection tasks");

  for (const task of tasks) {
    const taskCollaterals = task.collateralIds.map((id) => collateralById.get(id)).filter(Boolean);
    const rows = context.getRows(task, application, [], taskCollaterals);
    const links = rows.flatMap((row) => row.pledgeContractLinks || []);
    const uniqueContracts = new Set(links.map((link) => `${link.number}|${link.date}`));

    assert.ok(uniqueContracts.size <= 5, `${task.id} must display no more than five pledge contracts`);
    for (const row of rows) {
      const rowContractKeys = (row.pledgeContractLinks || []).map((link) => `${link.number}|${link.date}`);
      assert.equal(new Set(rowContractKeys).size, rowContractKeys.length, `${task.id} must not repeat one pledge contract in a deal row`);
    }
    assert.ok(links.length > 0, `${task.id} must display its associated pledge contract`);
    for (const link of links) {
      assert.ok(link.collateralIds.length > 0, `${task.id}/${link.number} must reference task collateral`);
      assert.ok(link.collateralIds.every((id) => task.collateralIds.includes(id)), `${task.id}/${link.number} must not include collateral from another task`);
    }

    const objectContracts = new Set(taskCollaterals.flatMap((collateral) =>
      (collateral.encumbrances || []).map((record) => `${record.number}|${record.date}`)
    ));
    assert.deepEqual([...uniqueContracts].sort(), [...objectContracts].sort(), `${task.id} should display the shared contract used by its objects`);
  }
});

test("the 150-property inspection task shares one pledge contract across its objects", () => {
  const task = initialData.tasks.find((item) => item.id === "tsk-16112026-001");
  const contracts = new Set(task.collateralIds.flatMap((id) => {
    const collateral = initialData.collaterals.find((item) => item.id === id);
    return (collateral?.encumbrances || []).map((record) => `${record.number}|${record.date}`);
  }));

  assert.equal(task.collateralIds.length, 150);
  assert.deepEqual([...contracts], ["ZL-26/150-001|2026-10-16"]);
});

test("split links for one shared agreement are merged in the task row", () => {
  const application = {
    deals: [{
      contractNumber: "CR-26/1",
      pledgeContractLinks: [
        { number: "ZL-26/1", date: "2026-10-01", collateralIds: ["COL-1"] },
        { number: "ZL-26/1", date: "2026-10-01", collateralIds: ["COL-2"] }
      ]
    }]
  };
  const task = { collateralIds: ["COL-1", "COL-2"] };
  const rows = context.getRows(task, application, [], [{ id: "COL-1" }, { id: "COL-2" }]);

  assert.equal(rows[0].pledgeContractLinks.length, 1);
  assert.deepEqual([...rows[0].pledgeContractLinks[0].collateralIds], ["COL-1", "COL-2"]);
});
