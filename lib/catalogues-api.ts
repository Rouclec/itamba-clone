/**
 * Catalogues (categories) API: v2 create/update, v1 delete, list.
 */

import axiosInstance from '@/utils/inteceptor'

export interface CatalogueRecord {
  categoryId?: string
  category_id?: string
  titles?: { en?: string; fr?: string }
  description?: { en?: string; fr?: string }
  labels?: string[]
  userId?: string
  user_id?: string
  documentCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface ListCataloguesResponse {
  categories?: CatalogueRecord[]
  statistics?: { currentPage?: string; pageCount?: string; totalItems?: string }
}

export async function listCatalogues(params: {
  userId: string
  page?: number
  pageSize?: number
}): Promise<ListCataloguesResponse> {
  const { data } = await axiosInstance.get<ListCataloguesResponse>(
    `/v2/api/client/published/${params.userId}/catalogues`,
    {
      params: { page: params.page, pageSize: params.pageSize },
    }
  )
  return data ?? { categories: [] }
}

export interface CreateCataloguePayload {
  userId: string
  titles: { en: string; fr: string }
  description?: { en: string; fr: string }
  labels?: string[]
}

export async function createCatalogue(
  payload: CreateCataloguePayload
): Promise<{ category?: CatalogueRecord }> {
  const { data } = await axiosInstance.post(
    `/v2/api/admin/document/${payload.userId}/category`,
    {
      category: {
        userId: payload.userId,
        titles: payload.titles,
        description: payload.description,
        labels: payload.labels,
      },
    }
  )
  return data ?? {}
}

export interface UpdateCataloguePayload {
  category_id: string
  user_id: string
  titles: { en: string; fr: string }
  description?: { en: string; fr: string }
  labels?: string[]
}

export async function updateCatalogue(
  payload: UpdateCataloguePayload
): Promise<{ category?: CatalogueRecord }> {
  const { data } = await axiosInstance.patch(
    `/v2/api/admin/document/${payload.user_id}/category`,
    {
      category: {
        category_id: payload.category_id,
        user_id: payload.user_id,
        titles: payload.titles,
        description: payload.description ?? { en: '', fr: '' },
        labels: payload.labels ?? [],
      },
    }
  )
  return data ?? {}
}

export async function deleteCatalogue(params: {
  categoryId: string
  userId: string
}): Promise<void> {
  await axiosInstance.delete('/documents/category', {
    params: { category_id: params.categoryId, user_id: params.userId },
  })
}
