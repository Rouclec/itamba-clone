import { useQuery } from "@tanstack/react-query";
import type { v2User } from "@/@hey_api/users.swagger";
import axiosInstance from "@/utils/inteceptor";
import type { V1User } from "@/lib/user-types";
import { v1UserToV2 } from "@/lib/user-types";

export async function fetchUserById(id: string): Promise<v2User | null> {
  const response = await axiosInstance.get<V1User>(`/users/${id}`);
  return v1UserToV2(response.data ?? null);
}

const USER_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes – avoid refetch on every mount/focus

export function useGetUserById(userId: string | null) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
    staleTime: USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}