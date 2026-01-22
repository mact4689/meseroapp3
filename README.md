
# MeseroApp - Sistema Integral Unificado

Este repositorio es el **núcleo único** de MeseroApp. Contiene tanto la lógica del administrador como la del cliente en un solo proyecto de React.

## 💡 ¿Por qué un solo repositorio?

- **Mantenimiento fácil**: Si cambias el logo en la base de datos, se actualiza en ambas interfaces al mismo tiempo.
- **Despliegue rápido**: Solo subes una carpeta `dist` a Hostinger.
- **Sincronización total**: Ambas interfaces comparten el mismo archivo de conexión a Supabase (`services/client.ts`).

## 🛠️ Estructura de Vistas (`/views`)

1.  **Administrador**: `Dashboard.tsx`, `MenuSetup.tsx`, `TableSetup.tsx`.
2.  **Cliente (Menú)**: `CustomerMenu.tsx`.

## 🔗 Funcionamiento de las URLs

La aplicación utiliza **Query Parameters** para decidir qué mostrar:

- **Panel Admin**: `https://tu-dominio.com/`
- **Menú Cliente**: `https://tu-dominio.com/?table=NUM_MESA&uid=ID_RESTAURANTE`

*Nota: Los códigos QR generados en la sección de Mesas ya incluyen este formato automáticamente.*

## 🚀 Despliegue en Hostinger

1.  Genera la carpeta de producción: `npm run build`.
2.  Sube el contenido de `dist/` a tu `public_html`.
3.  Asegúrate de incluir el archivo `.htaccess` para que las rutas internas de React funcionen.
