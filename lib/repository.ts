import "server-only";
import { serviceClient } from "./supabase/server";
import { emptyState } from "./seed";
import type { State } from "./types";
export async function readState() {
  const client = serviceClient();
  const { data, error } = await client
    .from("shop_state")
    .select("data,revision")
    .eq("shop_id", process.env.SHOP_ID!)
    .single();
  if (error)
    throw new Error("Banco indisponível ou SQL de instalação não executado.");
  const state = { ...emptyState(), ...(data.data as State) };
  return { state, revision: Number(data.revision) };
}
export async function transact<T>(
  fn: (s: State) => { state: State; result: T },
  actor: string,
): Promise<{ state: State; result: T }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { state, revision } = await readState();
    const next = fn(state);
    if (next.state === state) return next;
    const client = serviceClient();
    const { data, error } = await client.rpc("commit_shop_state", {
      p_shop_id: process.env.SHOP_ID!,
      p_expected_revision: revision,
      p_data: next.state,
      p_actor: actor,
    });
    if (error)
      throw new Error("Não foi possível salvar a operação. Tente novamente.");
    if (data === true) return next;
  }
  throw new Error(
    "Outro usuário atualizou os dados. Recarregue e tente novamente.",
  );
}
