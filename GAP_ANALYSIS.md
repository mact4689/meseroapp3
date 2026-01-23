
# 🔍 GAP ANALYSIS - MeseroApp3

Este documento simula 3 escenarios reales de uso extremo para identificar funcionalidades fatantes en **MeseroApp3**.

---

## 🎭 Escenario 1: Viernes Noche (Caos Operativo)
**Contexto:** El restaurante está lleno. Hay 5 órdenes pendientes. Los meseros corren. El dueño está atendiendo la caja.

### 🏃‍♂️ Recorrido del Usuario (User Journey)
1.  **Llega una orden con instrucciones raras:** "Hamburguesa sin cebolla, extra queso, pan tostado".
    *   **Estado Actual:** `OrderItem` tiene `notes`. La UI de `CustomerMenu` ¿permite escribir notas? **Riesgo: NO VEO CAMPO DE NOTAS EN EL MODAL DE CARRITO.**
2.  **El cliente se equivocó de mesa:** Escaneó el QR de la mesa 4 pero se sentó en la 5.
    *   **Estado Actual:** La orden llega como Mesa 4. El mesero lleva la comida a la mesa vacía.
    *   **GAP DETECTADO (CRÍTICO):** No hay forma de "Editar Mesa" en una orden activa en el Dashboard.
3.  **Se acabó la Coca-Cola a mitad de la noche:**
    *   **Estado Actual:** Tienes el botón `sold_out` (¡Bien hecho!). **Pasa prueba.**
4.  **Cocina está saturada:** El chef grita "¡No manden más órdenes por 10 minutos!".
    *   **Estado Actual:** No hay forma de "Pausar la Tienda" o poner un aviso de "Demora de 30 min".
    *   **GAP DETECTADO (MEDIO):** Falta status global del restaurante: "Abierto", "Cerrado", "Ocupado".

---

## 🧐 Escenario 2: El Cliente Exigente
**Contexto:** Un cliente vegano quiere asegurarse de que no haya contaminación cruzada.

### 🛒 Recorrido del Cliente
1.  **Quiere filtrar el menú**: Solo ver cosas "Vegetarianas".
    *   **Estado Actual:** Solo hay categorías (Entradas, Bebidas). No hay sistema de "Tags" o "Filtros de Dieta".
    *   **GAP DETECTADO (OPCIONAL):** Sistema de etiquetas (Picante, Vegano, Gluten Free).
2.  **Quiere pagar desde el celular**: "No tengo efectivo".
    *   **Estado Actual:** No hay integración de pagos. La orden solo llega al Dashboard.
    *   **GAP DETECTADO (FUTURO):** Integración Stripe/MercadoPago o al menos opción "Solicitar Cuenta" con método de pago (Efectivo/Tarjeta).

---

## 💼 Escenario 3: El Corte de Caja (Dueño)
**Contexto:** Fin del día. El dueño quiere saber cuánto dinero hay en el cajón.

### 📊 Recorrido del Admin
1.  **Revisar el total del día**:
    *   **Estado Actual:** El Dashboard muestra `$ Ventas Hoy` y `Órdenes Completadas`. **Pasa prueba básica.**
2.  **Limpiar para mañana**:
    *   **Estado Actual:** ¿Qué pasa con las órdenes "Completadas"? Se quedan ahí eternamente sumando al total del Dashboard.
    *   **GAP DETECTADO (CRÍTICO):** No hay botón de "Cierre de Caja" o "Reiniciar Día" que archive las órdenes de hoy y ponga el contador a cero. Mañana el dashboard seguirá sumando lo de ayer.

---

## 📋 Resumen de GAPs Detectados

### 🚨 Prioridad Alta (Operativo Crítico)
1.  **Notas del Cliente**: Añadir `textarea` en `ProductDetailModal` para "Sin cebolla", etc.
2.  **Cierre de Caja / Reset Diario**: El Dashboard necesita filtrar órdenes por FECHA (solo mostrar `created_at` === Hoy) o tener un botón manual de cierre.
3.  **Editar Orden Activa**: Poder cambiar el número de mesa en el Dashboard si hubo error.

### ⚠️ Prioridad Media (Calidad de Vida)
4.  **Estado del Restaurante**: Botón en Dashboard para cambiar estado (Abierto/Cerrado/Pausado).
5.  **Solicitar Cuenta**: Botón en `CustomerMenu` para pedir la cuenta sin pedir más comida.

### 💡 Prioridad Baja (Mejoras Futuras)
6.  **Filtros de Dieta**: Tags en los productos.
7.  **Propinas**: Sugerencia de propina en el carrito.

---

## 🛠️ Acción Recomendada Inmediata
Implementar **Notas del Cliente** (Punto 1) y **Filtrado Diario en Dashboard** (Punto 2). Son los bloqueantes más grandes para un día real de uso.
