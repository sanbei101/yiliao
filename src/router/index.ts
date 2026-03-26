import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import TrainingCategory from "@/views/TrainingCategory.vue";
import TrainingDetail from "@/views/TrainingDetail.vue";
import TodayPlan from "@/views/TodayPlan.vue";
import TrainingRecord from "@/views/TrainingRecord.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/training-category",
      name: "training-category",
      component: TrainingCategory,
    },
    {
      path: "/training/:id",
      name: "training-detail",
      component: TrainingDetail,
    },
    {
      path: "/today-plan",
      name: "today-plan",
      component: TodayPlan,
    },
    {
      path: "/training-record",
      name: "training-record",
      component: TrainingRecord,
    },
  ],
});

export default router;
