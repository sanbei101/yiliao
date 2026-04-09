import mysql from "mysql2/promise";
import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?`,
    [tableName, indexName],
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function addColumnIfMissing(connection, tableName, columnName, sqlFragment) {
  if (!(await columnExists(connection, tableName, columnName))) {
    await connection.execute(`ALTER TABLE ${tableName} ADD COLUMN ${sqlFragment}`);
  }
}

async function dropIndexIfExists(connection, tableName, indexName) {
  if (await indexExists(connection, tableName, indexName)) {
    await connection.execute(`ALTER TABLE ${tableName} DROP INDEX ${indexName}`);
  }
}

async function addIndexIfMissing(connection, tableName, indexName, sqlFragment) {
  if (!(await indexExists(connection, tableName, indexName))) {
    await connection.execute(`ALTER TABLE ${tableName} ADD ${sqlFragment}`);
  }
}

async function createCoreTables(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      account VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      user_name VARCHAR(50) NOT NULL,
      role VARCHAR(20) NOT NULL,
      gender VARCHAR(16) NULL,
      phone VARCHAR(20) NULL,
      age INT NULL,
      status TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS elder_child_bindings (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      elder_id BIGINT NOT NULL,
      child_id BIGINT NOT NULL,
      relation_type VARCHAR(32) NULL,
      is_primary TINYINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uk_elder_child UNIQUE (elder_id, child_id),
      CONSTRAINT fk_binding_elder FOREIGN KEY (elder_id) REFERENCES users(id),
      CONSTRAINT fk_binding_child FOREIGN KEY (child_id) REFERENCES users(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS training_categories (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      parent_id BIGINT NULL,
      sort_no INT NOT NULL DEFAULT 0,
      status TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_training_categories_parent FOREIGN KEY (parent_id) REFERENCES training_categories(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS training_videos (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(100) NOT NULL,
      cover_url VARCHAR(255) NULL,
      video_url VARCHAR(255) NOT NULL,
      description TEXT NULL,
      duration_seconds INT NOT NULL DEFAULT 0,
      caution_text TEXT NULL,
      status TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS training_video_categories (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      video_id BIGINT NOT NULL,
      category_id BIGINT NOT NULL,
      CONSTRAINT uk_video_category UNIQUE (video_id, category_id),
      CONSTRAINT fk_video_category_video FOREIGN KEY (video_id) REFERENCES training_videos(id),
      CONSTRAINT fk_video_category_category FOREIGN KEY (category_id) REFERENCES training_categories(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS plan_templates (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      level_tag VARCHAR(32) NULL,
      duration_days INT NOT NULL,
      status TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS plan_template_items (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      template_id BIGINT NOT NULL,
      day_no INT NOT NULL,
      order_no INT NOT NULL,
      video_id BIGINT NOT NULL,
      suggested_duration_seconds INT NULL,
      repeat_count INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_template_item_template FOREIGN KEY (template_id) REFERENCES plan_templates(id),
      CONSTRAINT fk_template_item_video FOREIGN KEY (video_id) REFERENCES training_videos(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS elder_plan_assignments (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      elder_id BIGINT NOT NULL,
      template_id BIGINT NOT NULL,
      start_date DATE NOT NULL,
      next_day_no INT NOT NULL DEFAULT 1,
      status TINYINT NOT NULL DEFAULT 1,
      last_plan_date DATE NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_assignment_elder FOREIGN KEY (elder_id) REFERENCES users(id),
      CONSTRAINT fk_assignment_template FOREIGN KEY (template_id) REFERENCES plan_templates(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS daily_plans (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      elder_id BIGINT NOT NULL,
      assignment_id BIGINT NOT NULL,
      template_id BIGINT NOT NULL,
      template_day_no INT NOT NULL,
      plan_date DATE NOT NULL,
      source_type VARCHAR(32) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_daily_plan_elder FOREIGN KEY (elder_id) REFERENCES users(id),
      CONSTRAINT fk_daily_plan_assignment FOREIGN KEY (assignment_id) REFERENCES elder_plan_assignments(id),
      CONSTRAINT fk_daily_plan_template FOREIGN KEY (template_id) REFERENCES plan_templates(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS daily_plan_items (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      daily_plan_id BIGINT NOT NULL,
      template_item_id BIGINT NULL,
      video_id BIGINT NOT NULL,
      title_snapshot VARCHAR(100) NULL,
      order_no INT NOT NULL,
      suggested_duration_seconds INT NULL,
      repeat_count INT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      completed_at DATETIME NULL,
      carried_from_item_id BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_daily_plan_item_plan FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id),
      CONSTRAINT fk_daily_plan_item_template_item FOREIGN KEY (template_item_id) REFERENCES plan_template_items(id),
      CONSTRAINT fk_daily_plan_item_video FOREIGN KEY (video_id) REFERENCES training_videos(id),
      CONSTRAINT fk_daily_plan_item_carried_from FOREIGN KEY (carried_from_item_id) REFERENCES daily_plan_items(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS training_records (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      elder_id BIGINT NOT NULL,
      daily_plan_id BIGINT NULL,
      daily_plan_item_id BIGINT NULL,
      video_id BIGINT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NULL,
      actual_duration_seconds INT NOT NULL DEFAULT 0,
      completed TINYINT NOT NULL DEFAULT 0,
      source VARCHAR(32) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_training_record_elder FOREIGN KEY (elder_id) REFERENCES users(id),
      CONSTRAINT fk_training_record_plan FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id),
      CONSTRAINT fk_training_record_plan_item FOREIGN KEY (daily_plan_item_id) REFERENCES daily_plan_items(id),
      CONSTRAINT fk_training_record_video FOREIGN KEY (video_id) REFERENCES training_videos(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      receiver_id BIGINT NOT NULL,
      sender_id BIGINT NOT NULL,
      sender_role VARCHAR(16) NOT NULL,
      type VARCHAR(32) NOT NULL,
      title VARCHAR(100) NOT NULL,
      content VARCHAR(255) NOT NULL,
      biz_date DATE NULL,
      related_elder_id BIGINT NULL,
      related_child_id BIGINT NULL,
      status TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notification_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
      CONSTRAINT fk_notification_sender FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notification_receipts (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      notification_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      is_read TINYINT NOT NULL DEFAULT 0,
      read_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT uk_notification_user UNIQUE (notification_id, user_id),
      CONSTRAINT fk_receipt_notification FOREIGN KEY (notification_id) REFERENCES notifications(id),
      CONSTRAINT fk_receipt_user FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

async function applyMigrations(connection) {
  await addColumnIfMissing(connection, "training_categories", "sort_no", "sort_no INT NOT NULL DEFAULT 0");
  await addColumnIfMissing(connection, "training_categories", "status", "status TINYINT NOT NULL DEFAULT 1");

  await addColumnIfMissing(connection, "plan_templates", "status", "status TINYINT NOT NULL DEFAULT 1");

  await addColumnIfMissing(connection, "elder_plan_assignments", "next_day_no", "next_day_no INT NOT NULL DEFAULT 1");
  if (await columnExists(connection, "elder_plan_assignments", "current_day_no")) {
    await connection.execute(`
      UPDATE elder_plan_assignments
         SET next_day_no = current_day_no
       WHERE current_day_no IS NOT NULL
         AND (next_day_no IS NULL OR next_day_no = 1)
    `);
    await connection.execute(`ALTER TABLE elder_plan_assignments DROP COLUMN current_day_no`);
  }

  await dropIndexIfExists(connection, "plan_template_items", "unique_template_video");
  await addIndexIfMissing(
    connection,
    "plan_template_items",
    "uk_template_day_order",
    "UNIQUE KEY uk_template_day_order (template_id, day_no, order_no)",
  );

  await addIndexIfMissing(
    connection,
    "daily_plans",
    "uk_elder_plan_date",
    "UNIQUE KEY uk_elder_plan_date (elder_id, plan_date)",
  );

  await addIndexIfMissing(
    connection,
    "daily_plan_items",
    "uk_daily_plan_order",
    "UNIQUE KEY uk_daily_plan_order (daily_plan_id, order_no)",
  );
}

async function seedBaseData(connection) {
  await connection.execute(
    `INSERT INTO users (account, password_hash, user_name, role, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), user_name = VALUES(user_name), status = VALUES(status)`,
    ["admin", "$2a$10$rOzJqZvJ6QZ7QZ7QZ7QZ7uQZ7QZ7QZ7QZ7QZ7QZ7QZ7QZ7QZ7", "admin", "admin", 1],
  );

  const categories = [
    { name: "手臂训练", parentId: null, sortNo: 1, status: 1 },
    { name: "腿脚训练", parentId: null, sortNo: 2, status: 1 },
    { name: "关节舒缓", parentId: null, sortNo: 3, status: 1 },
    { name: "坐着练", parentId: null, sortNo: 4, status: 1 },
    { name: "站着练", parentId: null, sortNo: 5, status: 1 },
    { name: "5分钟训练", parentId: null, sortNo: 6, status: 1 },
    { name: "10分钟训练", parentId: null, sortNo: 7, status: 1 },
  ];

  for (const category of categories) {
    await connection.execute(
      `INSERT INTO training_categories (name, parent_id, sort_no, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         sort_no = VALUES(sort_no),
         status = VALUES(status),
         updated_at = NOW()`,
      [category.name, category.parentId, category.sortNo, category.status],
    );
  }
}

async function initDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "elderlyrehab",
      multipleStatements: true,
    });

    console.log("Initializing database schema...");

    await createCoreTables(connection);
    await applyMigrations(connection);
    await seedBaseData(connection);

    console.log("Database initialization completed.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase().catch(() => {
    process.exitCode = 1;
  });
}

export { initDatabase };
