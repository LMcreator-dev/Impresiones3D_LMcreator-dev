# ATELIER 3D

Web de impresión 3D con tres apartados principales, vistas previas de color, un carrusel de ejemplos y un visor interactivo de modelos.

## Desarrollo local

Requisitos: Node.js 20.19+ o 22.12+ y npm.

```bash
npm install
npm run dev
```

Para generar la versión de publicación:

```bash
npm run build
```

## Estructura del proyecto

```text
public/
  images/       Imágenes principales de Gengar, Mahito y la taza de Monster
  models/       Modelos STL del visor 3D
src/
  ejemplos/     Imágenes adicionales del carrusel
  main.js       Interacciones, colores y visor 3D
  products.json Lista y orden de los modelos del visor
  filament-colors.json Colores disponibles para las vistas previas
  style.css     Estilos del sitio
index.html      Estructura de la página
vite.config.js Configuración de Vite y GitHub Pages
.github/workflows/pages.yml Publicación automática
```

## Actualizar contenido

Añade una imagen a `src/ejemplos/` para incorporarla automáticamente al carrusel. Los archivos compatibles son PNG, JPG, JPEG, WEBP y AVIF. Los nombres de archivo no se muestran en la página.

Para añadir un STL al visor, coloca el archivo en `public/models/` y agrega su nombre, ruta, color y orientación en `src/products.json`. El visor muestra los modelos en el orden de esa lista.

Los colores de filamento se mantienen en `src/filament-colors.json`. El número de WhatsApp se configura en `src/main.js`, en la constante `whatsappNumber`.

El sitio se publica en GitHub Pages mediante el flujo de trabajo de `.github/workflows/`.
