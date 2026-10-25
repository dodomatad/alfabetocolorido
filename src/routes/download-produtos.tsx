import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  FileText,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { useFavicon } from "@/hooks/use-favicon";

export const Route = createFileRoute("/download-produtos")({
  head: () => ({
    meta: [
      { title: "Download dos Produtos – Lição Kids" },
      {
        name: "description",
        content: "Acesse e baixe todos os seus materiais do Colorindo as Sílabas e bônus exclusivos em PDF.",
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
    ],
  }),
  component: PaginaDownloadProdutos,
});

const PRODUTOS = [
  {
    id: "silabas-principal",
    titulo: "Colorindo as Sílabas Simples 1° Ano",
    descricao: "Material completo com 40 atividades lúdicas de pintura por código, traçado de sílabas e percepção visual.",
    arquivo: "/colorindo-silabas/colorindo-as-silabas-completo.pdf",
    nomeDownload: "Colorindo-as-Silabas-Simples-1Ano.pdf",
    paginas: "40 Páginas",
    tipo: "Material Principal",
    badge: "Principal",
    corBadge: "bg-emerald-500",
    capa: "/colorindo-silabas/logo-colorindo-v2.jpg",
  },
  {
    id: "portugues-1ano",
    titulo: "Bônus: Português 1° Ano",
    descricao: "Caderno extra de exercícios com alfabetização, formação de palavras, leitura guiada e treino de escrita.",
    arquivo: "/colorindo-silabas/portugues-1ano-bonus.pdf",
    nomeDownload: "Bonus-Portugues-1Ano.pdf",
    paginas: "Atividades Extras",
    tipo: "Bônus Exclusivo",
    badge: "Bônus",
    corBadge: "bg-indigo-500",
    capa: "/colorindo-silabas/01-B-BA-BE-BI-BO-BU-para-colorir.png",
  },
  {
    id: "matematica-1ano",
    titulo: "Bônus: Matemática 1° Ano",
    descricao: "Atividades de contagem, associação de números com quantidades, noções de grandeza e desafios ilustrados.",
    arquivo: "/colorindo-silabas/matematica-1ano-bonus.pdf",
    nomeDownload: "Bonus-Matematica-1Ano.pdf",
    paginas: "Atividades Extras",
    tipo: "Bônus Exclusivo",
    badge: "Bônus",
    corBadge: "bg-amber-500",
    capa: "/colorindo-silabas/Silabario_7.png",
  },
  {
    id: "folclore-1ano",
    titulo: "Bônus: Folclore 1° Ano",
    descricao: "Atividades temáticas sobre lendas folclóricas brasileiras com desenhos para colorir e caça-palavras.",
    arquivo: "/colorindo-silabas/folclore-1ano-bonus.pdf",
    nomeDownload: "Bonus-Folclore-1Ano.pdf",
    paginas: "Atividades Extras",
    tipo: "Bônus Exclusivo",
    badge: "Bônus",
    corBadge: "bg-rose-500",
    capa: "/colorindo-silabas/05-G-GA-GE-GI-GO-GU-para-colorir.png",
  },
  {
    id: "silabario-completo",
    titulo: "Silabário Ilustrado para Impressão",
    descricao: "Fichas completas com as famílias silábicas para fixar na parede do quarto ou sala de aula e recortar.",
    arquivo: "/colorindo-silabas/silabario-completo.pdf",
    nomeDownload: "Silabario-Ilustrado-Completo.pdf",
    paginas: "Guia Visual",
    tipo: "Material de Apoio",
    badge: "Guia Rápido",
    corBadge: "bg-cyan-600",
    capa: "/colorindo-silabas/Silabario_3.png",
  },
  {
    id: "amostra-gratis",
    titulo: "Amostra Grátis Demonstrativa",
    descricao: "Caderno resumo com exemplos de atividades selecionadas para demonstração e compartilhamento.",
    arquivo: "/colorindo-silabas/amostra-colorindo-as-silabas.pdf",
    nomeDownload: "Amostra-Colorindo-as-Silabas.pdf",
    paginas: "Amostra Oficial",
    tipo: "Amostra",
    badge: "Demonstração",
    corBadge: "bg-gray-600",
    capa: "/colorindo-silabas/07-J-JA-JE-JI-JO-JU-para-colorir.png",
  },
];

function PaginaDownloadProdutos() {
  useFavicon(
    "/colorindo-silabas/favicon-colorindo-32.png",
    "/colorindo-silabas/favicon-colorindo-180.png",
  );
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-['Inter',sans-serif]">
      {/* Barra Superior */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/colorindo-as-silabas-v2"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a página de vendas</span>
          </Link>

          <img
            src="/colorindo-silabas/logo-colorindo-v2.jpg"
            alt="Logo Colorindo as Sílabas V2"
            className="h-11 w-auto object-contain rounded-lg shadow-xs"
          />
        </div>
      </header>

      {/* Hero de Boas-Vindas */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-10 px-4 border-b border-gray-200 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>Acesso Imediato Liberado</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Central de Downloads dos Materiais
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Seus arquivos em formato <b>PDF em alta resolução</b> estão prontos.
            Clique no botão de cada material para baixar diretamente no seu computador ou celular.
          </p>
        </div>
      </section>

      {/* Grid de Materiais para Download */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PRODUTOS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Miniatura da Capa */}
                <div className="relative bg-gray-100 p-4 flex items-center justify-center border-b border-gray-100 h-52">
                  <span
                    className={`absolute top-3 right-3 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${item.corBadge}`}
                  >
                    {item.badge}
                  </span>
                  <img
                    src={item.capa}
                    alt={item.titulo}
                    className="max-h-44 w-auto object-contain drop-shadow-md rounded"
                    loading="lazy"
                  />
                </div>

                {/* Conteúdo Informativo */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.tipo} • {item.paginas}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 leading-snug">
                    {item.titulo}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              </div>

              {/* Botão de Download Direto */}
              <div className="p-6 pt-0">
                <a
                  href={item.arquivo}
                  download={item.nomeDownload}
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-['Montserrat',sans-serif] font-bold text-base py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#168D1F] transition-all cursor-pointer uppercase text-center"
                >
                  <Download className="w-5 h-5 flex-shrink-0" />
                  <span>Baixar PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Dicas de Impressão */}
        <section className="mt-14 bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-700 font-bold text-xl sm:text-2xl mb-4">
            <Printer className="w-7 h-7" />
            <h2>Dicas para Imprimir suas Atividades</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 mt-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="font-bold text-gray-800 text-base mb-1">
                📄 Papel Recomendado
              </h4>
              <p>
                Para pintura e lápis de cor, utilize papel sulfite A4 comum (75g).
                Se for usar canetinha ou tinta guache, papel de 90g ou 120g evita que a tinta vaze.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="font-bold text-gray-800 text-base mb-1">
                🖨️ Configuração de Impressão
              </h4>
              <p>
                Os PDFs já estão configurados no formato padrão A4 retrato (100% escala).
                Você pode optar por imprimir frente e verso ou folhas soltas para a criança pintar.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="font-bold text-gray-800 text-base mb-1">
                ♾️ Acesso Vitalício
              </h4>
              <p>
                Você pode baixar os arquivos para o seu computador, tablet ou celular e imprimir quantas vezes desejar ao longo do ano.
              </p>
            </div>
          </div>
        </section>

        {/* Suporte WhatsApp */}
        <section className="mt-10 bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h3 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              <span>Precisa de ajuda com o download?</span>
            </h3>
            <p className="text-sm text-emerald-800 mt-1">
              Nossa equipe de suporte pedagógico e técnico atende de segunda a sexta, das 09h às 18h.
            </p>
          </div>

          <a
            href="https://wa.me/5551995499349?text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20com%20o%20download%20das%20minhas%20atividades%20de%20silabas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-base py-3 px-6 rounded-xl shadow-md transition-all active:translate-y-0.5 flex-shrink-0"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Falar com o Suporte</span>
          </a>
        </section>
      </main>

      {/* Rodapé Simples */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-xs border-t border-gray-800 mt-16">
        <p>© 2025 Lição Kids • Central de Downloads de Materiais Pedagógicos</p>
      </footer>
    </div>
  );
}
