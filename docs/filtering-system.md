# Sistema de Filtros por Query Params

Este documento explica cómo usar el sistema de filtros implementado para todos los endpoints de la API.

## Características

- ✅ Filtros por cualquier atributo de la entidad
- ✅ Ordenamiento (ascendente/descendente)
- ✅ Paginación (limit/offset)
- ✅ Validación automática de query params
- ✅ Compatible con todos los endpoints GET

## Cómo usar los filtros

### Sintaxis básica

```
GET /api/endpoint?campo=valor&campo2=valor2
```

### Ejemplos para Students

```bash
# Filtrar por nombre
GET /students?name=Juan

# Filtrar por nivel
GET /students?level=Advanced

# Filtrar por múltiples campos
GET /students?name=Juan&level=Initial&victory_count=5

# Con ordenamiento
GET /students?name=Juan&ordercol=matches_count&asc=true

# Con paginación
GET /students?limit=10&offset=20

# Combinando todo
GET /students?level=Advanced&ordercol=victory_count&asc=false&limit=5&offset=10
```

### Ejemplos para Members

```bash
# Filtrar por rol
GET /members?role=President

# Filtrar por estado activo
GET /members?active=true

# Filtrar por email
GET /members?email=president@acm.com

# Con ordenamiento por fecha de ingreso
GET /members?active=true&ordercol=memberSince&asc=false
```

### Ejemplos para Contests

```bash
# Filtrar por nivel
GET /contests?level=Initial

# Filtrar por aula
GET /contests?classroom=A101

# Filtrar por fecha (formato ISO)
GET /contests?date=2024-01-15
```

## Parámetros de ordenamiento

- `ordercol`: Columna principal para ordenar
- `subordercol`: Columna secundaria para ordenar
- `asc`: Orden ascendente (true/false, 1/0)
- `subasc`: Orden ascendente para columna secundaria (true/false, 1/0)

## Parámetros de paginación

- `limit`: Número máximo de registros a retornar
- `offset`: Número de registros a saltar (para paginación)

## Tipos de datos soportados

### Strings
```bash
GET /students?name=Juan
GET /members?role=President
```

### Numbers
```bash
GET /students?matches_count=10
GET /students?victory_count=5
```

### Booleans
```bash
GET /members?active=true
GET /members?active=false
```

### Enums
```bash
GET /students?level=Advanced
GET /students?level=Initial
```

### Dates (ISO strings)
```bash
GET /contests?date=2024-01-15T00:00:00Z
```
