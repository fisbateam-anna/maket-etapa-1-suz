import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function assertInOrder(source, values) {
  let previous = -1;
  for (const value of values) {
    const index = source.indexOf(value);
    assert.ok(index > previous, `Expected '${value}' after the preceding field`);
    previous = index;
  }
}

test("task signals and participant panel are disabled without deleting their renderers", () => {
  assert.match(app, /const TASK_CARD_OPTIONAL_BLOCKS = Object\.freeze\(\{\s*signals: false,\s*participants: false/s);
  assert.match(app, /TASK_CARD_OPTIONAL_BLOCKS\.signals \? renderTaskActionGuidance\(/);
  assert.match(app, /TASK_CARD_OPTIONAL_BLOCKS\.participants \? renderTaskParticipantsPanel\(/);
  assert.match(app, /function renderTaskActionGuidance\(/);
  assert.match(app, /function renderTaskParticipantsPanel\(/);
  assert.match(app, /task-page-header\$\{TASK_CARD_OPTIONAL_BLOCKS\.signals \? "" : " is-without-signals"\}/);
  assert.match(app, /task-summary-layout\$\{TASK_CARD_OPTIONAL_BLOCKS\.participants \? "" : " is-single-column"\}/);
  assert.match(styles, /\.task-summary-layout\.is-single-column\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);/);
  assert.match(styles, /\.task-page \.page-header\.is-without-signals\s*\{\s*grid-template-rows:\s*auto;\s*grid-template-areas:\s*"heading actions";/);
  assert.match(styles, /\.task-page \.page-header\.is-without-signals\s*\{\s*grid-template-rows:\s*auto auto;\s*grid-template-areas:\s*"heading"\s*"actions";/);
});

test("shared task and application sections use the common title and hint hooks", () => {
  for (const title of [
    "Параметры задачи",
    "Параметры заявки",
    "Проведенный выездной осмотр",
    "Контактные лица",
    "Информация по объектам залога",
    "Договоры и обеспечения"
  ]) {
    assert.match(app, new RegExp(`<h[234] class="shared-component-title">${title}`), title);
  }
  assert.match(app, /<h2 class="shared-component-title">\$\{escapeHtml\(title\)\}<\/h2>/);
  assert.match(app, /<h2 class="shared-component-title">Договоры и обеспечения<\/h2>/);
  assert.match(app, /class="hint shared-component-hint"/);
  assert.match(app, /class="panel-note shared-component-hint"/);
  assert.doesNotMatch(app, /Тип, подтип, цель, статус, инициатор и суть обращения/);
});

test("task information fields are normal weight except the highlighted client", () => {
  assert.match(styles, /\.task-main-info-panel \.task-info-field:not\(\.task-info-field-primary\) span,[\s\S]*?font-weight:\s*400;/);
  assert.match(styles, /\.task-main-info-panel \.task-info-field:not\(\.task-info-field-primary\) strong,[\s\S]*?font-weight:\s*400;/);
  assert.match(styles, /\.task-info-field-primary strong\s*\{[^}]*font-weight:\s*850;/);
});

test("task and application parameters use a compact expandable layout with inline readonly deals", () => {
  const rendererStart = app.indexOf("function renderTaskMainInfo(task, collaterals = getTaskCollaterals(task))");
  const rendererEnd = app.indexOf("\nfunction getTaskApplicationDealRows", rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);
  assert.match(renderer, /<h2 class="shared-component-title">Параметры задачи<\/h2>/);
  assert.match(renderer, /<details class="task-application-compact-context">[\s\S]*Параметры заявки/);
  assert.match(renderer, /renderTaskApplicationContractsReadOnlyTable\(applicationDealRows\)/);
  assertInOrder(renderer, [
    'renderTaskInfoField("Клиент"',
    'renderTaskInfoField("Статус"',
    'renderTaskInfoField("Дата создания задачи"',
    'renderTaskInfoField("Срок исполнения задачи"',
    'renderTaskInfoField("Автор задачи"',
    'renderTaskInfoField("Текущий исполнитель"',
    'renderTaskInfoField("Подразделение исполнителя"',
    'renderTaskInfoField("Источник создания"',
    'renderTaskInfoField("Родительский объект"',
    'renderTaskInfoField("Комментарий постановщика"'
  ]);
  const applicationFieldsStart = renderer.indexOf('class="task-info-grid task-application-compact-grid"');
  const applicationFieldsEnd = renderer.indexOf("</div>", applicationFieldsStart);
  assert.ok(applicationFieldsStart >= 0 && applicationFieldsEnd > applicationFieldsStart);
  assertInOrder(renderer.slice(applicationFieldsStart, applicationFieldsEnd), [
    'renderTaskInfoField("Тип заявки"',
    'renderTaskInfoField("Подтип заявки"',
    'renderTaskInfoField("Цель заявки"',
    'renderTaskInfoField("Статус заявки"',
    'renderTaskInfoField("Инициатор"',
    'renderTaskInfoField("Сегмент инициатора"',
    'renderTaskInfoField("Суть обращения / комментарий"'
  ]);
  assert.doesNotMatch(renderer, /renderTaskInfoField\("Дата поступления заявки"/);
  assert.match(renderer, /task-application-compact-grid">[\s\S]*renderTaskInfoField\("Инициатор"[\s\S]*renderTaskInfoField\("Сегмент инициатора"[\s\S]*renderTaskInfoField\("Суть обращения \/ комментарий", applicationComment, \{ wide: true, comment: true \}\)/);
  assert.match(styles, /\.task-application-compact-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(renderer, /<section class="panel task-parameters-layout" aria-label="Параметры задачи и заявки">[\s\S]*<div class="task-parameters-top">[\s\S]*<div class="task-main-info-column">[\s\S]*<div class="task-main-info-panel">[\s\S]*<div class="task-main-origin-row" aria-label="Происхождение задачи">[\s\S]*<\/div>\s*<details class="task-application-compact-context">[\s\S]*<\/details>\s*<\/div>\s*<div class="task-parameters-supporting">[\s\S]*renderTaskApplicationContractsReadOnlyTable\(applicationDealRows\)[\s\S]*<\/section>/);
  const modernLayout = styles.slice(styles.indexOf("/* Task cards: compact paired parameters and readable collateral values. */"));
  assert.match(modernLayout, /\.task-parameters-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*padding:\s*16px;/s);
  assert.match(modernLayout, /\.task-parameters-top\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(260px,\s*300px\);[^}]*align-items:\s*start;/s);
  assert.match(modernLayout, /\.task-parameters-top:has\(\.task-application-compact-context\[open\]\)\s*\{[^}]*minmax\(420px,\s*1fr\)/s);
  assert.match(modernLayout, /\.task-parameters-layout\s*\{[^}]*container-name:\s*task-parameters;[^}]*container-type:\s*inline-size;/s);
  assert.match(modernLayout, /\.task-main-info-column\s*\{[^}]*display:\s*grid;[^}]*align-content:\s*start;[^}]*min-width:\s*0;/s);
  assert.match(modernLayout, /\.task-parameters-top:has\(\.task-application-compact-context\[open\]\) \.task-main-info-hero\s*\{[^}]*minmax\(190px,\s*0\.6fr\)[^}]*minmax\(0,\s*1\.4fr\)/s);
  assert.match(modernLayout, /\.task-parameters-top:has\(\.task-application-compact-context\[open\]\) \.task-main-info-keyfacts \.task-info-field span\s*\{[^}]*font-size:\s*11px;[^}]*white-space:\s*nowrap;/s);
  assert.match(modernLayout, /@container task-parameters \(max-width:\s*1100px\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s);
  assert.match(modernLayout, /\.task-parameters-supporting\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*border-top:\s*1px solid/s);
  assert.match(modernLayout, /@media\s*\(max-width:\s*760px\)\s*\{[^}]*\.task-main-origin-row,[^}]*\.task-main-origin-compact\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s);
  assert.match(modernLayout, /\.task-main-info-panel\s*\{[^}]*grid-template-rows:\s*auto;[^}]*align-self:\s*start;[^}]*min-width:\s*0;/s);
  assert.match(modernLayout, /\.task-application-compact-context\s*\{[^}]*align-self:\s*start;[^}]*height:\s*auto;[^}]*min-height:\s*0;/s);
  assert.match(modernLayout, /\.task-application-compact-context:not\(\[open\]\)\s*\{\s*display:\s*block;/);
  assert.match(modernLayout, /\.task-info-field span\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*500;[^}]*text-transform:\s*none;/s);
  assert.match(modernLayout, /\.task-info-field-primary strong\s*\{[^}]*font-size:\s*17px;[^}]*font-weight:\s*700;/s);
  assert.match(modernLayout, /\.task-application-compact-title\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/s);
  assert.match(modernLayout, /\.task-application-compact-number\s*\{[^}]*border-left:\s*1px solid/s);
  assert.match(styles, /\.task-card-compact \.task-main-info-panel \.panel-title \.shared-component-title,[\s\S]*?\.task-card-compact \.task-application-compact-context \.shared-component-title\s*\{[^}]*font-size:\s*16px;[^}]*font-weight:\s*650;/);
  assert.match(styles, /\.task-deals-inline-table-wrap\s*\{[^}]*max-width:\s*100%;[^}]*min-width:\s*0;[^}]*overflow-x:\s*auto;/s);
  assert.match(styles, /\.task-application-compact-number\s*\{/);
});

test("shared headings and help text use the same typography", () => {
  const titleRule = styles.match(/\n\.shared-component-title\s*\{([^}]*)\}/)?.[1] || "";
  const hintRule = styles.match(/\.shared-component-hint\s*\{([^}]*)\}/)?.[1] || "";
  assert.match(titleRule, /font-size:\s*18px;/);
  assert.match(titleRule, /font-weight:\s*700;/);
  assert.match(titleRule, /color:\s*var\(--text\);/);
  assert.match(styles, /\.task-card-compact \.panel \.shared-component-title\s*\{[^}]*font-size:\s*18px;/);
  assert.match(hintRule, /font-size:\s*12px;/);
  assert.match(hintRule, /font-weight:\s*400;/);
  assert.match(hintRule, /color:\s*var\(--muted\);/);
  assert.doesNotMatch(styles, /\.application-preinspection-block \.panel-title h2\s*\{\s*font-size:\s*15px;/);
});
