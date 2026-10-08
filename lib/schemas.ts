import { z } from "zod";
const text = z.string().trim().max(2000),
  id = z.string().uuid(),
  optionalId = z.union([id, z.literal("")]);
const n = z.number().finite().nonnegative().max(1e9),
  positive = n.positive(),
  count = positive.int().max(100000);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Data inválida",
  );
const unit = z.enum([
  "un",
  "m",
  "cm",
  "mm",
  "kg",
  "g",
  "L",
  "mL",
  "barra",
  "pacote",
  "chapa",
]);
const inventory = {
  id: optionalId,
  name: text.min(2),
  sku: text.min(1),
  category: text,
  stock: n,
  minimum: n,
  unit,
  cost: n,
  notes: text,
};
const material = z
  .object({
    ...inventory,
    supplierId: optionalId,
    lastPrice: n.default(0),
    lastPurchase: z.string().default(""),
  })
  .strict();
const part = z
  .object({
    ...inventory,
    materialId: id,
    length: positive,
    width: n,
    height: n,
    diameter: n,
  })
  .strict();
const ingredient = z
  .object({
    kind: z.enum(["material", "part"]),
    itemId: id,
    quantity: positive,
  })
  .strict();
const product = z
  .object({
    ...inventory,
    description: text,
    species: text,
    size: text,
    image: z
      .string()
      .max(6000000)
      .refine(
        (v) =>
          !v ||
          v.startsWith("/images/") ||
          /^https:\/\//.test(v) ||
          /^data:image\/(png|jpeg|webp);base64,/.test(v),
        "Imagem inválida",
      ),
    price: n,
    active: z.boolean(),
    online: z.boolean(),
    labor: n,
    overhead: n,
    extra: n,
    recipe: z.array(ingredient).max(100),
  })
  .strict();
const contact = z
  .object({
    id: optionalId,
    name: text.min(2),
    phone: text,
    email: z.union([z.email(), z.literal("")]),
    document: text,
    address: text,
    city: text,
    state: text,
    zip: text,
    notes: text,
    company: text,
  })
  .strict();
const expense = z
  .object({
    id: optionalId,
    name: text.min(2),
    category: text,
    amount: positive,
    date,
    notes: text,
  })
  .strict();
const line = z.object({ productId: id, quantity: count }).strict();
export const settingsSchema = z
  .object({
    name: text.min(2),
    subtitle: text,
    phone: text,
    email: text,
    address: text,
    logo: z
      .string()
      .max(2000)
      .refine(
        (v) => !v || /^https:\/\//.test(v) || v.startsWith("/"),
        "Logo inválida",
      ),
    lossRate: n.max(90),
    taxRate: n.max(90),
    feeRate: n.max(90),
    commissionRate: n.max(90),
    defaultFreight: n,
  })
  .strict()
  .refine(
    (v) => v.taxRate + v.feeRate + v.commissionRate < 100,
    "Taxas combinadas devem ser menores que 100%",
  );
export const checkoutSchema = z
  .object({
    requestId: id,
    customer: contact
      .omit({ id: true, notes: true, company: true })
      .extend({
        name: text.min(2),
        phone: text.min(8),
        email: z.email(),
        address: text.min(5),
        city: text.min(2),
        state: z.string().length(2),
        zip: z.string().regex(/^\d{5}-?\d{3}$/),
      }),
    items: z.array(line).min(1).max(50),
    payment: z.enum([
      "Pix",
      "Dinheiro",
      "Cartão de crédito",
      "Cartão de débito",
      "Transferência",
      "Marketplace",
      "Outro",
    ]),
    website: z.string().max(0).default(""),
  })
  .strict();
const command = z.discriminatedUnion("type", [
  z.object({ type: z.literal("saveMaterial"), data: material }),
  z.object({ type: z.literal("savePart"), data: part }),
  z.object({ type: z.literal("saveProduct"), data: product }),
  z.object({
    type: z.literal("saveContact"),
    entity: z.enum(["customers", "suppliers"]),
    data: contact,
  }),
  z.object({ type: z.literal("saveExpense"), data: expense }),
  z.object({
    type: z.literal("delete"),
    entity: z.enum([
      "materials",
      "parts",
      "products",
      "customers",
      "suppliers",
      "expenses",
    ]),
    id,
  }),
  z.object({
    type: z.literal("purchase"),
    materialId: id,
    supplierId: optionalId,
    quantity: positive,
    total: n,
    freight: n,
    extra: n,
    date,
    invoice: text,
    notes: text,
  }),
  z.object({
    type: z.literal("transform"),
    materialId: id,
    used: positive,
    lost: n,
    outputs: z
      .array(z.object({ partId: id, quantity: count }).strict())
      .min(1)
      .max(100),
    date,
    responsible: text.min(1),
    notes: text,
  }),
  z.object({
    type: z.literal("loss"),
    kind: z.enum(["material", "part", "product"]),
    itemId: id,
    quantity: positive,
    reason: z.enum([
      "Corte",
      "Quebra",
      "Defeito",
      "Erro",
      "Sobra",
      "Descarte",
      "Outro",
    ]),
    date,
    responsible: text.min(1),
    notes: text,
  }),
  z.object({
    type: z.literal("production"),
    productId: id,
    quantity: count,
    date,
    deadline: date,
    responsible: text.min(1),
    priority: z.enum(["Normal", "Alta", "Urgente"]),
    orderId: optionalId,
    notes: text,
  }),
  z.object({
    type: z.literal("productionStatus"),
    id,
    status: z.enum([
      "Planejada",
      "Em andamento",
      "Pausada",
      "Concluída",
      "Cancelada",
    ]),
  }),
  z.object({
    type: z.literal("order"),
    customerId: id,
    items: z.array(line).min(1).max(50),
    date,
    deadline: date,
    discount: n,
    freight: n,
    payment: text.min(1),
    notes: text,
  }),
  z.object({
    type: z.literal("orderStatus"),
    id,
    status: z.enum([
      "Novo",
      "Aguardando produção",
      "Em produção",
      "Pronto",
      "Enviado",
      "Entregue",
      "Cancelado",
    ]),
  }),
  z.object({ type: z.literal("price"), productId: id, price: positive }),
  z.object({ type: z.literal("settings"), data: settingsSchema }),
]);
export const commandSchema = z.intersection(
  z.object({ requestId: id }),
  command,
);
export type Command = z.infer<typeof commandSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
