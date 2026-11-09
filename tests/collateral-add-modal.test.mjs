import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { FT_COLLATERAL_SUBTYPE_OPTIONS, resolveCollateralSubtype } from "../src/data.js";
import { normalizeCollateralSuzNumbers } from "../src/object-numbering.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styleSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function extractBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

const constantsSource = extractBetween(
  "const FT_COLLATERAL_TYPE_OPTIONS = [",
  "const COLLATERAL_LEGACY_TYPE_FIELDS = ["
);
const documentCatalogSource = extractBetween(
  "const FT_COLLATERAL_DOCUMENT_CATALOG = {",
  "\n\nfunction escapeHtml(value)"
);
const typeOptionsSource = extractBetween(
  "const COLLATERAL_TYPE_FIELD_OPTIONS = {",
  "function getUnifiedTaskType(type)"
);
const v6FieldApplicabilitySource = extractBetween(
  "function isCollateralV6TypeFieldApplicable(typeLabel, label, source = {})",
  "function getCollateralBasisDocument(collateral)"
);
const addressAccessorSource = extractBetween(
  "function getCollateralAddressFields(collateral)",
  "function getCollateralTypeSpecificFields(collateral, { cardView = false } = {})"
);
const basisDocumentSource = extractBetween(
  "function getCollateralBasisDocument(collateral)",
  "function getCollateralTypeDisplayFieldLabels(typeLabel)"
);
const validationSource = extractBetween(
  "function getNewCollateralDraftValidationError(draft)",
  "function renderNewCollateralField(label, group, value, draft, options = [], { readOnly = false, wide = false, fieldClass = \"\", inputTypeOverride = \"\", derived = false } = {})"
);
const maxLengthSource = extractBetween(
  "function getNewCollateralFieldMaxLength(group, label, draft)",
  "function renderNewCollateralPledgorRow(row, index, draft)"
);
const dateNormalizerSource = extractBetween(
  "function normalizeNewCollateralDate(value)",
  "function getNewCollateralDraftValidationError(draft)"
);
const residentialHelperSource = extractBetween(
  "function isNewCollateralResidentialDraft(draft)",
  "function refreshNewCollateralProfileIdentifier(draft)"
);
const profileSource = extractBetween(
  "function getNewCollateralProfileIdentifierOptions(typeLabel)",
  "function isNewCollateralResidentialDraft(draft)"
);
const profileFieldValueSource = extractBetween(
  "function getCollateralProfileFieldValue(collateral, option)",
  "function getContract(id)"
);
const collateralV7NormalizerSource = extractBetween(
  "function normalizeCollateralRecordsForFtV7(collaterals = [])",
  "function getCollateralProfileFieldValue(collateral, option)"
);

function readCollateralSchemas() {
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы"
  };
  vm.runInNewContext(`${constantsSource}\nglobalThis.schemas = {
    types: FT_COLLATERAL_TYPE_OPTIONS,
    address: COLLATERAL_ADDRESS_FIELDS,
    shared: COLLATERAL_SHARED_MAIN_FIELDS,
    sharedForm: NEW_COLLATERAL_SHARED_FIELDS,
    typeFields: FT_COLLATERAL_V8_TYPE_FIELDS,
    modalTypeFields: FT_COLLATERAL_V8_MODAL_TYPE_FIELDS
  };`, sandbox);
  return sandbox.schemas;
}

test("property identification fields remain visible regardless of cadastral number", () => {
  const sandbox = {
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim())
  };
  vm.runInNewContext(`${v6FieldApplicabilitySource}\nglobalThis.applicable = isCollateralV6TypeFieldApplicable;`, sandbox);
  const property = {
    hasCadastralNumber: false,
    fields: { "Кадастровый номер": "54:35:000000:15", "Условный номер": "УС-15" }
  };

  assert.equal(sandbox.applicable("Объекты недвижимости", "Кадастровый номер", property), true);
  assert.equal(sandbox.applicable("Объекты недвижимости", "Условный номер", property), true);
  property.hasCadastralNumber = true;
  assert.equal(sandbox.applicable("Объекты недвижимости", "Кадастровый номер", property), true);
  assert.equal(sandbox.applicable("Объекты недвижимости", "Условный номер", property), true);
  property.fields["Кадастровый номер"] = "";
  assert.equal(sandbox.applicable("Объекты недвижимости", "Условный номер", property), true);
});

function loadGroups(schemas) {
  const groupHelpers = extractBetween(
    "function getNewCollateralSubtypeField(typeLabel)",
    "function getNewCollateralProfileIdentifierOptions(typeLabel)"
  );
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    NEW_COLLATERAL_SHARED_FIELDS: schemas.sharedForm,
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    FT_COLLATERAL_V8_TYPE_FIELDS: schemas.typeFields,
    FT_COLLATERAL_V8_MODAL_TYPE_FIELDS: schemas.modalTypeFields,
    getCollateralTypeCodeFromLabel: (label) => label,
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    getCollateralEditableOptions: (_collateral, group, field) => group === "type" && field === "Подвид залога" ? ["Тестовый подвид"] : [],
    getCollateralTypeDisplayFieldLabels: (label) => schemas.typeFields[label] || [],
    isCollateralAddressApplicable: (label) => Boolean(label) && label !== "Имущественные права (требования)"
  };
  vm.runInNewContext(`${v6FieldApplicabilitySource}\n${groupHelpers}\n${profileSource}\nglobalThis.getGroups = (typeLabel, draft = {}) => getNewCollateralFieldGroups(typeLabel, draft);`, sandbox);
  return sandbox.getGroups;
}

function loadCollateralMutation(draft, collaterals = [], modal = { context: "applicationCreate" }) {
  const schemas = readCollateralSchemas();
  const createSource = extractBetween("function createDraftCollateralFromForm()", "function normalizeProfileIdentifier(value =");
  const objectIdentifier = extractBetween("function getCollateralObjectIdentifier(collateral)", "function formatProfileIdentifierDate(value)");
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  const data = { collaterals };
  const toasts = [];
  const sandbox = {
    state: { newCollateralDraft: draft, modal, data },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    COLLATERAL_LEGACY_TYPE_FIELDS: ["Единица измерения", "Значение, в указанных ед.изм.", "Дополнительная информация"],
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    getNextCollateralId: () => "COL-GENERATED-1",
    getNewCollateralSubtypeField: (typeLabel) => (schemas.typeFields[typeLabel] || []).find((field) => ["Подвид залога", "Подвид", "Подтип"].includes(field)) || "",
    getCollateralTypeCodeFromLabel: (label) => label,
    getCollateralTypeLabel: (item) => item.typeLabel || item.type,
    getCollateralName: (item) => item.name || item.description || item.id,
    getCollateralTypeDisplayFieldLabels: (label) => schemas.typeFields[label] || [],
    getCollateralClientType: (item) => item?.clientType || "",
    getNewCollateralFieldGroups: (typeLabel, draft) => ({
      typeSpecific: (schemas.modalTypeFields[typeLabel] || []).filter((field) => sandbox.isCollateralV6TypeFieldApplicable(typeLabel, field, draft))
    }),
    getNewCollateralDraftValidationError: () => null,
    getNewCollateralFieldMaxLength: () => 0,
    getCollateral: (id) => data.collaterals.find((item) => item.id === id) || null,
    getCollateralSuzNumber: (item) => item?.suzNumber || item?.collateralNumber || "",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    getCollateralUnitDefault: () => "Штука (шт.)",
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isCollateralAddressApplicable: (label) => label !== "Имущественные права (требования)",
    groupsAddressFields: (label, values = {}) => label === "Имущественные права (требования)"
      ? {}
      : Object.fromEntries(schemas.address.map((field) => [field, values[field] || ""])),
    normalizeProfileIdentifier: (value) => String(value || "").replace(/\\s+/g, "").toLocaleLowerCase("ru-RU"),
    getRole: () => ({ user: "Анна Иванова" }),
    formatTaskHistoryDate: () => "23.10.2026 12:00",
    addToast: (...args) => toasts.push(args)
  };
  vm.runInNewContext(`${v6FieldApplicabilitySource}\n${dateHelper}\n${profileFieldValueSource}\n${objectIdentifier}\n${profileSource}\n${dateNormalizerSource}\n${createSource}\nglobalThis.create = createDraftCollateralFromForm;`, sandbox);
  return { sandbox, create: sandbox.create, toasts };
}

function mergeSavedCollateral(saved, base) {
  const mergeSource = extractBetween("function getCollateralGroupCode(collateral)", "function normalizeDataApplicationSingleClient");
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    mergeSavedValueWithDefaults: (defaults, value) => value == null ? defaults : { ...defaults, ...value }
  };
  vm.runInNewContext(`${mergeSource}\nglobalThis.merge = mergeSavedCollateralWithBase;`, sandbox);
  return sandbox.merge(saved, base);
}

test("new collateral form uses the v8 identity, common and type-specific fields", () => {
  const schemas = readCollateralSchemas();
  const getGroups = loadGroups(schemas);
  assert.equal(schemas.types.length, 12);
  for (const type of schemas.types) {
    const groups = getGroups(type);
    assert.equal(groups.identity[0], "Вид залога");
    assert.ok(groups.identity[1]);
    assert.ok(groups.identity.includes("Наименование"));
    assert.ok(groups.identity.includes("Профильный идентификатор объекта"));
    assert.ok(groups.typeSpecific.every((field) => !["Подвид залога", "Подвид", "Подтип"].includes(field)));
    assert.ok(groups.identity.includes("Вид профильного идентификатора"));
    assert.deepEqual(Array.from(groups.shared), ["Единица измерения", "Значение, в указанных ед.изм.", "Дополнительная информация", "Осмотр произведен", "Контактное лицо для осмотра"]);
    assert.ok(groups.pledgors.includes("idn"));
  }
  const propertyFields = getGroups("Объекты недвижимости").typeSpecific;
  assert.ok(propertyFields.includes("Кадастровый номер"));
  assert.ok(propertyFields.includes("Условный номер"));
  assert.equal(propertyFields.includes("Кадастровый номер есть"), false);
  assert.ok(getGroups("Плавучие сооружения").typeSpecific.includes("Группа"));
  for (const field of [
    "Размер доли в праве общей долевой собственности, числитель",
    "Размер доли в праве общей долевой собственности, знаменатель",
    "Площадь в неструктурированном виде"
  ]) assert.ok(propertyFields.includes(field), `Missing property characteristic ${field}`);
  assert.ok(getGroups("Объекты недвижимости").typeSpecific.includes("Кадастровый номер"));
  assert.ok(getGroups("Объекты недвижимости").typeSpecific.includes("Условный номер"));
  assert.deepEqual(Array.from(getGroups("Железнодорожный подвижной состав").typeSpecific), [
    "Заводской номер", "Модель вагона", "Номер вагона", "Год постройки"
  ]);
  assert.equal(getGroups("Железнодорожный подвижной состав").typeSpecific.includes("Тип единицы"), false);
  assert.deepEqual(Array.from(getGroups("Имущественные права (требования)").address), []);
  assert.deepEqual(Array.from(getGroups("Товары в обороте").typeSpecific), ["Инвентарный номер"]);
  assert.deepEqual(Array.from(getGroups("Прочие движимые вещи (однородные группы)").typeSpecific), ["Инвентарный номер"]);
  for (const field of ["Адрес / место нахождения", "Почтовый индекс", "Регион", "Район", "Населенный пункт", "Город", "Улица", "Дом", "Корпус", "Квартира"]) {
    assert.ok(schemas.address.includes(field), `Missing shared address field ${field}`);
  }
  for (const type of schemas.types) {
    const groups = getGroups(type);
    for (const removed of ["ФИАС GUID", "Код страны по ОКСМ", "Код территории по ОКАТО", "Признак группы залога"]) {
      assert.equal(schemas.address.includes(removed) || groups.shared.includes(removed), false, `Removed field remains: ${removed} for ${type}`);
    }
  }
});

test("edit dialog does not expose legacy group linkage as a form field", () => {
  const source = extractBetween("function createNewCollateralDraft(context =", "function openNewCollateralModal(");
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    COLLATERAL_ADDRESS_FIELDS: ["Адрес / место нахождения"],
    state: { newTask: {}, data: { collaterals: [] } },
    getCollateralTypeLabel: (item) => item.type,
    getCollateralSubtype: resolveCollateralSubtype,
    getCollateralName: (item) => item.name,
    getCollateralTypeSpecificFields: (item) => item.fields,
    getCollateralClientType: (item) => item?.clientType || "",
    getCollateralSuzNumber: (item) => item?.suzNumber || "",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    formatNewCollateralDateInput: (value) => String(value || "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3.$2.$1"),
    getNewCollateralProfileIdentifierType: () => "",
    getCollateralBasisDocument: () => ({ type: "", date: "", series: "", number: "" }),
    getCollateralUnitDefault: () => "Штука (шт.)",
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    normalizeNewCollateralDate: (value) => {
      const match = String(value || "").trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || "").trim();
    },
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim())
  };
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  vm.runInNewContext(`${dateHelper}\n${profileFieldValueSource}\n${profileSource}\n${basisDocumentSource}\n${source}\nglobalThis.create = createNewCollateralDraft;`, sandbox);
  const legacy = sandbox.create("applicationCreate", {
    id: "COL-LEGACY",
    type: "Транспортные средства, прицепы (полуприцепы)",
    name: "Автомобиль",
    pledgeContractNumber: "ZL-LEGACY-1",
    pledgeContractDate: "2026-10-01",
    pledgeContractAmount: 760000000,
    pledgeContractCurrency: "RUB",
    pledgeProduct: "Кредит",
    ftMainInfo: { "Идентификационный код группы": "GROUP-LEGACY", "Осмотр (проведен/не проведен)": "проведен" },
    encumbrances: [
      { number: "ZL-LEGACY-1", date: "2026-10-01", amount: 760000000, currency: "RUB", product: "Кредит", contract: "CTR-26/01" },
      { number: "ZL-LEGACY-1", date: "2026-11-01", allocated: 250000, currency: "RUB", product: "Лизинг", contract: "CTR-26/02" }
    ],
    fields: { "Тип документа": "ПТС", "Дата": "2026-10-01", "Серия": "11АА", "Номер": "123456" }
  });
  assert.equal(Object.hasOwn(legacy.sharedFields, "Признак группы залога"), false);
  assert.equal(Object.hasOwn(legacy.typeFields, "Идентификационный код группы"), false);
  assert.equal(legacy.sharedFields["Осмотр произведен"], "Да");
  assert.deepEqual(JSON.parse(JSON.stringify(legacy.pledgeContracts)), [
    { number: "ZL-LEGACY-1", date: "2026-10-01", amount: 760000000, currency: "RUB", product: "Кредит", linkedContract: "CTR-26/01" },
    { number: "ZL-LEGACY-1", date: "2026-11-01", amount: 250000, allocated: 250000, currency: "RUB", product: "Лизинг", linkedContract: "CTR-26/02" }
  ]);
  assert.equal(Object.hasOwn(legacy.sharedFields, "Идентификационный код группы"), false);
  assert.deepEqual(JSON.parse(JSON.stringify(legacy.basisDocument)), { type: "ПТС", date: "01.10.2026", series: "11АА", number: "123456", status: "" });
  assert.equal(Object.hasOwn(legacy.typeFields, "Тип документа"), false);
});

test("collateral document widget uses type-specific document folders for all 12 types", () => {
  const schemas = readCollateralSchemas();
  const rulesSource = extractBetween(
    "function getCollateralDocumentRules(collateral)",
    "function isApplicationInputDocumentRule(rule)"
  );
  const mergeSource = extractBetween("function mergeDocumentRules(rules = [])", "function getDocumentApplyOptions(");
  const sandbox = {
    getCollateralTypeLabel: (collateral) => collateral.type,
    getDocumentRules: () => [],
    mergeDocumentRules: null
  };
  vm.runInNewContext(`${documentCatalogSource}\n${mergeSource}\n${rulesSource}\nglobalThis.catalog = FT_COLLATERAL_DOCUMENT_CATALOG;\nglobalThis.rules = getCollateralDocumentRules;`, sandbox);
  assert.deepEqual(Object.keys(sandbox.catalog).sort(), Array.from(schemas.types).sort());
  for (const type of schemas.types) {
    const folders = sandbox.rules({ type });
    assert.ok(folders.length > 0, `No document folders for ${type}`);
    assert.ok(folders.every((folder) => folder.taskType === "any"));
  }
  assert.ok(sandbox.rules({ type: "Железнодорожный подвижной состав" }).some((item) => item.title === "Технический паспорт вагона"));
});

test("shared document upload stores all selected files on the collateral draft", () => {
  const attachSource = extractBetween("function attachDocument(encoded, files = [], bindingValue = \"\")", "\nfunction normalizeDocumentUploadFiles(files)");
  const draft = { id: "NEW-COLLATERAL-DRAFT", documents: [] };
  const sandbox = {
    getDocumentOwner: () => draft,
    normalizeDocumentUploadFiles: (files) => Array.from(files),
    formatTaskHistoryDate: () => "23.10.2026 12:00",
    getDocumentOwnerCollaterals: () => [draft],
    parseDocumentBinding: () => ({ scope: "collateral", value: draft.id }),
    getDocumentBindingCollateralIds: () => [draft.id],
    getDocumentStorageTarget: (_binding, _target, ids) => ids[0],
    getDocumentTargetIdsForBinding: (_binding, ids) => ids,
    getUploadedDocumentFileName: (file) => file.name,
    getUploadedDocumentBusinessName: (file) => file.name.replace(/\\.[^.]+$/, ""),
    getUploadedDocumentFileSize: (file) => file.size,
    getRole: () => ({ user: "Анна Иванова" }),
    persistTaskState: () => {},
    addToast: () => {}
  };
  vm.runInNewContext(`${attachSource}\nglobalThis.attach = attachDocument;`, sandbox);
  sandbox.attach("collateralDraft::NEW-COLLATERAL-DRAFT::Технический паспорт вагона::NEW-COLLATERAL-DRAFT", [
    { name: "паспорт-1.pdf", size: 120 },
    { name: "паспорт-2.pdf", size: 240 }
  ], "collateral::NEW-COLLATERAL-DRAFT");
  assert.deepEqual(Array.from(draft.documents, (doc) => doc.name), ["паспорт-1.pdf", "паспорт-2.pdf"]);
  assert.ok(draft.documents.every((doc) => doc.target === "NEW-COLLATERAL-DRAFT" && doc.applyValue === "NEW-COLLATERAL-DRAFT"));
});

test("profile identifier follows the explicitly selected FT source field", () => {
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    getCollateralProfileFieldValue: (item, option) => String(item?.fields?.[option?.field] || "").trim()
  };
  vm.runInNewContext(`${dateHelper}\n${profileSource}\nglobalThis.profile = getNewCollateralProfileIdentifier; globalThis.options = getNewCollateralProfileIdentifierOptions;`, sandbox);
  assert.equal(sandbox.profile({ typeLabel: "Оборудование", profileIdentifierType: "Заводской номер", typeFields: { "Заводской номер": "EQ-12", "Инвентарный номер": "INV-12" } }), "EQ-12");
  assert.equal(sandbox.profile({ typeLabel: "Оборудование", profileIdentifierType: "Инвентарный номер", typeFields: { "Заводской номер": "EQ-12", "Инвентарный номер": "INV-12" } }), "INV-12");
  assert.equal(sandbox.profile({ typeLabel: "Транспортные средства (самоходная техника)", profileIdentifierType: "Идентификационный номер ТС или СМ (VIN, PIN, заводской)", typeFields: { "Идентификационный номер ТС или СМ (VIN, PIN, заводской)": "SM-12" } }), "SM-12");
  assert.equal(sandbox.profile({ typeLabel: "Объекты недвижимости", profileIdentifierType: "Кадастровый номер", suzNumber: "col-102026-012", typeFields: { "Кадастровый номер": "54:35:000000:12" } }), "54:35:000000:12");
  assert.equal(sandbox.profile({ typeLabel: "Транспортные средства, прицепы (полуприцепы)", profileIdentifierType: "VIN", typeFields: { "Идентификационный номер транспортного средства (VIN)": "VIN-12" } }), "VIN-12");
  assert.equal(sandbox.profile({ typeLabel: "Воздушные суда", profileIdentifierType: "Опознавательные знаки воздушного судна", typeFields: { "Опознавательные знаки воздушного судна": "RA-12" } }), "RA-12");
  assert.equal(sandbox.profile({ typeLabel: "Плавучие сооружения", profileIdentifierType: "Регистровый номер", typeFields: { "Регистровый номер": "REG-12" } }), "REG-12");
  assert.equal(sandbox.profile({ typeLabel: "Железнодорожный подвижной состав", profileIdentifierType: "Номер вагона", typeFields: { "Номер вагона": "W-12" } }), "W-12");
  assert.equal(sandbox.profile({ typeLabel: "Имущественные права (требования)", profileIdentifierType: "Номер договора вместе с датой заключения договора", typeFields: { "Номер договора": "CON-12" } }), "CON-12");
  assert.equal(sandbox.profile({ typeLabel: "Имущественные права (требования)", profileIdentifierType: "Номер договора вместе с датой заключения договора", typeFields: { "Номер договора": "CON-12", "Дата заключения договора": "19.09.2026" } }), "CON-12 от 19.09.2026");
  assert.equal(sandbox.profile({ typeLabel: "Товары в обороте", profileIdentifierType: "Инвентарный номер", typeFields: { "Инвентарный номер": "INV-12" } }), "INV-12");
  assert.equal(sandbox.profile({ typeLabel: "Прочие движимые вещи (однородные группы)", profileIdentifierType: "Инвентарный номер", typeFields: { "Инвентарный номер": "INV-12" }, collateralId: "COL-12" }), "INV-12");
  assert.equal(sandbox.profile({ typeLabel: "Прочие движимые вещи (однородные группы)", profileIdentifierType: "Номер карточки залога", suzNumber: "col-102026-012", typeFields: { "Инвентарный номер": "INV-12" }, collateralId: "COL-12" }), "col-102026-012");
  assert.equal(sandbox.profile({ typeLabel: "Прочие движимые вещи (однородные группы)", profileIdentifierType: "Номер карточки залога", subtype: "Животные", suzNumber: "col-102026-014", collateralId: "COL-014" }), "col-102026-014");
  assert.equal(sandbox.profile({ typeLabel: "Прочие движимые вещи (объекты)", profileIdentifierType: "Идентификационный признак (значение)", typeFields: { "Идентификационный признак (значение)": "SN-12" } }), "SN-12");
  assert.equal(sandbox.options("Животные").length, 2);
  assert.equal(sandbox.profile({ typeLabel: "Животные", profileIdentifierType: "Номер карточки залога", suzNumber: "col-102026-013", collateralId: "COL-12" }), "col-102026-013");
});

test("profile identifier option priority and labels match FT table 2.6", () => {
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  const sandbox = { COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога", LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы" };
  vm.runInNewContext(`${dateHelper}\n${profileSource}\nglobalThis.options = getNewCollateralProfileIdentifierOptions;`, sandbox);
  const labels = (type) => Array.from(sandbox.options(type), (option) => option.label);
  assert.deepEqual(labels("Оборудование"), ["Заводской номер", "Серийный номер", "Инвентарный номер", "Номер карточки залога"]);
  assert.deepEqual(labels("Транспортные средства, прицепы (полуприцепы)"), ["VIN", "Номер карточки залога"]);
  assert.deepEqual(labels("Железнодорожный подвижной состав"), ["Заводской номер", "Номер вагона", "Номер карточки залога"]);
  assert.deepEqual(labels("Прочие движимые вещи (однородные группы)"), ["Инвентарный номер", "Номер карточки залога"]);
  assert.deepEqual(labels("Прочие движимые вещи (объекты)"), ["Инвентарный номер", "Идентификационный признак (значение)", "Номер карточки залога"]);
  assert.equal(labels("Транспортные средства (самоходная техника)")[0], "Идентификационный номер ТС или СМ (VIN, PIN, заводской)");
});

test("profile ID input writes to the selected source and becomes read-only for card ID", () => {
  const fieldShell = extractBetween("function renderCollateralFieldShell(label, control", "function renderCollateralReadOnlyField(");
  const fieldRenderer = extractBetween(
  "function renderNewCollateralField(label, group, value, draft, options = [], { readOnly = false, wide = false, fieldClass = \"\", inputTypeOverride = \"\", derived = false } = {})",
    "function renderNewCollateralPrivateHouse"
  );
  const updateSource = extractBetween("function updateNewCollateralDraftField(fieldEl)", "function clearNewCollateralDraftValidationError");
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    state: { newCollateralDraft: { typeLabel: "Оборудование", profileIdentifierType: "Инвентарный номер", typeFields: {}, sharedFields: {}, basisDocument: {} } },
    escapeHtml: (value) => String(value ?? ""),
    getCollateralTypeCodeFromLabel: (value) => value,
    getNewCollateralSubtypeField: () => "",
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    getNewCollateralFieldGroups: () => ({ typeSpecific: [], shared: [], identity: [], address: [], pledgors: [] }),
    getCollateralEditableOptions: () => [],
    getCollateralEditableInputType: () => "text",
    getNewCollateralFieldMaxLength: () => 50,
    getNewCollateralValidationFieldError: () => "",
    isCollateralCheckboxField: () => false,
    isAffirmativeValue: () => false,
    getNewCollateralProfileIdentifier: () => "",
    clearNewCollateralDraftValidationError: () => {},
    refreshNewCollateralProfileIdentifier: () => {},
    renderCollateralFieldShell: null
  };
  vm.runInNewContext(`${dateHelper}\n${profileSource}\n${fieldShell}\n${fieldRenderer}\n${updateSource}\nglobalThis.renderField = renderNewCollateralField; globalThis.updateField = updateNewCollateralDraftField;`, sandbox);
  const draft = sandbox.state.newCollateralDraft;
  const editable = sandbox.renderField("Профильный идентификатор объекта", "identity", "", draft);
  assert.match(editable, /data-new-collateral-field="Профильный идентификатор объекта"/);
  assert.doesNotMatch(editable, /disabled/);
  sandbox.updateField({ dataset: { newCollateralGroup: "identity", newCollateralField: "Профильный идентификатор объекта" }, value: "INV-100", type: "text" });
  assert.equal(draft.typeFields["Инвентарный номер"], "INV-100");

  draft.profileIdentifierType = "Номер карточки залога";
  draft.typeLabel = "Животные";
  draft.collateralId = "";
  const systemId = sandbox.renderField("Профильный идентификатор объекта", "identity", "", draft);
  assert.match(systemId, /disabled aria-readonly="true"/);
  assert.match(systemId, /Сформируется автоматически/);
});

test("rights profile ID input writes only contract number and composes the date separately", () => {
  const updateSource = extractBetween("function updateNewCollateralDraftField(fieldEl)", "function clearNewCollateralDraftValidationError");
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  const draft = {
    typeLabel: "Имущественные права (требования)",
    profileIdentifierType: "Номер договора вместе с датой заключения договора",
    typeFields: { "Номер договора": "CON-12", "Дата заключения договора": "19.09.2026" },
    sharedFields: {}
  };
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    state: { newCollateralDraft: draft },
    clearNewCollateralDraftValidationError: () => {},
    refreshNewCollateralProfileIdentifier: () => {}
  };
  vm.runInNewContext(`${dateHelper}\n${profileSource}\n${updateSource}\nglobalThis.profile = getNewCollateralProfileIdentifier; globalThis.inputValue = getNewCollateralProfileInputValue; globalThis.update = updateNewCollateralDraftField;`, sandbox);
  assert.equal(sandbox.inputValue(draft), "CON-12");
  assert.equal(sandbox.profile(draft), "CON-12 от 19.09.2026");
  sandbox.update({
    dataset: { newCollateralGroup: "identity", newCollateralField: "Профильный идентификатор объекта" },
    value: "CON-13",
    type: "text"
  });
  assert.equal(draft.typeFields["Номер договора"], "CON-13");
  assert.equal(draft.typeFields["Дата заключения договора"], "19.09.2026");
  assert.equal(sandbox.profile(draft), "CON-13 от 19.09.2026");
});

test("collateral type is immutable for existing collateral edits", () => {
  const source = extractBetween("function isNewCollateralTypeEditable(draft, modal)", "function renderNewCollateralModal()");
  const sandbox = {};
  vm.runInNewContext(`${source}\nglobalThis.editable = isNewCollateralTypeEditable;`, sandbox);
  assert.equal(sandbox.editable({ typeLabel: "Оборудование", collateralId: "COL-01" }, { mode: "edit" }), false);
  assert.equal(sandbox.editable({ typeLabel: "Оборудование" }, { mode: "create" }), true);
  assert.match(appSource, /typeReadOnly \? ' disabled aria-disabled="true" title="Вид залога нельзя изменить при редактировании карточки"'/);
  assert.match(appSource, /!isNewCollateralTypeEditable\(draft, state\.modal\).*?Вид существующей карточки нельзя изменить при редактировании/s);
});

test("basis-document type options exist for every stage-1 collateral kind", () => {
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    uniqueItems: (values) => [...new Set(values)]
  };
  vm.runInNewContext(`${constantsSource}\n${profileSource}\nglobalThis.types = FT_COLLATERAL_TYPE_OPTIONS; globalThis.documentTypes = getNewCollateralBasisDocumentTypes;`, sandbox);
  assert.equal(sandbox.types.length, 12);
  for (const type of sandbox.types) {
    const values = Array.from(sandbox.documentTypes(type));
    assert.ok(values.length > 1, `No basis-document choices for ${type}`);
    assert.equal(values.includes("Иной документ-основание"), false);
  }
  assert.ok(Array.from(sandbox.documentTypes("Транспортные средства, прицепы (полуприцепы)")).includes("ЭПТС"));
  assert.ok(Array.from(sandbox.documentTypes("Железнодорожный подвижной состав")).includes("Технический паспорт вагона"));
});

test("empty FT dictionaries use text inputs, while populated dictionaries stay selectable", () => {
  const optionsSource = extractBetween("const COLLATERAL_TYPE_FIELD_OPTIONS = {", "function getUnifiedTaskType(type)");
  const helperSource = extractBetween("function getCollateralEditableOptions(collateral, group, label)", "function normalizeCollateralFieldControlValue(");
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    getCollateralTypeLabel: (item) => item.type,
    getCollateralSubtype: () => "",
    getCollateralUnitOptions: () => [],
    COLLATERAL_COMMON_FIELD_OPTIONS: {},
    COLLATERAL_ADDRESS_FIELD_OPTIONS: {}
  };
  vm.runInNewContext(`${optionsSource}\n${helperSource}\nglobalThis.getOptions = getCollateralEditableOptions;`, sandbox);
  assert.deepEqual(Array.from(sandbox.getOptions({ type: "Воздушные суда" }, "type", "Вид воздушного судна")), []);
  assert.deepEqual(Array.from(sandbox.getOptions({ type: "Плавучие сооружения" }, "type", "Группа")), []);
  assert.ok(Array.from(sandbox.getOptions({ type: "Оборудование" }, "type", "Группа")).length > 0);
});

test("existing profile identifiers include rights contract date and preserve individual railcar IDs", () => {
  const objectIdentifier = extractBetween("function getCollateralObjectIdentifier(collateral)", "function formatProfileIdentifierDate(value)");
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    getCollateralTypeLabel: (item) => item.type,
    getCollateralSuzNumber: (item) => item?.suzNumber || "col-102026-001",
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-"
  };
  vm.runInNewContext(`${dateHelper}\n${profileFieldValueSource}\n${objectIdentifier}\n${profileSource}\nglobalThis.identifier = getCollateralObjectIdentifier;`, sandbox);
  assert.equal(sandbox.identifier({ type: "Имущественные права (требования)", fields: { "Номер договора": "PR-410/26", "Дата заключения договора": "2026-02-14" } }), "PR-410/26 от 14.02.2026");
  assert.equal(sandbox.identifier({ id: "COL-058", type: "Имущественные права (требования)", fields: { "Номер договора": "PR-410/26", "Дата заключения договора": "2026-02-14" } }), "PR-410/26 от 14.02.2026");
  assert.equal(sandbox.identifier({ id: "COL-100", suzNumber: "col-102026-010", type: "Товары в обороте", fields: { "Инвентарный номер": "" } }), "col-102026-010");
  assert.equal(sandbox.identifier({ id: "COL-101", suzNumber: "col-102026-011", type: "Товары в обороте", groupIdentificationCode: "GRP-GRAIN-1" }), "col-102026-011");
  assert.equal(sandbox.identifier({ id: "COL-201", type: "Железнодорожный подвижной состав", groupIdentificationCode: "CONSIST-1", fields: { "Номер вагона": "W-201" } }), "W-201");
  assert.equal(sandbox.identifier({ id: "COL-202", type: "Прочие движимые вещи (однородные группы)", subtype: "Монеты, содержащие драгоценные металлы", profileIdentifierType: "Вид движимой вещи" }), "col-102026-001");
});

test("homogeneous-group profile identifier uses inventory number and falls back to SUZ number", () => {
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    normalizeCollateralSuzNumbers,
    resolveCollateralSubtype: (item) => item.subtype,
    getCollateralTypeLabel: (item) => item.type,
    getCollateralSuzNumber: (item) => item.suzNumber,
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-"
  };
  vm.runInNewContext(`${profileSource}\n${profileFieldValueSource}\n${collateralV7NormalizerSource}\nglobalThis.normalize = normalizeCollateralRecordsForFtV7;`, sandbox);
  const [withInventory, withoutInventory] = sandbox.normalize([{
    id: "COL-202",
    type: "Прочие движимые вещи (однородные группы)",
    subtype: "Монеты, содержащие драгоценные металлы",
    suzNumber: "col-112026-014",
    profileIdentifierType: "Вид движимой вещи",
    profileIdentifier: "Монеты, содержащие драгоценные металлы",
    fields: { "Инвентарный номер": "INV-GRP-202", "Вид движимой вещи": "Монеты, содержащие драгоценные металлы" }
  }, {
    id: "COL-203",
    type: "Прочие движимые вещи (однородные группы)",
    subtype: "Запасные части",
    suzNumber: "col-112026-015",
    profileIdentifierType: "Вид движимой вещи",
    profileIdentifier: "Запасные части",
    fields: { "Вид движимой вещи": "Запасные части" }
  }]);
  assert.equal(withInventory.profileIdentifierType, "Инвентарный номер");
  assert.equal(withInventory.profileIdentifier, "INV-GRP-202");
  assert.equal(withInventory.fields["Инвентарный номер"], "INV-GRP-202");
  assert.equal(withoutInventory.profileIdentifierType, "Номер карточки залога");
  assert.equal(withoutInventory.profileIdentifier, "col-112026-015");
});

test("duplicate rights are detected by contract number and normalized date", () => {
  const existing = {
    id: "COL-058",
    type: "Имущественные права (требования)",
    fields: { "Номер договора": "PR-410/26", "Дата заключения договора": "2026-02-14" }
  };
  const draft = {
    typeLabel: "Имущественные права (требования)",
    subtype: "Право требования по договору",
    name: "Требование по договору PR-410/26",
    profileIdentifierType: "Номер договора вместе с датой заключения договора",
    typeFields: { "Подвид": "Право требования по договору", "Номер договора": "PR-410/26", "Дата заключения договора": "14.02.2026" },
    sharedFields: { "Единица измерения": "Право (шт.)", "Параметры единицы измерения": "1", "Дополнительная информация": "Договор уступки" },
    addressFields: {},
    pledgors: []
  };
  const { create, toasts } = loadCollateralMutation(draft, [existing]);
  assert.equal(create(), null, "a duplicate must block object creation");
  assert.equal(toasts[0][0], "Профильный идентификатор уже используется");
  assert.match(toasts[0][1], /COL-058/);
  draft.typeFields["Дата заключения договора"] = "15.02.2026";
  const changedDate = loadCollateralMutation(draft, [existing]).create();
  assert.equal(changedDate.id, "COL-GENERATED-1", "a different contract date is a different profile identifier");
  assert.equal(changedDate.profileIdentifier, "PR-410/26 от 15.02.2026");
});

test("subtype selectors have FT values for all 12 stage-1 types", () => {
  const schemas = readCollateralSchemas();
  const sandbox = {
    FT_COLLATERAL_SUBTYPE_OPTIONS,
    FT_COLLATERAL_TYPE_OPTIONS: schemas.types,
    COLLATERAL_COMMON_FIELD_OPTIONS: {},
    getCollateralTypeLabel: (collateral) => collateral.type
  };
  vm.runInNewContext(`${typeOptionsSource}\n${extractBetween(
    "function getCollateralEditableOptions(collateral, group, label)",
    "function normalizeCollateralFieldControlValue(collateral, group, label, value, options = [])"
  )}\nglobalThis.options = COLLATERAL_TYPE_FIELD_OPTIONS;\nglobalThis.getOptions = getCollateralEditableOptions;`, sandbox);
  const labels = [
    "Объекты недвижимости",
    "Транспортные средства, прицепы (полуприцепы)",
    "Транспортные средства (самоходная техника)",
    "Оборудование",
    "Воздушные суда",
    "Плавучие сооружения",
    "Железнодорожный подвижной состав",
    "Животные",
    "Имущественные права (требования)",
    "Товары в обороте",
    "Прочие движимые вещи (однородные группы)",
    "Прочие движимые вещи (объекты)"
  ];
  const expectedSubtypes = {
    "Объекты недвижимости": ["Здания", "Сооружения", "Помещения", "Машино-место", "Объект незавершенного строительства", "Земельный участок", "Единый недвижимый комплекс", "Предприятие как имущественный комплекс", "Иное", "Квартира", "Право требования на квартиру", "Апартаменты", "Право требования на апартаменты", "Комната", "Доля", "Жилой дом", "Таунхаус"],
    "Транспортные средства, прицепы (полуприцепы)": ["Залог мотоцикла, мотороллера или другого мототранспортного средства", "Залог автотранспортного средства категории В", "Залог прицепа, полуприцепа", "Залог транспортных средств", "Залог железнодорожных вагонов"],
    "Транспортные средства (самоходная техника)": ["Залог транспортных средств (самоходная техника)", "Залог автотранспортного средства категории С, D"],
    "Оборудование": ["Машины и оборудование"],
    "Воздушные суда": ["Самолет", "Вертолет", "Иное"],
    "Плавучие сооружения": ["Суда используемые для перевозки пассажиров и их багажа", "Суда, используемые для перевозки грузов и (или) буксировки, а также хранения грузов", "Суда, используемые для рыболовства", "Суда, используемые для иных целей", "Плавучие сооружения, не являющиеся судами"],
    "Железнодорожный подвижной состав": ["Локомотив", "Самоходная единица специального железнодорожного подвижного состава", "Вагон моторвагонного подвижного состава", "Грузовой вагон", "Пассажирский вагон локомотивной тяги", "Вагон высокоскоростного железнодорожного подвижного состава", "Несамоходная единица специального железнодорожного подвижного состава"],
    "Животные": ["Сельскохозяйственные продуктивные животные (Основное стадо)", "Животные как “Товары в обороте” (Заменимые животные)", "Племенные животные"],
    "Имущественные права (требования)": ["Имущественные права", "Залог прав требования по объекту долевого строительства", "Залог прав требования", "Залог прав требования на денежные средства на счете (залоговый счет)", "Залог прав требований дебиторской задолженности"],
    "Товары в обороте": ["Сельскохозяйственная продукция (продукты растениеводства)", "Животные", "Продукты пищевые, напитки, изделия табачные", "Драгоценные металлы и драгоценные камни", "Ювелирные и другие изделия из драгоценных металлов и (или) драгоценных камней", "Строительные и отделочные материалы, металлопродукция", "Транспортные средства, оборудование, комплектующие и запасные части к ним", "Текстиль и изделия текстильные", "Топливно-энергетические ресурсы", "Вещества химические и продукты химические", "Средства лекарственные и материалы, применяемые в медицинских целях", "Иное"],
    "Прочие движимые вещи (однородные группы)": ["Животные", "Монеты, содержащие драгоценные металлы", "Иное"],
    "Прочие движимые вещи (объекты)": ["Животное, индивидуально определенное", "Монета, содержащие драгоценные металлы", "Предмет бытового использования"]
  };
  assert.deepEqual(FT_COLLATERAL_SUBTYPE_OPTIONS, expectedSubtypes);
  assert.deepEqual(Object.keys(FT_COLLATERAL_SUBTYPE_OPTIONS), labels);
  for (const type of labels) {
    const values = sandbox.getOptions({ type }, "type", "Подвид залога");
    assert.deepEqual(Array.from(values), FT_COLLATERAL_SUBTYPE_OPTIONS[type], `FT subtype values differ for ${type}`);
  }
});

test("manual add-form addresses stay blank instead of showing legacy sample fallbacks", () => {
  const schemas = readCollateralSchemas();
  const sandbox = {
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    ensureFilledValue: (value, fallback) => value == null || String(value).trim() === "" || String(value).trim() === "-" ? fallback : value,
    getCollateralAddressFieldFallback: (_collateral, field) => `sample:${field}`
  };
  vm.runInNewContext(`${addressAccessorSource}\nglobalThis.getAddressFields = getCollateralAddressFields;`, sandbox);
  const manual = sandbox.getAddressFields({ manualAddressEntry: true, addressFields: {} });
  const legacy = sandbox.getAddressFields({ addressFields: {} });
  assert.equal(manual["Адрес / место нахождения"], "");
  assert.equal(Object.hasOwn(manual, "ФИАС GUID"), false);
  assert.deepEqual(Object.keys(manual), ["Адрес / место нахождения", "Почтовый индекс", "Регион", "Район", "Населенный пункт", "Город", "Улица", "Дом", "Корпус", "Квартира"]);
  assert.equal(legacy["Адрес / место нахождения"], "sample:Адрес / место нахождения");
});

test("new collateral dialog follows numbered block order, collapses optional blocks, and places documents last", () => {
  const modalSource = extractBetween("function renderNewCollateralModal()", "function updateNewCollateralDraftField(fieldEl)");
  for (const heading of [
    "1. Идентификация объекта",
    "2. Характеристики объекта",
    "3. Документ-основание",
    "4. Адрес местонахождения",
    "5. Залогодатели",
    "6. Договоры залога"
  ]) assert.ok(modalSource.includes(heading), `Missing group heading ${heading}`);
  assert.doesNotMatch(modalSource, /Проведенный осмотр|Осмотр произведен|Контактное лицо для осмотра|new-collateral-inspection-section/);
  assert.doesNotMatch(modalSource, /Общие поля/);
  assert.match(appSource, /data-new-collateral-pledgor-field="name"/);
  assert.match(appSource, /data-action="add-new-collateral-pledgor"/);
  assert.match(modalSource, /renderDocumentWidget\(\{ context: "collateralDraft"/);
  assert.match(appSource, /type="file" multiple data-doc-file=/);
  assert.match(modalSource, /Вид профильного идентификатора/);
  assert.match(modalSource, /data-new-collateral-basis-details[^>]*\$\{draft\.basisDocumentExpanded \? "open" : ""\}/);
  assert.match(modalSource, /data-new-collateral-type-details[^>]*\$\{draft\.typeFieldsExpanded \? "open" : ""\}/);
  assert.match(modalSource, /new-collateral-collapse-icon/);
  assert.match(appSource, /data-new-collateral-profile-preview placeholder=/);
  for (const selector of ["data-new-collateral-basis-details", "data-new-collateral-type-details"]) {
    const start = modalSource.indexOf(selector);
    assert.ok(start >= 0 && !modalSource.slice(start, modalSource.indexOf(">", start) + 1).includes(" open"), `${selector} should be collapsed by default`);
  }
  const detailsStart = modalSource.indexOf("<details class=\"new-collateral-section new-collateral-disclosure new-collateral-type-details\"");
  const detailsEnd = modalSource.indexOf("</details>", detailsStart);
  const typeFieldsStart = modalSource.indexOf("getNewCollateralCharacteristicTypeFields(draft, groups)", detailsStart);
  const commonFieldsStart = modalSource.indexOf("characteristicCommonFields.map", detailsStart);
  assert.ok(detailsStart >= 0 && detailsEnd > detailsStart, "Characteristics must be a collapsible details block");
  assert.ok(typeFieldsStart > detailsStart && typeFieldsStart < commonFieldsStart && commonFieldsStart < detailsEnd, "Common characteristics must follow type-specific fields");
  const orderedBlocks = [
    "1. Идентификация объекта",
    "2. Характеристики объекта",
    "3. Документ-основание",
    "4. Адрес местонахождения",
    "5. Залогодатели",
    "6. Договоры залога",
    "new-collateral-documents"
  ].map((marker) => modalSource.indexOf(marker));
  assert.ok(orderedBlocks.every((position) => position >= 0));
  assert.deepEqual(orderedBlocks, orderedBlocks.slice().sort((a, b) => a - b));
  const identityStart = modalSource.indexOf("1. Идентификация объекта");
  const identityEnd = modalSource.indexOf("</fieldset>", identityStart);
  assert.doesNotMatch(modalSource.slice(identityStart, identityEnd), /Номер договора залога|Дата договора залога/);
  const contractStart = modalSource.indexOf("6. Договоры залога");
  const contractEnd = modalSource.indexOf("</fieldset>", contractStart);
  const contractSection = modalSource.slice(contractStart, contractEnd);
  assert.match(contractSection, /<th>Номер договора<\/th><th>Дата договора<\/th><th class="new-collateral-contract-actions-header"><\/th>/);
  assert.match(contractSection, /data-action="add-new-collateral-pledge-contract"/);
  assert.match(contractSection, /data-new-collateral-pledge-contract-field="number"/);
  assert.match(contractSection, /data-new-collateral-pledge-contract-field="date"/);
  assert.match(contractSection, /<td><input[^>]*data-new-collateral-pledge-contract-field="number"[^>]*><\/td>\s*<td><input type="date"[^>]*data-new-collateral-pledge-contract-field="date"[^>]*><\/td>\s*<td class="new-collateral-contract-actions"><button[^>]*data-action="remove-new-collateral-pledge-contract"/);
  assert.match(contractSection, /new-collateral-contracts-empty" colspan="3"/);
  assert.doesNotMatch(appSource, /data-new-collateral-main-details/);
  assert.doesNotMatch(modalSource, /1\. Идентификация и реквизиты договора|2\. Основная информация|4\. Поля по виду залога/);
  assert.match(styleSource, /\.new-collateral-modal \.collateral-characteristics-common-fields,\s*\.collateral-overview-view \.collateral-characteristics-common-fields\s*\{\s*grid-template-columns: minmax\(150px, 180px\) minmax\(185px, 230px\) minmax\(0, 1fr\)/);
  assert.match(styleSource, /\.new-collateral-modal \.collateral-characteristics-common-fields \.new-collateral-main-field-additional-info,[\s\S]*?grid-column: auto;/);
  assert.match(styleSource, /\.collateral-overview-view \.collateral-characteristics-type-fields,[\s\S]*?row-gap: 8px;/);
  assert.match(styleSource, /\.collateral-overview-basis-section h3\s*\{\s*margin: 5px 0 10px;/);
  assert.match(appSource, /application-preinspection-field application-preinspection-check new-collateral-checkbox-control/);
  for (const sample of ["ООО Нью Пласт", "EQ-2026-001", "Линия термопластавтоматов Haitian Mars II"]) {
    assert.equal(appSource.includes(sample), false, `Static sample remains in add form: ${sample}`);
  }
});

test("characteristics omit a field already selected as the profile identifier", () => {
  const helper = extractBetween("function getNewCollateralCharacteristicTypeFields", "function isNewCollateralModalTypeFieldApplicable");
  const sandbox = {
    FT_COLLATERAL_PROFILE_FIELDS_VISIBLE_IN_CHARACTERISTICS: new Set(),
    getNewCollateralProfileSource: () => ({ group: "type", field: "VIN" })
  };
  vm.runInNewContext(`${helper}\nglobalThis.pick = getNewCollateralCharacteristicTypeFields;`, sandbox);
  const labels = sandbox.pick({ typeLabel: "Транспортные средства", profileIdentifierType: "VIN" }, { typeSpecific: ["Марка", "VIN", "Модель"] });
  assert.deepEqual(Array.from(labels), ["Марка", "Модель"]);
  const propertyLabels = sandbox.pick({ typeLabel: "Объекты недвижимости", profileIdentifierType: "Кадастровый номер" }, { typeSpecific: ["Кадастровый номер", "Условный номер"] });
  assert.deepEqual(Array.from(propertyLabels), ["Кадастровый номер", "Условный номер"]);
});

test("pledge-contract rows can be added, edited and removed in the add/edit form", () => {
  const updateSource = extractBetween("function updateNewCollateralPledgeContractField(fieldEl)", "function renderImportCollateralsModal()");
  const sandbox = { state: { newCollateralDraft: { pledgeContracts: [{ number: "", date: "" }] } } };
  vm.runInNewContext(`${updateSource}\nglobalThis.add = addNewCollateralPledgeContractRow; globalThis.remove = removeNewCollateralPledgeContractRow; globalThis.update = updateNewCollateralPledgeContractField;`, sandbox);
  sandbox.update({ dataset: { index: "0", newCollateralPledgeContractField: "number" }, value: "ZL-01" });
  sandbox.update({ dataset: { index: "0", newCollateralPledgeContractField: "date" }, value: "2026-10-27" });
  sandbox.add();
  sandbox.update({ dataset: { index: "1", newCollateralPledgeContractField: "number" }, value: "ZL-02" });
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.state.newCollateralDraft.pledgeContracts)), [
    { number: "ZL-01", date: "2026-10-27" },
    { number: "ZL-02", date: "" }
  ]);
  sandbox.remove(0);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.state.newCollateralDraft.pledgeContracts)), [{ number: "ZL-02", date: "" }]);
});

test("new collateral submit button label follows its application, registry and edit context", () => {
  const modalSource = extractBetween("function renderNewCollateralModal()", "function updateNewCollateralDraftField(fieldEl)");
  assert.match(modalSource, /data-action="submit-new-collateral"[^>]*>\$\{isEditing \? "Сохранить изменения" : isRegistryContext \? "Добавить в реестр" : "Добавить объект"\}/);
  assert.doesNotMatch(modalSource, /Добавить в заявку/);
  assert.doesNotMatch(modalSource, /После сохранения объект будет добавлен в текущую заявку/);
  assert.match(modalSource, /После сохранения объект появится в реестре без привязки к заявке/);
  assert.match(modalSource, /идентификатор и связь с заявкой останутся прежними/);
  assert.match(modalSource, /\$\{hint\s*\?/);
});

test("collateral validation ignores inspection fields while preserving other rules", () => {
  const sandbox = {
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    getNewCollateralSubtypeField: () => "Подвид залога",
    getCollateralTypeCodeFromLabel: (label) => label,
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    isCollateralAddressApplicable: (label) => label !== "Имущественные права (требования)",
    isCollateralResidentialAddress: (collateral) => collateral.type === "Объекты недвижимости" && /жил|квартир|частн.*дом/i.test(`${collateral.fields?.["Подвид залога"] || ""} ${collateral.description || ""}`)
  };
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  vm.runInNewContext(`${dateHelper}\n${profileSource}\n${residentialHelperSource}\n${dateNormalizerSource}\n${maxLengthSource}\n${validationSource}\nglobalThis.validate = getNewCollateralDraftValidationError;`, sandbox);
  const validDraft = {
    typeLabel: "Оборудование",
    clientType: "ЮЛ",
    subtype: "Машины и оборудование",
    name: "Станок с ЧПУ",
    profileIdentifierType: "Заводской номер",
    typeFields: {
      "Заводской номер": "EQ-041",
      "Серийный номер": "SN-041",
      "Марка": "Техно",
      "Модель": "СЧПУ-4",
      "Инвентарный номер": "INV-041",
      "Год выпуска": "2022",
      "Группа": "Оборудование металлообрабатывающее"
    },
    sharedFields: { "Единица измерения": "Штука (шт.)", "Параметры единицы измерения": "1", "Дополнительная информация": "Состояние проверено", "Осмотр произведен": "Да" },
    addressFields: { "Адрес / место нахождения": "г. Новосибирск, ул. Станционная, 12" },
    pledgors: [{ name: "ООО Сибирь", idn: "5401234567", subjectType: "ЮЛ", role: "Залогодатель", subjectCode: "5401234567" }],
    pledgeContracts: [{ number: "", date: "" }]
  };

  assert.equal(sandbox.validate(validDraft), null);
  const vehicleDraft = {
    ...validDraft,
    typeLabel: "Транспортные средства, прицепы (полуприцепы)",
    subtype: "Залог автотранспортного средства категории В",
    profileIdentifierType: "VIN",
    typeFields: { "Идентификационный номер транспортного средства (VIN)": "WVWZZZ1JZXW000001" }
  };
  assert.equal(sandbox.validate(vehicleDraft), null, "optional vehicle characteristics must not block save");
  const vehicleMissingProfile = { ...vehicleDraft, typeFields: {} };
  assert.equal(sandbox.validate(vehicleMissingProfile).field, "Профильный идентификатор объекта");
  assert.equal(sandbox.validate({ ...vehicleMissingProfile, profileIdentifierType: "Номер карточки залога" }), null, "system identifier supports vehicles without a natural ID");
  const requiredFieldSource = extractBetween("function isNewCollateralRequiredTypeField", "function normalizeNewCollateralDate(value)");
  const requiredSandbox = {};
  vm.runInNewContext(`${requiredFieldSource}\nglobalThis.required = isNewCollateralRequiredTypeField;`, requiredSandbox);
  assert.equal(requiredSandbox.required("Транспортные средства, прицепы (полуприцепы)", "Мощность двигателя, л.с."), false);
  assert.equal(requiredSandbox.required("Оборудование", "Серийный номер"), true);
  const noInspectionData = sandbox.validate({ ...validDraft, sharedFields: { ...validDraft.sharedFields, "Осмотр произведен": "Нет", "Контактное лицо для осмотра": "" } });
  assert.equal(noInspectionData, null, "inspection data must not gate collateral saving");
  assert.equal(sandbox.validate({ ...validDraft, sharedFields: { ...validDraft.sharedFields, "Осмотр произведен": "Нет", "Контактное лицо для осмотра": "Мария Петрова, +7 913 555-24-18" } }), null);
  assert.equal(sandbox.validate({ ...validDraft, sharedFields: { ...validDraft.sharedFields, "Дополнительная информация": "" } }).field, "Дополнительная информация");
  assert.equal(sandbox.validate({ ...validDraft, subtype: "" }).field, "Подвид залога");
  assert.equal(sandbox.validate({ ...validDraft, name: "" }).field, "Наименование");
  assert.equal(sandbox.validate({ ...validDraft, name: "x".repeat(51) }).field, "Наименование");
  assert.equal(sandbox.validate({ ...validDraft, typeFields: { ...validDraft.typeFields, "Дата ввода в эксплуатацию": "19.09.2026" } }), null);
  assert.equal(sandbox.validate({ ...validDraft, typeFields: { ...validDraft.typeFields, "Дата ввода в эксплуатацию": "2026-09-19" } }).field, "Дата ввода в эксплуатацию");
  assert.equal(sandbox.validate({ ...validDraft, typeFields: { ...validDraft.typeFields, "Дата ввода в эксплуатацию": "31.02.2026" } }).field, "Дата ввода в эксплуатацию");
  assert.equal(sandbox.validate({ ...validDraft, profileIdentifierType: "" }).field, "Вид профильного идентификатора");
  assert.equal(sandbox.validate({ ...validDraft, typeFields: { "Заводской номер": "" } }).field, "Профильный идентификатор объекта");
  assert.equal(sandbox.validate({ ...validDraft, sharedFields: { ...validDraft.sharedFields, "Дополнительная информация": "x".repeat(256) } }).field, "Дополнительная информация");
  assert.equal(sandbox.validate({ ...validDraft, pledgors: [{ ...validDraft.pledgors[0], idn: "12x" }] }).field, "idn");
  assert.equal(sandbox.validate({ ...validDraft, pledgors: [{ ...validDraft.pledgors[0], name: "x".repeat(51) }] }).field, "name");
  assert.equal(sandbox.validate({ ...validDraft, pledgors: [{ share: "", name: "", idn: "", subjectType: "", role: "Залогодатель", subjectCode: "" }] }).field, "name");
  assert.equal(sandbox.validate({ ...validDraft, pledgors: [{ share: "", name: "ООО Сибирь", idn: "", subjectType: "", role: "Залогодатель", subjectCode: "" }] }).field, "idn");

  assert.equal(sandbox.validate({ ...validDraft, addressFields: {} }).field, "Адрес / место нахождения");
  const partialAddress = { ...validDraft, addressFields: { manualEntry: "Да", "Адрес / место нахождения": "г. Новосибирск", "Регион": "Новосибирская область" } };
  assert.equal(sandbox.validate(partialAddress).field, "Дом");
  const completeAddress = {
    ...partialAddress,
    addressFields: {
      "Адрес / место нахождения": "Новосибирская область, г. Новосибирск, ул. Ленина, д. 10",
      manualEntry: "Да",
      "Регион": "Новосибирская область",
      "Город": "Новосибирск",
      "Дом": "10"
    }
  };
  assert.equal(sandbox.validate(completeAddress), null);
  assert.equal(sandbox.validate({ ...completeAddress, addressFields: { "Адрес / место нахождения": "Новосибирская область, г. Новосибирск, д. 10", "Регион": "Новосибирская область", "Город": "Новосибирск", "Дом": "10" } }), null);
  assert.equal(sandbox.validate({ ...validDraft, addressFields: { manualEntry: "Да", "Адрес / место нахождения": "г. Новосибирск", "Почтовый индекс": "630099" } }).field, "Регион");
  const invalidAddress = (field, value) => ({ ...completeAddress, addressFields: { ...completeAddress.addressFields, [field]: value } });
  assert.equal(sandbox.validate(invalidAddress("Почтовый индекс", "6300A1")).field, "Почтовый индекс");
  assert.equal(sandbox.validate(invalidAddress("Квартира", "12/3")).field, "Квартира");
  const rightsDraft = {
    ...validDraft,
    typeLabel: "Имущественные права (требования)",
    profileIdentifierType: "Номер договора вместе с датой заключения договора",
    typeFields: { "Номер договора": "CON-1", "Дата заключения договора": "19.09.2026" },
    addressFields: {}
  };
  assert.equal(sandbox.validate(rightsDraft), null, "rights do not require an address");
  assert.equal(sandbox.validate({ ...rightsDraft, typeFields: { "Номер договора": "CON-1" } }).field, "Дата заключения договора", "the chosen composite identifier requires its contract date");
  assert.equal(sandbox.validate({ ...rightsDraft, typeFields: {} }).field, "Дата заключения договора");

  const residentialDraft = {
    ...validDraft,
    typeLabel: "Объекты недвижимости",
    profileIdentifierType: "Кадастровый номер",
    subtype: "Помещения",
    name: "Квартира 2-комнатная",
    typeFields: { "Подвид залога": "Помещения", "Кадастровый номер": "54:35:000000:123" },
    addressFields: { ...completeAddress.addressFields, "Адрес / место нахождения": "Новосибирск, ул. Ленина, д. 5", manualEntry: "Да" }
  };
  assert.equal(sandbox.validate(residentialDraft).field, "Частный дом");
  assert.equal(sandbox.validate({ ...residentialDraft, addressFields: { ...residentialDraft.addressFields, "Частный дом": "Да" } }), null);
  assert.equal(sandbox.validate({ ...residentialDraft, addressFields: { ...residentialDraft.addressFields, "Квартира": "15" } }), null);
});

test("inspection fields are not checked by the collateral validation-error handler", () => {
  const clearSource = extractBetween("function clearNewCollateralDraftValidationError(draft, fieldEl, group, field, index)", "function updateNewCollateralPledgorField(fieldEl)");
  assert.doesNotMatch(clearSource, /inspection-either|Осмотр произведен|Контактное лицо для осмотра/);
});

test("application context pre-fills first pledgor while registry context starts empty", () => {
  const schemas = readCollateralSchemas();
  const source = extractBetween(
    "function createNewCollateralDraft(context = \"registry\", collateral = null)",
    "function openNewCollateralModal(context = \"registry\""
  );
  const sandbox = {
    state: { newTask: { dealClientName: "ООО Сибирь", dealClientInn: "5401234567" }, data: { collaterals: [] } },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    getCollateralSuzNumber: (item) => item?.suzNumber || "",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-"
  };
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  sandbox.formatNewCollateralDateInput = (value) => value;
  vm.runInNewContext(`${dateHelper}\n${dateNormalizerSource}\n${profileSource}\n${basisDocumentSource}\n${source}\nglobalThis.createDraft = createNewCollateralDraft;`, sandbox);
  const applicationDraft = sandbox.createDraft("applicationCreate");
  const registryDraft = sandbox.createDraft("registry");
  assert.equal(applicationDraft.pledgors[0].name, "ООО Сибирь");
  assert.equal(applicationDraft.pledgors[0].idn, "5401234567");
  assert.equal(applicationDraft.pledgors[0].subjectType, "ЮЛ");
  assert.equal(applicationDraft.clientName, "ООО Сибирь");
  assert.equal(applicationDraft.clientId, "5401234567");
  assert.equal(registryDraft.pledgors[0].name, "");
  assert.equal(registryDraft.pledgors[0].idn, "");
});

test("optional type-specific fields start collapsed for edits, including composite profile identifiers", () => {
  const schemas = readCollateralSchemas();
  const source = extractBetween(
    "function createNewCollateralDraft(context = \"registry\", collateral = null)",
    "function openNewCollateralModal(context = \"registry\""
  );
  const fieldShell = extractBetween("function renderCollateralFieldShell(label, control", "function renderCollateralReadOnlyField(");
  const fieldRenderer = extractBetween(
    "function renderNewCollateralField(label, group, value, draft, options = [], { readOnly = false, wide = false, fieldClass = \"\", inputTypeOverride = \"\", derived = false } = {})",
    "function renderNewCollateralPrivateHouse"
  );
  const sandbox = {
    state: { newTask: {}, data: { collaterals: [] } },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    getCollateralSuzNumber: (item) => item?.suzNumber || "",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    getCollateralTypeLabel: (item) => item.type,
    getCollateralClientType: (item) => item?.clientType || "",
    getCollateralSubtype: resolveCollateralSubtype,
    getCollateralName: (item) => item.name,
    getCollateralTypeSpecificFields: (item) => item.fields || item.typeFields || {},
    getCollateralClientType: (item) => item?.clientType || "",
    getCollateralBasisDocument: () => ({ type: "", date: "", series: "", number: "" }),
    getNewCollateralProfileIdentifierType: (item) => item.profileIdentifierType,
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    getCollateralCadastralFlag: (item) => item.hasCadastralNumber === true ? "Да" : item.hasCadastralNumber === false ? "Нет" : "",
    getCollateralUnitDefault: () => "Право требования",
    escapeHtml: (value) => String(value ?? ""),
    getCollateralTypeCodeFromLabel: (value) => value,
    getCollateralEditableOptions: (item, group, label) => group === "identity" && label === "Подвид залога" ? FT_COLLATERAL_SUBTYPE_OPTIONS[item.type] || [] : [],
    getNewCollateralSubtypeField: () => "Подвид залога",
    getNewCollateralFieldMaxLength: () => 0,
    getNewCollateralValidationFieldError: () => "",
    getCollateralEditableInputType: () => "text",
    isCollateralCheckboxField: () => false
  };
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  vm.runInNewContext(`${dateHelper}\n${dateNormalizerSource}\n${profileSource}\n${fieldShell}\n${fieldRenderer}\n${source}\nglobalThis.createDraft = createNewCollateralDraft; globalThis.renderField = renderNewCollateralField;`, sandbox);
  const rightsDraft = sandbox.createDraft("applicationCreate", {
    id: "COL-RIGHTS",
    type: "Имущественные права (требования)",
    name: "Требование по договору поставки",
    profileIdentifierType: "Номер договора вместе с датой заключения договора",
    profileIdentifier: "CON-15 от 19.09.2026",
    fields: { "Номер договора": "CON-15", "Дата заключения договора": "2026-09-19" }
  });
  const equipmentDraft = sandbox.createDraft("applicationCreate", {
    id: "COL-EQUIPMENT",
    type: "Оборудование",
    name: "Станок",
    profileIdentifierType: "Заводской номер",
    profileIdentifier: "EQ-15",
    fields: { "Заводской номер": "EQ-15" }
  });
  assert.equal(rightsDraft.typeFieldsExpanded, false);
  assert.equal(rightsDraft.typeFields["Дата заключения договора"], "19.09.2026");
  assert.equal(equipmentDraft.typeFieldsExpanded, false);
  const propertyDraft = sandbox.createDraft("applicationCreate", {
    id: "COL-PROPERTY",
    type: "Объекты недвижимости",
    name: "Помещение",
    profileIdentifierType: "Кадастровый номер",
    profileIdentifier: "col-102026-001",
    fields: { "Кадастровый номер": "54:35:000000:15", "Условный номер": "УС-15" }
  });
  assert.equal(propertyDraft.typeFieldsExpanded, false);
  assert.equal(Object.hasOwn(propertyDraft.typeFields, "Кадастровый номер есть"), false);
  assert.equal(propertyDraft.typeFields["Кадастровый номер"], "54:35:000000:15");
  assert.equal(propertyDraft.typeFields["Условный номер"], "УС-15");

  const legacyEnterpriseDraft = sandbox.createDraft("applicationCreate", {
    id: "COL-OLD-ENTERPRISE",
    type: "Объекты недвижимости",
    name: "Предприятие как имущественный комплекс",
    profileIdentifierType: "Номер карточки залога",
    profileIdentifier: "COL-OLD-ENTERPRISE",
    typeFields: { "Подвид залога": "Имущественный комплекс" }
  });
  assert.equal(legacyEnterpriseDraft.subtype, "Предприятие как имущественный комплекс");
  const subtypeSelect = sandbox.renderField(
    "Подвид залога",
    "identity",
    legacyEnterpriseDraft.subtype,
    legacyEnterpriseDraft,
    FT_COLLATERAL_SUBTYPE_OPTIONS[legacyEnterpriseDraft.typeLabel]
  );
  assert.match(subtypeSelect, /<option value="Предприятие как имущественный комплекс" selected>/);
  assert.doesNotMatch(subtypeSelect, /<option value="Имущественный комплекс"/);
});

test("changing collateral type keeps shared basis-document values visible in the new form", () => {
  const fieldShell = extractBetween("function renderCollateralFieldShell(label, control", "function renderCollateralReadOnlyField(");
  const fieldRenderer = extractBetween(
    "function renderNewCollateralField(label, group, value, draft, options = [], { readOnly = false, wide = false, fieldClass = \"\", inputTypeOverride = \"\", derived = false } = {})",
    "function renderNewCollateralPrivateHouse"
  );
  const sandbox = {
    escapeHtml: (value) => String(value ?? ""),
    getCollateralTypeCodeFromLabel: (value) => value,
    getCollateralEditableOptions: () => ["Акт приема-передачи", "Иной документ-основание"],
    getCollateralEditableInputType: () => "text",
    getNewCollateralFieldMaxLength: () => 50,
    getNewCollateralValidationFieldError: () => "",
    isCollateralCheckboxField: () => false,
    isAffirmativeValue: () => false
  };
  vm.runInNewContext(`${fieldShell}\n${fieldRenderer}\nglobalThis.renderField = renderNewCollateralField;`, sandbox);
  const draft = {
    typeLabel: "Воздушные суда",
    typeFields: {},
    addressFields: {},
    basisDocument: { type: "Договор купли-продажи", date: "01.10.2026", series: "АБ", number: "12345" }
  };
  const typeField = sandbox.renderField("Тип документа", "basisDocument", draft.basisDocument.type, draft);
  const dateField = sandbox.renderField("Дата", "basisDocument", draft.basisDocument.date, draft);
  const seriesField = sandbox.renderField("Серия", "basisDocument", draft.basisDocument.series, draft);
  const numberField = sandbox.renderField("Номер", "basisDocument", draft.basisDocument.number, draft);
  assert.match(typeField, /option value="Договор купли-продажи" selected/);
  assert.match(typeField, /option value="Акт приема-передачи"/);
  assert.match(dateField, /value="01\.10\.2026"/);
  assert.match(seriesField, /value="АБ"/);
  assert.match(numberField, /value="12345"/);
  const typeChangeHandler = extractBetween("const newCollateralType = event.target.closest(\"[data-new-collateral-type]\")", "\n  const newCollateralIdentifierType");
  assert.doesNotMatch(typeChangeHandler, /draft\.basisDocument\s*=/);
});

test("submit links a newly added collateral only in application context", () => {
  const source = extractBetween(
    "function submitNewCollateral()",
    "function submitImportCollaterals()"
  );
  for (const context of ["applicationCreate", "registry"]) {
    const sandbox = {
      state: {
        modal: { context },
        data: { collaterals: [] },
        newTask: { selectedCollateralIds: [] },
        taskActiveCollateral: {}
      },
      createDraftCollateralFromForm: () => ({ id: "COL-NEW", name: "Станок" }),
      hydrateNewTaskContextFromSelectedCollaterals: () => {},
      persistTaskState: () => {},
      addToast: () => {},
      window: { location: { hash: "" } }
    };
    vm.runInNewContext(`${source}\nglobalThis.submit = submitNewCollateral;`, sandbox);
    sandbox.submit();
    assert.equal(sandbox.state.data.collaterals.length, 1);
    if (context === "applicationCreate") {
      assert.deepEqual(Array.from(sandbox.state.newTask.selectedCollateralIds), ["COL-NEW"]);
      assert.equal(sandbox.state.taskActiveCollateral["new-task-draft"], "COL-NEW");
    } else {
      assert.deepEqual(Array.from(sandbox.state.newTask.selectedCollateralIds), []);
      assert.equal(sandbox.window.location.hash, "/app/collaterals/COL-NEW");
    }
  }
});

test("saving the add form maps every group into the new collateral record", () => {
  const schemas = readCollateralSchemas();
  const createFunction = extractBetween(
    "function createDraftCollateralFromForm()",
    "function normalizeProfileIdentifier(value ="
  );
  const profileHelper = profileSource;
  const validator = validationSource;
  const draft = {
    typeLabel: "Оборудование",
    clientType: "ЮЛ",
    subtype: "Машины и оборудование",
    name: "Станок с ЧПУ",
    profileIdentifier: "EQ-041",
    profileIdentifierType: "Заводской номер",
    typeFields: {
      "Заводской номер": "EQ-041",
      "Серийный номер": "SN-041",
      "Марка": "Техно",
      "Модель": "СЧПУ-4",
      "Инвентарный номер": "INV-041",
      "Год выпуска": "2021",
      "Группа": "Оборудование металлообрабатывающее",
      "Дата ввода в эксплуатацию": "19.09.2021"
    },
    basisDocument: { type: "Договор поставки", date: "19.09.2026", series: "", number: "SP-77/26" },
    sharedFields: {
      "Единица измерения": "Штука (шт.)",
      "Параметры единицы измерения": "1,000",
      "Дополнительная информация": "Проверена комплектность",
      "Осмотр произведен": "Да"
    },
    pledgeContracts: [
      { number: "ZL-26/041-1", date: "2026-09-19", amount: 760000000, currency: "RUB", product: "Кредит", linkedContract: "CTR-26/041" },
      { number: "zl-26/041-1", date: "19.09.2026", product: "Кредит" },
      { number: "ZL-26/041-1", date: "2026-09-20" },
      { number: "", date: "2026-09-21" },
      { number: "", date: "21.09.2026" },
      { number: "", date: "" }
    ],
    addressFields: {
      manualEntry: "Да",
      "Адрес / место нахождения": "Новосибирская область, г. Новосибирск, ул. Станционная, 12",
      "Регион": "Новосибирская область",
      "Город": "Новосибирск",
      "Дом": "12"
    },
    pledgors: [
      { share: "3/5", name: "ООО Сибирь", idn: "5401234567", subjectType: "ЮЛ", role: "Залогодатель", subjectCode: "5401234567" },
      { share: "2/5", name: "Иванов Иван Иванович", idn: "540123456789", subjectType: "ФЛ", role: "Залогодатель", subjectCode: "540123456789" }
    ],
    documents: [{ name: "Паспорт оборудования.pdf" }, { name: "Акт приема-передачи.pdf" }]
  };
  const sandbox = {
    state: { newCollateralDraft: draft, modal: { context: "applicationCreate" }, data: { collaterals: [] } },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    FT_COLLATERAL_TYPE_LABELS: { Недвижимость: "Объекты недвижимости", Автотранспорт: "Транспортные средства, прицепы (полуприцепы)" },
    COLLATERAL_LEGACY_TYPE_FIELDS: ["Тип обеспечения", "Единица измерения", "Параметры единицы измерения", "Дополнительная информация"],
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    getNextCollateralId: () => "COL-999",
    getCollateralSuzNumber: (item) => item?.suzNumber || "",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    getNewCollateralSubtypeField: () => "Подвид залога",
    getCollateralTypeCodeFromLabel: (label) => label,
    getCollateralTypeLabel: (item) => item.type,
    getCollateralClientType: (item) => item?.clientType || "",
    isCollateralResidentialAddress: () => false,
    getNewCollateralPrimaryIdentifierField: () => "Заводской номер",
    getCollateralTypeDisplayFieldLabels: (label) => schemas.typeFields[label] || [],
    isCollateralAddressApplicable: () => true,
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    groupsAddressFields: (_type, values) => Object.fromEntries(schemas.address.map((field) => [field, values[field] || ""])),
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    getCollateralObjectIdentifier: (item) => item.profileIdentifier || item.id,
    normalizeProfileIdentifier: (value) => String(value || "").replace(/\s+/g, "").toLowerCase(),
    formatTaskHistoryDate: () => "23.10.2026 12:00",
    getRole: () => ({ user: "Иванова Анна Сергеевна" }),
    addToast: () => {}
  };
  sandbox.getNewCollateralSubtypeField = () => "Подвид залога";
  vm.runInNewContext(`${v6FieldApplicabilitySource}\n${profileHelper}\n${residentialHelperSource}\n${dateNormalizerSource}\n${maxLengthSource}\n${validator}\n${createFunction}\nglobalThis.createCollateral = createDraftCollateralFromForm;`, sandbox);
  const collateral = sandbox.createCollateral();

  assert.equal(collateral.id, "COL-999");
  assert.equal(collateral.createdAt, "23.10.2026 12:00");
  assert.equal(collateral.name, "Станок с ЧПУ");
  assert.equal(collateral.profileIdentifier, "EQ-041");
  assert.equal(collateral.fields["Заводской номер"], "EQ-041");
  assert.equal(collateral.fields["Инвентарный номер"], "INV-041");
  assert.equal(collateral.fields["Дата ввода в эксплуатацию"], "2021-09-19");
  assert.deepEqual(JSON.parse(JSON.stringify(collateral.basisDocument)), { type: "Договор поставки", date: "2026-09-19", series: "", number: "SP-77/26", status: "" });
  assert.equal(Object.hasOwn(collateral.fields, "Тип документа"), false);
  assert.equal(collateral.ftMainInfo["Единица измерения"], "Штука (шт.)");
  assert.equal(collateral.ftMainInfo["Значение, в указанных ед.изм."], "1,000");
  assert.equal(Object.hasOwn(collateral.ftMainInfo, "Параметры единицы измерения"), false);
  assert.equal(Object.hasOwn(collateral.fields, "Единица измерения"), false);
  assert.equal(collateral.absId, "");
  assert.equal(collateral.ftMainInfo["Дополнительная информация"], "Проверена комплектность");
  assert.equal(collateral.ftMainInfo["Осмотр произведен"], "Да");
  assert.equal(collateral.pledgeContractNumber, "ZL-26/041-1");
  assert.equal(collateral.pledgeContractDate, "2026-09-19");
  assert.deepEqual(JSON.parse(JSON.stringify(collateral.pledgeContracts)), [
    { number: "ZL-26/041-1", date: "2026-09-19", amount: 760000000, currency: "RUB", product: "Кредит", linkedContract: "CTR-26/041" },
    { number: "ZL-26/041-1", date: "2026-09-20" },
    { number: "", date: "2026-09-21" }
  ]);
  assert.equal(Object.hasOwn(collateral.ftMainInfo, "Признак группы залога"), false);
  assert.equal(collateral.groupIdentificationCode, "");
  assert.equal(Object.hasOwn(collateral.addressFields, "ФИАС GUID"), false);
  assert.equal(collateral.addressFields.manualEntry, "Да");
  assert.equal(collateral.addressFields["Частный дом"], "Нет");
  assert.equal(collateral.manualAddressEntry, true);
  assert.equal(collateral.pledgors.length, 2);
  assert.deepEqual(Array.from(collateral.documents, (item) => item.name), ["Паспорт оборудования.pdf", "Акт приема-передачи.pdf"]);
});

test("saving a property uses the cadastral profile ID and preserves the conditional number", () => {
  const draft = {
    typeLabel: "Объекты недвижимости",
    subtype: "Помещения",
    name: "Квартира на Красном проспекте",
    profileIdentifierType: "Кадастровый номер",
    typeFields: {
      "Кадастровый номер": "54:35:000000:15",
      "Условный номер": "УС-15"
    },
    basisDocument: { type: "Выписка ЕГРН", date: "", series: "", number: "" },
    sharedFields: { "Единица измерения": "Квадратный метр (м²)", "Значение, в указанных ед.изм.": "82.4" },
    addressFields: { "Адрес / место нахождения": "г. Новосибирск, Красный проспект, 15" },
    pledgors: [{ name: "ООО Сибирь", idn: "5401234567", subjectType: "ЮЛ", role: "Залогодатель" }],
    documents: []
  };
  const { create } = loadCollateralMutation(draft);
  const saved = create();
  assert.equal(saved.profileIdentifier, "54:35:000000:15");
  assert.equal(Object.hasOwn(saved.fields, "Кадастровый номер есть"), false);
  assert.equal(saved.fields["Кадастровый номер"], "54:35:000000:15");
  assert.equal(saved.fields["Условный номер"], "УС-15");
});

test("duplicate checks use the selected profile ID independently of group markers", () => {
  const schemas = readCollateralSchemas();
  const createFunction = extractBetween(
    "function createDraftCollateralFromForm()",
    "function normalizeProfileIdentifier(value ="
  );
  const draft = {
    typeLabel: "Оборудование",
    profileIdentifierType: "Заводской номер",
    subtype: "Машины и оборудование",
    name: "Станок 1",
    typeFields: { "Заводской номер": "EQ-001" },
    sharedFields: { "Единица измерения": "Штука (шт.)", "Параметры единицы измерения": "1", "Дополнительная информация": "Оборудование" },
    addressFields: {}, pledgors: [], documentFiles: []
  };
  const sandbox = {
    state: {
      newCollateralDraft: draft,
      modal: { context: "registry" },
      data: { collaterals: [{ id: "COL-001", type: "Оборудование", profileIdentifier: "EQ-001", fields: { "Заводской номер": "EQ-001" } }] }
    },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    COLLATERAL_LEGACY_TYPE_FIELDS: ["Единица измерения", "Значение, в указанных ед.изм.", "Дополнительная информация"],
    COLLATERAL_ADDRESS_FIELDS: [],
    getNewCollateralSubtypeField: (typeLabel) => (schemas.typeFields[typeLabel] || []).find((field) => ["Подвид залога", "Подвид", "Подтип"].includes(field)) || "",
    getCollateralTypeCodeFromLabel: (value) => value,
    getCollateralTypeLabel: (item) => item.type,
    getCollateralClientType: (item) => item?.clientType || "",
    getCollateralTypeDisplayFieldLabels: (typeLabel) => schemas.typeFields[typeLabel] || [],
    getNextCollateralId: () => "COL-002",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    getCollateralSuzNumber: (item) => item?.suzNumber || item?.collateralNumber || "",
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isCollateralAddressApplicable: () => true,
    groupsAddressFields: () => ({}),
    normalizeProfileIdentifier: (value) => String(value || "").replace(/\s+/g, "").toLowerCase(),
    getCollateralObjectIdentifier: null,
    getCollateralUnitDefault: () => "Штука (шт.)",
    COLLATERAL_ADDRESS_FIELDS: [],
    formatTaskHistoryDate: () => "23.10.2026 12:00",
    getRole: () => ({ user: "Иванова Анна Сергеевна" }),
    addToast: () => {}
  };
  const profileFields = profileSource;
  const objectIdentifier = extractBetween("function getCollateralObjectIdentifier(collateral)", "function formatProfileIdentifierDate(value)");
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  sandbox.getNewCollateralDraftValidationError = () => null;
  vm.runInNewContext(`${v6FieldApplicabilitySource}\n${dateHelper}\n${profileFieldValueSource}\n${objectIdentifier}\n${profileFields}\n${dateNormalizerSource}\n${maxLengthSource}\n${createFunction}\nglobalThis.createCollateral = createDraftCollateralFromForm;`, sandbox);
  const collateral = sandbox.createCollateral();
  assert.equal(collateral, null, "same profile ID must block duplicate creation");
  assert.equal(sandbox.state.data.collaterals.length, 1);

  sandbox.state.newCollateralDraft = {
    typeLabel: "Железнодорожный подвижной состав",
    profileIdentifierType: "Номер вагона",
    subtype: "Вагон грузовой",
    name: "Вагон 2",
    typeFields: { "Подвид": "Вагон грузовой", "Номер вагона": "W-002" },
    sharedFields: { "Единица измерения": "Штука (шт.)", "Параметры единицы измерения": "1", "Дополнительная информация": "Вагон состава" },
    addressFields: {},
    pledgors: []
  };
  sandbox.state.data.collaterals = [{ id: "COL-W-001", type: "Железнодорожный подвижной состав", profileIdentifier: "W-001", groupIdentificationCode: "CONSIST-1", fields: { "Номер вагона": "W-001" } }];
  sandbox.getNextCollateralId = () => "COL-W-002";
  const railcar = sandbox.createCollateral();
  assert.equal(railcar.id, "COL-W-002");
  assert.equal(railcar.profileIdentifier, "W-002");
});

test("goods in circulation without a group code use the generated card ID", () => {
  const schemas = readCollateralSchemas();
  const createFunction = extractBetween("function createDraftCollateralFromForm()", "function normalizeProfileIdentifier(value =");
  const draft = {
    typeLabel: "Товары в обороте",
    profileIdentifierType: "Номер карточки залога",
    subtype: "Сырье и материалы",
    name: "Остатки зерна на складе",
    typeFields: { "Подвид": "Сырье и материалы", "Вид товара в обороте": "Зерно" },
    sharedFields: { "Единица измерения": "Тонна (т)", "Параметры единицы измерения": "120", "Дополнительная информация": "Остатки на дату заявки" },
    addressFields: {},
    pledgors: []
  };
  const sandbox = {
    state: { newCollateralDraft: draft, modal: { context: "applicationCreate" }, data: { collaterals: [] } },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    COLLATERAL_LEGACY_TYPE_FIELDS: ["Тип обеспечения", "Единица измерения", "Параметры единицы измерения", "Дополнительная информация"],
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    getNextCollateralId: () => "COL-GOODS-01",
    getCollateralSuzNumber: (item) => item?.suzNumber || "",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    getNewCollateralSubtypeField: (typeLabel) => (schemas.typeFields[typeLabel] || []).find((field) => ["Подвид залога", "Подвид", "Подтип"].includes(field)) || "",
    getCollateralTypeCodeFromLabel: (label) => label,
    getCollateralTypeLabel: (item) => item.type,
    getCollateralClientType: (item) => item?.clientType || "",
    getCollateralTypeDisplayFieldLabels: (label) => schemas.typeFields[label] || [],
    getNewCollateralDraftValidationError: () => null,
    getNewCollateralFieldMaxLength: () => 0,
    getCollateralObjectIdentifier: (item) => item.profileIdentifier || item.id,
    normalizeProfileIdentifier: (value) => String(value || "").replace(/\\s+/g, "").toLowerCase(),
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isCollateralAddressApplicable: () => true,
    groupsAddressFields: () => ({}),
    isAffirmativeValue: (value) => ["Да", true, 1].includes(value),
    getRole: () => ({ user: "Анна Иванова" }),
    formatTaskHistoryDate: () => "23.10.2026 12:00"
  };
  const dateHelper = extractBetween("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  vm.runInNewContext(`${v6FieldApplicabilitySource}\n${dateHelper}\n${profileSource}\n${dateNormalizerSource}\n${createFunction}\nglobalThis.create = createDraftCollateralFromForm;`, sandbox);
  const result = sandbox.create();
  assert.equal(result.id, "COL-GOODS-01");
  assert.equal(result.profileIdentifier, "col-102026-001");
});

test("editing updates one collateral and retains links, workflow data, hidden fields and documents", () => {
  const existing = {
    id: "COL-EDIT-01",
    createdAt: "2026-09-10 12:00",
    type: "Оборудование",
    name: "Линия до обновления",
    profileIdentifier: "EQ-EDIT-01",
    fields: {
      "Подвид": "Машины и оборудование",
      "Заводской номер": "EQ-EDIT-01",
      "Марка": "Haitian",
      "Идентификатор в АБС": "ABS-KEEP-01",
      "Внутренний атрибут": "KEEP-ME"
    },
    ftMainInfo: {
      "Единица измерения": "Штука (шт.)",
      "Идентификационный код группы": "GROUP-KEEP-01",
      "Идентификатор в АБС": "ABS-KEEP-01",
      "Признак включения в отчетные данные": "Да",
      "Дополнительная информация": "До редактирования"
    },
    groupIdentificationCode: "GROUP-KEEP-01",
    absId: "ABS-KEEP-01",
    contractIds: ["CTR-01"],
    contractId: "CTR-01",
    contractNumber: "ZL-01",
    status: "В залоге",
    marketValue: 1200000,
    pledgeValue: 900000,
    allocatedValue: 850000,
    evaluations: [{ id: "EV-01", fairValue: 1100000 }],
    encumbrances: [{ id: "ENC-01", type: "Залог" }],
    monitoring: { required: "Да", schedule: [{ id: "MON-01" }] },
    insurance: { policy: "POL-01" },
    documents: [{ id: "DOC-01", title: "Паспорт оборудования", name: "passport.pdf", documentName: "Паспорт", target: "COL-EDIT-01" }],
    history: [{ date: "2026-10-01", field: "Создание", newValue: "Создано" }],
    externalData: { source: "Инфосфера", status: "Пройдена" },
    source: "Реестр залогов",
    responsible: "Сотрудник 1",
    initiator: "Сотрудник 2"
  };
  const draft = {
    typeLabel: "Оборудование",
    subtype: "Машины и оборудование",
    name: "Линия после обновления",
    profileIdentifierType: "Заводской номер",
    collateralId: "COL-EDIT-01",
    profileIdentifier: "EQ-EDIT-01",
    typeFields: { "Подвид": "Машины и оборудование", "Заводской номер": "EQ-EDIT-01", "Марка": "Haitian" },
    sharedFields: { "Единица измерения": "Штука (шт.)", "Параметры единицы измерения": "1 линия", "Признак группы залога": "GROUP-KEEP-01", "Дополнительная информация": "Обновлена комплектация" },
    addressFields: { "Адрес / место нахождения": "Новосибирск, ул. Станционная, 12", manualEntry: "Нет" },
    pledgors: [{ share: "100%", name: "ООО Сибирь", idn: "5401234567", subjectType: "ЮЛ", role: "Залогодатель", subjectCode: "5401234567" }],
    documents: existing.documents.map((doc) => ({ ...doc }))
  };
  const modal = { context: "applicationCreate", mode: "edit", collateralId: existing.id };
  const { create } = loadCollateralMutation(draft, [existing], modal);
  const updated = create();
  assert.equal(updated.id, existing.id);
  assert.equal(updated.createdAt, existing.createdAt);
  assert.equal(updated.name, "Линия после обновления");
  assert.equal(updated.profileIdentifier, "EQ-EDIT-01");
  assert.equal(updated.status, "В залоге");
  assert.deepEqual(JSON.parse(JSON.stringify(updated.contractIds)), ["CTR-01"]);
  assert.deepEqual(JSON.parse(JSON.stringify(updated.evaluations)), [{ id: "EV-01", fairValue: 1100000 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(updated.encumbrances)), [{ id: "ENC-01", type: "Залог" }]);
  assert.equal(updated.fields["Внутренний атрибут"], "KEEP-ME");
  assert.equal(updated.fields["Идентификатор в АБС"], "ABS-KEEP-01");
  assert.equal(updated.groupIdentificationCode, "GROUP-KEEP-01");
  assert.equal(Object.hasOwn(updated.ftMainInfo, "Признак группы залога"), false);
  assert.equal(Object.hasOwn(updated.ftMainInfo, "Идентификационный код группы"), false);
  assert.equal(updated.absId, "ABS-KEEP-01");
  assert.equal(updated.ftMainInfo["Признак включения в отчетные данные"], "Да");
  assert.equal(updated.documents[0].id, "DOC-01");
  assert.equal(updated.documents[0].target, existing.id);
  assert.equal(updated.history.length, 2);
  assert.match(updated.history[0].reason, /обновлены из формы заявки/);
});

test("editing a legacy vehicle moves its basis-document fields without losing them or duplicating them", () => {
  const existing = {
    id: "COL-LEGACY-VEHICLE",
    type: "Транспортные средства, прицепы (полуприцепы)",
    name: "Автомобиль",
    profileIdentifier: "VIN-LEGACY-01",
    fields: {
      "Идентификационный номер транспортного средства (VIN)": "VIN-LEGACY-01",
      "Осмотр (проведен/не проведен)": "проведен",
      "Тип документа": "ПТС",
      "Дата": "2024-06-01",
      "Серия": "78НХ",
      "Номер": "1234567"
    },
    documents: [],
    pledgors: [],
    history: []
  };
  const draft = {
    typeLabel: existing.type,
    subtype: "Залог автотранспортного средства категории В",
    name: "Автомобиль после редактирования",
    profileIdentifierType: "VIN",
    collateralId: existing.id,
    profileIdentifier: existing.profileIdentifier,
    typeFields: { "Идентификационный номер транспортного средства (VIN)": "VIN-LEGACY-01" },
    basisDocument: { type: "ПТС", date: "01.06.2024", series: "78НХ", number: "1234567" },
    sharedFields: { "Единица измерения": "Штука (шт.)", "Осмотр произведен": "Да" },
    addressFields: { "Адрес / место нахождения": "г. Новосибирск" },
    pledgors: [{ name: "ООО Автовладелец", idn: "5401234567", role: "Залогодатель" }],
    documents: []
  };
  const { create } = loadCollateralMutation(draft, [existing], { context: "applicationCreate", mode: "edit", collateralId: existing.id });
  const updated = create();
  assert.equal(updated.id, existing.id);
  assert.deepEqual(JSON.parse(JSON.stringify(updated.basisDocument)), { type: "ПТС", date: "2024-06-01", series: "78НХ", number: "1234567", status: "" });
  for (const field of ["Тип документа", "Дата", "Серия", "Номер"]) assert.equal(Object.hasOwn(updated.fields, field), false);
  assert.equal(Object.hasOwn(updated.fields, "Осмотр (проведен/не проведен)"), false);
  assert.equal(updated.ftMainInfo["Осмотр произведен"], "Да");
  assert.equal(updated.fields["Идентификационный номер транспортного средства (VIN)"], "VIN-LEGACY-01");
});

test("legacy group linkage is retained internally but not exposed in v7 characteristics", () => {
  const existing = {
    id: "COL-GROUP-CLEAR-01",
    type: "Оборудование",
    name: "Линия фасовки",
    profileIdentifier: "EQ-GROUP-CLEAR-01",
    fields: {
      "Заводской номер": "EQ-GROUP-CLEAR-01",
      "Признак группы залога": "GROUP-OLD-01",
      "Идентификационный код группы": "GROUP-OLD-01"
    },
    ftMainInfo: {
      "Единица измерения": "Штука (шт.)",
      "Признак группы залога": "GROUP-OLD-01",
      "Идентификационный код группы": "GROUP-OLD-01",
      "Дополнительная информация": "Линия на складе"
    },
    groupIdentificationCode: "GROUP-OLD-01",
    groupCode: "GROUP-OLD-01",
    documents: [],
    pledgors: [],
    history: []
  };
  const draft = {
    typeLabel: "Оборудование",
    subtype: "Машины и оборудование",
    name: existing.name,
    typeFields: { "Заводской номер": "EQ-GROUP-CLEAR-01" },
    sharedFields: {
      "Единица измерения": "Штука (шт.)",
      "Параметры единицы измерения": "1 линия",
      "Признак группы залога": "",
      "Дополнительная информация": "Линия на складе"
    },
    addressFields: {},
    pledgors: [],
    documents: []
  };
  const { create } = loadCollateralMutation(draft, [existing], { context: "applicationCreate", mode: "edit", collateralId: existing.id });
  const updated = create();
  assert.equal(updated.groupIdentificationCode, "GROUP-OLD-01");
  assert.equal(updated.groupCode, "GROUP-OLD-01");
  assert.equal(Object.hasOwn(updated.ftMainInfo, "Признак группы залога"), false);
  assert.equal(Object.hasOwn(updated.ftMainInfo, "Идентификационный код группы"), false);
  assert.equal(Object.hasOwn(updated.fields, "Признак группы залога"), false);
  assert.equal(Object.hasOwn(updated.fields, "Идентификационный код группы"), false);

  const reloaded = mergeSavedCollateral(updated, updated);
  assert.equal(reloaded.groupIdentificationCode, "GROUP-OLD-01");
  assert.equal(reloaded.groupCode, "GROUP-OLD-01");
  assert.equal(Object.hasOwn(reloaded.ftMainInfo, "Признак группы залога"), false);
  assert.equal(Object.hasOwn(reloaded.ftMainInfo, "Идентификационный код группы"), false);
  assert.equal(Object.hasOwn(reloaded.fields, "Идентификационный код группы"), false);
});

test("editing a railcar hides the legacy unit type but preserves its stored value", () => {
  const getGroups = loadGroups(readCollateralSchemas());
  const existing = {
    id: "COL-LEGACY-RAIL",
    type: "Железнодорожный подвижной состав",
    name: "Полувагон 58824157",
    profileIdentifier: "58824157",
    profileIdentifierType: "Номер вагона",
    fields: {
      "Заводской номер": "RW-12-132-410057",
      "Тип единицы": "Грузовой вагон",
      "Модель вагона": "12-132-03",
      "Номер вагона": "58824157",
      "Год постройки": "2021"
    },
    documents: [],
    pledgors: [],
    history: []
  };
  const draft = {
    typeLabel: "Железнодорожный подвижной состав",
    subtype: "Грузовой вагон",
    name: "Полувагон 58824157",
    profileIdentifierType: "Номер вагона",
    collateralId: existing.id,
    profileIdentifier: "58824157",
    typeFields: {
      "Заводской номер": "RW-12-132-410057",
      "Модель вагона": "12-132-03",
      "Номер вагона": "58824157",
      "Год постройки": "2021"
    },
    sharedFields: {
      "Единица измерения": "Штука (шт.)",
      "Значение, в указанных ед.изм.": "1",
      "Дополнительная информация": ""
    },
    basisDocument: {},
    pledgeContracts: [],
    addressFields: { "Адрес / место нахождения": "Санкт-Петербург, станция Автово" },
    pledgors: [],
    documents: []
  };
  const { create } = loadCollateralMutation(draft, [existing], { context: "applicationCreate", mode: "edit", collateralId: existing.id });
  const updated = create();

  assert.equal(updated.fields["Тип единицы"], "Грузовой вагон");
  assert.equal(Object.hasOwn(draft.typeFields, "Тип единицы"), false);
  assert.equal(getGroups("Железнодорожный подвижной состав").typeSpecific.includes("Тип единицы"), false);
});

test("editing collateral without an address form preserves existing address data", () => {
  const existing = {
    id: "COL-RIGHTS-01",
    type: "Имущественные права (требования)",
    name: "Право требования по договору",
    profileIdentifier: "PR-410/26 от 14.02.2026",
    fields: {
      "Подвид": "Дебиторская задолженность",
      "Номер договора": "PR-410/26",
      "Дата заключения договора": "2026-02-14"
    },
    address: "Новосибирская область, г. Новосибирск, ул. Кирова, д. 32",
    addressFields: {
      "Адрес / место нахождения": "Новосибирская область, г. Новосибирск, ул. Кирова, д. 32",
      "Регион": "Новосибирская область",
      "Номер дома (владения)": "32",
      "ФИАС GUID": "550e8400-e29b-41d4-a716-446655440000",
      manualEntry: "Да",
      "Частный дом": "Нет",
      legacyAddressMetadata: "KEEP"
    },
    ftMainInfo: { "Единица измерения": "Рубль (руб.)", "Дополнительная информация": "Действующее требование" },
    contractIds: ["CTR-RIGHTS-01"],
    documents: [],
    history: []
  };
  const draft = {
    typeLabel: "Имущественные права (требования)",
    subtype: "Дебиторская задолженность",
    name: existing.name,
    typeFields: { ...existing.fields },
    sharedFields: {
      "Единица измерения": "Рубль (руб.)",
      "Параметры единицы измерения": "1",
      "Признак группы залога": "",
      "Дополнительная информация": "Действующее требование"
    },
    addressFields: { ...existing.addressFields },
    pledgors: [],
    documents: []
  };
  const modal = { context: "applicationCreate", mode: "edit", collateralId: existing.id };
  const { create } = loadCollateralMutation(draft, [existing], modal);
  const updated = create();
  assert.equal(updated.id, existing.id);
  assert.equal(updated.address, existing.address);
  assert.deepEqual(JSON.parse(JSON.stringify(updated.addressFields)), existing.addressFields);
});
