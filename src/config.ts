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
  unitario: { id: "unitario", name: "Super M4 Blaster Elétrica de Gel", short: "1 unidade", priceCents: 7990, qty: 1 },
  "kit-duplo": { id: "kit-duplo", name: "Kit com 2 Super M4 Blaster", short: "Kit com 2", priceCents: 12790, qty: 2 },
};

export const savingsCents = OFFERS.unitario.priceCents * 2 - OFFERS["kit-duplo"].priceCents; // 3190
export const kitUnitCents = OFFERS["kit-duplo"].priceCents / 2; // 6395
