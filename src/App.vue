<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from "vue-router";
import { Activity, Calendar, Home, ListVideo } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "首页", path: "/", icon: Home },
  { name: "训练分类", path: "/training-category", icon: ListVideo },
  { name: "今日计划", path: "/today-plan", icon: Calendar },
  { name: "训练记录", path: "/training-record", icon: Activity },
];
const router = useRouter();
function goToHome() {
  router.push("/");
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header
      class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <Activity class="h-6 w-6 text-primary" />
          <span class="cursor-pointer font-semibold" @click="goToHome">康复训练</span>
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

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
