# Trazo Técnico 2D

Aplicación web de dibujo técnico **2D** orientada a bocetos y planos conceptuales de ingeniería mecánica, tuberías y soportes. Se puede utilizar sin instalar software adicional.

## Cómo utilizarla

1. Abre **index.html** en un navegador moderno (Chrome, Edge o Firefox) o utiliza la versión autónoma en **standalone/TrazoTecnico_v1.html**.
2. Selecciona herramientas de dibujo o componentes precargados en el panel lateral.
3. Dibuja sobre el lienzo, selecciona las piezas y modifica sus dimensiones desde el panel de propiedades.
4. Guarda una copia del proyecto en **JSON** para poder editarla en otra sesión.
5. Exporta el plano en SVG o PNG. Para generar PDF utiliza la opción **Imprimir / Guardar PDF** del navegador.

## Funciones de la versión 1

- Editor vectorial 2D SVG con cuadrícula, zoom, desplazamiento y ajuste a la cuadrícula.
- Líneas, tuberías, rectángulos, círculos/elipses, texto y cotas.
- Componentes prediseñados: grapa tipo U, grapa omega, codo, conexión T, brida, válvula, soporte, bomba, tanque, perno y placa perforada.
- Modificación de coordenadas, tamaños, orientación, color y unidades (mm, cm, m y pulgadas).
- Deshacer y rehacer, duplicar y eliminar elementos.
- Modelos de muestra: soporte de tubería, línea de proceso y caja de almacenamiento.
- Autoguardado local cuando el navegador lo permite.

## Estructura

```text
index.html                          # Entrada principal de la aplicación web
src/
  app.js                            # Lógica de dibujo y componentes, versión 1
  styles.css                        # Diseño visual adaptable
standalone/
  TrazoTecnico_v1.html              # Copia íntegra y autónoma de la versión 1
.github/workflows/
  validar.yml                       # Revisión sintáctica automática del código JS
package.json                        # Comando de validación
```

La separación de HTML, JavaScript y CSS es el primer paso hacia una arquitectura modular. **El motor del editor todavía está concentrado en `src/app.js`** y conviene dividirlo en módulos en próximas versiones, con pruebas funcionales de navegador antes de avanzar.

## Validación local

Con Node.js instalado:

```bash
npm run check
```

No se requieren paquetes npm ni servicios remotos para la versión 1.

## Próximos desarrollos

1. Precisión geométrica: referencias a extremos, centros e intersecciones; ángulos y acotación más completa.
2. Biblioteca parametrizable de tuberías, bridas, soportes y grapas.
3. Capas, selección múltiple, agrupación y herramientas de alineación.
4. Formatos de impresión A4/A3 y exportación DXF.
5. Compilación como aplicación de escritorio para Windows, tras la estabilización de los módulos.

## Alcance y precauciones

Esta aplicación es una herramienta de **bocetos y diseño conceptual**. Sus dimensiones y símbolos no sustituyen cálculos mecánicos, revisión normativa ni planos certificados para fabricación o montaje. **Las exportaciones no se deben asumir como equivalentes a archivos CAD de fabricación sin validación adicional.**

La aplicación no usa un servidor para guardar dibujos. El autoguardado se conserva únicamente en el navegador y dispositivo donde se hizo; guarda copias JSON para evitar perder tus proyectos.
