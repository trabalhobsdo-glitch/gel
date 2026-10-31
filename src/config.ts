// Configuração central da loja. Edite aqui textos, preços e contatos.
// ⚠️ Os preços também existem em api/create-pix.ts (o servidor é quem manda no valor cobrado).

export const STORE = {
  name: "Orbigel",
  legalName: "", // Razão social / CNPJ: preencha só com dados reais
  whatsapp: "", // Ex.: "5511999999999" — se vazio, o botão não aparece
  email: "", // E-mail de atendimento (opcional)
  minAge: "13+", // Confira com a embalagem/fornecedor antes de publicar
};

export type OfferId = "unitario" | "kit-duplo";

export const OFFERS: Record<OfferId, { id: OfferId; name: string; short: string; priceCents: number; qty: number }> = {
  unitario: { id: "unitario", name: "Super M4 Blaster Elétrica de Gel", short: "1 unidade", priceCents: 4990, qty: 1 },
  "kit-duplo": { id: "kit-duplo", name: "Kit com 2 Super M4 Blaster", short: "Kit com 2", priceCents: 9790, qty: 2 },
};

export const savingsCents = OFFERS.unitario.priceCents * 2 - OFFERS["kit-duplo"].priceCents; // 200
export const kitUnitCents = OFFERS["kit-duplo"].priceCents / 2; // 4895

// ⚠️ Os fretes também existem em api/create-pix.ts (o servidor é quem manda no valor cobrado).
export type ShippingId = "pac" | "sedex";

export const SHIPPING: Record<ShippingId, { id: ShippingId; name: string; priceCents: number; days: string }> = {
  pac: { id: "pac", name: "PAC", priceCents: 990, days: "6 a 8 dias" },
  sedex: { id: "sedex", name: "SEDEX", priceCents: 1850, days: "3 a 5 dias" },
};

// ⚠️ Os order bumps também existem em api/create-pix.ts (o servidor é quem manda no valor cobrado).
export type BumpId = "bolinhas" | "embrulho";

export const BUMPS: Record<BumpId, { id: BumpId; title: string; text: string; priceCents: number; img: string }> = {
  bolinhas: { id: "bolinhas", title: "Leve também +15.000 bolinhas de gel", text: "Mais munição para a brincadeira durar mais.", priceCents: 1500, img: "/images/bump-bolinhas.webp" },
  embrulho: { id: "embrulho", title: "Embrulho de presente de Natal", text: "Papel de presente natalino para entregar já embrulhado.", priceCents: 1000, img: "/images/bump-embrulho.webp" },
};
