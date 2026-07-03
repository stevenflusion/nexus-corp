import { createMiddleware } from "hono/factory";
import { verifyToken } from "../utils/jwt";
import { Variables } from "../types/hono";

export const authMiddleware = createMiddleware<{Variables: Variables;}>(async (c, next) => {
  const authorization = c.req.header("Authorization");

  if (!authorization) {
    return c.json(
      {
        error: "Authorization header missing",
      },
      401
    );
  }

  if (!authorization.startsWith("Bearer ")) {
    return c.json(
      {
        error: "Invalid authorization header",
      },
      401
    );
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const user = verifyToken(token);

    c.set("user", user);

    await next();
  } catch {
    return c.json(
      {
        error: "Invalid or expired token",
      },
      401
    );
  }
});