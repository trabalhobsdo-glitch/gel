import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Legal from "./pages/Legal";

// Avisa o servidor (aparece nos Logs da Vercel): entrou, clicou, saiu.
function send(data: Record<string, unknown>) {
  try {
    const body = JSON.stringify(data);
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* nunca atrapalha o site */ }
}

function Track() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    send({ evento: "entrou", pagina: pathname, origem: document.referrer || search || "direto" });
  }, [pathname]);
  useEffect(() => {
    const t0 = Date.now();
    const onHide = () => {
      if (document.visibilityState === "hidden") send({ evento: "saiu", pagina: location.pathname, segundos: Math.round((Date.now() - t0) / 1000) });
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("button, a") as HTMLElement | null;
      const texto = el?.innerText?.trim().replace(/\s+/g, " ");
      if (texto) send({ evento: "clicou", pagina: location.pathname, texto });
    };
    document.addEventListener("visibilitychange", onHide);
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("visibilitychange", onHide); document.removeEventListener("click", onClick, true); };
  }, []);
  return null;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Track />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout/:offerId?" element={<Checkout />} />
        <Route path="/legal/:slug" element={<Legal />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
