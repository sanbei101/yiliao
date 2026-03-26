<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  Timer,
  XCircle,
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const router = useRouter();

const stats = {
  totalDays: 12,
  totalMinutes: 180,
  currentStreak: 5,
  completionRate: 85,
};

const records = [
  {
    date: "2026年3月26日",
    dayOfWeek: "周四",
    trainings: [
      { title: "肩颈活动训练", duration: "10分钟", completed: true },
      { title: "手臂拉伸训练", duration: "8分钟", completed: true },
    ],
  },
  {
    date: "2026年3月25日",
    dayOfWeek: "周三",
    trainings: [
      { title: "腿部力量训练", duration: "15分钟", completed: true },
      { title: "全身放松训练", duration: "5分钟", completed: false },
    ],
  },
  {
    date: "2026年3月24日",
    dayOfWeek: "周二",
    trainings: [
      { title: "肩颈活动训练", duration: "10分钟", completed: true },
      { title: "手臂拉伸训练", duration: "8分钟", completed: true },
      { title: "腿部力量训练", duration: "15分钟", completed: true },
    ],
  },
  {
    date: "2026年3月23日",
    dayOfWeek: "周一",
    trainings: [{ title: "关节舒缓训练", duration: "12分钟", completed: true }],
  },
  {
    date: "2026年3月22日",
    dayOfWeek: "周日",
    trainings: [],
  },
  {
    date: "2026年3月21日",
    dayOfWeek: "周六",
    trainings: [
      { title: "坐姿核心训练", duration: "10分钟", completed: true },
      { title: "站立平衡训练", duration: "8分钟", completed: true },
    ],
  },
];

function goBack() {
  router.back();
}

function getTotalMinutes(day: (typeof records)[0]): number {
  return day.trainings.reduce((sum, t) => {
    const match = t.duration.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);
}
</script>

<template>
  <main class="mx-auto w-[calc(100%-24px)] max-w-7xl py-6 sm:w-[calc(100%-48px)] sm:py-12">
    <div class="mb-6 flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="goBack">
        <ArrowLeft class="h-5 w-5" />
      </Button>
      <h1 class="text-2xl font-semibold tracking-tight">训练记录</h1>
    </div>

    <section class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent class="flex items-center gap-3 p-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Calendar class="h-5 w-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-semibold">{{ stats.totalDays }}</p>
            <p class="text-xs text-muted-foreground">训练天数</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="flex items-center gap-3 p-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Timer class="h-5 w-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-semibold">{{ stats.totalMinutes }}</p>
            <p class="text-xs text-muted-foreground">总训练分钟</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="flex items-center gap-3 p-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
            <Flame class="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p class="text-2xl font-semibold">{{ stats.currentStreak }}</p>
            <p class="text-xs text-muted-foreground">连续训练天数</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="flex items-center gap-3 p-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <Activity class="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p class="text-2xl font-semibold">{{ stats.completionRate }}%</p>
            <p class="text-xs text-muted-foreground">完成率</p>
          </div>
        </CardContent>
      </Card>
    </section>

    <Separator class="my-6" />

    <section>
      <div class="mb-4">
        <h2 class="text-xl font-semibold tracking-tight">历史记录</h2>
        <p class="text-sm text-muted-foreground">最近的训练历史</p>
      </div>
      <div class="grid gap-4">
        <Card v-for="record in records" :key="record.date">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CardTitle class="text-base">{{ record.date }}</CardTitle>
                <Badge variant="outline">{{ record.dayOfWeek }}</Badge>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock class="h-4 w-4" />
                {{ getTotalMinutes(record) }}分钟
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="record.trainings.length === 0" class="py-2">
              <p class="text-sm text-muted-foreground">当日无训练记录</p>
            </div>
            <div v-else class="grid gap-2">
              <div
                v-for="training in record.trainings"
                :key="training.title"
                class="flex items-center justify-between rounded-lg border p-3"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full"
                    :class="training.completed ? 'bg-primary/10' : 'bg-muted'"
                  >
                    <CheckCircle v-if="training.completed" class="h-4 w-4 text-primary" />
                    <XCircle v-else class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span class="text-sm" :class="training.completed ? '' : 'text-muted-foreground'">
                    {{ training.title }}
                  </span>
                </div>
                <span class="text-sm text-muted-foreground">{{ training.duration }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </main>
</template>
