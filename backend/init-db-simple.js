import mysql from "mysql2/promise";

async function initDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "yiliao",
    });

    console.log("开始创建数据库表...");

    await connection.execute(`CREATE DATABASE IF NOT EXISTS yiliao`);
    await connection.execute(`USE yiliao`);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        account VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_name VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('elder', 'child', 'admin')),
        gender VARCHAR(10) NULL,
        phone VARCHAR(20) NULL,
        age INT NULL,
        status TINYINT DEFAULT 1 COMMENT '1=正常，0=禁用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS elder_child_bindings (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        elder_id BIGINT NOT NULL,
        child_id BIGINT NOT NULL,
        relation_type VARCHAR(20) NULL COMMENT '儿子/女儿/配偶/监护人',
        is_primary TINYINT DEFAULT 0 COMMENT '主要联系人',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elder_id) REFERENCES users(id),
        FOREIGN KEY (child_id) REFERENCES users(id),
        UNIQUE KEY unique_binding (elder_id, child_id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS training_categories (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        parent_id BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES training_categories(id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS training_videos (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        cover_url VARCHAR(255) NULL,
        video_url VARCHAR(255) NOT NULL,
        description TEXT NULL,
        duration_seconds INT NOT NULL,
        caution_text TEXT NULL COMMENT '注意事项',
        status TINYINT DEFAULT 1 COMMENT '1=上架，0=下架',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS training_video_categories (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        video_id BIGINT NOT NULL,
        category_id BIGINT NOT NULL,
        FOREIGN KEY (video_id) REFERENCES training_videos(id),
        FOREIGN KEY (category_id) REFERENCES training_categories(id),
        UNIQUE KEY unique_video_category (video_id, category_id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS plan_templates (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        level_tag VARCHAR(20) NULL,
        duration_days INT NOT NULL COMMENT '持续天数',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS plan_template_items (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        template_id BIGINT NOT NULL,
        video_id BIGINT NOT NULL,
        order_no INT NOT NULL COMMENT '训练顺序',
        day_no INT NOT NULL COMMENT '模板中第几天的动作',
        suggested_duration_seconds INT NULL,
        repeat_count INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES plan_templates(id),
        FOREIGN KEY (video_id) REFERENCES training_videos(id),
        UNIQUE KEY unique_template_video (template_id, video_id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS elder_plan_assignments (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        elder_id BIGINT NOT NULL,
        template_id BIGINT NOT NULL,
        start_date DATE NOT NULL,
        current_day_no INT DEFAULT 1,
        status TINYINT DEFAULT 1 COMMENT '1=进行中，0=结束，2=暂停',
        last_plan_date DATE NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (elder_id) REFERENCES users(id),
        FOREIGN KEY (template_id) REFERENCES plan_templates(id)
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
        source_type VARCHAR(20) NOT NULL COMMENT 'template_day=正常按模板天数生成, carry_over=由前一天未完成动作顺延生成',
        status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, in_progress, completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (elder_id) REFERENCES users(id),
        FOREIGN KEY (assignment_id) REFERENCES elder_plan_assignments(id),
        FOREIGN KEY (template_id) REFERENCES plan_templates(id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS daily_plan_items (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        daily_plan_id BIGINT NOT NULL,
        template_item_id BIGINT NOT NULL,
        video_id BIGINT NOT NULL,
        title_snapshot VARCHAR(100) NULL,
        order_no INT NOT NULL,
        suggested_duration_seconds INT NULL,
        repeat_count INT NULL,
        status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, completed, skipped',
        completed_at DATETIME NULL,
        carried_from_item_id BIGINT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id),
        FOREIGN KEY (template_item_id) REFERENCES plan_template_items(id),
        FOREIGN KEY (video_id) REFERENCES training_videos(id),
        FOREIGN KEY (carried_from_item_id) REFERENCES daily_plan_items(id),
        UNIQUE KEY unique_daily_plan_order (daily_plan_id, order_no)
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
        actual_duration_seconds INT DEFAULT 0,
        completed TINYINT DEFAULT 0,
        source VARCHAR(20) NOT NULL COMMENT 'today_plan / free_training',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elder_id) REFERENCES users(id),
        FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id),
        FOREIGN KEY (daily_plan_item_id) REFERENCES daily_plan_items(id),
        FOREIGN KEY (video_id) REFERENCES training_videos(id)
      )
    `);

    console.log("数据库表创建成功！");

    await connection.execute(`
      INSERT INTO users (account, password_hash, user_name, role, status)
      VALUES ('admin', '$2a$10$rOzJqZvJ6QZ7QZ7QZ7QZ7uQZ7QZ7QZ7QZ7QZ7QZ7QZ7QZ7QZ7', '管理员', 'admin', 1)
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
    `);

    await connection.execute(`
      INSERT INTO users (account, password_hash, user_name, role, status)
      VALUES ('elder1', '$2a$10$rOzJqZvJ6QZ7QZ7QZ7QZ7uQZ7QZ7QZ7QZ7QZ7QZ7QZ7QZ7QZ7', '张大爷', 'elder', 1)
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
    `);

    const categories = [
      { name: "手臂训练", parent_id: null },
      { name: "腿脚训练", parent_id: null },
      { name: "关节舒缓", parent_id: null },
      { name: "坐着练", parent_id: null },
      { name: "站着练", parent_id: null },
      { name: "5分钟训练", parent_id: null },
      { name: "10分钟训练", parent_id: null },
    ];

    for (const category of categories) {
      await connection.execute(
        "INSERT INTO training_categories (name, parent_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
        [category.name, category.parent_id],
      );
    }

    await connection.execute(`
      INSERT INTO training_videos (title, cover_url, video_url, description, duration_seconds, caution_text, status)
      VALUES ('肩颈放松训练', 'https://example.com/cover1.jpg', 'https://example.com/video1.mp4', '缓解肩颈紧张，改善血液循环', 600, '动作要缓慢，避免用力过猛', 1)
      ON DUPLICATE KEY UPDATE title = VALUES(title)
    `);

    await connection.execute(`
      INSERT INTO training_videos (title, cover_url, video_url, description, duration_seconds, caution_text, status)
      VALUES ('手臂拉伸训练', 'https://example.com/cover2.jpg', 'https://example.com/video2.mp4', '拉伸手臂肌肉，增加灵活性', 480, '保持呼吸，不要憋气', 1)
      ON DUPLICATE KEY UPDATE title = VALUES(title)
    `);

    await connection.execute(`
      INSERT INTO training_videos (title, cover_url, video_url, description, duration_seconds, caution_text, status)
      VALUES ('腿部力量训练', 'https://example.com/cover3.jpg', 'https://example.com/video3.mp4', '增强腿部肌肉力量', 900, '注意保持平衡', 1)
      ON DUPLICATE KEY UPDATE title = VALUES(title)
    `);

    console.log("初始化数据完成！");
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase().catch(console.error);
