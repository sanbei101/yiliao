import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    console.log("收到登录请求:", req.body);

    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ success: false, error: "账号和密码不能为空" });
    }

    const [users] = await pool.execute("SELECT * FROM users WHERE account = ? AND status = 1", [
      account,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: "账号不存在或已禁用" });
    }

    const user = users[0];
    console.log("找到用户:", {
      id: user.id,
      account: user.account,
      password_hash: user.password_hash,
    });
    console.log("验证密码:", password);

    // 临时允许测试账号使用简单密码
    let isValidPassword = false;

    // 测试账号使用固定密码 123456
    if (["admin", "elder1", "child1"].includes(account) && password === "123456") {
      isValidPassword = true;
      console.log("使用测试账号密码验证");
    } else {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log("密码验证结果:", isValidPassword);
    }

    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "密码错误" });
    }

    const token = jwt.sign(
      { id: user.id, account: user.account, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          account: user.account,
          user_name: user.user_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { account, password, user_name, role, gender, phone, age } = req.body;

    if (!account || !password || !user_name || !role) {
      return res.status(400).json({ error: "账号、密码、姓名和角色不能为空" });
    }

    if (!["elder", "child", "admin"].includes(role)) {
      return res.status(400).json({ error: "角色无效" });
    }

    const [existingUsers] = await pool.execute("SELECT id FROM users WHERE account = ?", [account]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "账号已存在" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (account, password_hash, user_name, role, gender, phone, age) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [account, password_hash, user_name, role, gender || null, phone || null, age || null],
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.insertId,
          account,
          user_name,
          role,
        },
      },
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 获取用户信息
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      "SELECT id, account, user_name, role, gender, phone, age, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "用户不存在" });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        account: user.account,
        user_name: user.user_name,
        role: user.role,
        gender: user.gender,
        phone: user.phone,
        age: user.age,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 更新用户信息
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_name, gender, phone, age } = req.body;

    const [result] = await pool.execute(
      "UPDATE users SET user_name = ?, gender = ?, phone = ?, age = ? WHERE id = ?",
      [user_name, gender, phone, age, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "用户不存在" });
    }

    res.json({
      success: true,
      message: "个人资料更新成功",
    });
  } catch (error) {
    console.error("更新用户信息错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 修改密码
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // 获取当前用户信息
    const [users] = await pool.execute("SELECT password_hash FROM users WHERE id = ?", [userId]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "用户不存在" });
    }

    const user = users[0];

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: "原密码错误" });
    }

    // 更新新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const [result] = await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
      newPasswordHash,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "用户不存在" });
    }

    res.json({
      success: true,
      message: "密码修改成功",
    });
  } catch (error) {
    console.error("修改密码错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

export default router;
