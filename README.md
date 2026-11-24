# Trazo Técnico 3D Studio V9 — Compresión industrial

Aplicación CAD 3D para bocetos y ensamblajes conceptuales. La **V9** conserva el motor B-Rep/STEP de V7 y las restricciones de V8 e incorpora un taller de compresión con modelos mecánicos individuales, configuraciones de rotores y registro técnico por componente.

## Novedades V9

- **138 componentes de biblioteca**: 120 anteriores y 18 nuevos modelos mecánicos V9.
- **Carcasas** superior e inferior desmontables, carcasa barril, pestañas, tapas y bulonería.
- **Rotor:** eje escalonado, impulsores abiertos y cerrados con álabes, diafragmas por etapa, balance, laberintos y plato de empuje.
- **Sistemas auxiliares:** cojinetes de zapatas, housing, cartuchos conceptuales de sellos secos, acoples de diafragma, guarda, sensor axial.
- **Tres configuradores V9:** rotor por etapas; compresor de carcasa partida; tren completo con motor, caja de engranajes, compresor y auxiliares.
- Parámetros: de **1 a 10 etapas**, diámetro del impulsor, diámetro del eje y longitud del rotor (mm).
- **Inspección por subsistemas:** mostrar/ocultar, despiece visual, aislamiento y selección de piezas sin alinearlas manualmente.
- **Fichas de trazabilidad:** fabricante, P/N, S/N, dibujo/manual/página, revisión, material, observaciones, fuente, revisor y fecha. Exportación de registro CSV con protección ante fórmulas de hoja de cálculo.
- Conservar proyectos JSON/IndexedDB, importación/exportación STEP de piezas B-Rep, restricciones de montaje y control de interferencias BVH.

## Uso rápido en una tableta

1. En la barra lateral pulsa **Equipos**, o **Ingeniería → Compresión V9**.
2. Selecciona una plantilla y configura etapas, diámetro del impulsor, eje y longitud.
3. Pulsa **Crear conjunto detallado**.
4. Abre **Despiece e inspección** y escoge carcasa, rotor, etapas, cojinetes, sellos, transmisión o auxiliares.
5. Usa **Mostrar internos**, **Ver todo**, **Despiece visual** y **Rearmar**.
6. En **Ficha técnica**, selecciona una pieza, registra datos solo con documentación original y pulsa **Guardar ficha técnica**.
7. Exporta el registro de piezas en CSV y guarda periódicamente una copia JSON del proyecto.

## Alcance de las referencias

- [Siemens Energy — Single-shaft centrifugal compressors](https://www.siemens-energy.com/global/en/home/products-services/product/single-shaft-centrifugal-compressors.html): información pública sobre configuraciones, carcasas y etapas.
- [Siemens Energy — Dry gas seals](https://www.siemens-energy.com/global/en/home/products-services/product/dry-gas-seals.html): principios y configuraciones de sellos.
- [API — Source Inspector study guide](https://www.api.org/~/media/files/certification/icp/icp-certification-programs/si_suite_documents/sire/sire_study%20guide_20181002.pdf): referencia de inspección mecánica; las normas originales requieren consulta y licencia aplicables.

**No se han copiado modelos CAD de fabricantes ni asignado números de parte ficticios.** La geometría y las dimensiones predeterminadas son originales y **conceptuales**. No equivalen al modelo 462B 4/3 ni a otra máquina particular. Para reproducir un compresor específico se necesitan planos aprobados, dimensiones, P/N/S/N correctos, revisiones y autorización de su propietario/fabricante.

La condición de ficha **«Contrastado»** requiere número de parte, referencia de plano, revisor y fecha, pero no implica certificación por OEM ni autorización para fabricación.

## Desarrollo

```bash
npm install
npm run check
npm test
npm run build
npm run dev
```

GitHub Actions genera la APK debug de Android mediante Capacitor. La aplicación permite visualizar y modificar los diseños offline; los enlaces a documentos públicos necesitan internet.

## Límites

- El despiece es **visual**: no valida secuencias reales de desmontaje o seguridad.
- Los modelos V9 de impelentes, carcasas y ejes son mallas paramétricas. **No son sólidos B-Rep de fabricación**. El módulo B-Rep de V7 se mantiene para crear/importar piezas STEP.
- Los planos A3, cotas y tolerancias son preliminares: comprueba planos OEM y criterios de inspección antes de fabricar o montar.
- No subas datos operacionales, manuales confidenciales ni seriales reales a un repositorio público.
- V10: documentación técnica, planos y reportes de desarme. V11: app Android firmada de producción y pruebas en tabletas físicas.

Editor 2D original: `standalone/TrazoTecnico_v1.html`.