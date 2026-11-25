export const LEGACY_OBJECT_NUMBER_ALIASES = Object.freeze({
  "TSK-2026-1081": "tsk-01062026-001",
  "TSK-2026-0999": "tsk-05062026-001",
  "TSK-2026-1105": "tsk-06062026-001",
  "TSK-2026-1106": "tsk-07062026-001",
  "TSK-2026-1112": "tsk-08062026-001",
  "TSK-2026-1114": "tsk-10062026-001",
  "TSK-2026-1055": "tsk-10062026-002",
  "TSK-2026-1117": "tsk-11062026-001",
  "TSK-2026-1110": "tsk-11062026-002",
  "TSK-2026-1022": "tsk-11062026-003",
  "TSK-2026-1098": "tsk-12062026-001",
  "TSK-2026-1116": "tsk-12062026-002",
  "TSK-2026-1122": "tsk-12062026-003",
  "TSK-2026-1118": "tsk-13062026-001",
  "TSK-2026-1119": "tsk-13062026-002",
  "TSK-2026-1113": "tsk-14062026-001",
  "TSK-2026-0974": "tsk-14062026-002",
  "TSK-2026-1125": "tsk-14062026-003",
  "TSK-2026-1120": "tsk-14062026-004",
  "TSK-2026-1109": "tsk-15062026-001",
  "TSK-2026-1107": "tsk-15062026-002",
  "TSK-2026-1121": "tsk-15062026-003",
  "TSK-2026-1128": "tsk-15062026-004",
  "TSK-2026-1129": "tsk-15062026-005",
  "TSK-2026-1104": "tsk-15062026-006",
  "TSK-2026-1130": "tsk-16062026-001",
  "TSK-2026-1123": "tsk-16062026-002",
  "TSK-2026-0987": "tsk-16062026-003",
  "TSK-2026-1126": "tsk-16062026-004",
  "TSK-2026-1108": "tsk-16062026-005",
  "TSK-2026-1111": "tsk-16062026-006",
  "TSK-2026-1124": "tsk-16062026-007",
  "TSK-2026-1127": "tsk-16062026-008",
  "TSK-2026-1115": "tsk-16062026-009",
  "TSK-2026-1131": "tsk-16062026-010",
  "TSK-2026-1132": "tsk-16062026-011",
  "TSK-2026-1141": "tsk-17062026-001",
  "TSK-2026-1142": "tsk-17062026-002",
  "TSK-2026-1140": "tsk-17062026-003",
  "TSK-2026-1151": "tsk-18062026-001",
  "TSK-2026-1152": "tsk-18062026-002",
  "TSK-2026-1154": "tsk-18062026-003",
  "TSK-2026-1153": "tsk-18062026-004",
  "TSK-2026-1160": "tsk-19062026-001",
  "TSK-2026-1161": "tsk-19062026-002",
  "TSK-2026-1170": "tsk-25082026-001",
  "TSK-2026-1171": "tsk-25082026-002",
  "TSK-2026-1172": "tsk-25082026-003",
  "TSK-2026-1173": "tsk-25082026-004",
  "TSK-2026-1174": "tsk-25082026-005",
  "TSK-2026-1175": "tsk-25082026-006",
  "TSK-2026-1176": "tsk-25082026-007",
  "TSK-2026-1180": "tsk-20082026-001",
  "TSK-2026-1181": "tsk-21082026-001",
  "APP-2026-0417": "app-01062026-001",
  "APP-26/0417": "app-01062026-001",
  "APP-2026-0419": "app-05062026-001",
  "APP-26/0419": "app-05062026-001",
  "APP-2026-0418": "app-15062026-001",
  "APP-26/0418": "app-15062026-001",
  "APP-2026-0420": "app-19062026-001",
  "APP-26/0420": "app-19062026-001",
  "APP-2026-0421": "app-19062026-002",
  "APP-26/0421": "app-19062026-002",
  "APP-2026-0422": "app-25082026-001",
  "APP-26/0422": "app-25082026-001",
  "APP-2026-0423": "app-25082026-002",
  "APP-26/0423": "app-25082026-002"
});

const legacyTaskNumberPattern = /^tsk-(\d{8})-(\d{3})$/;
const monthlyTaskNumberPattern = /^([csrm])-(\d{4})-(\d{4})$/;
const legacyApplicationNumberPattern = /^app-(\d{8})-(\d{3})$/;
const applicationNumberPattern = /^app-(\d{4})-(\d{3})$/;
const collateralNumberPattern = /^col-(\d{4})-(\d{3})$/;

function formatMonthlyDateStamp(monthValue, yearValue, dayValue) {
  const month = Number(monthValue);
  const year = Number(yearValue);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Некорректный месяц в дате: ${monthValue}`);
  }
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError(`Некорректный год в дате: ${yearValue}`);
  }
  if (dayValue != null) {
    const day = Number(dayValue);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (!Number.isInteger(day) || day < 1 || day > daysInMonth) {
      throw new RangeError(`Некорректный день в дате: ${dayValue}`);
    }
  }
  return `${String(month).padStart(2, "0")}${String(yearValue).slice(-2)}`;
}

function getMonthlyDateStamp(value = new Date()) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new RangeError("Некорректная дата");
    return formatMonthlyDateStamp(value.getMonth() + 1, value.getFullYear(), value.getDate());
  }
  const text = String(value ?? "").trim();
  if (!text) return getMonthlyDateStamp(new Date());
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:([Tt]|\s+)(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(?:([Zz]|[+-]\d{2}:?\d{2}))?)?$/);
  if (isoDate) {
    validateMonthlyTime(isoDate, text);
    return formatMonthlyDateStamp(isoDate[2], isoDate[1], isoDate[3]);
  }
  const localizedDate = text.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/);
  if (localizedDate) {
    validateMonthlyTime(localizedDate, text, true);
    return formatMonthlyDateStamp(localizedDate[2], localizedDate[3], localizedDate[1]);
  }
  throw new RangeError(`Некорректная дата: ${text}`);
}

function validateMonthlyTime(match, originalValue, isLocalized = false) {
  const hourIndex = isLocalized ? 4 : 5;
  if (!match[hourIndex]) return;
  const hour = Number(match[hourIndex]);
  const minute = Number(match[hourIndex + 1]);
  const second = Number(match[hourIndex + 2] || 0);
  if (hour > 23 || minute > 59 || second > 59) {
    throw new RangeError(`Некорректное время в дате: ${originalValue}`);
  }
  if (!isLocalized) {
    const zone = match[9];
    if (zone && !/^[Zz]$/.test(zone)) {
      const [zoneHour, zoneMinute] = zone.slice(1).split(":").join("").match(/.{2}/g).map(Number);
      if (zoneHour > 14 || zoneMinute > 59 || (zoneHour === 14 && zoneMinute !== 0)) {
        throw new RangeError(`Некорректный часовой пояс в дате: ${originalValue}`);
      }
    }
  }
}

function getNextMonthlyNumber(prefix, pattern, records = [], createdAt = new Date(), fieldNames = ["id", "number"]) {
  const stamp = getMonthlyDateStamp(createdAt);
  let maxSequence = 0;
  (records || []).forEach((record) => {
    fieldNames.forEach((field) => {
      const match = String(record?.[field] || "").match(pattern);
      if (match?.[1] === stamp) maxSequence = Math.max(maxSequence, Number(match[2]));
    });
  });
  if (maxSequence >= 999) throw new RangeError(`Достигнут лимит ${prefix}-номеров за ${stamp}`);
  return `${prefix}-${stamp}-${String(maxSequence + 1).padStart(3, "0")}`;
}

export function getNextMonthlyApplicationNumber(records = [], createdAt = new Date()) {
  return getNextMonthlyNumber("app", applicationNumberPattern, records, createdAt);
}

export function getMonthlyTaskDateStamp(value = new Date()) {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = String(value.getFullYear()).slice(-2);
    return `${month}${year}`;
  }
  const text = String(value || "");
  const isoDate = text.match(/^(\d{4})-(\d{2})/);
  if (isoDate) return `${isoDate[2]}${isoDate[1].slice(-2)}`;
  const localizedDate = text.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (localizedDate) return `${localizedDate[2]}${localizedDate[3].slice(-2)}`;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return getMonthlyTaskDateStamp(parsed);
  return getMonthlyTaskDateStamp(new Date());
}

export function getTaskNumberPrefix(taskType) {
  const type = String(taskType || "").trim().toLowerCase();
  if (/оцен|переоцен/.test(type)) return "c";
  if (/осмотр|дефект|птс/.test(type)) return "s";
  if (/регистрац|постанов|замена залога|снятие обременения/.test(type)) return "r";
  if (/мониторинг|отчетност/.test(type)) return "m";
  throw new TypeError(`Не удалось определить префикс номера для типа задачи «${taskType || ""}»`);
}

export function getNextMonthlyTaskNumber(taskType, records = [], createdAt = new Date()) {
  const prefix = getTaskNumberPrefix(taskType);
  const stamp = getMonthlyTaskDateStamp(createdAt);
  let maxSequence = 0;
  (records || []).forEach((record) => {
    [record?.id, record?.number].forEach((value) => {
      const match = String(value || "").match(monthlyTaskNumberPattern);
      if (match?.[1] === prefix && match[2] === stamp) maxSequence = Math.max(maxSequence, Number(match[3]));
    });
  });
  if (maxSequence >= 9999) throw new RangeError(`Достигнут лимит ${prefix}-номеров за ${stamp}`);
  return `${prefix}-${stamp}-${String(maxSequence + 1).padStart(4, "0")}`;
}

export function getNextMonthlyCollateralNumber(records = [], createdAt = new Date()) {
  return getNextMonthlyNumber("col", collateralNumberPattern, records, createdAt, ["suzNumber", "collateralNumber"]);
}

export function normalizeCollateralSuzNumbers(collaterals = []) {
  const records = Array.isArray(collaterals) ? collaterals : [];
  const used = new Set();
  const originalNumbers = records.map((record) => String(record?.suzNumber || record?.collateralNumber || ""));
  const reserved = records.map((record) => {
    const candidate = String(record?.suzNumber || record?.collateralNumber || "");
    const candidateMatch = candidate.match(collateralNumberPattern);
    const createdStamp = getMonthlyDateStamp(record?.createdAt || new Date());
    if (!candidateMatch || Number(candidateMatch[2]) < 1 || candidateMatch[1] !== createdStamp || used.has(candidate)) return null;
    used.add(candidate);
    return candidate;
  });
  const missing = records
    .map((record, index) => ({ record, index }))
    .filter(({ index }) => !reserved[index])
    .sort((left, right) => String(left.record?.createdAt || "").localeCompare(String(right.record?.createdAt || ""))
      || String(left.record?.id || "").localeCompare(String(right.record?.id || ""))
      || left.index - right.index);
  missing.forEach(({ record }) => {
    record.suzNumber = getNextMonthlyCollateralNumber(records, record?.createdAt || new Date());
    used.add(record.suzNumber);
  });
  records.forEach((record, index) => {
    const oldNumber = originalNumbers[index];
    if (reserved[index]) record.suzNumber = reserved[index];
    if (Object.hasOwn(record, "collateralNumber")) record.collateralNumber = record.suzNumber;
    const isSystemIdentifier = record.profileIdentifierType === "Номер карточки залога"
      || !record.profileIdentifier
      || String(record.profileIdentifier) === oldNumber
      || String(record.profileIdentifier) === String(record.id || "");
    if (isSystemIdentifier) {
      record.profileIdentifier = record.suzNumber;
    }
  });
  return records;
}

export function getDailyDateStamp(value = new Date()) {
  if (value instanceof Date) {
    const pad = (part) => String(part).padStart(2, "0");
    return `${pad(value.getDate())}${pad(value.getMonth() + 1)}${value.getFullYear()}`;
  }
  const text = String(value || "");
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}${isoDate[2]}${isoDate[1]}`;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return getDailyDateStamp(parsed);
  return getDailyDateStamp(new Date());
}

export function getNextDailyObjectNumber(prefix, records = [], createdAt = new Date()) {
  const stamp = getDailyDateStamp(createdAt);
  const pattern = prefix === "tsk" ? legacyTaskNumberPattern : legacyApplicationNumberPattern;
  let maxSequence = 0;
  (records || []).forEach((record) => {
    [record?.id, record?.number].forEach((value) => {
      const match = String(value || "").match(pattern);
      if (match?.[1] === stamp) maxSequence = Math.max(maxSequence, Number(match[2]));
    });
  });
  if (maxSequence >= 999) throw new RangeError(`Достигнут лимит ${prefix}-номеров за ${stamp}`);
  return `${prefix}-${stamp}-${String(maxSequence + 1).padStart(3, "0")}`;
}

function getCreationSortKey(record, isTask) {
  const createdEvent = isTask
    ? (record?.history || []).find((event) => /создана задача|создана из задачи|задача создана/i.test(event.action || "") && event.date)
    : null;
  const createdAt = String(record?.createdAt || createdEvent?.date || "");
  const day = createdAt.slice(0, 10) || "9999-12-31";
  const eventDate = String(createdEvent?.date || "");
  const time = createdAt.slice(11, 16) || (eventDate.slice(0, 10) === day ? eventDate.slice(11, 16) : "00:00");
  return `${day} ${time}`;
}

function isSavedApplicationSeedCopy(record, seedRecord) {
  if (!record || !seedRecord) return false;
  if (record.screenshotFixtureKey && seedRecord.screenshotFixtureKey) {
    return record.screenshotFixtureKey === seedRecord.screenshotFixtureKey;
  }

  const savedCreatedAt = String(record.createdAt || "");
  const seedCreatedAt = String(seedRecord.createdAt || "");
  if (!savedCreatedAt || !seedCreatedAt || savedCreatedAt.slice(0, 10) !== seedCreatedAt.slice(0, 10)) return false;

  const identityFields = ["type", "subtype", "purpose", "initiator", "clientName", "inn"];
  for (const field of identityFields) {
    const savedValue = record[field];
    const seedValue = seedRecord[field];
    if (savedValue == null || seedValue == null || savedValue === "" || seedValue === "") continue;
    if (String(savedValue) !== String(seedValue)) return false;
  }

  return savedCreatedAt.slice(0, 16) === seedCreatedAt.slice(0, 16);
}

function buildLegacyReferenceReplacers(aliases) {
  return Object.entries(aliases)
    .filter(([oldValue, newValue]) => oldValue && oldValue !== newValue)
    .sort((a, b) => b[0].length - a[0].length)
    .flatMap(([oldValue, newValue]) => [...new Set([oldValue, encodeURIComponent(oldValue)])]
      .map((token) => {
        const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          pattern: new RegExp(`(?<![\\p{L}\\p{N}_])${escapedToken}(?![\\p{L}\\p{N}_])`, "giu"),
          replacement: newValue
        };
      }));
}

function replaceLegacyReferences(value, replacers) {
  if (typeof value === "string") {
    return replacers.reduce((result, { pattern, replacement }) =>
      result.replace(pattern, () => replacement), value);
  }
  if (Array.isArray(value)) return value.map((item) => replaceLegacyReferences(item, replacers));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [replaceLegacyReferences(key, replacers), replaceLegacyReferences(item, replacers)]));
  }
  return value;
}

function normalizeTaskRecordNumbers(records, seedAliases = {}, reservedRecords = []) {
  const pending = [];
  const assigned = [];
  const aliases = {};
  const used = new Set();

  (records || []).forEach((record, index) => {
    const oldId = String(record?.id || "");
    const oldNumber = String(record?.number || "");
    const taskType = record?.type || "";
    const prefix = getTaskNumberPrefix(taskType);
    const stamp = getMonthlyTaskDateStamp(record?.createdAt || getCreationSortKey(record, true));
    const knownSeedId = seedAliases[oldId] || seedAliases[oldNumber] || "";
    const candidates = [oldId, oldNumber, knownSeedId];
    const validNumber = candidates.find((value) => {
      const match = String(value || "").match(monthlyTaskNumberPattern);
      return match && match[1] === prefix && match[2] === stamp && !used.has(value);
    });

    if (!validNumber) {
      pending.push({ record, index, oldId, oldNumber, taskType });
      return;
    }
    record.id = validNumber;
    if (oldNumber && oldNumber === oldId) record.number = validNumber;
    if (oldId && oldId !== validNumber) aliases[oldId] = validNumber;
    if (oldNumber && oldNumber !== validNumber) aliases[oldNumber] = validNumber;
    used.add(validNumber);
    assigned.push(record);
  });

  pending.sort((left, right) => getCreationSortKey(left.record, true).localeCompare(getCreationSortKey(right.record, true)) || left.index - right.index);
  pending.forEach(({ record, oldId, oldNumber, taskType }) => {
    const nextNumber = getNextMonthlyTaskNumber(taskType, [...assigned, ...(reservedRecords || [])], record?.createdAt || new Date());
    record.id = nextNumber;
    if (oldNumber && oldNumber === oldId) record.number = nextNumber;
    if (oldId && oldId !== nextNumber) aliases[oldId] = nextNumber;
    if (oldNumber && oldNumber !== nextNumber) aliases[oldNumber] = nextNumber;
    assigned.push(record);
  });
  return aliases;
}

function normalizeApplicationRecordNumbers(records, seedRecords = [], aliases = {}, ambiguousSeedNumbers = new Set()) {
  const pending = [];
  const assigned = [];
  const assignedAliases = {};
  const used = new Set();
  const seedsByNumber = new Map();
  (seedRecords || []).forEach((seedRecord) => {
    [seedRecord?.id, seedRecord?.number].forEach((number) => {
      if (number) seedsByNumber.set(String(number), seedRecord);
    });
  });

  (records || []).forEach((record, index) => {
    const oldId = String(record?.id || "");
    const oldNumber = String(record?.number || "");
    const stamp = getMonthlyDateStamp(record?.createdAt || new Date());
    const candidates = [oldId, oldNumber, aliases[oldId], aliases[oldNumber]];
    const validNumber = candidates.find((value) => {
      const match = String(value || "").match(applicationNumberPattern);
      if (!match || Number(match[2]) < 1 || match[1] !== stamp || used.has(value)) return false;
      const seedRecord = seedsByNumber.get(String(value));
      return !seedRecord || isSavedApplicationSeedCopy(record, seedRecord);
    });

    if (!validNumber) {
      const ambiguousReferences = [oldId, oldNumber].filter((value) => {
        const seedRecord = seedsByNumber.get(value);
        return seedRecord && !isSavedApplicationSeedCopy(record, seedRecord);
      });
      ambiguousReferences.forEach((value) => ambiguousSeedNumbers.add(value));
      pending.push({ record, index, oldId, oldNumber, ambiguousReferences });
      return;
    }
    record.id = validNumber;
    record.number = validNumber;
    if (oldId && oldId !== validNumber) assignedAliases[oldId] = validNumber;
    if (oldNumber && oldNumber !== validNumber) assignedAliases[oldNumber] = validNumber;
    used.add(validNumber);
    assigned.push(record);
  });

  pending.sort((left, right) => getCreationSortKey(left.record, false).localeCompare(getCreationSortKey(right.record, false)) || left.index - right.index);
  pending.forEach(({ record, oldId, oldNumber, ambiguousReferences }) => {
    const nextNumber = getNextMonthlyApplicationNumber([...(seedRecords || []), ...assigned], record?.createdAt || new Date());
    record.id = nextNumber;
    record.number = nextNumber;
    if (oldId && oldId !== nextNumber && !ambiguousReferences.includes(oldId)) assignedAliases[oldId] = nextNumber;
    if (oldNumber && oldNumber !== nextNumber && !ambiguousReferences.includes(oldNumber)) assignedAliases[oldNumber] = nextNumber;
    assigned.push(record);
    used.add(nextNumber);
  });

  return assignedAliases;
}

function remapAmbiguousApplicationTaskLinks(savedState, originalApplications, ambiguousNumbers, taskAliases) {
  if (!ambiguousNumbers.size) return;
  const applications = Array.isArray(savedState.applications) ? savedState.applications : [];
  const tasks = Array.isArray(savedState.tasks) ? savedState.tasks : [];
  applications.forEach((application, index) => {
    const original = originalApplications[index];
    const oldNumbers = [original?.id, original?.number]
      .map((value) => String(value || ""))
      .filter((value) => ambiguousNumbers.has(value));
    if (!oldNumbers.length || !application?.id) return;
    const linkedTaskIds = new Set((original?.taskIds || []).flatMap((id) => {
      const oldId = String(id || "");
      return [oldId, String(taskAliases[oldId] || oldId)];
    }));
    if (!linkedTaskIds.size) return;
    const referenceAliases = Object.fromEntries(oldNumbers.map((number) => [number, application.id]));
    const replacers = buildLegacyReferenceReplacers(referenceAliases);
    tasks.forEach((task, taskIndex) => {
      if (!linkedTaskIds.has(String(task?.id || ""))) return;
      tasks[taskIndex] = replaceLegacyReferences(task, replacers);
    });
  });
}

function normalizeSavedCollateralNumbers(records, seedRecords = []) {
  const saved = Array.isArray(records) ? records : [];
  const seedById = new Map((seedRecords || []).map((record) => [String(record?.id || ""), record]));
  const savedAliases = {};
  const additional = [];

  saved.forEach((record) => {
    const oldNumber = String(record?.suzNumber || record?.collateralNumber || "");
    const seedRecord = seedById.get(String(record?.id || ""));
    if (!seedRecord) {
      additional.push(record);
      return;
    }
    const nextNumber = String(seedRecord.suzNumber || seedRecord.collateralNumber || "");
    record.suzNumber = nextNumber;
    if (Object.hasOwn(record, "collateralNumber")) record.collateralNumber = nextNumber;
    if (record.profileIdentifierType === "Номер карточки залога"
      || !record.profileIdentifier
      || String(record.profileIdentifier) === oldNumber
      || String(record.profileIdentifier) === String(record.id || "")) {
      record.profileIdentifier = nextNumber;
    }
    if (oldNumber && nextNumber && oldNumber !== nextNumber) savedAliases[oldNumber] = nextNumber;
  });

  if (additional.length) {
    const originalNumbers = new Map(additional.map((record) => [String(record?.id || ""), String(record?.suzNumber || record?.collateralNumber || "")]));
    const combined = [
      ...(seedRecords || []).map((record) => ({ ...record })),
      ...additional
    ];
    normalizeCollateralSuzNumbers(combined);
    const normalizedById = new Map(combined.map((record) => [String(record?.id || ""), record]));
    additional.forEach((record) => {
      const oldNumber = String(record?.suzNumber || record?.collateralNumber || "");
      const normalized = normalizedById.get(String(record?.id || ""));
      if (!normalized) return;
      const previousNumber = originalNumbers.get(String(record?.id || "")) || oldNumber;
      record.suzNumber = normalized.suzNumber;
      if (Object.hasOwn(record, "collateralNumber")) record.collateralNumber = record.suzNumber;
      if (record.profileIdentifierType === "Номер карточки залога"
        || !record.profileIdentifier
        || String(record.profileIdentifier) === oldNumber
        || String(record.profileIdentifier) === String(record.id || "")) {
        record.profileIdentifier = record.suzNumber;
      }
      if (previousNumber && record.suzNumber && previousNumber !== record.suzNumber) savedAliases[previousNumber] = record.suzNumber;
    });
  }
  return savedAliases;
}

function updateAliasTargets(aliases, taskAliases) {
  Object.keys(aliases).forEach((key) => {
    let target = aliases[key];
    const visited = new Set();
    while (taskAliases[target] && !visited.has(target)) {
      visited.add(target);
      target = taskAliases[target];
    }
    aliases[key] = target;
  });
}

export function normalizeSeedTaskNumbers(data = {}) {
  const taskAliases = normalizeTaskRecordNumbers(data.tasks || []);
  const applicationAliases = normalizeApplicationRecordNumbers(data.applications || []);
  const aliases = { ...LEGACY_OBJECT_NUMBER_ALIASES, ...taskAliases, ...applicationAliases };
  updateAliasTargets(aliases, { ...taskAliases, ...applicationAliases });
  const normalized = replaceLegacyReferences(data, buildLegacyReferenceReplacers(aliases));
  Object.keys(data).forEach((key) => delete data[key]);
  Object.assign(data, normalized);
  return aliases;
}

function migrateRecordNumbers(records, seedRecords, prefix, aliases, isTask) {
  const pattern = prefix === "tsk" ? legacyTaskNumberPattern : applicationNumberPattern;
  const pending = [];
  const assigned = [];
  const assignedAliases = {};

  (records || []).forEach((record, index) => {
    const oldId = String(record?.id || "");
    const oldNumber = String(record?.number || "");
    const currentNumber = [oldId, oldNumber].find((value) => pattern.test(value));
    const knownNumber = [oldId, oldNumber].map((value) => aliases[value]).find(Boolean);
    const nextNumber = currentNumber || knownNumber;
    if (!nextNumber) {
      pending.push({ record, index, oldId, oldNumber });
      return;
    }
    record.id = nextNumber;
    if (!isTask) record.number = nextNumber;
    if (oldId && oldId !== nextNumber) assignedAliases[oldId] = nextNumber;
    if (oldNumber && oldNumber !== nextNumber) assignedAliases[oldNumber] = nextNumber;
    assigned.push(record);
  });

  pending.sort((a, b) => getCreationSortKey(a.record, isTask).localeCompare(getCreationSortKey(b.record, isTask)) || a.index - b.index);
  pending.forEach(({ record, oldId, oldNumber }) => {
    const nextNumber = prefix === "app"
      ? getNextMonthlyApplicationNumber([...(seedRecords || []), ...assigned], record.createdAt || new Date())
      : getNextDailyObjectNumber(prefix, [...(seedRecords || []), ...assigned], record.createdAt || new Date());
    record.id = nextNumber;
    if (!isTask) record.number = nextNumber;
    if (oldId) assignedAliases[oldId] = nextNumber;
    if (oldNumber) assignedAliases[oldNumber] = nextNumber;
    assigned.push(record);
  });
  return assignedAliases;
}

export function migrateSavedObjectNumbers(savedState, seedData = {}, seedTaskAliases = {}) {
  const defaultAliases = {
    ...LEGACY_OBJECT_NUMBER_ALIASES,
    ...seedTaskAliases
  };
  if (!savedState || typeof savedState !== "object" || Object.keys(savedState).length === 0) {
    return { state: savedState || {}, aliases: defaultAliases, changed: false };
  }
  const aliases = {
    ...defaultAliases,
    ...(savedState.legacyObjectAliases || {})
  };
  const numberingVersion = Number(savedState.numberingVersion) || 0;
  if (numberingVersion >= 4) {
    updateAliasTargets(aliases, seedTaskAliases);
    return { state: savedState, aliases, changed: false };
  }

  const savedTasks = Array.isArray(savedState.tasks) ? savedState.tasks : [];
  const savedApplications = Array.isArray(savedState.applications) ? savedState.applications : [];
  let migratedState = savedState;
  if (numberingVersion < 1) {
    Object.assign(aliases, migrateRecordNumbers(savedTasks, seedData.tasks, "tsk", aliases, true));
    Object.assign(aliases, migrateRecordNumbers(savedApplications, seedData.applications, "app", aliases, false));
    migratedState = replaceLegacyReferences(savedState, buildLegacyReferenceReplacers(aliases));
    migratedState.numberingVersion = 1;
  }

  const taskAliases = normalizeTaskRecordNumbers(migratedState.tasks || [], seedTaskAliases, seedData.tasks || []);
  Object.assign(aliases, taskAliases);
  const originalSavedApplications = (migratedState.applications || []).map((application) => ({
    id: application?.id,
    number: application?.number,
    taskIds: Array.isArray(application?.taskIds) ? [...application.taskIds] : []
  }));
  const ambiguousApplicationNumbers = new Set();
  const applicationAliases = normalizeApplicationRecordNumbers(
    migratedState.applications || [],
    seedData.applications || [],
    aliases,
    ambiguousApplicationNumbers
  );
  remapAmbiguousApplicationTaskLinks(migratedState, originalSavedApplications, ambiguousApplicationNumbers, taskAliases);
  Object.assign(aliases, applicationAliases);
  const collateralAliases = normalizeSavedCollateralNumbers(
    migratedState.collaterals || [],
    seedData.collaterals || []
  );
  Object.assign(aliases, collateralAliases);
  updateAliasTargets(aliases, { ...taskAliases, ...applicationAliases, ...collateralAliases });
  const fullyMigratedState = replaceLegacyReferences(migratedState, buildLegacyReferenceReplacers(aliases));
  fullyMigratedState.numberingVersion = 4;
  fullyMigratedState.legacyObjectAliases = aliases;
  return { state: fullyMigratedState, aliases, changed: true };
}
