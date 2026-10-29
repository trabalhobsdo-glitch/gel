import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ButtonLink, CheckIcon, Container, Heading, Logo, LockIcon } from "../components/ui";
import { OFFERS, STORE, kitUnitCents, savingsCents } from "../config";
import { brl } from "../lib/format";

const UNIT = OFFERS.unitario;
const KIT = OFFERS["kit-duplo"];

const PHOTOS = [
  { src: "/images/hero.webp", w: 995, h: 1580, alt: "Crianças brincando com a Super M4 Blaster usando óculos de proteção" },
  { src: "/images/produto.webp", w: 1000, h: 997, alt: "Super M4 Blaster verde e branca ao lado da embalagem" },
  { src: "/images/closeup.webp", w: 1000, h: 998, alt: "Detalhe do cano, da mira e do tambor" },
  { src: "/images/detalhe.webp", w: 998, h: 1000, alt: "Super M4 Blaster sobre deck de madeira" },
  { src: "/images/kit.webp", w: 989, h: 1000, alt: "Embalagem com blaster, óculos de proteção e bolinhas de gel" },
  { src: "/images/uso.webp", w: 1000, h: 765, alt: "Super M4 Blaster sendo segurada em dois ângulos" },
];

const FEATURES = [
  { img: "/images/f-mira.webp", title: "Disparo automático", text: "Sistema elétrico: segure o gatilho e continue a partida sem parar a cada tiro." },
  { img: "/images/f-tambor.webp", title: "Tambor grande", text: "Carregador em formato de tambor, para ficar mais tempo jogando entre uma recarga e outra." },
  { img: "/images/f-design.webp", title: "Mira superior", text: "Visual verde e branco, com mira no topo e empunhadura com bom apoio." },
  { img: "/images/f-material.webp", title: "Material resistente", text: "Corpo em plástico rígido, pensado para brincar ao ar livre." },
];

const SPECS: [string, string][] = [
  ["Produto", "Super M4 Blaster Elétrica de Gel"],
  ["Tipo de disparo", "Automático, elétrico"],
  ["Carregador", "Tambor"],
  ["Cores", "Verde e branco"],
  ["Munição", "Bolinhas de gel hidratadas (7 a 8 mm)"],
  ["Idade indicada", `${STORE.minAge} anos, conforme a embalagem`],
  ["Na oferta", "1 blaster, 1 par de óculos de proteção e 1 sachê de bolinhas de gel"],
];

const SAFETY = [
  "Use sempre os óculos de proteção durante a brincadeira.",
  "Nunca mire nos olhos ou no rosto.",
  "Brinque em local apropriado e combine as regras antes de começar.",
  `Respeite a faixa etária da embalagem (${STORE.minAge}).`,
  "Mantenha o produto e as bolinhas longe de crianças pequenas.",
];

const FAQ = [
  ["Quanto custa?", `Uma unidade custa ${brl(UNIT.priceCents)}. O kit com duas sai por ${brl(KIT.priceCents)} (${brl(kitUnitCents)} cada).`],
  ["Como posso pagar?", "Por PIX, dentro do próprio site. O pedido é confirmado assim que o pagamento é compensado."],
  ["O produto é automático?", "Sim, o disparo é elétrico e automático."],
  ["O que vem na caixa?", "Uma blaster, um par de óculos de proteção e um sachê de bolinhas de gel. Confira o conteúdo informado antes de finalizar a compra."],
  ["Qual é o prazo de entrega?", "O prazo e as condições de envio aparecem durante a compra, de acordo com a sua região."],
  ["Qual é a idade recomendada?", `A embalagem indica ${STORE.minAge} anos. Siga sempre a faixa etária do fabricante.`],
];

function Gallery() {
  const [i, setI] = useState(0);
  const p = PHOTOS[i];
  return (
    <div className="md:flex md:flex-row-reverse md:gap-3">
      <div className="relative flex-1 overflow-hidden bg-white md:rounded-md md:border md:border-line">
        <img
          key={p.src} src={p.src} alt={p.alt} width={p.w} height={p.h} fetchPriority="high"
          className="mx-auto block max-h-[78svh] w-full object-contain md:max-h-[560px]"
        />
        <span className="absolute bottom-3 right-3 rounded bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">{i + 1}/{PHOTOS.length}</span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-4 py-3 md:flex-col md:overflow-visible md:bg-transparent md:p-0">
        {PHOTOS.map((t, n) => (
          <button
            key={t.src} onClick={() => setI(n)} aria-label={`Ver foto ${n + 1}`} aria-current={n === i}
            className={`h-14 w-14 shrink-0 overflow-hidden rounded border-2 bg-white md:h-16 md:w-16 ${n === i ? "border-brand" : "border-line"}`}
          >
            <img src={t.src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-16 bg-white py-8 sm:py-10 md:mt-4 md:rounded-md md:border md:border-line ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export default function Home() {
  const [offersVisible, setOffersVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById("ofertas");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOffersVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className="bg-brand-dark py-1.5 text-center text-xs font-medium text-white">
        Pagamento por PIX direto no site
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <Container className="flex h-14 items-center justify-between">
          <Logo className="h-11" />
          <a href="#ofertas" className="rounded-md bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark">Ver ofertas</a>
        </Container>
      </header>

      <main className="pb-20 md:pb-10">
        {/* PRODUTO (primeira dobra) */}
        <div className="mx-auto max-w-6xl md:px-6 md:pt-5">
          <div className="bg-white md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-8 md:rounded-md md:border md:border-line md:p-6">
            <Gallery />
            <div className="px-4 pb-6 pt-4 md:p-0">
              <p className="text-xs text-ink/60">Novo · Lançador de gel elétrico</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">Super M4 Blaster Elétrica de Gel Automática</h1>

              <p className="mt-4 text-sm text-ink/60">A partir de</p>
              <p className="text-4xl font-bold leading-none">{brl(UNIT.priceCents)}</p>
              <p className="mt-1.5 text-sm text-brand-dark">no PIX, pagamento direto no site</p>

              <div className="mt-4 rounded-md border border-line bg-mint p-3 text-sm">
                <p className="font-semibold">Kit com 2 blasters: {brl(KIT.priceCents)}</p>
                <p className="text-ink/65">{brl(kitUnitCents)} cada. Você economiza {brl(savingsCents)}.</p>
              </div>

              <ul className="mt-5 space-y-2 text-sm">
                {["Disparo automático e tambor de alta capacidade", "Óculos de proteção e bolinhas de gel na oferta", "Idade indicada na embalagem: " + STORE.minAge].map((t) => (
                  <li key={t} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{t}</li>
                ))}
              </ul>

              <ButtonLink href="#ofertas" className="mt-6 w-full text-base">Ver ofertas</ButtonLink>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/60"><LockIcon className="h-3.5 w-3.5" /> Compra segura. Frete e prazo informados no pedido.</p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl md:px-6">
          {/* CARACTERÍSTICAS */}
          <Section className="mt-2">
            <Heading title="Características do produto" />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <article key={f.title} className="overflow-hidden rounded-md border border-line">
                  <img src={f.img} alt={f.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-3">
                    <h3 className="text-sm font-bold sm:text-base">{f.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/70 sm:text-sm">{f.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          {/* O QUE VEM */}
          <Section className="mt-2">
            <div className="grid items-center gap-6 md:grid-cols-2">
              <img src="/images/kit.webp" alt="Blaster com óculos de proteção e bolinhas de gel" loading="lazy" className="w-full rounded-md border border-line" />
              <div>
                <Heading title="O que vem na oferta" />
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {["1 Super M4 Blaster elétrica de gel", "1 par de óculos de proteção", "1 sachê de bolinhas de gel"].map((t) => (
                    <li key={t} className="flex items-center gap-3 py-3 text-sm font-medium"><CheckIcon className="h-4 w-4 text-brand" />{t}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink/55">Imagem ilustrativa. Confira o conteúdo informado antes de finalizar a compra.</p>
              </div>
            </div>
          </Section>

          {/* MUNIÇÃO */}
          <Section className="mt-2">
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <Heading title="Como preparar a munição" />
                <p className="mt-3 text-sm leading-relaxed text-ink/80">
                  As bolinhas vêm secas, como cristais de gel. Deixe-as em água limpa por algumas horas, até chegarem a cerca de 7–8 mm. Depois é só carregar o tambor.
                </p>
                <p className="mt-2 text-xs text-ink/55">Siga sempre as instruções do fabricante.</p>
              </div>
              <img src="/images/municao.webp" alt="Cristais de gel hidratando em água até formarem as bolinhas" loading="lazy" className="w-full max-w-sm justify-self-center rounded-md border border-line" />
            </div>
          </Section>

          {/* OFERTAS */}
          <Section id="ofertas" className="mt-2">
            <Heading title="Escolha sua oferta" sub="Pagamento por PIX, direto no site." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                { o: UNIT, note: "Uma unidade para começar.", extra: null as string | null, best: false },
                { o: KIT, note: "Duas blasters para jogar em dupla.", extra: `${brl(kitUnitCents)} cada · economize ${brl(savingsCents)}`, best: true },
              ].map(({ o, note, extra, best }) => (
                <article key={o.id} className={`flex flex-col rounded-md border p-4 ${best ? "border-brand ring-1 ring-brand" : "border-line"}`}>
                  {best && <p className="mb-2 w-fit rounded bg-brand px-2 py-0.5 text-xs font-bold text-white">Mais vantajoso</p>}
                  <div className="flex gap-4">
                    <img src="/images/produto.webp" alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded border border-line object-cover" />
                    <div>
                      <h3 className="font-semibold leading-snug">{o.name}</h3>
                      <p className="mt-0.5 text-sm text-ink/65">{note}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-bold">{brl(o.priceCents)}</p>
                  <p className="mt-0.5 min-h-5 text-sm text-brand-dark">{extra ?? "no PIX"}</p>
                  <ButtonLink to={`/checkout/${o.id}`} className="mt-4 w-full">Comprar {o.qty === 1 ? "1 unidade" : "kit com 2"}</ButtonLink>
                </article>
              ))}
            </div>
          </Section>

          {/* ESPECIFICAÇÕES */}
          <Section className="mt-2">
            <Heading title="Especificações" />
            <dl className="mt-4 overflow-hidden rounded-md border border-line text-sm">
              {SPECS.map(([k, v], n) => (
                <div key={k} className={`grid grid-cols-[120px_1fr] sm:grid-cols-[200px_1fr] ${n % 2 ? "bg-white" : "bg-mint"}`}>
                  <dt className="px-4 py-2.5 font-semibold">{k}</dt>
                  <dd className="px-4 py-2.5 text-ink/80">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          {/* USO + SEGURANÇA */}
          <Section className="mt-2">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Heading title="Para brincar com a turma" />
                <p className="mt-3 text-sm text-ink/80">Aniversários, encontros com amigos, atividades em família e confraternizações.</p>
                <img src="/images/uso.webp" alt="Super M4 Blaster sendo segurada em dois ângulos" loading="lazy" className="mt-4 w-full rounded-md border border-line" />
              </div>
              <div>
                <Heading title="Segurança em primeiro lugar" />
                <ul className="mt-3 space-y-2.5 text-sm">
                  {SAFETY.map((t) => (
                    <li key={t} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* FAQ */}
          <Section className="mt-2">
            <Heading title="Perguntas frequentes" />
            <div className="mt-4 divide-y divide-line border-y border-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-3.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold sm:text-base">
                    {q}<span className="text-xl leading-none text-ink/40 transition group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-2 text-sm text-ink/75">{a}</p>
                </details>
              ))}
            </div>
            <ButtonLink href="#ofertas" variant="light" className="mt-6 w-full sm:w-auto">Voltar às ofertas</ButtonLink>
          </Section>
        </div>
      </main>

      {/* BARRA FIXA MOBILE */}
      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,.06)] transition-transform md:hidden ${offersVisible ? "translate-y-full" : ""}`}>
        <a href="#ofertas" className="flex items-center justify-between rounded-md bg-brand px-4 py-3 font-bold text-white">
          <span>Ver ofertas</span><span>a partir de {brl(UNIT.priceCents)}</span>
        </a>
      </div>

      <footer className="border-t border-line bg-white py-8 text-sm text-ink/70">
        <Container className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo className="h-12" />
            {STORE.legalName && <p className="mt-3">{STORE.legalName}</p>}
            {STORE.email && <p className="mt-1">Atendimento: {STORE.email}</p>}
            {STORE.whatsapp && (
              <a className="mt-1 inline-block font-semibold text-brand-dark" href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer">Atendimento via WhatsApp</a>
            )}
          </div>
          <nav className="flex flex-col gap-2" aria-label="Informações legais">
            <Link to="/legal/privacidade" className="hover:text-ink">Política de privacidade</Link>
            <Link to="/legal/termos" className="hover:text-ink">Termos de compra</Link>
            <Link to="/legal/trocas" className="hover:text-ink">Troca e devolução</Link>
          </nav>
        </Container>
        <Container className="mt-6 border-t border-line pt-5 text-xs text-ink/50">
          © {new Date().getFullYear()} {STORE.name}. Imagens ilustrativas. Produto recreativo: use proteção ocular e siga a faixa etária da embalagem.
        </Container>
      </footer>
    </>
  );
}
