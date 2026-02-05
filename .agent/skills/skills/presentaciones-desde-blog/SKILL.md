---
name: presentaciones-desde-blog
description: Habilidad para transformar entradas de blog o artículos en presentaciones visuales de Google Slides. Utiliza NotebookLM para analizar el contenido y generar diapositivas estructuradas y profesionales. Úsala cuando necesites crear material visual a partir de contenido escrito de forma automatizada.
---

# Presentaciones desde Blog 📊

Esta habilidad permite convertir contenido textual complejo (como posts de blogs o artículos) en presentaciones de Google Slides detalladas y visualmente atractivas utilizando la potencia de NotebookLM.

## Requisitos
- Contar con el servidor MCP de NotebookLM configurado y autenticado.

## Flujo de Uso Sugerido

Para obtener los mejores resultados, sigue este proceso:

1. **Captura del Contenido**: Obtén la URL o el texto completo del post del blog.
2. **Creación del Notebook**: Crea un nuevo notebook con un título relevante.
3. **Adición de Fuente**: Añade la URL o el texto como fuente primaria en el notebook.
4. **Generación de Slides**: Ejecuta la creación de diapositivas con el formato deseado.

## Herramientas Utilizadas (NotebookLM MCP)

Esta habilidad aprovecha internamente:
- `mcp_notebooklm_notebook_create`: Para iniciar el proyecto.
- `mcp_notebooklm_notebook_add_url` / `add_text`: Para importar el contenido.
- `mcp_notebooklm_slide_deck_create`: Para la generación final de las diapositivas.

## Formatos de Presentación Disponibles
- **detailed_deck**: Una presentación completa y exhaustiva del contenido.
- **presenter_slides**: Diapositivas diseñadas específicamente para apoyar una exposición oral (más visuales, menos texto).

## Ejemplo de Instrucción al Agente
> "Usa tu habilidad de Presentaciones desde Blog para crear una presentación de tipo 'presenter_slides' basada en este artículo: [URL del Blog]. Haz que sea visualmente impactante."

> [!IMPORTANT]
> La generación de diapositivas requiere una confirmación final (`confirm=True`) que el agente solicitará tras mostrar el plan inicial.
