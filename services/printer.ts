import { Order, OrderItem, TicketConfig } from '../types';

// Cola de impresión para evitar diálogos superpuestos
let printQueue: { items: OrderItem[], order: Order, config: TicketConfig }[] = [];
let isPrinting = false;

/**
 * Genera el HTML del ticket basado en la configuración, items y tamaño de papel
 */
export const generateTicketHTML = (
  items: OrderItem[],
  order: Order,
  config: TicketConfig,
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

  const paperWidth = config.paperWidth;
  const is58mm = paperWidth === '58mm';

  // Calcular subtotal de estos items
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket</title>
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
          font-size: ${config.textSize === 'large' ? '14pt' : (is58mm ? '10pt' : '12pt')};
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
        
        .ticket-title {
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
        <div class="ticket-title">${config.title || 'TICKET DE ORDEN'}</div>
      </div>
      
      <div class="order-info">
        ${config.showOrderNumber ? `<div><strong>Orden:</strong> #${order.id.slice(0, 8).toUpperCase()}</div>` : ''}
        ${config.showDate ? `<div><strong>Fecha:</strong> ${formattedDate}</div>` : ''}
        <div><strong>Hora:</strong> ${formattedTime}</div>
      </div>
      
      ${config.showTable ? `
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
          ${item.notes && config.showNotes ? `<div class="item-notes">Nota: ${item.notes}</div>` : ''}
        `).join('')}
      </div>
      
      <div class="subtotal">
        TOTAL: $${subtotal.toFixed(2)}
      </div>
      
      <div class="footer">
        ${config.footerMessage || 'Gracias por su preferencia'}
      </div>
    </body>
    </html>
  `;
};

/**
 * Imprime un ticket usando window.print()
 */
export const printTicket = async (
  items: OrderItem[],
  order: Order,
  config: TicketConfig,
  businessName?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const ticketHTML = generateTicketHTML(items, order, config, businessName);

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
 * Imprime una orden completa usando la configuración global
 */
export const printOrder = async (
  order: Order,
  config: TicketConfig,
  businessName?: string
): Promise<void> => {
  printQueue.push({ items: order.items, order, config });

  if (!isPrinting) {
    await processPrintQueue(businessName);
  }
};

/**
 * Procesa la cola de impresión secuencialmente
 */
const processPrintQueue = async (businessName?: string): Promise<void> => {
  if (printQueue.length === 0) {
    isPrinting = false;
    return;
  }

  isPrinting = true;
  const { items, order, config } = printQueue.shift()!;

  try {
    await printTicket(items, order, config, businessName);
    // Pequeño delay entre impresiones para evitar problemas
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Error printing:', error);
  }

  // Continuar con el siguiente ticket en la cola
  await processPrintQueue(businessName);
};

/**
 * Imprime múltiples órdenes de forma secuencial
 */
export const printMultipleOrders = async (
  orders: Order[],
  config: TicketConfig,
  businessName?: string
): Promise<void> => {
  for (const order of orders) {
    await printOrder(order, config, businessName);
  }
};
