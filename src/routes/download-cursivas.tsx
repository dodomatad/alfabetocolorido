import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Sparkles, ShieldCheck, ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { useFavicon } from "@/hooks/use-favicon";

export const Route = createFileRoute("/download-cursivas")({
  head: () => ({
    meta: [
      { title: "Download Sílabas Cursivas · Mundo da Alfabetização" },
      {
        name: "description",
        content: "Acesse e baixe seu caderno exclusivo de Colorindo com as Sílabas Cursivas em PDF.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/colorindo-silabas/favicon-colorindo-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/colorindo-silabas/favicon-colorindo-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/colorindo-silabas/favicon-colorindo-180.png" },
    ],
  }),
  component: PaginaDownloadCursivas,
});

export default function PaginaDownloadCursivas() {
  useFavicon(
    "/colorindo-silabas/favicon-colorindo-32.png",
    "/colorindo-silabas/favicon-colorindo-180.png"
  );

  const arquivosCursivas = [
    {
      nome: "Caderno Colorindo com as Sílabas Cursivas (22 Páginas)",
      descricao: "Atividades de identificação, pintura por código e traçado das famílias silábicas em letra cursiva.",
      tamanho: "6.2 MB",
      paginas: "22 Páginas A4",
      url: "/colorindo-silabas/originais/produto_76_silabas_cursivas/Colorindo_Silabas_Cursivas.pdf",
      arquivoNome: "Colorindo-Silabas-Cursivas-Oficial.pdf",
    },
    {
      nome: "Silabário Cursivo Ilustrado Completo (22 Páginas)",
      descricao: "Mundo das Sílabas Cursivas com formação das sílabas, treino de caligrafia e associação com figuras.",
      tamanho: "7.0 MB",
      paginas: "22 Páginas A4",
      url: "/colorindo-silabas/originais/produto_76_silabas_cursivas/Silabario_Cursivas.pdf",
      arquivoNome: "Silabario-Cursivas-Oficial.pdf",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-['Inter',sans-serif]">
      {/* Header Alfacademi Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            to="/download-produtos"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>Ver todos os meus produtos</span>
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="/colorindo-silabas/logo-colorindo-v2.jpg"
              alt="Logo Mundo da Alfabetização"
              className="h-9 w-auto rounded-lg object-contain shadow-sm"
            />
            <span className="hidden sm:inline-block font-extrabold text-sm text-gray-900">
              Mundo da Alfabetização
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Banner Parabéns */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Order Bump Desbloqueado com Sucesso</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Colorindo com as Sílabas Cursivas
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100 max-w-2xl leading-relaxed">
            Seu pacote exclusivo de 44 páginas em PDF em alta resolução está pronto para download.
            Prepare a coordenação motora e o traçado elegante do seu pequeno para a letra cursiva!
          </p>
        </div>

        {/* Card do Produto com Capa e Arquivos */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center border-b border-gray-100">
            <div className="w-40 sm:w-48 aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-md flex-shrink-0 flex items-center justify-center p-2">
              <img
                src="/colorindo-silabas/covers/capa-silabas-cursivas.jpg"
                alt="Capa Colorindo com as Sílabas Cursivas"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kit Completo: 2 Arquivos em PDF</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Caderno de Atividades + Silabário Cursivo
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                Material com traçado progressivo, famílias silábicas completas em letra cursiva, figuras ilustradas para colorir e treinos práticos de caligrafia infantil.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start text-xs text-gray-500 font-medium">
                <span className="bg-gray-100 px-3 py-1 rounded-lg">📄 44 Páginas no Total</span>
                <span className="bg-gray-100 px-3 py-1 rounded-lg">💾 13.2 MB em Alta Definição</span>
                <span className="bg-gray-100 px-3 py-1 rounded-lg">♾️ Acesso Vitalício</span>
              </div>
            </div>
          </div>

          {/* Lista de Arquivos */}
          <div className="p-6 sm:p-8 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Arquivos Disponíveis para Download</span>
            </h3>

            <div className="space-y-4">
              {arquivosCursivas.map((arq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      PDF
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                        {arq.nome}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{arq.paginas}</span>
                        <span>•</span>
                        <span>{arq.tamanho}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={arq.url}
                    download={arq.arquivoNome}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Arquivo</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão de Navegação para a Área Geral */}
        <div className="text-center">
          <Link
            to="/download-produtos"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-3 px-6 rounded-xl transition-all shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>Acessar Meu Acervo Completo (Sílabas Simples + Todos os Bônus)</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
