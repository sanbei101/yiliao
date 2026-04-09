import { pool, withTransaction } from "../config/db.js";
import { formatDurationMinutes } from "../utils/date.js";
import { appError, ensureBooleanInt, ensurePositiveInt } from "./common.service.js";

function normalizeVideo(video, categories) {
  return {
    id: video.id,
    title: video.title,
    cover_url: video.cover_url || "",
    video_url: video.video_url || "",
    description: video.description || "",
    duration_seconds: Number(video.duration_seconds || 0),
    duration: formatDurationMinutes(video.duration_seconds),
    caution_text: video.caution_text || "",
    status: Number(video.status ?? 1),
    created_at: video.created_at,
    updated_at: video.updated_at,
    categories,
  };
}

async function loadVideoCategories(videoIds, connection = pool) {
  const map = new Map();
  if (!videoIds.length) {
    return map;
  }

  const placeholders = videoIds.map(() => "?").join(",");
  const [rows] = await connection.query(
    `SELECT vc.video_id, c.id, c.name
     FROM training_video_categories vc
     JOIN training_categories c ON c.id = vc.category_id
     WHERE vc.video_id IN (${placeholders})
     ORDER BY c.sort_no ASC, c.id ASC`,
    videoIds,
  );

  for (const row of rows) {
    if (!map.has(row.video_id)) {
      map.set(row.video_id, []);
    }
    map.get(row.video_id).push({ id: row.id, name: row.name });
  }
  return map;
}

async function buildVideoList(rows, connection = pool) {
  const categoryMap = await loadVideoCategories(rows.map((item) => item.id), connection);
  return rows.map((row) => normalizeVideo(row, categoryMap.get(row.id) || []));
}

async function validateCategoryIds(categoryIds, connection) {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw appError(400, "至少选择一个分类");
  }

  const ids = categoryIds.map((item) => ensurePositiveInt(item, 0)).filter((item) => item > 0);
  if (!ids.length) {
    throw appError(400, "分类参数无效");
  }

  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await connection.query(
    `SELECT id, status
     FROM training_categories
     WHERE id IN (${placeholders})`,
    ids,
  );

  if (rows.length !== ids.length) {
    throw appError(400, "存在无效分类");
  }
  if (rows.some((item) => Number(item.status) !== 1)) {
    throw appError(400, "视频只能关联启用状态的分类");
  }

  return ids;
}

function applyDurationTag(sqlParts, params, durationTag, alias = "v") {
  if (durationTag === "short") {
    sqlParts.push(`AND ${alias}.duration_seconds <= 300`);
  } else if (durationTag === "medium") {
    sqlParts.push(`AND ${alias}.duration_seconds BETWEEN 301 AND 600`);
  } else if (durationTag === "long") {
    sqlParts.push(`AND ${alias}.duration_seconds > 600`);
  }
  return { sqlParts, params };
}

export async function getPublicCategories() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.parent_id, COUNT(DISTINCT v.id) AS video_count
     FROM training_categories c
     LEFT JOIN training_video_categories vc ON vc.category_id = c.id
     LEFT JOIN training_videos v ON v.id = vc.video_id AND v.status = 1
     WHERE c.status = 1
     GROUP BY c.id, c.name, c.parent_id
     ORDER BY c.sort_no ASC, c.id ASC`,
  );

  return rows.map((item) => ({
    id: item.id,
    name: item.name,
    parent_id: item.parent_id,
    count: Number(item.video_count || 0),
  }));
}

export async function getAdminCategories(query = {}) {
  const sql = [
    `SELECT id, name, parent_id, sort_no, status, created_at, updated_at
     FROM training_categories
     WHERE 1 = 1`,
  ];
  const params = [];

  if (query.parentId || query.parent_id) {
    sql.push("AND parent_id = ?");
    params.push(ensurePositiveInt(query.parentId || query.parent_id, 0));
  }
  if (query.status !== undefined && query.status !== "") {
    sql.push("AND status = ?");
    params.push(ensureBooleanInt(query.status, 1));
  }

  sql.push("ORDER BY sort_no ASC, id ASC");
  const [rows] = await pool.execute(sql.join(" "), params);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parent_id: row.parent_id,
    sort_no: Number(row.sort_no || 0),
    status: Number(row.status || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createCategory(payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    throw appError(400, "分类名称不能为空");
  }

  const parentId = payload.parent_id ? ensurePositiveInt(payload.parent_id, 0) : null;
  const sortNo = Number.parseInt(String(payload.sort_no ?? payload.sortNo ?? 0), 10) || 0;
  const status = ensureBooleanInt(payload.status, 1);

  const [result] = await pool.execute(
    `INSERT INTO training_categories (name, parent_id, sort_no, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [name, parentId || null, sortNo, status],
  );

  return {
    id: result.insertId,
    name,
    parent_id: parentId || null,
    sort_no: sortNo,
    status,
  };
}

export async function getPublicVideos(query = {}) {
  const categoryId = ensurePositiveInt(query.category_id || query.categoryId, 0);
  const page = ensurePositiveInt(query.page, 1);
  const limit = Math.min(ensurePositiveInt(query.limit, 20), 100);
  const offset = (page - 1) * limit;
  const keyword = String(query.keyword || "").trim();
  const durationTag = String(query.durationTag || query.duration_tag || "").trim();

  const sql = [
    `SELECT DISTINCT v.id, v.title, v.cover_url, v.video_url, v.description, v.duration_seconds,
            v.caution_text, v.status, v.created_at, v.updated_at
     FROM training_videos v`,
  ];
  const params = [];
  if (categoryId > 0) {
    sql.push("JOIN training_video_categories vc ON vc.video_id = v.id");
  }
  sql.push("WHERE v.status = 1");
  if (categoryId > 0) {
    sql.push("AND vc.category_id = ?");
    params.push(categoryId);
  }
  if (keyword) {
    sql.push("AND v.title LIKE ?");
    params.push(`%${keyword}%`);
  }
  applyDurationTag(sql, params, durationTag);
  sql.push("ORDER BY v.created_at DESC, v.id DESC LIMIT ? OFFSET ?");
  params.push(limit, offset);

  const [rows] = await pool.query(sql.join(" "), params);
  return buildVideoList(rows);
}

export async function getAdminVideos(query = {}) {
  const categoryId = ensurePositiveInt(query.category_id || query.categoryId, 0);
  const page = ensurePositiveInt(query.page, 1);
  const limit = Math.min(ensurePositiveInt(query.limit, 20), 100);
  const offset = (page - 1) * limit;
  const keyword = String(query.keyword || "").trim();
  const durationTag = String(query.durationTag || query.duration_tag || "").trim();

  const sql = [
    `SELECT DISTINCT v.id, v.title, v.cover_url, v.video_url, v.description, v.duration_seconds,
            v.caution_text, v.status, v.created_at, v.updated_at
     FROM training_videos v`,
  ];
  const params = [];
  if (categoryId > 0) {
    sql.push("JOIN training_video_categories vc ON vc.video_id = v.id");
  }
  sql.push("WHERE 1 = 1");
  if (categoryId > 0) {
    sql.push("AND vc.category_id = ?");
    params.push(categoryId);
  }
  if (query.status !== undefined && query.status !== "") {
    sql.push("AND v.status = ?");
    params.push(ensureBooleanInt(query.status, 1));
  }
  if (keyword) {
    sql.push("AND v.title LIKE ?");
    params.push(`%${keyword}%`);
  }
  applyDurationTag(sql, params, durationTag);
  sql.push("ORDER BY v.created_at DESC, v.id DESC LIMIT ? OFFSET ?");
  params.push(limit, offset);

  const [rows] = await pool.query(sql.join(" "), params);
  return buildVideoList(rows);
}

export async function getPublicVideoById(videoId) {
  const id = ensurePositiveInt(videoId, 0);
  if (!id) {
    throw appError(400, "视频ID无效");
  }

  const [rows] = await pool.execute(
    `SELECT id, title, cover_url, video_url, description, duration_seconds, caution_text, status, created_at, updated_at
     FROM training_videos
     WHERE id = ? AND status = 1
     LIMIT 1`,
    [id],
  );
  if (!rows[0]) {
    throw appError(404, "视频不存在");
  }

  const categories = await loadVideoCategories([id]);
  return normalizeVideo(rows[0], categories.get(id) || []);
}

export async function getAdminVideoById(videoId) {
  const id = ensurePositiveInt(videoId, 0);
  if (!id) {
    throw appError(400, "视频ID无效");
  }

  const [rows] = await pool.execute(
    `SELECT id, title, cover_url, video_url, description, duration_seconds, caution_text, status, created_at, updated_at
     FROM training_videos
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  if (!rows[0]) {
    throw appError(404, "视频不存在");
  }

  const categories = await loadVideoCategories([id]);
  return normalizeVideo(rows[0], categories.get(id) || []);
}

export async function createVideo(payload) {
  const title = String(payload.title || "").trim();
  const videoUrl = String(payload.video_url || payload.videoURL || "").trim();
  if (!title || !videoUrl) {
    throw appError(400, "视频标题和地址不能为空");
  }

  return withTransaction(async (connection) => {
    const categoryIds = await validateCategoryIds(payload.category_ids || payload.categoryIDs || [], connection);
    const coverUrl = String(payload.cover_url || payload.coverURL || "").trim();
    const description = String(payload.description || "").trim();
    const cautionText = String(payload.caution_text || payload.cautionText || "").trim();
    const durationSeconds = ensurePositiveInt(payload.duration_seconds || payload.durationSeconds, 0);
    const status = ensureBooleanInt(payload.status, 1);

    const [result] = await connection.execute(
      `INSERT INTO training_videos (
         title, cover_url, video_url, description, duration_seconds, caution_text, status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, coverUrl || null, videoUrl, description || null, durationSeconds, cautionText || null, status],
    );

    for (const categoryId of categoryIds) {
      await connection.execute(
        `INSERT INTO training_video_categories (video_id, category_id)
         VALUES (?, ?)`,
        [result.insertId, categoryId],
      );
    }

    const [rows] = await connection.execute(
      `SELECT id, title, cover_url, video_url, description, duration_seconds, caution_text, status, created_at, updated_at
       FROM training_videos
       WHERE id = ?
       LIMIT 1`,
      [result.insertId],
    );
    const categoryMap = await loadVideoCategories([result.insertId], connection);
    return normalizeVideo(rows[0], categoryMap.get(result.insertId) || []);
  });
}

export async function updateVideo(videoId, payload) {
  const id = ensurePositiveInt(videoId, 0);
  if (!id) {
    throw appError(400, "视频ID无效");
  }

  return withTransaction(async (connection) => {
    const [existingRows] = await connection.execute(
      "SELECT id FROM training_videos WHERE id = ? LIMIT 1",
      [id],
    );
    if (!existingRows[0]) {
      throw appError(404, "视频不存在");
    }

    const categoryIds = await validateCategoryIds(payload.category_ids || payload.categoryIDs || [], connection);
    const title = String(payload.title || "").trim();
    const videoUrl = String(payload.video_url || payload.videoURL || "").trim();
    if (!title || !videoUrl) {
      throw appError(400, "视频标题和地址不能为空");
    }

    const coverUrl = String(payload.cover_url || payload.coverURL || "").trim();
    const description = String(payload.description || "").trim();
    const cautionText = String(payload.caution_text || payload.cautionText || "").trim();
    const durationSeconds = ensurePositiveInt(payload.duration_seconds || payload.durationSeconds, 0);

    await connection.execute(
      `UPDATE training_videos
       SET title = ?, cover_url = ?, video_url = ?, description = ?, duration_seconds = ?, caution_text = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, coverUrl || null, videoUrl, description || null, durationSeconds, cautionText || null, id],
    );

    // 视频主体和分类关系必须一起成功或一起失败，避免后台看到“视频已更新但分类未同步”的中间态。
    await connection.execute("DELETE FROM training_video_categories WHERE video_id = ?", [id]);
    for (const categoryId of categoryIds) {
      await connection.execute(
        "INSERT INTO training_video_categories (video_id, category_id) VALUES (?, ?)",
        [id, categoryId],
      );
    }

    const [rows] = await connection.execute(
      `SELECT id, title, cover_url, video_url, description, duration_seconds, caution_text, status, created_at, updated_at
       FROM training_videos
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
    const categoryMap = await loadVideoCategories([id], connection);
    return normalizeVideo(rows[0], categoryMap.get(id) || []);
  });
}

export async function updateVideoStatus(videoId, status) {
  const id = ensurePositiveInt(videoId, 0);
  if (!id) {
    throw appError(400, "视频ID无效");
  }

  const nextStatus = ensureBooleanInt(status, 1);
  const [result] = await pool.execute(
    "UPDATE training_videos SET status = ?, updated_at = NOW() WHERE id = ?",
    [nextStatus, id],
  );
  if (!result.affectedRows) {
    throw appError(404, "视频不存在");
  }

  return getAdminVideoById(id);
}
