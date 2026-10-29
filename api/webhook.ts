import type { VercelRequest, VercelResponse } from "@vercel/node";

// Recebe as notificações da HyperCash (status: paid, refused, canceled...).
// Aqui você pode, no futuro, avisar por e-mail/WhatsApp ou salvar o pedido.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const data = (req.body as any)?.data;
  console.log("[webhook HyperCash]", data?.id, data?.status, data?.amount, data?.customer?.email);
  return res.status(200).json({ ok: true });
}
