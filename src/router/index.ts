import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import TrainingCategory from "@/views/TrainingCategory.vue";
import TrainingDetail from "@/views/TrainingDetail.vue";
import TodayPlan from "@/views/TodayPlan.vue";
import TrainingRecord from "@/views/TrainingRecord.vue";
import Login from "@/views/Login.vue";
import Profile from "@/views/Profile.vue";
import Admin from "@/views/Admin.vue";
import { api } from "@/services/api";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/profile",
      name: "profile",
      component: Profile,
      meta: { requiresAuth: true },
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
    {
      path: "/admin",
      name: "admin",
      component: Admin,
      // meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  const isLoggedIn = !!api.getToken();

  if (requiresAuth && !isLoggedIn) {
    next("/login");
  } else {
    next();
  }
});

export default router;
