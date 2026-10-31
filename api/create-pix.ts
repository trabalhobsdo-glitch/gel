import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isIP } from "node:net";

// Mesmo gateway/endereço do site que já funciona (HyperCash só tem ambiente de produção).
const BASE = "https://api.hypercashbrasil.com.br";
// Aceita os dois nomes de variável (HYPER_SECRET_KEY é o usado nos seus outros sites).
const getSecret = () => (process.env.HYPER_SECRET_KEY || process.env.HYPERCASH_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");

// ⚠️ Preços ficam no SERVIDOR: o cliente só envia o id da oferta.
// Mantenha em sincronia com src/config.ts
const OFFERS: Record<string, { title: string; priceCents: number }> = {
  unitario: { title: "Super M4 Blaster Elétrica de Gel", priceCents: 4990 },
  "kit-duplo": { title: "Kit com 2 Super M4 Blaster Elétrica de Gel", priceCents: 9790 },
};

// Mantenha em sincronia com src/config.ts
const SHIPPING: Record<string, number> = { pac: 990, sedex: 1850 };

const BUMPS: Record<string, { title: string; priceCents: number }> = {
  bolinhas: { title: "15.000 Bolinhas de Gel", priceCents: 1500 },
  embrulho: { title: "Embrulho de Presente de Natal", priceCents: 1000 },
};

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = getSecret();

  // Diagnóstico: abra /api/create-pix?diag=1 no navegador. Nunca mostra a chave.
  if (req.method === "GET" && req.query?.diag) {
    const out: Record<string, unknown> = {
      secretKeyConfigured: !!secret,
      secretKeyLength: secret.length,
      secretKeyLooksLikePublicKey: /^pk_/i.test(secret),
    };
    if (secret) {
      try {
        const r = await fetch(`${BASE}/api/user/wallet/balance`, { headers: { Authorization: "Basic " + Buffer.from(`x:${secret}`).toString("base64") } });
        out.walletBalanceStatus = r.status; // 200 = chave OK | 401 = chave errada | 403 = sem permissão
      } catch { out.walletBalanceStatus = "sem_conexao"; }
    }
    return res.status(200).json(out);
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  if (!secret) return res.status(500).json({ error: "Pagamento não configurado (HYPERCASH_SECRET_KEY ausente)." });

  const { offerId, shipping, bumps, customer, address } = (req.body ?? {}) as any;
  const offer = OFFERS[offerId];
  if (!offer) return res.status(400).json({ error: "Oferta inválida." });

  const cpf = digits(customer?.cpf);
  const phone = digits(customer?.phone);
  const zip = digits(address?.cep);
  if (!customer?.name || !customer?.email || cpf.length !== 11 || phone.length < 10 || zip.length !== 8 ||
      !address?.street || !address?.number || !address?.neighborhood || !address?.city || !address?.state) {
    return res.status(400).json({ error: "Preencha todos os dados obrigatórios." });
  }

  const shippingFee = SHIPPING[shipping];
  if (shippingFee === undefined) return res.status(400).json({ error: "Escolha uma opção de frete." });
  const bumpIds: string[] = Array.isArray(bumps) ? [...new Set<string>(bumps.map(String))].filter((b) => b in BUMPS) : [];
  const bumpItems = bumpIds.map((b) => ({ title: BUMPS[b].title, unitPrice: BUMPS[b].priceCents, quantity: 1, tangible: true, externalRef: `bump-${b}` }));
  const amount = offer.priceCents + shippingFee + bumpItems.reduce((t, i) => t + i.unitPrice, 0);
  const ip = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  const base = BASE;

  const payload = {
    amount,
    paymentMethod: "PIX",
    customer: {
      name: String(customer.name).trim(),
      email: String(customer.email).trim(),
      document: { number: cpf, type: "CPF" },
      phone,
    },
    shipping: {
      fee: shippingFee,
      address: {
        street: address.street,
        streetNumber: String(address.number),
        ...(address.complement ? { complement: String(address.complement) } : {}),
        zipCode: zip,
        neighborhood: address.neighborhood,
        city: address.city,
        state: String(address.state).toUpperCase(),
        country: "br",
      },
    },
    items: [{ title: offer.title, unitPrice: offer.priceCents, quantity: 1, tangible: true, externalRef: offerId }, ...bumpItems],
    traceable: true,
    ...(ip && isIP(ip) ? { ip } : {}),
    metadata: { offerId, shipping, bumps: bumpIds },
    pix: { expiresInDays: 1 },
  };

  try {
    const r = await fetch(`${base}/api/user/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`x:${secret}`).toString("base64"),
      },
      body: JSON.stringify(payload),
    });
    const json: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("HyperCash error", r.status, JSON.stringify(json));
      return res.status(502).json({ error: json?.message || "Não foi possível gerar o PIX. Tente novamente." });
    }
    const tx = json?.data ?? json;
    const qrcode = tx?.pix?.qrcode;
    if (!tx?.id || !qrcode) {
      console.error("Resposta inesperada da HyperCash", JSON.stringify(json));
      return res.status(502).json({ error: "Resposta inesperada do gateway de pagamento." });
    }
    return res.status(200).json({
      id: tx.id,
      qrcode,
      expirationDate: tx.pix?.expirationDate ?? null,
      amount: tx.amount ?? amount,
      status: String(tx.status ?? "waiting_payment").toLowerCase(),
    });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Falha de comunicação com o gateway de pagamento." });
  }
}
