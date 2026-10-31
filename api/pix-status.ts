import type { VercelRequest, VercelResponse } from "@vercel/node";

// Consulta o status de um PIX na Pagou (GET /v2/transactions/{id}).
// Status possíveis: pending, paid, canceled, expired, refused, refunded...
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = (process.env.PAGOU_API_KEY || process.env.PAGOU_TOKEN || process.env.PAGOU_SECRET_KEY || "").trim().replace(/^[\"']|[\"']$/g, "");
  const id = String(req.query.id ?? "");
  if (!token) return res.status(500).json({ error: "Pagamento não configurado." });
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return res.status(400).json({ error: "ID inválido." });

  const base = String(process.env.PAGOU_ENV ?? "").trim().toLowerCase() === "sandbox" ? "https://api.sandbox.pagou.ai" : "https://api.pagou.ai";
  try {
    const r = await fetch(`${base}/v2/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const json: any = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: "Não foi possível consultar o pagamento." });
    const tx = json?.data ?? json;
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ status: String(tx?.status ?? "").toLowerCase() });
  } catch {
    return res.status(502).json({ error: "Falha ao consultar o pagamento." });
  }
}
