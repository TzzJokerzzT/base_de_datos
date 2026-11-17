# Frontend · tablero del dataset `tips`

Aplicación React que muestra los ocho pasos del trabajo práctico con filtros globales: cada tabla,
gráfico e interpretación se recalcula sobre la selección actual, sin backend y sin base de datos.

## Stack

| Pieza | Versión / uso |
| --- | --- |
| React 19 + TypeScript + Vite | base de la aplicación, con React Compiler |
| HeroUI v3 (`@heroui/react`) | tarjetas, tablas, botones, sliders y chips |
| Tailwind CSS v4 (`@tailwindcss/vite`) | estilos utilitarios y tema claro/oscuro |
| Recharts | histogramas, barras, tortas y dispersión |
| SVG propio | diagramas de caja y mosaico (no hay caja ni mosaico en Recharts) |

## Comandos

```bash
bun install
bun run dev          # servidor de desarrollo
bun run build        # build de producción (incluye typecheck)
bun run typecheck    # solo TypeScript
bun run lint         # oxlint
bun run check:stats  # valida los estadísticos contra pandas
```

## Datos

`src/data/tips.json` lo genera el proyecto Python:

```bash
cd ../python && .venv/bin/python -m analisis_tips export
```

El JSON trae las 244 filas del dataset `tips` de seaborn y la metadata de cada columna. El
`src/data/dataset.ts` valida el esquema al importarlo: si el export viene incompleto o con otra
forma, la aplicación falla con un mensaje que indica cómo regenerarlo.

## Cómo se calculan los estadísticos

`src/lib/stats.ts` replica las definiciones de pandas para que el navegador y el proyecto Python den
los mismos números:

- varianza y desvío estándar **muestrales** (`ddof = 1`);
- asimetría de Fisher-Pearson y curtosis en exceso **corregidas por sesgo** (`Series.skew` / `Series.kurt`);
- cuartiles por interpolación lineal (`Series.quantile`), bigotes a 1.5 × RIC y atípicos fuera de los bigotes;
- histogramas con intervalos de igual ancho (`numpy.histogram`), 12 intervalos como el enunciado;
- correlaciones de Pearson, frecuencias con `value_counts` y contingencia con totales marginales.

`bun run check:stats` compara 83 valores contra `../python/out/reference_stats.json` (generado por
pandas) con tolerancia 1e-9. Es la garantía de que ambas implementaciones coinciden.

## Estructura

```
src/
├── App.tsx                    # shell: encabezado, navegación, filtros y secciones
├── components/
│   ├── FilterPanel.tsx        # filtros globales (niveles, tamaños y rangos)
│   ├── SectionCard.tsx        # tarjeta de sección con la interpretación
│   ├── StatTable.tsx          # tabla numérica compacta
│   ├── ChartFrame.tsx         # contenedor de gráfico con título y leyenda
│   ├── MetricCard.tsx         # indicador del resumen
│   └── charts/                # histograma, caja, dispersión, matriz, barras, dona y mosaico
├── data/
│   ├── dataset.ts             # tipos y metadata del dataset
│   └── tips.json              # datos exportados por Python
├── lib/
│   ├── stats.ts               # estadísticos (espejo de pandas)
│   ├── filters.ts             # estado y aplicación de filtros
│   ├── interpretations.ts     # interpretaciones dinámicas en español
│   ├── format.ts              # formato numérico uniforme
│   ├── palette.ts             # paleta Set2 de seaborn y escala de correlación
│   └── scale.ts               # escalas y marcas de los gráficos SVG
└── sections/                  # una sección por paso del enunciado
```

## Decisiones de interfaz

- Paleta Set2, la misma de las figuras de seaborn, para que el tablero y el informe Python se lean
  como el mismo trabajo.
- La interpretación de cada sección se genera a partir de los datos filtrados: si la selección cambia
  la conclusión, el texto también cambia.
- Sin gráficos de torta para más de cuatro categorías y sin animaciones: se prioriza leer números.
