import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData, FT_COLLATERAL_SUBTYPE_OPTIONS, resolveCollateralSubtype } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function extractConstantSource(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return appSource.slice(start, end);
}

const collateralTypes = [
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

test("all sample collateral cards have a subtype from table 2.5 for their collateral type", () => {
  const aliases = {
    "Недвижимость": "Объекты недвижимости",
    "Автотранспорт": "Транспортные средства, прицепы (полуприцепы)",
    "Скот": "Животные"
  };
  assert.ok(initialData.collaterals.length > 0);
  for (const collateral of initialData.collaterals) {
    const type = aliases[collateral.type] || collateral.type;
    const subtype = collateral.fields?.["Подвид залога"];
    assert.ok(FT_COLLATERAL_SUBTYPE_OPTIONS[type], `${collateral.id}: unexpected collateral type ${collateral.type}`);
    assert.ok(FT_COLLATERAL_SUBTYPE_OPTIONS[type].includes(subtype), `${collateral.id}: invalid subtype ${subtype} for ${type}`);
  }
});

test("legacy saved subtypes display the matching table 2.5 value", () => {
  const source = extractConstantSource("function getCollateralSubtype(collateral)", "function getCollateralCategory(collateral)");
  const sandbox = {
    FT_COLLATERAL_SUBTYPE_OPTIONS,
    resolveCollateralSubtype,
    getCollateralTypeLabel: (collateral) => ({ Недвижимость: "Объекты недвижимости" })[collateral.type] || collateral.type
  };
  vm.runInNewContext(`${source}\nglobalThis.subtype = getCollateralSubtype;`, sandbox);
  assert.equal(sandbox.subtype({
    type: "Недвижимость",
    description: "Квартира 82 кв.м",
    fields: { "Подвид залога": "Жилое помещение", "Вид объекта": "Помещения" }
  }), "Помещения");
  assert.equal(sandbox.subtype({
    type: "Объекты недвижимости",
    description: "Земельный участок 2,4 га",
    fields: { "Подвид залога": "Земельный участок в черте населенного пункта" }
  }), "Земельный участок");
  assert.equal(resolveCollateralSubtype({
    type: "Объекты недвижимости",
    typeFields: { "Подвид залога": "Земельный участок" }
  }), "Земельный участок");
  assert.equal(resolveCollateralSubtype({
    type: "Объекты недвижимости",
    typeFields: { "Подвид залога": "Имущественный комплекс" }
  }), "Предприятие как имущественный комплекс");
});

function readSchemas() {
  const schemaSource = extractConstantSource("const FT_COLLATERAL_TYPE_OPTIONS = [", "const COLLATERAL_LEGACY_TYPE_FIELDS = [");
  const sandbox = { COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога" };
  vm.runInNewContext(`${schemaSource}\nglobalThis.result = {
    types: FT_COLLATERAL_TYPE_OPTIONS,
    cardFields: FT_COLLATERAL_V8_TYPE_FIELDS,
    formTypeFields: FT_COLLATERAL_V8_MODAL_TYPE_FIELDS,
    address: COLLATERAL_ADDRESS_FIELDS,
    cardCommon: COLLATERAL_SHARED_MAIN_FIELDS,
    characteristicCommon: COLLATERAL_CHARACTERISTIC_COMMON_FIELDS,
    formCommon: NEW_COLLATERAL_SHARED_FIELDS
  };`, sandbox);
  return sandbox.result;
}

const expectedCardFields = {
  "Объекты недвижимости": ["Описание по ЕГРН", "Кадастровый номер", "Условный номер", "Адрес по ЕГРН", "Кадастровая стоимость", "Дата определения кадастровой стоимости", "Дата регистрации права собственности", "Назначение объекта", "Функциональная группа", "Площадь застройки, кв. м", "Длина сооружения, м", "Категория земель", "Вид разрешенного использования участка", "Право залогодателя", "Дата окончания срока аренды", "Размер доли в праве общей долевой собственности, числитель", "Размер доли в праве общей долевой собственности, знаменатель", "Площадь в неструктурированном виде", "Идентификационный номер объекта недвижимости в стране регистрации", "Признак части объекта недвижимости", "Вид сооружения", "Кадастровый номер в пределах, которого находится объект"],
  "Транспортные средства, прицепы (полуприцепы)": ["Идентификационный номер транспортного средства (VIN)", "Марка", "Модель", "Год выпуска", "Мощность двигателя, л.с.", "Объем двигателя, куб. см", "Номер двигателя", "Модель двигателя", "Регион выдачи", "Адрес по СТС", "Пробег", "Категория транспорта", "Подкатегория", "Тип транспорта", "Номер шасси (рамы)", "Мощность двигателя, кВт", "Тип автомобиля", "Инвентарный номер", "Гос.номер"],
  "Транспортные средства (самоходная техника)": ["Идентификационный номер ТС или СМ (VIN, PIN, заводской)", "Год выпуска", "Марка", "Модель", "Мощность двигателя, л.с.", "Марка двигателя", "Модель двигателя", "Объем двигателя, куб. см", "Регион выдачи", "Адрес по СТС", "Пробег", "Категория транспорта", "Подкатегория", "Тип транспорта", "Номер шасси (рамы)", "Мощность двигателя, кВт", "Тип автомобиля", "Инвентарный номер", "Гос.номер"],
  "Оборудование": ["Заводской номер", "Серийный номер", "Марка", "Модель", "Инвентарный номер", "Год выпуска", "Группа", "Дата ввода в эксплуатацию", "Первоначальная стоимость", "Остаточная стоимость", "Производитель"],
  "Воздушные суда": ["Вид воздушного судна", "Серийный (заводской) номер", "Номер планера", "Год выпуска", "Наименование изготовителя", "Опознавательные знаки воздушного судна", "Размер доли в праве общей долевой собственности, числитель", "Размер доли в праве общей долевой собственности, знаменатель"],
  "Плавучие сооружения": ["Идентификационный номер", "Группа", "Номер IMO", "Класс судна", "Год постройки", "Название", "Регистровый номер", "Номер ИМПС/MMSI", "Размер доли в праве общей долевой собственности, числитель", "Размер доли в праве общей долевой собственности, знаменатель"],
  "Железнодорожный подвижной состав": ["Заводской номер", "Модель вагона", "Номер вагона", "Год постройки"],
  "Животные": ["Инвентарный номер"],
  "Имущественные права (требования)": ["Вид имущественных прав (требований)", "Договор имущественных прав", "Дата заключения договора", "Номер договора"],
  "Товары в обороте": ["Инвентарный номер"],
  "Прочие движимые вещи (однородные группы)": ["Инвентарный номер"],
  "Прочие движимые вещи (объекты)": ["Инвентарный номер", "Идентификационный признак (значение)", "Идентификационный признак (наименование)"]
};

const expectedFormTypeFields = expectedCardFields;

test("card field sets and order match the active v8 text for all 12 collateral types", () => {
  const schemas = readSchemas();
  assert.deepEqual(Array.from(schemas.types), collateralTypes);
  assert.deepEqual(Object.keys(schemas.cardFields), collateralTypes);
  for (const type of collateralTypes) {
    assert.deepEqual(Array.from(schemas.cardFields[type]), expectedCardFields[type], `Card fields differ for ${type}`);
  }
  assert.equal(schemas.cardFields["Железнодорожный подвижной состав"].includes("Тип единицы"), false);
  assert.equal(schemas.formTypeFields["Железнодорожный подвижной состав"].includes("Тип единицы"), false);
  assert.equal(schemas.cardFields["Воздушные суда"].includes("Тип (наименование)"), false);
  assert.equal(schemas.cardFields["Плавучие сооружения"].includes("Группа"), true);
  assert.equal(schemas.cardFields["Товары в обороте"].includes("Вид товаров в обороте"), false);
  assert.deepEqual(Array.from(schemas.cardCommon), ["Единица измерения", "Значение, в указанных ед.изм.", "Дополнительная информация"]);
  assert.deepEqual(Array.from(schemas.address), [
    "Адрес / место нахождения", "Почтовый индекс", "Регион", "Район", "Населенный пункт", "Город", "Улица", "Дом", "Корпус", "Квартира"
  ]);
  assert.equal(schemas.cardFields["Транспортные средства (самоходная техника)"].filter((field) => field === "Дополнительная информация").length, 0);
});

test("initial test data contains a realistic collateral card for each v8 stage-1 type", () => {
  const typeLabels = {
    Недвижимость: "Объекты недвижимости",
    Автотранспорт: "Транспортные средства, прицепы (полуприцепы)",
    Скот: "Животные"
  };
  const samples = new Map();
  for (const collateral of initialData.collaterals) {
    const type = typeLabels[collateral.type] || collateral.type;
    if (!samples.has(type)) samples.set(type, collateral);
  }
  for (const type of collateralTypes) {
    const sample = samples.get(type);
    assert.ok(sample, `Missing test collateral for ${type}`);
    assert.ok(sample.id, `Missing profile card id for ${type}`);
    assert.ok(sample.name || sample.description, `Missing realistic object name for ${type}`);
    assert.ok(sample.profileIdentifier || sample.id, `Missing profile identifier for ${type}`);
    if (["Животные", "Товары в обороте", "Прочие движимые вещи (однородные группы)", "Прочие движимые вещи (объекты)"].includes(type)) {
      assert.ok(sample.fields?.["Инвентарный номер"], `Missing explicit inventory number for ${type}`);
    }
  }
});

test("add/edit form type-specific fields match the active v8 text", () => {
  const schemas = readSchemas();
  for (const type of collateralTypes) {
    assert.deepEqual(Array.from(schemas.formTypeFields[type]), expectedFormTypeFields[type], `Add/edit fields differ for ${type}`);
  }
  assert.deepEqual(Array.from(schemas.formCommon), [
    "Единица измерения", "Значение, в указанных ед.изм.", "Дополнительная информация", "Осмотр произведен",
    "Контактное лицо для осмотра"
  ]);
  assert.doesNotMatch(appSource, /data-new-collateral-field="Признак группы залога"/);
  assert.match(appSource, /"Вид профильного идентификатора"/);
});

test("property identifiers and unconditional share/area fields stay visible in card and form", () => {
  const characteristicSource = extractConstantSource("function getNewCollateralCharacteristicTypeFields", "function getNewCollateralProfileIdentifierOptions");
  const applicabilitySource = extractConstantSource("function isNewCollateralModalTypeFieldApplicable", "function getNewCollateralProfileIdentifierOptions");
  const cardApplicabilitySource = extractConstantSource("function isCollateralV6TypeFieldApplicable", "function getCollateralBasisDocument");
  const sandbox = {
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim())
  };
  vm.runInNewContext(`${cardApplicabilitySource}\n${characteristicSource}\n${applicabilitySource}\nglobalThis.characteristicFields = getNewCollateralCharacteristicTypeFields;\nglobalThis.isApplicable = isNewCollateralModalTypeFieldApplicable;\nglobalThis.cardApplicable = isCollateralV6CardTypeFieldApplicable;`, sandbox);
  const labels = [
    "Кадастровый номер",
    "Условный номер",
    "Размер доли в праве общей долевой собственности, числитель",
    "Размер доли в праве общей долевой собственности, знаменатель",
    "Площадь в неструктурированном виде"
  ];
  const fieldsForSelectedProfile = sandbox.characteristicFields(
    { typeLabel: "Объекты недвижимости", profileIdentifierType: "Кадастровый номер" },
    { typeSpecific: labels }
  );
  assert.deepEqual(Array.from(fieldsForSelectedProfile), labels);
  const draft = { typeLabel: "Объекты недвижимости", subtype: "Помещения", typeFields: {} };
  for (const field of labels) {
    assert.equal(sandbox.isApplicable("Объекты недвижимости", field, draft), true, field);
    assert.equal(sandbox.isApplicable("Объекты недвижимости", field, draft), sandbox.cardApplicable("Объекты недвижимости", field, draft), field);
  }
});

test("required profile source fields remain visible in characteristics in card and add form", () => {
  const source = extractConstantSource("function getNewCollateralCharacteristicTypeFields", "function isNewCollateralModalTypeFieldApplicable");
  const sandbox = {
    FT_COLLATERAL_PROFILE_FIELDS_VISIBLE_IN_CHARACTERISTICS: new Set([
      "Животные|Инвентарный номер",
      "Имущественные права (требования)|Номер договора",
      "Товары в обороте|Инвентарный номер",
      "Прочие движимые вещи (однородные группы)|Инвентарный номер",
      "Прочие движимые вещи (объекты)|Инвентарный номер"
    ]),
    getNewCollateralProfileSource: (_draft, identifierType) => {
      if (identifierType === "Инвентарный номер") return { group: "type", field: "Инвентарный номер" };
      if (identifierType === "Номер договора вместе с датой заключения договора") return { group: "type", field: "Номер договора" };
      return null;
    }
  };
  vm.runInNewContext(`${source}\nglobalThis.fields = getNewCollateralCharacteristicTypeFields;`, sandbox);

  const cases = [
    ["Животные", "Инвентарный номер", "Инвентарный номер"],
    ["Имущественные права (требования)", "Номер договора вместе с датой заключения договора", "Номер договора"],
    ["Товары в обороте", "Инвентарный номер", "Инвентарный номер"],
    ["Прочие движимые вещи (однородные группы)", "Инвентарный номер", "Инвентарный номер"],
    ["Прочие движимые вещи (объекты)", "Инвентарный номер", "Инвентарный номер"]
  ];
  for (const [typeLabel, profileIdentifierType, field] of cases) {
    const groups = { typeSpecific: [field] };
    const draft = { typeLabel, profileIdentifierType };
    assert.deepEqual(Array.from(sandbox.fields(draft, groups)), [field], `${typeLabel}: form characteristics`);
    assert.deepEqual(Array.from(sandbox.fields({ ...draft, characteristicsCardView: true }, groups)), [field], `${typeLabel}: card characteristics`);
  }
  const equipment = { typeLabel: "Оборудование", profileIdentifierType: "Инвентарный номер" };
  assert.deepEqual(Array.from(sandbox.fields(equipment, { typeSpecific: ["Инвентарный номер"] })), []);
});

test("animal sample stores herd quantity as a numeric value in its selected unit", () => {
  const animal = initialData.collaterals.find((collateral) => collateral.id === "COL-008");
  assert.ok(animal);
  assert.equal(animal.ftMainInfo?.["Единица измерения"], "Голова (гол.)");
  assert.equal(animal.ftMainInfo?.["Значение, в указанных ед.изм."], "340");
  assert.equal(animal.fields?.["Инвентарный номер"], "INV-AGR-008");
});

test("property card preserves both identification numbers regardless of cadastral number", () => {
  const fields = ["Кадастровый номер", "Условный номер"];
  const helpers = extractConstantSource("function getCollateralTypeSpecificFields", "function isCollateralV6TypeFieldApplicable");
  const values = extractConstantSource("function getCollateralTypeSpecificValue", "function getVehicleMakeModel");
  const applicability = extractConstantSource("function isCollateralV6TypeFieldApplicable", "function getCollateralBasisDocument");
  const sandbox = {
    STAGE1_COLLATERAL_TYPE_SET: new Set(["Объекты недвижимости"]),
    FT_COLLATERAL_TYPES_WITHOUT_FIELDS: new Set(),
    getCollateralTypeLabel: () => "Объекты недвижимости",
    getCollateralSubtype: resolveCollateralSubtype,
    getCollateralTypeDisplayFieldLabels: () => fields,
    getCollateralClientType: () => "ЮЛ",
    getCollateralClientType: () => "",
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim()),
    getCollateralTypeFieldFallback: (_collateral, label) => label === "Кадастровый номер" ? "Не применяется" : "Не указан",
    getCollateralName: (collateral) => collateral.name || collateral.id
  };
  vm.runInNewContext(`${applicability}\n${values}\n${helpers}\nglobalThis.readFields = getCollateralTypeSpecificFields;`, sandbox);
  const cadastral = sandbox.readFields({
    type: "Недвижимость",
    profileIdentifier: "54:35:074010:1201",
    profileIdentifierType: "Кадастровый номер",
    fields: { "Кадастровый номер": "54:35:074010:1201", "Условный номер": "УС-1201" }
  });
  assert.deepEqual(Object.keys(cadastral), ["Кадастровый номер", "Условный номер"]);
  assert.equal(cadastral["Кадастровый номер"], "54:35:074010:1201");
  assert.equal(cadastral["Условный номер"], "УС-1201");

  const noCadastral = sandbox.readFields({
    type: "Недвижимость",
    profileIdentifier: "col-102026-001",
    profileIdentifierType: "Номер карточки залога",
    fields: { "Условный номер": "54-54-01/001/2010-123" }
  });
  assert.equal(noCadastral["Кадастровый номер"], "Не применяется");
  assert.equal(noCadastral["Условный номер"], "54-54-01/001/2010-123");
});

test("collateral-card visibility follows subtype and exposes required optional real-estate fields", () => {
  const applicability = extractConstantSource("function isCollateralV6TypeFieldApplicable", "function getCollateralBasisDocument");
  const sandbox = {
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim())
  };
  vm.runInNewContext(`${applicability}\nglobalThis.cardApplicable = isCollateralV6CardTypeFieldApplicable;\nglobalThis.formApplicable = isCollateralV6TypeFieldApplicable;`, sandbox);

  const requiredEvenWhenEmpty = [
    "Условный номер",
    "Размер доли в праве общей долевой собственности, числитель",
    "Размер доли в праве общей долевой собственности, знаменатель",
    "Площадь в неструктурированном виде",
    "Признак части объекта недвижимости",
    "Кадастровый номер в пределах, которого находится объект"
  ];
  for (const field of requiredEvenWhenEmpty) {
    assert.equal(sandbox.cardApplicable("Объекты недвижимости", field, { fields: {} }), true, field);
  }

  const landSubtype = {
    fields: { "Подвид залога": "Земельный участок" }
  };
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Категория земель", landSubtype), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Вид разрешенного использования участка", landSubtype), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Назначение объекта", landSubtype), false);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Функциональная группа", landSubtype), false);
  assert.equal(sandbox.formApplicable("Объекты недвижимости", "Категория земель", landSubtype), true);

  const rentalPremises = {
    fields: {
      "Подвид залога": "Помещения",
      "Право залогодателя": "Право аренды"
    }
  };
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Дата окончания срока аренды", rentalPremises), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Назначение объекта", rentalPremises), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Функциональная группа", rentalPremises), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Длина сооружения, м", landSubtype), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Длина сооружения, м", {
    fields: { "Подвид залога": "Единый недвижимый комплекс" }
  }), false);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Вид сооружения", {
    fields: { "Подвид залога": "Сооружения" }
  }), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Дата окончания срока аренды", {
    fields: { "Подвид залога": "Помещения", "Право залогодателя": "Право собственности" }
  }), false);

  const partFlag = { fields: { "Подвид залога": "Помещения", "Признак части объекта недвижимости": "Да" } };
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Кадастровый номер в пределах, которого находится объект", partFlag), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Кадастровый номер в пределах, которого находится объект", {
    fields: { "Подвид залога": "Помещения", "Признак части объекта недвижимости": "Нет" }
  }), true);
  assert.equal(sandbox.cardApplicable("Объекты недвижимости", "Кадастровый номер в пределах, которого находится объект", {
    fields: { "Подвид залога": "Помещения", "Признак части объекта недвижимости": "Нет", "Кадастровый номер объекта, в состав которого входит часть": "77:01:0001:25" }
  }), true);
});

test("card and add/edit field sets and visibility match for all collateral types", () => {
  const groupSource = extractConstantSource("function getNewCollateralFieldGroups", "function getNewCollateralCharacteristicTypeFields");
  const applicabilitySource = extractConstantSource("function isCollateralV6TypeFieldApplicable", "function getCollateralBasisDocument");
  const modalApplicabilitySource = extractConstantSource("function isNewCollateralModalTypeFieldApplicable", "function getNewCollateralProfileIdentifierOptions");
  const characteristicSource = extractConstantSource("function getNewCollateralCharacteristicTypeFields", "function isNewCollateralModalTypeFieldApplicable");
  const schemas = readSchemas();
  const sandbox = {
    FT_COLLATERAL_PROFILE_FIELDS_VISIBLE_IN_CHARACTERISTICS: new Set(),
    FT_COLLATERAL_V8_TYPE_FIELDS: schemas.cardFields,
    FT_COLLATERAL_V8_MODAL_TYPE_FIELDS: schemas.formTypeFields,
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    COLLATERAL_CHARACTERISTIC_COMMON_FIELDS: schemas.characteristicCommon,
    NEW_COLLATERAL_SHARED_FIELDS: schemas.formCommon,
    getNewCollateralSubtypeField: () => "",
    getNewCollateralProfileSource: () => null,
    isCollateralAddressApplicable: (typeLabel) => typeLabel !== "Имущественные права (требования)",
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim())
  };
  vm.runInNewContext(`${applicabilitySource}\n${modalApplicabilitySource}\n${groupSource}\n${characteristicSource}\nglobalThis.getGroups = getNewCollateralFieldGroups; globalThis.getCharacteristicFields = getNewCollateralCharacteristicTypeFields;`, sandbox);

  const assertSameFields = (type, draft) => {
    const cardDraft = { ...draft, characteristicsCardView: true };
    const formDraft = { ...draft, characteristicsCardView: false };
    const cardGroups = sandbox.getGroups(type, cardDraft);
    const formGroups = sandbox.getGroups(type, formDraft);
    assert.deepEqual(Array.from(formGroups.typeSpecific), Array.from(cardGroups.typeSpecific), `${type}: form field order`);
    assert.deepEqual(
      Array.from(sandbox.getCharacteristicFields(formDraft, formGroups)),
      Array.from(sandbox.getCharacteristicFields(cardDraft, cardGroups)),
      `${type}: rendered characteristic field order`
    );
    assert.deepEqual(
      Array.from(formGroups.shared.filter((field) => schemas.characteristicCommon.includes(field))),
      Array.from(cardGroups.shared.filter((field) => schemas.characteristicCommon.includes(field))),
      `${type}: common characteristic fields`
    );
  };

  for (const type of collateralTypes) {
    assertSameFields(type, {
      subtype: FT_COLLATERAL_SUBTYPE_OPTIONS[type]?.[0] || "",
      fields: {},
      typeFields: {}
    });
  }

  for (const [type, draft] of [
    ["Объекты недвижимости", { subtype: "Помещения", fields: {}, typeFields: {} }],
    ["Объекты недвижимости", { subtype: "Помещения", fields: { "Кадастровый номер": "54:35:000001:1" }, typeFields: { "Кадастровый номер": "54:35:000001:1" } }],
    ["Объекты недвижимости", { subtype: "Помещения", fields: { "Право залогодателя": "Право аренды" }, typeFields: { "Право залогодателя": "Право аренды" } }],
    ["Объекты недвижимости", { subtype: "Помещения", fields: { "Право собственности": "Право аренды" }, typeFields: { "Право собственности": "Право аренды" } }],
    ["Объекты недвижимости", { subtype: "Сооружения", fields: { "Признак части объекта недвижимости": "Да", "Кадастровый номер объекта, в состав которого входит часть": "77:01:0001:25" }, typeFields: { "Признак части объекта недвижимости": "Да", "Кадастровый номер объекта, в состав которого входит часть": "77:01:0001:25" } }],
    ["Транспортные средства, прицепы (полуприцепы)", { subtype: "Прицеп", fields: { "Номер двигателя": "ENG-12", "Модель двигателя": "D-200" }, typeFields: { "Номер двигателя": "ENG-12", "Модель двигателя": "D-200" } }],
    ["Оборудование", { subtype: "Промышленное оборудование", clientType: "ЮЛ", fields: {}, typeFields: {} }],
    ["Оборудование", { subtype: "Промышленное оборудование", clientType: "ФЛ", fields: {}, typeFields: {} }],
    ["Воздушные суда", { subtype: "Самолет", fields: {}, typeFields: {} }],
    ["Железнодорожный подвижной состав", { subtype: "Вагоны", fields: {}, typeFields: {} }]
  ]) {
    assertSameFields(type, draft);
  }

  assert.deepEqual(Array.from(schemas.characteristicCommon), [
    "Единица измерения",
    "Значение, в указанных ед.изм.",
    "Дополнительная информация"
  ]);

  const emptyPropertyGroups = sandbox.getGroups("Объекты недвижимости", { subtype: "Помещения", fields: {}, typeFields: {} });
  for (const field of [
    "Размер доли в праве общей долевой собственности, числитель",
    "Размер доли в праве общей долевой собственности, знаменатель",
    "Площадь в неструктурированном виде"
  ]) assert.ok(emptyPropertyGroups.typeSpecific.includes(field), field);
});

test("collateral card passes client type into the shared characteristic visibility rules", () => {
  const cardDraftSource = extractConstantSource(
    "const fieldDraft = {",
    "const characteristicGroups = getNewCollateralFieldGroups(typeLabel, fieldDraft);"
  );
  const groupSource = extractConstantSource(
    "function getNewCollateralFieldGroups",
    "function getNewCollateralCharacteristicTypeFields"
  );
  const applicabilitySource = extractConstantSource(
    "function isCollateralV6TypeFieldApplicable",
    "function getCollateralBasisDocument"
  );
  const schemas = readSchemas();
  const sandbox = {
    typeLabel: "Оборудование",
    existingTypeFields: Object.fromEntries(schemas.cardFields["Оборудование"].map((field) => [field, ""])),
    sharedFields: {},
    basisDocument: {},
    collateral: { id: "COL-EQ-1", clientType: "ЮЛ", profileIdentifier: "EQ-1" },
    FT_COLLATERAL_V8_TYPE_FIELDS: schemas.cardFields,
    FT_COLLATERAL_V8_MODAL_TYPE_FIELDS: schemas.formTypeFields,
    COLLATERAL_ADDRESS_FIELDS: schemas.address,
    COLLATERAL_CHARACTERISTIC_COMMON_FIELDS: schemas.characteristicCommon,
    NEW_COLLATERAL_SHARED_FIELDS: schemas.formCommon,
    getCollateralSubtype: () => "Промышленное оборудование",
    getCollateralClientType: (collateral) => collateral.clientType,
    getCollateralTypeSpecificValue: () => "",
    getNewCollateralProfileIdentifierType: () => "Номер карточки залога",
    getCollateralAddressFields: () => ({}),
    getNewCollateralSubtypeField: () => "",
    getNewCollateralProfileSource: () => null,
    isCollateralAddressApplicable: () => true,
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim())
  };
  vm.runInNewContext(`${applicabilitySource}\n${groupSource}\n${cardDraftSource}\nglobalThis.cardDraft = fieldDraft; globalThis.visibleFields = getNewCollateralFieldGroups(typeLabel, fieldDraft).typeSpecific;`, sandbox);

  assert.equal(sandbox.cardDraft.clientType, "ЮЛ");
  assert.deepEqual(Array.from(sandbox.visibleFields).filter((field) => [
    "Дата ввода в эксплуатацию",
    "Первоначальная стоимость",
    "Остаточная стоимость"
  ].includes(field)), ["Дата ввода в эксплуатацию", "Первоначальная стоимость", "Остаточная стоимость"]);
});

test("card and add/edit form use the same exact common characteristic fields", () => {
  const schemas = readSchemas();
  const overviewStart = appSource.indexOf("function renderCollateralOverview(collateral)");
  const overviewEnd = appSource.indexOf("\nfunction renderCollateralDisplayFieldGrid", overviewStart);
  const overview = appSource.slice(overviewStart, overviewEnd);
  const modalStart = appSource.indexOf("function renderNewCollateralModal()");
  const modalEnd = appSource.indexOf("\nfunction updateNewCollateralDraftField", modalStart);
  const modal = appSource.slice(modalStart, modalEnd);
  const expected = ["Единица измерения", "Значение, в указанных ед.изм.", "Дополнительная информация"];

  assert.deepEqual(Array.from(schemas.characteristicCommon), expected);
  assert.match(overview, /const sharedFieldLabels = COLLATERAL_CHARACTERISTIC_COMMON_FIELDS/);
  assert.match(modal, /groups\.shared\.filter\(\(label\) => COLLATERAL_CHARACTERISTIC_COMMON_FIELDS\.includes\(label\)\)/);
  assert.equal(schemas.formCommon.filter((field) => expected.includes(field)).join("|"), expected.join("|"));
});

test("collateral card and add/edit form place characteristics in the same grid", () => {
  const sharedGridRule = stylesSource.match(/\.new-collateral-modal \.collateral-characteristics-type-fields,\s*\.collateral-overview-view \.collateral-characteristics-type-fields\s*\{[^}]+\}/);
  assert.ok(sharedGridRule, "type-characteristic grid is shared by form and card");
  assert.match(sharedGridRule[0], /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);

  const wideFieldRule = stylesSource.match(/\.new-collateral-modal \.collateral-characteristics-type-fields \.new-collateral-field\.is-wide,\s*\.collateral-overview-view \.collateral-overview-type-fields \.new-collateral-field\.is-wide\s*\{[^}]+\}/);
  assert.ok(wideFieldRule, "wide fields keep the same one-column placement in form and card");
  assert.match(wideFieldRule[0], /grid-column:\s*auto/);

  for (const breakpoint of [1180, 900, 560]) {
    const rule = new RegExp(`@media\\s*\\(max-width:\\s*${breakpoint}px\\)[\\s\\S]*?\\.new-collateral-modal \\.collateral-characteristics-type-fields,[\\s\\S]*?\\.collateral-overview-view \\.collateral-characteristics-type-fields\\s*\\{[^}]*grid-template-columns:`);
    assert.match(stylesSource, rule, `form and card share the ${breakpoint}px layout breakpoint`);
  }

  assert.match(appSource, /const sharedFieldLabels = COLLATERAL_CHARACTERISTIC_COMMON_FIELDS/);
  assert.match(appSource, /const characteristicCommonFields = groups\.shared\.filter\(\(label\) => COLLATERAL_CHARACTERISTIC_COMMON_FIELDS\.includes\(label\)\)/);
});

test("collateral card renders sections in v7 order and does not expose removed controls", () => {
  const start = appSource.indexOf("function renderCollateralOverview(collateral)");
  const end = appSource.indexOf("\nfunction renderCollateralDisplayFieldGrid", start);
  const source = appSource.slice(start, end);
  const orderedSections = ["collateral-overview-type-fields", "collateral-overview-common-fields", "collateral-overview-basis-section", "collateral-overview-address-panel"];
  const positions = orderedSections.map((section) => source.indexOf(section));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, positions.slice().sort((a, b) => a - b));
  assert.match(source, /<h3>Документ-основание<\/h3>/);
  assert.doesNotMatch(source, /collateral-overview-basis-panel/);
  assert.match(source, /COLLATERAL_CHARACTERISTIC_COMMON_FIELDS/);
  assert.match(source, /getNewCollateralFieldGroups\(typeLabel, fieldDraft\)/);
  assert.match(source, /Характеристики объекта/);
  assert.doesNotMatch(source, /data-collateral-address-toggle|Ввести вручную|Тип обеспечения|Идентификатор в АБС|Признак включения в отчетные данные/);
});

test("collateral card and add/edit modal share characteristic schemas and layout classes", () => {
  const overviewStart = appSource.indexOf("function renderCollateralOverview(collateral)");
  const overviewEnd = appSource.indexOf("\nfunction renderCollateralDisplayFieldGrid", overviewStart);
  const overview = appSource.slice(overviewStart, overviewEnd);
  const modalStart = appSource.indexOf("function renderNewCollateralModal()");
  const modalEnd = appSource.indexOf("\nfunction updateNewCollateralDraftField", modalStart);
  const modal = appSource.slice(modalStart, modalEnd);
  assert.match(overview, /getNewCollateralCharacteristicTypeFields\(fieldDraft, characteristicGroups\)/);
  assert.match(modal, /getNewCollateralCharacteristicTypeFields\(draft, groups\)/);
  assert.match(overview, /COLLATERAL_CHARACTERISTIC_COMMON_FIELDS/);
  assert.match(modal, /characteristicCommonFields\.map/);
  assert.match(overview, /collateral-characteristics-type-fields/);
  assert.match(modal, /collateral-characteristics-type-fields/);
  assert.match(overview, /collateral-characteristics-common-fields/);
  assert.match(modal, /collateral-characteristics-common-fields/);
  assert.match(stylesSource, /\.new-collateral-modal \.collateral-characteristics-common-fields,[\s\S]*?\.collateral-overview-view \.collateral-characteristics-common-fields/);
  assert.match(overview, /<h2>Характеристики объекта<\/h2>/);
});

test("collateral characteristics align label and control rows", () => {
  const start = stylesSource.indexOf(".collateral-overview-view .collateral-overview-type-fields .new-collateral-field,");
  const end = stylesSource.indexOf(".collateral-overview-view .collateral-overview-type-fields .new-collateral-field.is-wide", start);
  const layout = stylesSource.slice(start, end);
  assert.match(layout, /grid-template-rows:\s*42px 40px/);
  assert.match(layout, /gap:\s*5px/);
  assert.match(layout, /min-height:\s*0/);
  assert.match(stylesSource, /\.collateral-overview-view \.collateral-overview-type-fields \.new-collateral-field,[\s\S]*?\.collateral-overview-view \.collateral-overview-common-fields \.new-collateral-field\s*\{[^}]*grid-template-rows:\s*42px 40px/);
  assert.match(stylesSource, /\.collateral-overview-view \.collateral-overview-type-fields \.new-collateral-field > span:first-child,[\s\S]*?\.collateral-overview-view \.collateral-overview-common-fields \.new-collateral-field > span:first-child\s*\{[^}]*align-self:\s*end/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*560px\)[\s\S]*?\.collateral-overview-view \.collateral-overview-type-fields \.new-collateral-field,[\s\S]*?\.collateral-overview-view \.collateral-overview-common-fields \.new-collateral-field\s*\{[^}]*grid-template-rows:\s*auto 40px/);
  assert.doesNotMatch(stylesSource, /\.new-collateral-modal \.collateral-characteristics-(?:type|common)-fields \.new-collateral-field\s*\{[^}]*grid-template-rows:\s*42px 40px/);
});

test("collateral card keeps removed group marker off the header and follows v7 tab labels", () => {
  const header = appSource.slice(appSource.indexOf("function renderCollateralCard(collateralId"), appSource.indexOf("function renderCollateralTab(collateral)"));
  const contractTable = appSource.slice(appSource.indexOf("function renderCollateralContracts(collateral)"), appSource.indexOf("function renderCollateralPledgors(collateral)"));
  const contractRows = appSource.slice(appSource.indexOf("function getCollateralContractTableRows(collateral)"), appSource.indexOf("function renderCollateralContracts(collateral)"));
  const inspection = appSource.slice(appSource.indexOf("function renderLastInspectionPanel(collateral)"), appSource.indexOf("function normalizeInspectionTypeForCollateralCard"));
  const applicationDeals = appSource.slice(appSource.indexOf("function renderApplicationDealsTable("), appSource.indexOf("\nfunction getApplicationPreInspection(application = {})"));
  assert.doesNotMatch(header, /Признак группы залога|Идентификационный код группы/);
  assert.doesNotMatch(header, /<strong>Номер залога в СУЗ<\/strong>/);
  assert.match(header, /\["contracts", "Договоры и обеспечения"\]/);
  assert.match(header, /\["external", "Проверка предмета залога"\]/);
  assert.match(contractTable, /<th>Продукт<\/th><th>Номер кредитного договора<\/th><th>Дата кредитного договора<\/th><th>Договор залога<\/th><th>Дата договора залога<\/th><th>Сумма\/лимит<\/th><th>Валюта<\/th>/);
  assert.match(contractRows, /creditContractNumber/);
  assert.match(contractRows, /pledgeContractNumber/);
  assert.match(contractTable, /colspan="7"/);
  assert.match(inspection, /"Место проверки"/);
  assert.match(inspection, /"Состояние объекта"/);
  assert.doesNotMatch(inspection, /"Место осмотра"|"Оценка состояния"/);
  assert.match(applicationDeals, /<h2>Договоры и обеспечения<\/h2>/);
});

test("collateral contracts table renders linked credit and pledge agreements in one row", () => {
  const relatedStart = appSource.indexOf("function getCollateralRelatedContracts(collateral)");
  const relatedEnd = appSource.indexOf("\nfunction getCollateralMainInfoFields(collateral)", relatedStart);
  const tableStart = appSource.indexOf("function formatCollateralContractAmount(value)");
  const tableEnd = appSource.indexOf("\nfunction renderCollateralPledgors(collateral)", tableStart);
  assert.notEqual(relatedStart, -1);
  assert.notEqual(relatedEnd, -1);
  assert.notEqual(tableStart, -1);
  assert.notEqual(tableEnd, -1);
  const contractSources = `${appSource.slice(relatedStart, relatedEnd)}\n${appSource.slice(tableStart, tableEnd)}`;
  const contractFixture = structuredClone(initialData);
  const sandbox = {
    state: { data: contractFixture },
    uniqueItems: (values) => [...new Set(values)],
    getContract: (identifier) => contractFixture.contracts.find((contract) => contract.id === identifier),
    getContractByNumber: (number) => contractFixture.contracts.find((contract) => contract.number === number || contract.id === number),
    getApplicationDealRows: () => [],
    escapeHtml: (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  };
  vm.runInNewContext(`${contractSources}\nglobalThis.render = renderCollateralContracts;`, sandbox);
  const mixedCollateral = initialData.collaterals.find((item) => item.id === "COL-005");
  const html = sandbox.render(mixedCollateral);
  const headers = Array.from(html.matchAll(/<th>(.*?)<\/th>/g), (match) => match[1]);
  assert.deepEqual(headers, ["Продукт", "Номер кредитного договора", "Дата кредитного договора", "Договор залога", "Дата договора залога", "Сумма/лимит", "Валюта"]);
  assert.match(html, /BG-26\/228/);
  assert.match(html, /LC-26\/316/);
  assert.match(html, /ZL-26\/228-1/);
  assert.match(html, /ZL-26\/316-1/);
  assert.match(html, /Банковская гарантия/);
  assert.match(html, /Кредит<\/td>/);
  assert.match(html, /RUB/);
  assert.doesNotMatch(html.match(/<td>[^<]*<\/td>/g)?.join("") || "", /₽/);
  assert.equal(Array.from(html.matchAll(/<tr>/g)).length, 3);
  const getCells = (tableHtml, pledgeNumber, pledgeDate = "") => {
    const row = Array.from(tableHtml.matchAll(/<tr>(.*?)<\/tr>/g), (match) => match[1])
      .find((candidate) => candidate.includes(`<td>${pledgeNumber}</td>`)
        && (!pledgeDate || candidate.includes(`<td>${pledgeDate}</td>`)));
    return row ? Array.from(row.matchAll(/<td>(.*?)<\/td>/g), (match) => match[1].replace(/\s+/g, " ")) : [];
  };
  assert.deepEqual(getCells(html, "ZL-26/228-1"), ["Банковская гарантия", "BG-26/228", "2026-02-05", "ZL-26/228-1", "2026-02-05", "2 400 000 000", "RUB"]);
  assert.deepEqual(getCells(html, "ZL-26/316-1"), ["Кредит", "LC-26/316", "2026-03-18", "ZL-26/316-1", "2026-03-18", "800 000 000", "RUB"]);

  const mergedDuplicateHtml = sandbox.render({
    ...mixedCollateral,
    encumbrances: [{ number: "ZL-MERGED", contract: "", date: "", amount: null }],
    pledgeContractNumber: "ZL-MERGED",
    pledgeContractDate: "2026-04-01",
    pledgeContractAmount: 123456,
    pledgeContractCurrency: "USD"
  });
  assert.deepEqual(getCells(mergedDuplicateHtml, "ZL-MERGED"), ["-", "-", "-", "ZL-MERGED", "2026-04-01", "123 456", "USD"]);

  const allocatedFallbackHtml = sandbox.render({
    ...mixedCollateral,
    encumbrances: [{ number: "ZL-ALLOC", contract: "", date: "", amount: "", allocated: 777 }],
    pledgeContractNumber: "ZL-ALLOC",
    pledgeContractDate: "2026-04-05"
  });
  assert.deepEqual(getCells(allocatedFallbackHtml, "ZL-ALLOC"), ["-", "-", "-", "ZL-ALLOC", "2026-04-05", "777", "-"]);

  const ambiguousLinkHtml = sandbox.render({
    ...mixedCollateral,
    encumbrances: [{ number: "ZL-AMBIGUOUS", date: "2026-04-02", amount: 1000 }]
  });
  assert.deepEqual(getCells(ambiguousLinkHtml, "ZL-AMBIGUOUS"), ["-", "-", "-", "ZL-AMBIGUOUS", "2026-04-02", "1 000", "-"]);

  const uniqueLinkHtml = sandbox.render({
    ...mixedCollateral,
    contractIds: ["CTR-2026-0228"],
    encumbrances: [{ number: "ZL-UNIQUE", date: "2026-04-03", amount: 2000 }]
  });
  assert.deepEqual(getCells(uniqueLinkHtml, "ZL-UNIQUE"), ["Банковская гарантия", "BG-26/228", "2026-02-05", "ZL-UNIQUE", "2026-04-03", "2 400 000 000", "RUB"]);

  const emptyHtml = sandbox.render({ encumbrances: [] });
  assert.match(emptyHtml, /<td colspan="7">Договоры и обеспечения не указаны\.<\/td>/);

  const mainOnlyHtml = sandbox.render({
    ...mixedCollateral,
    contractIds: ["CTR-2026-0228"],
    encumbrances: [],
    pledgeContracts: [],
    pledgeContractNumber: "",
    pledgeContractDate: ""
  });
  const mainOnlyRow = Array.from(mainOnlyHtml.matchAll(/<tr>(.*?)<\/tr>/g), (match) => match[1])
    .find((candidate) => candidate.includes("BG-26/228"));
  assert.deepEqual(Array.from(mainOnlyRow.matchAll(/<td>(.*?)<\/td>/g), (match) => match[1].replace(/\s+/g, " ")), ["Банковская гарантия", "BG-26/228", "2026-02-05", "-", "-", "2 400 000 000", "RUB"]);

  const multiPledgeHtml = sandbox.render({
    ...mixedCollateral,
    encumbrances: [],
    pledgeContracts: [
      { number: "ZL-MULTI-1", date: "2026-10-27", amount: 760000000, currency: "RUB", linkedContract: "CTR-2026-0228" },
      { number: "ZL-MULTI-1", date: "2026-11-27", allocated: 250000, currency: "RUB", linkedContract: "CTR-2026-0316" },
      { number: "ZL-MULTI-2", date: "2026-10-28" }
    ],
    pledgeContractNumber: "ZL-MULTI-1",
    pledgeContractDate: "2026-10-27"
  });
  assert.equal((multiPledgeHtml.match(/ZL-MULTI-1/g) || []).length, 2);
  assert.equal((multiPledgeHtml.match(/ZL-MULTI-2/g) || []).length, 1);
  assert.match(multiPledgeHtml, /2026-10-27/);
  assert.match(multiPledgeHtml, /2026-11-27/);
  assert.match(multiPledgeHtml, /2026-10-28/);
  assert.deepEqual(getCells(multiPledgeHtml, "ZL-MULTI-1", "2026-10-27"), ["Банковская гарантия", "BG-26/228", "2026-02-05", "ZL-MULTI-1", "2026-10-27", "2 400 000 000", "RUB"]);
  assert.deepEqual(getCells(multiPledgeHtml, "ZL-MULTI-1", "2026-11-27"), ["Кредит", "LC-26/316", "2026-03-18", "ZL-MULTI-1", "2026-11-27", "800 000 000", "RUB"]);
  assert.deepEqual(getCells(multiPledgeHtml, "ZL-MULTI-2", "2026-10-28"), ["-", "-", "-", "ZL-MULTI-2", "2026-10-28", "-", "-"]);

  const dateOnlyHtml = sandbox.render({
    ...mixedCollateral,
    contractIds: [],
    contractId: "",
    contractNumber: "",
    encumbrances: [],
    pledgeContracts: [{ number: "", date: "2026-10-29" }],
    pledgeContractNumber: "",
    pledgeContractDate: ""
  });
  const dateOnlyRow = Array.from(dateOnlyHtml.matchAll(/<tr>(.*?)<\/tr>/g), (match) => match[1])
    .find((candidate) => candidate.includes("<td>2026-10-29</td>"));
  assert.deepEqual(Array.from(dateOnlyRow.matchAll(/<td>(.*?)<\/td>/g), (match) => match[1]), ["-", "-", "-", "-", "2026-10-29", "-", "-"]);

  const linkedContract = contractFixture.contracts.find((contract) => contract.id === "CTR-2026-0228");
  linkedContract.limit = "";
  linkedContract.product = "Инвестиционный продукт";
  const pledgeAmountFallbackHtml = sandbox.render({
    ...mixedCollateral,
    contractIds: ["CTR-2026-0228"],
    encumbrances: [{ number: "ZL-USD", date: "2026-10-30", amount: 2000, currency: "USD", contract: "BG-26/228" }],
    pledgeContractNumber: "",
    pledgeContractDate: ""
  });
  assert.deepEqual(getCells(pledgeAmountFallbackHtml, "ZL-USD"), ["-", "BG-26/228", "2026-02-05", "ZL-USD", "2026-10-30", "2 000", "USD"]);
});

test("import template columns follow v8 and vary only by the selected collateral type", () => {
  const schemaSource = extractConstantSource("const FT_COLLATERAL_TYPE_OPTIONS = [", "const COLLATERAL_LEGACY_TYPE_FIELDS = [");
  const importConstants = extractConstantSource("const FT_COLLATERAL_IMPORT_BASE_COLUMNS = [", "function normalizeTaskStatus(status)");
  const sandbox = { COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога", LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы" };
  vm.runInNewContext(`${schemaSource}\n${importConstants}\nglobalThis.result = { base: FT_COLLATERAL_IMPORT_BASE_COLUMNS, specific: FT_COLLATERAL_IMPORT_TYPE_COLUMNS };`, sandbox);
  const expectedBase = [
    "Идентификатор в АБС", "Наименование", "Дополнительная информация", "Вид профильного идентификатора", "Профильный идентификатор объекта", "Статус объекта",
    "Залогодатель", "ИНН залогодателя", "Тип субъекта залогодателя", "Собственник", "ИНН собственника", "Тип субъекта собственника",
    "Номер кредитного договора / продукт заявки", "Дата кредитного договора", "Номер договора залога", "Дата договора залога", "Документ-основание", "Дата документа-основания",
    "Номер документа-основания", "Адрес / местонахождение"
  ];
  assert.deepEqual(Array.from(sandbox.result.base), expectedBase);
  assert.deepEqual(Array.from(sandbox.result.specific["Объекты недвижимости"]), ["Единица измерения", "S", "Кадастровый номер в пределах, кот находится объект"]);
  assert.deepEqual(Array.from(sandbox.result.specific["Транспортные средства, прицепы (полуприцепы)"]), ["Марка", "Модель", "Гос.номер", "Год выпуска", "Мощность, л.с.", "Объем двигателя, куб.м.", "Пробег/наработка"]);
  assert.deepEqual(Array.from(sandbox.result.specific["Оборудование"]), ["Марка", "Модель", "Год выпуска", "Производитель", "Инвентарный номер", "Дата ввода в эксплуатацию", "Первоначальная стоимость", "Остаточная стоимость"]);
  assert.deepEqual(Array.from(sandbox.result.specific["Животные"]), []);
});

test("import validation respects mandatory and conditional fields in table 2.26", () => {
  const importConstants = extractConstantSource("const FT_COLLATERAL_IMPORT_BASE_COLUMNS = [", "function normalizeTaskStatus(status)");
  const templateValueSource = extractConstantSource("function getImportTemplateValue(row, column)", "function getImportTemplateColumns(typeLabel)");
  const templateColumnsSource = extractConstantSource("function getImportTemplateColumns(typeLabel)", "function getImportExistingCollateral(row)");
  const profileOptionsSource = extractConstantSource("function getNewCollateralProfileIdentifierOptions(typeLabel)", "function getNewCollateralProfileSource(draft");
  const previewSource = extractConstantSource("function getImportPreviewStatus(row, context)", "function getImportPreviewRows()");
  const sandbox = {
    getCollateralTypeLabel: (item) => item.type,
    getImportExistingCollateral: () => null,
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    uniqueItems: (items) => [...new Set(items)]
  };
  vm.runInNewContext(`${importConstants}\n${templateValueSource}\n${templateColumnsSource}\n${profileOptionsSource}\n${previewSource}\nglobalThis.preview = getImportPreviewStatus;`, sandbox);

  const common = {
    name: "Объект из таблицы",
    additionalInfo: "Импорт из таблицы",
    owner: "ООО Сибирь",
    ownerInn: "5401234567",
    ownerSubjectType: "ЮЛ"
  };
  const vehicle = {
    ...common,
    type: "Транспортные средства, прицепы (полуприцепы)",
    identifierType: "VIN",
    profileIdentifier: "WVWZZZ1JZXW000001",
    year: "2022",
    powerHp: "150"
  };
  const equipment = {
    ...common,
    type: "Оборудование",
    identifierType: "Заводской номер",
    profileIdentifier: "EQ-2026-001",
    year: "2023"
  };

  assert.equal(sandbox.preview(vehicle, "registry").status, "Создать", "vehicle import must not demand optional/unavailable type transport, make or model");
  assert.equal(sandbox.preview(equipment, "registry").status, "Создать", "equipment import must not demand serial number/group absent from table 2.26");
  const equipmentWithoutOwnerData = { ...equipment, owner: "", ownerInn: "", ownerSubjectType: "" };
  assert.equal(sandbox.preview(equipmentWithoutOwnerData, "registry").status, "Создать", "owner fields are conditional in table 2.26");
  assert.match(sandbox.preview({ ...equipmentWithoutOwnerData, ownerInn: "5401234567" }, "registry").message, /заполните имя или наименование/i, "partial owner data must remain invalid");
  assert.match(sandbox.preview({ ...equipment, ownerSubjectType: "" }, "registry").message, /тип субъекта залогодателя/i, "subject type is mandatory when pledgor data is present");
  assert.match(sandbox.preview({ ...equipment, year: "" }, "registry").message, /Год выпуска/);
  assert.match(sandbox.preview({ ...vehicle, powerHp: "" }, "registry").message, /Мощность двигателя/);
});

test("v8 import row maps S to the user-confirmed property characteristic and retains its raw source", () => {
  const schemaSource = extractConstantSource("const FT_COLLATERAL_TYPE_OPTIONS = [", "const COLLATERAL_LEGACY_TYPE_FIELDS = [");
  const templateValueSource = extractConstantSource("function getImportTemplateValue(row, column)", "function getImportTemplateColumns(typeLabel)");
  const dateNormalizerSource = extractConstantSource("function normalizeNewCollateralDate(value)", "function getNewCollateralDraftValidationError(draft)");
  const profileOptionsSource = extractConstantSource("function getNewCollateralProfileIdentifierOptions(typeLabel)", "function isNewCollateralResidentialDraft(draft)");
  const dateFormatterSource = extractConstantSource("function formatProfileIdentifierDate(value)", "function getInspectionWorkabilityValue(collateral)");
  const createImportedSource = extractConstantSource("function createImportedCollateral(row, { id: providedId = \"\" } = {})", "function createDraftCollateralFromForm()");
  const collateralTypeLabel = (value) => ({ Недвижимость: "Объекты недвижимости" })[value] || value;
  const collateralTypeCode = (value) => ({ "Объекты недвижимости": "Недвижимость" })[value] || value;
  const sandbox = {
    state: { data: { collaterals: [], contracts: [] } },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    COLLATERAL_STATUS_OPTIONS: ["Новый", "В залоге", "Недействующий"],
    APPLICATION_DEAL_PRODUCT_TYPES: ["Кредит", "Лизинг", "Банковская гарантия"],
    getCollateralTypeLabel: (item) => collateralTypeLabel(item.type),
    getCollateralTypeCodeFromLabel: collateralTypeCode,
    getContractByNumber: () => null,
    getNextCollateralId: () => "COL-IMPORT-01",
    getNextMonthlyCollateralNumber: () => "col-102026-001",
    getNewCollateralProfileFieldLabels: (type) => type === "Объекты недвижимости" ? ["Кадастровый номер"] : [],
    getCollateralUnitDefault: () => "Квадратный метр (м²)",
    isAffirmativeValue: (value) => /^(да|true|1)$/i.test(String(value || "").trim()),
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    getRole: () => ({ user: "Тестовый пользователь" }),
    formatTaskHistoryDate: () => "28.10.2026 12:00",
    uniqueItems: (values) => [...new Set(values)]
  };
  const row = {
    type: "Недвижимость",
    identifierType: "Кадастровый номер",
    profileIdentifier: "54:35:000000:1234",
    name: "Квартира на Красном проспекте",
    owner: "ООО Сибирь",
    ownerInn: "5401234567",
    ownerSubjectType: "ЮЛ",
    ownerName: "ООО Сибирь",
    ownerIdn: "5401234567",
    fields: { S: "82.4", "Кадастровый номер в пределах, которого находится объект": "54:35:000000:100" },
    unit: "Квадратный метр (м²)",
    additionalInfo: "Квартира в жилом доме",
    address: "Новосибирская область, г. Новосибирск, Красный проспект, д. 10, кв. 25",
    basisDocument: { type: "Выписка ЕГРН", date: "27.10.2026", number: "ЕГРН-123" },
    pledgeContractNumber: "З-123/2026",
    pledgeContractDate: "27.10.2026"
  };
  vm.runInNewContext(`${schemaSource}\n${dateFormatterSource}\n${profileOptionsSource}\n${dateNormalizerSource}\n${templateValueSource}\n${createImportedSource}\nglobalThis.create = createImportedCollateral;`, sandbox);
  const collateral = sandbox.create(row);
  assert.equal(collateral.id, "COL-IMPORT-01");
  assert.equal(collateral.createdAt, "28.10.2026 12:00");
  assert.equal(collateral.profileIdentifier, "54:35:000000:1234");
  assert.equal(collateral.profileIdentifierType, "Кадастровый номер");
  assert.equal(collateral.fields["Кадастровый номер"], "54:35:000000:1234");
  assert.equal(collateral.fields["Площадь застройки, кв. м"], "82.4");
  assert.equal(Object.hasOwn(collateral.fields, "Площадь, кв. м"), false);
  assert.deepEqual(JSON.parse(JSON.stringify(collateral.sourceImportData)), { S: "82.4" });
  assert.equal(collateral.fields["Кадастровый номер в пределах, которого находится объект"], "54:35:000000:100");
  assert.equal(collateral.ftMainInfo["Единица измерения"], "Квадратный метр (м²)");
  assert.equal(collateral.ftMainInfo["Дополнительная информация"], "Квартира в жилом доме");
  assert.deepEqual(JSON.parse(JSON.stringify(collateral.basisDocument)), {
    type: "Выписка ЕГРН", date: "2026-10-27", number: "ЕГРН-123"
  });
  assert.deepEqual(JSON.parse(JSON.stringify(collateral.pledgors)), [{
    share: "", name: "ООО Сибирь", idn: "5401234567", subjectType: "ЮЛ", role: "Залогодатель и собственник", subjectCode: "5401234567"
  }]);
  assert.equal(collateral.address, row.address);
  assert.equal(collateral.addressFields["Адрес / место нахождения"], row.address);
  assert.equal(collateral.status, "Новый");
});

test("import dialog gates the file and preview on type and subtype selection", () => {
  const schemaSource = extractConstantSource("const FT_COLLATERAL_TYPE_OPTIONS = [", "const COLLATERAL_LEGACY_TYPE_FIELDS = [");
  const importConstants = extractConstantSource("const FT_COLLATERAL_IMPORT_BASE_COLUMNS = [", "function normalizeTaskStatus(status)");
  const importPreviewSource = extractConstantSource("function getImportPreviewRows()", "function normalizeTaskRecord(task)");
  const templateValueSource = extractConstantSource("function getImportTemplateValue(row, column)", "function getImportTemplateColumns(typeLabel)");
  const columnHelperSource = extractConstantSource("function getImportTemplateColumns(typeLabel)", "function getImportPreviewRows()");
  const modalSource = extractConstantSource("function renderImportCollateralsModal()", "function renderMobileInspectionModal()");
  const sandbox = {
    state: { modal: { context: "registry" }, data: { importRows: [], collaterals: [] } },
    COLLATERAL_GROUP_ATTRIBUTE: "Признак группы залога",
    LEGACY_COLLATERAL_GROUP_ATTRIBUTE: "Идентификационный код группы",
    FT_COLLATERAL_TYPE_OPTIONS: collateralTypes,
    getCollateralTypeCodeFromLabel: (type) => type,
    getCollateralTypeLabel: ({ type }) => ({ Недвижимость: "Объекты недвижимости" })[type] || type,
    getNewCollateralProfileIdentifierOptions: () => [{ label: "Кадастровый номер", group: "type", field: "Кадастровый номер" }],
    getNewCollateralSubtypeField: () => "Подвид залога",
    getCollateralEditableOptions: () => ["Помещения", "Здания"],
    isBlankFieldValue: (value) => value == null || String(value).trim() === "" || String(value).trim() === "-",
    normalizeProfileIdentifier: (value) => String(value || "").replace(/\s+/g, "").toLocaleLowerCase("ru-RU"),
    uniqueItems: (values) => [...new Set(values)],
    escapeHtml: (value) => String(value ?? ""),
    badge: (text) => `<span>${text}</span>`
  };
  vm.runInNewContext(`${schemaSource}\n${importConstants}\n${columnHelperSource}\n${templateValueSource}\n${importPreviewSource}\n${modalSource}\nglobalThis.render = renderImportCollateralsModal;`, sandbox);
  let html = sandbox.render();
  assert.match(html, /data-import-file disabled/);
  assert.match(html, /data-action="confirm-import" disabled/);

  sandbox.state.modal = { context: "registry", collateralType: "Объекты недвижимости" };
  html = sandbox.render();
  assert.match(html, /data-import-file disabled/);
  assert.match(html, /data-import-collateral-subtype/);

  sandbox.state.modal = { context: "registry", collateralType: "Объекты недвижимости", collateralSubtype: "Помещения" };
  html = sandbox.render();
  assert.doesNotMatch(html, /data-import-file disabled/);
  assert.match(html, /data-action="confirm-import" disabled/);

  sandbox.state.modal = { context: "registry", collateralType: "Объекты недвижимости", collateralSubtype: "Помещения", fileLoaded: true };
  sandbox.state.data.importRows = [{
    row: 2,
    type: "Недвижимость",
    subtype: "Помещения",
    name: "Квартира на Красном проспекте",
    additionalInfo: "Жилое помещение в многоквартирном доме",
    identifierType: "Кадастровый номер",
    profileIdentifier: "54:35:000000:1234",
    owner: "ООО Сибирь",
    ownerInn: "5401234567",
    ownerSubjectType: "ЮЛ",
    unit: "Квадратный метр (м²)",
    area: "82.4",
    address: "г. Новосибирск, Красный проспект, д. 10",
    status: "Создать",
    collateralId: "COL-IMPORT-02"
  }];
  html = sandbox.render();
  assert.match(html, /data-action="confirm-import" (?!disabled)/);
  assert.match(html, /<th>S<\/th>/);
  assert.doesNotMatch(html, /Признак группы залога|Признак включения в отчетные данные|ФИАС GUID|Почтовый индекс/);
});
