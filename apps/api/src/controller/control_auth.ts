import { Hono } from "hono";

import { admin_users } from "../database/schemas/admin_users";
import { audit_logs } from "../database/schemas/audit_logs";

import { getByField, createOne } from "../utils/crud";

import { decrypt } from "../utils/crypting";
import { createToken } from "../utils/jwt";

import {
  sanitizeLogin,
  LoginResponseDto,
} from "../dto/authDTO";

import { authMiddleware } from "../middleware/auth";
import type { Variables } from "../types/hono";


const authController = new Hono<{
  Variables: Variables;
}>();
/**
 * ===========================================
 * LOGIN
 * POST /auth/login
 * ===========================================
 */
authController.post("/login", async (c) => {
  try {
    const body = await c.req.json();

    const payload = sanitizeLogin(body);

    if (!payload) {
      return c.json(
        {
          error: "Email and password are required",
        },
        400
      );
    }

    /**
     * Buscar usuario por email
     */
    const user = await getByField<any>(
      admin_users,
      admin_users.email_admin_users,
      payload.email_admin_users
    );

    if (!user) {
      return c.json(
        {
          error: "Invalid credentials",
        },
        401
      );
    }

    /**
     * Validar usuario activo
     */
    if (!user.active) {
      return c.json(
        {
          error: "User is inactive",
        },
        403
      );
    }

    /**
     * Comparar contraseña
     */
    let password = "";

    try {
      password = decrypt(user.password_admin_users);
    } catch {
      return c.json(
        {
          error: "Password validation failed",
        },
        500
      );
    }

    if (password !== payload.password_admin_users) {
      return c.json(
        {
          error: "Invalid credentials",
        },
        401
      );
    }

    /**
     * Crear JWT
     */
    const token = createToken({
      id_admin_users: user.id_admin_users,
      name_admin_users: user.name_admin_users,
      email_admin_users: user.email_admin_users,
    });

    /**
     * Registrar LOGIN
     */
    await createOne(audit_logs, {
      action_audit_logs: "LOGIN",
      id_admin_users: user.id_admin_users,
    });

    const response: LoginResponseDto = {
      token,
      user: {
        id_admin_users: user.id_admin_users,
        name_admin_users: user.name_admin_users,
        email_admin_users: user.email_admin_users,
      },
    };

    return c.json(response, 200);
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Internal server error",
      },
      500
    );
  }
});

/**
 * ===========================================
 * LOGOUT
 * POST /auth/logout
 * ===========================================
 */
authController.post("/logout", authMiddleware, async (c) => {
  try {
    const user = c.get("user") as {
      id_admin_users: number;
    };

    await createOne(audit_logs, {
      action_audit_logs: "LOGOUT",
      id_admin_users: user.id_admin_users,
    });

    return c.json(
      {
        success: true,
      },
      200
    );
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Internal server error",
      },
      500
    );
  }
});

/**
 * ===========================================
 * CURRENT USER
 * GET /auth/me
 * ===========================================
 */
authController.get("/me", authMiddleware, async (c) => {
  try {
    const tokenUser = c.get("user") as {
      id_admin_users: number;
    };

    const user = await getByField<any>(
      admin_users,
      admin_users.id_admin_users,
      tokenUser.id_admin_users
    );

    if (!user) {
      return c.json(
        {
          error: "User not found",
        },
        404
      );
    }

    return c.json(
      {
        id_admin_users: user.id_admin_users,
        name_admin_users: user.name_admin_users,
        email_admin_users: user.email_admin_users,
        active: user.active,
      },
      200
    );
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Internal server error",
      },
      500
    );
  }
});

export { authController };