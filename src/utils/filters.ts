import { Context } from "elysia";
import {
  StudentFilterSchema,
  MemberFilterSchema,
  ContestFilterSchema,
  ActivityFilterSchema,
  PictureFilterSchema,
  ResultFilterSchema,
  ParticipationFilterSchema,
} from "./filter-schemas";

export interface FilterOptions {
  filters: Record<string, any>;
  order?: {
    column: string;
    asc?: boolean;
  };
  suborder?: {
    column: string;
    asc?: boolean;
  };
  limit?: number;
  offset?: number;
}

export const ENTITY_FILTER_SCHEMAS = {
  student: StudentFilterSchema,
  members: MemberFilterSchema,
  contest: ContestFilterSchema,
  activities: ActivityFilterSchema,
  picture: PictureFilterSchema,
  results: ResultFilterSchema,
  participation: ParticipationFilterSchema,
} as const;

/**
 * Extrae filtros de query params de manera dinámica basándose en el schema de la entidad
 * @param context Contexto de Elysia
 * @param entityName Nombre de la entidad (debe coincidir con las claves en ENTITY_FILTER_SCHEMAS)
 * @returns Objeto con filtros, ordenamiento y paginación
 */
export const getEntityFilters = (
  context: Context,
  entityName: keyof typeof ENTITY_FILTER_SCHEMAS,
): FilterOptions => {
  const url = new URL(context.request.url);
  const searchParams = url.searchParams;

  const filters: Record<string, any> = {};

  const entitySchema = ENTITY_FILTER_SCHEMAS[entityName];
  if (!entitySchema) {
    throw new Error(`Schema no encontrado para la entidad: ${entityName}`);
  }

  // Extraer todos los campos del schema excepto los de paginación y ordenamiento
  const schemaFields = Object.keys(entitySchema.properties || {});
  const filterFields = schemaFields.filter(
    (field) =>
      !["limit", "offset", "ordercol", "subordercol", "asc", "subasc"].includes(
        field,
      ),
  );

  // Extraer filtros específicos de la entidad
  filterFields.forEach((filterName) => {
    const value = searchParams.get(filterName);
    if (value !== null) {
      // Intentar convertir a número si es posible
      const numValue = Number(value);
      if (!isNaN(numValue) && value !== "") {
        filters[filterName] = numValue;
      } else if (value.toLowerCase() === "true") {
        filters[filterName] = true;
      } else if (value.toLowerCase() === "false") {
        filters[filterName] = false;
      } else {
        filters[filterName] = value;
      }
    }
  });

  // Extraer parámetros de ordenamiento y paginación
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const offsetParam = searchParams.get("offset");
  const offset = offsetParam ? Number(offsetParam) : undefined;

  const ordercolParam = searchParams.get("ordercol");
  const ordercol = ordercolParam || undefined;

  const subordercolParam = searchParams.get("subordercol");
  const subordercol = subordercolParam || undefined;

  const ascParam = searchParams.get("asc");
  const asc = ascParam === "1" || ascParam === "true";

  const subascParam = searchParams.get("subasc");
  const subasc = subascParam === "1" || subascParam === "true";

  return {
    filters,
    order: ordercol
      ? {
          column: ordercol,
          asc,
        }
      : undefined,
    suborder: subordercol
      ? {
          column: subordercol,
          asc: subasc,
        }
      : undefined,
    limit,
    offset,
  };
};
