```
██╗    ██╗███████╗██████╗ ███████╗██╗      ██████╗ ██╗    ██╗
██║    ██║██╔════╝██╔══██╗██╔════╝██║     ██╔═══██╗██║    ██║
██║ █╗ ██║█████╗  ██████╔╝█████╗  ██║     ██║   ██║██║ █╗ ██║
██║███╗██║██╔══╝  ██╔══██╗██╔══╝  ██║     ██║   ██║██║███╗██║
╚███╔███╔╝███████╗██████╔╝██║     ███████╗╚██████╔╝╚███╔███╔╝
 ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
 ██████╗ ██████╗ ███╗   ██╗██╗   ██╗███████╗██████╗ ████████╗███████╗██████╗
██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔════╝██╔══██╗╚══██╔══╝██╔════╝██╔══██╗
██║     ██║   ██║██╔██╗ ██║██║   ██║█████╗  ██████╔╝   ██║   █████╗  ██████╔╝
██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██╔══██╗   ██║   ██╔══╝  ██╔══██╗
╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ███████╗██║  ██║   ██║   ███████╗██║  ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
```

# webflow-converter

Convierte un componente React + Tailwind (`.tsx`) en el portapapeles nativo de Webflow (`@webflow/XscpData`). Se pega
con Cmd+V en el Designer y llega con clases, variantes por breakpoint y tipos nativos. La Data API de Webflow no
admite ni combos ni variantes.

## Estado

| fase | estado |
|---|---|
| Evaluador en sandbox, Tailwind, cascada a desktop-first | hecho |
| Modo B (BEM autocontenido) | hecho; validado pegando secciones reales en Webflow (desktop y móvil) |
| Modo A (Client-First, reusa la style guide del sitio) | pendiente |
| Validación en lote contra pares React/Webflow | pendiente |
| Tipos nativos (Tabs, Dropdown, Navbar, Form) | pendiente |

Es un prototipo: la API y la salida pueden cambiar.

## Uso

Requiere [Bun](https://bun.sh) 1.3 y macOS. El sandbox usa `sandbox-exec`; ver [Seguridad](#seguridad).

```bash
bun install

# 1. Convertir un componente
bun --no-install run src/cli.ts convert ruta/al/componente.tsx --prefix mi-

# 2. Generar la página de copia y servirla
bun --no-install run tools/copy-page.ts
cd out/convert && python3 -m http.server 8790 --bind 127.0.0.1
# abrir http://127.0.0.1:8790/ en Chromium
```

3. Pulsa **Copy** en el componente y pégalo con Cmd+V en el Designer, con el Body o un contenedor seleccionado.
4. Si trae head CSS, pégalo en *Page settings > Custom code*.

### Opciones de `convert`

| opción | qué hace |
|---|---|
| `--prefix <p>` | Prefijo para todas las clases (`wfc-cta1_heading`). **Úsalo siempre**: Webflow renombra con " 2" cualquier clase con CSS que ya exista en el sitio, aunque el CSS sea idéntico, y el head CSS deja de apuntar a ella. |
| `--wide` | Emite las variantes de 1280 y 1440. Si no lo pasas, se pliegan en desktop, porque pegar una variante de 1280 agrega ese breakpoint a todo el sitio. |
| `--out <dir>` | Carpeta de salida; por defecto `out/convert/`. |
| `--tailwind-config <ruta>` | Usa el `tailwind.config` de tu proyecto en vez del preset por defecto (`@relume_io/relume-tailwind`). |
| `--mode b` | El único modo disponible por ahora. |

### Salida (`out/convert/`)

- `<slug>.json`: el portapapeles.
- `<slug>.head.css`: el CSS que va al head.
- `<slug>.report.json`: los avisos.
  - `unsupported`: nodos DOM y estados que van al head.
  - `cascade`: valores iniciales que no se pudieron deducir.
  - `generic`: componentes de relume-ui que no tienen stub.

## Qué entra y qué no

- **Entra:**
  - JSX de componentes con props por defecto, `map` y condicionales.
  - Las utilidades de Tailwind 3 con el preset de Relume.
  - Breakpoints `sm`/`md`/`lg` → tiny/small/medium/main. Con otro set de breakpoints, se aproximan a esos rangos fijos de Webflow.
  - `hover:` y `active:` como estados nativos.
- **Tipos nativos:** Block, Link (los botones salen como Link botón), Image, Heading, Paragraph, List, ListItem,
  Blockquote y Span. Los SVG salen como HtmlEmbed.
- **Como nodo DOM (pendiente de F7):** input, label, form, iframe, table.
- **No entra:**
  - El estilo de `Button` de relume-ui: el paquete no se instala y queda el botón por defecto de Webflow.
  - Los iconos reales: sale un marcador con el nombre del icono.
  - Las animaciones de framer-motion: se evalúa el estado final.
  - El ancho de los componentes al cambiar el tamaño de la ventana (`useMediaQuery` siempre devuelve false).

## Seguridad

El conversor **ejecuta** el TSX para obtener el árbol del primer render. Para tratarlo como código no confiable:
- Corre en un subproceso con `sandbox-exec` de macOS: sin red, sin escritura en `/Users`, con el entorno vacío y
  `bun --no-install`.
- Cada import se reescribe a un stub de una lista blanca (`src/eval/stubs/`). No se carga ningún paquete real.
- Si hay un import desconocido o una construcción de carga dinámica (`import()`, `require`, `eval`, `Function`,
  `globalThis`, `process`, `fetch`), falla antes de ejecutar nada.

`tests/security.test.ts` cubre cada uno de esos casos. La excepción es `--tailwind-config`: es código del propio
usuario y corre fuera del sandbox, igual que en su build de Tailwind.

## Documentación

- [`docs/webflow-paste-behavior.md`](docs/webflow-paste-behavior.md): lo que hace Webflow al pegar (colisiones de clases,
  variables, breakpoints, grid), medido en un sitio real.

## Tests

```bash
bun --no-install test
bun --no-install test emit     # solo un área
```

## Licencia

[MIT](LICENSE). Webflow y Relume son marcas de sus dueños; este proyecto no está afiliado a ninguno. El preset
`@relume_io/relume-tailwind` se instala desde npm con sus propios términos y no se redistribuye aquí.
