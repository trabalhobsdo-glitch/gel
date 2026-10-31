import type { VercelRequest, VercelResponse } from "@vercel/node";

// Recebe as notificações da Pagou (transaction.paid, transaction.cancelled, transaction.refunded...).
// Por enquanto só registra nos Logs da Vercel. O site confirma o pagamento consultando /api/pix-status.
// Aqui você pode, no futuro, avisar por e-mail/WhatsApp ou salvar o pedido.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  let b: any = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  const d = b?.data;
  console.log("[webhook Pagou]", b?.id, d?.event_type, d?.id, d?.status, d?.amount, d?.customer?.email);
  return res.status(200).json({ received: true });
}
