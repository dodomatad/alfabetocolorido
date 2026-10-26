import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { useFavicon } from "@/hooks/use-favicon";

export const Route = createFileRoute("/colorindo-as-silabas-v2")({
  head: () => ({
    meta: [
      { title: "Colorindo as Sílabas Simples 1° Ano – Kit Completo em PDF" },
      {
        name: "description",
        content:
          "Transforme o aprendizado das SÍLABAS em uma brincadeira divertida que ajuda a criança a avançar na leitura e na escrita.",
      },
      {
        property: "og:title",
        content: "Colorindo as Sílabas Simples 1° Ano – Kit Completo em PDF",
      },
      {
        property: "og:description",
        content:
          "40 atividades prontas, lúdicas e organizadas para o 1° Ano + 4 Bônus Exclusivos. Acesso imediato em PDF.",
      },
      {
        property: "og:image",
        content: "/colorindo-silabas/logo-colorindo-v2.jpg",
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
  (import.meta as any).env?.VITE_META_PIXEL_ID || "";

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

  const dispararInitiateCheckout = () => {
    if (typeof window !== "undefined" && (window as any).fbq && META_PIXEL_ID) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: "Colorindo as Silabas Simples 1 Ano - Kit Completo",
        content_ids: ["colorindo-silabas-v2"],
        content_type: "product",
        num_items: 1,
        value: 14.9,
        currency: "BRL",
      });
    }
  };

  const alternarFaq = (idx: number) => {
    setFaqAberto(faqAberto === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-white text-[#222222] font-['Inter',sans-serif] selection:bg-[#FF6799]/20 selection:text-[#FF6799]">
      {/* Top Badge */}
      <header className="bg-white py-3 px-4 flex flex-col items-center gap-3 border-b border-gray-100">
        <div className="bg-[#93D36F] text-black font-semibold text-xs sm:text-sm md:text-base px-6 py-2 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2">
          <span>🔒</span>
          <span>Compra 100% segura • Acesso Imediato em PDF</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#FFFFFF] to-[#FFF0E5] pt-6 pb-12 px-4 text-center">
        <div className="max-w-[760px] mx-auto flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#222222] tracking-tight leading-tight">
            Colorindo as Sílabas Simples 1° Ano
          </h1>

          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-[#222222] font-semibold leading-relaxed max-w-2xl">
            Transforme o aprendizado das{" "}
            <span className="text-[#FF6799] font-extrabold">SÍLABAS</span> em uma
            brincadeira divertida de pintura por código que ajuda a criança a
            avançar na leitura e na escrita
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

          {/* Botão de Ação Principal -> Rola para a Oferta ou vai pro Checkout */}
          <a
            href="#oferta"
            onClick={rolarParaOferta}
            className="w-full max-w-[480px] bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-1 text-white font-['Montserrat',sans-serif] font-bold text-xl sm:text-2xl py-4 sm:py-5 px-8 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all cursor-pointer uppercase tracking-wide flex items-center justify-center gap-3"
          >
            QUERO O KIT COMPLETO AGORA
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
                40 atividades principais + 4 bônus
              </span>{" "}
              prontas para imprimir em folha A4
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

      {/* O que você vai receber ao adquirir */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-md border border-gray-100 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] uppercase tracking-tight">
            Veja tudo o que você recebe hoje
          </h2>

          <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-wider">
            <span>⚡ ACESSO IMEDIATO + 4 BÔNUS EXCLUSIVOS</span>
          </div>

          <div className="my-8 max-w-[500px] mx-auto">
            <img
              src="/colorindo-silabas/logo-colorindo-v2.jpg"
              alt="Apostila Colorindo as Sílabas V2"
              className="w-full h-auto drop-shadow-md rounded-2xl"
              loading="lazy"
            />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#333333] mb-6">
            Tudo organizado passo a passo para ser simples e fácil de aplicar:
          </h3>

          <ul className="text-left space-y-4 max-w-2xl mx-auto text-gray-700 text-sm sm:text-base font-medium">
            {[
              "Famílias Silábicas Simples – Reconhecimento e aprendizagem das famílias silábicas de A a Z",
              "Pintura por Código de Sílabas – A criança lê a sílaba para descobrir qual cor usar em cada parte do desenho",
              "Formação de Sílabas – Junção prática das consoantes com as vogais A, E, I, O e U",
              "Pontilhado e Caligrafia – Prática da escrita de sílabas e palavras para desenvolver o traçado firme",
              "Associação entre Imagens e Palavras – Identificação de palavras a partir de figuras ilustradas",
              "BÔNUS #1: Caderno de Atividades Extras – Português 1° Ano (em PDF)",
              "BÔNUS #2: Caderno de Atividades Extras – Matemática 1° Ano (em PDF)",
              "BÔNUS #3: Caderno Temático – Folclore Brasileiro 1° Ano (em PDF)",
              "BÔNUS #4: Silabário Ilustrado Completo para Impressão e Parede (em PDF)",
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-0.5 bg-emerald-100 text-emerald-600 rounded-full p-1">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-center">
            <a
              href={checkoutUrlFinal}
              onClick={dispararInitiateCheckout}
              className="w-full max-w-[460px] text-center bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-1 text-white font-['Montserrat',sans-serif] font-bold text-xl sm:text-2xl py-4 px-6 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all cursor-pointer inline-block uppercase"
            >
              Sim, quero garantir o kit completo!
            </a>
          </div>

          <p className="mt-4 text-xs sm:text-sm font-semibold text-gray-500">
            Liberado na hora via PIX ou Cartão • Arquivos em PDF prontos para imprimir
          </p>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-14 px-4 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] mb-3">
            Quem já aplicou com seus pequenos recomenda
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-10">
            Veja o retorno real de mães e educadoras que utilizam nossas atividades no dia a dia:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {DEPOIMENTOS.map((src, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
              >
                <img
                  src={src}
                  alt={`Depoimento ${idx + 1}`}
                  className="max-h-28 w-auto object-contain rounded"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona? */}
      <section className="py-14 px-4 bg-[#FFF8F4]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] uppercase mb-12">
            COMO FUNCIONA?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Passo 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-28 h-28 mb-4">
                <img
                  src="/colorindo-silabas/3-3-1.png"
                  alt="Acesso imediato"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                1. Liberação Imediata
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Conteúdo 100% digital em <b>formato PDF</b>. Assim que confirmar
                o pagamento, seu acesso é liberado na tela e enviado ao seu{" "}
                <b>e-mail</b>.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-28 h-28 mb-4">
                <img
                  src="/colorindo-silabas/4-2-1.png"
                  alt="Baixe as atividades"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                2. Baixe e Imprima em A4
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Os arquivos são separados por <b>cadernos</b> para facilitar a
                impressão. Baixe no seu <b>celular ou computador</b> e imprima
                quantas vezes desejar.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-28 h-28 mb-4">
                <img
                  src="/colorindo-silabas/5-1-1-1.png"
                  alt="Realizar as atividades"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                3. Diversão e Leitura
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Com lápis de cor na mão, a criança aprende as{" "}
                <b>famílias silábicas</b> pintando por código em apenas 15
                minutinhos por dia!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OFERTA ÚNICA DE ALTA CONVERSÃO (DE R$ 97,00 POR R$ 14,90 — 1 ÚNICA LINHA DE CHECKOUT) */}
      <section id="oferta" className="py-16 px-4 bg-white scroll-mt-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 font-extrabold text-xs sm:text-sm uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 border border-rose-200">
            <Clock className="w-4 h-4" />
            <span>🔥 CONDIÇÃO ESPECIAL COM 85% DE DESCONTO HOJE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#222222] leading-tight">
            Leve o Pacote Completo{" "}
            <span className="text-[#FF6799]">+ Todos os Bônus</span>
          </h2>
          <p className="mt-2 text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
            Acesso imediato e vitalício a todos os 5 materiais em PDF pelo valor
            de um único exemplar:
          </p>

          {/* Card Único Centralizado — De R$ 97,00 por R$ 14,90 */}
          <div className="mt-10 max-w-xl mx-auto relative bg-gradient-to-b from-[#FFFDF7] to-[#FFF8E7] border-4 border-[#FFB800] rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl ring-4 ring-[#FFB800]/20">
            {/* Badge Topo */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4200] text-white text-xs sm:text-sm font-black px-5 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              <span>⚡ KIT COMPLETO + 4 BÔNUS INCLUSOS</span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 mb-2 uppercase">
                Colorindo as Sílabas Simples 1° Ano
              </h3>

              <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wide mb-5">
                ✓ ACESSO IMEDIATO + DIREITO DE IMPRESSÃO ILIMITADO
              </div>

              {/* Bloco de Ancoragem de Preço: De R$ 97,00 por R$ 14,90 */}
              <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-inner my-2">
                <div className="text-sm sm:text-base text-gray-500 font-semibold">
                  Valor total dos materiais vendidos separadamente:{" "}
                  <span className="line-through text-rose-600 font-extrabold">
                    R$ 97,00
                  </span>
                </div>

                <div className="text-xs uppercase text-emerald-700 font-extrabold mt-2 tracking-wider">
                  HOJE • PAGAMENTO ÚNICO DE:
                </div>

                <div className="my-1 flex items-baseline justify-center gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                    R$
                  </span>
                  <span className="text-5xl sm:text-6xl font-black text-emerald-600 tracking-tight">
                    14,90
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-gray-600">
                  à vista no PIX ou Cartão (ou em até 3x de R$ 5,52)
                </p>
              </div>

              {/* Stack Completo de Entregáveis com Preços Ancorados */}
              <ul className="text-left space-y-3 my-6 text-gray-800 text-sm sm:text-base font-medium">
                {[
                  {
                    nome: "Caderno Principal: 40 Atividades Colorindo as Sílabas Simples 1° Ano",
                    ancora: "R$ 37,00",
                  },
                  {
                    nome: "Bônus #1: Caderno de Atividades Português 1° Ano",
                    ancora: "R$ 19,90",
                  },
                  {
                    nome: "Bônus #2: Caderno de Atividades Matemática 1° Ano",
                    ancora: "R$ 19,90",
                  },
                  {
                    nome: "Bônus #3: Caderno de Atividades Folclore 1° Ano",
                    ancora: "R$ 14,90",
                  },
                  {
                    nome: "Bônus #4: Silabário Ilustrado Completo para Impressão",
                    ancora: "R$ 14,90",
                  },
                  {
                    nome: "Envio imediato em PDF de Alta Resolução (Padrão A4)",
                    ancora: "Incluso",
                  },
                  {
                    nome: "Acesso Vitalício + Garantia Incondicional de 7 Dias",
                    ancora: "Incluso",
                  },
                ].map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 border-b border-amber-100/80 pb-2 last:border-none"
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold text-gray-800">
                        {feat.nome}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded whitespace-nowrap">
                      {feat.ancora === "Incluso" ? "✓ Incluso" : `(${feat.ancora})`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <a
                href={checkoutUrlFinal}
                onClick={dispararInitiateCheckout}
                className="w-full inline-block text-center bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-['Montserrat',sans-serif] font-extrabold text-lg sm:text-2xl py-4 sm:py-5 px-6 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all uppercase cursor-pointer"
              >
                QUERO TUDO POR R$ 14,90 AGORA!
              </a>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ambiente Criptografado • Liberação Automática na Hora</span>
              </div>

              <div className="mt-5">
                <img
                  src="/colorindo-silabas/Satisfacao-Garantida-1-1.png"
                  alt="Satisfação Garantida 100%"
                  className="w-full max-w-[340px] h-auto object-contain mx-auto"
                  loading="lazy"
                />
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
            className="mt-2 inline-block bg-[#1FB826] hover:bg-[#1caa23] text-white font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer uppercase"
          >
            Quero acessar agora e imprimir hoje
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

      {/* Como é o Acesso (Passo a Passo) */}
      <section className="py-16 px-4 bg-gray-50 text-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222]">
            Como é o Acesso
            <span className="block text-lg sm:text-xl font-normal text-gray-600 mt-1">
              (Simples, Rápido e Automático)
            </span>
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Passo 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-transform">
              <img
                src="/colorindo-silabas/order-2.png"
                alt="Conclua sua compra"
                className="w-20 h-20 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                1. Conclua sua compra
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Após o pagamento via PIX ou Cartão, seu acesso é liberado
                automaticamente na mesma hora.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-transform">
              <img
                src="/colorindo-silabas/member-card-2.png"
                alt="Acesse a Central de Downloads"
                className="w-20 h-20 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                2. Acesse a Área de Membros
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Você é direcionado para a <b>Central de Downloads</b> e também
                recebe o link direto no seu e-mail.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-transform">
              <img
                src="/colorindo-silabas/download-2.png"
                alt="Baixe os arquivos"
                className="w-20 h-20 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                3. Baixe os PDFs em A4
              </h3>
              <ul className="text-left space-y-1.5 text-xs sm:text-sm text-gray-700 font-medium mb-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Atividades prontas em PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Produto 100% digital</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Imprima quantas vezes quiser</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <a
              href={checkoutUrlFinal}
              onClick={dispararInitiateCheckout}
              className="inline-block bg-[#1FB826] hover:bg-[#1caa23] text-white font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl py-4 px-10 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all cursor-pointer uppercase"
            >
              QUERO MEU ACESSO AGORA POR R$ 14,90
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
    </div>
  );
}
