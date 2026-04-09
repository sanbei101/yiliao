import * as authService from "../services/auth.service.js";
import { fail, ok } from "../utils/response.js";

export async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    return ok(res, result, "登录成功");
  } catch (error) {
    return fail(res, error.status || 500, error.message || "服务器内部错误");
  }
}

export async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    return ok(res, result, "注册成功", 201);
  } catch (error) {
    return fail(res, error.status || 500, error.message || "服务器内部错误");
  }
}

export async function getProfile(req, res) {
  try {
    const result = await authService.getProfile(req.user.userId);
    return ok(res, result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || "服务器内部错误");
  }
}

export async function updateProfile(req, res) {
  try {
    const result = await authService.updateProfile(req.user.userId, req.body);
    return ok(res, result, "个人资料更新成功");
  } catch (error) {
    return fail(res, error.status || 500, error.message || "服务器内部错误");
  }
}

export async function changePassword(req, res) {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    return ok(res, result, "密码修改成功");
  } catch (error) {
    return fail(res, error.status || 500, error.message || "服务器内部错误");
  }
}
