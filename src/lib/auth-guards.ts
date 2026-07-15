import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

/**
 * Retorna o usuário da sessão atual (ou null se não autenticado).
 * Centraliza o acesso à sessão para as rotas de API.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Retorna o usuário se ele estiver logado, senão null.
 */
export async function requireUser() {
  return getSessionUser();
}

/**
 * Retorna o usuário apenas se ele for ADMIN, senão null.
 * Use em rotas administrativas: `if (!(await requireAdmin())) return 403`.
 */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
