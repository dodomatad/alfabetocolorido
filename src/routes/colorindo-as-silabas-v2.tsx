import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Lock,
  Play,
  ArrowRight,
  Gift,
  X,
} from "lucide-react";

import { useFavicon } from "@/hooks/use-favicon";

export const Route = createFileRoute("/colorindo-as-silabas-v2")({
  head: () => ({
    meta: [
      { title: "Colorindo as Sílabas Simples 1° Ano – Kit Completo em PDF" },
      {
        name: "description",
        content:
          "O método Colorindo as Sílabas que ajuda crianças de 4 a 10 anos a aprender a ler até 5x mais rápido, com apenas 10 minutinhos por dia. Sem brigas. Sem pressão, alinhada à BNCC.",
      },
      {
        property: "og:title",
        content: "Colorindo as Sílabas Simples 1° Ano – Kit Completo em PDF",
      },
      {
        property: "og:description",
        content:
          "Kit Completo de Alfabetização 1° Ano (Mais de 490 Páginas de Atividades em PDF). Acesso imediato em PDF.",
      },
      {
        property: "og:image",
        content: "/colorindo-silabas/logo-colorindo-v2.jpg",
      },

      {

        name: "facebook-domain-verification",

        content: "zpxofgzxd1kj14iopsjv6zr72j6w0q",

      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/colorindo-silabas/favicon-colorindo-32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        href: "/colorindo-silabas/favicon-colorindo-192.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/colorindo-silabas/favicon-colorindo-180.png",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Poppins:wght@400;600;700&display=swap",
      },
    ],
    scripts: [
      {
        children:
          "if('scrollRestoration' in history){history.scrollRestoration='manual';}window.scrollTo(0,0);",
      },
    ],
  }),
  component: PaginaColorindoAsSilabas,
});

// ============================================================================
// CONFIGURAÇÃO CENTRAL DE CHECKOUT E TRACKING (MÉTODO KEVANO / SOP-03 & SOP-11)
// Assim que criarmos o nosso próprio checkout na Cakto e o nosso Pixel/Utmify,
// basta colar os IDs abaixo (ou definir nas variáveis VITE_* da Vercel).
// ============================================================================
const CHECKOUT_BASE_URL =
  (import.meta as any).env?.VITE_CHECKOUT_URL ||
  "https://pay.cakto.com.br/mswtxij_1243353";

const META_PIXEL_ID =
  (import.meta as any).env?.VITE_META_PIXEL_ID || "1440658961371185";

const UTMIFY_PIXEL_ID =
  (import.meta as any).env?.VITE_UTMIFY_PIXEL_ID || "";

const CARROSSEL_1 = [
  "/colorindo-silabas/07-J-JA-JE-JI-JO-JU-para-colorir.png",
  "/colorindo-silabas/06-H-HA-HE-HI-HO-HU-para-colorir.png",
  "/colorindo-silabas/05-G-GA-GE-GI-GO-GU-para-colorir.png",
  "/colorindo-silabas/04-F-FA-FE-FI-FO-FU-para-colorir.png",
  "/colorindo-silabas/02-C-CA-CE-CI-CO-CU-para-colorir.png",
  "/colorindo-silabas/03-D-DA-DE-DI-DO-DU-para-colorir.png",
  "/colorindo-silabas/08-L-LA-LE-LI-LO-LU-para-colorir.png",
  "/colorindo-silabas/01-B-BA-BE-BI-BO-BU-para-colorir.png",
];

const CARROSSEL_2 = [
  "/colorindo-silabas/Silabario_7.png",
  "/colorindo-silabas/Silabario_6.png",
  "/colorindo-silabas/Silabario_5.png",
  "/colorindo-silabas/Silabario_4.png",
  "/colorindo-silabas/Silabario_3.png",
  "/colorindo-silabas/Silabario_2.png",
  "/colorindo-silabas/Silabario_9.png",
  "/colorindo-silabas/Silabario_8.png",
];

const DEPOIMENTOS = [
  "/colorindo-silabas/milla-1.png",
  "/colorindo-silabas/cardoso-1.png",
  "/colorindo-silabas/Dias-1.png",
  "/colorindo-silabas/Jo-1.png",
  "/colorindo-silabas/Vanessa-2.png",
  "/colorindo-silabas/Rosangela-1.png",
  "/colorindo-silabas/Pri-1.png",
  "/colorindo-silabas/Tati-1.png",
  "/colorindo-silabas/Meiri-1.png",
  "/colorindo-silabas/Luh-1.png",
  "/colorindo-silabas/Vanessa-1-1.png",
  "/colorindo-silabas/Kheir-1.png",
  "/colorindo-silabas/Edina-1.png",
  "/colorindo-silabas/Screenshot_2-1.png",
  "/colorindo-silabas/Screenshot_1-1.png",
  "/colorindo-silabas/cidianejarde-1.png",
  "/colorindo-silabas/adri-1.png",
  "/colorindo-silabas/Imagem-sem-titulo-1.png",
];

const DEPOIMENTOS_LINHA_1 = DEPOIMENTOS.slice(0, 9);
const DEPOIMENTOS_LINHA_2 = DEPOIMENTOS.slice(9, 18);

const FAQS = [
  {
    pergunta: "Quais as Formas de Pagamento?",
    resposta:
      "PIX ou Cartão de Crédito.\nPagando via PIX ou Cartão de Crédito, a liberação do acesso é imediata e você já pode baixar e imprimir todas as atividades na mesma hora.",
  },
  {
    pergunta: "Tem garantia?",
    resposta:
      "Sim! Você conta com 7 dias de garantia incondicional. Caso o material não atenda à sua expectativa, devolvemos 100% do seu investimento direto pela plataforma de pagamento.",
  },
  {
    pergunta: "Como vou ter acesso ao Material?",
    resposta:
      "Assim que o pagamento é confirmado, você recebe automaticamente o acesso à Central de Downloads e também no seu e-mail cadastrado.\nO conteúdo é 100% digital em formato PDF de alta resolução (configurado para folha A4 comum), pronto para baixar no celular ou computador e imprimir quantas vezes quiser.",
  },
  {
    pergunta: "Para qual idade é indicado?",
    resposta:
      "É ideal para crianças de 5 a 8 anos (Educação Infantil e 1°/2° Ano do Ensino Fundamental) que estão aprendendo a juntar as famílias silábicas simples e desenvolvendo a leitura e escrita.",
  },
];

function construirUrlCheckoutComUtms(baseUrl: string): string {
  if (typeof window === "undefined") return baseUrl;
  try {
    const urlDestino = new URL(baseUrl);
    const paramsAtuais = new URLSearchParams(window.location.search);

    // Persiste UTMs e fbclid no sessionStorage para não perder em navegação interna
    const chavesRastreio = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ttclid",
      "src",
      "sck",
    ];

    chavesRastreio.forEach((chave) => {
      const valorUrl = paramsAtuais.get(chave);
      if (valorUrl) {
        sessionStorage.setItem(`kevano_${chave}`, valorUrl);
        urlDestino.searchParams.set(chave, valorUrl);
      } else {
        const valorSalvo = sessionStorage.getItem(`kevano_${chave}`);
        if (valorSalvo && !urlDestino.searchParams.has(chave)) {
          urlDestino.searchParams.set(chave, valorSalvo);
        }
      }
    });

    // Repassa quaisquer outros parâmetros presentes na URL atual
    paramsAtuais.forEach((valor, chave) => {
      if (!urlDestino.searchParams.has(chave)) {
        urlDestino.searchParams.set(chave, valor);
      }
    });

    // Se houver utm_content ou utm_campaign e não houver sck, preenche sck para rastreio no checkout
    const utmContent = urlDestino.searchParams.get("utm_content");
    const utmCampaign = urlDestino.searchParams.get("utm_campaign");
    if (!urlDestino.searchParams.has("sck") && (utmContent || utmCampaign)) {
      urlDestino.searchParams.set("sck", utmContent || utmCampaign || "direto");
    }

    return urlDestino.toString();
  } catch {
    return baseUrl;
  }
}

function PaginaColorindoAsSilabas() {
  useFavicon(
    "/colorindo-silabas/favicon-colorindo-32.png",
    "/colorindo-silabas/favicon-colorindo-180.png",
  );
  const [segundosRestantes, setSegundosRestantes] = useState(15 * 60);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);
  const [checkoutUrlFinal, setCheckoutUrlFinal] = useState(CHECKOUT_BASE_URL);
  const [modalUpsellAberto, setModalUpsellAberto] = useState(false);
  const [passoAtivo, setPassoAtivo] = useState(0);
  const [passoPausado, setPassoPausado] = useState(false);
  const [acessoAtivo, setAcessoAtivo] = useState(0);
  const [acessoPausado, setAcessoPausado] = useState(false);

  // Auto-play do carrossel Como Funciona (troca a cada 4 segundos)
  useEffect(() => {
    if (passoPausado) return;
    const timer = setInterval(() => {
      setPassoAtivo((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, [passoPausado]);

  // Auto-play do carrossel Como é o Acesso (troca a cada 4 segundos)
  useEffect(() => {
    if (acessoPausado) return;
    const timer = setInterval(() => {
      setAcessoAtivo((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, [acessoPausado]);

  const proximoPasso = () => {
    setPassoAtivo((prev) => (prev + 1) % 3);
  };
  const passoAnterior = () => {
    setPassoAtivo((prev) => (prev - 1 + 3) % 3);
  };

  const proximoAcesso = () => {
    setAcessoAtivo((prev) => (prev + 1) % 3);
  };
  const acessoAnterior = () => {
    setAcessoAtivo((prev) => (prev - 1 + 3) % 3);
  };

  // Sempre força o início no topo da página ao entrar/carregar
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }

    const resetarRolagem = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };

    resetarRolagem();
    const t1 = setTimeout(resetarRolagem, 10);
    const t2 = setTimeout(resetarRolagem, 50);
    const t3 = setTimeout(resetarRolagem, 150);
    const t4 = setTimeout(resetarRolagem, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Atualiza o link do checkout com todas as UTMs + fbclid da campanha
    setCheckoutUrlFinal(construirUrlCheckoutComUtms(CHECKOUT_BASE_URL));

    // 2. Inicializa nosso Meta Pixel próprio (quando configurado) — Emissor Único SOP-03
    if (META_PIXEL_ID) {
      const w = window as any;
      if (!w.fbq) {
        const n: any = (w.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!w._fbq) w._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        const t = document.createElement("script");
        t.async = true;
        t.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(t);
      }
      w.fbq("init", META_PIXEL_ID);
      w.fbq("track", "PageView");
      w.fbq("track", "ViewContent", {
        content_name: "Colorindo as Silabas Simples 1 Ano",
        content_ids: ["colorindo-silabas-v2"],
        content_type: "product",
        value: 14.9,
        currency: "BRL",
      });
    }

    // 3. Inicializa nosso Pixel Utmify próprio (apenas quando criar a NOSSA conta Utmify)
    if (UTMIFY_PIXEL_ID) {
      (window as any).pixelId = UTMIFY_PIXEL_ID;
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
      document.head.appendChild(script);
      return () => {
        script.remove();
      };
    }

    // 4. Tracker oficial da Cakto (contagem de visitas e persistência de 90 dias)
    if (typeof window !== "undefined") {
      const caktoScript = document.createElement("script");
      caktoScript.async = true;
      caktoScript.src = "https://api.cakto.com.br/api/product/checkout/tracker.js";
      document.body.appendChild(caktoScript);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosRestantes((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;

  const rolarParaOferta = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById("oferta");
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const dispararInitiateCheckout = (valor: number = 27.9, nome: string = "Colorindo as Silabas Simples 1 Ano - Kit Premium") => {
    if (typeof window !== "undefined" && (window as any).fbq && META_PIXEL_ID) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: nome,
        content_ids: ["colorindo-silabas-v2"],
        content_type: "product",
        num_items: 1,
        value: valor,
        currency: "BRL",
      });
    }
  };

  const alternarFaq = (idx: number) => {
    setFaqAberto(faqAberto === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-white text-[#222222] font-['Inter',sans-serif] selection:bg-[#FF6799]/20 selection:text-[#FF6799]">
      {/* Top Announcement Bar */}
      <div className="bg-[#F34E6A] text-white py-2 sm:py-2.5 px-4 text-center text-xs sm:text-sm font-bold tracking-wide shadow-sm flex items-center justify-center">
        <span>Promoção válida por tempo limitado!</span>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#FFFFFF] to-[#FFF0E5] pt-6 pb-12 px-4 text-center">
        <div className="max-w-[760px] mx-auto flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#222222] tracking-tight leading-tight">
            Seu filho lendo com fluência em poucas semanas
          </h1>

          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-[#222222] font-semibold leading-relaxed max-w-2xl">
            O método <span className="text-[#FF6799] font-extrabold">Colorindo as Sílabas</span> que ajuda crianças de 4 a 10 anos a aprender a ler até 5x mais rápido, com apenas 10 minutinhos por dia. Sem brigas. Sem pressão, alinhada à BNCC.
          </p>

          {/* Capa / Logo Principal */}
          <div className="my-6 max-w-[580px] w-full px-2">
            <img
              src="/colorindo-silabas/logo-colorindo-v2.jpg"
              alt="Colorindo as Sílabas Simples 1° Ano"
              className="w-full h-auto drop-shadow-xl rounded-2xl mx-auto transition-transform hover:scale-[1.01]"
              loading="eager"
            />
          </div>

                    {/* Card Temporizador Cabeçalho */}
          <div className="bg-white rounded-3xl border-2 border-[#FF3B69] p-4 sm:p-5 text-center max-w-[360px] sm:max-w-[400px] w-full mx-auto shadow-md my-6">
            <div className="flex items-center justify-center gap-1.5 text-[#FF3B69] font-black text-xs sm:text-sm uppercase tracking-wider mb-3">
              <Clock className="w-4 h-4 stroke-[2.5]" />
              <span>A PROMOÇÃO EXPIRA EM</span>
            </div>

            <div className="flex items-center justify-center gap-3 my-2">
              {/* Bloco Minutos */}
              <div className="bg-[#FF3B69] text-white rounded-2xl p-2.5 sm:p-3 min-w-[76px] sm:min-w-[84px] shadow-sm flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black font-mono leading-none">
                  {String(minutos).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1.5 opacity-90">
                  MIN
                </span>
              </div>

              {/* Bloco Segundos */}
              <div className="bg-[#FF3B69] text-white rounded-2xl p-2.5 sm:p-3 min-w-[76px] sm:min-w-[84px] shadow-sm flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black font-mono leading-none">
                  {String(segundos).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1.5 opacity-90">
                  SEG
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-3">
              3.000+ atividades + bônus · Acesso imediato
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-[#0D9488] mt-1">
              Material enviado no WhatsApp e no e-mail
            </p>
          </div>

{/* Botão de Ação Principal -> Rola para a Oferta ou vai pro Checkout */}
          <a
            href="#oferta"
            onClick={rolarParaOferta}
            className="cta-pulse cta-shimmer group w-full max-w-[500px] bg-gradient-to-r from-[#1EB525] via-[#2CE834] to-[#15A245] hover:brightness-105 active:translate-y-1.5 text-white font-['Montserrat',sans-serif] font-black text-xl sm:text-2xl py-4 sm:py-5 px-8 rounded-2xl shadow-[0_7px_0_0_#0F6D14,0_18px_36px_rgba(31,184,38,0.55)] transition-all cursor-pointer uppercase tracking-wide flex items-center justify-center gap-3 border-t-2 border-white/40 ring-4 ring-green-400/30"
          >
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">QUERO O KIT COMPLETO AGORA</span>
            <ArrowRight className="w-6 h-6 stroke-[3.5] group-hover:translate-x-1.5 transition-transform flex-shrink-0" />
          </a>

          {/* Aviso de Entrega por E-mail */}
          <div className="mt-6 flex flex-row items-center justify-center gap-3 max-w-lg text-left px-2">
            <img
              src="/colorindo-silabas/Email-1.png"
              alt="Ícone de E-mail"
              className="w-12 h-12 flex-shrink-0 object-contain"
            />
            <p className="text-xs sm:text-sm font-medium text-[#444444] leading-snug">
              Após a compra, você recebe acesso imediato aos arquivos em formato
              PDF para baixar e imprimir quantas vezes quiser.
            </p>
          </div>

          {/* Selo Satisfação Garantida / Acesso Imediato */}
          <div className="mt-6 max-w-[540px] w-full">
            <img
              src="/colorindo-silabas/Satisfacao-Garantida-Acesso-Imediato-1.png"
              alt="Satisfação Garantida e Acesso Imediato"
              className="w-full h-auto mx-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Faixa Rosa: 1° Ano */}
      <section className="bg-[#FF6799] py-4 text-center">
        <h2 className="text-white text-2xl sm:text-4xl font-extrabold tracking-wide">
          INDICADO PARA CRIANÇAS DE 5 A 8 ANOS (1° ANO)
        </h2>
      </section>

      {/* Exemplos de Atividades */}
      <section className="py-14 px-4 bg-white text-center overflow-hidden">
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222]">
            Exemplos Reais das Atividades
          </h2>

          <p className="mt-4 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Com o método de <b>Pintura por Código de Sílabas</b>, a criança
            aprende a reconhecer e juntar as sílabas simples enquanto colore,
            desenvolvendo leitura, atenção, concentração e coordenação motora sem
            choro na hora da tarefa.
          </p>

          <div className="mt-5 inline-block">
            <h3 className="text-xl sm:text-2xl font-bold text-[#333333]">
              <span className="bg-[#FFE6A3] font-black px-2 py-0.5 rounded">
                4 Cadernos Completos (Mais de 490 Páginas)
              </span>{" "}
              prontos para imprimir em folha A4
            </h3>
          </div>
        </div>

        {/* Carrossel 1 (Direção Esquerda) */}
        <div className="relative w-full overflow-hidden mb-6 py-2">
          <div className="flex gap-4 w-max animate-scroll-left hover:[animation-play-state:paused]">
            {[...CARROSSEL_1, ...CARROSSEL_1].map((src, index) => (
              <div
                key={`c1-${index}`}
                className="w-44 sm:w-56 md:w-64 flex-shrink-0 bg-white rounded-xl shadow-md border border-gray-100 p-2 overflow-hidden transition-transform hover:scale-105"
              >
                <img
                  src={src}
                  alt={`Atividade Exemplo ${index + 1}`}
                  className="w-full h-auto object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Carrossel 2 (Direção Direita) */}
        <div className="relative w-full overflow-hidden mb-12 py-2">
          <div className="flex gap-4 w-max animate-scroll-right hover:[animation-play-state:paused]">
            {[...CARROSSEL_2, ...CARROSSEL_2].map((src, index) => (
              <div
                key={`c2-${index}`}
                className="w-44 sm:w-56 md:w-64 flex-shrink-0 bg-white rounded-xl shadow-md border border-gray-100 p-2 overflow-hidden transition-transform hover:scale-105"
              >
                <img
                  src={src}
                  alt={`Silabário Exemplo ${index + 1}`}
                  className="w-full h-auto object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que você vai receber ao adquirir - Vitrine Área de Membros */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-[920px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] uppercase tracking-tight">
              Veja tudo o que você recebe hoje
            </h2>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-wider">
              <span>⚡ ACESSO IMEDIATO • PACOTE COMPLETO 4 EM 1</span>
            </div>
          </div>

          {/* Grid de 5 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10 max-w-[320px] sm:max-w-none mx-auto">
            {/* Card 1: Colorindo as Sílabas Simples */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-3.5 relative group">
              <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                <span className="absolute top-2.5 left-2.5 z-10 bg-[#0D7377] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  3 ARQUIVOS
                </span>
                <img
                  src="/colorindo-silabas/card_thumb_borboleta.png"
                  alt="Colorindo as Sílabas Simples"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/colorindo-silabas/covers/capa-silabas-simples.jpg";
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1E293B] text-base sm:text-lg leading-snug">
                    Colorindo as Sílabas Simples
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Kit Principal Oficial • 3 Arquivos em PDF
                  </p>
                </div>

                <div className="border-t border-gray-100 mt-3 pt-2 text-left">
                  <span className="text-[12.5px] sm:text-[13px] text-black font-bold block">
                    De <span className="line-through text-black font-bold">R$ 39,90</span> por
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#0D9488] tracking-tight block leading-tight">
                    GRÁTIS
                  </span>
                </div>

                <a
                  href="#oferta"
                  className="mt-3 w-full bg-[#1FB826] hover:bg-[#1caa23] text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Acessar</span>
                </a>
              </div>
            </div>

            {/* Card 2: Colorindo com as Sílabas Cursivas (BLOQUEADO / ORDER BUMP) */}
            <div className="bg-white rounded-2xl border-2 border-[#FFC107] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-3.5 relative group ring-2 ring-[#FFC107]/20">
              <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden mb-3 border border-amber-100 flex items-center justify-center">
                <span className="absolute top-2.5 left-2.5 z-10 bg-[#FF9800] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>BLOQUEADO</span>
                </span>
                <img
                  src="/colorindo-silabas/covers/capa-silabas-cursivas.jpg"
                  alt="Colorindo com as Sílabas Cursivas"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1E293B] text-base sm:text-lg leading-snug">
                    Colorindo com as Sílabas Cursivas
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Material Exclusivo • 44 Páginas (Não Incluso)
                  </p>
                </div>

                <div className="border-t border-amber-100 mt-3 pt-2 text-left">
                  <span className="text-[12.5px] sm:text-[13px] text-black font-bold block">
                    De <span className="line-through text-black font-bold">R$ 29,90</span> por
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#FF9800] tracking-tight block leading-tight">
                    R$ 10,00
                  </span>
                </div>

                <a
                  href="#oferta"
                  className="mt-3 w-full bg-[#1E293B] hover:bg-[#0F172A] text-[#FFC107] font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Desbloquear Cursivas (R$ 10,00)</span>
                </a>
              </div>
            </div>

            {/* Card 3: Português 1º Ano */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-3.5 relative group">
              <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                <span className="absolute top-2.5 left-2.5 z-10 bg-[#0D7377] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  3 ARQUIVOS
                </span>
                <img
                  src="/colorindo-silabas/covers/capa-portugues-1ano.jpg"
                  alt="Português 1º Ano"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1E293B] text-base sm:text-lg leading-snug">
                    Português 1º Ano
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Apostila Master + 2 Bônus • 136 Páginas em PDF
                  </p>
                </div>

                <div className="border-t border-gray-100 mt-3 pt-2 text-left">
                  <span className="text-[12.5px] sm:text-[13px] text-black font-bold block">
                    De <span className="line-through text-black font-bold">R$ 47,00</span> por
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#0D9488] tracking-tight block leading-tight">
                    GRÁTIS
                  </span>
                </div>

                <a
                  href="#oferta"
                  className="mt-3 w-full bg-[#1FB826] hover:bg-[#1caa23] text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Acessar</span>
                </a>
              </div>
            </div>

            {/* Card 4: Matemática 1º Ano */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-3.5 relative group">
              <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                <span className="absolute top-2.5 left-2.5 z-10 bg-[#0D7377] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  7 ARQUIVOS
                </span>
                <img
                  src="/colorindo-silabas/covers/capa-matematica-1ano.jpg"
                  alt="Matemática 1º Ano"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1E293B] text-base sm:text-lg leading-snug">
                    Matemática 1º Ano
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Kit Completo de Matemática • 276 Páginas em PDF
                  </p>
                </div>

                <div className="border-t border-gray-100 mt-3 pt-2 text-left">
                  <span className="text-[12.5px] sm:text-[13px] text-black font-bold block">
                    De <span className="line-through text-black font-bold">R$ 44,90</span> por
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#0D9488] tracking-tight block leading-tight">
                    GRÁTIS
                  </span>
                </div>

                <a
                  href="#oferta"
                  className="mt-3 w-full bg-[#1FB826] hover:bg-[#1caa23] text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Acessar</span>
                </a>
              </div>
            </div>

            {/* Card 5: Folclore 1º Ano */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-3.5 relative group">
              <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                <span className="absolute top-2.5 left-2.5 z-10 bg-[#0D7377] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  1 ARQUIVOS
                </span>
                <img
                  src="/colorindo-silabas/covers/capa-folclore-1ano.jpg"
                  alt="Folclore 1º Ano"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1E293B] text-base sm:text-lg leading-snug">
                    Folclore 1º Ano
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Caderno Temático Folclore Brasileiro • 41 Páginas
                  </p>
                </div>

                <div className="border-t border-gray-100 mt-3 pt-2 text-left">
                  <span className="text-[12.5px] sm:text-[13px] text-black font-bold block">
                    De <span className="line-through text-black font-bold">R$ 39,90</span> por
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#0D9488] tracking-tight block leading-tight">
                    GRÁTIS
                  </span>
                </div>

                <a
                  href="#oferta"
                  className="mt-3 w-full bg-[#1FB826] hover:bg-[#1caa23] text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Acessar</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center">
            <a
              href="#oferta"
              className="cta-pulse cta-shimmer group w-full max-w-[500px] text-center bg-gradient-to-r from-[#1EB525] via-[#2CE834] to-[#15A245] hover:brightness-105 active:translate-y-1.5 text-white font-['Montserrat',sans-serif] font-black text-xl sm:text-2xl py-4 sm:py-5 px-8 rounded-2xl shadow-[0_7px_0_0_#0F6D14,0_18px_36px_rgba(31,184,38,0.55)] transition-all cursor-pointer flex items-center justify-center gap-3 uppercase border-t-2 border-white/40 ring-4 ring-green-400/30"
            >
              <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">SIM, QUERO GARANTIR O KIT COMPLETO!</span>
              <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1.5 transition-transform flex-shrink-0" />
            </a>
            <p className="mt-4 text-xs sm:text-sm font-semibold text-gray-500 text-center">
              Liberado na hora via PIX ou Cartão • Arquivos em PDF prontos para imprimir
            </p>
          </div>
        </div>
      </section>

      {/* Depoimentos - Carrossel Automático Contínuo */}
      <section className="py-14 sm:py-16 bg-white text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="inline-flex items-center gap-1.5 bg-[#FFF0F5] text-[#FF4D80] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Mais de 3.200 Famílias e Educadoras Satisfeitas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] mb-3">
            Quem já aplicou com seus pequenos recomenda
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Veja o retorno real de mães e educadoras que utilizam nossas atividades no dia a dia:
          </p>
        </div>

        {/* Carrossel Infinito Duplo com Rolagem Automática */}
        <div className="relative w-full overflow-hidden space-y-4">
          {/* Sombras suaves nas laterais */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Linha 1: Rolagem para a Esquerda */}
          <div className="flex gap-4 w-max animate-scroll-left hover:[animation-play-state:paused] py-1">
            {[...DEPOIMENTOS_LINHA_1, ...DEPOIMENTOS_LINHA_1].map((src, idx) => (
              <div
                key={`dep-l1-${idx}`}
                className="w-72 sm:w-80 h-28 sm:h-32 flex-shrink-0 bg-[#FBFBFA] rounded-2xl p-3 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center"
              >
                <img
                  src={src}
                  alt={`Depoimento ${idx + 1}`}
                  className="max-h-20 sm:max-h-24 w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Linha 2: Rolagem para a Direita */}
          <div className="flex gap-4 w-max animate-scroll-right hover:[animation-play-state:paused] py-1">
            {[...DEPOIMENTOS_LINHA_2, ...DEPOIMENTOS_LINHA_2].map((src, idx) => (
              <div
                key={`dep-l2-${idx}`}
                className="w-72 sm:w-80 h-28 sm:h-32 flex-shrink-0 bg-[#FBFBFA] rounded-2xl p-3 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center"
              >
                <img
                  src={src}
                  alt={`Depoimento ${idx + 10}`}
                  className="max-h-20 sm:max-h-24 w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona? - Carrossel Interativo Automático */}
      <section className="py-14 sm:py-16 px-4 bg-[#FFF8F4]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] uppercase mb-4">
            COMO FUNCIONA?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-lg mx-auto">
            Aprender a ler é simples e divertido com o passo a passo do método:
          </p>

          {/* Abas dos Passos (Pills de Navegação Rápida) */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 flex-wrap">
            {[
              { num: "1", label: "Liberação Imediata" },
              { num: "2", label: "Baixe e Imprima" },
              { num: "3", label: "Diversão e Leitura" },
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPassoAtivo(idx)}
                className={`px-3.5 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                  passoAtivo === idx
                    ? "bg-[#0D9488] text-white shadow-md shadow-teal-500/25 scale-105"
                    : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
                    passoAtivo === idx
                      ? "bg-white text-[#0D9488]"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {p.num}
                </span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Slider Container com Setas de Navegação */}
          <div
            className="relative max-w-xl mx-auto"
            onMouseEnter={() => setPassoPausado(true)}
            onMouseLeave={() => setPassoPausado(false)}
            onTouchStart={() => setPassoPausado(true)}
            onTouchEnd={() => setPassoPausado(false)}
          >
            {/* Seta Anterior */}
            <button
              type="button"
              onClick={passoAnterior}
              aria-label="Passo anterior"
              className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-gray-700 hover:text-[#0D9488] shadow-lg border border-gray-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Seta Próximo */}
            <button
              type="button"
              onClick={proximoPasso}
              aria-label="Próximo passo"
              className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-gray-700 hover:text-[#0D9488] shadow-lg border border-gray-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carrossel Track */}
            <div className="overflow-hidden rounded-3xl shadow-xl border border-orange-100/60 bg-white">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${passoAtivo * 100}%)` }}
              >
                {/* Slide 1 */}
                <div className="w-full flex-shrink-0 p-8 sm:p-12 flex flex-col items-center">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 mb-6 flex items-center justify-center">
                    <img
                      src="/colorindo-silabas/3-3-1.png"
                      alt="Acesso imediato"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#222222] mb-3">
                    1. Liberação Imediata
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md">
                    Conteúdo 100% digital em <b>formato PDF</b>. Assim que confirmar o
                    pagamento, seu acesso é liberado na tela e enviado ao seu{" "}
                    <b>e-mail</b>.
                  </p>
                </div>

                {/* Slide 2 */}
                <div className="w-full flex-shrink-0 p-8 sm:p-12 flex flex-col items-center">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 mb-6 flex items-center justify-center">
                    <img
                      src="/colorindo-silabas/4-2-1.png"
                      alt="Baixe as atividades"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#222222] mb-3">
                    2. Baixe e Imprima em A4
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md">
                    Os arquivos são separados por <b>cadernos</b> para facilitar a
                    impressão. Baixe no seu <b>celular ou computador</b> e imprima
                    quantas vezes desejar.
                  </p>
                </div>

                {/* Slide 3 */}
                <div className="w-full flex-shrink-0 p-8 sm:p-12 flex flex-col items-center">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 mb-6 flex items-center justify-center">
                    <img
                      src="/colorindo-silabas/5-1-1-1.png"
                      alt="Realizar as atividades"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#222222] mb-3">
                    3. Diversão e Leitura
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md">
                    Com lápis de cor na mão, a criança aprende as{" "}
                    <b>famílias silábicas</b> pintando por código em apenas 15
                    minutinhos por dia!
                  </p>
                </div>
              </div>
            </div>

            {/* Dots Indicadores Inferiores */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPassoAtivo(idx)}
                  aria-label={`Ir para passo ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    passoAtivo === idx
                      ? "w-8 bg-[#0D9488]"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE PLANOS - COMPARATIVO 2 PLANOS (KIT BÁSICO VS KIT PREMIUM) */}
      <section id="oferta" className="py-16 px-4 bg-[#FFF8F3] scroll-mt-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 font-extrabold text-xs sm:text-sm uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 border border-rose-200">
            <Clock className="w-4 h-4" />
            <span>🔥 CONDIÇÃO ESPECIAL DE LANÇAMENTO</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#222222] leading-tight">
            Leve o Pacote Completo{" "}
            <span className="text-[#FF6799]">(Os 4 Cadernos de 1° Ano)</span>
          </h2>
          <p className="mt-2 text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-12">
            Escolha a melhor opção para a aprendizagem do seu filho(a):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto text-left">
            {/* PLANO 1: KIT BÁSICO */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative pt-10 hover:shadow-md transition-shadow">
              {/* Badge Topo */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D1FAE5] text-[#059669] text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider border border-[#A7F3D0] whitespace-nowrap">
                KIT BÁSICO
              </div>

              <div>
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">
                  PARA COMEÇAR
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1E293B] mt-1">
                  Kit Básico
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Atividades essenciais para imprimir e usar na sua rotina.
                </p>

                {/* Bloco de Preço */}
                <div className="mt-6 text-center">
                  <span className="line-through text-gray-400 text-xs sm:text-sm font-semibold block">
                    De R$ 27,90
                  </span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#0D9488]">
                      R$ 14,90
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold block">
                    pagamento único
                  </span>
                  <div className="mt-2">
                    <span className="inline-block bg-[#E6FFFA] text-[#0D9488] text-xs font-extrabold px-3 py-1 rounded-full">
                      Economize R$ 13,00
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 my-6"></div>

                {/* Lista de Recursos */}
                <ul className="space-y-3.5 text-xs sm:text-sm text-gray-700 font-medium">
                  {[
                    "Mais de 2.000 atividades",
                    "6 bônus exclusivos",
                    "Da educação infantil ao 5º ano",
                    "PDF pronto para imprimir",
                    "Acesso vitalício",
                    "Garantia de 7 dias",
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setModalUpsellAberto(true)}
                  className="w-full border-2 border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488] hover:text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all text-center text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Quero o Kit Básico</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 font-semibold mt-3">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Compra segura
                  </span>
                  <span>•</span>
                  <span>Garantia de 7 dias</span>
                </div>
              </div>
            </div>

            {/* PLANO 2: KIT PREMIUM (DESTAQUE / MAIS VENDIDO) */}
            <div className="bg-white rounded-3xl border-2 border-[#FF4D80] p-6 sm:p-8 flex flex-col justify-between shadow-xl relative pt-10 ring-4 ring-[#FF4D80]/10 hover:shadow-2xl transition-shadow">
              {/* Badge Topo */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4D80] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MAIS VENDIDO</span>
              </div>

              <div>
                <span className="text-[11px] font-black text-[#FF4D80] uppercase tracking-widest block">
                  PLANO PREMIUM
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1E293B] mt-1">
                  Kit Premium
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Tudo do Básico, com mais atividades e materiais aprofundados.
                </p>

                {/* Bloco de Preço */}
                <div className="mt-6 text-center">
                  <span className="line-through text-gray-400 text-xs sm:text-sm font-semibold block">
                    De R$ 80,00
                  </span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <span className="text-4xl sm:text-5xl font-black text-[#FF4D80] tracking-tight">
                      R$ 27,90
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold block">
                    pagamento único
                  </span>
                  <div className="mt-2">
                    <span className="inline-block bg-[#FFF0F5] text-[#FF4D80] text-xs font-extrabold px-3 py-1 rounded-full">
                      Economize R$ 52,10
                    </span>
                  </div>
                </div>

                {/* Faixa Rosa Destaque */}
                <div className="bg-gradient-to-r from-[#FF4D80] to-[#FF6B99] text-white text-xs sm:text-sm font-black py-3 px-4 rounded-xl uppercase tracking-wider shadow-sm my-6 text-center flex items-center justify-center gap-2">
                  <span>🔥</span>
                  <span>+ATIVIDADES ATUALIZADAS TODA SEMANA</span>
                  <span>🔥</span>
                </div>

                {/* Lista de Recursos Principais */}
                <ul className="space-y-3.5 text-xs sm:text-sm text-gray-700 font-medium">
                  {[
                    "Tudo o que está no Kit Básico",
                    "Mais de 4.000 atividades",
                    "Livro de leitura e simulado escolar",
                    "Sondagem diagnóstica aprofundada",
                    "Material organizado em módulos",
                    "Acesso vitalício",
                    "Garantia de 30 dias",
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className={idx === 0 ? "font-bold text-gray-900" : ""}>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Seção de Bônus Inclusos */}
                <div className="border-t border-gray-100 my-6"></div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF4D80] uppercase tracking-wider mb-3">
                    <Gift className="w-4 h-4" />
                    <span>BÔNUS INCLUSOS:</span>
                  </div>

                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700 font-medium">
                    {[
                      "Produção de Texto",
                      "Caderno Matemática 1º ao 5º ano",
                      "Adição e Multiplicação com Grupos",
                      "Desafios Criativos",
                      "Português 4º ano",
                      "Ciências anos iniciais",
                      "Separação Silábica",
                    ].map((bonus, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="bg-[#FF4D80] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                          BÔNUS
                        </span>
                        <span>{bonus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={checkoutUrlFinal || "https://pay.cakto.com.br/mswtxij_1243353"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => dispararInitiateCheckout(27.9, "Colorindo as Silabas - Kit Premium")}
                  className="cta-pulse cta-shimmer group w-full bg-gradient-to-r from-[#1EB525] via-[#2CE834] to-[#15A245] hover:brightness-105 active:translate-y-1 text-white font-black py-4.5 px-6 rounded-2xl shadow-[0_7px_0_0_#0F6D14,0_18px_36px_rgba(31,184,38,0.55)] transition-all text-center text-lg sm:text-xl flex items-center justify-center gap-3 cursor-pointer uppercase border-t-2 border-white/40 ring-4 ring-green-400/30"
                >
                  <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">Quero o Kit Premium</span>
                  <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1.5 transition-transform" />
                </a>

                <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 font-semibold mt-3">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Compra segura
                  </span>
                  <span>•</span>
                  <span>Garantia de 30 dias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Urgência com Timer Evergreen */}
      <section className="py-12 px-4 bg-gradient-to-r from-gray-900 to-black text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
            Milhares de <span className="text-[#fdce00]">famílias</span> e
            educadores já aplicam nossas{" "}
            <span className="text-[#fdce00]">atividades</span> todos os dias.
          </h2>

          <p className="mt-3 text-base sm:text-lg text-gray-300">
            Aproveite o desconto de R$ 97,00 por R$ 14,90 antes que o contador zere:
          </p>

          {/* Countdown Clock */}
          <div className="my-6 flex justify-center gap-4 text-center">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 min-w-[90px] border border-white/15">
              <span className="block text-3xl sm:text-4xl font-mono font-bold text-[#fdce00]">
                {String(minutos).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase tracking-wider text-gray-300">
                Minutos
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-bold self-center text-white/50">
              :
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 min-w-[90px] border border-white/15">
              <span className="block text-3xl sm:text-4xl font-mono font-bold text-[#fdce00]">
                {String(segundos).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase tracking-wider text-gray-300">
                Segundos
              </span>
            </div>
          </div>

          <a
            href={checkoutUrlFinal}
            onClick={dispararInitiateCheckout}
            className="cta-pulse cta-shimmer group mt-2 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#1EB525] via-[#2CE834] to-[#15A245] hover:brightness-105 active:translate-y-1 text-white font-['Montserrat',sans-serif] font-black text-lg sm:text-xl py-4 sm:py-4.5 px-8 sm:px-10 rounded-2xl shadow-[0_7px_0_0_#0F6D14,0_18px_36px_rgba(31,184,38,0.55)] transition-all cursor-pointer uppercase border-t-2 border-white/40 ring-4 ring-green-400/30"
          >
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">Quero acessar agora e imprimir hoje</span>
            <ArrowRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Garantia Incondicional 7 Dias */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-56 sm:w-64 flex-shrink-0">
            <img
              src="/colorindo-silabas/Kids41-Compressao-1-1.png"
              alt="Selo 7 Dias de Garantia"
              className="w-full h-auto object-contain mx-auto"
              loading="lazy"
            />
          </div>

          <div className="flex-1 text-left space-y-4 text-gray-700 text-sm sm:text-base">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#222222] leading-tight">
              Satisfação garantida ou seu dinheiro de volta!
            </h2>

            <p>
              Você tem <b>7 dias completos</b> para baixar, olhar todas as
              páginas e testar com sua criança. Se por qualquer motivo achar que:
            </p>

            <ul className="space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-800" />
                <span>o material não faz sentido para sua criança/aluno</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-800" />
                <span>os materiais não atendem sua necessidade</span>
              </li>
            </ul>

            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl">
              <p className="font-bold text-emerald-900">
                👉 você pode solicitar 100% do reembolso na plataforma.
              </p>
              <p className="font-extrabold text-emerald-950 mt-1">
                7 dias de garantia incondicional
              </p>
              <p className="text-xs sm:text-sm text-emerald-800">
                Sem burocracia. Risco zero para você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como é o Acesso (Carrossel Interativo Automático) */}
      <section className="py-16 px-4 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222]">
            Como é o Acesso
            <span className="block text-lg sm:text-xl font-normal text-gray-600 mt-1">
              (Simples, Rápido e Automático)
            </span>
          </h2>

          {/* Abas Superiores de Navegação */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-8 mb-8 flex-wrap">
            {[
              { num: "1", label: "Conclua sua compra" },
              { num: "2", label: "Área de Membros" },
              { num: "3", label: "Baixe os PDFs" },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAcessoAtivo(idx)}
                className={`px-3.5 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                  acessoAtivo === idx
                    ? "bg-[#0D9488] text-white shadow-md shadow-teal-500/25 scale-105"
                    : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
                    acessoAtivo === idx
                      ? "bg-white text-[#0D9488]"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.num}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Slider Container com Setas */}
          <div
            className="relative max-w-xl mx-auto"
            onMouseEnter={() => setAcessoPausado(true)}
            onMouseLeave={() => setAcessoPausado(false)}
            onTouchStart={() => setAcessoPausado(true)}
            onTouchEnd={() => setAcessoPausado(false)}
          >
            {/* Seta Anterior */}
            <button
              type="button"
              onClick={acessoAnterior}
              aria-label="Passo anterior do acesso"
              className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-gray-700 hover:text-[#0D9488] shadow-lg border border-gray-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Seta Próximo */}
            <button
              type="button"
              onClick={proximoAcesso}
              aria-label="Próximo passo do acesso"
              className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-gray-700 hover:text-[#0D9488] shadow-lg border border-gray-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carrossel Track */}
            <div className="overflow-hidden rounded-3xl shadow-xl border border-gray-200/80 bg-white">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${acessoAtivo * 100}%)` }}
              >
                {/* Slide 1 */}
                <div className="w-full flex-shrink-0 p-8 sm:p-12 flex flex-col items-center">
                  <img
                    src="/colorindo-silabas/order-2.png"
                    alt="Conclua sua compra"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-5"
                    loading="lazy"
                  />
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
                    1. Conclua sua compra
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md">
                    Após o pagamento via PIX ou Cartão, seu acesso é liberado
                    automaticamente na mesma hora.
                  </p>
                </div>

                {/* Slide 2 */}
                <div className="w-full flex-shrink-0 p-8 sm:p-12 flex flex-col items-center">
                  <img
                    src="/colorindo-silabas/member-card-2.png"
                    alt="Acesse a Central de Downloads"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-5"
                    loading="lazy"
                  />
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
                    2. Acesse a Área de Membros
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md">
                    Você é direcionado para a <b>Central de Downloads</b> e também
                    recebe o link direto no seu e-mail.
                  </p>
                </div>

                {/* Slide 3 */}
                <div className="w-full flex-shrink-0 p-8 sm:p-12 flex flex-col items-center">
                  <img
                    src="/colorindo-silabas/download-2.png"
                    alt="Baixe os arquivos"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-5"
                    loading="lazy"
                  />
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
                    3. Baixe os PDFs em A4
                  </h3>
                  <ul className="text-left space-y-2 text-xs sm:text-sm text-gray-700 font-medium mb-2 max-w-xs">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span>Atividades prontas em PDF</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span>Produto 100% digital</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span>Imprima quantas vezes quiser</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Dots Indicadores */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAcessoAtivo(idx)}
                  aria-label={`Ir para passo de acesso ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    acessoAtivo === idx
                      ? "w-8 bg-[#0D9488]"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-10">
            <a
              href={checkoutUrlFinal}
              onClick={dispararInitiateCheckout}
              className="cta-pulse cta-shimmer group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#1EB525] via-[#2CE834] to-[#15A245] hover:brightness-105 active:translate-y-1.5 text-white font-['Montserrat',sans-serif] font-black text-lg sm:text-xl py-4.5 px-10 rounded-2xl shadow-[0_7px_0_0_#0F6D14,0_18px_36px_rgba(31,184,38,0.55)] transition-all cursor-pointer uppercase border-t-2 border-white/40 ring-4 ring-green-400/30"
            >
              <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">QUERO MEU ACESSO AGORA POR R$ 14,90</span>
              <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Perguntas Frequentes (FAQ) */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] text-center mb-8">
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const aberto = faqAberto === index;
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-colors"
                >
                  <button
                    onClick={() => alternarFaq(index)}
                    className="w-full text-left py-4 px-6 font-bold text-base sm:text-lg text-gray-800 flex justify-between items-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  >
                    <span>{faq.pergunta}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                        aberto ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                  {aberto && (
                    <div className="p-6 bg-white border-t border-gray-100 text-sm sm:text-base text-gray-600 whitespace-pre-line leading-relaxed">
                      {faq.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rodapé Próprio Blindado (Sem links para concorrentes) */}
      <footer className="bg-gray-900 text-gray-300 py-14 px-4 border-t border-gray-800 text-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center mb-10">
            <img
              src="/colorindo-silabas/logo-colorindo-v2.jpg"
              alt="Logo Colorindo as Sílabas V2"
              className="h-24 w-auto object-contain rounded-xl shadow-md"
              loading="lazy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center md:text-left mb-10 max-w-3xl mx-auto">
            {/* Formas de Pagamento & Garantia */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <h4 className="font-bold text-white text-base uppercase tracking-wider">
                FORMAS DE PAGAMENTO
              </h4>
              <img
                src="/colorindo-silabas/pagamento-1-1.png02-1-1.png"
                alt="Formas de Pagamento Aceitas"
                className="max-w-[240px] h-auto object-contain"
                loading="lazy"
              />
              <img
                src="/colorindo-silabas/garantia-360-slim-1-1.png"
                alt="Garantia 7 Dias"
                className="max-w-[240px] h-auto object-contain mt-2"
                loading="lazy"
              />
            </div>

            {/* Links Legais Internos (Bomba 8 Resolvida) */}
            <div className="flex flex-col items-center md:items-start space-y-2.5">
              <h4 className="font-bold text-white text-base uppercase tracking-wider">
                INFORMAÇÕES LEGAIS
              </h4>
              <a
                href="/politica-de-privacidade.html"
                className="hover:text-white transition-colors"
              >
                Política de Privacidade
              </a>
              <a
                href="/termos-de-uso.html"
                className="hover:text-white transition-colors"
              >
                Termos de Uso
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-400">
            <p>© 2026 Colorindo as Sílabas Simples • Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
      {/* MODAL UPSELL - NOTIFICAÇÃO AO CLICAR NO KIT BÁSICO */}
      {modalUpsellAberto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalUpsellAberto(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 relative shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            {/* Botão Fechar (X) */}
            <button
              type="button"
              onClick={() => setModalUpsellAberto(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Ícone Presente Topo */}
            <div className="w-14 h-14 rounded-full bg-[#FF4D80] flex items-center justify-center text-white mx-auto shadow-md shadow-rose-200">
              <Gift className="w-7 h-7" />
            </div>

            {/* Cabeçalho */}
            <span className="text-[#FF4D80] text-[10px] sm:text-[11px] font-black uppercase tracking-widest block mt-3 mb-1">
              OFERTA ESPECIAL ANTES DE FINALIZAR
            </span>
            <h3 className="text-[#1E1B4B] text-xl sm:text-2xl font-black leading-snug">
              Seu kit pode ficar ainda mais completo
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
              Troque o Básico pelo Premium com um preço exclusivo nesta etapa.
            </p>

            {/* Caixa Destacada Kit Premium Especial */}
            <div className="bg-[#FFF5ED] rounded-2xl p-4 sm:p-5 mt-5 mb-4 border border-[#FFE5D3] text-center">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-[#78716C] uppercase tracking-wider block">
                KIT PREMIUM ESPECIAL
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs text-gray-400 font-semibold line-through">
                  R$ 39,90
                </span>
                <span className="text-xs font-black text-[#0D9488]">
                  Economize R$ 11,90
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#FF4D80] my-1 tracking-tight">
                R$ 28,00
              </div>
              <span className="text-[11px] text-gray-400 font-medium block">
                pagamento único
              </span>
            </div>

            {/* Checklist Benefícios */}
            <ul className="space-y-2.5 text-left text-xs sm:text-sm text-gray-700 font-medium my-4 px-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                <span>Mais de 4.000 atividades (o dobro do Básico)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                <span>Livro de leitura e simulado escolar</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                <span>Acesso vitalício e garantia de 30 dias</span>
              </li>
            </ul>

            {/* Tag Bônus */}
            <div className="bg-[#FFF0F5] text-[#FF4D80] border border-[#FFE4EC] text-xs font-bold py-2 px-3 rounded-full flex items-center justify-center gap-1.5 my-3">
              <Gift className="w-3.5 h-3.5" />
              <span>Os 7 bônus do Premium inclusos</span>
            </div>

            {/* Botão Principal: Sim, quero o Premium por R$ 28,00 */}
            <a
              href={checkoutUrlFinal || "https://pay.cakto.com.br/mswtxij_1243353"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setModalUpsellAberto(false);
                dispararInitiateCheckout(28.0, "Colorindo as Silabas - Kit Premium Especial");
              }}
              className="cta-pulse cta-shimmer group w-full bg-gradient-to-r from-[#1EB525] via-[#2CE834] to-[#15A245] hover:brightness-105 active:translate-y-1 text-white font-black py-4 px-6 rounded-2xl shadow-[0_7px_0_0_#0F6D14,0_18px_36px_rgba(31,184,38,0.55)] transition-all text-center text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer uppercase border-t-2 border-white/40 ring-4 ring-green-400/30"
            >
              <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">Sim, quero o Premium por R$ 28,00</span>
              <ArrowRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1.5 transition-transform" />
            </a>

            {/* Link Secundário: Não, continuar com o Básico */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  dispararInitiateCheckout();
                  window.location.href = checkoutUrlFinal;
                }}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-semibold cursor-pointer underline-offset-2 hover:underline"
              >
                Não, continuar com o Básico
              </button>
            </div>

            {/* Rodapé Micro-copy */}
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-medium mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>Você escolhe. Nenhum adicional é incluído automaticamente.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
