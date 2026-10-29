import type { VercelRequest, VercelResponse } from "@vercel/node";

// ⚠️ Preços ficam no SERVIDOR: o cliente só envia o id da oferta.
// Mantenha em sincronia com src/config.ts
const OFFERS: Record<string, { title: string; priceCents: number }> = {
  unitario: { title: "Super M4 Blaster Elétrica de Gel", priceCents: 7990 },
  "kit-duplo": { title: "Kit com 2 Super M4 Blaster Elétrica de Gel", priceCents: 12790 },
};

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const secret = process.env.HYPERCASH_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Pagamento não configurado (HYPERCASH_SECRET_KEY ausente)." });

  const { offerId, customer, address } = (req.body ?? {}) as any;
  const offer = OFFERS[offerId];
  if (!offer) return res.status(400).json({ error: "Oferta inválida." });

  const cpf = digits(customer?.cpf);
  const phone = digits(customer?.phone);
  const zip = digits(address?.cep);
  if (!customer?.name || !customer?.email || cpf.length !== 11 || phone.length < 10 || zip.length !== 8 ||
      !address?.street || !address?.number || !address?.neighborhood || !address?.city || !address?.state) {
    return res.status(400).json({ error: "Preencha todos os dados obrigatórios." });
  }

  const shippingFee = Math.max(0, parseInt(process.env.SHIPPING_FEE_CENTS ?? "0", 10) || 0);
  const amount = offer.priceCents + shippingFee;
  const ip = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || "0.0.0.0";
  const site = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");
  const base = (process.env.HYPERCASH_API_URL || "https://api.hypercashbrasil.com.br").replace(/\/$/, "");

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
        complement: address.complement || "",
        zipCode: zip,
        neighborhood: address.neighborhood,
        city: address.city,
        state: String(address.state).toUpperCase(),
        country: "br",
      },
    },
    items: [{ title: offer.title, unitPrice: offer.priceCents, quantity: 1, tangible: true, externalRef: offerId }],
    traceable: true,
    ip,
    postbackUrl: `${site}/api/webhook`,
    metadata: { offerId },
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
