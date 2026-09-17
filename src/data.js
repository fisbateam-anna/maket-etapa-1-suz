export const navItems = [
  { id: "tasksEvaluation", label: "Оценка", path: "/app/tasks/evaluation", permission: "evalTaskView" },
  { id: "tasksInspection", label: "Осмотр", path: "/app/tasks/inspection", permission: "inspectTaskView" },
  { id: "tasksRegistration", label: "Регистрация", path: "/app/tasks/registration", permission: "regTaskView" },
  { id: "applications", label: "Заявки", path: "/app/applications", permission: "appRegView" },
  { id: "collaterals", label: "Залоги", path: "/app/collaterals", permission: "collateralView" }
];

export const roles = [
  {
    id: "evaluationManager",
    label: "Руководитель оценки",
    user: "Алексей Соколов",
    department: "Управление оценки залогов",
    menu: ["tasksEvaluation", "tasksInspection", "tasksRegistration", "applications", "collaterals"],
    permissions: {
      appRegView: true,
      collateralView: true,
      evalTaskView: true,
      inspectTaskView: true,
      regTaskView: true,
      appCreateEdit: true,
      collateralEdit: false,
      evalTaskApprove: true,
      inspectTaskApprove: false,
      docDelete: true,
      createTask: true,
      editCollateral: false,
      completeTask: false,
      returnTask: true,
      reassign: true,
      reports: false,
      admin: false,
      print: true
    }
  },
  {
    id: "initiator",
    label: "Инициатор заявки",
    user: "Анна Кузнецова",
    department: "Кредитующее подразделение",
    menu: ["applications"],
    permissions: {
      appRegView: true,
      collateralView: false,
      evalTaskView: false,
      inspectTaskView: false,
      regTaskView: false,
      appCreateEdit: true,
      collateralEdit: false,
      evalTaskApprove: false,
      inspectTaskApprove: false,
      docDelete: false,
      createTask: true,
      editCollateral: false,
      completeTask: false,
      returnTask: false,
      reassign: false,
      reports: false,
      admin: false,
      print: true
    }
  },
  {
    id: "verifier",
    label: "Верификатор",
    user: "Мария Петрова",
    department: "Управление оценки залогов",
    menu: ["tasksEvaluation", "tasksInspection", "applications", "collaterals"],
    permissions: {
      appRegView: true,
      collateralView: true,
      evalTaskView: true,
      inspectTaskView: true,
      regTaskView: false,
      appCreateEdit: false,
      collateralEdit: false,
      evalTaskApprove: false,
      inspectTaskApprove: false,
      docDelete: false,
      createTask: false,
      editCollateral: false,
      completeTask: true,
      returnTask: true,
      reassign: false,
      reports: false,
      admin: false,
      print: true
    }
  },
  {
    id: "appraiser",
    label: "Оценщик",
    user: "Дмитрий Орлов",
    department: "Управление оценки залогов",
    menu: ["tasksEvaluation", "collaterals"],
    permissions: {
      appRegView: false,
      collateralView: true,
      evalTaskView: true,
      inspectTaskView: false,
      regTaskView: false,
      appCreateEdit: false,
      collateralEdit: false,
      evalTaskApprove: false,
      inspectTaskApprove: false,
      docDelete: false,
      createTask: false,
      editCollateral: false,
      completeTask: true,
      returnTask: true,
      reassign: false,
      reports: false,
      admin: false,
      print: true
    }
  },
  {
    id: "inspector",
    label: "Специалист осмотра / мониторинга",
    user: "Павел Смирнов",
    department: "Управление осмотра и мониторинга",
    menu: ["tasksInspection", "collaterals"],
    permissions: {
      appRegView: false,
      collateralView: true,
      evalTaskView: false,
      inspectTaskView: true,
      regTaskView: false,
      appCreateEdit: false,
      collateralEdit: false,
      evalTaskApprove: false,
      inspectTaskApprove: false,
      docDelete: false,
      createTask: false,
      editCollateral: false,
      completeTask: true,
      returnTask: true,
      reassign: false,
      reports: false,
      admin: false,
      print: true
    }
  },
  {
    id: "registrar",
    label: "Регистратор",
    user: "Елена Морозова",
    department: "Управление регистрации залогов",
    menu: ["tasksRegistration", "collaterals"],
    permissions: {
      appRegView: false,
      collateralView: true,
      evalTaskView: false,
      inspectTaskView: false,
      regTaskView: true,
      appCreateEdit: false,
      collateralEdit: false,
      evalTaskApprove: false,
      inspectTaskApprove: false,
      docDelete: false,
      createTask: false,
      editCollateral: false,
      completeTask: true,
      returnTask: true,
      reassign: false,
      reports: false,
      admin: false,
      print: true
    }
  },
  {
    id: "inspectionManager",
    label: "Руководитель осмотра / мониторинга",
    user: "Сергей Иванов",
    department: "Управление осмотра и мониторинга",
    menu: ["tasksInspection", "applications", "collaterals"],
    permissions: {
      appRegView: true,
      collateralView: true,
      evalTaskView: false,
      inspectTaskView: true,
      regTaskView: false,
      appCreateEdit: true,
      collateralEdit: true,
      evalTaskApprove: false,
      inspectTaskApprove: true,
      docDelete: true,
      createTask: true,
      editCollateral: true,
      completeTask: false,
      returnTask: true,
      reassign: true,
      reports: false,
      admin: false,
      print: true
    }
  }
];

export const employees = [
  "Анна Кузнецова",
  "Дмитрий Орлов",
  "Павел Смирнов",
  "Мария Петрова",
  "Алексей Соколов",
  "Елена Морозова"
];

export const taskTypes = [
  "Первичный осмотр",
  "Повторный осмотр",
  "Дефектовка",
  "Единичная переоценка",
  "Списочная переоценка",
  "Плановый мониторинг",
  "Внеплановый мониторинг",
  "Регистрация залога"
];

export const riskNames = [
  "Истечение страховки",
  "Окончание срока оценки",
  "Падение стоимости",
  "Ухудшение LTV",
  "Статус имущества",
  "Судебные ограничения",
  "Двойной залог",
  "Арест имущества"
];

export const taskSourceChannels = [
  {
    id: "manual",
    name: "Создание заявок вручную",
    stage: "MVP1",
    status: "Активен",
    owner: "Сотрудник залогового подразделения",
    trigger: "Кнопка Создать заявку в АРМ",
    flow: ["Ввод реквизитов заявки", "Добавление залогов", "Прикрепление документов", "Передача заявки в работу залоговой службе"]
  },
  {
    id: "excel",
    name: "Импорт залогов из Excel",
    stage: "MVP1",
    status: "Активен",
    owner: "Сотрудник залогового подразделения",
    trigger: "Загрузка шаблона до 20 колонок",
    flow: ["Проверка строк", "Создание или обновление карточки залога", "Запросы во внешние источники", "Протокол ошибок"]
  }
];

export const printFormCatalog = [
  { id: "pledge-kit-mvp1", stage: "MVP1", name: "Комплект печатных форм по залогу", pages: "до 20", params: "до 200", status: "Доступен", owner: "Залоговый модуль" },
  { id: "expert-conclusion", stage: "MVP1", name: "Экспертное заключение", pages: "1-3", params: "до 40", status: "Доступен", owner: "Карточка задачи" }
];

export const migrationBatches = [];

const risks = (levels) =>
  riskNames.map((name, index) => ({
    name,
    level: levels[index] || "ok",
    source:
      levels[index] === "critical"
        ? "Внешний источник"
        : levels[index] === "warn"
          ? "Регламентный контроль"
          : "Проверка без замечаний"
  }));


const buildDemoAutoFleetCollaterals = () => [
  { id: "COL-020", model: "КАМАЗ 54901", year: "2023", plate: "Н 201 НН 152", vin: "XTC549010P0001201", market: 640000000, risk: 28, appraisal: "Действует", appraisalDue: "2026-10-15", insurance: "Оплачена", insuranceDue: "2026-12-15", mileage: "72 400 км", condition: "Исправен", evalDate: "2026-04-15", evalDoc: true },
  { id: "COL-021", model: "КАМАЗ 54901", year: "2022", plate: "Н 202 НН 152", vin: "XTC549010N0001202", market: 590000000, risk: 36, appraisal: "Действует", appraisalDue: "2026-09-28", insurance: "Оплачена", insuranceDue: "2026-11-30", mileage: "118 000 км", condition: "Исправен, требуется плановое ТО", evalDate: "2026-03-28", evalDoc: true },
  { id: "COL-022", model: "Volvo FH 460", year: "2021", plate: "Н 203 НН 152", vin: "YV2RTY0A1MB901203", market: 720000000, risk: 48, appraisal: "Истекает", appraisalDue: "2026-07-02", insurance: "Истекает", insuranceDue: "2026-06-26", mileage: "154 300 км", condition: "Рабочее, требуется фото шин", evalDate: "2026-01-02", evalDoc: true },
  { id: "COL-023", model: "MAN TGX 18.440", year: "2020", plate: "Н 204 НН 152", vin: "WMA06XZZ5LM901204", market: 515000000, risk: 63, appraisal: "Истекает", appraisalDue: "2026-07-10", insurance: "Оплачена", insuranceDue: "2026-10-10", mileage: "221 900 км", condition: "Рабочее, есть замечания по кузову", evalDate: "2025-12-10", evalDoc: false },
  { id: "COL-024", model: "Scania R450", year: "2022", plate: "Н 205 НН 152", vin: "YS2R4X200N1901205", market: 760000000, risk: 33, appraisal: "Действует", appraisalDue: "2026-11-18", insurance: "Оплачена", insuranceDue: "2026-11-18", mileage: "96 700 км", condition: "Исправен", evalDate: "2026-05-18", evalDoc: true },
  { id: "COL-025", model: "Isuzu NQR90", year: "2021", plate: "Н 206 НН 152", vin: "JALC4W168M7001206", market: 365000000, risk: 41, appraisal: "Действует", appraisalDue: "2026-08-30", insurance: "Оплачена", insuranceDue: "2026-09-30", mileage: "142 000 км", condition: "Исправен", evalDate: "2026-02-28", evalDoc: true },
  { id: "COL-026", model: "ГАЗон Next", year: "2020", plate: "Н 207 НН 152", vin: "X96C41R33L001207", market: 245000000, risk: 58, appraisal: "Просрочена", appraisalDue: "2026-04-20", insurance: "Не оплачена", insuranceDue: "2026-05-20", mileage: "188 600 км", condition: "Требуется осмотр после ремонта", evalDate: "2025-04-20", evalDoc: false },
  { id: "COL-027", model: "Ford Transit", year: "2022", plate: "Н 208 НН 152", vin: "WF0EXXTTRENA01208", market: 310000000, risk: 24, appraisal: "Действует", appraisalDue: "2026-12-05", insurance: "Оплачена", insuranceDue: "2026-12-05", mileage: "84 500 км", condition: "Исправен", evalDate: "2026-06-05", evalDoc: true }
].map((item, index) => {
  const pledge = Math.round(item.market * (item.risk >= 55 ? 0.68 : item.risk >= 45 ? 0.74 : 0.78));
  return {
    id: item.id,
    type: "Автотранспорт",
    description: `${item.model}, ${item.year} г., гос. номер ${item.plate}`,
    clientName: "ООО Волга Логистик",
    clientId: "525 944 1009",
    clientType: "ЮЛ",
    gsz: "ГСЗ Волга Логистик",
    region: "Нижний Новгород",
    address: "Нижний Новгород, ул. Ленина, автопарк 12",
    contractIds: ["CTR-2026-0192"],
    marketValue: item.market,
    pledgeValue: pledge,
    allocatedValue: pledge,
    appraisalStatus: item.appraisal,
    appraisalDue: item.appraisalDue,
    insuranceStatus: item.insurance,
    insuranceDue: item.insuranceDue,
    status: "В залоге",
    crossPledge: false,
    responsible: "Мария Петрова",
    updatedAt: "2026-06-16 11:20",
    source: "Конвейер",
    riskScore: item.risk,
    riskState: item.risk >= 55 ? "Требует внимания" : item.risk >= 45 ? "Удовлетворительное" : "Хорошее",
    risks: risks(item.risk >= 55 ? ["warn", "critical", "warn", "warn", "ok", "ok", "ok", "ok"] : item.risk >= 45 ? ["warn", "warn", "ok", "warn", "ok", "ok", "ok", "ok"] : ["ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok"]),
    fields: {
      "VIN": item.vin,
      "Госномер": item.plate,
      "Марка/модель": item.model,
      "Год выпуска": item.year,
      "Пробег": item.mileage,
      "Состояние": item.condition,
      "Место хранения": "Автопарк заемщика"
    },
    monitoring: {
      lastInspection: index % 3 === 0 ? "2026-04-22" : "2026-05-18",
      inspector: "Алексей Соколов",
      condition: item.condition,
      nextInspection: index % 3 === 0 ? "2026-06-24" : "2026-08-18",
      periodicity: "Раз в два месяца",
      completed: index % 3 !== 0,
      schedule: [
        { date: index % 3 === 0 ? "2026-04-22" : "2026-05-18", type: "Плановый", result: item.condition, inspector: "Алексей Соколов", status: "Завершен" },
        { date: index % 3 === 0 ? "2026-06-24" : "2026-08-18", type: "Повторный", result: "Ожидается", inspector: "Не назначен", status: "Запланирован" }
      ]
    },
    evaluations: [
      { date: item.evalDate, appraiser: "АвтоЭксперт Плюс", market: item.market, pledge, method: "Сравнительный", status: item.appraisal }
    ],
    insurance: {
      company: "РЕСО-Гарантия",
      policy: `GI-AUTO-26-${item.id.replace("COL-", "")}`,
      from: "2025-12-01",
      to: item.insuranceDue,
      amount: pledge,
      premiumStatus: item.insurance === "Не оплачена" ? "Не оплачена" : "Оплачена",
      source: "АБС"
    },
    encumbrances: [
      { number: `ZL-26/192-${index + 3}`, date: "2026-01-19", type: "Залог ТС", amount: pledge, contract: "AV-26/192", allocated: pledge, ltv: 91, status: "Зарегистрировано" }
    ],
    pledgors: [
      { share: "100%", name: "ООО Волга Логистик", idn: "525 944 1009", role: "Залогодатель", check: "Проверен" }
    ],
    externalData: {
      "Источник": "SpectrumData",
      "Дата проверки": "2026-06-16 11:20",
      "Регистрация ТС": "Активна",
      "Аресты": "Не выявлены",
      "Запрет регистрационных действий": "Не выявлен",
      "Розыск": "Не числится"
    },
    documents: [
      { name: `СТС ${item.model}.pdf`, type: "Право", required: true, status: "Получен", date: "2026-01-12" },
      ...(item.evalDoc ? [{ name: `Отчет оценки ${item.id}.pdf`, type: "Оценка", required: true, status: "Подписан", date: item.evalDate }] : []),
      { name: `Полис ${item.id}.pdf`, type: "Страхование", required: true, status: item.insurance, date: "2025-12-01" }
    ],
    history: [
        { date: "2026-06-16 11:20", user: "Система", field: "Автопарк", oldValue: "-", newValue: "Добавлен в пул списочной переоценки", reason: "Списочная переоценка", source: "Конвейер" }
    ]
  };
});

const buildInspectionExampleCollaterals = () => [
  { id: "COL-040", type: "Автотранспорт", description: "Toyota Camry XV70, 2021 г., гос. номер А 421 МР 77", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, ул. Дорожная, автопарк 4", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 310000000, discount: 0.78, appraisal: "Действует", appraisalDue: "2026-11-20", insurance: "Оплачена", insuranceDue: "2027-02-10", responsible: "Дмитрий Орлов", source: "Конвейер", risk: 24, pledgeType: "Залог ТС", fields: { "VIN": "XW7BF3FK90S040001", "Госномер": "А 421 МР 77", "Марка/модель": "Toyota Camry XV70", "Год выпуска": "2021", "Пробег": "68 200 км", "Состояние": "Исправен", "Место хранения": "Автопарк заемщика" }, documents: ["СТС Toyota Camry.pdf", "Полис COL-040.pdf"] },
  { id: "COL-041", type: "Автотранспорт", description: "Hyundai Sonata DN8, 2022 г., гос. номер А 422 МР 77", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, ул. Дорожная, автопарк 4", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 285000000, discount: 0.78, appraisal: "Действует", appraisalDue: "2026-11-20", insurance: "Оплачена", insuranceDue: "2027-02-10", responsible: "Дмитрий Орлов", source: "Конвейер", risk: 29, pledgeType: "Залог ТС", fields: { "VIN": "Z94K241CBNR040002", "Госномер": "А 422 МР 77", "Марка/модель": "Hyundai Sonata DN8", "Год выпуска": "2022", "Пробег": "54 900 км", "Состояние": "Исправен", "Место хранения": "Автопарк заемщика" }, documents: ["СТС Hyundai Sonata.pdf", "Полис COL-041.pdf"] },
  { id: "COL-042", type: "Автотранспорт", description: "Kia K5, 2021 г., гос. номер А 423 МР 77", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, ул. Дорожная, автопарк 4", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 270000000, discount: 0.76, appraisal: "Действует", appraisalDue: "2026-10-30", insurance: "Оплачена", insuranceDue: "2027-01-25", responsible: "Дмитрий Орлов", source: "Конвейер", risk: 34, pledgeType: "Залог ТС", fields: { "VIN": "XWEG341CBMC040003", "Госномер": "А 423 МР 77", "Марка/модель": "Kia K5", "Год выпуска": "2021", "Пробег": "73 500 км", "Состояние": "Рабочее, требуется фото шин", "Место хранения": "Автопарк заемщика" }, documents: ["СТС Kia K5.pdf", "Полис COL-042.pdf"] },
  { id: "COL-043", type: "Автотранспорт", description: "Volkswagen Transporter T6, 2020 г., гос. номер А 424 МР 77", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, ул. Дорожная, автопарк 4", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 335000000, discount: 0.74, appraisal: "Истекает", appraisalDue: "2026-07-15", insurance: "Оплачена", insuranceDue: "2026-12-18", responsible: "Дмитрий Орлов", source: "Конвейер", risk: 46, pledgeType: "Залог ТС", fields: { "VIN": "WV1ZZZ7HZLH040004", "Госномер": "А 424 МР 77", "Марка/модель": "Volkswagen Transporter T6", "Год выпуска": "2020", "Пробег": "126 400 км", "Состояние": "Рабочее, есть следы ремонта кузова", "Место хранения": "Автопарк заемщика" }, documents: ["СТС Volkswagen Transporter.pdf", "Полис COL-043.pdf"] },
  { id: "COL-044", type: "Автотранспорт", description: "ГАЗель Next, 2022 г., гос. номер А 425 МР 77", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, ул. Дорожная, автопарк 4", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 225000000, discount: 0.72, appraisal: "Действует", appraisalDue: "2026-09-05", insurance: "Истекает", insuranceDue: "2026-07-10", responsible: "Дмитрий Орлов", source: "Конвейер", risk: 52, pledgeType: "Залог ТС", fields: { "VIN": "X96A21R32N0040005", "Госномер": "А 425 МР 77", "Марка/модель": "ГАЗель Next", "Год выпуска": "2022", "Пробег": "97 800 км", "Состояние": "Рабочее, требуется проверка пробега", "Место хранения": "Автопарк заемщика" }, documents: ["СТС Газель Next.pdf", "Полис COL-044.pdf"] },
  { id: "COL-045", type: "Недвижимость", description: "Квартира 74 кв.м, Москва, район Аэропорт", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, Ленинградский проспект, дом 58, кв. 41", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 1580000000, discount: 0.78, appraisal: "Действует", appraisalDue: "2027-01-12", insurance: "Оплачена", insuranceDue: "2027-01-12", responsible: "Дмитрий Орлов", source: "АБС", risk: 21, pledgeType: "Ипотека", fields: { "Вид объекта": "Помещения", "Подвид": "Жилое помещение, садового (дачного) домика", "Кадастровый номер": "77:09:0004011:4045", "Площадь": "74 кв.м", "Комнат": "3", "Этаж": "8 из 17", "Состояние": "После ремонта" }, documents: ["Выписка ЕГРН COL-045.pdf", "Отчет оценки COL-045.pdf"] },
  { id: "COL-046", type: "Недвижимость", description: "Квартира 61 кв.м, Москва, район Хорошево-Мневники", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, ул. Народного Ополчения, дом 22, кв. 73", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 1320000000, discount: 0.78, appraisal: "Действует", appraisalDue: "2027-01-12", insurance: "Оплачена", insuranceDue: "2027-01-12", responsible: "Дмитрий Орлов", source: "АБС", risk: 24, pledgeType: "Ипотека", fields: { "Вид объекта": "Помещения", "Подвид": "Жилое помещение, садового (дачного) домика", "Кадастровый номер": "77:08:0009034:4046", "Площадь": "61 кв.м", "Комнат": "2", "Этаж": "11 из 22", "Состояние": "Удовлетворительное" }, documents: ["Выписка ЕГРН COL-046.pdf", "Отчет оценки COL-046.pdf"] },
  { id: "COL-047", type: "Недвижимость", description: "Квартира 89 кв.м, Москва, Пресненский район", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, Шмитовский проезд, дом 39, кв. 118", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 2140000000, discount: 0.76, appraisal: "Действует", appraisalDue: "2027-01-12", insurance: "Оплачена", insuranceDue: "2027-01-12", responsible: "Дмитрий Орлов", source: "АБС", risk: 31, pledgeType: "Ипотека", fields: { "Вид объекта": "Помещения", "Подвид": "Жилое помещение, садового (дачного) домика", "Кадастровый номер": "77:01:0004032:4047", "Площадь": "89 кв.м", "Комнат": "3", "Этаж": "14 из 24", "Состояние": "Требуется фото входной группы" }, documents: ["Выписка ЕГРН COL-047.pdf", "Отчет оценки COL-047.pdf"] },
  { id: "COL-048", type: "Оборудование", description: "Дизель-генератор Cummins C550D5", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, техническая площадка БЦ Сокол", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 420000000, discount: 0.7, appraisal: "Действует", appraisalDue: "2026-12-01", insurance: "Оплачена", insuranceDue: "2026-12-01", responsible: "Дмитрий Орлов", source: "Конвейер", risk: 37, pledgeType: "Залог оборудования", fields: { "Подвид": "Объект оборудования", "Серийный номер": "CUM-C550-22-4048", "Производитель": "Cummins", "Год выпуска": "2022", "Группа": "Энергетическое оборудование", "Местонахождение": "Техническое помещение БЦ", "Техническое состояние": "Рабочее" }, documents: ["Инвойс Cummins.pdf", "Акт ввода COL-048.pdf"] },
  { id: "COL-049", type: "Оборудование", description: "Лифтовое оборудование KONE MonoSpace, 4 комплекта", clientName: "ООО Столичный Девелопмент", clientId: "770 821 0047", gsz: "ГСЗ Столичный Девелопмент", region: "Москва", address: "Москва, жилой комплекс Северный, корпус 2", contractId: "CTR-2026-0405", contractNumber: "MX-26/405", market: 760000000, discount: 0.68, appraisal: "Действует", appraisalDue: "2026-12-01", insurance: "Оплачена", insuranceDue: "2026-12-01", responsible: "Дмитрий Орлов", source: "Конвейер", risk: 39, pledgeType: "Залог оборудования", fields: { "Подвид": "Объект оборудования", "Серийный номер": "KONE-MS-21-4049", "Производитель": "KONE", "Год выпуска": "2021", "Группа": "Иное", "Местонахождение": "ЖК Северный, корпус 2", "Техническое состояние": "Рабочее" }, documents: ["Инвойс KONE.pdf", "Акт ввода COL-049.pdf"] },
  { id: "COL-050", type: "Транспортные средства (самоходная техника)", description: "Гусеничный экскаватор Komatsu PC210-10M0", clientName: "АО АэроТех Лизинг", clientId: "772 604 1180", gsz: "ГСЗ АэроТех Лизинг", region: "Московская область", address: "Московская область, Домодедово, производственная база 7", contractId: "CTR-2026-0406", contractNumber: "DG-26/406", market: 1180000000, discount: 0.7, appraisal: "Действует", appraisalDue: "2026-12-18", insurance: "Оплачена", insuranceDue: "2026-12-18", responsible: "Мария Петрова", source: "АБС", risk: 33, pledgeType: "Залог самоходной техники", fields: { "Идентификационный номер самоходной машины": "KMTPC210NPM040050", "Государственный регистрационный знак": "77 МЕ 4050", "Марка/модель": "Komatsu PC210-10M0", "Год выпуска": "2021", "ПСМ": "CA 778804", "Место хранения": "Производственная база 7", "Состояние": "По документам без ограничений" }, documents: ["ПСМ Komatsu PC210.pdf", "Свидетельство регистрации самоходной машины COL-050.pdf"] },
  { id: "COL-051", type: "Транспортные средства (самоходная техника)", description: "Фронтальный погрузчик SDLG LG936L", clientName: "АО АэроТех Лизинг", clientId: "772 604 1180", gsz: "ГСЗ АэроТех Лизинг", region: "Московская область", address: "Московская область, Домодедово, производственная база 7", contractId: "CTR-2026-0406", contractNumber: "DG-26/406", market: 620000000, discount: 0.68, appraisal: "Действует", appraisalDue: "2026-12-18", insurance: "Оплачена", insuranceDue: "2026-12-18", responsible: "Мария Петрова", source: "АБС", risk: 35, pledgeType: "Залог самоходной техники", fields: { "Идентификационный номер самоходной машины": "VLG936L0NN040051", "Государственный регистрационный знак": "77 МЕ 4051", "Марка/модель": "SDLG LG936L", "Год выпуска": "2022", "ПСМ": "CA 778805", "Место хранения": "Производственная база 7", "Состояние": "По документам без ограничений" }, documents: ["ПСМ SDLG LG936L.pdf", "Свидетельство регистрации самоходной машины COL-051.pdf"] },
  { id: "COL-052", type: "Воздушные суда", description: "Вертолет Airbus H125, RA-04052", clientName: "АО АэроТех Лизинг", clientId: "772 604 1180", gsz: "ГСЗ АэроТех Лизинг", region: "Москва", address: "Москва, вертолетная площадка Остафьево", contractId: "CTR-2026-0406", contractNumber: "DG-26/406", market: 2850000000, discount: 0.65, appraisal: "Действует", appraisalDue: "2027-02-28", insurance: "Оплачена", insuranceDue: "2027-02-28", responsible: "Мария Петрова", source: "АБС", risk: 42, pledgeType: "Залог воздушного судна", fields: { "Вид воздушного судна": "Воздушные суда", "Серийный (заводской) номер": "H125-904052", "Опознавательные знаки воздушного судна": "RA-04052", "Тип воздушного судна": "Вертолет", "Год выпуска": "2020", "Свидетельство о регистрации": "ВС-04052", "Место базирования": "Остафьево" }, documents: ["Свидетельство регистрации ВС RA-04052.pdf", "Сертификат летной годности RA-04052.pdf"] },
  { id: "COL-053", type: "Воздушные суда", description: "Самолет Cessna 208B Grand Caravan, RA-04053", clientName: "АО АэроТех Лизинг", clientId: "772 604 1180", gsz: "ГСЗ АэроТех Лизинг", region: "Москва", address: "Казань, аэропорт Бегишево, стоянка 3", contractId: "CTR-2026-0406", contractNumber: "DG-26/406", market: 1980000000, discount: 0.64, appraisal: "Действует", appraisalDue: "2027-02-28", insurance: "Оплачена", insuranceDue: "2027-02-28", responsible: "Мария Петрова", source: "АБС", risk: 38, pledgeType: "Залог воздушного судна", fields: { "Вид воздушного судна": "Воздушные суда", "Серийный (заводской) номер": "208B-54053", "Опознавательные знаки воздушного судна": "RA-04053", "Тип воздушного судна": "Самолет", "Год выпуска": "2019", "Свидетельство о регистрации": "ВС-04053", "Место базирования": "Аэропорт Бегишево" }, documents: ["Свидетельство регистрации ВС RA-04053.pdf", "Сертификат летной годности RA-04053.pdf"] },
  { id: "COL-054", type: "Воздушные суда", description: "Вертолет Robinson R66, RA-04054", clientName: "АО АэроТех Лизинг", clientId: "772 604 1180", gsz: "ГСЗ АэроТех Лизинг", region: "Москва", address: "Краснодарский край, аэродром Пашковский", contractId: "CTR-2026-0406", contractNumber: "DG-26/406", market: 980000000, discount: 0.62, appraisal: "Истекает", appraisalDue: "2026-08-15", insurance: "Оплачена", insuranceDue: "2027-02-28", responsible: "Мария Петрова", source: "АБС", risk: 47, pledgeType: "Залог воздушного судна", fields: { "Вид воздушного судна": "Воздушные суда", "Серийный (заводской) номер": "R66-04054", "Опознавательные знаки воздушного судна": "RA-04054", "Тип воздушного судна": "Вертолет", "Год выпуска": "2018", "Свидетельство о регистрации": "ВС-04054", "Место базирования": "Аэродром Пашковский" }, documents: ["Свидетельство регистрации ВС RA-04054.pdf", "Сертификат летной годности RA-04054.pdf"] },
  { id: "COL-055", type: "Недвижимость", description: "Земельный участок 2,4 га, Московская область, Домодедово", clientName: "АО АэроТех Лизинг", clientId: "772 604 1180", gsz: "ГСЗ АэроТех Лизинг", region: "Московская область", address: "Московская область, г. Домодедово, кадастровый квартал 50:28:0060210", contractId: "CTR-2026-0406", contractNumber: "DG-26/406", market: 1460000000, discount: 0.72, appraisal: "Действует", appraisalDue: "2027-02-28", insurance: "Не требуется", insuranceDue: "2027-02-28", responsible: "Мария Петрова", source: "ЕГРН", risk: 26, pledgeType: "Ипотека", fields: { "Вид объекта": "Земельный участок", "Подвид": "Земельный участок в черте населенного пункта", "Кадастровый номер": "50:28:0060210:4055", "Площадь": "2,4 га", "Разрешенное использование": "Производственная и складская деятельность", "Категория земель": "Земли населенных пунктов", "Состояние": "По документам без ограничений" }, documents: ["Выписка ЕГРН COL-055.pdf", "Кадастровый план COL-055.pdf"] }
].map((item, index) => {
  const pledge = Math.round(item.market * item.discount);
  const isDocumentary = item.contractId === "CTR-2026-0406";
  const completedInspectionDate = isDocumentary ? "2026-05-30" : "2026-04-28";
  const nextInspectionDate = isDocumentary ? "2026-06-27" : "2026-06-26";
  const documentType = item.type === "Недвижимость"
    ? "Право"
    : item.type === "Оборудование"
      ? "Право"
      : item.type === "Воздушные суда"
        ? "Регистрация"
        : "Право";
  return {
    id: item.id,
    type: item.type,
    description: item.description,
    clientName: item.clientName,
    clientId: item.clientId,
    clientType: "ЮЛ",
    gsz: item.gsz,
    region: item.region,
    address: item.address,
    contractIds: [item.contractId],
    marketValue: item.market,
    pledgeValue: pledge,
    allocatedValue: pledge,
    appraisalStatus: item.appraisal,
    appraisalDue: item.appraisalDue,
    insuranceStatus: item.insurance,
    insuranceDue: item.insuranceDue,
    status: "В залоге",
    crossPledge: false,
    responsible: item.responsible,
    updatedAt: isDocumentary ? "2026-06-19 12:20" : "2026-06-19 10:40",
    source: item.source,
    riskScore: item.risk,
    riskState: item.risk >= 45 ? "Требует внимания" : item.risk >= 30 ? "Удовлетворительное" : "Хорошее",
    risks: risks(item.risk >= 45 ? ["warn", "warn", "ok", "warn", "ok", "ok", "ok", "ok"] : item.risk >= 30 ? ["ok", "warn", "ok", "warn", "ok", "ok", "ok", "ok"] : ["ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok"]),
    fields: item.fields,
    monitoring: {
      lastInspection: completedInspectionDate,
      inspector: item.responsible,
      condition: isDocumentary ? "Документы проверены, выезд не проводился" : "Ожидает физического осмотра",
      nextInspection: nextInspectionDate,
      periodicity: isDocumentary ? "Документарно по запросу" : "Раз в полгода",
      completed: false,
      schedule: [
        { date: completedInspectionDate, type: isDocumentary ? "Документарная проверка" : "Плановый", result: "Без критических замечаний", inspector: item.responsible, status: "Завершен" },
        { date: nextInspectionDate, type: isDocumentary ? "Документарный осмотр" : "Физический осмотр", result: "Ожидается", inspector: item.responsible, status: "Назначен" }
      ]
    },
    evaluations: [
      { date: isDocumentary ? "2026-02-28" : "2026-03-20", appraiser: isDocumentary ? "Внутренняя оценка Банка" : "ООО Центр оценки", market: item.market, pledge, method: item.type === "Недвижимость" ? "Сравнительный" : "Сравнительный и затратный", status: item.appraisal }
    ],
    insurance: {
      company: item.insurance === "Не требуется" ? "Не требуется" : "АльфаСтрахование",
      policy: item.insurance === "Не требуется" ? "" : `POL-${item.id.replace("COL-", "")}`,
      from: "2026-02-28",
      to: item.insuranceDue,
      amount: pledge,
      premiumStatus: item.insurance === "Не требуется" ? "Не требуется" : "Оплачена",
      source: "АБС"
    },
    encumbrances: [
      { number: `ZL-${item.contractNumber}-${index + 1}`, date: "2026-03-01", type: item.pledgeType, amount: pledge, contract: item.contractNumber, allocated: pledge, ltv: Math.round((pledge / item.market) * 100), status: "Зарегистрировано" }
    ],
    pledgors: [
      { share: "100%", name: item.clientName, idn: item.clientId, role: "Залогодатель", check: "Проверен" }
    ],
    externalData: {
      "Источник": isDocumentary ? "АБС + реестровые документы" : item.source,
      "Дата проверки": isDocumentary ? "2026-06-19 12:20" : "2026-06-19 10:40",
      "Право собственности": "Подтверждено",
      "Аресты": "Не выявлены",
      "Запреты": "Не выявлены",
      "Внешний залоговый реестр": "Запись активна"
    },
    documents: item.documents.map((name) => ({ name, type: documentType, required: true, status: "Получен", date: isDocumentary ? "2026-06-18" : "2026-06-17" })),
    history: [
      { date: isDocumentary ? "2026-06-19 12:20" : "2026-06-19 10:40", user: "Система", field: "Связь с задачей", oldValue: "-", newValue: isDocumentary ? "Добавлен в документарный осмотр" : "Добавлен в физический осмотр", reason: "Формирование заявки на осмотр", source: "Конвейер" }
    ]
  };
});

export const initialData = {
  contracts: [
    {
      id: "CTR-2026-0148",
      number: "KM-26/148",
      startDate: "2025-11-18",
      endDate: "2028-11-18",
      product: "Кредитная линия для оборотного капитала",
      currency: "RUB",
      limit: 3800000000,
      debt: 2520000000,
      marketValue: 5200000000,
      allocatedValue: 3600000000,
      ltv: 70,
      coverageStatus: "Полное",
      status: "Активен",
      loanQuality: "2 класс",
      reserve: 126000000,
      clientType: "ЮЛ",
      clientName: "ООО СеверТекстиль",
      inn: "771 482 2110",
      gsz: "ГСЗ СеверТекстиль",
      collateralIds: ["COL-001", "COL-004"],
      participants: [
        { role: "Заемщик", name: "ООО СеверТекстиль", idn: "771 482 2110", share: "100%", contact: "Подтвержден" },
        { role: "Залогодатель", name: "ООО СеверСклад", idn: "771 492 2776", share: "Долевой объект", contact: "Актуален" }
      ]
    },
    {
      id: "CTR-2026-0192",
      number: "AV-26/192",
      startDate: "2026-01-12",
      endDate: "2029-01-12",
      product: "Автокредит для корпоративного парка",
      currency: "RUB",
      limit: 1650000000,
      debt: 1380000000,
      marketValue: 6685000000,
      allocatedValue: 5095000000,
      ltv: 27,
      coverageStatus: "Полное",
      status: "Активен",
      loanQuality: "3 класс",
      reserve: 207000000,
      clientType: "ЮЛ",
      clientName: "ООО Волга Логистик",
      inn: "525 944 1009",
      gsz: "ГСЗ Волга Логистик",
      collateralIds: ["COL-002", "COL-006", "COL-020", "COL-021", "COL-022", "COL-023", "COL-024", "COL-025", "COL-026", "COL-027"],
      participants: [
        { role: "Заемщик", name: "ООО Волга Логистик", idn: "525 944 1009", share: "100%", contact: "Подтвержден" },
        { role: "Поручитель", name: "ИП Никитин А.А.", idn: "525 178 233 001", share: "Поручительство", contact: "Требует обновления" }
      ]
    },
    {
      id: "CTR-2025-0771",
      number: "IP-25/771",
      startDate: "2025-04-09",
      endDate: "2030-04-09",
      product: "Ипотечный кредит",
      currency: "RUB",
      limit: 920000000,
      debt: 812000000,
      marketValue: 1040000000,
      allocatedValue: 755000000,
      ltv: 108,
      coverageStatus: "Не обеспечено",
      status: "Активен",
      loanQuality: "4 класс",
      reserve: 324800000,
      clientType: "ФЛ",
      clientName: "Смирнова Елена Викторовна",
      inn: "772 345 678 901",
      gsz: "ГСЗ Смирнова",
      collateralIds: ["COL-003"],
      participants: [
        { role: "Заемщик", name: "Смирнова Елена Викторовна", idn: "772 345 678 901", share: "100%", contact: "Доступен" },
        { role: "Созаемщик", name: "Смирнов Алексей Викторович", idn: "772 345 678 902", share: "50%", contact: "Актуален" }
      ]
    },
    {
      id: "CTR-2026-0228",
      number: "BG-26/228",
      startDate: "2026-02-05",
      endDate: "2027-08-05",
      product: "Банковская гарантия",
      currency: "RUB",
      limit: 2400000000,
      debt: 1180000000,
      marketValue: 3600000000,
      allocatedValue: 1720000000,
      ltv: 69,
      coverageStatus: "Полное",
      status: "Активен",
      loanQuality: "1 класс",
      reserve: 23600000,
      clientType: "ЮЛ",
      clientName: "АО Кубань Агро Экспорт",
      inn: "231 011 8454",
      gsz: "ГСЗ Агро Экспорт",
      collateralIds: ["COL-005", "COL-008"],
      participants: [
        { role: "Принципал", name: "АО Кубань Агро Экспорт", idn: "231 011 8454", share: "100%", contact: "Подтвержден" },
        { role: "Залогодатель", name: "ООО АгроТерминал", idn: "231 177 1628", share: "Имущество", contact: "Актуален" }
      ]
    },
    {
      id: "CTR-2026-0316",
      number: "LC-26/316",
      startDate: "2026-03-18",
      endDate: "2027-03-18",
      product: "Кредитная линия на экспортный контракт",
      currency: "RUB",
      limit: 800000000,
      debt: 580000000,
      marketValue: 3600000000,
      allocatedValue: 680000000,
      ltv: 85,
      coverageStatus: "Частичное",
      status: "Активен",
      loanQuality: "2 класс",
      reserve: 46400000,
      clientType: "ЮЛ",
      clientName: "ООО Кубань Трейд",
      inn: "231 455 9081",
      gsz: "ГСЗ Агро Экспорт",
      collateralIds: ["COL-005", "COL-008"],
      participants: [
        { role: "Заемщик", name: "ООО Кубань Трейд", idn: "231 455 9081", share: "100%", contact: "Подтвержден" },
        { role: "Залогодатель", name: "АО Кубань Агро Экспорт", idn: "231 011 8454", share: "Имущество", contact: "Актуален" }
      ]
    },
    {
      id: "CTR-2024-0644",
      number: "KL-24/644",
      startDate: "2024-09-20",
      endDate: "2027-09-20",
      product: "Кредит на оборудование",
      currency: "RUB",
      limit: 470000,
      debt: 344000,
      marketValue: 4950000000,
      allocatedValue: 3710000000,
      ltv: 92,
      coverageStatus: "Частичное",
      status: "Активен",
      loanQuality: "3 класс",
      reserve: 51600000,
      clientType: "ЮЛ",
      clientName: "ООО Север Принт Пак",
      inn: "780 600 2779",
      gsz: "ГСЗ Север Принт Пак",
      collateralIds: ["COL-007"],
      participants: [
        { role: "Заемщик", name: "ООО Север Принт Пак", idn: "780 600 2779", share: "100%", contact: "Подтвержден" }
      ]
    },
    {
      id: "CTR-2026-0405",
      number: "MX-26/405",
      startDate: "2026-03-01",
      endDate: "2029-03-01",
      product: "Кредитная линия под смешанное обеспечение",
      currency: "RUB",
      limit: 7200000000,
      debt: 5100000000,
      marketValue: 7625000000,
      allocatedValue: 5730000000,
      ltv: 89,
      coverageStatus: "Полное",
      status: "Активен",
      loanQuality: "2 класс",
      reserve: 153000000,
      clientType: "ЮЛ",
      clientName: "ООО Столичный Девелопмент",
      inn: "770 821 0047",
      gsz: "ГСЗ Столичный Девелопмент",
      collateralIds: ["COL-040", "COL-041", "COL-042", "COL-043", "COL-044", "COL-045", "COL-046", "COL-047", "COL-048", "COL-049"],
      participants: [
        { role: "Заемщик", name: "ООО Столичный Девелопмент", idn: "770 821 0047", share: "100%", contact: "Подтвержден" },
        { role: "Залогодатель", name: "ООО Столичный Девелопмент", idn: "770 821 0047", share: "Имущество", contact: "Актуален" }
      ]
    },
    {
      id: "CTR-2026-0406",
      number: "DG-26/406",
      startDate: "2026-03-05",
      endDate: "2028-03-05",
      product: "Кредит на обновление парка спецтехники",
      currency: "RUB",
      limit: 5800000000,
      debt: 4200000000,
      marketValue: 9070000000,
      allocatedValue: 6020000000,
      ltv: 70,
      coverageStatus: "Полное",
      status: "Активен",
      loanQuality: "2 класс",
      reserve: 126000000,
      clientType: "ЮЛ",
      clientName: "АО АэроТех Лизинг",
      inn: "772 604 1180",
      gsz: "ГСЗ АэроТех Лизинг",
      collateralIds: ["COL-050", "COL-051", "COL-052", "COL-053", "COL-054", "COL-055"],
      participants: [
        { role: "Заемщик", name: "АО АэроТех Лизинг", idn: "772 604 1180", share: "100%", contact: "Подтвержден" },
        { role: "Залогодатель", name: "АО АэроТех Лизинг", idn: "772 604 1180", share: "Имущество", contact: "Актуален" }
      ]
    }
  ],
  applications: [
    {
      id: "APP-2026-0417",
      number: "APP-26/0417",
      createdAt: "2026-06-01 08:00",
      source: "Ручное создание",
      applicationType: "Оценка залога",
      applicationSubtype: "Переоценка",
      applicationPurpose: "Переоценка действующего обеспечения",
      initiator: "Мария Петрова",
      initiatorSegment: "МСБ",
      clientName: "ООО СеверТекстиль",
      participantName: "ООО СеверТекстиль",
      participantInn: "771 482 2110",
      product: "Кредитная линия для оборотного капитала",
      limit: 3800000000,
      currency: "RUB",
      status: "В работе",
      decisionStatus: "Решение по сделке не принято",
      contractId: "",
      contractIds: ["CTR-2026-0148"],
      deals: [
        {
          clientName: "ООО СеверТекстиль",
          inn: "771 482 2110",
          contractId: "CTR-2026-0148",
          contractNumber: "KM-26/148",
          product: "Кредитная линия для оборотного капитала",
          limit: 3800000000,
          currency: "RUB",
          collateralIds: ["COL-001", "COL-004"]
        }
      ],
      collateralIds: ["COL-001", "COL-004"],
      taskIds: ["TSK-2026-1153", "TSK-2026-1151"]
    },
    {
      id: "APP-2026-0418",
      number: "APP-26/0418",
      createdAt: "2026-06-15 15:49",
      source: "Ручное создание",
      applicationType: "Оценка залога",
      applicationSubtype: "Последзалог / новый кредит",
      applicationPurpose: "Последующий залог / изменение обеспечения",
      initiator: "Анна Кузнецова",
      initiatorSegment: "МСБ",
      clientName: "ООО Волга Логистик",
      participantName: "ООО Волга Логистик",
      participantInn: "525 944 1009",
      product: "Автокредит для корпоративного парка",
      limit: 1650000000,
      currency: "RUB",
      status: "В работе",
      decisionStatus: "Ожидается заключение залоговой службы",
      contractId: "CTR-2026-0192",
      contractIds: ["CTR-2026-0192"],
      deals: [
        {
          clientName: "ООО Волга Логистик",
          inn: "525 944 1009",
          contractId: "CTR-2026-0192",
          contractNumber: "AV-26/192",
          product: "Автокредит для корпоративного парка",
          limit: 1650000000,
          currency: "RUB",
          collateralIds: ["COL-002", "COL-006", "COL-020", "COL-021", "COL-022", "COL-023", "COL-024", "COL-025", "COL-026", "COL-027"]
        }
      ],
      collateralIds: ["COL-002", "COL-006", "COL-020", "COL-021", "COL-022", "COL-023", "COL-024", "COL-025", "COL-026", "COL-027"],
      taskIds: ["TSK-2026-1176", "TSK-2026-1154", "TSK-2026-1152"]
    },
    {
      id: "APP-2026-0419",
      number: "APP-26/0419",
      createdAt: "2026-06-05 12:30",
      source: "Конвейер Банка",
      applicationType: "Регистрация залога",
      applicationSubtype: "Регистрация залога движимого имущества",
      applicationPurpose: "Регистрация / учет залога",
      initiator: "Система",
      initiatorSegment: "Корпоративный бизнес",
      clientName: "АО Кубань Агро Экспорт",
      participantName: "АО Кубань Агро Экспорт",
      participantInn: "231 011 8454",
      product: "Банковская гарантия",
      limit: 2400000000,
      currency: "RUB",
      status: "В работе",
      decisionStatus: "Положительное решение по сделке",
      contractId: "CTR-2026-0228",
      contractIds: ["CTR-2026-0228", "CTR-2026-0316"],
      deals: [
        {
          clientName: "АО Кубань Агро Экспорт",
          inn: "231 011 8454",
          contractId: "CTR-2026-0228",
          contractNumber: "BG-26/228",
          product: "Банковская гарантия",
          limit: 2400000000,
          currency: "RUB",
          collateralIds: ["COL-005", "COL-008"]
        },
        {
          clientName: "АО Кубань Агро Экспорт",
          inn: "231 011 8454",
          contractId: "CTR-2026-0316",
          contractNumber: "LC-26/316",
          product: "Кредитная линия на экспортный контракт",
          limit: 800000000,
          currency: "RUB",
          collateralIds: ["COL-005", "COL-008"]
        }
      ],
      collateralIds: ["COL-005", "COL-008"],
      taskIds: ["TSK-2026-1140"]
    },
    {
      id: "APP-2026-0420",
      number: "APP-26/0420",
      createdAt: "2026-06-19 09:20",
      source: "Конвейер Банка",
      applicationType: "Осмотр имущества",
      applicationSubtype: "Первоначальный осмотр",
      applicationPurpose: "Проверка предмета залога",
      initiator: "Система",
      initiatorSegment: "Корпоративный бизнес",
      clientName: "ООО Столичный Девелопмент",
      participantName: "ООО Столичный Девелопмент",
      participantInn: "770 821 0047",
      product: "Кредитная линия под смешанное обеспечение",
      limit: 7200000000,
      currency: "RUB",
      status: "В работе",
      decisionStatus: "Положительное решение по сделке",
      contractId: "CTR-2026-0405",
      contractIds: ["CTR-2026-0405"],
      deals: [
        {
          clientName: "ООО Столичный Девелопмент",
          inn: "770 821 0047",
          contractId: "CTR-2026-0405",
          contractNumber: "MX-26/405",
          product: "Кредитная линия под смешанное обеспечение",
          limit: 7200000000,
          currency: "RUB",
          collateralIds: ["COL-040", "COL-041", "COL-042", "COL-043", "COL-044", "COL-045", "COL-046", "COL-047", "COL-048", "COL-049"]
        }
      ],
      collateralIds: ["COL-040", "COL-041", "COL-042", "COL-043", "COL-044", "COL-045", "COL-046", "COL-047", "COL-048", "COL-049"],
      taskIds: ["TSK-2026-1160"]
    },
    {
      id: "APP-2026-0421",
      number: "APP-26/0421",
      createdAt: "2026-06-19 11:05",
      source: "Конвейер Банка",
      applicationType: "Осмотр имущества",
      applicationSubtype: "Документарный осмотр",
      applicationPurpose: "Проверка предмета залога",
      initiator: "Система",
      initiatorSegment: "Корпоративный бизнес",
      clientName: "АО АэроТех Лизинг",
      participantName: "АО АэроТех Лизинг",
      participantInn: "772 604 1180",
      product: "Кредит на обновление парка спецтехники",
      limit: 5800000000,
      currency: "RUB",
      status: "В работе",
      decisionStatus: "Положительное решение по сделке",
      contractId: "CTR-2026-0406",
      contractIds: ["CTR-2026-0406"],
      deals: [
        {
          clientName: "АО АэроТех Лизинг",
          inn: "772 604 1180",
          contractId: "CTR-2026-0406",
          contractNumber: "DG-26/406",
          product: "Кредит на обновление парка спецтехники",
          limit: 5800000000,
          currency: "RUB",
          collateralIds: ["COL-050", "COL-051", "COL-052", "COL-053", "COL-054", "COL-055"]
        }
      ],
      collateralIds: ["COL-050", "COL-051", "COL-052", "COL-053", "COL-054", "COL-055"],
      taskIds: ["TSK-2026-1161"]
    },
    {
      id: "APP-2026-0422",
      number: "APP-26/0422",
      createdAt: "2026-08-25 13:10",
      source: "Ручное создание",
      applicationType: "Регистрация залога",
      applicationSubtype: "Регистрация недвижимости (выезд)",
      applicationPurpose: "Регистрация / учет залога",
      initiator: "Анна Кузнецова",
      initiatorSegment: "МСБ",
      clientName: "ООО Столичный Девелопмент",
      participantName: "ООО Столичный Девелопмент",
      participantInn: "770 821 0047",
      product: "Кредитная линия под смешанное обеспечение",
      limit: 7200000000,
      currency: "RUB",
      status: "В работе",
      decisionStatus: "Положительное решение по сделке",
      contractId: "CTR-2026-0405",
      contractIds: ["CTR-2026-0405"],
      deals: [
        {
          clientName: "ООО Столичный Девелопмент",
          inn: "770 821 0047",
          contractId: "CTR-2026-0405",
          contractNumber: "MX-26/405",
          product: "Кредитная линия под смешанное обеспечение",
          limit: 7200000000,
          currency: "RUB",
          collateralIds: ["COL-045", "COL-048"]
        }
      ],
      collateralIds: ["COL-045", "COL-048"],
      taskIds: ["TSK-2026-1174"]
    },
    {
      id: "APP-2026-0423",
      number: "APP-26/0423",
      createdAt: "2026-08-25 13:35",
      source: "Ручное создание",
      applicationType: "Регистрация залога",
      applicationSubtype: "Регистрация залога движимого имущества",
      applicationPurpose: "Регистрация / учет залога",
      initiator: "Мария Петрова",
      initiatorSegment: "МСБ",
      clientName: "ООО Волга Логистик",
      participantName: "ООО Волга Логистик",
      participantInn: "525 944 1009",
      product: "Автокредит для корпоративного парка",
      limit: 1650000000,
      currency: "RUB",
      status: "В работе",
      decisionStatus: "Положительное решение по сделке",
      contractId: "CTR-2026-0192",
      contractIds: ["CTR-2026-0192"],
      deals: [
        {
          clientName: "ООО Волга Логистик",
          inn: "525 944 1009",
          contractId: "CTR-2026-0192",
          contractNumber: "AV-26/192",
          product: "Автокредит для корпоративного парка",
          limit: 1650000000,
          currency: "RUB",
          collateralIds: ["COL-002", "COL-006"]
        }
      ],
      collateralIds: ["COL-002", "COL-006"],
      taskIds: ["TSK-2026-1175"]
    }
  ],
  collaterals: [
    {
      id: "COL-001",
      type: "Недвижимость",
      description: "Складской комплекс 4 200 кв.м, Московская область",
      clientName: "ООО СеверСклад",
      clientId: "771 492 2776",
      clientType: "ЮЛ",
      gsz: "ГСЗ СеверТекстиль",
      region: "Московская область",
      address: "Московская область, г. Клин, промзона Северная, участок 18",
      contractIds: ["CTR-2026-0148"],
      marketValue: 4200000000,
      pledgeValue: 3360000000,
      allocatedValue: 2900000000,
      appraisalStatus: "Действует",
      appraisalDue: "2026-09-20",
      insuranceStatus: "Оплачена",
      insuranceDue: "2026-12-31",
      status: "В залоге",
      crossPledge: false,
      responsible: "Анна Кузнецова",
      updatedAt: "2026-06-14 10:30",
      source: "АБС",
      riskScore: 18,
      riskState: "Хорошее",
      risks: risks(["ok", "warn", "ok", "ok", "ok", "ok", "ok", "ok"]),
      fields: {
        "Кадастровый номер": "10:04:01:02:0031",
        "Назначение": "Склад и офис",
        "Площадь земли": "1.8 га",
        "Площадь строений": "4 200 кв.м",
        "Год ввода": "2018",
        "Материал стен": "Металлоконструкции, сэндвич-панели",
        "Состояние": "Эксплуатируется",
        "Признак изменения": "Нет изменений после проверки"
      },
      monitoring: {
        lastInspection: "2026-05-21",
        inspector: "Дмитрий Орлов",
        condition: "Удовлетворительное",
        nextInspection: "2026-08-21",
        periodicity: "Ежеквартально",
        completed: true,
        schedule: [
          { date: "2026-02-21", type: "Плановый", result: "Без замечаний", inspector: "Дмитрий Орлов", status: "Завершен" },
          { date: "2026-05-21", type: "Плановый", result: "Требуется обновить фото фасада", inspector: "Дмитрий Орлов", status: "Завершен" },
          { date: "2026-08-21", type: "Плановый", result: "Ожидается", inspector: "Не назначен", status: "Запланирован" }
        ]
      },
      evaluations: [
        { date: "2026-03-20", appraiser: "ООО Центр оценки", market: 4200000000, pledge: 3360000000, method: "Доходный и сравнительный", status: "Действует" },
        { date: "2025-03-18", appraiser: "ООО Центр оценки", market: 4050000000, pledge: 3240000000, method: "Сравнительный", status: "Архив" }
      ],
      insurance: {
        company: "АльфаСтрахование",
        policy: "KS-26-000184",
        from: "2026-01-01",
        to: "2026-12-31",
        amount: 3360000000,
        premiumStatus: "Оплачена",
        source: "Конвейер"
      },
      encumbrances: [
        { number: "ZL-26/148-1", date: "2026-01-24", type: "Ипотека", amount: 2900000000, contract: "KM-26/148", allocated: 2900000000, ltv: 70, status: "Зарегистрировано" }
      ],
      pledgors: [
        { share: "100%", name: "ООО СеверСклад", idn: "771 492 2776", role: "Залогодатель", check: "Проверен" }
      ],
      externalData: {
        "Источник": "Сервис данных ЕГРН",
        "Дата проверки": "2026-06-14 09:20",
        "Право собственности": "Подтверждено",
        "Аресты": "Не выявлены",
        "Запреты": "Не выявлены",
        "Внешний залоговый реестр": "Запись активна"
      },
      documents: [
        { name: "Кадастровая выписка.pdf", type: "Право", required: true, status: "Получен из ЕСМ Банка", date: "2026-06-10" },
        { name: "Отчет оценки FV-183.pdf", type: "Оценка", required: true, status: "Подписан", date: "2026-03-20" },
        { name: "Полис KS-26-000184.pdf", type: "Страхование", required: true, status: "Получен из конвейера", date: "2026-01-02" }
      ],
      history: [
        { date: "2026-06-14 10:30", user: "Система", field: "Внешние данные", oldValue: "Проверка от 2026-05-14", newValue: "Проверка от 2026-06-14", reason: "Ежемесячный регламент", source: "Сервис данных ЕГРН" },
        { date: "2026-05-21 16:18", user: "Дмитрий Орлов", field: "Осмотр", oldValue: "Запланирован", newValue: "Завершен", reason: "Плановый мониторинг", source: "АРМ специалиста" }
      ]
    },
    {
      id: "COL-002",
      type: "Автотранспорт",
      description: "Mercedes-Benz Actros 1845, 2022 г., гос. номер 30 A 884 CB",
      clientName: "ООО Волга Логистик",
      clientId: "525 944 1009",
      clientType: "ЮЛ",
      gsz: "ГСЗ Волга Логистик",
      region: "Нижний Новгород",
      address: "Нижний Новгород, ул. Ленина, автопарк 12",
      contractIds: ["CTR-2026-0192"],
      marketValue: 980000000,
      pledgeValue: 784000000,
      allocatedValue: 760000000,
      appraisalStatus: "Истекает",
      appraisalDue: "2026-07-05",
      insuranceStatus: "Истекает",
      insuranceDue: "2026-06-28",
      status: "В залоге",
      crossPledge: false,
      responsible: "Мария Петрова",
      updatedAt: "2026-06-15 15:45",
      source: "Конвейер",
      riskScore: 54,
      riskState: "Требует внимания",
      risks: risks(["critical", "warn", "ok", "warn", "ok", "ok", "ok", "ok"]),
      fields: {
        "VIN": "W1K9634031L978401",
        "Госномер": "30 A 884 CB",
        "Марка/модель": "Mercedes-Benz Actros 1845",
        "Год выпуска": "2022",
        "Пробег": "148 400 км",
        "Состояние": "Рабочее, требуется фото шин",
        "Место хранения": "Автопарк заемщика"
      },
      monitoring: {
        lastInspection: "2026-04-04",
        inspector: "Алексей Соколов",
        condition: "Рабочее",
        nextInspection: "2026-06-20",
        periodicity: "Раз в два месяца",
        completed: false,
        schedule: [
          { date: "2026-04-04", type: "Первичный", result: "Без критических замечаний", inspector: "Алексей Соколов", status: "Завершен" },
          { date: "2026-06-20", type: "Повторный", result: "Ожидается", inspector: "Алексей Соколов", status: "Назначен" }
        ]
      },
      evaluations: [
        { date: "2026-01-09", appraiser: "АвтоЭксперт Плюс", market: 980000000, pledge: 784000000, method: "Сравнительный", status: "Истекает" }
      ],
      insurance: {
        company: "РЕСО-Гарантия",
        policy: "GI-AUTO-26-7791",
        from: "2025-06-29",
        to: "2026-06-28",
        amount: 784000000,
        premiumStatus: "Оплачена",
        source: "АБС"
      },
      encumbrances: [
        { number: "ZL-26/192-1", date: "2026-01-19", type: "Залог ТС", amount: 760000000, contract: "AV-26/192", allocated: 760000000, ltv: 91, status: "Зарегистрировано" }
      ],
      pledgors: [
        { share: "100%", name: "ООО Волга Логистик", idn: "525 944 1009", role: "Залогодатель", check: "Проверен" }
      ],
      externalData: {
        "Источник": "SpectrumData",
        "Дата проверки": "2026-06-15 14:10",
        "Регистрация ТС": "Активна",
        "Аресты": "Не выявлены",
        "Запрет регистрационных действий": "Не выявлен",
        "Розыск": "Не числится"
      },
      documents: [
        { name: "СТС Actros.pdf", type: "Право", required: true, status: "Получен", date: "2026-01-12" },
        { name: "Полис GI-AUTO-26-7791.pdf", type: "Страхование", required: true, status: "Истекает", date: "2025-06-29" }
      ],
      history: [
        { date: "2026-06-15 15:45", user: "Система", field: "Сигнал риска", oldValue: "Нет", newValue: "Истечение страховки", reason: "Срок менее 15 дней", source: "АБС" }
      ]
    },
    {
      id: "COL-003",
      type: "Недвижимость",
      description: "Квартира 82 кв.м, Москва, Хамовники",
      clientName: "Смирнова Елена Викторовна",
      clientId: "772 345 678 901",
      clientType: "ФЛ",
      gsz: "ГСЗ Смирнова",
      region: "Москва",
      address: "Москва, Хамовники, ул. Профсоюзная, дом 9",
      contractIds: ["CTR-2025-0771"],
      marketValue: 1040000000,
      pledgeValue: 755000000,
      allocatedValue: 755000000,
      appraisalStatus: "Просрочена",
      appraisalDue: "2026-04-15",
      insuranceStatus: "Оплачена",
      insuranceDue: "2027-01-10",
      status: "В залоге",
      crossPledge: false,
      responsible: "Анна Кузнецова",
      updatedAt: "2026-06-12 11:05",
      source: "Миграция",
      riskScore: 82,
      riskState: "Критическое",
      risks: risks(["ok", "critical", "warn", "critical", "ok", "critical", "ok", "ok"]),
      fields: {
        "Кадастровый номер": "10:06:04:09:1148",
        "Этаж": "7 из 9",
        "Площадь": "82 кв.м",
        "Комнат": "3",
        "Состояние": "Требуется повторная оценка",
        "Проживание": "Заемщик"
      },
      monitoring: {
        lastInspection: "2025-12-18",
        inspector: "Дмитрий Орлов",
        condition: "Удовлетворительное",
        nextInspection: "2026-06-18",
        periodicity: "Раз в полгода",
        completed: true,
        schedule: [
          { date: "2025-12-18", type: "Плановый", result: "Без замечаний", inspector: "Дмитрий Орлов", status: "Завершен" },
          { date: "2026-06-18", type: "Плановый", result: "Ожидается", inspector: "Не назначен", status: "Запланирован" }
        ]
      },
      evaluations: [
        { date: "2025-04-15", appraiser: "Российская оценочная компания", market: 1040000000, pledge: 755000000, method: "Сравнительный", status: "Просрочена" }
      ],
      insurance: {
        company: "Ингосстрах",
        policy: "UI-RE-25-8830",
        from: "2026-01-10",
        to: "2027-01-10",
        amount: 755000000,
        premiumStatus: "Оплачена",
        source: "АБС"
      },
      encumbrances: [
        { number: "ZL-25/771-1", date: "2025-04-14", type: "Ипотека", amount: 755000000, contract: "IP-25/771", allocated: 755000000, ltv: 108, status: "Судебный риск" }
      ],
      pledgors: [
        { share: "100%", name: "Смирнова Елена Викторовна", idn: "772 345 678 901", role: "Залогодатель", check: "Требуется проверка" }
      ],
      externalData: {
        "Источник": "Сервис данных ЕГРН",
        "Дата проверки": "2026-06-12 10:54",
        "Право собственности": "Подтверждено",
        "Аресты": "Не выявлены",
        "Судебные ограничения": "Есть спор по коммунальной задолженности",
        "Внешний залоговый реестр": "Запись активна"
      },
      documents: [
        { name: "Выписка кадастра 2025.pdf", type: "Право", required: true, status: "Просит обновления", date: "2025-04-13" },
        { name: "Отчет оценки TA-441.pdf", type: "Оценка", required: true, status: "Просрочен", date: "2025-04-15" }
      ],
      history: [
        { date: "2026-06-12 11:05", user: "Система", field: "Сигнал риска", oldValue: "Предупреждение", newValue: "Критический LTV", reason: "LTV 108%", source: "Алгоритм" }
      ]
    },
    {
      id: "COL-004",
      type: "Товары в обороте",
      description: "Хлопковая пряжа и готовая ткань на складе",
      clientName: "ООО СеверТекстиль",
      clientId: "771 482 2110",
      clientType: "ЮЛ",
      gsz: "ГСЗ СеверТекстиль",
      region: "Московская область",
      address: "Склад готовой продукции, линия B",
      contractIds: ["CTR-2026-0148"],
      marketValue: 1000000000,
      pledgeValue: 700000000,
      allocatedValue: 700000000,
      appraisalStatus: "Действует",
      appraisalDue: "2026-10-01",
      insuranceStatus: "Оплачена",
      insuranceDue: "2026-12-31",
      status: "В залоге",
      crossPledge: false,
      responsible: "Павел Смирнов",
      updatedAt: "2026-06-13 09:12",
      source: "АБС",
      riskScore: 29,
      riskState: "Удовлетворительное",
      risks: risks(["ok", "ok", "warn", "ok", "warn", "ok", "ok", "ok"]),
      fields: {
        "Группа товаров": "Текстильная продукция",
        "Объем": "620 тонн",
        "Место хранения": "Склад готовой продукции",
        "Метод контроля": "Складской акт и фотофиксация",
        "Периодичность сверки": "Ежемесячно"
      },
      monitoring: {
        lastInspection: "2026-06-01",
        inspector: "Павел Смирнов",
        condition: "Частичное движение партии",
        nextInspection: "2026-07-01",
        periodicity: "Ежемесячно",
        completed: true,
        schedule: [
          { date: "2026-06-01", type: "Плановый", result: "Остаток подтвержден", inspector: "Павел Смирнов", status: "Завершен" },
          { date: "2026-07-01", type: "Плановый", result: "Ожидается", inspector: "Не назначен", status: "Запланирован" }
        ]
      },
      evaluations: [
        { date: "2026-05-30", appraiser: "Внутренняя оценка", market: 1000000000, pledge: 700000000, method: "Складская сверка", status: "Действует" }
      ],
      insurance: {
        company: "АльфаСтрахование",
        policy: "KS-STOCK-26-041",
        from: "2026-01-01",
        to: "2026-12-31",
        amount: 700000000,
        premiumStatus: "Оплачена",
        source: "Конвейер"
      },
      encumbrances: [
        { number: "ZL-26/148-2", date: "2026-01-24", type: "Залог товаров", amount: 700000000, contract: "KM-26/148", allocated: 700000000, ltv: 70, status: "Зарегистрировано" }
      ],
      pledgors: [
        { share: "100%", name: "ООО СеверТекстиль", idn: "771 482 2110", role: "Залогодатель", check: "Проверен" }
      ],
      externalData: {
        "Источник": "Триггер мониторинга",
        "Дата проверки": "2026-06-13 09:12",
        "Складской остаток": "Подтвержден частично",
        "Статус взыскания": "Нет",
        "Сигнал реализации": "Нет"
      },
      documents: [
        { name: "Складской акт 06-2026.xlsx", type: "Мониторинг", required: true, status: "Загружен", date: "2026-06-01" }
      ],
      history: [
        { date: "2026-06-13 09:12", user: "Система", field: "Остаток партии", oldValue: "680 тонн", newValue: "620 тонн", reason: "Складская сверка", source: "Триггер мониторинга" }
      ]
    },
    {
      id: "COL-005",
      type: "Оборудование",
      description: "Линия сортировки и упаковки сухофруктов Unitec",
      clientName: "АО Кубань Агро Экспорт",
      clientId: "231 011 8454",
      clientType: "ЮЛ",
      gsz: "ГСЗ Агро Экспорт",
      region: "Краснодар",
      address: "Краснодар, промышленная зона Тихорецкая",
      contractIds: ["CTR-2026-0228", "CTR-2026-0316"],
      marketValue: 2400000000,
      pledgeValue: 1920000000,
      allocatedValue: 1720000000,
      appraisalStatus: "Действует",
      appraisalDue: "2027-02-01",
      insuranceStatus: "Оплачена",
      insuranceDue: "2027-02-01",
      status: "В залоге",
      crossPledge: true,
      responsible: "Елена Морозова",
      updatedAt: "2026-06-10 13:10",
      source: "Конвейер",
      riskScore: 22,
      riskState: "Хорошее",
      risks: risks(["ok", "ok", "ok", "ok", "ok", "ok", "warn", "ok"]),
      fields: {
        "Серийный номер": "UT-DRY-22-901",
        "Производитель": "Unitec",
        "Год выпуска": "2022",
        "Местонахождение": "Производственный цех 2",
        "Техническое состояние": "Рабочее",
        "Право собственности": "Инвойс и акт ввода"
      },
      monitoring: {
        lastInspection: "2026-05-28",
        inspector: "Елена Морозова",
        condition: "Работает",
        nextInspection: "2026-08-28",
        periodicity: "Ежеквартально",
        completed: true,
        schedule: [
          { date: "2026-05-28", type: "Плановый", result: "Оборудование на месте", inspector: "Елена Морозова", status: "Завершен" }
        ]
      },
      evaluations: [
        { date: "2026-02-01", appraiser: "Tech Appraisal", market: 2400000000, pledge: 1920000000, method: "Затратный", status: "Действует" }
      ],
      insurance: {
        company: "Apex Insurance",
        policy: "APX-EQ-26-2910",
        from: "2026-02-01",
        to: "2027-02-01",
        amount: 1920000000,
        premiumStatus: "Оплачена",
        source: "Конвейер"
      },
      encumbrances: [
        { number: "ZL-26/228-1", date: "2026-02-05", type: "Залог оборудования", amount: 1200000000, contract: "BG-26/228", allocated: 1200000000, ltv: 69, status: "Зарегистрировано" },
        { number: "ZL-26/316-1", date: "2026-03-18", type: "Кросс-обременение оборудования", amount: 520000000, contract: "LC-26/316", allocated: 520000000, ltv: 85, status: "Зарегистрировано" }
      ],
      pledgors: [
        { share: "100%", name: "АО Кубань Агро Экспорт", idn: "231 011 8454", role: "Залогодатель", check: "Проверен" }
      ],
      externalData: {
        "Источник": "АБС + ЕСМ Банка",
        "Дата проверки": "2026-06-10 13:10",
        "Документы собственности": "Подтверждены",
        "Ограничения": "Не выявлены",
        "Признак двойного залога": "Проверить кросс-связь"
      },
      documents: [
        { name: "Инвойс Unitec.pdf", type: "Право", required: true, status: "Получен из ЕСМ Банка", date: "2026-02-01" },
        { name: "Акт ввода оборудования.pdf", type: "Право", required: true, status: "Получен из ЕСМ Банка", date: "2026-02-02" }
      ],
      history: [
        { date: "2026-06-10 13:10", user: "Система", field: "Признак кросс-залога", oldValue: "Нет", newValue: "Да", reason: "Связка с обеспечением COL-008", source: "Аллокация" }
      ]
    },
    {
      id: "COL-006",
      type: "Автотранспорт",
      description: "Hyundai HD78, 2021 г., гос. номер 30 B 221 DA",
      clientName: "ООО Волга Логистик",
      clientId: "525 944 1009",
      clientType: "ЮЛ",
      gsz: "ГСЗ Волга Логистик",
      region: "Нижний Новгород",
      address: "Нижний Новгород, ул. Ленина, автопарк 12",
      contractIds: ["CTR-2026-0192"],
      marketValue: 780000000,
      pledgeValue: 626000000,
      allocatedValue: 650000000,
      appraisalStatus: "Действует",
      appraisalDue: "2026-11-12",
      insuranceStatus: "Оплачена",
      insuranceDue: "2026-11-12",
      status: "В залоге",
      crossPledge: false,
      responsible: "Мария Петрова",
      updatedAt: "2026-06-11 12:22",
      source: "Конвейер",
      riskScore: 32,
      riskState: "Удовлетворительное",
      risks: risks(["ok", "ok", "ok", "warn", "ok", "ok", "ok", "ok"]),
      fields: {
        "VIN": "KMFLA18APMC349121",
        "Госномер": "30 B 221 DA",
        "Марка/модель": "Hyundai HD78",
        "Год выпуска": "2021",
        "Пробег": "92 100 км",
        "Состояние": "Рабочее"
      },
      monitoring: {
        lastInspection: "2026-05-11",
        inspector: "Алексей Соколов",
        condition: "Рабочее",
        nextInspection: "2026-07-11",
        periodicity: "Раз в два месяца",
        completed: true,
        schedule: [
          { date: "2026-05-11", type: "Плановый", result: "Без замечаний", inspector: "Алексей Соколов", status: "Завершен" }
        ]
      },
      evaluations: [
        { date: "2026-02-12", appraiser: "АвтоЭксперт Плюс", market: 780000000, pledge: 626000000, method: "Сравнительный", status: "Действует" }
      ],
      insurance: {
        company: "РЕСО-Гарантия",
        policy: "GI-AUTO-26-8011",
        from: "2025-11-12",
        to: "2026-11-12",
        amount: 626000000,
        premiumStatus: "Оплачена",
        source: "АБС"
      },
      encumbrances: [
        { number: "ZL-26/192-2", date: "2026-02-12", type: "Залог ТС", amount: 650000000, contract: "AV-26/192", allocated: 650000000, ltv: 98, status: "Зарегистрировано" }
      ],
      pledgors: [
        { share: "100%", name: "ООО Волга Логистик", idn: "525 944 1009", role: "Залогодатель", check: "Проверен" }
      ],
      externalData: {
        "Источник": "SpectrumData",
        "Дата проверки": "2026-06-11 12:22",
        "Регистрация ТС": "Активна",
        "Аресты": "Не выявлены",
        "Запреты": "Не выявлены"
      },
      documents: [
        { name: "СТС Hyundai.pdf", type: "Право", required: true, status: "Получен", date: "2026-02-12" }
      ],
      history: [
        { date: "2026-06-11 12:22", user: "Система", field: "Внешняя проверка", oldValue: "Не выполнялась", newValue: "Без замечаний", reason: "Регламент", source: "SpectrumData" }
      ]
    },
    {
      id: "COL-007",
      type: "Оборудование",
      description: "Печатная линия Heidelberg Speedmaster XL 106",
      clientName: "ООО Север Принт Пак",
      clientId: "780 600 2779",
      clientType: "ЮЛ",
      gsz: "ГСЗ Север Принт Пак",
      region: "Москва",
      address: "Москва, Промышленный район, цех 3",
      contractIds: ["CTR-2024-0644"],
      marketValue: 4950000000,
      pledgeValue: 3710000000,
      allocatedValue: 3710000000,
      appraisalStatus: "Действует",
      appraisalDue: "2026-12-04",
      insuranceStatus: "Не оплачена",
      insuranceDue: "2026-07-01",
      status: "В залоге",
      crossPledge: false,
      responsible: "Дмитрий Орлов",
      updatedAt: "2026-06-09 17:40",
      source: "АБС",
      riskScore: 61,
      riskState: "Требует внимания",
      risks: risks(["critical", "ok", "warn", "warn", "ok", "ok", "ok", "ok"]),
      fields: {
        "Серийный номер": "HDXL106-19-4781",
        "Производитель": "Heidelberg",
        "Год выпуска": "2019",
        "Состояние": "Рабочее",
        "Местонахождение": "Производственный цех 3",
        "Валюта оценки": "RUB"
      },
      monitoring: {
        lastInspection: "2026-05-30",
        inspector: "Дмитрий Орлов",
        condition: "Работает",
        nextInspection: "2026-08-30",
        periodicity: "Ежеквартально",
        completed: true,
        schedule: [
          { date: "2026-05-30", type: "Плановый", result: "Без замечаний", inspector: "Дмитрий Орлов", status: "Завершен" }
        ]
      },
      evaluations: [
        { date: "2025-12-04", appraiser: "Tech Appraisal", market: 4950000000, pledge: 3710000000, method: "Затратный", status: "Действует" }
      ],
      insurance: {
        company: "Apex Insurance",
        policy: "APX-EQ-25-712",
        from: "2025-07-01",
        to: "2026-07-01",
        amount: 3710000000,
        premiumStatus: "Ожидает оплату",
        source: "АБС"
      },
      encumbrances: [
        { number: "ZL-24/644-1", date: "2024-09-22", type: "Залог оборудования", amount: 3710000000, contract: "KL-24/644", allocated: 3710000000, ltv: 92, status: "Зарегистрировано" }
      ],
      pledgors: [
        { share: "100%", name: "ООО Север Принт Пак", idn: "780 600 2779", role: "Залогодатель", check: "Проверен" }
      ],
      externalData: {
        "Источник": "АБС",
        "Дата проверки": "2026-06-09 17:40",
        "Статус страхования": "Премия не оплачена",
        "Статус взыскания": "Нет",
        "Ограничения": "Не выявлены"
      },
      documents: [
        { name: "Отчет оценки Heidelberg.pdf", type: "Оценка", required: true, status: "Подписан", date: "2025-12-04" },
        { name: "Полис APX-EQ-25-712.pdf", type: "Страхование", required: true, status: "Премия не оплачена", date: "2025-07-01" }
      ],
      history: [
        { date: "2026-06-09 17:40", user: "Система", field: "Оплата страховой премии", oldValue: "Оплачена", newValue: "Ожидает оплату", reason: "Сверка АБС", source: "АБС" }
      ]
    },
    {
      id: "COL-008",
      type: "Скот",
      description: "Поголовье КРС мясного направления, 340 голов",
      clientName: "АО Кубань Агро Экспорт",
      clientId: "231 011 8454",
      clientType: "ЮЛ",
      gsz: "ГСЗ Агро Экспорт",
      region: "Краснодар",
      address: "Краснодарский край, ферма Тихорецкая",
      contractIds: ["CTR-2026-0228", "CTR-2026-0316"],
      marketValue: 1200000000,
      pledgeValue: 680000000,
      allocatedValue: 680000000,
      appraisalStatus: "Действует",
      appraisalDue: "2026-08-10",
      insuranceStatus: "Оплачена",
      insuranceDue: "2026-12-20",
      status: "В залоге",
      crossPledge: true,
      responsible: "Елена Морозова",
      updatedAt: "2026-06-08 08:52",
      source: "Триггер мониторинга",
      riskScore: 45,
      riskState: "Удовлетворительное",
      risks: risks(["ok", "warn", "warn", "ok", "warn", "ok", "warn", "ok"]),
      fields: {
        "Вид имущества": "Крупный рогатый скот",
        "Поголовье": "340 голов",
        "Метод идентификации": "Бирки и ветеринарный журнал",
        "Место содержания": "Ферма Тихорецкая",
        "Последняя сверка": "2026-06-08"
      },
      monitoring: {
        lastInspection: "2026-06-08",
        inspector: "Елена Морозова",
        condition: "Поголовье подтверждено частично",
        nextInspection: "2026-07-08",
        periodicity: "Ежемесячно",
        completed: true,
        schedule: [
          { date: "2026-06-08", type: "Плановый", result: "328 голов подтверждено", inspector: "Елена Морозова", status: "Завершен" }
        ]
      },
      evaluations: [
        { date: "2026-02-10", appraiser: "Внутренняя оценка", market: 1200000000, pledge: 680000000, method: "Справочник цен", status: "Действует" }
      ],
      insurance: {
        company: "Agro Insurance",
        policy: "AGR-26-330",
        from: "2025-12-20",
        to: "2026-12-20",
        amount: 680000000,
        premiumStatus: "Оплачена",
        source: "Конвейер"
      },
      encumbrances: [
        { number: "ZL-26/228-2", date: "2026-02-06", type: "Залог скота", amount: 520000000, contract: "BG-26/228", allocated: 520000000, ltv: 69, status: "Зарегистрировано" },
        { number: "ZL-26/316-2", date: "2026-03-18", type: "Кросс-обременение скота", amount: 160000000, contract: "LC-26/316", allocated: 160000000, ltv: 85, status: "Зарегистрировано" }
      ],
      pledgors: [
        { share: "100%", name: "АО Кубань Агро Экспорт", idn: "231 011 8454", role: "Залогодатель", check: "Проверен" }
      ],
      externalData: {
        "Источник": "Триггер мониторинга",
        "Дата проверки": "2026-06-08 08:52",
        "Сигнал мониторинга": "Расхождение по 12 головам",
        "Статус взыскания": "Нет",
        "Требование": "Повторный осмотр"
      },
      documents: [
        { name: "Ветеринарный журнал 06-2026.pdf", type: "Мониторинг", required: true, status: "Загружен", date: "2026-06-08" }
      ],
      history: [
        { date: "2026-06-08 08:52", user: "Система", field: "Поголовье", oldValue: "340", newValue: "328 подтверждено", reason: "Плановый мониторинг", source: "Триггер мониторинга" }
      ]
    },
    ...buildDemoAutoFleetCollaterals(),
    ...buildInspectionExampleCollaterals()
  ],
  tasks: [
    // Generated extended demo task queue.
    {
      id: "TSK-2026-1176",
      type: "Дефектовка",
      title: "Провести дефектовку Hyundai HD78 после выявленных замечаний",
      collateralId: "COL-006",
      collateralIds: ["COL-006"],
      applicationId: "APP-2026-0418",
      contractId: "CTR-2026-0192",
      contractNumber: "AV-26/192",
      client: "ООО Волга Логистик",
      assignee: "Павел Смирнов",
      status: "В работе",
      dueDate: "2026-08-27",
      createdAt: "2026-08-25",
      sla: "Завтра",
      priority: "Высокий",
      source: "Задача осмотра",
      route: ["Заявка", "Специалист осмотра", "Контрагент", "Руководитель"],
      result: "Требуется диагностический акт по техническому состоянию автомобиля и итоговый комментарий по результату дефектовки.",
      defectInspection: {
        diagnosticDate: "2026-08-25",
        diagnosticAddress: "Нижний Новгород, промзона Автозаводская",
        basis: "Повторная проверка после замечаний по техническому состоянию и комплекту документов"
      },
      documents: [
        { name: "Задание на дефектовку Hyundai HD78.pdf", target: "task" },
        { name: "Фото повреждений Hyundai HD78.zip", target: "COL-006" },
        { name: "Диагностический акт Hyundai HD78.pdf", target: "task" }
      ],
      history: [
        { date: "2026-08-25 15:10", user: "Система", action: "Создана задача", status: "Назначена", comment: "Задача дефектовки создана по результатам осмотра COL-006" },
        { date: "2026-08-25 15:30", user: "Павел Смирнов", action: "Взята в работу", status: "В работе", comment: "Ожидается диагностический акт контрагента" }
      ]
    },
    {
      id: "TSK-2026-1175",
      type: "Регистрация залога",
      title: "Зарегистрировать залог двух автомобилей по договору AV-26/192",
      collateralId: "COL-002",
      collateralIds: ["COL-002", "COL-006"],
      applicationId: "APP-2026-0423",
      contractId: "CTR-2026-0192",
      contractNumber: "AV-26/192",
      client: "ООО Волга Логистик",
      assignee: "Мария Петрова",
      status: "В работе",
      dueDate: "2026-08-26",
      createdAt: "2026-08-25",
      sla: "Завтра",
      priority: "Средний",
      source: "Заявка",
      route: ["Заявка", "Специалист", "АБС"],
      registrationScenario: "Регистрация залога движимого имущества",
      registrationStatuses: {
        "COL-002": "Проверяется комплект",
        "COL-006": "Готовится регистрация"
      },
      result: "По договору AV-26/192 требуется зарегистрировать залог двух транспортных средств одним пакетом: сверить VIN, регистрационные ограничения, документы и подготовить передачу данных в АБС.",
      documents: [
        { name: "Заявка на регистрацию залога AV-26-192.pdf", target: "task" },
        { name: "Договор залога AV-26-192.pdf", target: "task" },
        { name: "СТС Mercedes-Benz Actros.pdf", target: "COL-002" },
        { name: "СТС Hyundai HD78.pdf", target: "COL-006" }
      ],
      history: [
        { date: "2026-08-25 13:35", user: "Мария Петрова", action: "Создана заявка", status: "Новая", comment: "Инициатор завел заявку на регистрацию двух автомобилей по договору AV-26/192" },
        { date: "2026-08-25 13:36", user: "Система", action: "Создана задача", status: "Назначена", comment: "Первая задача создана автоматически по виду заявки и объектам залога" },
        { date: "2026-08-25 14:05", user: "Мария Петрова", action: "Взята в работу", status: "В работе", comment: "Проверяется общий пакет документов и идентификаторы транспортных средств" }
      ]
    },
    {
      id: "TSK-2026-1174",
      type: "Регистрация залога",
      title: "Зарегистрировать залог квартиры и оборудования по договору MX-26/405",
      collateralId: "COL-045",
      collateralIds: ["COL-045", "COL-048"],
      applicationId: "APP-2026-0422",
      contractId: "CTR-2026-0405",
      contractNumber: "MX-26/405",
      client: "ООО Столичный Девелопмент",
      assignee: "Анна Кузнецова",
      status: "В работе",
      dueDate: "2026-08-26",
      createdAt: "2026-08-25",
      sla: "Завтра",
      priority: "Высокий",
      source: "Заявка",
      route: ["Заявка", "Специалист", "АБС"],
      registrationScenario: "Регистрация недвижимости (выезд)",
      registrationStatuses: {
        "COL-045": "Проверяется комплект",
        "COL-048": "Готовится регистрация"
      },
      result: "По договору MX-26/405 требуется зарегистрировать квартиру и оборудование одним пакетом: проверить общий договор, залогодателя, документы по каждому объекту и подготовить передачу данных в АБС.",
      documents: [
        { name: "Заявка на регистрацию залога MX-26-405.pdf", target: "task" },
        { name: "Договор залога MX-26-405.pdf", target: "task" },
        { name: "Выписка ЕГРН COL-045.pdf", target: "COL-045" },
        { name: "Инвойс и акт ввода COL-048.pdf", target: "COL-048" }
      ],
      history: [
        { date: "2026-08-25 13:10", user: "Анна Кузнецова", action: "Создана заявка", status: "Новая", comment: "Инициатор завел заявку на регистрацию залога по договору MX-26/405" },
        { date: "2026-08-25 13:12", user: "Система", action: "Создана задача", status: "Назначена", comment: "Первая задача создана автоматически по виду заявки и объектам залога" },
        { date: "2026-08-25 13:25", user: "Анна Кузнецова", action: "Взята в работу", status: "В работе", comment: "Проверяется общий комплект документов по договору и объектам" }
      ]
    },
    {
      id: "TSK-2026-1161",
      type: "Первичный осмотр",
      inspectionFormat: "Документарный осмотр",
      title: "Документарно проверить спецтехнику, воздушные суда и земельный участок АэроТех Лизинг",
      collateralId: "COL-050",
      collateralIds: ["COL-050", "COL-051", "COL-052", "COL-053", "COL-054", "COL-055"],
      applicationId: "APP-2026-0421",
      contractId: "CTR-2026-0406",
      client: "АО АэроТех Лизинг",
      assignee: "Мария Петрова",
      status: "Назначена",
      dueDate: "2026-06-27",
      createdAt: "2026-06-19",
      sla: "Неделя",
      priority: "Средний",
      source: "Конвейер",
      route: ["Конвейер", "Распознавание документов", "Специалист"],
      result: "В задаче 6 объектов: 2 единицы самоходной техники, 3 воздушных судна и 1 земельный участок. Проверить правоустанавливающие документы, реестровые сведения, страхование и ограничения без выезда на объект.",
      documents: [
        { name: "Реестр объектов для документарного осмотра.xlsx", target: "task" },
        { name: "Пакет регистрационных документов АэроТех Лизинг.zip", target: "task" }
      ],
      history: [
        { date: "2026-06-19 11:05", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Документы по спецтехнике, воздушным судам и земельному участку переданы на проверку" }
      ]
    },
    {
      id: "TSK-2026-1160",
      type: "Первичный осмотр",
      inspectionFormat: "Физический осмотр",
      title: "Физически осмотреть смешанный пул залогов Столичный Девелопмент",
      collateralId: "COL-040",
      collateralIds: ["COL-040", "COL-041", "COL-042", "COL-043", "COL-044", "COL-045", "COL-046", "COL-047", "COL-048", "COL-049"],
      applicationId: "APP-2026-0420",
      contractId: "CTR-2026-0405",
      client: "ООО Столичный Девелопмент",
      assignee: "Дмитрий Орлов",
      status: "Назначена",
      dueDate: "2026-06-26",
      createdAt: "2026-06-19",
      sla: "Неделя",
      priority: "Высокий",
      source: "Конвейер",
      route: ["Конвейер", "Распознавание документов", "Специалист"],
      result: "В задаче 10 объектов: 5 машин, 3 квартиры и 2 единицы оборудования. Нужно подтвердить фактическое наличие, состояние, идентификаторы, адреса и комплект документов.",
      inspectionAnswers: {
        "COL-040": {
          "AUTO-RISK-RESTRICTIONS": "warn",
          "AUTO-INSPECT-ID": "warn"
        },
        "COL-045": {
          "REALTY-RIGHTS-ENC": "warn",
          "REALTY-ID-CAD": "warn",
          "REALTY-STATE-PLAN": "bad"
        },
        "COL-048": {
          "EQ-STATE-WORK": "warn",
          "EQ-STATE-ACCESS": "warn"
        }
      },
      inspectionChecklistComments: {
        "COL-040": {
          "AUTO-RISK-RESTRICTIONS": "По внешней проверке есть сигнал о регистрационном ограничении, требуется подтверждающий документ от инициатора.",
          "AUTO-INSPECT-ID": "Маркировка читается частично, фото VIN нужно обновить."
        },
        "COL-045": {
          "REALTY-RIGHTS-ENC": "В выписке ЕГРН есть запись, требующая анализа перед расчетом стоимости.",
          "REALTY-ID-CAD": "Площадь по документам и фактическое описание отличаются, нужна сверка технического плана.",
          "REALTY-STATE-PLAN": "Выявлены неподтвержденные изменения планировки."
        },
        "COL-048": {
          "EQ-STATE-WORK": "Запуск оборудования не продемонстрирован, требуется акт технического состояния.",
          "EQ-STATE-ACCESS": "Доступ к оборудованию ограничен режимом технического помещения."
        }
      },
      inspectionResolutions: {
        "COL-040": {
          comment: "При оценке учитывать регистрационный сигнал и необходимость обновить фото маркировки."
        },
        "COL-045": {
          comment: "При оценке учитывать запись в ЕГРН, расхождение площади и неподтвержденную перепланировку."
        },
        "COL-048": {
          comment: "При оценке учитывать ограниченный доступ и отсутствие подтверждения запуска оборудования."
        }
      },
      documents: [
        { name: "Реестр объектов к физическому осмотру.xlsx", target: "task" },
        { name: "Маршрутный лист осмотра Столичный Девелопмент.pdf", target: "task" }
      ],
      history: [
        { date: "2026-06-19 09:20", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Сформирован смешанный пул объектов для физического осмотра" }
      ]
    },
    {
      id: "TSK-2026-1142",
      type: "Составление отчетности",
      title: "Сформировать отчетность по залоговому портфелю за июнь",
      collateralId: "COL-001",
      collateralIds: ["COL-001", "COL-002", "COL-003"],
      contractId: "CTR-2026-0148",
      client: "Управление залогов",
      assignee: "Сергей Иванов",
      status: "Назначена",
      dueDate: "2026-06-20",
      createdAt: "2026-06-17",
      sla: "Неделя",
      priority: "Средний",
      source: "Email",
      route: ["Почтовый сервер", "Руководитель", "Печатная форма"],
      result: "Ожидается формирование сводного отчета по статусам, видам залогов и страхованию",
      history: [
        { date: "2026-06-17 09:10", user: "Почтовый сервер", action: "Создана задача", status: "Назначена", comment: "Распознан запрос на отчетность за период" }
      ]
    },
    {
      id: "TSK-2026-1154",
      type: "Первичный осмотр",
      inspectionFormat: "Физический осмотр",
      title: "Первично осмотреть транспортный пул Волга Логистик",
      collateralId: "COL-002",
      collateralIds: ["COL-002", "COL-006", "COL-020", "COL-021", "COL-022"],
      applicationId: "APP-2026-0418",
      contractId: "CTR-2026-0192",
      client: "ООО Волга Логистик",
      assignee: "Анна Кузнецова",
      status: "В работе",
      dueDate: "2026-06-21",
      createdAt: "2026-06-18",
      sla: "Неделя",
      priority: "Высокий",
      source: "Вручную",
      route: ["Специалист"],
      result: "Необходимо проверить идентификаторы 5 транспортных средств, комплект документов, фотофиксацию и страхование объектов.",
      documents: [
        { name: "СТС Actros.pdf", target: "COL-002" },
        { name: "Реестр ТС к первичному осмотру.xlsx", target: "task" }
      ],
      history: [
        { date: "2026-06-18 10:15", user: "Анна Кузнецова", action: "Создана задача", status: "Назначена", comment: "Создана вручную для проверки первичного осмотра" },
        { date: "2026-06-18 10:25", user: "Анна Кузнецова", action: "Взята в работу", status: "В работе", comment: "Начата сверка документов и фотофиксации объекта" }
      ]
    },
    {
      id: "TSK-2026-1153",
      type: "Повторный осмотр",
      title: "Повторно проверить складской комплекс после замечаний",
      collateralId: "COL-001",
      applicationId: "APP-2026-0417",
      contractId: "CTR-2026-0148",
      client: "ООО СеверТекстиль",
      assignee: "Анна Кузнецова",
      status: "Назначена",
      dueDate: "2026-06-22",
      createdAt: "2026-06-18",
      sla: "Неделя",
      priority: "Средний",
      source: "Вручную",
      route: ["Специалист"],
      result: "Требуется повторно проверить устранение замечаний по фото фасада, входной группе и документам на объект.",
      documents: [
        { name: "Замечания по предыдущему осмотру.pdf", target: "task" }
      ],
      history: [
        { date: "2026-06-18 10:40", user: "Анна Кузнецова", action: "Создана задача", status: "Назначена", comment: "Создана вручную для повторного осмотра после замечаний" }
      ]
    },
    {
      id: "TSK-2026-1152",
      type: "Списочная переоценка",
      title: "Списочная переоценка автопарка Волга Логистик: 10 машин",
      collateralId: "COL-002",
      collateralIds: ["COL-002", "COL-006", "COL-020", "COL-021", "COL-022", "COL-023", "COL-024", "COL-025", "COL-026", "COL-027"],
      applicationId: "APP-2026-0418",
      contractId: "CTR-2026-0192",
      client: "ООО Волга Логистик",
      assignee: "Анна Кузнецова",
      status: "В работе",
      dueDate: "2026-06-24",
      createdAt: "2026-06-18",
      sla: "Неделя",
      priority: "Высокий",
      source: "Расписание",
      route: ["Планировщик", "Специалист", "Руководитель"],
      result: "Требуется списочно пересчитать рыночную и залоговую стоимость 10 транспортных средств автопарка",
      listRevaluation: {
        strategy: "Автопарк 10 ТС",
        reason: "Регламентная списочная переоценка автопарка",
        valuationDate: "2026-06-19",
        method: "Рыночные источники",
        scope: "Все объекты",
        marketDelta: -8,
        pledgeMode: "От рыночной и дисконта",
        discount: 24,
        roundTo: "10 000",
        reviewThreshold: 7,
        source: "Авто.ру",
        comment: "Автоматический расчет по транспортному пулу с выделением объектов на ручную проверку.",
        excludedCollateralIds: [],
        typeDiscounts: { "Автотранспорт": 24 },
        rowOverrides: {}
      },
      documents: [
        { name: "Реестр автопарка для списочной переоценки.xlsx", target: "task" }
      ],
      history: [
        { date: "2026-06-18 08:20", user: "Планировщик", action: "Создана задача", status: "Назначена", comment: "Наступил срок списочной переоценки автопарка" },
        { date: "2026-06-18 09:05", user: "Анна Кузнецова", action: "Взята в работу", status: "В работе", comment: "Запущен расчет по 10 транспортным средствам" }
      ]
    },
    {
      id: "TSK-2026-1151",
      type: "Списочная переоценка",
      title: "Списочная переоценка смешанного пула залогов",
      collateralId: "COL-001",
      collateralIds: ["COL-001", "COL-002", "COL-004", "COL-005", "COL-008"],
      applicationId: "APP-2026-0417",
      contractId: "CTR-2026-0148",
      client: "Управление залогов",
      assignee: "Анна Кузнецова",
      status: "Назначена",
      dueDate: "2026-06-25",
      createdAt: "2026-06-18",
      sla: "Неделя",
      priority: "Средний",
      source: "Расписание",
      route: ["Планировщик", "Специалист", "Руководитель"],
      result: "Смешанный пул из 5 объектов разных видов имущества подготовлен для массовой переоценки",
      listRevaluation: {
        strategy: "Смешанный пул",
        reason: "Плановая переоценка разных видов имущества",
        valuationDate: "2026-06-19",
        method: "Индексация по рынку",
        scope: "Все объекты",
        marketDelta: -5,
        pledgeMode: "От рыночной и дисконта",
        discount: 25,
        roundTo: "100 000",
        reviewThreshold: 8,
        source: "Регламентная индексация по видам имущества",
        comment: "Проверить влияние на договоры и выделить объекты, требующие индивидуальной оценки.",
        excludedCollateralIds: [],
        typeDiscounts: { "Недвижимость": 18, "Автотранспорт": 22, "Товары в обороте": 30, "Оборудование": 28, "Скот": 35 },
        rowOverrides: {}
      },
      documents: [
        { name: "Смешанный пул залогов для переоценки.xlsx", target: "task" }
      ],
      history: [
        { date: "2026-06-18 08:10", user: "Планировщик", action: "Создана задача", status: "Назначена", comment: "Сформирован пул из 5 разных объектов залога" }
      ]
    },
    {
      id: "TSK-2026-1141",
      type: "Списочная переоценка",
      title: "Массово обновить стоимость транспортного пула Волга Логистик",
      collateralId: "COL-002",
      collateralIds: ["COL-002", "COL-006"],
      contractId: "CTR-2026-0192",
      client: "ООО Волга Логистик",
      assignee: "Мария Петрова",
      status: "В работе",
      dueDate: "2026-06-22",
      createdAt: "2026-06-17",
      sla: "Неделя",
      priority: "Высокий",
      source: "Расписание",
      route: ["Планировщик", "Специалист", "Руководитель"],
      result: "Два объекта в списке, требуется подтвердить новые рыночные и залоговые стоимости",
      documents: [
        { name: "Реестр объектов для списочной переоценки.xlsx", target: "task" }
      ],
      history: [
        { date: "2026-06-17 08:00", user: "Планировщик", action: "Создана задача", status: "Назначена", comment: "Наступила дата списочной переоценки" },
        { date: "2026-06-17 10:30", user: "Мария Петрова", action: "Взята в работу", status: "В работе", comment: "Запущена сверка рыночных источников" }
      ]
    },
    {
      id: "TSK-2026-1140",
      type: "Первичный осмотр",
      title: "Первично осмотреть оборудование и поголовье Кубань Агро",
      collateralId: "COL-005",
      collateralIds: ["COL-005", "COL-008"],
      applicationId: "APP-2026-0419",
      contractId: "CTR-2026-0228",
      client: "АО Кубань Агро Экспорт",
      assignee: "Елена Морозова",
      status: "Назначена",
      dueDate: "2026-06-19",
      createdAt: "2026-06-17",
      sla: "Неделя",
      priority: "Средний",
      source: "Конвейер",
      route: ["Конвейер", "Распознавание документов", "Специалист"],
      result: "В задаче два предмета залога: оборудование и поголовье. Нужно сверить документы, фактическое наличие, условия эксплуатации и содержания.",
      documents: [
        { name: "Комплект документов Кубань Агро.zip", target: "task" },
        { name: "Реестр объектов к первичному осмотру.xlsx", target: "collateral" }
      ],
      history: [
        { date: "2026-06-17 11:42", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Пакет документов передан из конвейера" }
      ]
    },
    {
      id: "TSK-2026-1170",
      type: "Единичная переоценка",
      title: "Оценить пул транспортных средств Волга Логистик",
      collateralId: "COL-002",
      collateralIds: ["COL-002", "COL-006", "COL-020", "COL-021", "COL-022"],
      applicationId: "APP-2026-0418",
      contractId: "CTR-2026-0192",
      client: "ООО Волга Логистик",
      assignee: "Мария Петрова",
      status: "В работе",
      dueDate: "2026-08-26",
      createdAt: "2026-08-25",
      sla: "Завтра",
      priority: "Высокий",
      source: "Заявка",
      route: ["Заявка", "Специалист", "Руководитель"],
      result: "В рамках заявки требуется обновить стоимость 5 транспортных средств с учетом рыночных аналогов и состояния по осмотрам.",
      marketAnalogManualValues: {
        "COL-002": {
          "2": {
            link: "Экспертный подбор",
            name: "Mercedes-Benz Actros 1845, 2021 г.",
            identifier: "WDB9634031L202145",
            year: "2021",
            usageMetric: "151 000 км",
            configuration: "Седельный тягач 4x2, Евро-5",
            details: "Сопоставимое техническое состояние, требуется корректировка на пробег",
            region: "Нижний Новгород",
            saleTerms: "Цена предложения с НДС",
            price: "965 000 000"
          }
        }
      },
      documents: [
        { name: "Заявка на переоценку автопарка Волга Логистик.pdf", target: "task" },
        { name: "Реестр ТС к оценке.xlsx", target: "task" }
      ],
      history: [
        { date: "2026-08-25 09:10", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Первая задача создана автоматически из заявки на переоценку автопарка" },
        { date: "2026-08-25 09:35", user: "Мария Петрова", action: "Взята в работу", status: "В работе", comment: "Начат подбор аналогов по транспортным средствам" }
      ]
    },
    {
      id: "TSK-2026-1171",
      type: "Единичная переоценка",
      title: "Оценить пул квартир Столичный Девелопмент",
      collateralId: "COL-045",
      collateralIds: ["COL-045", "COL-046", "COL-047"],
      applicationId: "APP-2026-0420",
      contractId: "CTR-2026-0405",
      client: "ООО Столичный Девелопмент",
      assignee: "Анна Кузнецова",
      status: "Назначена",
      dueDate: "2026-08-26",
      createdAt: "2026-08-25",
      sla: "Завтра",
      priority: "Средний",
      source: "Заявка",
      route: ["Заявка", "Специалист", "Руководитель"],
      result: "Требуется оценить 3 квартиры по сопоставимым объектам района и обновить залоговую стоимость по договору.",
      marketAnalogManualValues: {
        "COL-045": {
          "0": {
            link: "Циан",
            name: "Квартира 72 кв.м, район Аэропорт",
            identifier: "77:09:0004011:5045",
            region: "Москва, район Аэропорт",
            area: "72 кв.м",
            purpose: "Жилое помещение",
            details: "Состояние после ремонта, дом сопоставимого класса",
            rights: "Собственность, обременения не выявлены",
            liquidityFactors: "Срок экспозиции 2-3 месяца",
            price: "1 520 000 000"
          },
          "1": {
            link: "Яндекс Недвижимость",
            name: "Квартира 78 кв.м, Ленинградский проспект",
            identifier: "77:09:0004011:6045",
            region: "Москва, район Аэропорт",
            area: "78 кв.м",
            purpose: "Жилое помещение",
            details: "Сопоставимая локация, состояние хорошее",
            rights: "Собственность, ипотека отсутствует",
            liquidityFactors: "Высокая ликвидность района",
            price: "1 640 000 000"
          }
        }
      },
      documents: [
        { name: "Заявка на переоценку квартир Столичный Девелопмент.pdf", target: "task" },
        { name: "Выписки ЕГРН по квартирам.zip", target: "collateral" }
      ],
      history: [
        { date: "2026-08-25 10:05", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Первая задача создана автоматически из заявки на переоценку квартир" }
      ]
    },
    {
      id: "TSK-2026-1172",
      type: "Единичная переоценка",
      title: "Оценить оборудование Столичный Девелопмент",
      collateralId: "COL-048",
      collateralIds: ["COL-048", "COL-049"],
      applicationId: "APP-2026-0420",
      contractId: "CTR-2026-0405",
      client: "ООО Столичный Девелопмент",
      assignee: "Дмитрий Орлов",
      status: "В работе",
      dueDate: "2026-08-26",
      createdAt: "2026-08-25",
      sla: "Завтра",
      priority: "Средний",
      source: "Заявка",
      route: ["Заявка", "Специалист", "Руководитель"],
      result: "В задаче 2 объекта оборудования. Нужно сверить независимую оценку, результаты осмотра и рыночные аналоги.",
      marketAnalogManualValues: {
        "COL-048": {
          "1": {
            link: "Коммерческое предложение поставщика",
            name: "Дизель-генератор Cummins C550D5, 2021 г.",
            identifier: "CUM-C550-21-1148",
            configuration: "Cummins, энергетическое оборудование",
            year: "2021",
            usageMetric: "1 850 м/ч",
            purpose: "Резервное энергоснабжение",
            details: "Сервисное обслуживание подтверждено",
            operatingTerms: "Эксплуатация в помещении, демонтаж не требуется",
            region: "Москва",
            saleTerms: "Цена без НДС",
            price: "405 000 000"
          },
          "2": {
            link: "Экспертный подбор",
            name: "Дизель-генератор сопоставимой мощности",
            identifier: "GEN-C550-22-2048",
            configuration: "Дизель-генератор 550 кВА",
            year: "2022",
            usageMetric: "1 200 м/ч",
            purpose: "Резервное энергоснабжение",
            details: "Состояние хорошее, комплектность полная",
            operatingTerms: "Складское хранение, требуется доставка",
            region: "Московская область",
            saleTerms: "Коммерческое предложение с НДС",
            price: "438 000 000"
          }
        }
      },
      documents: [
        { name: "Заявка на переоценку оборудования.pdf", target: "task" },
        { name: "Инвентарная ведомость оборудования.xlsx", target: "task" }
      ],
      history: [
        { date: "2026-08-25 11:20", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Первая задача создана автоматически из заявки на переоценку оборудования" },
        { date: "2026-08-25 11:45", user: "Дмитрий Орлов", action: "Взята в работу", status: "В работе", comment: "Проверяются аналоги и данные независимого оценщика" }
      ]
    },
    {
      id: "TSK-2026-1173",
      type: "Единичная переоценка",
      title: "Единично оценить смешанный пул залогов Столичный Девелопмент",
      collateralId: "COL-040",
      collateralIds: ["COL-040", "COL-045", "COL-048"],
      applicationId: "APP-2026-0420",
      contractId: "CTR-2026-0405",
      client: "ООО Столичный Девелопмент",
      assignee: "Дмитрий Орлов",
      status: "Назначена",
      dueDate: "2026-08-26",
      createdAt: "2026-08-25",
      sla: "Завтра",
      priority: "Высокий",
      source: "Заявка",
      route: ["Заявка", "Специалист", "Руководитель"],
      result: "В задаче 3 объекта разных видов: автомобиль, квартира и оборудование. Нужно выполнить единичную оценку каждого объекта, сверить данные осмотра, независимую оценку и рыночные аналоги.",
      marketAnalogManualValues: {
        "COL-040": {
          "2": {
            link: "Экспертный подбор",
            name: "Toyota Camry XV70, 2021 г.",
            identifier: "XW7BF3FK90S040401",
            year: "2021",
            usageMetric: "71 000 км",
            configuration: "Седан бизнес-класса, АКПП",
            details: "Сопоставимая комплектация, состояние без существенных замечаний",
            region: "Москва",
            saleTerms: "Цена предложения без НДС",
            price: "318 000 000"
          }
        },
        "COL-045": {
          "0": {
            link: "Циан",
            name: "Квартира 73 кв.м, район Аэропорт",
            identifier: "77:09:0004011:7045",
            region: "Москва, район Аэропорт",
            area: "73 кв.м",
            purpose: "Жилое помещение",
            details: "Состояние после ремонта, дом сопоставимого класса",
            rights: "Собственность, обременения не выявлены",
            liquidityFactors: "Срок экспозиции 2 месяца",
            price: "1 560 000 000"
          },
          "1": {
            link: "Яндекс Недвижимость",
            name: "Квартира 76 кв.м, Ленинградский проспект",
            identifier: "77:09:0004011:8045",
            region: "Москва, район Аэропорт",
            area: "76 кв.м",
            purpose: "Жилое помещение",
            details: "Сопоставимая локация, хорошее состояние",
            rights: "Собственность, ограничений не выявлено",
            liquidityFactors: "Высокий спрос в локации",
            price: "1 610 000 000"
          }
        },
        "COL-048": {
          "1": {
            link: "Коммерческое предложение поставщика",
            name: "Дизель-генератор Cummins C550D5, 2022 г.",
            identifier: "CUM-C550-22-7048",
            configuration: "Cummins C550D5, полный комплект",
            year: "2022",
            usageMetric: "1 600 м/ч",
            purpose: "Резервное энергоснабжение",
            details: "Комплектность подтверждена, сервисная история предоставлена",
            operatingTerms: "Эксплуатация в техпомещении, доступ обеспечен",
            region: "Москва",
            saleTerms: "Цена без НДС",
            price: "424 000 000"
          },
          "2": {
            link: "Экспертный подбор",
            name: "Дизель-генератор сопоставимой мощности",
            identifier: "GEN-C550-21-8048",
            configuration: "Дизель-генератор 500-550 кВА",
            year: "2021",
            usageMetric: "2 100 м/ч",
            purpose: "Резервное энергоснабжение",
            details: "Состояние хорошее, требуется корректировка на наработку",
            operatingTerms: "После эксплуатации, демонтаж силами покупателя",
            region: "Московская область",
            saleTerms: "Цена предложения с НДС",
            price: "398 000 000"
          }
        }
      },
      documents: [
        { name: "Заявка на единичную оценку смешанного пула.pdf", target: "task" },
        { name: "Реестр смешанного пула залогов.xlsx", target: "task" },
        { name: "Материалы осмотра смешанного пула.zip", target: "task" }
      ],
      history: [
        { date: "2026-08-25 12:20", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Первая задача создана автоматически из заявки на оценку смешанного пула" }
      ]
    },
    {
        "id": "TSK-2026-1132",
        "type": "Единичная переоценка",
        "title": "Переоценить складской комплекс после обновления кадастра",
        "collateralId": "COL-001",
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверСклад",
        "assignee": "Анна Кузнецова",
        "status": "Назначена",
        "dueDate": "2026-06-17",
        "createdAt": "2026-06-16",
        "sla": "Сегодня",
        "priority": "Высокий",
        "source": "Триггер",
        "route": [
            "Регламент",
            "Специалист",
            "Руководитель"
        ],
        "result": "Ожидается подбор аналогов недвижимости",
        "history": [
            {
                "date": "2026-06-16 17:42",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Обновлена кадастровая выписка по объекту"
            }
        ]
    },
    {
        "id": "TSK-2026-1131",
        "type": "Первичный осмотр",
        "title": "Подтвердить новый автотранспорт из таблицы залогодателя",
        "collateralId": "COL-002",
        "contractId": "CTR-2026-0192",
        "client": "ООО Волга Логистик",
        "assignee": "Алексей Соколов",
        "status": "В работе",
        "dueDate": "2026-06-17",
        "createdAt": "2026-06-16",
        "sla": "Сегодня",
        "priority": "Критический",
        "source": "Конвейер",
        "route": [
            "Конвейер",
            "Специалист",
            "Специалист"
        ],
        "result": "Требуется приложить фото VIN и шин",
        "history": [
            {
                "date": "2026-06-16 16:10",
                "user": "Конвейер",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Объект транспорта требует первичного подтверждения"
            }
        ]
    },
    {
        "id": "TSK-2026-1130",
        "type": "Плановый мониторинг",
        "inspectionFormat": "Физический осмотр",
        "inspectionVisitMethod": "Сотрудник банка (регионы)",
        "inspectionVisitDate": "2026-06-25",
        "inspectionVisitTime": "11:00",
        "title": "Контроль складских остатков СеверТекстиль за июнь",
        "collateralId": "COL-004",
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверТекстиль",
        "assignee": "Павел Смирнов",
        "status": "Назначена",
        "dueDate": "2026-06-25",
        "createdAt": "2026-06-16",
        "sla": "Неделя",
        "priority": "Средний",
        "source": "Расписание",
        "route": [
            "Планировщик",
            "Специалист",
            "ЕСМ Банка"
        ],
        "result": "Ожидается складской акт и фото партии",
        "history": [
            {
                "date": "2026-06-16 08:00",
                "user": "Планировщик",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Ежемесячный мониторинг товаров в обороте"
            }
        ]
    },
    {
        "id": "TSK-2026-1129",
        "type": "Снятие обременения",
        "title": "Проверить основание частичного снятия по Actros",
        "collateralId": "COL-002",
        "contractId": "CTR-2026-0192",
        "client": "ООО Волга Логистик",
        "assignee": "Мария Петрова",
        "status": "Ожидание",
        "dueDate": "2026-06-18",
        "createdAt": "2026-06-15",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Руководитель",
            "АБС"
        ],
        "result": "Требуется платежное поручение по досрочному погашению",
        "history": [
            {
                "date": "2026-06-15 14:22",
                "user": "Мария Петрова",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Запрос заемщика на частичное снятие"
            }
        ]
    },
    {
        "id": "TSK-2026-1128",
        "type": "Внеплановый мониторинг",
        "inspectionFormat": "Документарный осмотр",
        "documentCheckDate": "2026-06-18",
        "title": "Проверить рисковый сигнал по квартире Смирновой",
        "collateralId": "COL-003",
        "contractId": "CTR-2025-0771",
        "client": "Смирнова Елена Викторовна",
        "assignee": "Анна Кузнецова",
        "status": "В работе",
        "dueDate": "2026-06-18",
        "createdAt": "2026-06-15",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "Циан",
        "route": [
            "Внешний источник",
            "Специалист",
            "Руководитель"
        ],
        "result": "Проверяется расхождение рыночной цены и залоговой стоимости",
        "history": [
            {
                "date": "2026-06-15 11:18",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Рыночный сигнал по району объекта"
            }
        ]
    },
    {
        "id": "TSK-2026-1127",
        "type": "Замена залога",
        "title": "Оценить замену печатной линии на новое оборудование",
        "collateralId": "COL-007",
        "contractId": "CTR-2024-0644",
        "client": "ООО Север Принт Пак",
        "assignee": "Дмитрий Орлов",
        "status": "Назначена",
        "dueDate": "2026-06-26",
        "createdAt": "2026-06-16",
        "sla": "Норма",
        "priority": "Средний",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Оценка",
            "Руководитель",
            "АБС"
        ],
        "result": "Ожидается карточка нового оборудования",
        "history": [
            {
                "date": "2026-06-16 13:05",
                "user": "Дмитрий Орлов",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Заемщик запросил замену предмета залога"
            }
        ]
    },
    {
        "id": "TSK-2026-1126",
        "type": "Повторный осмотр",
        "title": "Повторно осмотреть поголовье КРС после расхождения",
        "collateralId": "COL-008",
        "contractId": "CTR-2026-0228",
        "client": "АО Кубань Агро Экспорт",
        "assignee": "Елена Морозова",
        "status": "В работе",
        "dueDate": "2026-06-18",
        "createdAt": "2026-06-16",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "Триггер мониторинга",
        "route": [
            "Monitoring",
            "Специалист",
            "Специалист"
        ],
        "result": "Назначен повторный выезд на ферму Тихорецкая",
        "history": [
            {
                "date": "2026-06-16 09:14",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Не подтверждены 12 голов по журналу"
            }
        ]
    },
    {
        "id": "TSK-2026-1125",
        "type": "Регистрация залога",
        "title": "Зарегистрировать обременение по складскому комплексу",
        "collateralId": "COL-001",
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверТекстиль",
        "assignee": "Анна Кузнецова",
        "status": "В работе",
        "dueDate": "2026-06-19",
        "createdAt": "2026-06-14",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "АБС",
        "route": [
            "АБС",
            "Специалист",
            "Инфосфера",
            "Контроль"
        ],
        "result": "Пакет документов подготовлен к отправке",
        "history": [
            {
                "date": "2026-06-14 10:35",
                "user": "АБС",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Новая выдача требует регистрации залога"
            }
        ]
    },
    {
        "id": "TSK-2026-1124",
        "type": "Единичная переоценка",
        "title": "Переоценить тягач Actros по новым рыночным аналогам",
        "collateralId": "COL-002",
        "contractId": "CTR-2026-0192",
        "client": "ООО Волга Логистик",
        "assignee": "Мария Петрова",
        "status": "Назначена",
        "dueDate": "2026-06-21",
        "createdAt": "2026-06-16",
        "sla": "Неделя",
        "priority": "Средний",
        "source": "Авто.ру",
        "route": [
            "Маркетплейс",
            "Специалист",
            "Руководитель"
        ],
        "result": "Найдены 3 аналога, ожидаются корректировки эксперта",
        "history": [
            {
                "date": "2026-06-16 12:02",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Автоподбор аналогов по Mercedes-Benz Actros"
            }
        ]
    },
    {
        "id": "TSK-2026-1123",
        "type": "Плановый мониторинг",
        "inspectionFormat": "Физический осмотр",
        "inspectionVisitMethod": "Мобильный оценщик (МО)",
        "inspectionVisitDate": "2026-06-24",
        "inspectionVisitTime": "14:30",
        "title": "Проверить страхование и местонахождение Hyundai HD78",
        "collateralId": "COL-006",
        "contractId": "CTR-2026-0192",
        "client": "ООО Волга Логистик",
        "assignee": "Алексей Соколов",
        "status": "Назначена",
        "dueDate": "2026-06-24",
        "createdAt": "2026-06-16",
        "sla": "Норма",
        "priority": "Средний",
        "source": "Расписание",
        "route": [
            "Планировщик",
            "Специалист",
            "Специалист"
        ],
        "result": "Ожидается плановый выезд",
        "history": [
            {
                "date": "2026-06-16 08:15",
                "user": "Планировщик",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Плановая проверка транспорта"
            }
        ]
    },
    {
        "id": "TSK-2026-1122",
        "type": "Первичный осмотр",
        "title": "Подтвердить печатную линию после ремонта",
        "collateralId": "COL-007",
        "contractId": "CTR-2024-0644",
        "client": "ООО Север Принт Пак",
        "assignee": "Дмитрий Орлов",
        "status": "Отложена",
        "dueDate": "2026-06-16",
        "createdAt": "2026-06-12",
        "sla": "Просрочена",
        "priority": "Высокий",
        "source": "Триггер",
        "route": [
            "Риск",
            "Специалист",
            "Специалист"
        ],
        "result": "Представитель залогодателя перенес доступ в цех",
        "history": [
            {
                "date": "2026-06-12 15:11",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Сигнал по неоплаченному страхованию"
            }
        ]
    },
    {
        "id": "TSK-2026-1121",
        "type": "Снятие обременения",
        "title": "Закрыть обременение по части товарных остатков",
        "collateralId": "COL-004",
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверТекстиль",
        "assignee": "Анна Кузнецова",
        "status": "Назначена",
        "dueDate": "2026-06-20",
        "createdAt": "2026-06-15",
        "sla": "Неделя",
        "priority": "Средний",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Руководитель",
            "АБС"
        ],
        "result": "Ожидается сверка лимита обременения",
        "history": [
            {
                "date": "2026-06-15 10:04",
                "user": "Анна Кузнецова",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Освобождение части партии после погашения"
            }
        ]
    },
    {
        "id": "TSK-2026-1120",
        "type": "Внеплановый мониторинг",
        "inspectionFormat": "Физический осмотр",
        "inspectionVisitMethod": "Сюрвейер (СК)",
        "inspectionVisitDate": "2026-06-19",
        "inspectionVisitTime": "12:00",
        "title": "Проверить фактическое состояние квартиры",
        "collateralId": "COL-003",
        "contractId": "CTR-2025-0771",
        "client": "Смирнова Елена Викторовна",
        "assignee": "Дмитрий Орлов",
        "status": "Назначена",
        "dueDate": "2026-06-19",
        "createdAt": "2026-06-14",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "Триггер",
        "route": [
            "Риск",
            "Специалист",
            "Специалист"
        ],
        "result": "Ожидается фотофиксация объекта",
        "history": [
            {
                "date": "2026-06-14 18:30",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Просроченная оценка и судебный риск"
            }
        ]
    },
    {
        "id": "TSK-2026-1119",
        "type": "Регистрация залога",
        "title": "Проверить пакет документов по оборудованию Unitec",
        "collateralId": "COL-005",
        "contractId": "CTR-2026-0228",
        "client": "АО Кубань Агро Экспорт",
        "assignee": "Елена Морозова",
        "status": "Ожидание",
        "dueDate": "2026-06-18",
        "createdAt": "2026-06-13",
        "sla": "Неделя",
        "priority": "Средний",
        "source": "Конвейер",
        "route": [
            "Конвейер",
            "Специалист",
            "Руководитель"
        ],
        "result": "Не хватает акта ввода второй линии",
        "history": [
            {
                "date": "2026-06-13 09:44",
                "user": "Конвейер",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Пакет документов неполный"
            }
        ]
    },
    {
        "id": "TSK-2026-1118",
        "type": "Единичная переоценка",
        "title": "Обновить стоимость печатной линии Heidelberg",
        "collateralId": "COL-007",
        "contractId": "CTR-2024-0644",
        "client": "ООО Север Принт Пак",
        "assignee": "Анна Кузнецова",
        "status": "В работе",
        "dueDate": "2026-06-17",
        "createdAt": "2026-06-13",
        "sla": "Сегодня",
        "priority": "Критический",
        "source": "Регламент",
        "route": [
            "Регламент",
            "Специалист",
            "Руководитель"
        ],
        "result": "Оценка готовится с учетом неоплаченной страховки",
        "history": [
            {
                "date": "2026-06-13 08:50",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Истекает срок контроля рыночной стоимости"
            }
        ]
    },
    {
        "id": "TSK-2026-1117",
        "type": "Повторный осмотр",
        "title": "Доснять фасад и идентификаторы складского комплекса",
        "collateralId": "COL-001",
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверСклад",
        "assignee": "Алексей Соколов",
        "status": "Завершена",
        "dueDate": "2026-06-13",
        "createdAt": "2026-06-11",
        "sla": "Норма",
        "priority": "Средний",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Специалист",
            "Архив"
        ],
        "result": "Фото фасада и кадастровой таблички получены",
        "history": [
            {
                "date": "2026-06-13 15:20",
                "user": "Алексей Соколов",
                "action": "Завершена",
                "status": "Завершена",
                "comment": "Материалы загружены в досье"
            }
        ]
    },
    {
        "id": "TSK-2026-1116",
        "type": "Внеплановый мониторинг",
        "inspectionFormat": "Документарный осмотр",
        "documentCheckDate": "2026-06-18",
        "title": "Сверить документы страхования по пулу Волга Логистик",
        "collateralId": "COL-002",
        "collateralIds": [
            "COL-002",
            "COL-006"
        ],
        "contractId": "CTR-2026-0192",
        "client": "ООО Волга Логистик",
        "assignee": "Мария Петрова",
        "status": "В работе",
        "dueDate": "2026-06-18",
        "createdAt": "2026-06-12",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "АБС",
        "route": [
            "АБС",
            "Специалист",
            "ЕСМ Банка"
        ],
        "result": "Два объекта в пуле, ожидается новый полис по Actros",
        "documents": [
            {
                "name": "Полис Actros - проект.pdf",
                "target": "COL-002"
            },
            {
                "name": "Полис Hyundai действующий.pdf",
                "target": "COL-006"
            }
        ],
        "history": [
            {
                "date": "2026-06-12 13:46",
                "user": "АБС",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Контроль страхования по пулу транспорта"
            }
        ]
    },
    {
        "id": "TSK-2026-1115",
        "type": "Замена залога",
        "title": "Согласовать замену части товарных остатков на оборудование",
        "collateralId": "COL-004",
        "collateralIds": [
            "COL-004",
            "COL-005"
        ],
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверТекстиль",
        "assignee": "Анна Кузнецова",
        "status": "Назначена",
        "dueDate": "2026-06-27",
        "createdAt": "2026-06-16",
        "sla": "Норма",
        "priority": "Средний",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Оценка",
            "Руководитель"
        ],
        "result": "Сформирован пул объектов для сравнения стоимости",
        "documents": [
            {
                "name": "Запрос заемщика на замену.pdf",
                "target": "task"
            },
            {
                "name": "Инвентаризационная ведомость.xlsx",
                "target": "COL-004"
            }
        ],
        "history": [
            {
                "date": "2026-06-16 15:03",
                "user": "Анна Кузнецова",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Сравнение товарных остатков и оборудования"
            }
        ]
    },
    {
        "id": "TSK-2026-1114",
        "type": "Снятие обременения",
        "title": "Передать в АБС снятие по закрытому лимиту",
        "collateralId": "COL-005",
        "contractId": "CTR-2026-0228",
        "client": "АО Кубань Агро Экспорт",
        "assignee": "Елена Морозова",
        "status": "Завершена",
        "dueDate": "2026-06-12",
        "createdAt": "2026-06-10",
        "sla": "Норма",
        "priority": "Средний",
        "source": "АБС",
        "route": [
            "Специалист",
            "АБС",
            "Архив"
        ],
        "result": "Снятие передано и подтверждено",
        "history": [
            {
                "date": "2026-06-12 12:10",
                "user": "Елена Морозова",
                "action": "Завершена",
                "status": "Завершена",
                "comment": "АБС приняла изменение обременения"
            }
        ]
    },
    {
        "id": "TSK-2026-1113",
        "type": "Первичный осмотр",
        "title": "Проверить склад хранения товарных остатков",
        "collateralId": "COL-004",
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверТекстиль",
        "assignee": "Павел Смирнов",
        "status": "В работе",
        "dueDate": "2026-06-17",
        "createdAt": "2026-06-14",
        "sla": "Сегодня",
        "priority": "Высокий",
        "source": "Триггер",
        "route": [
            "Риск",
            "Специалист",
            "Фотофиксация"
        ],
        "result": "Проверяется соответствие склада B учетным данным",
        "history": [
            {
                "date": "2026-06-14 09:08",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Сигнал о движении партии без акта"
            }
        ]
    },
    {
        "id": "TSK-2026-1112",
        "type": "Плановый мониторинг",
        "inspectionFormat": "Физический осмотр",
        "inspectionVisitMethod": "Сюрвейер (СК)",
        "inspectionVisitDate": "2026-06-15",
        "inspectionVisitTime": "10:30",
        "title": "Плановый контроль квартиры Смирновой",
        "collateralId": "COL-003",
        "contractId": "CTR-2025-0771",
        "client": "Смирнова Елена Викторовна",
        "assignee": "Анна Кузнецова",
        "status": "Отложена",
        "dueDate": "2026-06-15",
        "createdAt": "2026-06-08",
        "sla": "Просрочена",
        "priority": "Средний",
        "source": "Расписание",
        "route": [
            "Планировщик",
            "Специалист",
            "Залогодатель"
        ],
        "result": "Представитель залогодателя не подтвердил дату доступа",
        "history": [
            {
                "date": "2026-06-15 18:40",
                "user": "Анна Кузнецова",
                "action": "Отложена",
                "status": "Отложена",
                "comment": "Ожидается согласование времени осмотра"
            }
        ]
    },
    {
        "id": "TSK-2026-1111",
        "type": "Внеплановый мониторинг",
        "inspectionFormat": "Физический осмотр",
        "inspectionVisitMethod": "Мобильный оценщик (МО)",
        "inspectionVisitDate": "2026-06-20",
        "inspectionVisitTime": "09:30",
        "title": "Проверить фактическое наличие оборудования Heidelberg",
        "collateralId": "COL-007",
        "contractId": "CTR-2024-0644",
        "client": "ООО Север Принт Пак",
        "assignee": "Дмитрий Орлов",
        "status": "Назначена",
        "dueDate": "2026-06-20",
        "createdAt": "2026-06-16",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "План мониторинга",
        "route": [
            "Специалист",
            "Руководитель"
        ],
        "result": "Ожидается выездная проверка состояния оборудования и фотофиксация",
        "history": [
            {
                "date": "2026-06-16 11:45",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Назначена внеплановая проверка фактического наличия объекта"
            }
        ]
    },
    {
        "id": "TSK-2026-1110",
        "type": "Регистрация залога",
        "title": "Проверить ГСЗ и залогодателей по квартире",
        "collateralId": "COL-003",
        "contractId": "CTR-2025-0771",
        "client": "Смирнова Елена Викторовна",
        "assignee": "Анна Кузнецова",
        "status": "Ожидание",
        "dueDate": "2026-06-17",
        "createdAt": "2026-06-11",
        "sla": "Сегодня",
        "priority": "Критический",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Юридическая проверка",
            "Руководитель"
        ],
        "result": "Нужно обновить проверку залогодателя",
        "history": [
            {
                "date": "2026-06-11 12:00",
                "user": "Анна Кузнецова",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Дополнительная юридическая проверка"
            }
        ]
    },
    {
        "id": "TSK-2026-1109",
        "type": "Единичная переоценка",
        "title": "Контроль стоимости поголовья КРС",
        "collateralId": "COL-008",
        "contractId": "CTR-2026-0228",
        "client": "АО Кубань Агро Экспорт",
        "assignee": "Елена Морозова",
        "status": "Назначена",
        "dueDate": "2026-06-23",
        "createdAt": "2026-06-15",
        "sla": "Неделя",
        "priority": "Средний",
        "source": "Регламент",
        "route": [
            "Регламент",
            "Специалист",
            "Руководитель"
        ],
        "result": "Ожидается подтверждение поголовья перед расчетом",
        "history": [
            {
                "date": "2026-06-15 08:30",
                "user": "Система",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Контроль рыночной стоимости биологических активов"
            }
        ]
    },
    {
        "id": "TSK-2026-1108",
        "type": "Повторный осмотр",
        "title": "Повторная проверка линии Unitec после замечаний",
        "collateralId": "COL-005",
        "contractId": "CTR-2026-0228",
        "client": "АО Кубань Агро Экспорт",
        "assignee": "Алексей Соколов",
        "status": "Назначена",
        "dueDate": "2026-06-22",
        "createdAt": "2026-06-16",
        "sla": "Неделя",
        "priority": "Средний",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Специалист",
            "Контроль"
        ],
        "result": "Ожидается выезд для проверки маркировки",
        "history": [
            {
                "date": "2026-06-16 10:21",
                "user": "Елена Морозова",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Нужна повторная фотофиксация маркировки"
            }
        ]
    },
    {
        "id": "TSK-2026-1107",
        "type": "Внеплановый мониторинг",
        "inspectionFormat": "Документарный осмотр",
        "documentCheckDate": "2026-06-18",
        "title": "Проверить платеж страховой премии Heidelberg",
        "collateralId": "COL-007",
        "contractId": "CTR-2024-0644",
        "client": "ООО Север Принт Пак",
        "assignee": "Анна Кузнецова",
        "status": "В работе",
        "dueDate": "2026-06-18",
        "createdAt": "2026-06-15",
        "sla": "Неделя",
        "priority": "Высокий",
        "source": "АБС",
        "route": [
            "АБС",
            "Специалист",
            "Страхование"
        ],
        "result": "Премия не подтверждена, запрошен платежный документ",
        "history": [
            {
                "date": "2026-06-15 09:36",
                "user": "АБС",
                "action": "Создана задача",
                "status": "Назначена",
                "comment": "Неоплаченная страховая премия"
            }
        ]
    },
    {
        "id": "TSK-2026-1106",
        "type": "Замена залога",
        "title": "Предварительно проверить новый складской объект",
        "collateralId": "COL-001",
        "contractId": "CTR-2026-0148",
        "client": "ООО СеверСклад",
        "assignee": "Павел Смирнов",
        "status": "Завершена",
        "dueDate": "2026-06-11",
        "createdAt": "2026-06-07",
        "sla": "Норма",
        "priority": "Средний",
        "source": "Вручную",
        "route": [
            "Специалист",
            "Оценка",
            "Архив"
        ],
        "result": "Предварительная проверка завершена, объект пригоден",
        "history": [
            {
                "date": "2026-06-11 17:25",
                "user": "Павел Смирнов",
                "action": "Завершена",
                "status": "Завершена",
                "comment": "Пакет предварительной проверки заполнен"
            }
        ]
    },
    {
        "id": "TSK-2026-1105",
        "type": "Снятие обременения",
        "title": "Архивировать старое обременение по квартире",
        "collateralId": "COL-003",
        "contractId": "CTR-2025-0771",
        "client": "Смирнова Елена Викторовна",
        "assignee": "Анна Кузнецова",
        "status": "Завершена",
        "dueDate": "2026-06-10",
        "createdAt": "2026-06-06",
        "sla": "Норма",
        "priority": "Низкий",
        "source": "АБС",
        "route": [
            "АБС",
            "Специалист",
            "Архив"
        ],
        "result": "Архивная запись закрыта",
        "history": [
            {
                "date": "2026-06-10 12:15",
                "user": "Анна Кузнецова",
                "action": "Завершена",
                "status": "Завершена",
                "comment": "Старое обременение перенесено в архив"
            }
        ]
    },
    {
      id: "TSK-2026-1104",
      type: "Повторный осмотр",
      title: "Проверить страхование и фото шин Actros",
      collateralId: "COL-002",
      contractId: "CTR-2026-0192",
      client: "ООО Волга Логистик",
      assignee: "Алексей Соколов",
      status: "Назначена",
      dueDate: "2026-06-20",
      createdAt: "2026-06-15",
      sla: "Неделя",
      priority: "Высокий",
      source: "Триггер",
      route: ["Автораспределение", "Специалист", "Контроль специалиста"],
      result: "Ожидает осмотра",
      history: [
        { date: "2026-06-15 15:49", user: "Система", action: "Создана задача", status: "Назначена", comment: "Сработал риск истечения страховки" }
      ]
    },
    {
      id: "TSK-2026-1098",
      type: "Единичная переоценка",
      title: "Переоценка квартиры по просроченному отчету",
      collateralId: "COL-003",
      contractId: "CTR-2025-0771",
      client: "Смирнова Елена Викторовна",
      assignee: "Анна Кузнецова",
      status: "В работе",
      dueDate: "2026-06-17",
      createdAt: "2026-06-12",
      sla: "Сегодня",
      priority: "Критический",
      source: "Регламент",
      route: ["Специалист", "Руководитель"],
      result: "Аналоги загружены частично",
      history: [
        { date: "2026-06-12 11:07", user: "Система", action: "Создана задача", status: "Назначена", comment: "Окончание срока оценки" },
        { date: "2026-06-13 09:30", user: "Анна Кузнецова", action: "Взята в работу", status: "В работе", comment: "Запущен поиск аналогов Циан" }
      ]
    },
    {
      id: "TSK-2026-1081",
      type: "Плановый мониторинг",
      inspectionFormat: "Физический осмотр",
      inspectionVisitMethod: "Сотрудник банка (регионы)",
      inspectionVisitDate: "2026-06-14",
      inspectionVisitTime: "10:00",
      title: "Складская сверка товаров СеверТекстиль",
      collateralId: "COL-004",
      contractId: "CTR-2026-0148",
      client: "ООО СеверТекстиль",
      assignee: "Павел Смирнов",
      status: "Отложена",
      dueDate: "2026-06-14",
      createdAt: "2026-06-01",
      sla: "Просрочена",
      priority: "Средний",
      source: "Расписание",
      route: ["Специалист", "ЕСМ Банка"],
      result: "Ожидается складской акт от залогодателя",
      history: [
        { date: "2026-06-01 08:00", user: "Система", action: "Создана задача", status: "Назначена", comment: "Ежемесячный мониторинг" },
        { date: "2026-06-13 18:12", user: "Павел Смирнов", action: "Отложена", status: "Отложена", comment: "Нет складского акта" }
      ]
    },
    {
      id: "TSK-2026-1055",
      type: "Регистрация залога",
      title: "Передать складской комплекс в АБС",
      collateralId: "COL-001",
      contractId: "CTR-2026-0148",
      client: "ООО СеверТекстиль",
      assignee: "Анна Кузнецова",
      status: "В работе",
      dueDate: "2026-06-18",
      createdAt: "2026-06-10",
      sla: "Неделя",
      priority: "Высокий",
      source: "Конвейер",
      route: ["Конвейер", "Специалист", "АБС"],
      result: "Регистрационные данные проверены",
      history: [
        { date: "2026-06-10 10:00", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Новая выдача KM-26/148" }
      ]
    },
    {
      id: "TSK-2026-1022",
      type: "Снятие обременения",
      title: "Снять ограничение по старому договору",
      collateralId: "COL-006",
      contractId: "CTR-2026-0192",
      client: "ООО Волга Логистик",
      assignee: "Мария Петрова",
      status: "Ожидание",
      dueDate: "2026-06-19",
      createdAt: "2026-06-11",
      sla: "Неделя",
      priority: "Средний",
      source: "Вручную",
      route: ["Специалист", "Руководитель", "АБС"],
      result: "Не приложено основание снятия",
      history: [
        { date: "2026-06-11 14:10", user: "Мария Петрова", action: "Создана задача", status: "Назначена", comment: "Запрос заемщика" },
        { date: "2026-06-12 17:00", user: "Сергей Иванов", action: "Запрошены документы", status: "Ожидание", comment: "Нет основания снятия" }
      ]
    },
    {
      id: "TSK-2026-0999",
      type: "Первичный осмотр",
      title: "Осмотреть линию сортировки Unitec",
      collateralId: "COL-005",
      contractId: "CTR-2026-0228",
      client: "АО Кубань Агро Экспорт",
      assignee: "Елена Морозова",
      status: "Завершена",
      dueDate: "2026-06-09",
      createdAt: "2026-06-05",
      sla: "Норма",
      priority: "Средний",
      source: "Конвейер",
      route: ["Конвейер", "Специалист"],
      result: "Оборудование подтверждено",
      history: [
        { date: "2026-06-05 12:30", user: "Конвейер", action: "Создана задача", status: "Назначена", comment: "Новая гарантия" },
        { date: "2026-06-09 16:20", user: "Елена Морозова", action: "Завершена", status: "Завершена", comment: "Фото и GPS получены" }
      ]
    },
    {
      id: "TSK-2026-0987",
      type: "Внеплановый мониторинг",
      inspectionFormat: "Физический осмотр",
      inspectionVisitMethod: "Сотрудник банка (регионы)",
      inspectionVisitDate: "2026-06-21",
      inspectionVisitTime: "09:00",
      title: "Проверить поголовье КРС после сигнала Monitoring",
      collateralId: "COL-008",
      contractId: "CTR-2026-0228",
      client: "АО Кубань Агро Экспорт",
      assignee: "Елена Морозова",
      status: "Назначена",
      dueDate: "2026-06-21",
      createdAt: "2026-06-16",
      sla: "Неделя",
      priority: "Высокий",
      source: "Триггер мониторинга",
      route: ["Monitoring", "Специалист"],
      result: "Ожидает осмотра",
      history: [
        { date: "2026-06-16 08:52", user: "Система", action: "Создана задача", status: "Назначена", comment: "Расхождение по 12 головам" }
      ]
    },
    {
      id: "TSK-2026-0974",
      type: "Замена залога",
      title: "Сравнить старый и новый объект обеспечения",
      collateralId: "COL-007",
      contractId: "CTR-2024-0644",
      client: "ООО Север Принт Пак",
      assignee: "Дмитрий Орлов",
      status: "В работе",
      dueDate: "2026-06-24",
      createdAt: "2026-06-14",
      sla: "Норма",
      priority: "Средний",
      source: "Вручную",
      route: ["Специалист", "Руководитель", "АБС"],
      result: "Новый объект ожидает внешнюю проверку",
      history: [
        { date: "2026-06-14 09:25", user: "Дмитрий Орлов", action: "Создана задача", status: "Назначена", comment: "Запрос на замену оборудования" }
      ]
    }
  ],
  integrations: [
    {
      id: "email",
      name: "Email-уведомления по действиям",
      group: "Внутренняя",
      status: "Успешно",
      lastSync: "2026-06-17 09:10",
      nextSync: "По событию",
      method: "Отправка уведомлений при создании, переназначении и завершении задачи",
      fields: 12,
      imported: 16,
      errors: 0,
      logs: [
        { time: "2026-06-17 09:10", result: "Успешно", object: "TSK-2026-1125", message: "Исполнителю отправлено уведомление о новой задаче" },
        { time: "2026-06-16 17:20", result: "Успешно", object: "TSK-2026-1090", message: "Руководителю отправлено уведомление о переназначении" }
      ]
    },
    {
      id: "ocr",
      name: "Система распознавания документов",
      group: "Внутренняя",
      status: "Успешно",
      lastSync: "2026-06-17 11:42",
      nextSync: "По вложению",
      method: "Асинхронная отправка документа и получение результата",
      fields: 50,
      imported: 12,
      errors: 0,
      logs: [
        { time: "2026-06-17 11:42", result: "Успешно", object: "TSK-2026-1140", message: "Извлечены реквизиты правоустанавливающего документа" }
      ]
    },
    {
      id: "ecm",
      name: "ЕСМ Банка",
      group: "Внутренняя",
      status: "Прототип",
      lastSync: "2026-06-16 18:20",
      nextSync: "По документу",
      method: "Хранение и получение документов залогового досье",
      fields: 20,
      imported: 9,
      errors: 0,
      logs: [
        { time: "2026-06-16 18:20", result: "Успешно", object: "COL-001", message: "Документы карточки синхронизированы с досье" }
      ]
    },
    {
      id: "avito",
      name: "Авито",
      group: "Внешняя",
      status: "Прототип",
      lastSync: "2026-06-17 10:30",
      nextSync: "По задаче оценки",
      method: "Поиск объявлений и получение статистики цен для транспорта, спецтехники и оборудования",
      fields: 30,
      imported: 5,
      errors: 0,
      logs: [
        { time: "2026-06-17 10:30", result: "Успешно", object: "TSK-2026-1141", message: "Найдены аналоги для транспортного пула" }
      ]
    },
    {
      id: "auto-ru",
      name: "Авто.ру",
      group: "Внешняя",
      status: "Прототип",
      lastSync: "2026-06-17 10:31",
      nextSync: "По задаче оценки",
      method: "Получение средней цены автомобиля",
      fields: 15,
      imported: 2,
      errors: 0,
      logs: [
        { time: "2026-06-17 10:31", result: "Успешно", object: "COL-002", message: "Средняя цена передана в расчет оценки" }
      ]
    },
    {
      id: "yandex-realty",
      name: "Яндекс Недвижимость",
      group: "Внешняя",
      status: "Прототип",
      lastSync: "2026-06-16 12:15",
      nextSync: "По задаче оценки",
      method: "Оценка недвижимости и поиск аналогов",
      fields: 30,
      imported: 3,
      errors: 0,
      logs: [
        { time: "2026-06-16 12:15", result: "Успешно", object: "COL-003", message: "Получены аналоги квартиры" }
      ]
    },
    {
      id: "cian",
      name: "Циан",
      group: "Внешняя",
      status: "Предупреждение",
      lastSync: "2026-06-16 12:16",
      nextSync: "Повтор вручную",
      method: "Оценка объекта недвижимости и поиск аналогов",
      fields: 30,
      imported: 2,
      errors: 1,
      logs: [
        { time: "2026-06-16 12:16", result: "Предупреждение", object: "COL-003", message: "Один аналог исключен как дубль" }
      ]
    },
    {
      id: "egrn",
      name: "Сервис данных ЕГРН",
      group: "Внешняя",
      status: "Прототип",
      lastSync: "2026-06-16 07:50",
      nextSync: "По запросу",
      method: "Получение сведений о недвижимости и ограничениях",
      fields: 40,
      imported: 2,
      errors: 1,
      logs: [
        { time: "2026-06-16 07:50", result: "Ошибка", object: "COL-003", message: "Источник вернул временную ошибку" }
      ]
    },
    {
      id: "spectrum-auto",
      name: "SpectrumData: авто",
      group: "Внешняя",
      status: "Успешно",
      lastSync: "2026-06-17 10:40",
      nextSync: "По VIN",
      method: "Рыночная цена ТС с учетом истории эксплуатации",
      fields: 30,
      imported: 6,
      errors: 0,
      logs: [
        { time: "2026-06-17 10:40", result: "Успешно", object: "COL-002", message: "Оптимальное значение стоимости ТС получено" }
      ]
    },
    {
      id: "spectrum-realty",
      name: "SpectrumData: недвижимость",
      group: "Внешняя",
      status: "Прототип",
      lastSync: "2026-06-16 12:20",
      nextSync: "По кадастровому номеру",
      method: "Инициирование проверки недвижимости и получение результата",
      fields: 30,
      imported: 2,
      errors: 0,
      logs: [
        { time: "2026-06-16 12:20", result: "Успешно", object: "COL-001", message: "Кадастровые характеристики сопоставлены" }
      ]
    },
    {
      id: "internal-appraiser",
      name: "Внутренняя оценка",
      group: "Внешняя",
      status: "Прототип",
      lastSync: "2026-06-16 12:35",
      nextSync: "По объекту недвижимости",
      method: "Получение оценки стоимости недвижимости",
      fields: 18,
      imported: 1,
      errors: 0,
      logs: [
        { time: "2026-06-16 12:35", result: "Успешно", object: "COL-003", message: "Оценка недвижимости получена" }
      ]
    },
    {
      id: "infosphere",
      name: "Инфосфера",
      group: "Внешняя",
      status: "Успешно",
      lastSync: "2026-06-17 07:30",
      nextSync: "По проверке",
      method: "Проверка клиента, залогодателя и субъектных риск-факторов по данным Инфосферы",
      fields: 20,
      imported: 8,
      errors: 0,
      logs: [
        { time: "2026-06-17 07:30", result: "Успешно", object: "Портфель", message: "Проверка залогодателей и собственников завершена" }
      ]
    },
    {
      id: "abs",
      name: "АБС",
      group: "Внутренняя",
      status: "Успешно",
      lastSync: "2026-06-16 06:30",
      nextSync: "2026-06-17 06:30",
      method: "Проверка на дубли, создание залога под форму 0409310, привязка залога к кредиту",
      fields: 60,
      imported: 42,
      errors: 1,
      logs: [
        { time: "2026-06-16 06:30", result: "Успешно", object: "42 сделки", message: "Проверка дублей и привязка залогов выполнены" },
        { time: "2026-06-15 06:30", result: "Ошибка", object: "COL-003", message: "Не совпал формат даты оценки, строка пропущена" }
      ]
    },
    {
      id: "conveyor",
      name: "Конвейеры",
      group: "Внутренняя",
      status: "Успешно",
      lastSync: "2026-06-16 10:15",
      nextSync: "По событию",
      method: "API: создание задачи на залог, передача файлов документов, получение вердикта",
      fields: 100,
      imported: 7,
      errors: 0,
      logs: [
        { time: "2026-06-16 10:15", result: "Успешно", object: "TSK-2026-1055", message: "Создана задача регистрации залога" }
      ]
    }
  ],
  importRows: [
    { row: 2, collateralId: "COL-009", type: "Автотранспорт", reportAsset: "Автотранспорт", name: "Грузовой автомобиль КАМАЗ 54901", description: "Седельный тягач, 2024 г.в.", qualityCategory: "I", pledgeSign: "Основное обеспечение", include310: "Да", account: "91414", groupCode: "GRP-AV-240", owner: "ООО Урал Доставка", ownerInn: "6679123456", contract: "AV-26/240", address: "Свердловская область, г. Екатеринбург", city: "Екатеринбург", countryCode: "643", okato: "65401000000", identifierType: "VIN", identifierValue: "XTC549010R0000123", source: "Excel", status: "Создать", message: "Новый VIN, проверка SpectrumData доступна" },
    { row: 3, collateralId: "COL-003", type: "Недвижимость", reportAsset: "Объект недвижимости", name: "Квартира, г. Москва", description: "Жилое помещение, 58,4 кв. м", qualityCategory: "I", pledgeSign: "Основное обеспечение", include310: "Да", account: "91414", groupCode: "GRP-IP-771", owner: "Смирнова Е.В.", ownerInn: "771512345678", contract: "IP-25/771", address: "г. Москва, ул. Петровка, д. 17", city: "Москва", countryCode: "643", okato: "45286585000", identifierType: "Кадастровый номер", identifierValue: "77:01:0004012:5841", source: "Excel", status: "Обновить", message: "Обновить дату оценки и рыночную стоимость" },
    { row: 4, collateralId: "", type: "Оборудование", reportAsset: "Оборудование", name: "Термопластавтомат Haitian", description: "Производственное оборудование", qualityCategory: "II", pledgeSign: "Дополнительное обеспечение", include310: "Да", account: "91414", groupCode: "GRP-KL-331", owner: "ООО Нью Пласт", ownerInn: "7728456123", contract: "KL-26/331", address: "Московская область, г. Клин, промзона", city: "Клин", countryCode: "643", okato: "46221501000", identifierType: "Заводской номер", identifierValue: "HTF2400-2023-88", source: "Excel", status: "Ошибка", message: "Не заполнен ID залога" },
    { row: 5, collateralId: "COL-010", type: "Ценные бумаги", reportAsset: "Ценные бумаги", name: "Акции АО Капитал Инвест", description: "Пакет обыкновенных акций", qualityCategory: "II", pledgeSign: "Дополнительное обеспечение", include310: "Да", account: "91414", groupCode: "GRP-BG-260", owner: "АО Капитал Инвест", ownerInn: "7704123987", contract: "BG-26/260", address: "г. Москва", city: "Москва", countryCode: "643", okato: "45286552000", identifierType: "ISIN", identifierValue: "RU000A0ZZZZ1", source: "Excel", status: "Ошибка", message: "Тип залога не входит в согласованный шаблон" },
    { row: 6, collateralId: "COL-007", type: "Оборудование", reportAsset: "Оборудование", name: "Линия упаковки Bobst", description: "Производственная линия", qualityCategory: "I", pledgeSign: "Основное обеспечение", include310: "Да", account: "91414", groupCode: "GRP-KL-644", owner: "ООО Север Принт Пак", ownerInn: "7811456789", contract: "KL-24/644", address: "г. Санкт-Петербург, промзона Парнас", city: "Санкт-Петербург", countryCode: "643", okato: "40265000000", identifierType: "Заводской номер", identifierValue: "BST-2022-0091", source: "Excel", status: "Обновить", message: "Обновить статус страхования" }
  ],
  audit: [
    { date: "2026-06-16 10:15", user: "Конвейер", object: "TSK-2026-1055", action: "Создание задачи", oldValue: "-", newValue: "Назначена", source: "API конвейера" },
    { date: "2026-06-16 08:52", user: "Система", object: "COL-008", action: "Сигнал риска", oldValue: "Нет", newValue: "Расхождение поголовья", source: "Триггер мониторинга" },
    { date: "2026-06-15 15:45", user: "Система", object: "COL-002", action: "Сигнал риска", oldValue: "Нет", newValue: "Истечение страховки", source: "АБС" },
    { date: "2026-06-13 18:12", user: "Павел Смирнов", object: "TSK-2026-1081", action: "Отложение задачи", oldValue: "В работе", newValue: "Отложена", source: "АРМ" },
    { date: "2026-06-12 17:00", user: "Сергей Иванов", object: "TSK-2026-1022", action: "Возврат на инициатора", oldValue: "В работе", newValue: "Ожидание", source: "АРМ руководителя" }
  ],
  comments: [
    { object: "COL-003", date: "2026-06-13 09:40", user: "Анна Кузнецова", text: "Нужно запросить свежую кадастровую выписку перед завершением переоценки." },
    { object: "TSK-2026-1104", date: "2026-06-15 16:05", user: "Мария Петрова", text: "Попросила страхователя подготовить обновленный страховой полис." }
  ]
};

export const reportCatalog = [
  {
    id: "tasks",
    name: "Отчет руководителя по задачам подразделения",
    parameters: ["Период", "Подразделение", "Статус", "Тип задачи"],
    rows: [
      ["Анна Кузнецова", "4", "1", "2", "94%"],
      ["Павел Смирнов", "3", "1", "1", "88%"],
      ["Мария Петрова", "2", "0", "1", "91%"],
      ["Елена Морозова", "3", "0", "2", "97%"]
    ],
    headers: ["Сотрудник", "Всего задач", "Просрочено", "Завершено", "SLA"]
  },
  {
    id: "employees",
    name: "Отчет по сотрудникам",
    parameters: ["Период", "Регион", "Роль"],
    rows: [
      ["Алексей Соколов", "Выездные осмотры", "6", "5", "1"],
      ["Дмитрий Орлов", "Специалисты", "5", "4", "0"],
      ["Анна Кузнецова", "Специалисты", "7", "5", "1"]
    ],
    headers: ["Сотрудник", "Роль", "Назначено", "Закрыто", "Возвраты"]
  },
  {
    id: "collaterals",
    name: "Отчет по видам залогов",
    parameters: ["Период", "Тип залога", "ГСЗ"],
    rows: [
      ["Недвижимость", "2", "5 240 000 000", "1", "94%"],
      ["Автотранспорт", "2", "1 760 000 000", "1", "89%"],
      ["Оборудование", "2", "7 350 000 000", "1", "74%"],
      ["Товары в обороте", "1", "1 000 000 000", "0", "70%"],
      ["Скот", "1", "1 200 000 000", "0", "56%"]
    ],
    headers: ["Тип залога", "Кол-во", "Рыночная стоимость", "Критические", "Средний LTV"]
  }
];

export const marketAnalogs = [
  { type: "Автотранспорт", source: "Авто.ру", object: "Mercedes-Benz Actros 1845 2021", subtype: "Седельный тягач", identifier: "WDB9634031L202001", configuration: "Седельный тягач 4x2, спальная кабина", saleTerms: "Цена предложения с НДС", price: 955000000, correction: "+2.5%", result: 979000000, region: "Нижний Новгород", condition: "Пробег 148 тыс. км, состояние хорошее" },
  { type: "Автотранспорт", source: "Авто.ру", object: "Mercedes-Benz Actros 1845 2022", subtype: "Седельный тягач", identifier: "WDB9634031L202002", configuration: "Седельный тягач 4x2, Евро-5", saleTerms: "Цена предложения с НДС", price: 990000000, correction: "-1.0%", result: 980100000, region: "Нижний Новгород", condition: "Пробег 132 тыс. км, состояние хорошее" },
  { type: "Автотранспорт", source: "Авито", object: "Hyundai HD78 2021", subtype: "Грузовой автомобиль", identifier: "KMFLA18APMC202103", configuration: "Бортовой грузовой автомобиль", saleTerms: "Цена предложения без НДС", price: 635000000, correction: "+1.5%", result: 644525000, region: "Нижний Новгород", condition: "Пробег 96 тыс. км, состояние сопоставимое" },
  { type: "Автотранспорт", source: "Авто.ру", object: "Toyota Camry XV70 2021", subtype: "Легковой автомобиль", identifier: "XW7BF3FK90S040901", configuration: "Седан, двигатель 2.5, АКПП", saleTerms: "Цена предложения без НДС", price: 312000000, correction: "+1.0%", result: 315120000, region: "Москва", condition: "Пробег 69 тыс. км, состояние хорошее" },
  { type: "Автотранспорт", source: "Авито", object: "Toyota Camry XV70 2020", subtype: "Легковой автомобиль", identifier: "XW7BF3FK80S040902", configuration: "Седан бизнес-класса, АКПП", saleTerms: "Цена предложения без НДС", price: 304000000, correction: "+0.5%", result: 305520000, region: "Москва", condition: "Пробег 82 тыс. км, состояние сопоставимое" },
  { type: "Самоходная техника", source: "Авито", object: "Komatsu PC210-10M0 2021", subtype: "Экскаватор", identifier: "KMTPC210NPM040250", configuration: "Гусеничный экскаватор, ковш 1 куб.м", purpose: "Земляные работы", workload: "4 900 м/ч", saleTerms: "Цена предложения с НДС", price: 1165000000, correction: "+1.0%", result: 1176650000, region: "Московская область", condition: "Наработка и состояние сопоставимы" },
  { type: "Самоходная техника", source: "SpectrumData", object: "Komatsu PC220-8M0 2020", subtype: "Экскаватор", identifier: "KMTPC220HLM040252", configuration: "Гусеничный экскаватор, ковш 1,1 куб.м", purpose: "Земляные работы", workload: "5 600 м/ч", saleTerms: "Цена предложения с НДС", price: 1110000000, correction: "+2.0%", result: 1132200000, region: "Московская область", condition: "Состояние рабочее, требуется корректировка на наработку" },
  { type: "Самоходная техника", source: "Авито", object: "SDLG LG936L 2022", subtype: "Погрузчик", identifier: "VLG936L0NN040251", configuration: "Фронтальный погрузчик, ковш 1,8 куб.м", purpose: "Погрузочные работы", workload: "2 100 м/ч", saleTerms: "Цена предложения без НДС", price: 635000000, correction: "-1.5%", result: 625475000, region: "Московская область", condition: "Состояние рабочее, комплектность полная" },
  { type: "Самоходная техника", source: "SpectrumData", object: "SDLG LG936L 2021", subtype: "Погрузчик", identifier: "VLG936L0MN040253", configuration: "Фронтальный погрузчик, ковш 1,8 куб.м", purpose: "Погрузочные работы", workload: "2 700 м/ч", saleTerms: "Цена предложения без НДС", price: 598000000, correction: "+1.0%", result: 603980000, region: "Московская область", condition: "Состояние сопоставимое, износ умеренный" },
  { type: "Недвижимость", source: "Циан", object: "Квартира 72 кв.м, район Аэропорт", subtype: "Квартира", identifier: "77:09:0004011:5045", area: "72 кв.м", purpose: "Жилое помещение", rights: "Собственность, обременения не выявлены", liquidity: "Срок экспозиции 2-3 месяца", price: 1520000000, correction: "+1.5%", result: 1542800000, region: "Москва, район Аэропорт", condition: "Состояние после ремонта, дом сопоставимого класса" },
  { type: "Недвижимость", source: "Яндекс Недвижимость", object: "Квартира 78 кв.м, Ленинградский проспект", subtype: "Квартира", identifier: "77:09:0004011:6045", area: "78 кв.м", purpose: "Жилое помещение", rights: "Собственность, ипотека отсутствует", liquidity: "Высокая ликвидность района", price: 1640000000, correction: "-1.0%", result: 1623600000, region: "Москва, район Аэропорт", condition: "Сопоставимая локация, состояние хорошее" },
  { type: "Недвижимость", source: "Циан", object: "Земельный участок 2,3 га, Домодедово", subtype: "Недвижимость", identifier: "50:28:0060210:5055", area: "2,3 га", purpose: "Производственная и складская деятельность", rights: "Собственность, сервитуты не выявлены", liquidity: "Срок экспозиции 4-6 месяцев", price: 1390000000, correction: "+2.0%", result: 1417800000, region: "Московская область, Домодедово", condition: "Категория и разрешенное использование сопоставимы" },
  { type: "Недвижимость", source: "Яндекс Недвижимость", object: "Земельный участок 2,5 га под склад", subtype: "Недвижимость", identifier: "50:28:0060210:6055", area: "2,5 га", purpose: "Складская деятельность", rights: "Собственность, ограничений не выявлено", liquidity: "Средняя ликвидность", price: 1510000000, correction: "-1.0%", result: 1494900000, region: "Московская область, Домодедово", condition: "Локация и инфраструктура сопоставимы" },
  { type: "Оборудование", source: "Авито", object: "Дизель-генератор Cummins C550D5 2022", subtype: "Дизель-генератор", identifier: "CUM-C550-22-9048", configuration: "Cummins C550D5, 550 кВА", purpose: "Резервное энергоснабжение", workload: "1 450 м/ч", operatingTerms: "Эксплуатация в помещении, сервисная история есть", saleTerms: "Цена без НДС", price: 430000000, correction: "+0.5%", result: 432150000, region: "Москва", condition: "Техническое состояние подтверждено, комплектность полная" },
  { type: "Оборудование", source: "SpectrumData", object: "Дизель-генератор 500-550 кВА 2021", subtype: "Дизель-генератор", identifier: "GEN-550-21-9048", configuration: "Дизель-генератор сопоставимой мощности", purpose: "Резервное энергоснабжение", workload: "2 050 м/ч", operatingTerms: "После эксплуатации, демонтаж силами покупателя", saleTerms: "Цена предложения с НДС", price: 402000000, correction: "+1.0%", result: 406020000, region: "Московская область", condition: "Состояние хорошее, требуется корректировка на наработку" },
  { type: "Воздушные суда", source: "SpectrumData", object: "Airbus H125 2020", subtype: "Вертолет H125", identifier: "H125-904250 / RA-04250", configuration: "Вертолет, пассажирская конфигурация", purpose: "Деловая авиация", workload: "1 250 летных часов", saleTerms: "Цена без НДС", price: 2790000000, correction: "+1.0%", result: 2817900000, region: "Москва", condition: "Летная годность подтверждена, ресурс сопоставим" },
  { type: "Воздушные суда", source: "SpectrumData Реестр ВС", object: "Airbus H125 2019", subtype: "Вертолет H125", identifier: "H125-894251 / RA-04251", configuration: "Вертолет, пассажирская конфигурация", purpose: "Деловая авиация", workload: "1 620 летных часов", saleTerms: "Цена предложения без НДС", price: 2670000000, correction: "+2.0%", result: 2723400000, region: "Москва", condition: "Техническое состояние сопоставимо, ресурс ниже объекта оценки" },
  { type: "Воздушные суда", source: "SpectrumData Сделки ВС", object: "Cessna 208B Grand Caravan 2019", subtype: "Самолет Cessna 208B", identifier: "208B-54253 / RA-04253", configuration: "Самолет, пассажирская конфигурация", purpose: "Региональные перевозки", workload: "2 850 летных часов", saleTerms: "Цена без НДС", price: 2010000000, correction: "-1.0%", result: 1989900000, region: "Казань", condition: "Летная годность подтверждена, ресурс сопоставим" },
  { type: "Воздушные суда", source: "SpectrumData Реестр ВС", object: "Robinson R66 2018", subtype: "Вертолет R66", identifier: "R66-04254 / RA-04254", configuration: "Вертолет, стандартная комплектация", purpose: "Частная авиация", workload: "1 980 летных часов", saleTerms: "Цена предложения без НДС", price: 1010000000, correction: "-2.0%", result: 989800000, region: "Краснодарский край", condition: "Техническое состояние сопоставимо, требуется корректировка на ресурс" },
  { type: "Оборудование", source: "Авито", object: "Линия упаковки Unitec 2021", subtype: "Упаковочная линия", identifier: "UN-21-8845", configuration: "Автоматическая фасовочно-упаковочная линия", purpose: "Упаковка пищевой продукции", workload: "2 400 м/ч", operatingTerms: "Действующее производство, демонтаж по договоренности", saleTerms: "Цена с НДС", price: 1780000000, correction: "+1.0%", result: 1797800000, region: "Краснодар", condition: "Производительность и год выпуска сопоставимы" },
  { type: "Оборудование", source: "Авито", object: "Печатная линия Heidelberg XL 2019", subtype: "Печатная линия", identifier: "HD-XL-2019-6120", configuration: "Печатная линия Heidelberg XL", purpose: "Промышленная печать", workload: "18 млн оттисков", operatingTerms: "После сервисного обслуживания, находится у продавца", saleTerms: "Цена без НДС", price: 3650000000, correction: "-2.5%", result: 3558750000, region: "Москва", condition: "Состояние после сервисного обслуживания" },
  { type: "Оборудование", source: "Экспертный подбор", object: "Фасовочная линия пищевого производства 2020", subtype: "Упаковочная линия", identifier: "PK-20-4401", configuration: "Фасовочная линия средней мощности", purpose: "Пищевая фасовка", workload: "3 100 м/ч", operatingTerms: "Складское хранение, требуется подтверждение технического состояния", saleTerms: "Коммерческое предложение с НДС", price: 1215000000, correction: "+0.5%", result: 1221075000, region: "Краснодар", condition: "Назначение и мощность сопоставимы" },
  { type: "Товары в обороте", source: "Экспертный подбор", object: "Партия текстиля летнего ассортимента", subtype: "Текстиль", unitPrice: "2 150 руб./ед.", workload: "320 тыс. ед.", operatingTerms: "Склад класса B, ответственное хранение", price: 690000000, correction: "-1.0%", result: 683100000, region: "Московская область", condition: "Срок хранения и ликвидность сопоставимы" },
  { type: "Товары в обороте", source: "Экспертный подбор", object: "Складской остаток упаковочных материалов", subtype: "Упаковочные материалы", unitPrice: "118 руб./ед.", workload: "6,2 млн ед.", operatingTerms: "Отапливаемый склад, партия однородная", price: 735000000, correction: "+0.5%", result: 738675000, region: "Московская область", condition: "Номенклатура и оборачиваемость сопоставимы" },
  { type: "Скот", source: "Экспертный подбор", object: "КРС молочного направления, партия 320 голов", subtype: "КРС", workload: "320 голов, 430 кг", purpose: "Молочное направление", operatingTerms: "Ферма с ветконтролем", price: 515000000, correction: "+1.0%", result: 520150000, region: "Краснодар", condition: "Возраст и ветеринарный статус сопоставимы" },
  { type: "Скот", source: "Экспертный подбор", object: "Племенной скот, партия 300 голов", subtype: "КРС", workload: "300 голов, 460 кг", purpose: "Племенное поголовье", operatingTerms: "Племенное хозяйство, ветдокументы представлены", price: 548000000, correction: "-2.0%", result: 537040000, region: "Краснодар", condition: "Порода и продуктивность сопоставимы" }
];
