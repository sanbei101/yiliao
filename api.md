# 系统接口 API 文档（新接口为主）

## 1. 文档说明

- 文档范围：当前项目中的系统正式接口文档，以新接口为主，同时补充系统级认证接口 `/api/auth/*`。
- 适用对象：前端开发、测试、联调、接口验收人员。
- 接口前缀：`/api`
- 接口分组：
  - 认证接口：`/api/auth/*`
  - 公共接口：`/api/public/*`
  - 老人接口：`/api/elder/*`
  - 子女接口：`/api/child/*`
  - 管理员接口：`/api/admin/*`

## 2. 通用约定

### 2.1 通用响应格式

成功响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {}
}
```

失败响应：

```json
{
  "success": false,
  "error": "错误信息"
}
```

### 2.2 鉴权方式

- 需要登录的接口统一使用 `Authorization: Bearer <token>`
- Token 由系统认证接口 `POST /api/auth/login` 返回

请求头示例：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 角色权限

- `/api/public/*`：无需登录
- `/api/elder/*`：仅 `elder`
- `/api/child/*`：仅 `child`
- `/api/admin/*`：仅 `admin`

### 2.4 常见错误码

- `400`：参数错误、业务状态不允许
- `401`：未登录或 Token 无效
- `403`：无访问权限或绑定关系不存在
- `404`：资源不存在
- `409`：资源冲突，例如重复绑定、账号已存在
- `500`：服务器内部错误

## 3. 认证接口

## 3.1 用户登录

- 接口：`POST /api/auth/login`
- 鉴权：否
- 作用：系统统一登录入口，返回 Token 和当前用户基础信息

请求体：

```json
{
  "account": "elder001",
  "password": "123456"
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 2,
      "account": "elder001",
      "user_name": "张三",
      "role": "elder",
      "gender": "男",
      "phone": "13800000000",
      "age": 68
    }
  }
}
```

失败响应示例：

```json
{
  "success": false,
  "error": "账号不存在或已禁用"
}
```

## 3.2 用户注册

- 接口：`POST /api/auth/register`
- 鉴权：否
- 作用：系统统一注册入口，用于创建老人、子女或管理员账号

请求体：

```json
{
  "account": "child002",
  "password": "123456",
  "user_name": "李四",
  "role": "child",
  "gender": "女",
  "phone": "13900000000",
  "age": 35
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 8,
      "account": "child002",
      "user_name": "李四",
      "role": "child",
      "gender": "女",
      "phone": "13900000000",
      "age": 35
    }
  }
}
```

说明：

- `role` 目前支持：`elder`、`child`、`admin`

## 3.3 获取当前登录用户资料

- 接口：`GET /api/auth/profile`
- 鉴权：是
- 作用：获取当前登录用户通用资料

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 2,
    "account": "elder001",
    "user_name": "张三",
    "role": "elder",
    "gender": "男",
    "phone": "13800000000",
    "age": 68,
    "created_at": "2026-04-10T08:00:00.000Z"
  }
}
```

## 3.4 更新当前登录用户资料

- 接口：`PUT /api/auth/profile`
- 鉴权：是
- 作用：更新当前登录用户通用资料

请求体：

```json
{
  "user_name": "张三",
  "gender": "男",
  "phone": "13800000000",
  "age": 68
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "个人资料更新成功",
  "data": {
    "message": "个人资料更新成功"
  }
}
```

## 3.5 修改密码

- 接口：`PUT /api/auth/change-password`
- 鉴权：是
- 作用：修改当前登录用户密码

请求体：

```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "密码修改成功",
  "data": {
    "message": "密码修改成功"
  }
}
```

## 4. 公共接口

## 4.1 获取公共分类列表

- 接口：`GET /api/public/categories`
- 鉴权：否
- 作用：获取启用状态的训练分类列表

请求参数：无

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "name": "肩颈训练",
      "parent_id": null,
      "count": 3
    },
    {
      "id": 2,
      "name": "膝关节训练",
      "parent_id": null,
      "count": 5
    }
  ]
}
```

字段说明：

- `id`：分类 ID
- `name`：分类名称
- `parent_id`：父分类 ID，顶级分类为 `null`
- `count`：该分类下已上架视频数量

## 4.2 获取公共视频列表

- 接口：`GET /api/public/videos`
- 鉴权：否
- 作用：获取已上架训练视频列表，支持筛选与分页

请求参数：

- `category_id`：分类 ID，可选
- `keyword`：标题关键字，可选
- `durationTag`：时长标签，可选，值为 `short`、`medium`、`long`
- `page`：页码，可选，默认 `1`
- `limit`：每页数量，可选，默认 `20`

请求示例：

```text
GET /api/public/videos?category_id=1&keyword=肩&durationTag=short&page=1&limit=20
```

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 4,
      "title": "肩颈放松训练",
      "cover_url": "https://example.com/cover.jpg",
      "video_url": "https://example.com/video.mp4",
      "description": "适合老年人的基础肩颈训练",
      "duration_seconds": 240,
      "duration": "4分钟",
      "caution_text": "动作缓慢，感到不适立即停止",
      "status": 1,
      "created_at": "2026-04-15T09:00:00.000Z",
      "updated_at": "2026-04-15T09:00:00.000Z",
      "categories": [
        {
          "id": 1,
          "name": "肩颈训练"
        }
      ]
    }
  ]
}
```

字段说明：

- `id`：视频 ID
- `title`：视频标题
- `cover_url`：封面地址
- `video_url`：视频地址
- `description`：视频简介
- `duration_seconds`：时长，单位秒
- `duration`：格式化后的展示时长
- `caution_text`：注意事项
- `status`：上架状态，公共接口固定只返回 `1`
- `categories`：视频关联分类列表

## 4.3 获取公共视频详情

- 接口：`GET /api/public/videos/:id`
- 鉴权：否
- 作用：获取单个已上架视频详情

路径参数：

- `id`：视频 ID

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 4,
    "title": "肩颈放松训练",
    "cover_url": "https://example.com/cover.jpg",
    "video_url": "https://example.com/video.mp4",
    "description": "适合老年人的基础肩颈训练",
    "duration_seconds": 240,
    "duration": "4分钟",
    "caution_text": "动作缓慢，感到不适立即停止",
    "status": 1,
    "created_at": "2026-04-15T09:00:00.000Z",
    "updated_at": "2026-04-15T09:00:00.000Z",
    "categories": [
      {
        "id": 1,
        "name": "肩颈训练"
      }
    ]
  }
}
```

失败示例：

```json
{
  "success": false,
  "error": "视频不存在"
}
```

## 5. 老人接口

## 5.1 获取老人个人信息

- 接口：`GET /api/elder/profile`
- 鉴权：是，`elder`
- 作用：获取当前老人个人资料

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 2,
    "account": "elder001",
    "user_name": "张三",
    "role": "elder",
    "gender": "男",
    "phone": "13800000000",
    "age": 68,
    "created_at": "2026-04-10T08:00:00.000Z"
  }
}
```

## 5.2 获取老人首页聚合数据

- 接口：`GET /api/elder/home`
- 鉴权：是，`elder`
- 作用：返回首页所需的今日计划、未读提醒数、最近训练记录

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "todayPlan": {
      "date": "2026-04-15",
      "totalDuration": "15分钟",
      "completedCount": 1,
      "totalCount": 3,
      "progress": 33,
      "trainingList": [
        {
          "id": "11",
          "title": "肩颈放松训练",
          "duration": "5分钟",
          "order": 1,
          "completed": true,
          "current": false
        }
      ]
    },
    "unreadNotificationCount": 2,
    "recentRecords": [
      {
        "id": 21,
        "title": "肩颈放松训练",
        "date": "2026-04-15",
        "duration": "4分钟",
        "completed": true
      }
    ]
  }
}
```

## 5.3 获取通知列表

- 接口：`GET /api/elder/notifications`
- 鉴权：是，`elder`
- 作用：获取当前老人通知列表

请求参数：

- `unreadOnly`：是否只返回未读通知，可选，值为 `true` 或 `false`

请求示例：

```text
GET /api/elder/notifications?unreadOnly=true
```

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 5,
      "title": "训练提醒",
      "content": "今天记得完成训练",
      "type": "training_reminder",
      "biz_date": "2026-04-15",
      "is_read": 0,
      "read_at": null,
      "created_at": "2026-04-15T09:20:00.000Z",
      "sender": {
        "id": 3,
        "role": "child",
        "user_name": "李四"
      }
    }
  ]
}
```

## 5.4 标记通知已读

- 接口：`POST /api/elder/notifications/:id/read`
- 鉴权：是，`elder`
- 作用：将指定通知标记为已读

路径参数：

- `id`：通知 ID

请求体：无

成功响应示例：

```json
{
  "success": true,
  "message": "提醒已读成功",
  "data": {
    "success": true
  }
}
```

## 5.5 获取今日计划详情

- 接口：`GET /api/elder/today-plan`
- 鉴权：是，`elder`
- 作用：获取老人端完整今日计划详情

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 3,
    "elder_id": 2,
    "assignment_id": 1,
    "template_id": 1,
    "template_day_no": 2,
    "plan_date": "2026-04-15",
    "source_type": "template",
    "status": "in_progress",
    "items": [
      {
        "id": 12,
        "template_item_id": 7,
        "video_id": 4,
        "title": "肩颈放松训练",
        "order_no": 1,
        "suggested_duration_seconds": 300,
        "repeat_count": 1,
        "status": "pending",
        "carried_from_item_id": null,
        "completed_at": null
      }
    ]
  }
}
```

字段说明：

- `source_type`：计划来源，常见值为 `template`、`carry_only`、`mixed`
- `status`：计划状态，常见值为 `pending`、`in_progress`、`completed`
- `items`：计划项列表

## 5.6 生成今日计划

- 接口：`POST /api/elder/today-plan/generate`
- 鉴权：是，`elder`
- 作用：显式触发今日计划生成

请求体：无

成功响应：返回结构与 `GET /api/elder/today-plan` 一致。

失败示例：

```json
{
  "success": false,
  "error": "当前没有可生成的计划"
}
```

## 5.7 激活当天模板训练

- 接口：`POST /api/elder/today-plan/activate-template`
- 鉴权：是，`elder`
- 作用：当今日计划为 `carry_only` 时，由老人主动开启当天模板训练

请求体：无

成功响应：返回结构与 `GET /api/elder/today-plan` 一致。

失败示例：

```json
{
  "success": false,
  "error": "请先处理完顺延项，再开启今日模板训练"
}
```

## 5.8 完成计划项

- 接口：`POST /api/elder/today-plan/items/:id/complete`
- 鉴权：是，`elder`
- 作用：将今日计划项标记为完成，并联动刷新计划状态

路径参数：

- `id`：计划项 ID

请求体：无

成功响应：返回更新后的今日计划详情。

## 5.9 跳过计划项

- 接口：`POST /api/elder/today-plan/items/:id/skip`
- 鉴权：是，`elder`
- 作用：将今日计划项标记为跳过，并联动刷新计划状态

路径参数：

- `id`：计划项 ID

请求体：无

成功响应：返回更新后的今日计划详情。

## 5.10 获取训练记录列表

- 接口：`GET /api/elder/training-records`
- 鉴权：是，`elder`
- 作用：获取老人自己的训练记录列表与统计

请求参数：

- `days`：查询天数，可选，默认 `7`

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "records": [
      {
        "date": "2026-04-15",
        "dayOfWeek": "周二",
        "trainings": [
          {
            "id": 20,
            "title": "肩颈放松训练",
            "duration": "4分钟",
            "completed": true,
            "targetDuration": 5,
            "actualDuration": 4,
            "completionRate": 80,
            "source": "today_plan"
          }
        ]
      }
    ],
    "stats": {
      "todayTotalMinutes": 4,
      "todayCompletionRate": 12,
      "todayDurationPercentage": [
        {
          "title": "肩颈放松训练",
          "duration": 4,
          "percentage": 100
        }
      ],
      "targetMinutesPerDay": 33
    }
  }
}
```

## 5.11 获取训练记录详情

- 接口：`GET /api/elder/training-records/:id`
- 鉴权：是，`elder`
- 作用：获取某条训练记录详情

路径参数：

- `id`：训练记录 ID

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 21,
    "videoId": 4,
    "videoTitle": "肩颈放松训练",
    "source": "today_plan",
    "completed": 1,
    "startTime": "2026-04-15T10:00:00.000Z",
    "endTime": "2026-04-15T10:04:00.000Z",
    "actualDurationSeconds": 240,
    "dailyPlan": {
      "id": 3,
      "planDate": "2026-04-15",
      "status": "completed",
      "templateDayNo": 2
    },
    "dailyPlanItem": {
      "id": 12,
      "orderNo": 1,
      "status": "completed",
      "suggestedDurationSeconds": 300,
      "repeatCount": 1
    }
  }
}
```

## 5.12 获取训练趋势

- 接口：`GET /api/elder/training-trend`
- 鉴权：是，`elder`
- 作用：获取按天聚合的训练趋势数据

请求参数：

- `days`：查询天数，可选，默认 `7`

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "elderId": 2,
    "range": {
      "startDate": "2026-04-09",
      "endDate": "2026-04-15"
    },
    "points": [
      {
        "date": "2026-04-15",
        "trained": true,
        "recordCount": 2,
        "completedPlan": true,
        "durationSeconds": 480
      }
    ],
    "summary": {
      "trainedDays": 4,
      "completedPlanDays": 3,
      "totalDurationSeconds": 1050
    }
  }
}
```

## 5.13 开始训练

- 接口：`POST /api/elder/training-records/start`
- 鉴权：是，`elder`
- 作用：创建一条进行中的训练记录

请求体：

```json
{
  "video_id": 4,
  "daily_plan_id": 3,
  "daily_plan_item_id": 12,
  "source": "today_plan",
  "start_time": "2026-04-15T10:00:00+08:00"
}
```

字段说明：

- `video_id`：视频 ID，必填
- `daily_plan_id`：所属计划 ID，可选
- `daily_plan_item_id`：所属计划项 ID，可选
- `source`：训练来源，常见值为 `today_plan`、`free_training`
- `start_time`：开始时间，可选

成功响应示例：

```json
{
  "success": true,
  "message": "训练开始成功",
  "data": {
    "id": 21
  }
}
```

## 5.14 完成训练

- 接口：`POST /api/elder/training-records/:id/finish`
- 鉴权：是，`elder`
- 作用：结束训练记录，并可同步完成计划项

路径参数：

- `id`：训练记录 ID

请求体：

```json
{
  "end_time": "2026-04-15T10:04:00+08:00",
  "actual_duration_seconds": 240,
  "completed": true
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "训练完成成功",
  "data": {
    "id": 21,
    "completed": 1
  }
}
```

## 6. 子女接口

## 6.1 获取子女个人信息

- 接口：`GET /api/child/profile`
- 鉴权：是，`child`
- 作用：获取当前子女个人资料

成功响应结构与 `GET /api/elder/profile` 基本一致。

## 6.2 获取已绑定老人列表

- 接口：`GET /api/child/elders`
- 鉴权：是，`child`
- 作用：获取当前子女绑定的老人列表

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "binding_id": 3,
      "relation_type": "daughter",
      "is_primary": 1,
      "elder": {
        "id": 2,
        "account": "elder001",
        "user_name": "张三",
        "role": "elder",
        "gender": "男",
        "phone": "13800000000",
        "age": 68,
        "status": 1,
        "created_at": "2026-04-10T08:00:00.000Z",
        "updated_at": "2026-04-15T08:00:00.000Z"
      }
    }
  ]
}
```

## 6.3 发送训练提醒

- 接口：`POST /api/child/elders/:elderId/reminders`
- 鉴权：是，`child`
- 作用：向指定绑定老人发送训练提醒

路径参数：

- `elderId`：老人用户 ID

请求体：

```json
{
  "content": "今天记得完成训练"
}
```

说明：

- `content` 可选
- 不传时后端会自动生成默认提醒文案

成功响应示例：

```json
{
  "success": true,
  "message": "提醒发送成功",
  "data": {
    "has_reminder": true,
    "latest_reminder": {
      "id": 9,
      "title": "训练提醒",
      "content": "今天记得完成训练",
      "biz_date": "2026-04-15",
      "created_at": "2026-04-15T09:20:00.000Z"
    }
  }
}
```

## 6.4 获取最近提醒

- 接口：`GET /api/child/elders/:elderId/reminders/latest`
- 鉴权：是，`child`
- 作用：获取对子女指定老人的最近一次提醒状态

路径参数：

- `elderId`：老人用户 ID

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "has_reminder": true,
    "latest_reminder": {
      "id": 9,
      "title": "训练提醒",
      "content": "今天记得完成训练",
      "biz_date": "2026-04-15",
      "created_at": "2026-04-15T09:20:00.000Z"
    }
  }
}
```

## 6.5 获取老人今日概览

- 接口：`GET /api/child/elders/:elderId/today-summary`
- 鉴权：是，`child`
- 作用：查看绑定老人今日训练情况

路径参数：

- `elderId`：老人用户 ID

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "elderId": 2,
    "hasPlan": true,
    "plan": {
      "id": 3,
      "plan_date": "2026-04-15",
      "status": "in_progress",
      "source_type": "template",
      "template_day_no": 2
    },
    "plan_item_total": 3,
    "pending_count": 1,
    "completed_count": 1,
    "skipped_count": 1,
    "total_duration_seconds": 480,
    "last_training_time": "2026-04-15T10:00:00.000Z"
  }
}
```

## 6.6 获取老人训练记录列表

- 接口：`GET /api/child/elders/:elderId/records`
- 鉴权：是，`child`
- 作用：查看绑定老人近几天训练记录

路径参数：

- `elderId`：老人用户 ID

请求参数：

- `days`：查询天数，可选，默认 `7`

返回结构与 `GET /api/elder/training-records` 一致。

## 6.7 获取老人训练记录详情

- 接口：`GET /api/child/elders/:elderId/training-records/:recordId`
- 鉴权：是，`child`
- 作用：查看绑定老人的单条训练记录详情

路径参数：

- `elderId`：老人用户 ID
- `recordId`：训练记录 ID

返回结构与 `GET /api/elder/training-records/:id` 一致。

## 6.8 获取老人训练趋势

- 接口：`GET /api/child/elders/:elderId/training-trend`
- 鉴权：是，`child`
- 作用：查看绑定老人训练趋势

路径参数：

- `elderId`：老人用户 ID

请求参数：

- `days`：查询天数，可选，默认 `7`

返回结构与 `GET /api/elder/training-trend` 一致。

## 6.9 获取老人周汇总

- 接口：`GET /api/child/elders/:elderId/weekly-summary`
- 鉴权：是，`child`
- 作用：查看绑定老人近 7 天汇总结果

路径参数：

- `elderId`：老人用户 ID

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "elderId": 2,
    "range": {
      "startDate": "2026-04-09",
      "endDate": "2026-04-15"
    },
    "summary": {
      "trainedDays": 4,
      "completedPlanDays": 3,
      "totalDurationSeconds": 1050
    }
  }
}
```

## 7. 管理员接口

## 7.1 获取管理员个人信息

- 接口：`GET /api/admin/profile`
- 鉴权：是，`admin`
- 作用：获取当前管理员个人资料

## 7.2 创建用户

- 接口：`POST /api/admin/users`
- 鉴权：是，`admin`
- 作用：管理员创建老人、子女、管理员账号

请求体：

```json
{
  "account": "elder002",
  "password": "123456",
  "user_name": "王五",
  "role": "elder",
  "gender": "男",
  "phone": "13700000000",
  "age": 70,
  "status": 1
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "用户创建成功",
  "data": {
    "id": 8,
    "account": "elder002",
    "user_name": "王五",
    "role": "elder",
    "gender": "男",
    "phone": "13700000000",
    "age": 70,
    "status": 1,
    "created_at": "2026-04-15T10:00:00.000Z",
    "updated_at": "2026-04-15T10:00:00.000Z"
  }
}
```

## 7.3 获取用户列表

- 接口：`GET /api/admin/users`
- 鉴权：是，`admin`
- 作用：按条件查询用户列表

请求参数：

- `role`
- `status`
- `account`

## 7.4 更新用户状态

- 接口：`PATCH /api/admin/users/:id/status`
- 鉴权：是，`admin`
- 作用：启用或禁用用户

路径参数：

- `id`：用户 ID

请求体：

```json
{
  "status": 0
}
```

成功响应：返回更新后的用户对象。

## 7.5 创建绑定关系

- 接口：`POST /api/admin/bindings`
- 鉴权：是，`admin`
- 作用：创建老人和子女绑定关系

请求体：

```json
{
  "elder_id": 2,
  "child_id": 3,
  "relation_type": "daughter",
  "is_primary": 1
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "绑定创建成功",
  "data": {
    "id": 5,
    "elder_id": 2,
    "child_id": 3,
    "relation_type": "daughter",
    "is_primary": 1,
    "created_at": "2026-04-15T10:10:00.000Z"
  }
}
```

## 7.6 获取绑定关系列表

- 接口：`GET /api/admin/bindings`
- 鉴权：是，`admin`
- 作用：查询绑定关系

请求参数：

- `elder_id`
- `child_id`

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 5,
      "relation_type": "daughter",
      "is_primary": 1,
      "created_at": "2026-04-15T10:10:00.000Z",
      "elder": {
        "id": 2,
        "account": "elder001",
        "user_name": "张三",
        "status": 1,
        "role": "elder"
      },
      "child": {
        "id": 3,
        "account": "child001",
        "user_name": "李四",
        "status": 1,
        "role": "child"
      }
    }
  ]
}
```

## 7.7 删除绑定关系

- 接口：`DELETE /api/admin/bindings/:id`
- 鉴权：是，`admin`
- 作用：删除指定绑定关系

路径参数：

- `id`：绑定关系 ID

成功响应示例：

```json
{
  "success": true,
  "message": "绑定删除成功",
  "data": {
    "success": true
  }
}
```

## 7.8 创建分类

- 接口：`POST /api/admin/categories`
- 鉴权：是，`admin`
- 作用：创建训练分类

请求体：

```json
{
  "name": "肩颈训练",
  "parent_id": null,
  "sort_no": 1,
  "status": 1
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "分类创建成功",
  "data": {
    "id": 10,
    "name": "肩颈训练",
    "parent_id": null,
    "sort_no": 1,
    "status": 1
  }
}
```

## 7.9 获取分类列表

- 接口：`GET /api/admin/categories`
- 鉴权：是，`admin`
- 作用：获取后台分类列表

请求参数：

- `parent_id`
- `status`

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 10,
      "name": "肩颈训练",
      "parent_id": null,
      "sort_no": 1,
      "status": 1,
      "created_at": "2026-04-15T10:20:00.000Z",
      "updated_at": "2026-04-15T10:20:00.000Z"
    }
  ]
}
```

## 7.10 创建视频

- 接口：`POST /api/admin/videos`
- 鉴权：是，`admin`
- 作用：创建训练视频并绑定分类

请求体：

```json
{
  "title": "肩颈放松训练",
  "cover_url": "https://example.com/cover.jpg",
  "video_url": "https://example.com/video.mp4",
  "description": "适合老年人的基础肩颈训练",
  "duration_seconds": 240,
  "caution_text": "动作缓慢，感到不适立即停止",
  "status": 1,
  "category_ids": [1]
}
```

成功响应：返回完整视频对象，结构与后台视频详情一致。

## 7.11 获取视频列表

- 接口：`GET /api/admin/videos`
- 鉴权：是，`admin`
- 作用：获取后台视频列表

请求参数：

- `category_id`
- `status`
- `keyword`
- `durationTag`
- `page`
- `limit`

## 7.12 获取视频详情

- 接口：`GET /api/admin/videos/:id`
- 鉴权：是，`admin`
- 作用：获取后台单个视频详情

返回结构与公共视频详情类似，但不限制 `status = 1`。

## 7.13 更新视频

- 接口：`PUT /api/admin/videos/:id`
- 鉴权：是，`admin`
- 作用：更新视频基础信息与分类关系

请求体与创建视频一致。

成功响应：返回更新后的完整视频对象。

## 7.14 更新视频状态

- 接口：`PATCH /api/admin/videos/:id/status`
- 鉴权：是，`admin`
- 作用：上架或下架视频

请求体：

```json
{
  "status": 0
}
```

## 7.15 创建模板

- 接口：`POST /api/admin/templates`
- 鉴权：是，`admin`
- 作用：创建训练模板

请求体：

```json
{
  "name": "肩颈训练 7 天模板",
  "description": "适合轻度肩颈不适老人",
  "level_tag": "basic",
  "duration_days": 7,
  "status": 1
}
```

成功响应：返回模板详情对象。

## 7.16 获取模板列表

- 接口：`GET /api/admin/templates`
- 鉴权：是，`admin`
- 作用：获取模板列表

请求参数：

- `status`
- `keyword`

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "name": "肩颈训练 7 天模板",
      "description": "适合轻度肩颈不适老人",
      "level_tag": "basic",
      "duration_days": 7,
      "status": 1,
      "created_at": "2026-04-15T10:30:00.000Z",
      "updated_at": "2026-04-15T10:30:00.000Z"
    }
  ]
}
```

## 7.17 获取模板详情

- 接口：`GET /api/admin/templates/:id`
- 鉴权：是，`admin`
- 作用：获取模板详情及模板项

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 1,
    "name": "肩颈训练 7 天模板",
    "description": "适合轻度肩颈不适老人",
    "level_tag": "basic",
    "duration_days": 7,
    "status": 1,
    "created_at": "2026-04-15T10:30:00.000Z",
    "updated_at": "2026-04-15T10:30:00.000Z",
    "items": [
      {
        "id": 7,
        "template_id": 1,
        "day_no": 1,
        "order_no": 1,
        "video_id": 4,
        "video_title": "肩颈放松训练",
        "suggested_duration_seconds": 300,
        "repeat_count": 1,
        "created_at": "2026-04-15T10:31:00.000Z"
      }
    ]
  }
}
```

## 7.18 更新模板

- 接口：`PUT /api/admin/templates/:id`
- 鉴权：是，`admin`
- 作用：更新模板基础信息

请求体：

```json
{
  "name": "肩颈训练 7 天模板",
  "description": "适合轻度肩颈不适老人",
  "level_tag": "basic",
  "duration_days": 7,
  "status": 1
}
```

## 7.19 创建模板项

- 接口：`POST /api/admin/templates/:id/items`
- 鉴权：是，`admin`
- 作用：向模板中新增某一天的训练项

路径参数：

- `id`：模板 ID

请求体：

```json
{
  "day_no": 1,
  "order_no": 1,
  "video_id": 4,
  "suggested_duration_seconds": 300,
  "repeat_count": 1
}
```

成功响应：返回最新模板详情。

## 7.20 更新模板项

- 接口：`PUT /api/admin/templates/:id/items/:itemId`
- 鉴权：是，`admin`
- 作用：更新模板项内容

路径参数：

- `id`：模板 ID
- `itemId`：模板项 ID

请求体与创建模板项一致。

## 7.21 删除模板项

- 接口：`DELETE /api/admin/templates/:id/items/:itemId`
- 鉴权：是，`admin`
- 作用：删除模板项

成功响应示例：

```json
{
  "success": true,
  "message": "模板项删除成功",
  "data": {
    "success": true
  }
}
```

## 7.22 创建计划分配

- 接口：`POST /api/admin/assignments`
- 鉴权：是，`admin`
- 作用：将模板分配给指定老人

请求体：

```json
{
  "elder_id": 2,
  "template_id": 1,
  "start_date": "2026-04-15"
}
```

成功响应示例：

```json
{
  "success": true,
  "message": "分配创建成功",
  "data": {
    "id": 1,
    "elder_id": 2,
    "template_id": 1,
    "template_name": "肩颈训练 7 天模板",
    "start_date": "2026-04-15",
    "next_day_no": 1,
    "status": 1,
    "last_plan_date": null,
    "completed_at": null,
    "created_at": "2026-04-15T10:40:00.000Z",
    "updated_at": "2026-04-15T10:40:00.000Z"
  }
}
```

## 7.23 获取计划分配列表

- 接口：`GET /api/admin/assignments`
- 鉴权：是，`admin`
- 作用：查询计划分配列表

请求参数：

- `elder_id`
- `status`

成功响应示例：

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "elder_id": 2,
      "elder_name": "张三",
      "template_id": 1,
      "template_name": "肩颈训练 7 天模板",
      "start_date": "2026-04-15",
      "next_day_no": 2,
      "status": 1,
      "last_plan_date": "2026-04-15",
      "completed_at": null,
      "created_at": "2026-04-15T10:40:00.000Z",
      "updated_at": "2026-04-15T11:00:00.000Z"
    }
  ]
}
```

## 8. 使用建议

- 这份文档现在已经包含系统级认证接口和角色化新接口，可作为整体接口文档使用
- 新接口是当前系统的正式业务接口体系
- 如果前端后续要继续扩展老人端、子女端、管理员端页面，建议优先接新接口
- 新接口已经按角色边界拆分，前后端协作成本更低
- 旧接口可继续保留给历史页面使用，但不建议继续往旧接口追加复杂业务
