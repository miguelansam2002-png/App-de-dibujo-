# Trazo Técnico 3D Studio — V6

Editor tridimensional para proyectos **conceptuales** de ingeniería industrial en Android y escritorio.

## Funciones incorporadas en V6 (2026-11-24)
- **Gestor de proyectos offline** en IndexedDB: guardar, abrir, duplicar y eliminar; conserva el respaldo JSON y los proyectos V2-V5.
- **3 plantillas de trenes de compresión:** turbina-caja-compresor, motor-compresor y tren en tándem; módulos independientes y metadatos editables.
- **21 nuevos tipos de objetos**: turbinas, compresores con boquillas, rotores con etapas, impulsores con álabes, cojinetes, sellos, cuadros de gas de sellos, filtros, enfriadores, bancadas, pedestales y tres sólidos CAD. **120 elementos insertables** en biblioteca + 1 tipo reservado para mallas importadas.
- **Árbol de ensamblaje:** seleccionar, ocultar, mostrar, desplazar conjuntos, y vista explosionada reversible.
- **Medición preliminar** de separación entre cajas envolventes e identificación de pares con envolventes superpuestas.
- **Importación STL y GLB** con unidades de entrada seleccionables (mm, cm, m, in); persistencia de geometría en JSON/IndexedDB.
- **Operaciones CSG de malla experimentales** (unión, corte e intersección) sobre bloque/cilindro/esfera y otras mallas cerradas, mediante three-bvh-csg. **NO se trata de B-Rep ni de un sistema industrial CAD exacto**.
- **Documentación:** exportación de plano visual A3 en SVG con planta, alzado, lateral e isométrica; lista de materiales CSV e informe HTML imprimible.
- Se mantienen las herramientas anteriores: unión por conectores, cotas numéricas, NPS/DN, ajustes finos, guardado JSON, PNG, STL y GLB.
- Nuevos controles de Studio adaptados a tableta, con interfaz de proyectos y módulo de equipos.

## Uso rápido
1. Abre **Proyectos** para guardar una copia local o elegir un diseño anterior.
2. En el visor pulsa **Trenes** y selecciona una de las tres plantillas.
3. En **Ingeniería → Conjuntos** puedes ver cada equipo, ocultar carcasa y usar la vista explosionada.
4. En **Ingeniería → CAD experimental** importa STL/GLB o combina dos sólidos de la categoría Sólidos CAD.
5. En **Ingeniería → Medición** puedes consultar distancias orientativas.
6. En **Planos** exporta el dibujo A3, la lista de materiales o el informe técnico.
7. Exporta periódicamente un **JSON de respaldo** antes de cambiar o desinstalar una APK de prueba.

## Desarrollo y compilación
```bash
npm install
npm run check
npm test
npm run build
npm run dev
```

La acción de GitHub Actions crea el archivo Android **debug APK**. Para instalar localmente desde una estación con SDK Android y Java:
```bash
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

## Limitaciones reconocidas
- Los **trenes de compresión son representaciones mecánicas conceptuales originales**, sin planos licenciados de Siemens u otros fabricantes. No corresponden a un modelo 462B 4/3 dimensionalmente validado.
- La geometría CSG se representa mediante triángulos: no es un kernel paramétrico B-Rep de OpenCascade, y algunas booleanas pueden fallar por errores topológicos. **La importación/exportación STEP e IGES todavía no está implementada**.
- Las vistas SVG son proyecciones de mallas, **no dibujos certificados**; las medidas provienen de las envolventes y los parámetros de piezas, no sustituyen tolerancias de fabricación.
- La detección preliminar de colisiones trabaja con cajas envolventes y puede producir falsos positivos.
- IndexedDB conserva proyectos offline pero desinstalar Android puede eliminar ese almacenamiento. Exporta siempre los JSON.
- Las bibliotecas son originales y paramétricas; dimensiones, materiales, normas y números de parte deben verificarse con documentación autorizada.
- CSG: three-bvh-csg MIT y three-mesh-bvh MIT. Licencias completas disponibles en los repositorios respectivos y paquetes npm.

## Continuación del plan V7-V11
1. **V7:** evaluar e integrar OpenCascade.js/RepliCAD en un worker B-Rep, compatibilidad STEP, croquis y cotas exactas.
2. **V8:** restricciones mecánicas de ensamblaje, uniones concéntricas/cara/cota y comprobación real de interferencias.
3. **V9:** modelos de fabricante autorizados y trenes de compresión parametrizados con piezas internas verificadas.
4. **V10:** planos con cotas, cortes y tolerancias reales, informes de mantenimiento y documentación formal.
5. **V11:** firmado estable Android, migración y recuperación de datos, biblioteca descargable y pruebas físicas de rendimiento.

La versión 2D original permanece en `standalone/TrazoTecnico_v1.html`.
