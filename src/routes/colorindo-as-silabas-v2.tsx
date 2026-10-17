import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Mail,
  MessageCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/colorindo-as-silabas-v2")({
  head: () => ({
    meta: [
      { title: "Colorindo as Sílabas V2 – Central Cademi" },
      {
        name: "description",
        content:
          "Transforme o aprendizado das SÍLABAS em uma brincadeira divertida que ajuda a criança a avançar na leitura e na escrita.",
      },
      { property: "og:title", content: "Colorindo as Sílabas V2 – Central Cademi" },
      {
        property: "og:description",
        content:
          "40 atividades prontas, lúdicas e organizadas para o 1° Ano. Acesso imediato em PDF.",
      },
      {
        property: "og:image",
        content:
          "https://centralcademi.com.br/wp-content/uploads/2026/08/Capa_-_Colorindo_as_Silabas_Simples2-1024x1024.png",
      },
    ],
    links: [
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

const CHECKOUT_BASICO =
  "https://checkout.alfacademi.com.br/checkout/oferta-0MNFNWAE922IZesJ";
const CHECKOUT_PREMIUM =
  "https://checkout.alfacademi.com.br/checkout/oferta-3u0mlpLV72S6Ascq";
const LINK_AMOSTRA =
  "https://drive.google.com/file/d/19PG-c9cD1whD5qbrtVAj-PZuAD3JQVap/view?usp=sharing";
const LINK_WHATSAPP =
  "https://wa.me/5551995499349?text=Ol%C3%A1%21%20Gostaria%20de%20saber%20mais%20sobre%20Colorindo%20as%20S%C3%ADlabas%20Simples";

const CARROSSEL_1 = [
  "https://centralcademi.com.br/wp-content/uploads/2026/08/07-J-JA-JE-JI-JO-JU-para-colorir.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/06-H-HA-HE-HI-HO-HU-para-colorir.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/05-G-GA-GE-GI-GO-GU-para-colorir.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/04-F-FA-FE-FI-FO-FU-para-colorir.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/02-C-CA-CE-CI-CO-CU-para-colorir.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/03-D-DA-DE-DI-DO-DU-para-colorir.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/08-L-LA-LE-LI-LO-LU-para-colorir.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/01-B-BA-BE-BI-BO-BU-para-colorir.png",
];

const CARROSSEL_2 = [
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_7.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_6.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_5.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_4.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_3.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_2.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_9.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Silabario_8.png",
];

const DEPOIMENTOS = [
  "https://centralcademi.com.br/wp-content/uploads/2026/08/milla-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/cardoso-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Dias-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Jo-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Vanessa-2.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Rosangela-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Pri-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Tati-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Meiri-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Luh-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Vanessa-1-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Kheir-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Edina-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Screenshot_2-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Screenshot_1-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/cidianejarde-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/adri-1.png",
  "https://centralcademi.com.br/wp-content/uploads/2026/08/Imagem-sem-titulo-1.png",
];

const FAQS = [
  {
    pergunta: "Quais as Formas de Pagamento?",
    resposta:
      "PIX, Cartão de Crédito ou Boleto Bancário.\nPor cartão de crédito e pix, a compensação é imediata.\nPor boleto a compensação pode acontecer em até 72h úteis, devido a comunicação interbancária.",
  },
  {
    pergunta: "Tem garantia?",
    resposta:
      "Sim, são 7 dias de garantia incondicional. Caso você não goste, devolvemos o seu investimento sem burocracia.",
  },
  {
    pergunta: "Como vou ter acesso ao Material?",
    resposta:
      "Após a compensação do pagamento, você receberá o acesso por e-mail.\nO conteúdo estará disponível integralmente e já pronto para baixar, imprimir e realizar.\nOs arquivos estão em PDF em alta resolução (não disponível em formato editável).",
  },
];

function PaginaColorindoAsSilabas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(15 * 60);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).pixelId = "691cb8a66228ee189bdda0b7";
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

  const rolarParaOferta = () => {
    const el = document.getElementById("oferta");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const alternarFaq = (idx: number) => {
    setFaqAberto(faqAberto === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-white text-[#222222] font-['Inter',sans-serif] selection:bg-[#FF6799]/20 selection:text-[#FF6799]">
      {/* Top Badge: Compra 100% Segura */}
      <header className="bg-white py-3 px-4 flex justify-center items-center border-b border-gray-100">
        <div className="bg-[#93D36F] text-black font-semibold text-xs sm:text-sm md:text-base px-6 py-2 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2">
          <span>🔒</span>
          <span>Compra 100% segura e protegida</span>
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
            brincadeira divertida que ajuda a criança a avançar na leitura e na
            escrita
          </p>

          {/* Capa Principal */}
          <div className="my-6 max-w-[520px] w-full px-2">
            <img
              src="https://centralcademi.com.br/wp-content/uploads/2026/08/Capa_-_Colorindo_as_Silabas_Simples2-1024x1024.png"
              alt="Capa Colorindo as Sílabas Simples"
              className="w-full h-auto drop-shadow-xl rounded-2xl mx-auto transition-transform hover:scale-[1.01]"
              loading="eager"
            />
          </div>

          {/* Botão de Ação Principal */}
          <button
            onClick={rolarParaOferta}
            className="w-full max-w-[480px] bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-1 text-white font-['Montserrat',sans-serif] font-bold text-2xl sm:text-3xl py-4 sm:py-5 px-8 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all cursor-pointer uppercase tracking-wide flex items-center justify-center gap-3"
          >
            EU QUERO
          </button>

          {/* Aviso de Entrega por E-mail */}
          <div className="mt-6 flex flex-row items-center justify-center gap-3 max-w-lg text-left px-2">
            <img
              src="https://centralcademi.com.br/wp-content/uploads/2026/08/Email-1.png"
              alt="Ícone de E-mail"
              className="w-12 h-12 flex-shrink-0 object-contain"
            />
            <p className="text-xs sm:text-sm font-medium text-[#444444] leading-snug">
              Após a compra, você recebe acesso ao arquivo em formato PDF, no seu
              e-mail cadastrado.
            </p>
          </div>

          {/* Selo Satisfação Garantida / Acesso Imediato */}
          <div className="mt-6 max-w-[540px] w-full">
            <img
              src="https://centralcademi.com.br/wp-content/uploads/2026/08/Satisfacao-Garantida-Acesso-Imediato-1.png"
              alt="Satisfação Garantida e Acesso Imediato"
              className="w-full h-auto mx-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Faixa Rosa: 1° Ano */}
      <section className="bg-[#FF6799] py-4 text-center">
        <h2 className="text-white text-3xl sm:text-4xl font-extrabold tracking-wide">
          1° Ano
        </h2>
      </section>

      {/* Exemplos de Atividades */}
      <section className="py-14 px-4 bg-white text-center overflow-hidden">
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222]">
            Exemplos de Atividades
          </h2>

          <p className="mt-4 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Com atividades de pintura por código de sílabas, a criança aprende a
            reconhecer sílabas simples enquanto colore, desenvolvendo também
            atenção, concentração e percepção visual.
          </p>

          <div className="mt-5 inline-block">
            <h3 className="text-xl sm:text-2xl font-bold text-[#333333]">
              <span className="bg-[#FFE6A3] font-black px-2 py-0.5 rounded">
                40 atividades
              </span>{" "}
              prontas, lúdicas e organizadas
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

        {/* Baixar Amostra Grátis */}
        <div className="max-w-xl mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
            Baixar amostra grátis:
          </h3>
          <a
            href={LINK_AMOSTRA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg sm:text-xl py-3 px-8 rounded-xl shadow-md transition-all active:translate-y-0.5"
          >
            <Download className="w-6 h-6 animate-bounce" />
            <span>Clique aqui para baixar</span>
          </a>
        </div>
      </section>

      {/* O que você vai receber ao adquirir */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-md border border-gray-100 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] uppercase tracking-tight">
            veja o que você vai receber ao adquirir
          </h2>

          <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-wider">
            <span>⚡ ACESSO IMEDIATO</span>
          </div>

          <div className="my-8 max-w-[420px] mx-auto">
            <img
              src="https://centralcademi.com.br/wp-content/uploads/2026/08/Capa_-_Colorindo_as_Silabas_Simples2-1024x1024.png"
              alt="Apostila Colorindo as Sílabas Simples"
              className="w-full h-auto drop-shadow-md rounded-xl"
              loading="lazy"
            />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#333333] mb-6">
            Tudo foi organizado para ser simples e fácil de aplicar
          </h3>

          <ul className="text-left space-y-4 max-w-2xl mx-auto text-gray-700 text-sm sm:text-base font-medium">
            {[
              "Famílias Silábicas Simples – Reconhecimento e aprendizagem das principais famílias silábicas",
              "Formação de Sílabas – Junção das consoantes com as vogais A, E, I, O e U",
              "Pontilhado – Prática da escrita de sílabas e palavras para desenvolver o traçado",
              "Associação entre Imagens e Palavras – Identificação de palavras a partir de figuras ilustradas",
              "Pintura por Código de Sílabas – Reconhecimento da sílaba correta para colorir cada parte do desenho",
              "Reconhecimento das Vogais – Formação das famílias silábicas a partir das diferentes vogais",
              "Coordenação Motora e Percepção Visual – Atividades de escrita, pontilhado e pintura de forma lúdica",
              "Leitura e Escrita – Treino das sílabas e de palavras simples do cotidiano",
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-0.5 bg-emerald-100 text-emerald-600 rounded-full p-1">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-wide">
            E MUITO MAIS...
          </h3>

          <div className="mt-6 flex justify-center">
            <button
              onClick={rolarParaOferta}
              className="w-full max-w-[440px] bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-1 text-white font-['Montserrat',sans-serif] font-bold text-xl sm:text-2xl py-4 px-6 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all cursor-pointer"
            >
              Sim, quero garantir o material
            </button>
          </div>

          <p className="mt-4 text-xs sm:text-sm font-semibold text-gray-500">
            Você recebe tudo na hora, direto no seu e-mail
          </p>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-14 px-4 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] mb-10">
            Depoimentos @licaokids_
          </h2>

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
                  src="https://centralcademi.com.br/wp-content/uploads/2026/08/3-3-1.png"
                  alt="Chega no seu e-mail"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Chega no seu e-mail
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Conteúdo digital, <b>formato PDF</b> para impressão, após
                efetuar o pagamento você receberá o <b>acesso via e-mail</b> a
                todo material para poder baixá-lo.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-28 h-28 mb-4">
                <img
                  src="https://centralcademi.com.br/wp-content/uploads/2026/08/4-2-1.png"
                  alt="Baixe as atividades"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Baixe as atividades
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Os arquivos estão organizados por <b>módulos</b> para facilitar a
                impressão, baixe para seu <b>PC ou celular</b>, você pode
                imprimir quantas vezes desejar.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-28 h-28 mb-4">
                <img
                  src="https://centralcademi.com.br/wp-content/uploads/2026/08/5-1-1-1.png"
                  alt="Realizar as atividades"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Realizar as atividades
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Mão na massa, é hora de <b>realiza-las</b> com o seu pequeno (a)!
                Boa diversão, realize as atividades <b>no seu tempo.</b>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Oferta / Pricing Cards */}
      <section id="oferta" className="py-16 px-4 bg-white scroll-mt-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-rose-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Clock className="w-4 h-4" />
            <span>🕒 OFERTA VÁLIDA POR TEMPO LIMITADO</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#222222]">
            Aproveite Enquanto está{" "}
            <span className="text-[#d97c53]">em Promoção!</span>
          </h2>

          {/* Cards de Preço */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            {/* Card Plano Básico */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Plano Básico
                </h3>

                <ul className="text-left space-y-3 mb-8 text-gray-700 text-sm font-medium">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      40 pág. Colorindo as Sílabas Simples 1° Ano (Em PDF)
                    </span>
                  </li>
                </ul>

                <p className="text-sm font-medium text-gray-500 mb-4">
                  Clique no botão abaixo e garanta já o seu!
                </p>

                <div className="my-4">
                  <span className="text-4xl sm:text-5xl font-black text-gray-900">
                    R$10,00
                  </span>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
                    Pagamento Único
                  </p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setModalAberto(true)}
                  className="w-full bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl py-3.5 px-6 rounded-xl shadow-[0_4px_0_0_#168D1F] transition-all cursor-pointer uppercase"
                >
                  quero essa opção!
                </button>

                <div className="mt-6">
                  <img
                    src="https://centralcademi.com.br/wp-content/uploads/2026/08/AINDA-DA-TEMPO-DE-LEVAR-A-MELHOR-OPCAO-1-1.png"
                    alt="Ainda dá tempo de levar a melhor opção"
                    className="w-full h-auto object-contain mx-auto"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Card Plano Premium (Destaque) */}
            <div className="relative bg-gradient-to-b from-[#FFFDF7] to-[#FFF8E7] border-3 border-[#FFB800] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl ring-4 ring-[#FFB800]/20">
              {/* Badge Mais Vendido */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4200] text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>⚡ MAIS VENDIDO</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 mb-2">
                  PLANO PREMIUM
                </h3>

                <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
                  ✓ TODOS OS BÔNUS INCLUSOS
                </div>

                <div className="text-sm text-gray-400 line-through font-semibold">
                  Valor Total R$ 97,00
                </div>

                <div className="text-xs uppercase text-gray-600 font-bold mt-1">
                  Hoje Pagamento Único
                </div>

                <div className="my-2">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-600">
                    R$14,90
                  </span>
                  <p className="text-xs font-bold text-gray-600 mt-1">
                    Ou 3x de R$ 5,96 no cartão
                  </p>
                </div>

                <ul className="text-left space-y-2.5 my-6 text-gray-800 text-sm font-medium">
                  {[
                    "Colorindo as Sílabas Simples",
                    "Português 1° Ano",
                    "Folclore 1° Ano",
                    "Matemática 1° Ano",
                    "Envio imediato por e-mail (em PDF)",
                    "Acesso vitalício",
                    "Clique no botão abaixo e garanta já o seu! ↴",
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <a
                  href={CHECKOUT_PREMIUM}
                  className="w-full inline-block text-center bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl py-4 px-6 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all uppercase animate-pulse hover:animate-none"
                >
                  sim, quero o PLANO PREMIUM
                </a>

                <div className="mt-6">
                  <img
                    src="https://centralcademi.com.br/wp-content/uploads/2026/08/Satisfacao-Garantida-1-1.png"
                    alt="Satisfação Garantida 100%"
                    className="w-full h-auto object-contain mx-auto"
                    loading="lazy"
                  />
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
            professores já utilizam nossos{" "}
            <span className="text-[#fdce00]">materiais</span> no dia a dia.
          </h2>

          <p className="mt-3 text-base sm:text-lg text-gray-300">
            Aproveite a oferta por tempo limitado
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

          <button
            onClick={rolarParaOferta}
            className="mt-2 bg-[#1FB826] hover:bg-[#1caa23] text-white font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl py-3.5 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer uppercase"
          >
            Quero acessar agora e usar hoje
          </button>
        </div>
      </section>

      {/* Suporte WhatsApp */}
      <section className="py-12 px-4 bg-white text-center border-b border-gray-100">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">
            DÚVIDAS?
          </h2>
          <h4 className="mt-2 text-sm sm:text-base font-bold text-gray-600 uppercase tracking-wide">
            FALE COM A NOSSA EQUIPE NO WHATSAPP:
          </h4>

          <a
            href={LINK_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-base sm:text-lg py-3.5 px-8 rounded-xl shadow-md transition-all active:translate-y-0.5 uppercase"
          >
            <MessageCircle className="w-6 h-6 fill-white" />
            <span>ENVIE UMA MENSAGEM</span>
          </a>
        </div>
      </section>

      {/* Qualidade Garantida Lição Kids */}
      <section className="py-12 px-4 bg-gray-50 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">
            Qualidade garantida{" "}
            <span className="text-[#2CAA33]">@LICAOKIDS_</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
            Todas atividades pertencem à <b>Lição Kids</b>, uma marca referência em
            alfabetização infantil, com mais de <b>100 mil clientes</b> e mais
            de <b>20 produtos pedagógicos</b> em nossa galeria. Materiais
            completos, atualizados e aprovados por educadores de todo o Brasil.
          </p>
        </div>
      </section>

      {/* Garantia Incondicional 7 Dias */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-56 sm:w-64 flex-shrink-0">
            <img
              src="https://centralcademi.com.br/wp-content/uploads/2026/08/Kids41-Compressao-1-1.png"
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
              Isso significa que, <b>a qualquer momento</b>, se você achar que:
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
                👉 você pode solicitar o reembolso.
              </p>
              <p className="font-extrabold text-emerald-950 mt-1">
                7 dias de garantia incondicional
              </p>
              <p className="text-xs sm:text-sm text-emerald-800">
                Sem burocracia. Sem explicação obrigatória.
              </p>
            </div>

            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Essa garantia existe porque acreditamos no valor prático do nosso
              material. Você não está comprando uma promessa. Está comprando{" "}
              <b>
                atividades prontas, testadas e validadas por pais e professores.
              </b>{" "}
              Se não fizer sentido para você, o risco fica totalmente do nosso
              lado.
            </p>
          </div>
        </div>
      </section>

      {/* Como é o Acesso (Passo a Passo) */}
      <section className="py-16 px-4 bg-gray-50 text-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222]">
            Como é o Acesso
            <span className="block text-lg sm:text-xl font-normal text-gray-600 mt-1">
              (Passo a Passo)
            </span>
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Passo 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-transform">
              <img
                src="https://centralcademi.com.br/wp-content/uploads/2026/08/order-2.png"
                alt="Conclua sua compra"
                className="w-20 h-20 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Conclua sua compra
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Após o pagamento, seu acesso é liberado automaticamente.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-transform">
              <img
                src="https://centralcademi.com.br/wp-content/uploads/2026/08/member-card-2.png"
                alt="Entre na área de membros"
                className="w-20 h-20 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Entre na área de membros
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Você recebe os dados para acessar a <b>área de membros</b>, onde
                todo o material fica organizado.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-transform">
              <img
                src="https://centralcademi.com.br/wp-content/uploads/2026/08/download-2.png"
                alt="Baixe os arquivos"
                className="w-20 h-20 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Baixe os arquivos
              </h3>
              <ul className="text-left space-y-1.5 text-xs sm:text-sm text-gray-700 font-medium mb-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Atividades em PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>O produto é 100% digital</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Não editável</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                Tudo organizado por módulos, para facilitar o uso.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={rolarParaOferta}
              className="bg-[#1FB826] hover:bg-[#1caa23] text-white font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl py-4 px-10 rounded-xl shadow-[0_5px_0_0_#168D1F] transition-all cursor-pointer uppercase"
            >
              QUERO MEU ACESSO AGORA
            </button>
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

      {/* Rodapé */}
      <footer className="bg-gray-900 text-gray-300 py-14 px-4 border-t border-gray-800 text-sm">
        <div className="max-w-5xl mx-auto">
          {/* Logo Central */}
          <div className="flex justify-center mb-10">
            <img
              src="https://centralcademi.com.br/wp-content/uploads/2026/08/Logo_Licao_Kids-2-1.png"
              alt="Logo Lição Kids"
              className="h-16 w-auto object-contain"
              loading="lazy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left mb-10">
            {/* Formas de Pagamento & Garantia */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <h4 className="font-bold text-white text-base uppercase tracking-wider">
                FORMAS DE PAGAMENTO
              </h4>
              <img
                src="https://centralcademi.com.br/wp-content/uploads/2026/08/pagamento-1-1.png02-1-1.png"
                alt="Formas de Pagamento Aceitas"
                className="max-w-[240px] h-auto object-contain"
                loading="lazy"
              />
              <img
                src="https://centralcademi.com.br/wp-content/uploads/2026/08/garantia-360-slim-1-1.png"
                alt="Garantia 360"
                className="max-w-[240px] h-auto object-contain mt-2"
                loading="lazy"
              />
            </div>

            {/* Atendimento */}
            <div className="flex flex-col items-center md:items-start space-y-2">
              <h4 className="font-bold text-white text-base uppercase tracking-wider">
                DÚVIDAS?
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-lg">
                  51 98523-5758
                </span>
              </div>
              <p className="text-xs text-gray-400">
                de segunda a sexta das 09:00h às 18:00h
              </p>
            </div>

            {/* Links Úteis */}
            <div className="flex flex-col items-center md:items-start space-y-2.5">
              <h4 className="font-bold text-white text-base uppercase tracking-wider">
                LINKS
              </h4>
              <a
                href="https://licaocursivas.com.br/suporte-contato/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Contato
              </a>
              <a
                href="https://lojalicaokids.com/index.php/politica-de-privacidade/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Política de Privacidade
              </a>
              <a
                href="https://lojalicaokids.com/index.php/termos/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Termos de Uso
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-400">
            <p>Todos os direitos reservados | Lição Kids 2025</p>
          </div>
        </div>
      </footer>

      {/* Modal Popup Upgrade Premium */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#FFFDF7] to-[#FFF9EE] border-3 border-[#FFB800] rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            {/* Botão Fechar */}
            <button
              onClick={() => setModalAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-white/80 rounded-full p-1.5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="inline-block bg-amber-500 text-white font-extrabold text-xs uppercase px-3 py-1 rounded-full tracking-wider mb-2">
              Upgrade Premium
            </span>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Pacote Premium
            </h3>

            <div className="my-3">
              <span className="text-4xl sm:text-5xl font-black text-emerald-600">
                R$14,90
              </span>
              <p className="text-xs uppercase font-extrabold text-gray-600 mt-1">
                Acesso VITALÍCIO
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-4 border border-amber-200 text-left my-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
                INCLUI:
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-800 font-medium">
                {[
                  "Colorindo as Sílabas Simples",
                  "Português 1° Ano",
                  "Folclore 1° Ano",
                  "Matemática 1° Ano",
                  "Acesso vitalício ao conteúdo",
                  "Clique no botão abaixo e garanta já o seu ↴",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <a
                href={CHECKOUT_PREMIUM}
                className="w-full inline-block bg-[#1FB826] hover:bg-[#1caa23] text-white font-['Montserrat',sans-serif] font-bold text-base sm:text-lg py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#168D1F] transition-all uppercase cursor-pointer"
              >
                QUERO O PREMIUM POR R$ 14,90
              </a>

              <a
                href={CHECKOUT_BASICO}
                className="w-full inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Quero só o Colorindo as Sílabas Simples R$ 10,00
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
