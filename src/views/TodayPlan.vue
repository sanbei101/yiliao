<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowLeft, CheckCircle, Circle, Clock, Play } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const router = useRouter();

const todayPlan = {
  date: "2026年3月26日",
  totalDuration: "35分钟",
  completedCount: 1,
  totalCount: 4,
  progress: 25,
};

const trainingList = [
  {
    id: "1",
    title: "肩颈活动训练",
    duration: "10分钟",
    order: 1,
    completed: true,
  },
  {
    id: "2",
    title: "手臂拉伸训练",
    duration: "8分钟",
    order: 2,
    completed: false,
    current: true,
  },
  {
    id: "3",
    title: "腿部力量训练",
    duration: "15分钟",
    order: 3,
    completed: false,
  },
  {
    id: "4",
    title: "全身放松训练",
    duration: "5分钟",
    order: 4,
    completed: false,
  },
];

function goBack() {
  router.back();
}

function goToTraining(id: string) {
  router.push(`/training/${id}`);
}

function startNextTraining() {
  const next = trainingList.find((t) => !t.completed);
  if (next) {
    router.push(`/training/${next.id}`);
  }
}
</script>

<template>
  <main class="mx-auto w-[calc(100%-24px)] max-w-7xl py-6 sm:w-[calc(100%-48px)] sm:py-12">
    <div class="mb-6 flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="goBack">
        <ArrowLeft class="h-5 w-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">今日计划</h1>
        <p class="text-sm text-muted-foreground">{{ todayPlan.date }}</p>
      </div>
    </div>

    <Card class="mb-6">
      <CardHeader class="pb-2">
        <div class="flex items-center justify-between">
          <CardTitle>今日训练进度</CardTitle>
          <Badge variant="outline">
            {{ todayPlan.completedCount }}/{{ todayPlan.totalCount }} 完成
          </Badge>
        </div>
      </CardHeader>
      <CardContent class="grid gap-4">
        <Progress :value="todayPlan.progress" />
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">总时长: {{ todayPlan.totalDuration }}</span>
          <span class="font-medium">{{ todayPlan.progress }}%</span>
        </div>
      </CardContent>
    </Card>

    <section>
      <div class="mb-4">
        <h2 class="text-xl font-semibold tracking-tight">训练顺序</h2>
        <p class="text-sm text-muted-foreground">按顺序完成训练效果更佳</p>
      </div>
      <div class="grid gap-3">
        <Card
          v-for="training in trainingList"
          :key="training.id"
          class="cursor-pointer transition-colors hover:bg-accent"
          :class="training.current ? 'border-primary' : ''"
          @click="goToTraining(training.id)"
        >
          <CardContent class="flex items-center justify-between p-4">
            <div class="flex items-center gap-4">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full"
                :class="
                  training.completed
                    ? 'bg-primary/10'
                    : training.current
                      ? 'bg-primary/20'
                      : 'bg-muted'
                "
              >
                <CheckCircle v-if="training.completed" class="h-5 w-5 text-primary" />
                <Circle v-else-if="training.current" class="h-5 w-5 text-primary" />
                <span v-else class="text-sm font-medium">{{ training.order }}</span>
              </div>
              <div class="grid gap-0.5">
                <p
                  class="font-medium"
                  :class="training.completed ? 'text-muted-foreground line-through' : ''"
                >
                  {{ training.title }}
                </p>
                <p class="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock class="h-3 w-3" />
                  {{ training.duration }}
                  <Badge v-if="training.current" variant="default" class="ml-2"> 进行中 </Badge>
                  <Badge v-else-if="training.completed" variant="default" class="ml-2">
                    已完成
                  </Badge>
                </p>
              </div>
            </div>
            <Button v-if="!training.completed" size="sm" @click.stop="goToTraining(training.id)">
              <Play class="mr-1 h-4 w-4" />
              {{ training.current ? "继续" : "开始" }}
            </Button>
            <CheckCircle v-else class="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>
    </section>

    <div v-if="!trainingList.every((t) => t.completed)" class="mt-6">
      <Button class="w-full" size="lg" @click="startNextTraining">
        <Play class="mr-2 h-5 w-5" />
        {{ trainingList.find((t) => t.current) ? "继续当前训练" : "开始下一个训练" }}
      </Button>
    </div>

    <div v-else class="mt-6">
      <Card class="border-primary/50 bg-primary/5">
        <CardContent class="flex items-center justify-center gap-2 p-6 text-center">
          <CheckCircle class="h-6 w-6 text-primary" />
          <div>
            <p class="font-medium">恭喜!今日训练已全部完成</p>
            <p class="text-sm text-muted-foreground">继续保持,明天见</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
