import { fail } from "../utils/response.js";
import { verifyToken } from "../utils/jwt.js";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return fail(res, 401, "访问令牌缺失");
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (_error) {
    return fail(res, 401, "无效的访问令牌");
  }
}
