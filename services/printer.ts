import { Order, OrderItem, Printer } from '../types';

// Cola de impresión para evitar diálogos superpuestos
let printQueue: { items: OrderItem[], order: Order, printer: Printer }[] = [];
let isPrinting = false;

/**
 * Agrupa los items de una orden por printer_id (estación)
 */
export const groupItemsByPrinter = (order: Order, printers: Printer[]): Map<string, { items: OrderItem[], printer: Printer }> => {
  const grouped = new Map<string, { items: OrderItem[], printer: Printer }>();

  order.items.forEach(item => {
    const printerId = item.printerId || printers[0]?.id; // Default a primera impresora si no tiene asignada

    if (!grouped.has(printerId)) {
      const printer = printers.find(p => p.id === printerId);
      if (printer) {
        grouped.set(printerId, { items: [], printer });
      }
    }

    grouped.get(printerId)?.items.push(item);
  });

  return grouped;
};

/**
 * Genera el HTML del ticket basado en la configuración, items y tamaño de papel
 */
export const generateTicketHTML = (
  items: OrderItem[],
  order: Order,
  printer: Printer,
  businessName: string = 'Mi Restaurante'
): string => {
  const currentDate = new Date(order.created_at);
  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = currentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const paperWidth = printer.paperWidth;
  const is58mm = paperWidth === '58mm';

  // Calcular subtotal de estos items
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket - ${printer.name}</title>
      <style>
        @media print {
          @page {
            margin: 0;
            size: ${paperWidth} auto;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          width: ${paperWidth};
          margin: 0 auto;
          padding: ${is58mm ? '5mm' : '10mm'};
          font-size: ${is58mm ? '10pt' : '12pt'};
          line-height: 1.4;
        }
        
        .header {
          text-align: center;
          margin-bottom: ${is58mm ? '10px' : '15px'};
          border-bottom: 2px dashed #000;
          padding-bottom: ${is58mm ? '5px' : '10px'};
        }
        
        .business-name {
          font-size: ${is58mm ? '14pt' : '18pt'};
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .station-name {
          font-size: ${is58mm ? '12pt' : '14pt'};
          font-weight: bold;
          background: #000;
          color: #fff;
          padding: 5px;
          margin: 5px 0;
        }
        
        .order-info {
          margin-bottom: ${is58mm ? '10px' : '15px'};
          font-size: ${is58mm ? '9pt' : '11pt'};
        }
        
        .order-info div {
          margin: 3px 0;
        }
        
        .table-number {
          font-size: ${is58mm ? '20pt' : '24pt'};
          font-weight: bold;
          text-align: center;
          margin: ${is58mm ? '8px 0' : '10px 0'};
          padding: ${is58mm ? '8px' : '10px'};
          border: 3px solid #000;
        }
        
        .items {
          margin: ${is58mm ? '10px 0' : '15px 0'};
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: ${is58mm ? '8px 0' : '10px 0'};
        }
        
        .item {
          margin: ${is58mm ? '6px 0' : '8px 0'};
          ${is58mm ? '' : 'display: flex; justify-content: space-between;'}
        }
        
        .item-qty {
          font-weight: bold;
          margin-right: 8px;
        }
        
        .item-name {
          ${is58mm ? 'display: block;' : 'flex: 1;'}
        }
        
        .item-price {
          font-weight: bold;
          white-space: nowrap;
          ${is58mm ? 'display: block; text-align: right; margin-top: 2px;' : 'margin-left: 8px;'}
        }
        
        .item-notes {
          font-size: ${is58mm ? '8pt' : '10pt'};
          font-style: italic;
          margin-left: ${is58mm ? '15px' : '25px'};
          color: #333;
        }
        
        .subtotal {
          font-size: ${is58mm ? '12pt' : '14pt'};
          font-weight: bold;
          text-align: right;
          margin-top: ${is58mm ? '10px' : '15px'};
          padding-top: ${is58mm ? '8px' : '10px'};
          border-top: 2px solid #000;
        }
        
        .footer {
          text-align: center;
          margin-top: ${is58mm ? '15px' : '20px'};
          font-size: ${is58mm ? '8pt' : '10pt'};
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${businessName}</div>
        <div>${printer.ticketConfig.title || 'TICKET DE COCINA'}</div>
      </div>
      
      <div class="station-name">
        📍 ${printer.name.toUpperCase()}
      </div>
      
      <div class="order-info">
        <div><strong>Orden:</strong> #${order.id.slice(0, 8).toUpperCase()}</div>
        ${printer.ticketConfig.showDate ? `<div><strong>Fecha:</strong> ${formattedDate}</div>` : ''}
        <div><strong>Hora:</strong> ${formattedTime}</div>
      </div>
      
      ${printer.ticketConfig.showTable ? `
      <div class="table-number">
        MESA ${order.table_number}
      </div>
      ` : ''}
      
      <div class="items">
        ${items.map(item => `
          <div class="item">
            <span class="item-qty">${item.quantity}x</span>
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
          </div>
          ${item.notes && printer.ticketConfig.showNotes ? `<div class="item-notes">Nota: ${item.notes}</div>` : ''}
        `).join('')}
      </div>
      
      <div class="subtotal">
        SUBTOTAL: $${subtotal.toFixed(2)}
      </div>
      
      <div class="footer">
        ${printer.ticketConfig.footerMessage || 'Powered by MeseroApp'}
      </div>
    </body>
    </html>
  `;
};

/**
 * Imprime un ticket para una estación específica
 */
export const printTicket = async (
  items: OrderItem[],
  order: Order,
  printer: Printer,
  businessName?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const ticketHTML = generateTicketHTML(items, order, printer, businessName);

      // Crear iframe oculto para impresión
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';

      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) {
        throw new Error('No se pudo crear el documento de impresión');
      }

      frameDoc.open();
      frameDoc.write(ticketHTML);
      frameDoc.close();

      // Esperar a que se cargue el contenido
      printFrame.onload = () => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();

          // Limpiar después de imprimir
          setTimeout(() => {
            document.body.removeChild(printFrame);
            resolve();
          }, 100);
        } catch (error) {
          document.body.removeChild(printFrame);
          reject(error);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Imprime una orden completa, separando items por estación
 */
export const printOrder = async (
  order: Order,
  printers: Printer[],
  businessName?: string
): Promise<void> => {
  const groupedItems = groupItemsByPrinter(order, printers);

  // Añadir cada estación a la cola
  groupedItems.forEach(({ items, printer }) => {
    printQueue.push({ items, order, printer });
  });

  // Iniciar procesamiento de cola
  processPrintQueue(businessName);
};

/**
 * Procesa la cola de impresión
 * Imprime un ticket a la vez para evitar diálogos superpuestos
 */
const processPrintQueue = async (businessName?: string): Promise<void> => {
  if (isPrinting || printQueue.length === 0) {
    return;
  }

  isPrinting = true;
  const { items, order, printer } = printQueue.shift()!;

  try {
    await printTicket(items, order, printer, businessName);
  } catch (error) {
    console.error('Error al imprimir ticket:', error);
  } finally {
    isPrinting = false;

    // Si hay más tickets en cola, continuar
    if (printQueue.length > 0) {
      // Pequeño delay para que el usuario cierre el diálogo anterior
      setTimeout(() => processPrintQueue(businessName), 500);
    }
  }
};

/**
 * Imprime múltiples órdenes en secuencia
 */
export const printMultipleOrders = async (
  orders: Order[],
  printers: Printer[],
  businessName?: string
): Promise<void> => {
  for (const order of orders) {
    await printOrder(order, printers, businessName);
  }
};

/**
 * Obtiene el número de tickets pendientes en la cola
 */
export const getPrintQueueLength = (): number => {
  return printQueue.length;
};

/**
 * Limpia la cola de impresión
 */
export const clearPrintQueue = (): void => {
  printQueue = [];
};
