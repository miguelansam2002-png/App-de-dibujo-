# Trazo Tecnico 3D V5 - Biblioteca industrial

Aplicacion 3D tactil para hacer bocetos, ensamblajes y predimensionamiento conceptual de tuberias, soportes, abrazaderas, elementos estructurales y equipos. El proyecto mantiene el funcionamiento de union automatica de V4 y agrega un catalogo 3D mucho mas amplio.

## Mejoras de V5

- **99 modelos parametricos**: los 47 componentes originales y 52 variantes nuevas.
- **Miniaturas 3D del propio modelo** en el catalogo, generadas localmente; las miniaturas no se descargan de servicios externos.
- Piezas con mayor detalle visual: bordes de tuberia, soldaduras representativas, tornilleria, empaque, ranuras, bandas, abrazaderas, bridas y soportes.
- Versiones adicionales de tuberia doble pared y revestida, spool empernado, codos de radio corto, codos socket y roscados, reductores, conexiones Y, valvulas, juntas de expansion, colgadores, motor, manometro y otras piezas.
- **22 medidas de tuberia NPS/DN**, desde 1/8 hasta 24 pulgadas, con valores de referencia para Schedule 40 y Schedule 80. La disponibilidad comercial y los espesor normativos para el material y el proyecto deben comprobarse.
- Controles editables en milimetros con medidas, colores y acabados; mantiene unir, encajar, separar y guardar JSON.
- Mantiene versiones para escritorio y Android, exportacion PNG / STL / GLB y respaldos JSON.

## Como usar la biblioteca

1. Abre **Piezas** desde el panel izquierdo o la barra de la tableta.
2. Elige una categoria o busca por nombre de pieza. Las tarjetas mostraran una previsualizacion 3D si la tableta admite un segundo contexto WebGL; de lo contrario, se conserva el simbolo de cada pieza.
3. Toca la pieza para colocarla. Si **Unir al insertar** esta activado, el editor intentara conectarla a la pieza seleccionada usando diametros y conectores compatibles.
4. Selecciona la pieza para ajustar longitud, diametro, espesor, orientacion, posicion o acabado en **Editar**.
5. Guarda una copia JSON del proyecto antes de actualizar la APK.

## Ejecucion local

Requiere Node.js 22.12 o superior.

```bash
npm install
npm run check
npm test
npm run dev
```

El sitio web offline se construye con `npm run build`. Para compilar APK desde una maquina con Java y Android SDK instalados:

```bash
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

GitHub Actions ejecuta pruebas geometricas, prueba la interfaz en escritorio y tableta y genera un APK de desarrollo en **Actions**. El APK aun requiere pruebas en una tableta fisica y firma de produccion para distribucion estable.

## Criterios de rigor y procedencia

Todos los modelos incorporados se generan mediante geometria original de este repositorio. **No son replicas verificadas ni certificados de fabricantes**: sirven para estudios, croquis y visualizacion, no para fabricar o instalar sin revision tecnica.

Las medidas de tuberia se contrastaron a nivel de catalogo con el boletin PFI TB-10 y catalogos dimensionales de accesorios de acero. La geometria de abrazaderas toma como referencia funcional los catalogos de fabricantes para identificar varillas, placas, tuercas y bandas, sin reproducir modelos propietarios.

- PFI TB-10 / ASME B36.10 (referencia de NPS): https://www.pfi-institute.org/media/files/TB-10.pdf
- Weldbend, catalogo de dimensiones SCH 40/80: https://weldbend.com/Catalog_63_English_Metric.pdf
- NORMAFIX U-bolt clamp (referencia funcional): https://www.norma-connects.com/sites/dsemea/files/qbank/documents/NORMA-U-Bolt-Clamp-Datasheet.pdf
- Fluid Controls, soportes U-bolt: https://fluidcontrols.com/products/clamps-and-flanges/pipe-clamps-2/u-bolt-clamps/
- Referencias normativas a consultar en cada proyecto: ASME B16.5, ASME B16.9 y MSS SP-58.

No se ha implementado un motor B-Rep de solidos exactos, analisis estructural, controles de interferencia certificados ni conversion automatica a STEP/DWG. STL y GLB exportan mallas de visualizacion, no planos listos para fabricacion.

## Versiones conservadas

La version 2D original sigue en `standalone/TrazoTecnico_v1.html`. Los archivos JSON V2-V4 se pueden importar y conservan su esquema base. Antes de desinstalar una APK beta exporta el proyecto JSON a almacenamiento externo.