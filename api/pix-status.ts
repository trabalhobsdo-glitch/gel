import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.HYPERCASH_SECRET_KEY;
  const id = String(req.query.id ?? "");
  if (!secret) return res.status(500).json({ error: "Pagamento não configurado." });
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return res.status(400).json({ error: "ID inválido." });

  const base = (process.env.HYPERCASH_API_URL || "https://api.hypercashbrasil.com.br").replace(/\/$/, "");
  try {
    const r = await fetch(`${base}/api/user/transactions/${id}`, {
      headers: { Authorization: "Basic " + Buffer.from(`x:${secret}`).toString("base64") },
    });
    const json: any = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: "Não foi possível consultar o pagamento." });
    const tx = json?.data ?? json;
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ status: String(tx?.status ?? "").toLowerCase() });
  } catch {
    return res.status(502).json({ error: "Falha ao consultar o pagamento." });
  }
}
