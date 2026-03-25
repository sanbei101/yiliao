<script setup lang="ts">
import { Activity, ArrowRight, HeartPulse, ShieldPlus, Video } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const services = [
  {
    title: "术后功能恢复",
    description: "面向骨科、神经康复及长期卧床患者,提供循序渐进的动作训练与生活能力重建。",
    icon: Activity,
  },
  {
    title: "慢病运动指导",
    description: "结合心肺耐力、平衡训练与日常活动建议,帮助患者建立长期可执行的康复节奏。",
    icon: HeartPulse,
  },
  {
    title: "个体化评估跟踪",
    description: "从初筛评估、康复计划到阶段复盘,持续记录变化并及时调整训练强度。",
    icon: ShieldPlus,
  },
];

const videos = ["肩颈活动训练演示", "步态与平衡训练演示", "居家拉伸放松演示"];
</script>

<template>
  <main class="mx-auto w-[calc(100%-24px)] max-w-7xl py-6 sm:w-[calc(100%-48px)] sm:py-12">
    <section class="mb-10">
      <Card class="overflow-hidden">
        <CardHeader class="pb-0">
          <div class="grid max-w-3xl gap-4 sm:gap-5">
            <Badge variant="secondary">康复医疗</Badge>
            <CardTitle class="text-3xl leading-tight tracking-tight sm:text-5xl sm:leading-tight">
              更清晰的康复路径
              <br />
              更安心的恢复过程
            </CardTitle>
            <CardDescription class="max-w-2xl text-sm leading-7 sm:text-base">
              围绕术后恢复、慢病运动干预和居家训练支持,提供简洁明确的康复医疗介绍与演示内容,帮助患者和家属快速理解治疗重点。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent class="grid gap-5">
          <div class="flex flex-wrap gap-3">
            <Button size="lg">
              预约康复评估
              <ArrowRight />
            </Button>
            <Button variant="outline" size="lg">查看训练演示</Button>
          </div>
          <div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">覆盖术后康复</Badge>
            <Badge variant="outline">慢病训练指导</Badge>
            <Badge variant="outline">居家视频演示</Badge>
          </div>
        </CardContent>
      </Card>
    </section>

    <section class="mb-10">
      <div class="mb-5 grid gap-3">
        <Badge variant="outline">核心服务</Badge>
        <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">聚焦常见康复需求</h2>
        <p class="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          内容保持精简,便于快速浏览重点信息。
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <Card v-for="service in services" :key="service.title" class="h-full">
          <CardHeader>
            <component :is="service.icon" class="h-5 w-5 text-primary" />
            <CardTitle>{{ service.title }}</CardTitle>
            <CardDescription>{{ service.description }}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>

    <Separator />

    <section class="mt-10">
      <div class="mb-5 grid gap-3">
        <Badge variant="outline">视频演示</Badge>
        <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">训练内容占位展示</h2>
        <p class="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          先使用 Skeleton 占位,后续可以直接替换为真实视频封面或播放器。
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <Card v-for="title in videos" :key="title" class="h-full">
          <CardHeader>
            <div class="flex items-center gap-2.5">
              <Video class="h-5 w-5 text-primary" />
              <CardTitle>{{ title }}</CardTitle>
            </div>
            <CardDescription>适合放置分步骤训练说明或短视频入口。</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-4">
            <Skeleton class="aspect-video w-full rounded-xl" />
            <div class="grid gap-2.5">
              <Skeleton class="h-3.5 w-1/2" />
              <Skeleton class="h-3.5 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost">即将上线</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  </main>
</template>
