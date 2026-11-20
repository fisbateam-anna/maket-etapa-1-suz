import assert from "node:assert/strict";
import test from "node:test";
import { initialData } from "../src/data.js";
import { hydrateApplicationDemoData } from "../src/application-demo-data.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("all seeded applications have demo bank, financial group, and pledge-contract links", () => {
  const data = hydrateApplicationDemoData(clone(initialData));

  assert.ok(data.applications.length > 0);
  for (const application of data.applications) {
    assert.ok(["Банк 1", "Банк 2"].includes(application.bank), `${application.number} must have a bank`);
    assert.ok(["Лизинг", "Факторинг"].includes(application.financialGroupParticipant), `${application.number} must have a financial group participant`);
    assert.ok(application.deals?.length, `${application.number} must contain a deals row`);

    for (const deal of application.deals) {
      assert.ok(deal.pledgeContractLinks?.length, `${application.number}/${deal.contractNumber || deal.id} must have pledge contracts`);
      const relatedCollateralIds = new Set(deal.collateralIds?.length ? deal.collateralIds : application.collateralIds);
      for (const link of deal.pledgeContractLinks) {
        assert.ok(link.number, `${application.number} pledge contract number must be present`);
        assert.ok(link.date, `${application.number} pledge contract date must be present`);
        assert.ok(link.collateralIds.length, `${application.number} pledge contract must reference collateral`);
        for (const collateralId of link.collateralIds) {
          assert.ok(relatedCollateralIds.has(collateralId), `${application.number} pledge contract must stay within its deal's collateral`);
          const collateral = data.collaterals.find((item) => item.id === collateralId);
          assert.ok(collateral, `${application.number} must reference an existing collateral`);
          assert.ok([...(collateral.pledgeContracts || []), ...(collateral.encumbrances || [])].some((record) =>
            (record.number || record.pledgeContractNumber) === link.number
            && (record.date || record.pledgeContractDate) === link.date
          ), `${application.number} pledge contract must be available from its collateral`);
        }
      }
    }
  }

  const showcase = data.applications.find((application) => application.id === "app-27102026-001");
  assert.equal(showcase.deals[0].pledgeContractLinks.length, 9);
  assert.equal(new Set(showcase.deals[0].pledgeContractLinks.map((link) => link.number)).size, 9);
});

test("existing application values and pledge links are preserved", () => {
  const input = {
    applications: [{
      id: "app-existing",
      number: "app-existing",
      bank: "Банк 2",
      financialGroupParticipant: "Факторинг",
      collateralIds: ["COL-1"],
      deals: [{ pledgeContractLinks: [{ number: "ZL-1", date: "2026-10-01", collateralIds: ["COL-1"] }] }]
    }],
    collaterals: [{ id: "COL-1", pledgeContracts: [{ number: "ZL-1", date: "2026-10-01" }] }]
  };

  const output = hydrateApplicationDemoData(clone(input));
  assert.equal(output.applications[0].bank, "Банк 2");
  assert.equal(output.applications[0].financialGroupParticipant, "Факторинг");
  assert.deepEqual(output.applications[0].deals[0].pledgeContractLinks, input.applications[0].deals[0].pledgeContractLinks);
});

test("saved pledge links outside the deal collateral are discarded and replaced with related agreements", () => {
  const input = {
    applications: [{
      id: "app-stale-link",
      number: "app-stale-link",
      createdAt: "2026-10-10 09:00",
      collateralIds: ["COL-1", "COL-2"],
      deals: [{
        contractNumber: "CR-1",
        collateralIds: ["COL-1"],
        pledgeContractLinks: [
          { number: "ZL-WRONG", date: "2026-10-02", collateralIds: ["COL-2"] },
          { number: "ZL-STALE", date: "2026-10-03", collateralIds: ["COL-1"] },
          { number: "ZL-RELATED", date: "", collateralIds: ["COL-1"] }
        ]
      }]
    }],
    collaterals: [
      { id: "COL-1", pledgeContracts: [{ number: "ZL-RELATED", date: "2026-10-01" }] },
      { id: "COL-2", pledgeContracts: [{ number: "ZL-WRONG", date: "2026-10-02" }] }
    ]
  };

  const output = hydrateApplicationDemoData(clone(input));
  assert.deepEqual(output.applications[0].deals[0].pledgeContractLinks, [
    { number: "ZL-RELATED", date: "2026-10-01", collateralIds: ["COL-1"] }
  ]);
});
