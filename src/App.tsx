import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Legal from "./pages/Legal";

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout/:offerId?" element={<Checkout />} />
        <Route path="/legal/:slug" element={<Legal />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
