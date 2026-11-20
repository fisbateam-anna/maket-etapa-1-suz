const DEMO_BANKS = ["Банк 1", "Банк 2"];
const DEMO_FINANCIAL_GROUP_PARTICIPANTS = ["Лизинг", "Факторинг"];

function getPledgeContractRecords(collateral = {}) {
  const records = Array.isArray(collateral.pledgeContracts)
    ? collateral.pledgeContracts
    : Array.isArray(collateral.encumbrances) ? collateral.encumbrances : [];
  return records.map((record) => ({
    number: String(record?.pledgeContractNumber || record?.number || "").trim(),
    date: String(record?.pledgeContractDate || record?.date || "").trim(),
    linkedContract: String(record?.linkedContract || record?.contract || record?.pledgeContractMainContractId || "").trim()
  })).filter((record) => record.number || record.date);
}

function getFallbackPledgeContract(application, dealIndex, collateralIndex) {
  const number = String(application?.number || application?.id || "").match(/^app-(\d{2})(\d{2})(\d{4})-(\d{3})$/i);
  const date = String(application?.createdAt || "").slice(0, 10);
  const dateMatch = date.match(/^\d{4}-\d{2}-\d{2}$/);
  const year = number?.[3]?.slice(-2) || (dateMatch ? date.slice(2, 4) : "26");
  const sequence = String((dealIndex * 100) + collateralIndex + 1).padStart(3, "0");
  const numberPart = number ? `${number[1]}${number[2]}` : "DEMO";
  return { number: `ZL-${year}/${numberPart}-${sequence}`, date: dateMatch ? date : "2026-11-01" };
}

function collectPledgeLinks(collateralIds, collateralById, contractNumber) {
  const entries = collateralIds.flatMap((id) => {
    const collateral = collateralById.get(id);
    return getPledgeContractRecords(collateral).map((record) => ({ ...record, collateralId: id }));
  });
  const expectedContract = String(contractNumber || "").trim().toLocaleLowerCase("ru-RU");
  const matchingEntries = expectedContract
    ? entries.filter((entry) => entry.linkedContract.toLocaleLowerCase("ru-RU") === expectedContract)
    : [];
  const selectedEntries = matchingEntries.length ? matchingEntries : entries;
  const grouped = new Map();
  selectedEntries.forEach((entry) => {
    if (!entry.number || !entry.date) return;
    const key = JSON.stringify([entry.number, entry.date]);
    const link = grouped.get(key) || { number: entry.number, date: entry.date, collateralIds: [] };
    if (!link.collateralIds.includes(entry.collateralId)) link.collateralIds.push(entry.collateralId);
    grouped.set(key, link);
  });
  return [...grouped.values()];
}

function normalizeExistingPledgeLinks(value, collateralIds, collateralById) {
  const allowedIds = new Set(collateralIds);
  const grouped = new Map();
  (Array.isArray(value) ? value : []).forEach((item) => {
    const number = String(item?.number || item?.pledgeContractNumber || "").trim();
    const date = String(item?.date || item?.pledgeContractDate || "").trim();
    if (!number || !date) return;
    const referencedIds = [...new Set([
      ...(Array.isArray(item?.collateralIds) ? item.collateralIds : []),
      item?.collateralId
    ].filter(Boolean))];
    const hasMatchingAgreement = (id) => getPledgeContractRecords(collateralById.get(id))
      .some((record) => record.number === number && record.date === date);
    const relatedIds = referencedIds.filter((id) => allowedIds.has(id) && hasMatchingAgreement(id));
    const inferredIds = relatedIds.length ? relatedIds : collateralIds.filter(hasMatchingAgreement);
    if (!inferredIds.length) return;
    const key = JSON.stringify([number, date]);
    const link = grouped.get(key) || { number, date, collateralIds: [] };
    inferredIds.forEach((id) => {
      if (!link.collateralIds.includes(id)) link.collateralIds.push(id);
    });
    grouped.set(key, link);
  });
  return [...grouped.values()];
}

export function hydrateApplicationDemoData(data) {
  const collaterals = Array.isArray(data?.collaterals) ? data.collaterals : [];
  const applications = Array.isArray(data?.applications) ? data.applications : [];
  const collateralById = new Map(collaterals.map((collateral) => [collateral.id, collateral]));

  applications.forEach((application, applicationIndex) => {
    if (!String(application.bank || "").trim()) application.bank = DEMO_BANKS[applicationIndex % DEMO_BANKS.length];
    if (!String(application.financialGroupParticipant || "").trim()) {
      application.financialGroupParticipant = DEMO_FINANCIAL_GROUP_PARTICIPANTS[applicationIndex % DEMO_FINANCIAL_GROUP_PARTICIPANTS.length];
    }

    const deals = Array.isArray(application.deals) ? application.deals : [];
    deals.forEach((deal, dealIndex) => {
      const dealCollateralIds = Array.isArray(deal.collateralIds) && deal.collateralIds.length
        ? deal.collateralIds
        : application.collateralIds;
      const collateralIds = [...new Set(Array.isArray(dealCollateralIds) ? dealCollateralIds : [])]
        .filter((id) => collateralById.has(id));
      let links = normalizeExistingPledgeLinks(deal.pledgeContractLinks, collateralIds, collateralById);
      if (links.length) {
        deal.pledgeContractLinks = links;
        return;
      }

      links = collectPledgeLinks(collateralIds, collateralById, deal.contractNumber);

      if (!links.length && collateralIds.length) {
        links = collateralIds.map((id, collateralIndex) => {
          const fallback = getFallbackPledgeContract(application, dealIndex, collateralIndex);
          const collateral = collateralById.get(id);
          if (!Array.isArray(collateral.pledgeContracts)) collateral.pledgeContracts = [];
          const hasContract = collateral.pledgeContracts.some((record) =>
            String(record?.pledgeContractNumber || record?.number || "").trim() === fallback.number
            && String(record?.pledgeContractDate || record?.date || "").trim() === fallback.date
          );
          if (!hasContract) collateral.pledgeContracts.push({ number: fallback.number, date: fallback.date });
          return { ...fallback, collateralIds: [id] };
        });
      }

      deal.pledgeContractLinks = links;
    });
  });

  return data;
}
