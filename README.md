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

## Estructura

- `public/images/`: imágenes principales de Gengar, Mahito y la taza de Monster.
- `public/models/`: modelos STL disponibles en el visor 3D.
- `src/ejemplos/`: imágenes que se cargan automáticamente en el carrusel.
- `src/products.json`: orden, nombre, modelo, color y orientación de cada STL del visor.
- `src/main.js`: carruseles, selectores de filamento y visor 3D.
- `src/style.css`: estilos del sitio.

## Actualizar contenido

Añade una imagen a `src/ejemplos/` para incorporarla al carrusel. Los archivos compatibles son PNG, JPG, JPEG, WEBP y AVIF.

Para añadir un STL al visor, coloca el archivo en `public/models/` y agrega su nombre, ruta, color y orientación en `src/products.json`. El visor muestra los modelos en el orden de esa lista.

El número de WhatsApp se configura en `src/main.js`, en la constante `whatsappNumber`.

El sitio se publica en GitHub Pages mediante el flujo de trabajo de `.github/workflows/`.
