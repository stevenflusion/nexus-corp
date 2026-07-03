import type { InferModel } from "drizzle-orm";
import { admin_users } from "../database/schemas/admin_users";

export type Admin_userDTO = InferModel<typeof admin_users>;

export type Admin_userDTOCreateDto = Omit<Admin_userDTO, "id_admin_users" | "createdAt"> & {
  active?: boolean;
};

export type Admin_userDTOUpdateDto = Partial<Admin_userDTOCreateDto>;

export type Admin_userDTOResponseDto = Pick<Admin_userDTO,  "name_admin_users" | "email_admin_users" | "password_admin_users" | "active">;

export function sanitizeAdmin_userDTOCreate(body: unknown): Admin_userDTOCreateDto | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  const name_admin_users = typeof payload.name_admin_users === "string" ? payload.name_admin_users.trim() : "";
  const email_admin_users = typeof payload.email_admin_users === "string" ? payload.email_admin_users.trim() : "";
  const password_admin_users = typeof payload.password_admin_users === "string" ? payload.password_admin_users : "";
  const active = payload.active === false ? false : true;

  if (!name_admin_users || !email_admin_users || !password_admin_users) {
    return null;
  }

  return {
    name_admin_users,
    email_admin_users,
    password_admin_users,
    active,
  };
}

export function sanitizeAdmin_userDTOUpdate(body: unknown): Admin_userDTOUpdateDto {
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const updated: Admin_userDTOUpdateDto = {};

  if (typeof payload.name_admin_users === "string") {
    updated.name_admin_users = payload.name_admin_users.trim();
  }

  if (typeof payload.email_admin_users === "string") {
    updated.email_admin_users = payload.email_admin_users.trim();
  }

  if (typeof payload.password_admin_users === "string") {
    updated.password_admin_users = payload.password_admin_users;
  }

  if (payload.active !== undefined) {
    updated.active = Boolean(payload.active);
  }

  return updated;
}
