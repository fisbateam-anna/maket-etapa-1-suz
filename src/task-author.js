export function resolveTaskAuthorName(task, { application, collateral, employees = [] } = {}) {
  const technicalTokens = new Set([
    "system", "система", "системный", "системная", "пользователь", "user", "service", "account", "integration",
    "worker", "robot", "bot", "batch", "automation", "scheduler", "process", "workflow", "pipeline", "daemon",
    "server", "job", "task", "api", "db", "ручная", "инициация", "автоматический", "автоматическая", "автоматическое",
    "процесс", "сервис", "служебный", "профиль", "конвейер", "планировщик", "абс", "триггер", "регламент",
    "расписание", "маркетплейс", "циан", "авито", "авто", "email", "почтовый", "сервер", "ао", "ооо", "пао", "зао", "ип"
  ]);
  const humanName = (value) => {
    const name = String(value || "").trim();
    const normalized = name.toLocaleLowerCase("ru-RU");
    const tokens = normalized.match(/[\p{L}\p{N}]+/gu) || [];
    const originalTokens = name.match(/[\p{L}\p{N}]+/gu) || [];
    const nameTokens = originalTokens.filter((token) => /\p{L}/u.test(token));
    const hasTechnicalToken = tokens.some((token) => technicalTokens.has(token));
    const hasPersonNameShape = nameTokens.length >= 2
      && nameTokens.length === originalTokens.length
      && nameTokens.every((token) => token[0] === token[0].toLocaleUpperCase("ru-RU"));
    return hasPersonNameShape && !hasTechnicalToken ? name : "";
  };
  const firstHuman = (values) => values.map(humanName).find(Boolean) || "";

  if (task?.createdFromApplicationAutomatically) {
    const applicationInitiator = humanName(application?.initiator);
    if (applicationInitiator) return applicationInitiator;
  }

  const creationUser = (task?.history || [])
    .find((event) => /создана задача|задача создана|создание задачи/i.test(String(event.action || "")))
    ?.user;
  return firstHuman([
    task?.author,
    task?.createdBy,
    task?.initiator,
    creationUser,
    collateral?.responsible,
    task?.assignee,
    employees[0]
  ]) || "-";
}
