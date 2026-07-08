import type {
  CreateUserInput,
  InviteResult,
  PublicUser,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const KEY = "users";

export function useTeam() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get<PublicUser[]>("/users"),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api.post<InviteResult>("/users", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
