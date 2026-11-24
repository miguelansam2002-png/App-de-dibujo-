# Trazo Técnico 3D Studio V8 — Ensamblajes mecánicos

Aplicación de modelado técnico 3D para escritorio y tabletas Android. La **V8** construye sobre el módulo CAD B-Rep/STEP de la V7 e incorpora restricciones mecánicas editables, movimiento de conjuntos y un detector de interferencias entre superficies.

## Nuevas herramientas V8

### 1. Montaje y restricciones

Pulsa **Montaje** (barra lateral) o **Ingeniería → Montaje**.

1. Selecciona la **pieza que se desplazará**.
2. Selecciona la **pieza principal** (referencia).
3. Elige el tipo de relación:
   - **Fijación rígida:** guarda posición y orientación relativas, útil para bases y equipos auxiliares.
   - **Ejes concéntricos:** enfrenta y alinea referencias de ejes; permite ajustar separación axial y giro.
   - **Caras coincidentes:** alinea dos caras enfrentadas con separación configurable.
   - **Ejes paralelos:** conserva referencias paralelas.
   - **Separación fija:** mantiene desplazamiento definido respecto al objetivo.
   - **Ángulo de montaje:** incluye inclinación respecto a un eje de referencia.
4. Elige sus **referencias geométricas**: caras ±X/±Y/±Z, origen local, bocas de tubería, extremos o ejes de motor/compresor cuando existan.
5. Pulsa **Crear restricción**. El conjunto se actualiza sin introducir coordenadas manuales.
6. **Mostrar referencias 3D** visualiza las direcciones de montaje. **Separar** elimina una restricción sin borrar la pieza.

Las restricciones se guardan en JSON y en el gestor offline de proyectos. Al mover o girar la pieza principal, sus componentes dependientes se recalculan. Una pieza que el usuario mueve manualmente por separado se desvincula para evitar comportamientos inesperados. Se rechazan relaciones circulares.

### 2. Desplazar conjuntos

En **Montaje → Desplazar conjunto rígido**, introduce X/Y/Z en mm. Puedes desplazar el tren entero o únicamente la pieza raíz y sus dependientes, manteniendo las relaciones.

### 3. Interferencias 3D

Abre **Ingeniería → Interferencias**. Define la tolerancia en mm y si deseas excluir piezas ya conectadas o pertenecientes al mismo tren.

El analizador aplica:
- **Fase 1:** descarte de pares separados mediante cajas envolventes AABB.
- **Fase 2:** comprobación de intersección de superficies trianguladas con **three-mesh-bvh**, sobre las mallas reales y sus transformaciones 3D.
- **Resultados:** cruces de superficies confirmados y casos de contención/lectura incompleta que necesitan validación.

Puedes tocar **Ver A** o **Ver B** para ubicar las piezas sospechosas en el diseño.

**Limitación importante:** el detector comprueba intersecciones de superficies de malla, **no** intersección volumétrica exacta con OpenCascade. Un sólido totalmente contenido en otro, geometrías abiertas o contactos menores que la tolerancia requieren inspección adicional. La profundidad indicada se estima por las cajas envolventes, no representa la penetración exacta entre superficies.

## Funciones que se mantienen

- 120 componentes paramétricos de biblioteca, grapas, tuberías, soportes y equipos.
- Tres plantillas conceptuales de trenes de compresión y vistas de inspección/desarme.
- CAD B-Rep V7: STEP/STP individual, bloques, placas perforadas, cilindros, tubos y booleanas exactas de piezas compatibles.
- Proyectos offline con IndexedDB, copias JSON, exportación de imágenes, STL/GLB, plano visual A3, CSV de materiales e informe HTML.
- Android con Capacitor, diseño adaptable y operación táctil.

## Desarrollo

```bash
npm install
npm run check
npm test
npm run build
npm run dev
```

La acción `.github/workflows/android-apk.yml` compila el APK Android **debug** a partir del mismo código. Node.js 22+ y Android SDK cuando se compila localmente.

Pruebas nuevas: `tests/assembly-v8.test.mjs` valida restricciones, ciclos, traslaciones y detección de cruces de malla; `tests/browser-smoke.mjs` verifica navegación, creación de restricciones y panel de interferencias.

## Limitaciones y próximos pasos

- **Los anclajes genéricos no son referencias certificadas de fabricante**. Las cotas y las conexiones deben verificarse con planos autorizados antes de fabricar o montar.
- Las restricciones V8 resuelven árboles de relaciones rígidas y parámetros simples. **No** incorporan un solucionador general de mecanismos con grados de libertad, juntas cinemáticas articuladas ni análisis de esfuerzos.
- STEP se conserva a nivel de pieza B-Rep; no hay STEP de ensamblaje multinivel.
- La medición de interferencias no reemplaza una revisión de tolerancias, análisis dimensional o verificación geométrica B-Rep.
- V9: trenes de compresión con geometrías y referencias de fabricante autorizadas.
- V10: planos ortogonales y cortes acotados, documentación formal y secuencias de desarme.
- V11: instalador firmado estable, pruebas en tabletas físicas y recuperación robusta de proyectos.

**Respaldo:** exporta siempre tus proyectos JSON antes de sustituir o desinstalar la APK, porque Android puede borrar los datos locales. La versión 2D autónoma sigue disponible en `standalone/TrazoTecnico_v1.html`.
