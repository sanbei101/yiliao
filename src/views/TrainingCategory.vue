<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowLeft, ChevronRight, Clock, Filter } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const router = useRouter();

const categories = [
  { id: "arm", name: "手臂训练", description: "针对上肢力量和柔韧性的训练", count: 12 },
  { id: "leg", name: "腿脚训练", description: "针对下肢力量和平衡的训练", count: 15 },
  { id: "joint", name: "关节舒缓", description: "关节活动度和舒缓放松训练", count: 8 },
  { id: "sit", name: "坐着练", description: "适合坐姿完成的训练动作", count: 6 },
  { id: "stand", name: "站着练", description: "站立姿势的训练动作", count: 10 },
  { id: "5min", name: "5分钟训练", description: "快速完成的短时训练", count: 20 },
  { id: "10min", name: "10分钟训练", description: "中等时长的训练计划", count: 18 },
];

const trainings = [
  {
    id: "1",
    title: "肩颈活动训练",
    category: "关节舒缓",
    duration: "10分钟",
    difficulty: "入门",
    description: "通过轻柔的颈部旋转和肩部活动,缓解肩颈僵硬和不适。",
  },
  {
    id: "2",
    title: "手臂拉伸训练",
    category: "手臂训练",
    duration: "8分钟",
    difficulty: "入门",
    description: "针对手臂各部位的拉伸动作,提升柔韧性和活动范围。",
  },
  {
    id: "3",
    title: "腿部力量训练",
    category: "腿脚训练",
    duration: "15分钟",
    difficulty: "进阶",
    description: "增强腿部肌肉力量,改善行走稳定性和平衡能力。",
  },
  {
    id: "4",
    title: "髋关节活动训练",
    category: "关节舒缓",
    duration: "12分钟",
    difficulty: "入门",
    description: "改善髋关节活动度,缓解久坐带来的髋部不适。",
  },
  {
    id: "5",
    title: "坐姿核心训练",
    category: "坐着练",
    duration: "10分钟",
    difficulty: "入门",
    description: "在坐姿状态下锻炼核心肌群,增强躯干稳定性。",
  },
  {
    id: "6",
    title: "站立平衡训练",
    category: "站着练",
    duration: "8分钟",
    difficulty: "进阶",
    description: "提升站立平衡能力,降低跌倒风险。",
  },
];

const selectedCategory = "all";

function goBack() {
  router.back();
}

function goToTraining(id: string) {
  router.push(`/training/${id}`);
}

function selectCategory(id: string) {
  console.log("selectCategory", id);
}
</script>

<template>
  <main class="mx-auto w-[calc(100%-24px)] max-w-7xl py-6 sm:w-[calc(100%-48px)] sm:py-12">
    <div class="mb-6 flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="goBack">
        <ArrowLeft class="h-5 w-5" />
      </Button>
      <h1 class="text-2xl font-semibold tracking-tight">训练分类</h1>
    </div>

    <section class="mb-8">
      <div class="mb-4 flex items-center gap-2">
        <Filter class="h-4 w-4 text-muted-foreground" />
        <span class="text-sm font-medium">筛选分类</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="category in categories"
          :key="category.id"
          :variant="selectedCategory === category.id ? 'default' : 'outline'"
          class="cursor-pointer px-3 py-1"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
          <span class="ml-1 text-xs opacity-70">({{ category.count }})</span>
        </Badge>
      </div>
    </section>

    <section>
      <div class="mb-4">
        <h2 class="text-xl font-semibold tracking-tight">全部训练</h2>
        <p class="text-sm text-muted-foreground">共 {{ trainings.length }} 个训练项目</p>
      </div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="training in trainings"
          :key="training.id"
          class="cursor-pointer"
          @click="goToTraining(training.id)"
        >
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <Badge variant="secondary">{{ training.category }}</Badge>
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock class="h-3 w-3" />
                {{ training.duration }}
              </div>
            </div>
            <CardTitle class="mt-2">{{ training.title }}</CardTitle>
            <CardDescription>{{ training.description }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-2">
            <div class="flex items-center justify-between">
              <Badge :variant="training.difficulty === '入门' ? 'default' : 'secondary'">
                {{ training.difficulty }}
              </Badge>
              <Button variant="ghost" size="sm">
                开始训练
                <ChevronRight class="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </main>
</template>
