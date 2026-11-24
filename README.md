# Trazo Técnico 3D — Versión 3

Editor 3D de ingeniería liviano, paramétrico y táctil, orientado a tuberías, grapas, bridas, soportes, estructuras y bocetos de mantenimiento y fabricación. Funciona en navegador y tiene compilación automatizada **APK Android de pruebas** mediante GitHub Actions.

## Lo nuevo en V3

- **47 tipos de piezas originales** agrupadas en tuberías, accesorios, bridas, válvulas, grapas, soportes, estructuras, fijaciones y equipos. No usa modelos de fabricantes sin licencia.
- **Modelos mejorados**: tuberías huecas con espesor visible, codos curvados huecos, grapas tipo U con varilla, tuercas y placa; grapas omega con banda curvada y taladros; bridas y placas con agujeros geométricos reales, perfiles estructurales, diversos tipos de válvulas y accesorios.
- **Interacción directa con piezas**: modo Mover, selección tocando la geometría y arrastre con dedo o ratón sobre planos XZ, XY o YZ; modo Vista para girar cámara; modo Girar con aros 3D. En zonas vacías se puede orbitar la cámara.
- **Movimiento preciso**: pasos de 1, 5, 10, 25, 50 y 100 mm, o libre; controles de desplazamiento ±X/±Y/±Z, giros rápidos ±90° y campos de posición y rotación numéricos.
- **Diámetros de tubería NPS/DN**: opciones de 1/2 a 12 pulgadas con diámetro exterior y espesor de pared de Schedule 40/80 de referencia; datos a contrastar con especificaciones de proyecto.
- **Mejor interfaz para tabletas**: paneles laterales, controles de mayor tamaño, barra inferior táctil, aspecto industrial sobrio, acabados y colores predefinidos.
- JSON editable, STL, GLB y PNG; conservación automática local y exportación de proyectos.
- Pruebas automatizadas de generación y coherencia geométrica antes de compilar la APK.

## Uso rápido

1. Abre **Piezas** y toca un componente para agregarlo.
2. En modo **Mover**, toca la pieza y **arrástrala** sobre el plano de trabajo; usa el desplegable de plano si debes trabajar en alzado o lateral.
3. Para orbitar la escena, arrastra el fondo vacío o utiliza **Vista**; con dos dedos puedes desplazar y ampliar/reducir la cámara.
4. Selecciona una pieza y abre **Editar**. Ajusta medidas, posición, giro o acabado. Usa los botones de ±X, ±Y, ±Z para colocar la pieza con precisión.
5. Para tuberías con diámetro y espesor editables, selecciona NPS/DN y Schedule y pulsa **Aplicar**.
6. Pulsa **Guardar** para exportar JSON. Al trabajar en Android utiliza Compartir para guardar copias fuera de la aplicación antes de desinstalarla.

### Navegador / desarrollo

```bash
npm install
npm run check
npm test
npm run dev
```

Para generar el sitio web offline: `npm run build`.

### Android

La acción [Trazo Tecnico 3D - APK de prueba](.github/workflows/android-apk.yml) crea una APK firmada únicamente para pruebas (debug) en la pestaña **Actions** del repositorio. GitHub Actions la guarda como artefacto ZIP descargable.

Para crear localmente el proyecto Android con SDK y Java configurados:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

La APK debug resultante estará en `android/app/build/outputs/apk/debug/app-debug.apk`. Para una distribución permanente hay que establecer un ID/keystore de firma de producción, versiones y pruebas de actualización en dispositivos reales.

## Referencias para las dimensiones y la biblioteca

- Datos orientativos de OD y Schedule de tuberías: tabla técnica pública de Dixon Valve, *Pipe Dimensions — B36.10/B36.19*: https://dixonvalve.com/sites/default/files/catalog/dixonvalve_com/2024_13/DPL%202024%20catalog%20fixed/DPL424%20page%201141.pdf
- Normas de referencia de bridas: ASME B16.5; consultar documentación autorizada de cada proyecto antes de usar dimensiones en planos de fabricación.
- Referencia de soportes y abrazaderas: MSS SP-58; requisitos y tamaños reales varían según el fabricante y la carga.
- Catálogos de terceros para investigación **sin incorporar ni redistribuir archivos automáticamente**: https://www.3dfindit.com/, https://www.traceparts.com/, https://www.3dcontentcentral.com/.
- Modelado y manipulación 3D: Three.js; empaquetado Android: Capacitor.

## Límites de ingeniería y próximos pasos

**No es todavía un sistema CAD B-Rep ni reemplaza un software de diseño certificado.** Las piezas son modelos conceptuales paramétricos propios, no modelos normalizados homologados por un fabricante. Algunas conexiones presentan geometrías superpuestas, no uniones booleanas exactas. STL/GLB exportan mallas visuales y deben verificarse antes de imprimir, mecanizar o fabricar. Las cotas calculadas y los códigos de componente no garantizan la integridad estructural.

Siguientes funciones: unir extremos de tubos con puntos de acoplamiento, restricciones de posición, sólidos B-Rep con OpenCascade, archivos STEP/DXF, planos 2D asociados, listas de materiales, biblioteca de fabricantes con licencia, gestión robusta de proyectos Android y optimización de rendimiento sobre tabletas reales.

## Conservación de versiones

La versión 2D independiente sigue en `standalone/TrazoTecnico_v1.html` y la historia anterior permanece disponible desde Git. Los documentos JSON de Trazo Técnico 3D V2 se pueden importar en V3, pero guarda una copia antes de modificar el proyecto.