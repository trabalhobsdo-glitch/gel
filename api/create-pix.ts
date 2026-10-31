import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isIP } from "node:net";
import { randomUUID } from "node:crypto";

// Gateway: Pagou (API v2). Docs: https://developer.pagou.ai
// Variáveis de ambiente na Vercel:
//   PAGOU_API_KEY  -> token de API de PRODUÇÃO (obrigatória)
//   PAGOU_ENV      -> opcional: "sandbox" para testar com o token de sandbox
const getBase = () => (String(process.env.PAGOU_ENV ?? "").trim().toLowerCase() === "sandbox" ? "https://api.sandbox.pagou.ai" : "https://api.pagou.ai");
const getToken = () => (process.env.PAGOU_API_KEY || process.env.PAGOU_TOKEN || process.env.PAGOU_SECRET_KEY || "").trim().replace(/^[\"']|[\"']$/g, "");

// ⚠️ Preços ficam no SERVIDOR: o cliente só envia o id da oferta.
// Mantenha em sincronia com src/config.ts
const OFFERS: Record<string, { title: string; priceCents: number }> = {
  unitario: { title: "Super M4 Blaster Elétrica de Gel", priceCents: 4990 },
  "kit-duplo": { title: "Kit com 2 Super M4 Blaster Elétrica de Gel", priceCents: 9790 },
};

// Mantenha em sincronia com src/config.ts
const SHIPPING: Record<string, { name: string; priceCents: number }> = {
  pac: { name: "Frete PAC", priceCents: 990 },
  sedex: { name: "Frete SEDEX", priceCents: 1850 },
};

const BUMPS: Record<string, { title: string; priceCents: number }> = {
  bolinhas: { title: "15.000 Bolinhas de Gel", priceCents: 1500 },
  embrulho: { title: "Embrulho de Presente de Natal", priceCents: 1000 },
};

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getToken();
  const base = getBase();
  const auth = { Authorization: `Bearer ${token}` };

  // Diagnóstico: abra /api/create-pix?diag=1 no navegador. Nunca mostra a chave.
  if (req.method === "GET" && req.query?.diag) {
    const out: Record<string, unknown> = {
      gateway: "pagou",
      ambiente: base.includes("sandbox") ? "sandbox" : "producao",
      tokenConfigured: !!token,
      tokenLength: token.length,
    };
    if (token) {
      try {
        const r = await fetch(`${base}/v2/transactions?limit=1`, { headers: auth });
        out.authStatus = r.status; // 200 = chave OK | 401 = chave errada ou de outro ambiente
      } catch { out.authStatus = "sem_conexao"; }
    }
    return res.status(200).json(out);
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  if (!token) return res.status(500).json({ error: "Pagamento não configurado (PAGOU_API_KEY ausente)." });

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

  const ship = SHIPPING[shipping];
  if (!ship) return res.status(400).json({ error: "Escolha uma opção de frete." });
  const bumpIds: string[] = Array.isArray(bumps) ? [...new Set<string>(bumps.map(String))].filter((b) => b in BUMPS) : [];

  // Na Pagou o valor total é a soma dos itens; o frete entra como um item físico.
  const products = [
    { name: offer.title, price: offer.priceCents, quantity: 1, tangible: true, sku: offerId },
    ...bumpIds.map((b) => ({ name: BUMPS[b].title, price: BUMPS[b].priceCents, quantity: 1, tangible: true, sku: `bump-${b}` })),
    { name: ship.name, price: ship.priceCents, quantity: 1, tangible: false, sku: `frete-${shipping}` },
  ];
  const amount = products.reduce((t, p) => t + p.price * p.quantity, 0);

  const ip = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").split(",")[0].trim();
  const notifyUrl = host && !/localhost|127\.0\.0\.1/.test(host) ? `https://${host}/api/webhook` : undefined;

  const payload = {
    external_ref: `gel-${randomUUID()}`, // identificador único do pedido (a Pagou recusa repetidos)
    amount,
    currency: "BRL",
    method: "pix",
    ...(notifyUrl ? { notify_url: notifyUrl } : {}),
    buyer: {
      name: String(customer.name).trim(),
      email: String(customer.email).trim(),
      phone: phone.startsWith("55") && phone.length > 11 ? `+${phone}` : `+55${phone}`,
      document: { type: "CPF", number: cpf },
      address: {
        street: String(address.street),
        number: String(address.number),
        ...(address.complement ? { complement: String(address.complement) } : {}),
        neighborhood: String(address.neighborhood),
        city: String(address.city),
        state: String(address.state).toUpperCase(),
        zipCode: zip,
        country: "BR",
      },
    },
    products,
    traceable: true,
    ...(ip && isIP(ip) ? { ip_address: ip } : {}),
    informations: [
      { key: "oferta", value: String(offerId) },
      { key: "frete", value: String(shipping) },
      ...(bumpIds.length ? [{ key: "adicionais", value: bumpIds.join(",") }] : []),
    ],
  };

  try {
    const r = await fetch(`${base}/v2/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify(payload),
    });
    const json: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Pagou error", r.status, JSON.stringify(json));
      const first = Array.isArray(json?.errors) && json.errors[0] ? `${json.errors[0].field ?? ""}: ${json.errors[0].message ?? ""}`.trim() : "";
      const msg = r.status === 401 || r.status === 403
        ? "Pagamento temporariamente indisponível. Tente novamente em instantes."
        : r.status === 422
          ? `Confira os dados informados${first ? ` (${first})` : ""}.`
          : json?.detail || json?.message || "Não foi possível gerar o PIX. Tente novamente.";
      return res.status(502).json({ error: msg });
    }
    const tx = json?.data ?? json;
    const qrcode = tx?.pix?.qr_code;
    if (!tx?.id || !qrcode) {
      console.error("Resposta inesperada da Pagou", JSON.stringify(json));
      return res.status(502).json({ error: "Resposta inesperada do gateway de pagamento." });
    }
    return res.status(200).json({
      id: tx.id,
      qrcode,
      expirationDate: tx.pix?.expiration_date ?? null,
      amount: tx.amount ?? amount,
      status: String(tx.status ?? "pending").toLowerCase(),
    });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Falha de comunicação com o gateway de pagamento." });
  }
}
