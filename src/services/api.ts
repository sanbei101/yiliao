const API_BASE_URL = "http://62.234.163.176:3000/api";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type User = {
  id: number;
  account: string;
  user_name: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type TrainingCategory = {
  id: number;
  name: string;
  parent_id: number | null;
  count: number;
};

export type TrainingVideo = {
  id: number;
  title: string;
  cover_url: string;
  video_url: string;
  description: string;
  duration_seconds: number;
  duration: string;
  categories?: { id: number; name: string }[];
};

export type TodayPlanItem = {
  id: string;
  title: string;
  duration: string;
  order: number;
  completed: boolean;
  current: boolean;
};

export type TodayPlan = {
  date: string;
  totalDuration: string;
  completedCount: number;
  totalCount: number;
  progress: number;
  trainingList: TodayPlanItem[];
};

export type TrainingRecord = {
  id: number;
  title: string;
  date: string;
  duration: string;
  completed: boolean;
  actualDuration?: number;
  targetDuration?: number;
  category?: string;
};

export type TrainingRecordStats = {
  todayTotalMinutes: number;
  todayCompletionRate: number;
  todayDurationPercentage: Array<{
    title: string;
    duration: number;
    percentage: number;
  }>;
  targetMinutesPerDay: number;
};

export type TrainingRecordResponse = {
  records: Array<{
    date: string;
    dayOfWeek: string;
    trainings: TrainingRecord[];
  }>;
  stats: TrainingRecordStats;
};

export type UserProfile = {
  id: number;
  account: string;
  user_name: string;
  role: string;
  gender?: string;
  phone?: string;
  age?: number;
  created_at?: string;
};

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "请求失败");
      }

      return data;
    } catch (error) {
      console.error("API请求错误:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  async login(account: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ account, password }),
    });

    if (response.success && response.data) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  }

  async register(
    account: string,
    password: string,
    user_name: string,
    role: string,
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ account, password, user_name, role }),
    });
  }

  async getTrainingCategories(): Promise<ApiResponse<TrainingCategory[]>> {
    return this.request<TrainingCategory[]>("/training/categories");
  }

  async getTrainingVideos(
    category_id?: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<TrainingVideo[]>> {
    const params = new URLSearchParams();
    if (category_id) params.append("category_id", category_id.toString());
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.request<TrainingVideo[]>(`/training/videos?${params.toString()}`);
  }

  async getVideoDetail(id: number): Promise<ApiResponse<TrainingVideo>> {
    return this.request<TrainingVideo>(`/training/videos/${id}`);
  }

  async getTodayPlan(): Promise<ApiResponse<TodayPlan>> {
    return this.request<TodayPlan>("/training/today-plan");
  }

  async getTrainingRecords(days: number = 7): Promise<ApiResponse<TrainingRecordResponse>> {
    return this.request<TrainingRecordResponse>(`/training/training-records?days=${days}`);
  }

  async createTrainingRecord(data: {
    video_id: number;
    daily_plan_id?: number;
    daily_plan_item_id?: number;
    start_time: string;
    end_time?: string;
    actual_duration_seconds: number;
    completed: boolean;
    source: string;
  }): Promise<ApiResponse<{ id: number }>> {
    return this.request<{ id: number }>("/training/training-records", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>("/auth/profile");
  }

  async updateUserProfile(data: {
    user_name: string;
    gender: string;
    phone: string;
    age: number;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== 管理员接口 =====
  async getAdminVideos(params?: {
    category_id?: number;
    status?: number;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const p = new URLSearchParams();
    if (params?.category_id) p.append("category_id", String(params.category_id));
    if (params?.status !== undefined) p.append("status", String(params.status));
    if (params?.keyword) p.append("keyword", params.keyword);
    if (params?.page) p.append("page", String(params.page));
    if (params?.limit) p.append("limit", String(params.limit));
    const q = p.toString();
    return this.request<any[]>(`/admin/videos${q ? `?${q}` : ""}`);
  }

  async createAdminVideo(data: {
    title: string;
    cover_url?: string;
    video_url: string;
    description?: string;
    duration_seconds?: number;
    caution_text?: string;
    status?: number;
    category_ids: number[];
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/admin/videos", { method: "POST", body: JSON.stringify(data) });
  }

  async updateAdminVideo(
    id: number,
    data: {
      title: string;
      cover_url?: string;
      video_url: string;
      description?: string;
      duration_seconds?: number;
      caution_text?: string;
      category_ids: number[];
    },
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/admin/videos/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async updateAdminVideoStatus(id: number, status: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/admin/videos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async getAdminCategories(params?: {
    parent_id?: number;
    status?: number;
  }): Promise<ApiResponse<any[]>> {
    const p = new URLSearchParams();
    if (params?.parent_id !== undefined) p.append("parent_id", String(params.parent_id));
    if (params?.status !== undefined) p.append("status", String(params.status));
    const q = p.toString();
    return this.request<any[]>(`/admin/categories${q ? `?${q}` : ""}`);
  }

  async createAdminCategory(data: {
    name: string;
    parent_id?: number;
    sort_no?: number;
    status?: number;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/admin/categories", { method: "POST", body: JSON.stringify(data) });
  }

  async getAdminUsers(params?: {
    role?: string;
    status?: number;
    account?: string;
  }): Promise<ApiResponse<any[]>> {
    const p = new URLSearchParams();
    if (params?.role) p.append("role", params.role);
    if (params?.status !== undefined) p.append("status", String(params.status));
    if (params?.account) p.append("account", params.account);
    const q = p.toString();
    return this.request<any[]>(`/admin/users${q ? `?${q}` : ""}`);
  }

  async createAdminUser(data: {
    account: string;
    password: string;
    user_name: string;
    role: string;
    gender?: string;
    phone?: string;
    age?: number;
    status?: number;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/admin/users", { method: "POST", body: JSON.stringify(data) });
  }

  async updateAdminUserStatus(id: number, status: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async getAdminBindings(params?: {
    elder_id?: number;
    child_id?: number;
  }): Promise<ApiResponse<any[]>> {
    const p = new URLSearchParams();
    if (params?.elder_id) p.append("elder_id", String(params.elder_id));
    if (params?.child_id) p.append("child_id", String(params.child_id));
    const q = p.toString();
    return this.request<any[]>(`/admin/bindings${q ? `?${q}` : ""}`);
  }

  async createAdminBinding(data: {
    elder_id: number;
    child_id: number;
    relation_type: string;
    is_primary?: number;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/admin/bindings", { method: "POST", body: JSON.stringify(data) });
  }

  async deleteAdminBinding(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/admin/bindings/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiService();
