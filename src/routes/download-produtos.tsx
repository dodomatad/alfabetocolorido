import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Download,
  Lock,
  Unlock,
  CheckCircle2,
  Printer,
  Sparkles,
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  Heart,
  ArrowRight
} from "lucide-react";
import { useFavicon } from "@/hooks/use-favicon";

export const Route = createFileRoute("/download-produtos")({
  head: () => ({
    meta: [
      { title: "Meus Produtos · Mundo da Alfabetização" },
      {
        name: "description",
        content: "Acesse e baixe seu acervo vitalício de cadernos em PDF para alfabetização infantil.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/colorindo-silabas/favicon-colorindo-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/colorindo-silabas/favicon-colorindo-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/colorindo-silabas/favicon-colorindo-180.png" },
    ],
  }),
  component: PaginaDownloadProdutos,
});

export default function PaginaDownloadProdutos() {
  useFavicon(
    "/colorindo-silabas/favicon-colorindo-32.png",
    "/colorindo-silabas/favicon-colorindo-180.png"
  );

  const [busca, setBusca] = useState("");
  const [temAcessoCursivas, setTemAcessoCursivas] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const acessoUrl = params.get("acesso");
    const bumpUrl = params.get("bump");
    const jaTemSalvo = localStorage.getItem("acesso_cursivas") === "true";

    if (acessoUrl === "cursivas" || bumpUrl === "cursivas" || jaTemSalvo) {
      setTemAcessoCursivas(true);
      localStorage.setItem("acesso_cursivas", "true");
    }
  }, []);

  const produtosLiberados = [
    {
      id: "silabas-simples",
      titulo: "Colorindo as Sílabas Simples 1° Ano",
      subtitulo: "Material Principal Oficial",
      descricao: "40 páginas com atividades lúdicas de código de cores, traçado de sílabas de B a Z, associação visual e Certificado de Leitor(a) Mirim.",
      paginas: "40 Páginas A4",
      tamanho: "5.5 MB",
      badge: "Material Principal",
      corBadge: "bg-emerald-600 text-white",
      capa: "/colorindo-silabas/covers/capa-silabas-simples.jpg",
      arquivos: [
        {
          nome: "Baixar Apostila Oficial Completa (40 Páginas)",
          url: "/colorindo-silabas/colorindo-as-silabas-completo.pdf",
          arquivoNome: "Colorindo-as-Silabas-Simples-1Ano.pdf",
        },
      ],
    },
    {
      id: "portugues-1ano",
      titulo: "Português 1° Ano – Apostila Master",
      subtitulo: "Mega Bônus Completo",
      descricao: "97 páginas com formação de palavras, leitura, ordem alfabética, frases e atividades lúdicas de recortar e colar.",
      paginas: "97 Páginas A4",
      tamanho: "11.4 MB",
      badge: "Bônus #1",
      corBadge: "bg-indigo-600 text-white",
      capa: "/colorindo-silabas/covers/capa-portugues-1ano.jpg",
      arquivos: [
        {
          nome: "Baixar Apostila Master de Português (97 Páginas)",
          url: "/colorindo-silabas/portugues-1ano-bonus.pdf",
          arquivoNome: "Apostila-Portugues-1Ano.pdf",
        },
      ],
    },
    {
      id: "matematica-1ano",
      titulo: "Matemática 1° Ano – Kit Essencial",
      subtitulo: "Mega Bônus Completo",
      descricao: "66 páginas de numerais, sequência numérica, operações de adição e subtração, situações-problema e tabuada ilustrada.",
      paginas: "66 Páginas A4",
      tamanho: "10.6 MB",
      badge: "Bônus #2",
      corBadge: "bg-amber-600 text-white",
      capa: "/colorindo-silabas/covers/capa-matematica-1ano.jpg",
      arquivos: [
        {
          nome: "Baixar Caderno Completo de Matemática (66 Páginas)",
          url: "/colorindo-silabas/matematica-1ano-bonus.pdf",
          arquivoNome: "Caderno-Matematica-1Ano.pdf",
        },
      ],
    },
    {
      id: "folclore-1ano",
      titulo: "Folclore Brasileiro 1° Ano",
      subtitulo: "Bônus Exclusivo",
      descricao: "41 páginas com personagens do folclore (Saci, Iara, Curupira), parlendas, quebra-cabeças e atividades interdisciplinares.",
      paginas: "41 Páginas A4",
      tamanho: "6.2 MB",
      badge: "Bônus #3",
      corBadge: "bg-rose-600 text-white",
      capa: "/colorindo-silabas/covers/capa-folclore-1ano.jpg",
      arquivos: [
        {
          nome: "Baixar Caderno Folclore Brasileiro (41 Páginas)",
          url: "/colorindo-silabas/folclore-1ano-bonus.pdf",
          arquivoNome: "Caderno-Folclore-1Ano.pdf",
        },
      ],
    },
    {
      id: "silabario-ilustrado",
      titulo: "Silabário Ilustrado de Mesa e Parede",
      subtitulo: "Material de Apoio Visual",
      descricao: "22 páginas com fichas em alta resolução de todas as famílias silábicas para fixar no quarto ou na mesa de estudos.",
      paginas: "22 Páginas A4",
      tamanho: "2.9 MB",
      badge: "Bônus #4",
      corBadge: "bg-cyan-700 text-white",
      capa: "/colorindo-silabas/covers/capa-silabario.jpg",
      arquivos: [
        {
          nome: "Baixar Silabário Ilustrado Completo (22 Páginas)",
          url: "/colorindo-silabas/silabario-completo.pdf",
          arquivoNome: "Silabario-Ilustrado-Completo.pdf",
        },
      ],
    },
  ];

  const filtrados = produtosLiberados.filter((p) =>
    p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    p.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-['Inter',sans-serif]">
      {/* Top Banner Alfacademi Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/colorindo-silabas/logo-colorindo-v2.jpg"
              alt="Logo Mundo da Alfabetização"
              className="h-10 w-auto rounded-lg shadow-sm object-contain"
            />
            <div>
              <span className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight block">
                Mundo da Alfabetização
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold tracking-wide uppercase block">
                Área de Membros Oficial
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Acesso Vitalício
            </span>
            <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-300">
              LT
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-3">
                Seu Acervo Vitalício
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Meus Produtos & Materiais em PDF
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
                Parabéns pelo investimento na educação do seu filho(a)! Seus materiais digitais ficam disponíveis aqui para sempre. Baixe os arquivos abaixo e imprima quantas vezes precisar.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                5+
              </div>
              <div className="text-left">
                <span className="block text-xs text-gray-500 font-medium">Materiais Liberados</span>
                <span className="block text-sm font-bold text-gray-900">Acesso Imediato</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar material no seu acervo..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Instructions Quick Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
              1
            </div>
            <p className="text-xs text-emerald-950 font-medium leading-snug">
              Clique em <strong>Baixar Arquivo</strong> para salvar no celular ou PC.
            </p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
              2
            </div>
            <p className="text-xs text-emerald-950 font-medium leading-snug">
              Formato A4 padrão, pronto para impressão comum colorida ou preto e branco.
            </p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
              3
            </div>
            <p className="text-xs text-emerald-950 font-medium leading-snug">
              Reimprima páginas específicas quantas vezes a criança desejar treinar.
            </p>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((produto) => (
            <article
              key={produto.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Book Thumbnail */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden border-b border-gray-100 flex items-center justify-center p-3">
                  <img
                    src={produto.capa}
                    alt={produto.titulo}
                    className="w-full h-full object-contain drop-shadow-md rounded-lg transition-transform hover:scale-105 duration-300"
                    loading="lazy"
                  />
                  <span
                    className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm ${produto.corBadge}`}
                  >
                    {produto.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-medium">
                    <span>{produto.paginas}</span>
                    <span>{produto.tamanho}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    {produto.titulo}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {produto.descricao}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0">
                {produto.arquivos.map((arq, idx) => (
                  <a
                    key={idx}
                    href={arq.url}
                    download={arq.arquivoNome}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Material (PDF)</span>
                  </a>
                ))}
              </div>
            </article>
          ))}

          {/* ========================================================================= */}
          {/* CARD DO ORDER BUMP: COLORINDO COM AS SÍLABAS CURSIVAS                     */}
          {/* Trava dinâmica: liberado via ?acesso=cursivas ou bloqueado com cadeado    */}
          {/* ========================================================================= */}
          <article
            className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm ${
              temAcessoCursivas
                ? "bg-white border-emerald-300 ring-2 ring-emerald-500/20"
                : "bg-gradient-to-b from-amber-50/50 to-white border-amber-200"
            }`}
          >
            <div>
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden border-b border-gray-100 flex items-center justify-center p-3">
                <img
                  src="/colorindo-silabas/covers/capa-silabas-cursivas.jpg"
                  alt="Colorindo com as Sílabas Cursivas"
                  className={`w-full h-full object-contain drop-shadow-md rounded-lg transition-transform duration-300 ${
                    !temAcessoCursivas ? "opacity-90 grayscale-[20%]" : "hover:scale-105"
                  }`}
                  loading="lazy"
                />

                {temAcessoCursivas ? (
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> Order Bump Adquirido
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Oferta Adicional
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-medium">
                  <span>44 Páginas A4</span>
                  <span>13.5 MB Total</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                  Colorindo com as Sílabas Cursivas
                </h3>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {temAcessoCursivas
                    ? "Parabéns! Você adquiriu o kit de Sílabas Cursivas no checkout. Baixe abaixo a apostila de 22 páginas de treino cursivo + Silabário Cursivo Ilustrado."
                    : "Kit completo com 44 páginas de atividades para preparar a criança para a escrita cursiva, com pontilhado, famílias silábicas e silabário cursivo."}
                </p>
              </div>
            </div>

            {/* Action Buttons (Liberado vs Bloqueado) */}
            <div className="p-5 pt-0">
              {temAcessoCursivas ? (
                <div className="flex flex-col gap-2">
                  <a
                    href="/colorindo-silabas/colorindo-silabas-cursivas-orderbump.pdf"
                    download="Colorindo-Silabas-Cursivas.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1FB826] hover:bg-[#1caa23] text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Caderno Cursivas (22 Pags)</span>
                  </a>
                  <a
                    href="/colorindo-silabas/silabario-cursivas-orderbump.pdf"
                    download="Silabario-Cursivas.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Silabário Cursivo (22 Pags)</span>
                  </a>
                </div>
              ) : (
                <div className="bg-amber-100/60 border border-amber-300/80 rounded-xl p-3.5 text-center">
                  <span className="block text-xs font-extrabold text-amber-900 mb-1">
                    🔒 Não incluso no pacote de R$ 14,90
                  </span>
                  <p className="text-[11px] text-amber-800 leading-tight mb-3">
                    Deseja desbloquear as 44 páginas de Sílabas Cursivas para seu pequeno agora?
                  </p>
                  <a
                    href="https://pay.cakto.com.br/mswtxij_1243353"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gray-900 hover:bg-black text-amber-300 font-bold text-xs py-2.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Desbloquear Cursivas por R$ 9,90</span>
                  </a>
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Footer Guarantee Strip */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Garantia Incondicional de 7 Dias</h4>
              <p className="text-xs text-gray-500">Se precisar de ajuda ou reimpressão, seu acervo continuará disponível aqui.</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">© 2026 Mundo da Alfabetização · Todos os direitos reservados</p>
        </div>
      </main>
    </div>
  );
}
