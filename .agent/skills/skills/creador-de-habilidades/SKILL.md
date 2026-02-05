---
name: creador-de-habilidades
description: Habilidad especializada en la creación de nuevas habilidades para Antigravity. Proporciona guías, estructuras de carpetas y plantillas en español para expandir las capacidades del sistema. Úsala cuando necesites crear una nueva habilidad desde cero o mejorar una existente.
---

# Creador de Habilidades 🛠️

Esta habilidad te guía en el proceso de creación de nuevas habilidades para Antigravity, asegurando que sigan los estándares oficiales y sean efectivas.

## Estructura de una Habilidad

Cada habilidad debe residir en su propia carpeta dentro de `.agent/skills/skills/` y contener al menos un archivo `SKILL.md`.

```text
nombre-de-la-habilidad/
├── SKILL.md            # Instrucciones y metadatos (obligatorio)
├── scripts/            # Scripts de automatización (opcional)
├── examples/           # Ejemplos de uso (opcional)
└── resources/          # Archivos adicionales (opcional)
```

## Formato de `SKILL.md`

El archivo `SKILL.md` debe comenzar con un bloque YAML de metadatos:

```markdown
---
name: nombre-de-la-habilidad
description: Descripción concisa de lo que hace la habilidad y cuándo usarla.
---

# Título de la Habilidad

Descripción detallada...

## Capacidades Core
- Lista de funciones principales.
```

## Instrucciones para Crear una Habilidad

1. **Definir el Propósito**: ¿Qué problema resuelve esta habilidad?
2. **Estructura de Carpetas**: Crea la carpeta en `.agent/skills/skills/`.
3. **Redactar SKILL.md**: Define el nombre, descripción y las instrucciones detalladas.
4. **Scripts (Opcional)**: Si la habilidad requiere herramientas externas, añádelas en `scripts/`.
5. **Validación**: Verifica que el agente pueda leer y entender la nueva habilidad.

## Plantilla Base (Español)

Usa esta estructura para tus nuevas habilidades:

```markdown
---
name: [identificador-unico]
description: [Descripción para el sistema]
---

# [Nombre Legible]

[Introducción sobre la habilidad]

## Cuándo Usar
- Caso de uso 1
- Caso de uso 2

## Instrucciones de Uso
1. Paso uno
2. Paso dos

## Mejores Prácticas
- Consejo 1
- Consejo 2
```

> [!TIP]
> Mantén las descripciones en los metadatos claras y concisas, ya que el sistema las usa para decidir qué habilidad activar.
