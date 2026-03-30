import express from "express";
import { pool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const [categories] = await pool.execute(
      "SELECT id, name, parent_id FROM training_categories ORDER BY parent_id ASC, id ASC",
    );

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      parent_id: cat.parent_id,
      count: 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("获取分类错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

router.get("/videos", async (req, res) => {
  try {
    const { category_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.id, v.title, v.cover_url, v.duration_seconds, v.description
      FROM training_videos v
      WHERE v.status = 1
    `;
    let params = [];

    if (category_id) {
      query += `
        JOIN training_video_categories vc ON v.id = vc.video_id
        WHERE vc.category_id = ?
      `;
      params.push(category_id);
    }

    query += " ORDER BY v.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [videos] = await pool.execute(query, params);

    const result = videos.map((video) => ({
      id: video.id,
      title: video.title,
      cover_url: video.cover_url,
      duration: `${Math.floor(video.duration_seconds / 60)}分钟`,
      duration_seconds: video.duration_seconds,
      description: video.description,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("获取视频错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

router.get("/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [videos] = await pool.execute(
      "SELECT * FROM training_videos WHERE id = ? AND status = 1",
      [id],
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: "视频不存在" });
    }

    const video = videos[0];

    const [categories] = await pool.execute(
      `
      SELECT c.id, c.name
      FROM training_categories c
      JOIN training_video_categories vc ON c.id = vc.category_id
      WHERE vc.video_id = ?
    `,
      [id],
    );

    res.json({
      success: true,
      data: {
        ...video,
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
      },
    });
  } catch (error) {
    console.error("获取视频详情错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

router.get("/today-plan", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // 查询用户今日的训练记录
    const [records] = await pool.execute(
      `
      SELECT v.title, v.duration_seconds, tr.completed
      FROM training_records tr
      JOIN training_videos v ON tr.video_id = v.id
      WHERE tr.elder_id = ? AND DATE(tr.start_time) = ?
    `,
      [userId, today],
    );

    // 获取训练分类的固定时长配置
    const categoryDurations = {
      关节舒缓: 10,
      力量训练: 15,
      平衡训练: 8,
    };

    // 生成3个训练分类的计划
    const trainingList = [
      {
        id: "1",
        title: "关节舒缓",
        duration: "10分钟",
        order: 1,
        completed: records.some((r) => r.category === "关节舒缓" && r.completed),
        current: false,
      },
      {
        id: "2",
        title: "力量训练",
        duration: "15分钟",
        order: 2,
        completed: records.some((r) => r.category === "力量训练" && r.completed),
        current: false,
      },
      {
        id: "3",
        title: "平衡训练",
        duration: "8分钟",
        order: 3,
        completed: records.some((r) => r.category === "平衡训练" && r.completed),
        current: false,
      },
    ];

    // 计算完成情况
    const completedCount = trainingList.filter((item) => item.completed).length;
    const totalCount = trainingList.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const totalDuration = "33分钟";

    // 设置当前进行中的训练（第一个未完成的）
    const firstIncompleteIndex = trainingList.findIndex((item) => !item.completed);
    if (firstIncompleteIndex !== -1) {
      trainingList[firstIncompleteIndex].current = true;
    }

    res.json({
      success: true,
      data: {
        date: today,
        totalDuration,
        completedCount,
        totalCount,
        progress,
        trainingList,
      },
    });
  } catch (error) {
    console.error("获取今日计划错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

router.get("/training-records", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let { days = 7 } = req.query;
    days = parseInt(days);

    let query, params;

    if (days === 1) {
      // 查询今日记录
      query = `
        SELECT tr.id, tr.start_time, tr.end_time, tr.actual_duration_seconds, tr.completed,
               v.title, v.duration_seconds
        FROM training_records tr
        JOIN training_videos v ON tr.video_id = v.id
        WHERE tr.elder_id = ? AND DATE(tr.start_time) = CURDATE()
        ORDER BY tr.start_time DESC
      `;
      params = [userId];
    } else {
      // 查询过去指定天数的记录（最多365天）
      const maxDays = Math.min(days, 365);
      query = `
        SELECT tr.id, tr.start_time, tr.end_time, tr.actual_duration_seconds, tr.completed,
               v.title, v.duration_seconds
        FROM training_records tr
        JOIN training_videos v ON tr.video_id = v.id
        WHERE tr.elder_id = ? AND tr.start_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY tr.start_time DESC
      `;
      params = [userId, maxDays];
    }

    const [records] = await pool.execute(query, params);

    // 按日期分组记录
    const groupedRecords = {};
    let todayTotalMinutes = 0;
    const todayRecords = [];

    records.forEach((record) => {
      const date = new Date(record.start_time).toLocaleDateString("zh-CN");
      const minutes = Math.floor(record.actual_duration_seconds / 60);

      if (!groupedRecords[date]) {
        groupedRecords[date] = [];
      }

      groupedRecords[date].push({
        id: record.id,
        title: record.title,
        duration: `${minutes}分钟`,
        actualDuration: minutes,
        targetDuration: Math.floor(record.duration_seconds / 60),
        completed: record.completed === 1,
      });

      // 统计今日数据
      const today = new Date().toLocaleDateString("zh-CN");
      if (date === today) {
        todayTotalMinutes += minutes;
        todayRecords.push({
          title: record.title,
          duration: minutes,
          targetDuration: Math.floor(record.duration_seconds / 60),
        });
      }
    });

    // 计算今日各训练项目的时长占比
    const todayDurationPercentage = [];
    if (todayTotalMinutes > 0) {
      todayRecords.forEach((training) => {
        const percentage = Math.round((training.duration / todayTotalMinutes) * 100);
        todayDurationPercentage.push({
          title: training.title,
          duration: training.duration,
          percentage: percentage,
        });
      });
    }

    // 计算今日完成率（今日实际时长 / 每日目标33分钟）
    const targetMinutesPerDay = 33;
    const todayCompletionRate =
      todayTotalMinutes > 0 ? Math.round((todayTotalMinutes / targetMinutesPerDay) * 100) : 0;

    // 转换为前端需要的格式
    const result = Object.keys(groupedRecords)
      .map((date) => ({
        date: date,
        dayOfWeek: new Date(date).toLocaleDateString("zh-CN", { weekday: "long" }),
        trainings: groupedRecords[date],
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: {
        records: result,
        stats: {
          todayTotalMinutes: todayTotalMinutes,
          todayCompletionRate: todayCompletionRate,
          todayDurationPercentage: todayDurationPercentage,
          targetMinutesPerDay: targetMinutesPerDay,
        },
      },
    });
  } catch (error) {
    console.error("获取训练记录错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

router.post("/training-records", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      video_id,
      daily_plan_id,
      daily_plan_item_id,
      start_time,
      end_time,
      actual_duration_seconds,
      completed,
      source,
    } = req.body;

    if (!video_id || !start_time) {
      return res.status(400).json({ error: "视频ID和开始时间不能为空" });
    }

    // 将ISO格式的日期时间转换为MySQL支持的格式
    const formattedStartTime = new Date(start_time)
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const formattedEndTime = end_time
      ? new Date(end_time).toISOString().replace("T", " ").substring(0, 19)
      : null;

    const [result] = await pool.execute(
      `
      INSERT INTO training_records (elder_id, daily_plan_id, daily_plan_item_id, video_id, start_time, end_time, actual_duration_seconds, completed, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        daily_plan_id || null,
        daily_plan_item_id || null,
        video_id,
        formattedStartTime,
        formattedEndTime,
        actual_duration_seconds || 0,
        completed ? 1 : 0,
        source,
      ],
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("创建训练记录错误:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

export default router;
