// Pagina local con un boton Copy por cada payload de out/convert/. Uso: bun --no-install run tools/copy-page.ts
// Se sirve con cualquier servidor estatico local y se abre en Chromium: el Designer solo acepta el pegado si el
// portapapeles trae application/json, y eso solo se escribe desde un evento copy del navegador.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DIR = resolve(process.argv[2] ?? join(import.meta.dir, "../out/convert"));
if (!existsSync(DIR)) throw new Error(`no existe ${DIR}: corre primero src/cli.ts convert`);

const rows = readdirSync(DIR)
  .filter((f) => /^[\w-]+\.json$/.test(f) && !f.endsWith(".report.json"))
  .sort()
  .map((f) => {
    const slug = f.replace(/\.json$/, "");
    const headPath = join(DIR, `${slug}.head.css`);
    return { slug, data: readFileSync(join(DIR, f), "utf8"), head: existsSync(headPath) ? readFileSync(headPath, "utf8") : "" };
  });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// JSON dentro de <script>: solo hay que impedir que cierre la etiqueta.
const inScript = (s: string) => s.replace(/</g, "\\u003c");

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>webflow-converter</title>
<style>body{font:16px system-ui;max-width:48rem;margin:2rem auto;padding:0 1rem}li{margin:1rem 0}
button{font:inherit;padding:.4rem .9rem;cursor:pointer}button:focus-visible{outline:2px solid #000;outline-offset:2px}
pre{background:#f4f4f4;padding:.5rem;overflow:auto;font-size:13px}</style></head><body>
<h1>Pegar en Webflow</h1><p>Copy y luego Cmd+V en el Designer con el Body o un contenedor seleccionado.</p><ol>
${rows.map((r) => `<li><strong>${esc(r.slug)}</strong> <button type="button" data-id="${esc(r.slug)}">Copy</button>
${r.head ? `<p>Head CSS (Page settings &gt; Custom code):</p><pre>${esc(r.head)}</pre>` : ""}
<script type="application/json" id="p-${esc(r.slug)}">${inScript(r.data)}</script></li>`).join("\n")}
</ol><p role="status" id="status"></p>
<script>
document.querySelectorAll("button[data-id]").forEach((b) => b.addEventListener("click", () => {
  const json = document.getElementById("p-" + b.dataset.id).textContent;
  const onCopy = (e) => { e.clipboardData.setData("application/json", json); e.clipboardData.setData("text/plain", json); e.preventDefault(); };
  document.addEventListener("copy", onCopy, { once: true });
  document.execCommand("copy");
  document.getElementById("status").textContent = b.dataset.id + " copiado";
}));
</script></body></html>`;

writeFileSync(join(DIR, "index.html"), html);
process.stdout.write(`${rows.length} payloads -> ${join(DIR, "index.html")}\n`);
