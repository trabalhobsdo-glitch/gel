import { Link, useParams } from "react-router-dom";
import { Container, Logo } from "../components/ui";
import { SHIPPING, STORE } from "../config";

type Section = { h: string; p?: string[]; ul?: string[] };
type Page = { title: string; intro: string; sections: Section[] };

// Canais de contato: só aparecem os que estiverem preenchidos em src/config.ts (STORE).
const contactLines = () => {
  const l: string[] = [];
  if (STORE.email) l.push(`E-mail: ${STORE.email}`);
  if (STORE.whatsapp) l.push(`WhatsApp: https://wa.me/${STORE.whatsapp}`);
  if (!l.length) l.push("Responda ao e-mail de confirmação do seu pedido ou use os canais de atendimento informados neste site.");
  return l;
};

const PAGES: Record<string, Page> = {
  privacidade: {
    title: "Política de Privacidade",
    intro: `A ${STORE.name} respeita a sua privacidade e trata os seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018). Esta política explica quais dados coletamos, para que usamos e quais são os seus direitos.`,
    sections: [
      {
        h: "1. Dados que coletamos",
        ul: [
          "Dados de cadastro e compra: nome completo, CPF, e-mail, telefone e endereço de entrega.",
          "Dados do pedido: produtos escolhidos, valores, forma de entrega e status do pagamento.",
          "Dados de navegação: páginas visitadas, cliques, tempo de permanência, tipo de aparelho e origem do acesso.",
        ],
      },
      {
        h: "2. Para que usamos os dados",
        ul: [
          "Processar e confirmar o pedido e o pagamento.",
          "Entregar o produto e informar sobre o andamento da entrega.",
          "Atender solicitações de suporte, troca, devolução e reembolso.",
          "Cumprir obrigações legais, fiscais e de prevenção a fraudes.",
          "Melhorar o site e medir a eficiência de anúncios.",
        ],
      },
      {
        h: "3. Com quem compartilhamos",
        p: ["Compartilhamos apenas o necessário para a compra acontecer:"],
        ul: [
          "Processadora de pagamentos (HyperCash), para gerar e confirmar o PIX.",
          "Transportadoras e Correios, para a entrega do pedido.",
          "Ferramentas de análise e anúncios (como o Meta Pixel), para medir visitas e conversões.",
          "Autoridades públicas, quando houver obrigação legal ou ordem judicial.",
        ],
      },
      {
        h: "4. Não vendemos seus dados",
        p: ["Não vendemos nem alugamos seus dados pessoais a terceiros."],
      },
      {
        h: "5. Cookies e tecnologias semelhantes",
        p: ["Usamos cookies e identificadores para o funcionamento do site, para lembrar suas escolhas e para medir o desempenho de anúncios. Você pode bloquear ou apagar cookies nas configurações do seu navegador, mas algumas partes do site podem deixar de funcionar corretamente."],
      },
      {
        h: "6. Segurança e armazenamento",
        p: ["Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração. O pagamento por PIX é processado pela processadora de pagamentos, e nós não armazenamos dados bancários. Mantemos os dados pelo tempo necessário para cumprir as finalidades acima e as obrigações legais."],
      },
      {
        h: "7. Seus direitos (LGPD)",
        p: ["Você pode solicitar, a qualquer momento:"],
        ul: [
          "Confirmação de que tratamos seus dados e acesso a eles.",
          "Correção de dados incompletos, inexatos ou desatualizados.",
          "Anonimização, bloqueio ou eliminação de dados desnecessários.",
          "Portabilidade dos dados e informações sobre compartilhamento.",
          "Revogação do consentimento, quando o tratamento se basear nele.",
        ],
      },
      {
        h: "8. Menores de idade",
        p: [`Nossos produtos são vendidos para maiores de 18 anos ou para menores com acompanhamento e autorização de um responsável. A faixa etária indicada na embalagem do produto é ${STORE.minAge} anos.`],
      },
      {
        h: "9. Alterações desta política",
        p: ["Podemos atualizar esta política para refletir mudanças legais ou no funcionamento da loja. A versão mais recente ficará sempre disponível nesta página."],
      },
      { h: "10. Contato sobre privacidade", p: contactLines() },
    ],
  },

  termos: {
    title: "Termos de Compra",
    intro: `Ao comprar na ${STORE.name}, você concorda com os termos abaixo. Eles seguem o Código de Defesa do Consumidor (Lei nº 8.078/1990) e o Decreto do Comércio Eletrônico (Decreto nº 7.962/2013).`,
    sections: [
      ...(STORE.legalName ? [{ h: "Identificação do fornecedor", p: [STORE.legalName] }] : []),
      {
        h: "1. Produtos e informações",
        p: ["Descrevemos os produtos com a maior fidelidade possível. As imagens são ilustrativas e podem apresentar pequenas diferenças em relação ao item real. Os produtos são recreativos: use sempre proteção ocular e siga a faixa etária indicada na embalagem."],
      },
      {
        h: "2. Preços e pagamento",
        ul: [
          "Os preços estão em reais (R$) e valem no momento da compra.",
          "O pagamento é feito por PIX, com confirmação em poucos instantes.",
          "O pedido só é processado após a confirmação do pagamento.",
          "O PIX gerado tem prazo de validade. Se expirar, é preciso gerar um novo.",
        ],
      },
      {
        h: "3. Frete e prazo de entrega",
        ul: [
          `Opções de envio: ${Object.values(SHIPPING).map((s) => `${s.name} (${s.days})`).join(" e ")}, conforme o CEP informado.`,
          "O prazo começa a contar após a confirmação do pagamento e o envio do pedido.",
          "Você receberá as informações do pedido no e-mail informado na compra.",
          "É responsabilidade do cliente informar o endereço completo e correto. Pedidos devolvidos por endereço incorreto ou ausência de recebedor podem gerar novo frete.",
        ],
      },
      {
        h: "4. Recebimento",
        p: ["Confira a embalagem no ato da entrega. Se houver avarias aparentes, recuse o recebimento ou registre a ocorrência e entre em contato com o nosso suporte o quanto antes."],
      },
      {
        h: "5. Cancelamento",
        p: ["Você pode cancelar o pedido antes do envio, entrando em contato com o suporte. Após o envio, valem as regras de troca e devolução."],
      },
      {
        h: "6. Troca, devolução e garantia",
        p: ["As regras completas estão na página de Troca e Devolução."],
      },
      {
        h: "7. Responsabilidade de uso",
        p: ["Menores devem usar o produto com supervisão de um adulto. Não aponte para o rosto, olhos ou animais, e use óculos de proteção. O uso inadequado é de responsabilidade do usuário."],
      },
      {
        h: "8. Dados pessoais",
        p: ["O tratamento dos seus dados segue a nossa Política de Privacidade."],
      },
      {
        h: "9. Foro",
        p: ["Fica eleito o foro do domicílio do consumidor para resolver eventuais conflitos, conforme o Código de Defesa do Consumidor."],
      },
    ],
  },

  trocas: {
    title: "Política de Troca e Devolução",
    intro: "Queremos que você fique satisfeito com a sua compra. Veja abaixo como funcionam o arrependimento, a troca por defeito e o reembolso.",
    sections: [
      {
        h: "1. Direito de arrependimento (7 dias)",
        p: ["Como a compra é feita pela internet, você pode desistir em até 7 dias corridos a partir do recebimento do produto (art. 49 do Código de Defesa do Consumidor), sem precisar justificar."],
        ul: [
          "O produto deve ser devolvido sem sinais de uso, com todos os acessórios e, de preferência, na embalagem original.",
          "Em caso de desistência, devolvemos o valor pago, inclusive o frete da compra.",
        ],
      },
      {
        h: "2. Produto com defeito",
        p: ["Se o produto chegar com defeito, avariado ou diferente do pedido, você tem direito à troca, ao reparo ou ao reembolso, conforme a garantia legal do Código de Defesa do Consumidor (90 dias para produtos duráveis)."],
        ul: [
          "Entre em contato com o suporte e envie fotos ou um vídeo do problema.",
          "Nesses casos, o custo do frete de devolução é por nossa conta.",
        ],
      },
      {
        h: "3. Como solicitar",
        ul: [
          "Fale com o nosso suporte informando o número do pedido e o motivo.",
          "Vamos orientar sobre o envio de volta e o endereço de devolução.",
          "Guarde o comprovante de postagem até a conclusão do processo.",
        ],
      },
      {
        h: "4. Reembolso",
        ul: [
          "O reembolso é feito após o recebimento e a conferência do produto devolvido.",
          "O valor é devolvido pelo mesmo meio de pagamento. Como a compra é por PIX, a devolução é feita por PIX para a conta de origem do pagamento.",
          "O prazo é de até 10 dias úteis após a aprovação da devolução.",
        ],
      },
      {
        h: "5. Quando não é possível trocar ou devolver",
        ul: [
          "Produtos com sinais de uso inadequado, mau uso, quedas ou danos causados pelo cliente.",
          "Produtos sem os acessórios ou itens que acompanham a compra.",
          "Pedidos fora dos prazos acima.",
        ],
      },
      { h: "6. Contato", p: contactLines() },
    ],
  },

  suporte: {
    title: "Suporte e Atendimento",
    intro: "Precisa de ajuda com o seu pedido? Veja abaixo os canais de atendimento e as dúvidas mais comuns.",
    sections: [
      { h: "Canais de atendimento", p: contactLines() },
      {
        h: "O que informar ao entrar em contato",
        ul: [
          "Seu nome completo e o e-mail usado na compra.",
          "O número do pedido, se você tiver.",
          "Uma descrição do que aconteceu. Se for defeito ou avaria, envie fotos ou vídeo.",
        ],
      },
      {
        h: "Onde está o meu pedido?",
        p: [`Após a confirmação do pagamento, o pedido é preparado e enviado. O prazo depende do frete escolhido: ${Object.values(SHIPPING).map((s) => `${s.name} (${s.days})`).join(" e ")}. As informações do pedido são enviadas para o e-mail informado na compra. Confira também a caixa de spam.`],
      },
      {
        h: "Paguei o PIX e não recebi a confirmação",
        p: ["A confirmação do PIX costuma ser rápida. Se passar de alguns minutos, entre em contato com o comprovante do pagamento e o e-mail usado na compra."],
      },
      {
        h: "Quero trocar, devolver ou cancelar",
        p: ["Consulte as regras na página de Troca e Devolução e fale com o suporte informando o número do pedido."],
      },
      {
        h: "Meus dados e privacidade",
        p: ["Para pedidos relacionados aos seus dados pessoais (acesso, correção ou exclusão), veja a Política de Privacidade."],
      },
    ],
  },
};

const renderLine = (t: string) =>
  t.includes("https://wa.me/")
    ? <a href={t.slice(t.indexOf("https://"))} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">{t}</a>
    : t;

export default function Legal() {
  const { slug = "" } = useParams();
  const page = PAGES[slug];
  return (
    <main className="min-h-screen bg-mint">
      <Container className="py-8">
        <Logo />
        <h1 className="mt-10 text-2xl font-bold text-ink sm:text-3xl">{page?.title ?? "Informações"}</h1>
        {page ? (
          <div className="mt-4 max-w-2xl text-ink/80">
            <p>{page.intro}</p>
            {page.sections.map((s) => (
              <section key={s.h} className="mt-6">
                <h2 className="text-lg font-bold text-ink">{s.h}</h2>
                {s.p?.map((t, i) => <p key={i} className="mt-2">{renderLine(t)}</p>)}
                {s.ul && <ul className="mt-2 list-disc space-y-1 pl-5">{s.ul.map((t) => <li key={t}>{t}</li>)}</ul>}
              </section>
            ))}
            <p className="mt-8 text-sm text-ink/55">Última atualização: {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}.</p>
          </div>
        ) : (
          <p className="mt-4 max-w-2xl text-ink/80">Página não encontrada.</p>
        )}
        <Link to="/" className="mt-8 inline-block font-bold text-brand underline">← Voltar para a loja</Link>
      </Container>
    </main>
  );
}
