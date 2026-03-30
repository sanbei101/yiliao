import bcrypt from "bcryptjs";
import { pool } from "./config/db.js";

async function fixPasswords() {
  try {
    const password = "password";
    const hash = await bcrypt.hash(password, 10);

    console.log("生成的密码哈希:", hash);

    const [result] = await pool.execute("UPDATE users SET password_hash = ?", [hash]);

    console.log(`更新了 ${result.affectedRows} 条记录`);
    console.log("密码已重置为: password");
  } catch (error) {
    console.error("更新密码失败:", error);
  } finally {
    process.exit();
  }
}

fixPasswords();
