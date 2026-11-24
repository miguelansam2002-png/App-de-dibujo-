# Trazo Técnico 3D — Versión 4

Aplicación de diseño tridimensional para bocetos y ensamblajes conceptuales de ingeniería, especialmente tuberías, grapas, bridas, válvulas y soportes. Optimizada para pantallas táctiles Android y escritorio.

## Novedades V4

- **Unir sin arrastrar a mano:** selecciona una pieza, pulsa **🔗 Unir**, toca la pieza destino y ambas se alinean por sus conexiones compatibles.
- **Unión al insertar:** con la opción **Unir al insertar** activada, selecciona una tubería y toca un accesorio en la biblioteca. El nuevo componente se acopla automáticamente a una boca libre cuando existe un conector compatible.
- **Ajuste magnético durante el movimiento:** al aproximar dos bocas compatibles se muestra una indicación turquesa. Suelta para vincularlas.
- **Enlaces persistentes entre piezas:** la unión mantiene una relación geométrica de ensamblaje; si cambias dimensiones o posición de la pieza principal, sus piezas hijas se reajustan. También puedes **Separar** una pieza y conservar su posición.
- **Selector avanzado de conexiones:** desde las propiedades puedes indicar pieza destino y elegir específicamente las bocas de conexión.
- **Más detalle en varios componentes:** grapas U con placas perforadas, arandelas, tuercas y roscas; grapas omega con anclajes y pernos; bridas con caras realzadas; extremos de tuberías y accesorios reforzados visualmente.
- Interfaz de unión destacada con acentos turquesa y botones táctiles mayores.
- Conserva los **47 tipos de componentes** anteriores, medidas NPS/DN, unidades mm, guardar JSON, exportar PNG, STL y GLB.

## Uso rápido en tableta

1. Abre **Piezas**, selecciona una tubería o usa la predeterminada.
2. Activa **Unir al insertar** y añade un codo, una brida u otra pieza con diámetro compatible. La aplicación acopla las bocas automáticamente.
3. Para unir dos piezas que ya están en el dibujo: selecciona la **pieza que quieres mover**, pulsa **🔗 Unir**, después toca la **pieza destino** en el modelo.
4. Para indicar extremos exactos, abre **Editar → Ensamble inteligente**, elige pieza destino, «Mi conexión» y «Conexión destino», y pulsa **Alinear y unir automáticamente**.
5. También puedes aproximar una pieza con el dedo: cuando aparezca el indicador de encaje, suéltala.
6. Para mover por separado una pieza vinculada, pulsa **Separar** o arrástrala (la aplicación desvincula esa pieza al iniciar un movimiento libre).
7. Exporta **JSON** con frecuencia: guarda una copia fuera de la app antes de actualizar o desinstalar una APK de prueba.

Los enlaces de montaje son editables y **no son operaciones booleanas de fusión de sólidos**. Se conservan en los archivos JSON de la versión 4.

## Desarrollo

```bash
npm install
npm run check
npm test
npm run dev
```

La acción [APK de prueba](.github/workflows/android-apk.yml) compila la versión de Android con Capacitor (debug). La acción [Prueba visual](.github/workflows/ui-visual.yml) revisa la interfaz de escritorio/tableta en navegador.

```bash
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

El ejecutable de depuración aparece en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Alcance técnico y próximos pasos

Los modelos constituyen geometrías paramétricas conceptuales, **no modelos certificados de fabricante**. Aún no hay un núcleo B-Rep para booleanas exactas, detección real de colisiones ni un sistema de restricciones mecánicas completo. Las bridas, grapas y codos deben validarse contra documentación original del fabricante y las normas aplicables antes de fabricar. Los modelos comerciales de terceros no se redistribuyen sin licencia. STL y GLB representan mallas y no equivalen a STEP de fabricación.

Próximos hitos: conexiones con más familias (instrumentación, bombas, soportes personalizados), croquis 2D vinculados a cuerpos 3D, fusión CAD B-Rep, biblioteca industrial verificada, lista de materiales, control de interferencias y actualización Android firmada para producción.

La versión 2D original sigue en `standalone/TrazoTecnico_v1.html`. El editor 3D V4 importa archivos JSON de las versiones anteriores conservando las geometrías; realiza una copia de seguridad antes de modificar un proyecto.
