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

const taskNumberPattern = /^tsk-(\d{8})-(\d{3})$/;
const applicationNumberPattern = /^app-(\d{8})-(\d{3})$/;

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
  const pattern = prefix === "tsk" ? taskNumberPattern : applicationNumberPattern;
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

function migrateRecordNumbers(records, seedRecords, prefix, aliases, isTask) {
  const pattern = prefix === "tsk" ? taskNumberPattern : applicationNumberPattern;
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
    const nextNumber = getNextDailyObjectNumber(prefix, [...(seedRecords || []), ...assigned], record.createdAt || new Date());
    record.id = nextNumber;
    if (!isTask) record.number = nextNumber;
    if (oldId) assignedAliases[oldId] = nextNumber;
    if (oldNumber) assignedAliases[oldNumber] = nextNumber;
    assigned.push(record);
  });
  return assignedAliases;
}

export function migrateSavedObjectNumbers(savedState, seedData = {}) {
  if (!savedState || typeof savedState !== "object" || Object.keys(savedState).length === 0) {
    return { state: savedState || {}, aliases: { ...LEGACY_OBJECT_NUMBER_ALIASES }, changed: false };
  }
  const aliases = {
    ...LEGACY_OBJECT_NUMBER_ALIASES,
    ...(savedState.legacyObjectAliases || {})
  };
  if (Number(savedState.numberingVersion) >= 1) return { state: savedState, aliases, changed: false };

  const savedTasks = Array.isArray(savedState.tasks) ? savedState.tasks : [];
  const savedApplications = Array.isArray(savedState.applications) ? savedState.applications : [];
  Object.assign(aliases, migrateRecordNumbers(savedTasks, seedData.tasks, "tsk", aliases, true));
  Object.assign(aliases, migrateRecordNumbers(savedApplications, seedData.applications, "app", aliases, false));

  const migratedState = replaceLegacyReferences(savedState, buildLegacyReferenceReplacers(aliases));
  migratedState.numberingVersion = 1;
  migratedState.legacyObjectAliases = aliases;
  return { state: migratedState, aliases, changed: true };
}
