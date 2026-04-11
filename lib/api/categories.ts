import { apiRequest } from "@/lib/api/client";

export interface SubCategory {
  id: string;
  name: string;
  defaultDurationMin: number;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

export function listCategories() {
  return apiRequest<Category[]>("/api/categories");
}

export interface CreateCategoryBody {
  name: string;
  slug: string;
}

export function createCategory(body: CreateCategoryBody) {
  return apiRequest<Category>("/api/categories", { method: "POST", body });
}

export function updateCategory(id: string, body: Partial<CreateCategoryBody>) {
  return apiRequest<Category>(`/api/categories/${id}`, { method: "PATCH", body });
}

export function deleteCategory(id: string) {
  return apiRequest<{ message: string }>(`/api/categories/${id}`, { method: "DELETE" });
}

export interface CreateSubCategoryBody {
  name: string;
  defaultDurationMin: number;
}

export function addSubCategory(categoryId: string, body: CreateSubCategoryBody) {
  return apiRequest<SubCategory>(`/api/categories/${categoryId}/subcategories`, {
    method: "POST",
    body,
  });
}

export function updateSubCategory(id: string, body: Partial<CreateSubCategoryBody>) {
  return apiRequest<SubCategory>(`/api/categories/subcategories/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteSubCategory(id: string) {
  return apiRequest<{ message: string }>(`/api/categories/subcategories/${id}`, {
    method: "DELETE",
  });
}
