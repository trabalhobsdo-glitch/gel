import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { Container, LockIcon, Logo } from "../components/ui";
import { OFFERS, SHIPPING, STORE, type OfferId, type ShippingId } from "../config";
import { brl, isValidCPF, maskCEP, maskCPF, maskPhone, onlyDigits } from "../lib/format";

type PixData = { id: string; qrcode: string; expirationDate: string | null; amount: number };
type Step = "form" | "pix" | "paid" | "failed";

const input =
  "w-full rounded-md border border-line bg-white px-4 py-3 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20";
const label = "mb-1 block text-sm font-bold text-forest";

const EMPTY = {
  name: "", email: "", cpf: "", phone: "",
  cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
};

export default function Checkout() {
  const { offerId } = useParams();
  const current: OfferId = offerId === "kit-duplo" ? "kit-duplo" : "unitario";
  const offer = OFFERS[current];

  const [form, setForm] = useState(EMPTY);
  const [shipping, setShipping] = useState<ShippingId>("pac");
  const ship = SHIPPING[shipping];
  const totalCents = offer.priceCents + ship.priceCents;
  const cepOk = onlyDigits(form.cep).length === 8;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [pix, setPix] = useState<PixData | null>(null);
  const [qrImg, setQrImg] = useState("");
  const [copied, setCopied] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof EMPTY) => (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "cpf") v = maskCPF(v);
    if (k === "phone") v = maskPhone(v);
    if (k === "cep") v = maskCEP(v);
    if (k === "state") v = v.toUpperCase().slice(0, 2);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  // Preenche o endereço automaticamente pelo CEP (ViaCEP)
  useEffect(() => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) return;
    let cancelled = false;
    setCepLoading(true);
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || d.erro) return;
        setForm((f) => ({ ...f, street: d.logradouro || f.street, neighborhood: d.bairro || f.neighborhood, city: d.localidade || f.city, state: d.uf || f.state }));
        numberRef.current?.focus();
      })
      .catch(() => {})
      .finally(() => !cancelled && setCepLoading(false));
    return () => { cancelled = true; };
  }, [form.cep]);

  // Gera a imagem do QR Code
  useEffect(() => {
    if (!pix) return;
    QRCode.toDataURL(pix.qrcode, { width: 280, margin: 1 }).then(setQrImg).catch(() => setQrImg(""));
  }, [pix]);

  // Consulta o status do pagamento a cada 5s
  useEffect(() => {
    if (step !== "pix" || !pix) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/pix-status?id=${encodeURIComponent(pix.id)}`);
        const { status } = await r.json();
        if (status === "paid" || status === "authorized") setStep("paid");
        else if (["refused", "canceled", "cancelled", "expired"].includes(status)) setStep("failed");
      } catch { /* tenta de novo no próximo ciclo */ }
    }, 5000);
    return () => clearInterval(t);
  }, [step, pix]);

  const STAGE_KEYS: Record<1 | 2, string[]> = {
    1: ["cep", "street", "number", "neighborhood", "city", "state"],
    2: ["name", "email", "cpf", "phone"],
  };

  const validate = (st: 1 | 2) => {
    const all: Record<string, string> = {};
    if (form.name.trim().split(/\s+/).length < 2) all.name = "Informe nome e sobrenome";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) all.email = "E-mail inválido";
    if (!isValidCPF(form.cpf)) all.cpf = "CPF inválido";
    if (onlyDigits(form.phone).length < 10) all.phone = "Telefone inválido";
    if (onlyDigits(form.cep).length !== 8) all.cep = "CEP inválido";
    if (!form.street.trim()) all.street = "Obrigatório";
    if (!form.number.trim()) all.number = "Obrigatório";
    if (!form.neighborhood.trim()) all.neighborhood = "Obrigatório";
    if (!form.city.trim()) all.city = "Obrigatório";
    if (form.state.length !== 2) all.state = "UF";
    const e: Record<string, string> = {};
    for (const k of STAGE_KEYS[st]) if (all[k]) e[k] = all[k];
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goStage = (n: 1 | 2 | 3) => {
    setStage(n);
    setApiError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setApiError("");
    if (stage !== 3) {
      if (!validate(stage)) {
        setTimeout(() => document.querySelector("[data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        return;
      }
      goStage((stage + 1) as 2 | 3);
      return;
    }
    if (!validate(1)) return goStage(1);
    if (!validate(2)) return goStage(2);
    setLoading(true);
    try {
      const r = await fetch("/api/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: current,
          shipping,
          customer: { name: form.name, email: form.email, cpf: form.cpf, phone: form.phone },
          address: {
            cep: form.cep, street: form.street, number: form.number, complement: form.complement,
            neighborhood: form.neighborhood, city: form.city, state: form.state,
          },
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Não foi possível gerar o PIX.");
      setPix(data);
      setStep("pix");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.qrcode); }
    catch {
      const ta = document.getElementById("pix-code") as HTMLTextAreaElement | null;
      ta?.select(); document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const field = (k: keyof typeof EMPTY, text: string, props: Record<string, unknown> = {}, wrap = "") => (
    <div className={wrap} data-error={!!errors[k]}>
      <label htmlFor={k} className={label}>{text}</label>
      <input id={k} value={form[k]} onChange={set(k)} className={`${input} ${errors[k] ? "!border-red-500" : ""}`} {...props} />
      {errors[k] && <p className="mt-1 text-xs font-semibold text-red-600">{errors[k]}</p>}
    </div>
  );

  const summary = useMemo(() => (
    <aside className="rounded-lg border border-line bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="font-bold text-2xl text-forest">Seu pedido</h2>
      <div className="mt-4 flex items-center gap-4">
        <img src="/images/produto.webp" alt="" className="h-20 w-20 rounded-md border border-line object-cover" />
        <div>
          <p className="font-bold text-forest">{offer.name}</p>
          <p className="text-sm text-ink/60">{offer.short}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{brl(offer.priceCents)}</dd></div>
        {cepOk
          ? <div className="flex justify-between"><dt>Frete ({ship.name})</dt><dd className="font-semibold">{brl(ship.priceCents)}</dd></div>
          : <div className="flex justify-between text-ink/60"><dt>Frete</dt><dd>informe o CEP</dd></div>}
        <div className="flex justify-between text-lg font-extrabold text-forest"><dt>Total</dt><dd>{brl(cepOk ? totalCents : offer.priceCents)}</dd></div>
      </dl>
      <p className="mt-4 flex gap-2 rounded-md bg-mint p-3 text-xs text-ink/70"><LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Pagamento por PIX processado pela HyperCash. Frete e prazo conforme informado na compra.</span></p>
    </aside>
  ), [offer, ship, totalCents, cepOk]);

  return (
    <div className="min-h-screen bg-mint">
      <header className="border-b border-line bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-dark"><LockIcon /> Compra segura</span>
        </Container>
      </header>

      <Container className="py-8">
        {step === "paid" && (
          <div className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand text-4xl text-white">✓</div>
            <h1 className="mt-5 font-bold text-4xl text-forest">Pagamento confirmado!</h1>
            <p className="mt-3 text-ink/75">Recebemos o seu PIX de <b>{brl(pix?.amount ?? totalCents)}</b>. Em breve você receberá as informações do pedido no e-mail <b>{form.email}</b>.</p>
            {STORE.whatsapp && (
              <a href={`https://wa.me/${STORE.whatsapp}`} className="mt-5 inline-block font-bold text-brand underline" target="_blank" rel="noreferrer">Falar com o atendimento</a>
            )}
            <Link to="/" className="mt-6 block rounded-md bg-brand py-3 font-extrabold text-white">Voltar para a loja</Link>
          </div>
        )}

        {step === "failed" && (
          <div className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-sm">
            <h1 className="font-bold text-4xl text-forest">PIX expirado ou cancelado</h1>
            <p className="mt-3 text-ink/75">Não identificamos o pagamento. Você pode gerar um novo PIX.</p>
            <button onClick={() => { setStep("form"); setPix(null); setStage(3); }} className="mt-6 w-full rounded-md bg-brand py-3 font-extrabold text-white">Gerar novo PIX</button>
          </div>
        )}

        {step === "pix" && pix && (
          <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg bg-white p-6 text-center shadow-sm sm:p-8">
              <h1 className="font-bold text-3xl text-forest sm:text-4xl">Pague com PIX</h1>
              <p className="mt-2 text-ink/70">Abra o app do seu banco, escolha <b>PIX</b> e escaneie o QR Code ou use o código copia e cola.</p>
              <p className="mt-4 font-bold text-5xl text-brand-dark">{brl(pix.amount)}</p>
              {qrImg ? <img src={qrImg} alt="QR Code PIX" className="mx-auto mt-4 h-64 w-64 rounded-md border border-line p-2" /> : <div className="mx-auto mt-4 h-64 w-64 animate-pulse rounded-md bg-mint" />}
              <textarea id="pix-code" readOnly value={pix.qrcode} rows={3} className="mt-4 w-full resize-none rounded-md border border-line bg-mint p-3 text-xs" onFocus={(e) => e.currentTarget.select()} />
              <button onClick={copy} className="mt-3 w-full rounded-md bg-brand py-3.5 font-extrabold text-white hover:bg-brand-dark">
                {copied ? "✓ Código copiado!" : "Copiar código PIX"}
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink/60">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" /> Aguardando pagamento… esta tela atualiza sozinha.
              </p>
              {pix.expirationDate && <p className="mt-1 text-xs text-ink/50">Válido até {new Date(pix.expirationDate).toLocaleString("pt-BR")}</p>}
            </div>
            {summary}
          </div>
        )}

        {step === "form" && (
          <img src="/images/checkout-banner.webp" alt="Blaster: diversão e aventura em cada tiro" width={1774} height={887}
            className="mx-auto mb-6 block w-full max-w-5xl rounded-lg shadow-sm" />
        )}

        {step === "form" && (
          <form onSubmit={onSubmit} noValidate className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              {/* Indicador de etapas */}
              <ol className="flex items-center justify-between gap-2 rounded-lg bg-white p-4 shadow-sm" aria-label="Etapas da compra">
                {([["Entrega", 1], ["Seus dados", 2], ["Pagamento", 3]] as const).map(([name, n]) => (
                  <li key={n} className="flex flex-1 flex-col items-center gap-1 text-center" aria-current={stage === n ? "step" : undefined}>
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold ${stage >= n ? "bg-brand text-white" : "bg-line text-ink/50"}`}>{stage > n ? "✓" : n}</span>
                    <span className={`text-xs font-bold ${stage === n ? "text-forest" : "text-ink/50"}`}>{name}</span>
                  </li>
                ))}
              </ol>

              {stage === 1 && (
                <>
                  <section className="rounded-lg bg-white p-5 shadow-sm sm:p-7">
                    <h2 className="font-bold text-2xl text-forest">Para onde vamos enviar?</h2>
                    <p className="mt-1 text-sm text-ink/60">Digite o CEP para ver as opções de frete.</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-6">
                      <div className="sm:col-span-3" data-error={!!errors.cep}>
                        <label htmlFor="cep" className={label}>CEP {cepLoading && <span className="font-normal text-ink/50">buscando…</span>}</label>
                        <input id="cep" value={form.cep} onChange={set("cep")} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" className={`${input} ${errors.cep ? "!border-red-500" : ""}`} />
                        {errors.cep && <p className="mt-1 text-xs font-semibold text-red-600">{errors.cep}</p>}
                      </div>
                    </div>

                    {cepOk && (
                      <>
                        <h3 className="mt-6 font-bold text-lg text-forest">Escolha o frete</h3>
                        <div className="mt-3 space-y-3" role="radiogroup" aria-label="Opções de frete">
                          {Object.values(SHIPPING).map((o) => (
                            <label key={o.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition sm:gap-4 sm:p-4 ${shipping === o.id ? "border-brand bg-brand/10" : "border-line hover:border-brand/50"}`}>
                              <input type="radio" name="shipping" value={o.id} checked={shipping === o.id} onChange={() => setShipping(o.id)} className="h-5 w-5 shrink-0 accent-brand" />
                              <img src="/images/correios.webp" alt="Correios" width={240} height={240} className="h-12 w-12 shrink-0 rounded object-contain" />
                              <span className="flex-1 font-bold text-forest">{o.name}<span className="block text-xs font-normal text-ink/60">Correios · entrega em {o.days} úteis</span></span>
                              <span className="font-bold text-xl text-brand-dark">{brl(o.priceCents)}</span>
                            </label>
                          ))}
                        </div>

                        <h3 className="mt-6 font-bold text-lg text-forest">Endereço de entrega</h3>
                        <div className="mt-3 grid gap-4 sm:grid-cols-6">
                          {field("street", "Rua / Avenida", { autoComplete: "address-line1" }, "sm:col-span-4")}
                          <div className="sm:col-span-2" data-error={!!errors.number}>
                            <label htmlFor="number" className={label}>Número</label>
                            <input id="number" ref={numberRef} value={form.number} onChange={set("number")} className={`${input} ${errors.number ? "!border-red-500" : ""}`} />
                            {errors.number && <p className="mt-1 text-xs font-semibold text-red-600">{errors.number}</p>}
                          </div>
                          {field("complement", "Complemento (opcional)", {}, "sm:col-span-6")}
                          {field("neighborhood", "Bairro", {}, "sm:col-span-3")}
                          {field("city", "Cidade", { autoComplete: "address-level2" }, "sm:col-span-2")}
                          {field("state", "UF", { maxLength: 2, autoComplete: "address-level1" }, "sm:col-span-1")}
                        </div>
                      </>
                    )}
                  </section>
                </>
              )}

              {stage === 2 && (
                <section className="rounded-lg bg-white p-5 shadow-sm sm:p-7">
                  <h2 className="font-bold text-2xl text-forest">Seus dados</h2>
                  <p className="mt-1 text-sm text-ink/60">Usamos para emitir o pedido e avisar sobre a entrega.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {field("name", "Nome completo", { autoComplete: "name" }, "sm:col-span-2")}
                    {field("email", "E-mail", { type: "email", autoComplete: "email", inputMode: "email" })}
                    {field("phone", "Telefone / WhatsApp", { autoComplete: "tel", inputMode: "tel", placeholder: "(00) 00000-0000" })}
                    {field("cpf", "CPF", { inputMode: "numeric", placeholder: "000.000.000-00" }, "sm:col-span-2")}
                  </div>
                </section>
              )}

              {stage === 3 && (
                <section className="rounded-lg bg-white p-5 shadow-sm sm:p-7">
                  <h2 className="font-bold text-2xl text-forest">Pagamento</h2>
                  <p className="mt-1 text-sm text-ink/60">Confira os dados e pague com PIX. O QR Code é gerado na próxima tela.</p>
                  <div className="mt-4 divide-y divide-line rounded-lg border border-line text-sm">
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="font-bold text-forest">Entrega · {ship.name} ({ship.days} úteis)</p>
                        <p className="text-ink/70">{form.street}, {form.number}{form.complement ? ` – ${form.complement}` : ""}</p>
                        <p className="text-ink/70">{form.neighborhood} · {form.city}/{form.state} · CEP {form.cep}</p>
                      </div>
                      <button type="button" onClick={() => goStage(1)} className="shrink-0 font-bold text-brand underline">Editar</button>
                    </div>
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="font-bold text-forest">{form.name}</p>
                        <p className="text-ink/70">{form.email} · {form.phone}</p>
                        <p className="text-ink/70">CPF {form.cpf}</p>
                      </div>
                      <button type="button" onClick={() => goStage(2)} className="shrink-0 font-bold text-brand underline">Editar</button>
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-2 rounded-md bg-mint p-3 text-sm font-semibold text-forest"><span aria-hidden>⚡</span> Pagamento por PIX: aprovação na hora.</p>
                </section>
              )}

              {apiError && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700">{apiError}</p>}

              <div className="flex gap-3">
                {stage > 1 && (
                  <button type="button" onClick={() => goStage((stage - 1) as 1 | 2)} className="rounded-lg border-2 border-line bg-white px-5 py-4 font-bold text-forest hover:border-brand/50">Voltar</button>
                )}
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg bg-brand py-4 text-lg font-extrabold tracking-wide text-white transition hover:bg-brand-dark disabled:opacity-60">
                  {stage === 3 ? (loading ? "Gerando PIX…" : `Pagar ${brl(totalCents)} com PIX`) : "Continuar"}
                </button>
              </div>
              {stage === 3 && <p className="text-center text-xs text-ink/55">Ao continuar você concorda com os <Link to="/legal/termos" className="underline">termos de compra</Link>.</p>}
            </div>
            {summary}
          </form>
        )}
      </Container>
    </div>
  );
}
