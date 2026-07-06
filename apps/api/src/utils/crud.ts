import { eq, and, desc, asc } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import { db } from "../database/database";

export type CrudFilters = Record<string, unknown>;

function normalizeRows<T>(result: T[] | { rows: T[] }): T[] {
  return Array.isArray(result) ? result : result.rows;
}

export async function createOne<T extends Record<string, unknown>>(table: any, data: T) {
  const rows = await db.insert(table).values(data).returning();
  const [row] = normalizeRows(rows);
  return row;
}

export async function getAll<T>(table: any) {
  return db.select().from(table) as Promise<T[]>;
}

export async function getById<T>(table: any, idColumn: PgColumn, id: number | string) {
  const [row] = await db.select().from(table).where(eq(idColumn, id)).limit(1);
  return row as T | undefined;
}

export async function getByField<T>(table: any, column: PgColumn, value: unknown) {
  const [row] = await db.select().from(table).where(eq(column, value)).limit(1);
  return row as T | undefined;
}

export async function updateById<T extends Record<string, unknown>>(table: any, idColumn: PgColumn, id: number | string, data: Partial<T>) {
  const rows = await db.update(table).set(data).where(eq(idColumn, id)).returning();
  const [row] = normalizeRows(rows);
  return row as T | undefined;
}

export async function deleteById(table: any, idColumn: PgColumn, id: number | string) {
  const rows = await db.delete(table).where(eq(idColumn, id)).returning();
  const [row] = normalizeRows(rows);
  return row;
}

export async function listWithFilters<T>(table: any, filters: CrudFilters = {}, orderByColumn?: PgColumn, order: "asc" | "desc" = "asc") {
  let query = db.select().from(table);

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    query = query.where(eq((table as any)[key], value)) as typeof query;
  }

  if (orderByColumn) {
    query = order === "desc" ? (query.orderBy(desc(orderByColumn)) as typeof query) : (query.orderBy(asc(orderByColumn)) as typeof query);
  }

  return query as Promise<T[]>;
}
