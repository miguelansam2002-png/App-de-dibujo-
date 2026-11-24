# Trazo Técnico 3D Studio — V11

Aplicación CAD 3D conceptual para ingeniería industrial, con biblioteca de 138 componentes, trenes de compresión V9, motor B-Rep/STEP V7 y ensamblajes V8. **V10 incorpora un espacio de documentación técnica** con planos, cortes, registros de inspección e informes descargables, diseñado para escritorio y tabletas Android.

## Novedades de V11

- Historial de hasta ocho puntos de recuperación por proyecto, con respaldo manual y restauración protegida por copia previa.
- Copias automáticas previas a guardados tras un intervalo de diez minutos, sin borrar proyectos existentes.
- Migración no destructiva de IndexedDB y conservación de planos, inspecciones y ensamblajes de V10.
- El historial es local al dispositivo: exporta también el JSON antes de cambiar o desinstalar la aplicación.

## Funciones heredadas de V10

1. **Planos de ingeniería:** cuatro vistas (planta, alzado, lateral e isométrica) generadas desde las piezas 3D; hoja A3/A4 horizontal; cotas de envolvente X/Y/Z en mm, referencias numeradas y cajetín con código de proyecto, documento, revisión, responsables y fecha.
2. **Secciones geométricas:** permite elegir plano de corte normal a X, Y o Z y una coordenada de corte en milímetros. Calcula segmentos de intersección con las superficies trianguladas.
3. **Exportación vectorial:** SVG, PDF (jsPDF con trazado vectorial directo) y DXF en mm. El DXF entrega proyecciones de envolventes y anotaciones preliminares; no es un DXF completo de fabricación.
4. **Vista explosionada para documentación:** usar el despiece visual existente antes de actualizar y exportar el plano.
5. **Inspecciones por pieza:** fecha, inspector, tipo, ubicación, medición, nominal, límites inferior/superior, unidad, criterio/referencia, resultado elegido, hallazgo, recomendación y fotografía opcional comprimida. Los datos se almacenan en `metadata.inspections` de cada componente.
6. **Informe técnico en HTML/PDF:** portada, identificación del proyecto, resumen, tabla de componentes, trazabilidad de datos de V9, observaciones de inspección y firmas documentales. El informe HTML admite anexos fotográficos; el PDF incluye tablas y observaciones (las fotos quedan en la versión HTML).
7. **Listas de materiales e inspecciones CSV:** exportación con protección de celdas para evitar fórmulas al abrir archivos en hojas de cálculo.
8. **Continuidad del proyecto:** metadatos V10 conservados en `meta.doc`, con respaldo JSON e IndexedDB. Se mantiene acceso offline a modelos y funciones.

## Cómo utilizarlo

1. Entra en **Planos** desde la barra lateral del editor.
2. Abre **Planos y cortes**, introduce el nombre, código y revisión, elige A3/A4 y la dirección/posición del corte. Pulsa **Guardar datos de plano**.
3. Pulsa **Actualizar vista previa** para revisar las cuatro vistas, las cotas generales y el corte.
4. Exporta en **SVG**, **PDF vectorial** o **DXF 2D**. Para una vista explosionada, selecciona una pieza de un conjunto y usa **Preparar despiece visual** antes de generar la lámina.
5. En la pestaña **Inspección**, elige la pieza y registra mediciones, observaciones, criterio técnico y foto cuando corresponda.
6. En **Informes**, exporta el informe consolidado en PDF o HTML; en **Materiales**, exporta las cantidades a CSV.
7. **Guarda siempre una copia del proyecto JSON** antes de actualizar o desinstalar la APK de prueba.

## Alcance técnico y límites conocidos

- **Todos los planos V10 son preliminares y NO APTOS PARA FABRICACIÓN.** Las cotas generales provienen de la envolvente del modelo; no representan tolerancias verificadas ni metrología de componentes reales.
- El corte usa triángulos de la representación visual, no una sección B-Rep exacta con relleno de material y verificación de líneas ocultas.
- Los dibujos proyectados no implementan eliminación exacta de líneas ocultas, normas completas de acotación, tolerancias geométricas GD&T ni certificación de escala. Las vistas se ajustan automáticamente al espacio.
- El DXF proporciona entidades LINE y TEXT de envolventes; no sustituye dibujos CAM ni exportación CAD paramétrica de piezas.
- El resultado «Conforme» o «No conforme» se declara manualmente por el inspector; nunca se infiere de una malla conceptual.
- La V9 sigue proporcionando geometrías originales no validadas de máquinas. No se incorporan números de parte, dimensiones OEM ni información industrial restringida sin documentación autorizada.
- El informe PDF consolida tablas y mediciones; las fotografías están disponibles en el **informe HTML**.
- La APK de GitHub Actions es un instalador **debug**, no firmado para distribución de producción. Se requieren pruebas adicionales en tableta física.

## Desarrollo y verificación

```bash
npm install
npm run check
npm test
npm run build
npm run dev
```

El workflow `.github/workflows/android-apk.yml` compila el APK Android con Capacitor. El workflow `.github/workflows/ui-visual.yml` comprueba navegación en escritorio/tableta, el modelador V7, el taller V9 y el espacio V10. Las pruebas de `tests/v10-engineering.test.mjs` comprueban geometría, proyecciones, sección, trazabilidad, CSV e informe PDF.

Licencias principales de terceros: Three.js, jsPDF y jspdf-autotable (MIT), junto con RepliCAD/OpenCascade.js, sujeto a los avisos del proyecto y a obligaciones LGPL aplicables para distribuciones.

## Etapas siguientes

**V11:** aplicación Android de producción con identidad y firma estables, pruebas físicas de tableta, respaldo/recuperación mejorados, actualización segura y validación del rendimiento con proyectos grandes. El núcleo CAD B-Rep y los planos de fabricación conforme a tolerancias OEM permanecen como líneas de investigación y validación técnica.

El editor 2D original continúa en `standalone/TrazoTecnico_v1.html`.
