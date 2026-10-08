import { test } from "node:test";
import assert from "node:assert/strict";
import { serverConfigured } from "../lib/config";

test("configuração de produção identifica variáveis ausentes sem expor credenciais", () => {
  const values = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-value",
    SUPABASE_SECRET_KEY: "private-test-value",
    SHOP_ID: "00000000-0000-4000-8000-000000000001",
    APP_ORIGIN: "https://example.vercel.app",
    VERCEL: "1",
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    Object.assign(process.env, values);
    assert.doesNotThrow(serverConfigured);
    delete process.env.SHOP_ID;
    assert.throws(serverConfigured, (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /SHOP_ID/);
      assert.match(error.message, /Vercel/);
      assert.doesNotMatch(error.message, /private-test-value/);
      return true;
    });
    process.env.SHOP_ID = values.SHOP_ID;
    process.env.SUPABASE_SECRET_KEY = "   ";
    assert.throws(serverConfigured, /SUPABASE_SECRET_KEY/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
