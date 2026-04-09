import bcrypt from "bcryptjs";

import { pool } from "../config/db.js";
import { signToken } from "../utils/jwt.js";

function appError(status, message) {
  return { status, message };
}

function normalizeUser(user) {
  return {
    id: user.id,
    account: user.account,
    user_name: user.user_name,
    role: user.role,
    gender: user.gender || undefined,
    phone: user.phone || undefined,
    age: user.age ?? undefined,
    created_at: user.created_at || undefined,
  };
}

export async function login(payload) {
  const account = String(payload.account || "").trim();
  const password = String(payload.password || "");

  if (!account || !password) {
    throw appError(400, "账号和密码不能为空");
  }

  const [rows] = await pool.execute(
    `SELECT id, account, password_hash, user_name, role, gender, phone, age, status
     FROM users
     WHERE account = ?
     LIMIT 1`,
    [account],
  );

  const user = rows[0];
  if (!user || user.status !== 1) {
    throw appError(401, "账号不存在或已禁用");
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    throw appError(401, "密码错误");
  }

  return {
    token: signToken(user),
    user: normalizeUser(user),
  };
}

export async function register(payload) {
  const account = String(payload.account || "").trim();
  const password = String(payload.password || "");
  const userName = String(payload.user_name || payload.userName || "").trim();
  const role = String(payload.role || "").trim();

  if (!account || !password || !userName || !role) {
    throw appError(400, "账号、密码、姓名和角色不能为空");
  }

  if (!["elder", "child", "admin"].includes(role)) {
    throw appError(400, "角色无效");
  }

  const [existingRows] = await pool.execute("SELECT id FROM users WHERE account = ? LIMIT 1", [account]);
  if (existingRows.length > 0) {
    throw appError(409, "账号已存在");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const gender = payload.gender ? String(payload.gender).trim() : null;
  const phone = payload.phone ? String(payload.phone).trim() : null;
  const age = payload.age ?? null;

  const [result] = await pool.execute(
    `INSERT INTO users (account, password_hash, user_name, role, gender, phone, age, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    [account, passwordHash, userName, role, gender, phone, age],
  );

  return {
    user: {
      id: result.insertId,
      account,
      user_name: userName,
      role,
      gender: gender || undefined,
      phone: phone || undefined,
      age: age ?? undefined,
    },
  };
}

export async function getProfile(userId) {
  const [rows] = await pool.execute(
    `SELECT id, account, user_name, role, gender, phone, age, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  const user = rows[0];
  if (!user) {
    throw appError(404, "用户不存在");
  }

  return normalizeUser(user);
}

export async function updateProfile(userId, payload) {
  const userName = String(payload.user_name || payload.userName || "").trim();
  if (!userName) {
    throw appError(400, "姓名不能为空");
  }

  const gender = payload.gender ? String(payload.gender).trim() : null;
  const phone = payload.phone ? String(payload.phone).trim() : null;
  const age = payload.age ?? null;

  const [result] = await pool.execute(
    `UPDATE users
     SET user_name = ?, gender = ?, phone = ?, age = ?, updated_at = NOW()
     WHERE id = ?`,
    [userName, gender, phone, age, userId],
  );

  if (result.affectedRows === 0) {
    throw appError(404, "用户不存在");
  }

  return { message: "个人资料更新成功" };
}

export async function changePassword(userId, payload) {
  const oldPassword = String(payload.oldPassword || "");
  const newPassword = String(payload.newPassword || "");

  if (!oldPassword || !newPassword) {
    throw appError(400, "原密码和新密码不能为空");
  }

  const [rows] = await pool.execute(
    "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  const user = rows[0];
  if (!user) {
    throw appError(404, "用户不存在");
  }

  const matched = await bcrypt.compare(oldPassword, user.password_hash);
  if (!matched) {
    throw appError(400, "原密码错误");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.execute(
    "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
    [passwordHash, userId],
  );

  return { message: "密码修改成功" };
}
