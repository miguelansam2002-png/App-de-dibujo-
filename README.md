# Trazo Técnico 3D Studio V7 · CAD B-Rep

Aplicación Android y escritorio para diseño conceptual de ingeniería. **V7 integra OpenCascade mediante RepliCAD en un Web Worker**, para realizar cálculos CAD sin bloquear los gestos del visor.

## Funciones nuevas

- **Ingeniería → CAD exacto:** croquis paramétricos elementales: bloque rectangular, cilindro, placa con taladro y tubería hueca. La geometría se crea como sólido B-Rep real, no como una malla triangular.
- **Importación STEP/STP:** los sólidos importados se conservan en el proyecto con su geometría B-Rep (fuente STEP). La previsualización utiliza una malla derivada.
- **Exportación STEP:** una pieza B-Rep seleccionada. No intenta convertir mallas STL/GLB antiguas en STEP.
- **Booleanas B-Rep:** unión, corte e intersección de dos sólidos STEP. En V7 exigen rotación 0° para mantener el flujo de transformaciones fiable.
- **Regeneración paramétrica:** edición de dimensiones de piezas B-Rep creadas desde perfiles simples; actualiza la definición STEP.
- Mantiene las herramientas V6: biblioteca de 120 componentes, proyectos IndexedDB offline, tres trenes de compresión conceptuales, planos visuales A3, BOM, inspección y controles de tableta.

## Uso rápido

1. Abre **Ingeniería → CAD exacto**.
2. Elige bloque, cilindro, placa perforada o tubo. Introduce las medidas en milímetros y pulsa **Crear sólido B-Rep**.
3. Selecciona el objeto y pulsa **Exportar pieza B-Rep seleccionada (.step)**.
4. Usa **Importar modelo STEP / STP** para insertar un modelo CAD con licencia y documentación válidas.
5. Para unión, resta o intersección, crea/importa dos sólidos B-Rep; selecciónalos en los campos A y B.
6. Guarda tus trabajos en **Proyectos** y exporta una copia JSON antes de cambiar de APK.

La primera operación inicializa el motor WebAssembly y puede consumir tiempo y memoria. Se distribuye localmente dentro de la aplicación y no requiere servidor de geometría.

## Compilación

```bash
npm install
npm run check
npm test
npm run build
npm run dev
```

GitHub Actions compila la APK Android de pruebas con Capacitor. Node.js 22+ recomendado.

## Límites conocidos

- **B-Rep/STEP disponible únicamente para piezas creadas/importadas desde este nuevo módulo.** Los antiguos modelos conceptuales no se convierten automáticamente a sólidos CAD exactos.
- STEP de **pieza individual**, no de ensamblaje multinivel. No se admite aún IGES.
- Booleanas B-Rep de piezas con rotación 0°. Los casos complejos pueden generar errores topológicos. Las traslaciones sí están consideradas.
- Croquis simples parametrizados, no un editor completo de restricciones geométricas. Quedan pendientes chaflanes, redondeos e historiales por operaciones.
- Las dimensiones son nominales; la generación de B-Rep **no equivale a certificación de fabricante ni a un plano validado para fabricación**.
- Conserva exportaciones de planos visuales orientativos; las cotas certificadas y tolerancias formales siguen en desarrollo.
- La desinstalación de Android podría borrar los proyectos de IndexedDB. Exporta siempre tus JSON.
- El proyecto incorpora OpenCascade en WASM; hay obligaciones de licencia LGPL que deben revisarse para distribuciones de producción. Consulta [avisos](licenses/THIRD-PARTY.md).

## Próximas etapas

- V8: restricciones geométricas y mecánicas, referencias concéntricas, interferencias topológicas.
- V9: trenes de compresión basados en modelos dimensionalmente verificados y autorizados.
- V10: planos de fabricación con vistas, secciones y cotas/tolerancias precisas.
- V11: firma Android estable, copias de seguridad y prueba en tabletas físicas.

La app 2D autónoma original permanece en `standalone/TrazoTecnico_v1.html`.
