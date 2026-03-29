<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, Eye, EyeOff, LogIn, UserPlus } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";

const router = useRouter();
const isLogin = ref(true);
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

const formData = ref({
  account: "",
  password: "",
  user_name: "",
  role: "elder",
});

async function handleSubmit() {
  loading.value = true;
  error.value = "";

  try {
    if (isLogin.value) {
      const response = await api.login(formData.value.account, formData.value.password);
      if (response.success && response.data) {
        api.setToken(response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        router.push("/");
      } else {
        error.value = response.error || "登录失败";
      }
    } else {
      const response = await api.register(
        formData.value.account,
        formData.value.password,
        formData.value.user_name,
        formData.value.role
      );
      if (response.success) {
        isLogin.value = true;
        error.value = "注册成功，请登录";
      } else {
        error.value = response.error || "注册失败";
      }
    }
  } catch (err) {
    error.value = "网络错误，请稍后重试";
  } finally {
    loading.value = false;
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value;
  error.value = "";
}

function goBack() {
  router.back();
}

function skipLogin() {
  router.push("/");
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <div class="flex items-center justify-between">
          <Button variant="ghost" size="icon" @click="goBack">
            <ArrowLeft class="h-5 w-5" />
          </Button>
          <CardTitle>{{ isLogin ? "登录" : "注册" }}</CardTitle>
          <div class="w-9" />
        </div>
        <CardDescription>
          {{ isLogin ? "请输入账号密码登录" : "请填写信息注册新账号" }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="error" class="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
          {{ error }}
        </div>

        <div class="space-y-2">
          <Label for="account">账号</Label>
          <Input
            id="account"
            v-model="formData.account"
            placeholder="请输入账号"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="password">密码</Label>
          <div class="relative">
            <Input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              required
            />
            <Button
              variant="ghost"
              size="icon"
              class="absolute right-0 top-0 h-full px-3 text-muted-foreground"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="showPassword" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div v-if="!isLogin" class="space-y-2">
          <Label for="user_name">姓名</Label>
          <Input
            id="user_name"
            v-model="formData.user_name"
            placeholder="请输入姓名"
            required
          />
        </div>

        <div v-if="!isLogin" class="space-y-2">
          <Label>角色</Label>
          <div class="flex gap-2">
            <Button
              variant="outline"
              :class="{ 'bg-primary text-primary-foreground': formData.role === 'elder' }"
              @click="formData.role = 'elder'"
            >
              老人
            </Button>
            <Button
              variant="outline"
              :class="{ 'bg-primary text-primary-foreground': formData.role === 'child' }"
              @click="formData.role = 'child'"
            >
              子女
            </Button>
          </div>
        </div>

        <Button
          class="w-full"
          :disabled="loading"
          @click="handleSubmit"
        >
          <LogIn v-if="isLogin" class="mr-2 h-4 w-4" />
          <UserPlus v-else class="mr-2 h-4 w-4" />
          {{ isLogin ? "登录" : "注册" }}
        </Button>

        <Button
          variant="ghost"
          class="w-full"
          @click="toggleMode"
        >
          {{ isLogin ? "没有账号？立即注册" : "已有账号？立即登录" }}
        </Button>
        
        <Button
          variant="outline"
          class="w-full mt-2"
          @click="skipLogin"
        >
          跳过登录，继续浏览
        </Button>
      </CardContent>
    </Card>
  </main>
</template>