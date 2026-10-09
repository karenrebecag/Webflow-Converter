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

Converts a React + Tailwind component (`.tsx`) into Webflow's native clipboard format (`@webflow/XscpData`). Paste it
with Cmd+V in the Designer and it lands with classes, per-breakpoint variants and native element types. The Webflow
Data API supports neither combo classes nor variants.

## Status

| phase | status |
|---|---|
| Sandboxed evaluator, Tailwind resolution, desktop-first cascade | done |
| Mode B (self-contained BEM) | done; validated by pasting real sections into Webflow (desktop and mobile) |
| Mode A (Client-First, reuses the site's style guide) | planned |
| Batch validation against React/Webflow pairs | planned |
| Native types (Tabs, Dropdown, Navbar, Form) | planned |

This is a prototype: the API and the output may change.

## Usage

Requires [Bun](https://bun.sh) 1.3 and macOS. The sandbox uses `sandbox-exec`; see [Security](#security).

```bash
bun install

# 1. Convert a component
bun --no-install run src/cli.ts convert path/to/component.tsx --prefix my-

# 2. Build the copy page and serve it
bun --no-install run tools/copy-page.ts
cd out/convert && python3 -m http.server 8790 --bind 127.0.0.1
# open http://127.0.0.1:8790/ in a Chromium browser
```

3. Click **Copy** on the component and paste it with Cmd+V in the Designer, with the Body or a container selected.
4. If it comes with head CSS, paste that into *Page settings > Custom code*.

The copy page is needed because the Designer only accepts a paste whose clipboard carries `application/json`, and
only a browser copy event can write that type.

### `convert` options

| option | what it does |
|---|---|
| `--prefix <p>` | Prefix for every class (`my-cta1_heading`). **Always use it**: Webflow renames any class with CSS that already exists on the site with a " 2" suffix, even when the CSS is identical, and the head CSS stops matching it. |
| `--wide` | Emits the 1280 and 1440 variants. Without it they are folded into desktop, because pasting a 1280 variant adds that breakpoint to the whole site. |
| `--tailwind-config <path>` | Uses your project's `tailwind.config` instead of the default preset (`@relume_io/relume-tailwind`). |
| `--out <dir>` | Output directory; `out/convert/` by default. |
| `--mode b` | The only mode available for now. |

### Output (`out/convert/`)

- `<slug>.json`: the clipboard payload.
- `<slug>.head.css`: CSS that goes in the page head.
- `<slug>.report.json`: warnings.
  - `unsupported`: DOM nodes, and states sent to the head.
  - `cascade`: initial values that could not be inferred.
  - `generic`: relume-ui components without a stub.

## What is supported

- **Supported:**
  - Component JSX with default props, `map` and conditionals.
  - Tailwind 3 utilities, with the Relume preset or your own config.
  - Breakpoints `sm`/`md`/`lg` → Webflow's tiny/small/medium/main. Other breakpoint sets are approximated to those
    fixed Webflow ranges.
  - `hover:` and `active:` as native states.
- **Native types:** Block, Link (buttons become button Links), Image, Heading, Paragraph, List, ListItem, Blockquote
  and Span. SVGs become HtmlEmbed.
- **Emitted as DOM nodes (native mapping planned):** input, label, form, iframe, table.
- **Not supported:**
  - relume-ui `Button` styling: the package is not executed, so buttons keep Webflow's default style.
  - Real icons: a placeholder named after the icon is emitted.
  - framer-motion animations: the final state is evaluated.
  - Viewport-dependent rendering (`useMediaQuery` always returns false).

## Security

The converter **executes** the TSX to get the first-render tree. To treat it as untrusted code:
- It runs in a subprocess under macOS `sandbox-exec`: no network, no writes under `/Users`, an empty environment and
  `bun --no-install`.
- Every import is rewritten to a stub from an allowlist (`src/eval/stubs/`). No real package is loaded.
- An unknown import or any dynamic-loading construct (`import()`, `require`, `eval`, `Function`, `globalThis`,
  `process`, `fetch`) fails before anything runs.

`tests/security.test.ts` covers each of these cases. The exception is `--tailwind-config`: it is the user's own code
and runs outside the sandbox, just like in their Tailwind build.

## Documentation

- [`docs/webflow-paste-behavior.md`](docs/webflow-paste-behavior.md): what Webflow does on paste (class collisions,
  variables, breakpoints, grid), measured on a real site.

## Tests

```bash
bun --no-install test
bun --no-install test emit     # a single area
```

## License

[MIT](LICENSE). Webflow and Relume are trademarks of their respective owners; this project is not affiliated with
either. The `@relume_io/relume-tailwind` preset is installed from npm under its own terms and is not redistributed
here.
