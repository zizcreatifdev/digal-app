import { useQuery } from "@tanstack/react-query";
import { fetchClient, fetchClientNetworks, fetchClients } from "@/lib/clients";

export const clientQueryKeys = {
  all: ["clients"] as const,
  list: (statut: "actif" | "archive", role?: string | null) =>
    ["clients", statut, role ?? null] as const,
  detail: (id: string) => ["client", id] as const,
  networks: (id: string) => ["client-networks", id] as const,
};

export function useClients(
  statut: "actif" | "archive",
  options: { role?: string | null; enabled?: boolean } = {}
) {
  const { role = null, enabled = true } = options;
  return useQuery({
    queryKey: clientQueryKeys.list(statut, role),
    queryFn: () => fetchClients(statut, { role }),
    enabled,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientQueryKeys.detail(id ?? ""),
    queryFn: () => fetchClient(id!),
    enabled: !!id,
  });
}

export function useClientNetworks(id: string | undefined) {
  return useQuery({
    queryKey: clientQueryKeys.networks(id ?? ""),
    queryFn: () => fetchClientNetworks(id!),
    enabled: !!id,
  });
}
