import { Link, useParams } from "react-router-dom";
import { Container, Logo } from "../components/ui";

const TITLES: Record<string, string> = {
  privacidade: "Política de Privacidade",
  termos: "Termos de Compra",
  trocas: "Política de Troca e Devolução",
};

export default function Legal() {
  const { slug = "" } = useParams();
  return (
    <main className="min-h-screen bg-mint">
      <Container className="py-8">
        <Logo />
        <h1 className="mt-10 text-2xl font-bold text-ink sm:text-3xl">{TITLES[slug] ?? "Informações"}</h1>
        {/* Substitua este texto pelo conteúdo oficial da sua loja */}
        <p className="mt-4 max-w-2xl text-ink/80">
          Conteúdo a ser publicado pelo lojista. Edite o arquivo <code>src/pages/Legal.tsx</code> com o texto oficial desta página.
        </p>
        <Link to="/" className="mt-8 inline-block font-bold text-brand underline">← Voltar para a loja</Link>
      </Container>
    </main>
  );
}
