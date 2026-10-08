import { test, expect } from "@playwright/test";
test("painel, compra, corte, relatórios e pedido recebido pela loja", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/painel");
  await expect(
    page.getByRole("heading", { name: "Seu ateliê, em um olhar." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/preview-desktop.png",
    fullPage: true,
  });
  await page.goto("/painel/compras");
  await page.getByRole("button", { name: "Nova compra" }).click();
  await page
    .getByLabel("Material", { exact: true })
    .selectOption({ label: "Madeira pinus" });
  await page.getByLabel("Quantidade na unidade cadastrada").fill("200");
  await page.getByLabel("Valor dos materiais (R$)").fill("7");
  await page.getByRole("button", { name: "Salvar e confirmar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Recebida", { exact: true })).toBeVisible();
  await page.goto("/painel/transformacao");
  await page.getByRole("button", { name: "Registrar transformação" }).click();
  await page
    .getByLabel("Madeira de origem (cm)")
    .selectOption({ label: "Madeira pinus" });
  await page.getByLabel("Madeira utilizada (cm)").fill("200");
  await page.getByLabel("Perda total (cm)").fill("20");
  await page
    .getByLabel("Selecionar item")
    .selectOption({ label: "Madeira 5 cm" });
  await page.getByLabel("Quantidade", { exact: true }).fill("36");
  await expect(page.getByText("Comprimento conferido ✓")).toBeVisible();
  await page.getByRole("button", { name: "Salvar e confirmar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/painel/relatorios");
  for (const format of ["csv", "xlsx", "pdf"]) {
    await page.getByLabel("Formato", { exact: true }).selectOption(format);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar", exact: true }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(new RegExp("\\." + format + "$"));
  }
  await page.goto("/loja");
  await page
    .getByRole("button", { name: "Adicionar Balanço Tropical", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuar pedido" }).click();
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("Cliente Navegador");
  await page
    .getByLabel("Telefone / WhatsApp", { exact: true })
    .fill("15999999999");
  await page.getByLabel("E-mail", { exact: true }).fill("cliente@example.com");
  await page
    .getByLabel("Endereço completo", { exact: true })
    .fill("Rua das Aves, 123");
  await page.getByLabel("Cidade", { exact: true }).fill("Sorocaba");
  await page.getByLabel("Estado (UF)", { exact: true }).fill("SP");
  await page.getByLabel("CEP", { exact: true }).fill("18000000");
  await page
    .getByRole("button", { name: "Enviar pedido", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pedido recebido!" }),
  ).toBeVisible();
  await page.goto("/painel/pedidos");
  await expect(
    page.getByText("Cliente Navegador", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("todos os módulos abrem sem erro e layout mobile não extrapola a tela", async ({
  page,
}) => {
  for (const path of [
    "materiais",
    "pecas",
    "brinquedos",
    "ficha-tecnica",
    "perdas",
    "producao",
    "estoque",
    "clientes",
    "vendas",
    "fornecedores",
    "custos",
    "precificacao",
    "configuracoes",
    "loja-virtual",
  ]) {
    await page.goto("/painel/" + path);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.locator(".error").count()).toBe(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/painel");
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible();
  if ((await page.evaluate(() => document.documentElement.scrollWidth)) > 390)
    console.log(
      await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.right > 395 && r.width > 0;
          })
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            width: Math.round(e.getBoundingClientRect().width),
            right: Math.round(e.getBoundingClientRect().right),
          })),
      ),
    );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/open/);
  await page
    .getByRole("button", { name: "Fechar menu", exact: true })
    .first()
    .click();
  await page.screenshot({
    path: "test-results/preview-mobile.png",
    fullPage: true,
  });
  await page.goto("/loja");
  if ((await page.evaluate(() => document.documentElement.scrollWidth)) > 390)
    console.log(
      await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.right > 395 && r.width > 0;
          })
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            width: Math.round(e.getBoundingClientRect().width),
            right: Math.round(e.getBoundingClientRect().right),
          })),
      ),
    );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("catálogo público não expõe dados internos e API privada exige autenticação", async ({
  request,
}) => {
  const response = await request.get("/api/catalog");
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(data.products.length).toBeGreaterThan(0);
  for (const product of data.products) {
    expect(product).not.toHaveProperty("cost");
    expect(product).not.toHaveProperty("recipe");
  }
  expect(data).not.toHaveProperty("customers");
  expect(data).not.toHaveProperty("sales");
  const privateResponse = await request.get("/api/admin/state");
  expect(privateResponse.ok()).toBe(false);
  expect(await privateResponse.json()).not.toHaveProperty("state");
  const forged = await request.post("/api/admin/state", {
    headers: { Origin: "https://outra-origem.example" },
    data: { type: "settings", requestId: crypto.randomUUID(), data: {} },
  });
  expect(forged.ok()).toBe(false);
});
