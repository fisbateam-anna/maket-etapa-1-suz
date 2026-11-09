import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [styles, dataModule, numberingModule, taskAuthorModule, appModule] = await Promise.all([
  readFile(resolve(root, "src/styles.css"), "utf8"),
  readFile(resolve(root, "src/data.js"), "utf8"),
  readFile(resolve(root, "src/object-numbering.js"), "utf8"),
  readFile(resolve(root, "src/task-author.js"), "utf8"),
  readFile(resolve(root, "src/app.js"), "utf8")
]);
const version = appModule.match(/data\.js\?v=([^"']+)/)?.[1];
if (!version) throw new Error("Не найден маркер версии в импорте src/data.js");

const inlineData = dataModule.replace(/^export\s+/gm, "");
const inlineNumbering = numberingModule.replace(/^export\s+/gm, "");
const inlineTaskAuthor = taskAuthorModule.replace(/^export\s+/gm, "");
const inlineApp = appModule
  .replace(/^import\s+\{[^\n]+\}\s+from\s+["']\.\/data\.js\?v=[^"']+["'];\s*\r?\n/m, "")
  .replace(/^import\s+\{[^\n]+\}\s+from\s+["']\.\/object-numbering\.js\?v=[^"']+["'];\s*\r?\n/m, "")
  .replace(/^import\s+\{[^\n]+\}\s+from\s+["']\.\/task-author\.js\?v=[^"']+["'];\s*\r?\n/m, "");
if (/^import\s/m.test(inlineApp)) throw new Error("В src/app.js остались необработанные импорты");

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Залоговый модуль</title>
<style>
${styles}
</style>
</head>
<body>
<div id="app"></div>
<script>
window.__BUILD_VERSION__ = "${version}";
${inlineData}
${inlineNumbering}
${inlineTaskAuthor}
${inlineApp}
</script>
</body>
</html>
`;

for (const relativePath of ["Залоговый_модуль/index.html", "Залоговый_модуль_Р_автономный.html"]) {
  await writeFile(resolve(root, relativePath), html, "utf8");
}
console.log(`Built standalone HTML (${version})`);
