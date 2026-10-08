import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { emptyState } from "../lib/seed";
const SHOP = "00000000-0000-4000-8000-000000000001",
  ADMIN = "00000000-0000-4000-8000-000000000099";
test("SQL instala, RLS restringe leituras e RPC salva com controle de versão", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,name text,bucket_id text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;`,
    );
    await db.exec(
      await readFile(new URL("../supabase/setup.sql", import.meta.url), "utf8"),
    );
    await db.query("insert into auth.users values($1)", [ADMIN]);
    await db.query("insert into public.shop_admins values($1,$2)", [
      SHOP,
      ADMIN,
    ]);
    await db.exec("set role service_role");
    const state = emptyState();
    state.audit.push({
      id: crypto.randomUUID(),
      action: "teste",
      date: new Date().toISOString(),
      actor: ADMIN,
    });
    const first = await db.query<{ ok: boolean }>(
      "select public.commit_shop_state($1,0,$2,$3) ok",
      [SHOP, JSON.stringify(state), ADMIN],
    );
    assert.equal(first.rows[0].ok, true);
    const second = await db.query<{ ok: boolean }>(
      "select public.commit_shop_state($1,0,$2,$3) ok",
      [SHOP, JSON.stringify(state), ADMIN],
    );
    assert.equal(second.rows[0].ok, false);
    const history = await db.query<{ actions: unknown[] }>(
      "select actions from public.shop_history",
    );
    assert.equal(history.rows.length, 1);
    assert.equal(history.rows[0].actions.length, 1);
    const limit1 = await db.query<{ ok: boolean }>(
      "select public.allow_checkout($1,1) ok",
      [SHOP],
    );
    const limit2 = await db.query<{ ok: boolean }>(
      "select public.allow_checkout($1,1) ok",
      [SHOP],
    );
    assert.equal(limit1.rows[0].ok, true);
    assert.equal(limit2.rows[0].ok, false);
    await db.exec("reset role;set role authenticated");
    let visible = await db.query("select * from public.shop_state");
    assert.equal(visible.rows.length, 0);
    await assert.rejects(
      () =>
        db.query("select public.commit_shop_state($1,1,$2,$3)", [
          SHOP,
          JSON.stringify(state),
          "client",
        ]),
      /permission denied/,
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ADMIN,
    ]);
    visible = await db.query("select * from public.shop_state");
    assert.equal(visible.rows.length, 1);
    await assert.rejects(
      () => db.query("update public.shop_state set data='{}'"),
      /permission denied/,
    );
    await db.exec("reset role;set role anon");
    await assert.rejects(
      () => db.query("select * from public.shop_state"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
