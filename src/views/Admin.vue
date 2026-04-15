<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Plus, Search, Trash2, Edit2, Eye, EyeOff, Users, Film, Folder, Link2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";

const activeTab = ref<'video' | 'category' | 'user' | 'binding'>('video');

// 视频管理
const videos = ref<any[]>([]);
const videoDialog = ref(false);
const editingVideo = ref<any>(null);
const videoForm = ref({ title: '', video_url: '', cover_url: '', description: '', duration_seconds: 0, caution_text: '', category_ids: [] as number[], status: 1 });
const categories = ref<any[]>([]);
const searchKeyword = ref('');

// 分类管理
const categoryDialog = ref(false);
const categoryForm = ref({ name: '', parent_id: undefined as number | undefined, sort_no: 0, status: 1 });

// 用户管理
const users = ref<any[]>([]);
const userDialog = ref(false);
const userForm = ref({ account: '', password: '', user_name: '', role: 'elder', gender: '', phone: '', age: undefined as number | undefined, status: 1 });

// 绑定管理
const bindings = ref<any[]>([]);
const bindingDialog = ref(false);
const bindingForm = ref({ elder_id: undefined as number | undefined, child_id: undefined as number | undefined, relation_type: 'daughter', is_primary: 1 });
const elders = ref<any[]>([]);
const children = ref<any[]>([]);

async function loadVideos() {
  const res = await api.getAdminVideos({ keyword: searchKeyword.value || undefined });
  if (res.success) videos.value = res.data || [];
}

async function loadCategories() {
  const res = await api.getAdminCategories({});
  if (res.success) categories.value = res.data || [];
}

async function loadUsers() {
  const res = await api.getAdminUsers({});
  if (res.success) users.value = res.data || [];
}

async function loadBindings() {
  const res = await api.getAdminBindings({});
  if (res.success) bindings.value = res.data || [];
}

async function loadEldersAndChildren() {
  const [elderRes, childRes] = await Promise.all([
    api.getAdminUsers({ role: 'elder' }),
    api.getAdminUsers({ role: 'child' })
  ]);
  if (elderRes.success) elders.value = elderRes.data || [];
  if (childRes.success) children.value = childRes.data || [];
}

async function openVideoDialog(video?: any) {
  await loadCategories();
  if (video) {
    editingVideo.value = video;
    videoForm.value = { title: video.title, video_url: video.video_url, cover_url: video.cover_url || '', description: video.description || '', duration_seconds: video.duration_seconds || 0, caution_text: video.caution_text || '', category_ids: video.categories?.map((c: any) => c.id) || [], status: video.status };
  } else {
    editingVideo.value = null;
    videoForm.value = { title: '', video_url: '', cover_url: '', description: '', duration_seconds: 0, caution_text: '', category_ids: [], status: 1 };
  }
  videoDialog.value = true;
}

async function saveVideo() {
  if (editingVideo.value) {
    await api.updateAdminVideo(editingVideo.value.id, videoForm.value);
  } else {
    await api.createAdminVideo(videoForm.value);
  }
  videoDialog.value = false;
  loadVideos();
}

async function toggleVideoStatus(video: any) {
  await api.updateAdminVideoStatus(video.id, video.status === 1 ? 0 : 1);
  loadVideos();
}

async function saveCategory() {
  await api.createAdminCategory(categoryForm.value);
  categoryDialog.value = false;
  loadCategories();
}

async function saveUser() {
  await api.createAdminUser(userForm.value);
  userDialog.value = false;
  loadUsers();
}

async function toggleUserStatus(user: any) {
  await api.updateAdminUserStatus(user.id, user.status === 1 ? 0 : 1);
  loadUsers();
}

async function saveBinding() {
  if (!bindingForm.value.elder_id || !bindingForm.value.child_id) {
    alert('请选择老人和子女');
    return;
  }
  await api.createAdminBinding(bindingForm.value as { elder_id: number; child_id: number; relation_type: string; is_primary?: number });
  bindingDialog.value = false;
  loadBindings();
}

async function deleteBinding(id: number) {
  if (confirm('确定删除此绑定关系？')) {
    await api.deleteAdminBinding(id);
    loadBindings();
  }
}

onMounted(() => {
  loadVideos();
  loadCategories();
  loadUsers();
  loadBindings();
  loadEldersAndChildren();
});
</script>

<template>
  <main class="mx-auto w-[calc(100%-24px)] max-w-7xl py-6 sm:w-[calc(100%-48px)] sm:py-12">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold tracking-tight">管理后台</h1>
    </div>

    <!-- Tab 导航 -->
    <div class="mb-6 flex gap-2 border-b">
      <button @click="activeTab = 'video'"
        :class="['px-4 py-2 border-b-2 -mb-px transition-colors', activeTab === 'video' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground']">
        <Film class="inline mr-2 h-4 w-4" />视频管理
      </button>
      <button @click="activeTab = 'category'"
        :class="['px-4 py-2 border-b-2 -mb-px transition-colors', activeTab === 'category' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground']">
        <Folder class="inline mr-2 h-4 w-4" />分类管理
      </button>
      <button @click="activeTab = 'user'"
        :class="['px-4 py-2 border-b-2 -mb-px transition-colors', activeTab === 'user' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground']">
        <Users class="inline mr-2 h-4 w-4" />用户管理
      </button>
      <button @click="activeTab = 'binding'"
        :class="['px-4 py-2 border-b-2 -mb-px transition-colors', activeTab === 'binding' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground']">
        <Link2 class="inline mr-2 h-4 w-4" />绑定管理
      </button>
    </div>

    <!-- 视频管理 -->
    <div v-if="activeTab === 'video'">
      <div class="mb-4 flex gap-2">
        <Input v-model="searchKeyword" placeholder="搜索视频标题..." class="max-w-xs" @keyup.enter="loadVideos" />
        <Button @click="loadVideos">
          <Search class="h-4 w-4 mr-1" />搜索
        </Button>
        <Button @click="openVideoDialog()">
          <Plus class="h-4 w-4 mr-1" />新增视频
        </Button>
      </div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="video in videos" :key="video.id">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <Badge :variant="video.status === 1 ? 'default' : 'secondary'">{{ video.status === 1 ? '已上架' : '已下架' }}
              </Badge>
              <div class="flex gap-1">
                <Button variant="ghost" size="icon" @click="toggleVideoStatus(video)">
                  <EyeOff v-if="video.status === 1" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" @click="openVideoDialog(video)">
                  <Edit2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardTitle class="mt-2 text-lg">{{ video.title }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="aspect-video bg-muted rounded-md mb-2 overflow-hidden">
              <img v-if="video.cover_url" :src="video.cover_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground text-sm">无封面</div>
            </div>
            <p class="text-sm text-muted-foreground line-clamp-2">{{ video.description || '暂无描述' }}</p>
            <div class="mt-2 flex gap-1 flex-wrap">
              <Badge v-for="cat in video.categories" :key="cat.id" variant="outline" class="text-xs">{{ cat.name }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 分类管理 -->
    <div v-if="activeTab === 'category'">
      <div class="mb-4">
        <Button @click="categoryDialog = true; categoryForm = { name: '', parent_id: undefined, sort_no: 0, status: 1 }">
          <Plus class="h-4 w-4 mr-1" />新增分类
        </Button>
      </div>
      <Card>
        <CardContent class="p-0">
          <div class="divide-y">
            <div v-for="cat in categories" :key="cat.id" class="flex items-center justify-between p-4">
              <div>
                <span class="font-medium">{{ cat.name }}</span>
                <Badge :variant="cat.status === 1 ? 'default' : 'secondary'" class="ml-2">{{ cat.status === 1 ? '启用' :
                  '禁用' }}</Badge>
              </div>
              <span class="text-sm text-muted-foreground">排序: {{ cat.sort_no }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 用户管理 -->
    <div v-if="activeTab === 'user'">
      <div class="mb-4">
        <Button
          @click="userDialog = true; userForm = { account: '', password: '', user_name: '', role: 'elder', gender: '', phone: '', age: undefined, status: 1 }">
          <Plus class="h-4 w-4 mr-1" />新增用户
        </Button>
      </div>
      <Card>
        <CardContent class="p-0">
          <div class="divide-y">
            <div v-for="user in users" :key="user.id" class="flex items-center justify-between p-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {{ user.user_name?.[0] || user.account?.[0] || '?' }}</div>
                <div>
                  <div class="font-medium">{{ user.user_name || user.account }}</div>
                  <div class="text-sm text-muted-foreground">{{ user.account }} · {{ user.role }} · {{ user.age || '-'
                    }}岁</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="user.status === 1 ? 'default' : 'secondary'">{{ user.status === 1 ? '正常' : '禁用' }}
                </Badge>
                <Button variant="ghost" size="icon" @click="toggleUserStatus(user)">
                  <EyeOff v-if="user.status === 1" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 绑定管理 -->
    <div v-if="activeTab === 'binding'">
      <div class="mb-4">
        <Button
          @click="bindingDialog = true; bindingForm = { elder_id: undefined, child_id: undefined, relation_type: 'daughter', is_primary: 1 }">
          <Plus class="h-4 w-4 mr-1" />新增绑定
        </Button>
      </div>
      <Card>
        <CardContent class="p-0">
          <div class="divide-y">
            <div v-for="b in bindings" :key="b.id" class="flex items-center justify-between p-4">
              <div class="flex items-center gap-4">
                <span class="font-medium">{{ b.elder?.user_name || b.elder?.account }}</span>
                <span class="text-muted-foreground">→</span>
                <span>{{ b.child?.user_name || b.child?.account }}</span>
                <Badge variant="outline">{{ b.relation_type }}</Badge>
                <Badge v-if="b.is_primary" variant="default">主要</Badge>
              </div>
              <Button variant="ghost" size="icon" @click="deleteBinding(b.id)">
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 视频弹窗 -->
    <div v-if="videoDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="videoDialog = false">
      <Card class="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{{ editingVideo ? '编辑视频' : '新增视频' }}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label>标题</Label>
            <Input v-model="videoForm.title" placeholder="视频标题" />
          </div>
          <div class="grid gap-2">
            <Label>视频URL（B站链接）</Label>
            <Input v-model="videoForm.video_url" placeholder="https://www.bilibili.com/video/..." />
          </div>
          <div class="grid gap-2">
            <Label>封面URL</Label>
            <Input v-model="videoForm.cover_url" placeholder="https://..." />
          </div>
          <div class="grid gap-2">
            <Label>描述</Label>
            <Input v-model="videoForm.description" placeholder="视频描述" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>时长（秒）</Label>
              <Input v-model.number="videoForm.duration_seconds" type="number" />
            </div>
            <div class="grid gap-2">
              <Label>注意事项</Label>
              <Input v-model="videoForm.caution_text" placeholder="训练注意" />
            </div>
          </div>
          <div class="grid gap-2">
            <Label>分类</Label>
            <div class="flex flex-wrap gap-2">
              <Badge v-for="cat in categories" :key="cat.id"
                :variant="videoForm.category_ids.includes(cat.id) ? 'default' : 'outline'" class="cursor-pointer"
                @click="videoForm.category_ids.includes(cat.id) ? videoForm.category_ids = videoForm.category_ids.filter(id => id !== cat.id) : videoForm.category_ids.push(cat.id)">
                {{ cat.name }}</Badge>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <Button variant="outline" @click="videoDialog = false">取消</Button>
            <Button @click="saveVideo">保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 分类弹窗 -->
    <div v-if="categoryDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="categoryDialog = false">
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle>新增分类</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label>名称</Label>
            <Input v-model="categoryForm.name" placeholder="分类名称" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>排序</Label>
              <Input v-model.number="categoryForm.sort_no" type="number" />
            </div>
            <div class="grid gap-2">
              <Label>状态</Label>
              <select v-model="categoryForm.status"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option :value="1">启用</option>
                <option :value="0">禁用</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <Button variant="outline" @click="categoryDialog = false">取消</Button>
            <Button @click="saveCategory">保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 用户弹窗 -->
    <div v-if="userDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="userDialog = false">
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle>新增用户</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label>账号</Label>
            <Input v-model="userForm.account" placeholder="登录账号" />
          </div>
          <div class="grid gap-2">
            <Label>密码</Label>
            <Input v-model="userForm.password" type="password" placeholder="登录密码" />
          </div>
          <div class="grid gap-2">
            <Label>姓名</Label>
            <Input v-model="userForm.user_name" placeholder="用户姓名" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>角色</Label>
              <select v-model="userForm.role"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="elder">老人</option>
                <option value="child">子女</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div class="grid gap-2">
              <Label>性别</Label>
              <select v-model="userForm.gender"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">未设置</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>手机</Label>
              <Input v-model="userForm.phone" placeholder="手机号" />
            </div>
            <div class="grid gap-2">
              <Label>年龄</Label>
              <Input v-model.number="userForm.age" type="number" placeholder="年龄" />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <Button variant="outline" @click="userDialog = false">取消</Button>
            <Button @click="saveUser">保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 绑定弹窗 -->
    <div v-if="bindingDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="bindingDialog = false">
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle>新增绑定</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label>老人</Label>
            <select v-model="bindingForm.elder_id"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option :value="null">选择老人</option>
              <option v-for="e in elders" :key="e.id" :value="e.id">{{ e.user_name || e.account }}</option>
            </select>
          </div>
          <div class="grid gap-2">
            <Label>子女</Label>
            <select v-model="bindingForm.child_id"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option :value="null">选择子女</option>
              <option v-for="c in children" :key="c.id" :value="c.id">{{ c.user_name || c.account }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>关系</Label>
              <select v-model="bindingForm.relation_type"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="daughter">女儿</option>
                <option value="son">儿子</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="grid gap-2">
              <Label>是否主要</Label>
              <select v-model="bindingForm.is_primary"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option :value="1">是</option>
                <option :value="0">否</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <Button variant="outline" @click="bindingDialog = false">取消</Button>
            <Button @click="saveBinding">保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
