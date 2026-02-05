---
name: limpieza-de-fuentes-notebooklm
description: Habilidad para identificar y eliminar fuentes irrelevantes en NotebookLM basándose en un objetivo específico. Optimiza el contexto del notebook eliminando "ruido" informativo. Úsala cuando un notebook tenga demasiadas fuentes y necesites filtrar solo las que realmente aportan al proyecto actual.
---

# Limpieza de Fuentes NotebookLM 🧹

Esta habilidad permite refinar tus notebooks de NotebookLM eliminando automáticamente (bajo confirmación) las fuentes que no son relevantes para el objetivo que estás persiguiendo en ese momento.

## Requisitos
- Servidor MCP de NotebookLM configurado.
- Un notebook activo con múltiples fuentes.

## Proceso de Limpieza

Cuando se activa esta habilidad, el agente seguirá estos pasos:

1. **Definición del Objetivo**: Se requiere que el usuario defina qué busca en el notebook (ej: "Solo quiero información sobre recetas de cocina peruana").
2. **Auditoría de Fuentes**: El agente listará todas las fuentes del notebook.
3. **Análisis de Relevancia**:
    - Se analiza el contenido resumido de cada fuente mediante `mcp_notebooklm_source_describe`.
    - Se compara con el objetivo definido.
4. **Propuesta de Eliminación**: El agente presentará una lista de fuentes "candidatas a borrar".
5. **Ejecución**: Solo tras la confirmación explícita (`confirm=True`), se procederá a eliminar las fuentes irrelevantes.

## Ejemplo de Uso
> "Limpia mi notebook de NotebookLM. Mi objetivo es centrarme únicamente en 'Energías Renovables'. Elimina todo lo que hable de combustibles fósiles."

## Herramientas Clave
- `mcp_notebooklm_notebook_get`: Para obtener la lista de IDs de fuentes.
- `mcp_notebooklm_source_describe`: Para entender de qué trata cada fuente sin leerla completa.
- `mcp_notebooklm_source_delete`: Para la limpieza final.

> [!CAUTION]
> La eliminación de fuentes es permanente e irreversible. Asegúrate de revisar la lista de candidatos antes de confirmar el borrado.
