# ATELIER 3D — starter para GitHub Pages

Web de catálogo de impresión 3D con estética barroca contemporánea, visor Three.js y encargos por WhatsApp.

## Requisitos
- Node.js 20.19+ o 22.12+
- npm

## Ejecutar en local
```bash
npm install
npm run dev
```

## Personalización obligatoria antes de publicar
1. Abre `src/main.js` y cambia `whatsappNumber` por tu número en formato internacional, sin `+`, espacios ni guiones. Ejemplo: `346XXXXXXXX`.
2. En GitHub: Settings → Pages → Build and deployment → selecciona **GitHub Actions**.
3. Sube el proyecto a la rama `main`. El workflow compilará y publicará la web automáticamente en [lmcreator-dev.github.io/Impresiones3D_LMcreator-dev](https://lmcreator-dev.github.io/Impresiones3D_LMcreator-dev/).

## Añadir productos
Edita `src/products.json` y añade un objeto con estos campos:
```json
{
  "id": "nombre-unico",
  "name": "Nombre visible",
  "category": "figuras",
  "tag": "FIGURA · COLECCIÓN",
  "price": "Desde 10 €",
  "description": "Descripción breve.",
  "model": "models/mi-figura.stl",
  "shape": "totem",
  "color": "#9a765e"
}
```
Categorías: `figuras`, `decoracion`, `funcional`.
Formatos de visor: `.stl` y `.3mf`. Guarda los archivos dentro de `public/models/` y utiliza rutas relativas como `models/archivo.stl`.

Si `model` está vacío, el visor muestra una forma 3D de demostración generada en el navegador. Las miniaturas actuales son ilustraciones CSS temporales: sustitúyelas por fotografías/renderizados de tus piezas cuando los tengas.

## Límites de esta primera versión
- Los encargos se envían por WhatsApp; no hay pagos ni carrito.
- La sección de opiniones es una invitación a compartir experiencia por WhatsApp. Los comentarios públicos persistentes y moderación requieren backend (por ejemplo Supabase), que no se incluye todavía.
- Los precios son orientativos de muestra: cámbialos antes de publicar.
- Los modelos alojados en `public/` son descargables por los visitantes. No subas STL privados si no quieres distribuirlos.
