<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { Activity, Calendar, Home, ListVideo } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "首页", path: "/", icon: Home },
  { name: "训练分类", path: "/training-category", icon: ListVideo },
  { name: "今日计划", path: "/today-plan", icon: Calendar },
  { name: "训练记录", path: "/training-record", icon: Activity },
];
</script>

<template>
  <div class="min-h-screen bg-background">
    <header
      class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <Activity class="h-6 w-6 text-primary" />
          <span class="font-semibold">康复训练</span>
        </div>
        <nav class="flex items-center gap-1">
          <Button v-for="item in navItems" :key="item.path" variant="default" size="sm" as-child>
            <RouterLink :to="item.path" class="flex items-center gap-2">
              <component :is="item.icon" class="h-4 w-4" />
              <span class="hidden sm:inline">{{ item.name }}</span>
            </RouterLink>
          </Button>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>
