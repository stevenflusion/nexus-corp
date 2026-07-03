import { Hono } from "hono";
import { admin_users } from "../database/schemas/admin_users";
import { createOne, getAll, getById, updateById, deleteById } from "../utils/crud";
import {
  Admin_userDTOResponseDto,
  Admin_userDTOCreateDto,
  Admin_userDTOUpdateDto,
  sanitizeAdmin_userDTOCreate,
  sanitizeAdmin_userDTOUpdate,
} from "../dto/admin_users_dto";

import {encrypt, decrypt} from "../utils/crypting";

const admin_usersController = new Hono();

admin_usersController.get("/", async (c) => {
  // 1. Obtener los usuarios de la base de datos
  const users = await getAll<any>(admin_users);

  // 2. Recorrer el array y desencriptar el campo de la clave en cada uno
  const decryptedUsers = users.map((user) => {
    // Hacemos una copia para no mutar directamente si no es necesario
    const cleanUser = { ...user }; 

    // Reemplaza 'password_admin_users' por el nombre exacto de la columna en tu esquema
    if (cleanUser.password_admin_users) {
      try {
        cleanUser.password_admin_users = decrypt(cleanUser.password_admin_users);
      } catch (error) {
        // Por si hay alguna clave vieja mal encriptada que rompa el método decrypt
        cleanUser.password_admin_users = "ERROR_DECRYPTION"; 
      }
    }

    return cleanUser as Admin_userDTOResponseDto;
  });

  // 3. Retornar el array con las claves ya legibles
  return c.json(decryptedUsers);
});
admin_usersController.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const user = await getById<Admin_userDTOResponseDto>(admin_users, admin_users.id_admin_users, id);

  if (!user) {
    return c.json({ error: "Admin user not found" }, 404);
  }

  return c.json(user);
});

admin_usersController.post("/", async (c) => {
  const body = await c.req.json();
  const payload = sanitizeAdmin_userDTOCreate(body);

  if (!payload) {
    return c.json({ error: "name, email and password are required" }, 400);
  }

  const password = payload.password_admin_users;
  if (typeof password !== "string" || password.length === 0) {
    return c.json({ error: "name, email and password are required" }, 400);
  }

  payload.password_admin_users = encrypt(password);

  const created = await createOne<Admin_userDTOCreateDto>(admin_users, payload);
  const response: Admin_userDTOResponseDto = {
    
    name_admin_users: created.name_admin_users,
    email_admin_users: created.email_admin_users,
    password_admin_users: created.password_admin_users,
    active: created.active,
  };

  return c.json(response, 201);
});

admin_usersController.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const payload = sanitizeAdmin_userDTOUpdate(body);

  if (Object.keys(payload).length === 0) {
    return c.json({ error: "No update fields provided" }, 400);
  }

  if (payload.password_admin_users) {
    payload.password_admin_users = encrypt(payload.password_admin_users);
  }

  const updatedRows = await updateById<Admin_userDTOUpdateDto>(
    admin_users, 
    admin_users.id_admin_users, 
    id, 
    payload
  );


  const updated = updatedRows as Admin_userDTOResponseDto;

  const response: Admin_userDTOResponseDto = {
    name_admin_users: updated.name_admin_users,
    email_admin_users: updated.email_admin_users,
    password_admin_users: updated.password_admin_users,
    active: updated.active,
  };

  return c.json(response);
});

admin_usersController.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await deleteById(admin_users, admin_users.id_admin_users, id);

  if (!deleted) {
    return c.json({ error: "Admin user not found" }, 404);
  }

  return c.json({ success: true });
});

export { admin_usersController };
