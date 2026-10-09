# Qué hace Webflow al pegar un `@webflow/XscpData`

El formato del portapapeles del Designer no está documentado. Esto es lo que se midió pegando payloads de prueba en un
sitio real el 2026-10-09: se leyeron los estilos resultantes con el MCP oficial de Webflow y se revisó cada pegado en
el Designer. Estas medidas son la base de las decisiones del conversor.

| caso | qué pasa | qué decide en el conversor |
|---|---|---|
| Clase con CSS cuyo nombre ya existe en el sitio | Se crea otra con sufijo: `box 2`, `box 3` (selector `.box-2`), **aunque el CSS sea idéntico**. Nunca se reusa. | `--prefix` por proyecto; si no, el head CSS deja de apuntar a la clase. |
| Clase sin CSS en el payload (`styleLess` vacío) cuyo nombre ya existe | Se reusa la del sitio, sin sufijo, con sus valores (así funcionan los combos `margin-*` de Client-First). | El modo A (Client-First) debe emitir esas clases vacías para heredar la style guide del sitio. |
| `@var_<id>` de una variable que no existe | Pega sin error; el estilo queda con una referencia colgante y no se crea la variable. | No emitir `@var_` sin comprobar las variables del sitio. |
| `aspect-ratio`, pseudo `main_focus` | Se guardan y el panel de estilos no crasheó en esta prueba. | Siguen configurables (`EmitConfig.unsafeProps`) por si otros sitios lo reproducen. |
| Variante `large` (1280px) en cualquier clase | El Designer avisa "1 breakpoint added" y **agrega ese breakpoint a todo el sitio**. | `large`/`xl` se pliegan en main; `--wide` los emite. |
| `grid-template-columns: repeat(2, minmax(0, 1fr))` | El layout se renderizó con columnas angostas. Los payloads que genera el propio Designer nunca usan `repeat()` ni `minmax()`. | Las pistas se expanden a `1fr 1fr`. |
| `<span>` emitido como Block dentro de un Paragraph | Queda un `<div>` dentro de un `<p>`. | `span` sale como el tipo nativo `Span`. |
| Block con `display: grid` frente al tipo `Grid` | Mismo CSS; cada uno conserva su tipo. | Se emite Block; el tipo `Grid` queda para la fase de nativos. |
| Nodos de formulario nativos (FormWrapper, FormTextInput, FormSelect, FormRadio*) | Pegan completos. | Base para la fase de nativos. |
| `inherit` en `font-size` y `line-height` | Se guarda en la variante. | Las propiedades heredadas bajan a `inherit` en los rangos donde Tailwind no las define. |

Cuatro secciones convertidas en modo B (cta, header, layout, testimonial) se compararon con sus originales en desktop y
móvil: coinciden. Los botones quedan con el estilo por defecto del sitio, porque su CSS vive en una librería de
componentes que el conversor no ejecuta.
