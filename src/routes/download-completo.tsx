import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Download,
  CheckCircle2,
  BookOpen,
  Search,
  ArrowLeft,
  ShieldCheck,
  Star,
  FileText,
  Play,
  Sparkles
} from "lucide-react";
import { useFavicon } from "@/hooks/use-favicon";

export const Route = createFileRoute("/download-completo")({
  head: () => ({
    meta: [
      { title: "Acervo Completo VIP · Mundo da Alfabetização" },
      {
        name: "description",
        content: "Acesse e baixe todos os seus cadernos em PDF incluindo Colorindo as Sílabas Cursivas.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/colorindo-silabas/favicon-colorindo-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/colorindo-silabas/favicon-colorindo-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/colorindo-silabas/favicon-colorindo-180.png" },
    ],
  }),
  component: PaginaDownloadCompleto,
});

interface ArquivoItem {
  nome: string;
  tamanho: string;
  url: string;
  arquivoNome: string;
}

interface ProdutoItem {
  id: string;
  titulo: string;
  subtitulo: string;
  categoria: string;
  numArquivos: number;
  totalPaginas: string;
  capa: string;
  arquivos: ArquivoItem[];
}

export default function PaginaDownloadCompleto() {
  useFavicon(
    "/colorindo-silabas/favicon-colorindo-32.png",
    "/colorindo-silabas/favicon-colorindo-180.png"
  );

  const [busca, setBusca] = useState("");
  const [produtoAtivo, setProdutoAtivo] = useState<ProdutoItem | null>(null);

  // Lista com TODOS OS 5 PRODUTOS 100% LIBERADOS (Para quem comprou com Order Bump)
  const produtos: ProdutoItem[] = [
    {
      id: "silabas-simples",
      titulo: "Colorindo as Sílabas Simples",
      subtitulo: "Kit Principal Oficial · 3 Arquivos em PDF",
      categoria: "Alfabetização 1° Ano",
      numArquivos: 3,
      totalPaginas: "40 Páginas A4",
      capa: "/colorindo-silabas/covers/capa-silabas-simples.jpg",
      arquivos: [
        {
          nome: "01-B-BA-BE-BI-BO-BU-para-colorir.pdf",
          tamanho: "3.0 MB",
          url: "/colorindo-silabas/originais/produto_59_silabas_simples/01-B-BA-BE-BI-BO-BU-para-colorir.pdf",
          arquivoNome: "01-Colorindo-Silabas-Para-Colorir.pdf",
        },
        {
          nome: "01-B-BA-BE-BI-BO-BU-colorido.pdf",
          tamanho: "2.9 MB",
          url: "/colorindo-silabas/originais/produto_59_silabas_simples/01-B-BA-BE-BI-BO-BU-colorido.pdf",
          arquivoNome: "01-Colorindo-Silabas-Colorido.pdf",
        },
        {
          nome: "Silabario-Ilustrado.pdf",
          tamanho: "2.9 MB",
          url: "/colorindo-silabas/originais/produto_59_silabas_simples/Silabario.pdf",
          arquivoNome: "Silabario-Ilustrado.pdf",
        },
      ],
    },
    {
      id: "silabas-cursivas",
      titulo: "Colorindo com as Sílabas Cursivas",
      subtitulo: "Order Bump Desbloqueado · 2 Arquivos em PDF (44 Páginas)",
      categoria: "Caligrafia & Cursivas",
      numArquivos: 2,
      totalPaginas: "44 Páginas A4",
      capa: "/colorindo-silabas/covers/capa-silabas-cursivas.jpg",
      arquivos: [
        {
          nome: "Colorindo_Silabas_Cursivas.pdf (Caderno Oficial)",
          tamanho: "6.2 MB",
          url: "/colorindo-silabas/originais/produto_76_silabas_cursivas/Colorindo_Silabas_Cursivas.pdf",
          arquivoNome: "Colorindo-Silabas-Cursivas-22Pags.pdf",
        },
        {
          nome: "Silabario_Cursivas.pdf (Silabário Ilustrado Cursivo)",
          tamanho: "7.0 MB",
          url: "/colorindo-silabas/originais/produto_76_silabas_cursivas/Silabario_Cursivas.pdf",
          arquivoNome: "Silabario-Cursivo-22Pags.pdf",
        },
      ],
    },
    {
      id: "portugues-1ano",
      titulo: "Português 1° Ano",
      subtitulo: "Apostila Master + 2 Bônus · 136 Páginas em PDF",
      categoria: "Língua Portuguesa",
      numArquivos: 3,
      totalPaginas: "136 Páginas A4",
      capa: "/colorindo-silabas/covers/capa-portugues-1ano.jpg",
      arquivos: [
        {
          nome: "1_Portugues_1o_ano.pdf (Apostila Principal)",
          tamanho: "11.4 MB",
          url: "/colorindo-silabas/originais/produto_57_portugues/1_Portugues_1o_ano.pdf",
          arquivoNome: "Apostila-Master-Portugues-1Ano.pdf",
        },
        {
          nome: "2_Bonus_Recorte_e_cole.pdf",
          tamanho: "1.8 MB",
          url: "/colorindo-silabas/originais/produto_57_portugues/2_Bonus_Recorte_e_cole.pdf",
          arquivoNome: "Bonus-Recorte-e-Cole-1Ano.pdf",
        },
        {
          nome: "3_Bonus_Silabario.pdf",
          tamanho: "2.9 MB",
          url: "/colorindo-silabas/originais/produto_57_portugues/3_Bonus_Silabario.pdf",
          arquivoNome: "Bonus-Silabario-Portugues.pdf",
        },
      ],
    },
    {
      id: "matematica-1ano",
      titulo: "Matemática 1° Ano",
      subtitulo: "Kit Completo de Matemática · 276 Páginas em PDF",
      categoria: "Matemática & Raciocínio",
      numArquivos: 7,
      totalPaginas: "276 Páginas A4",
      capa: "/colorindo-silabas/covers/capa-matematica-1ano.jpg",
      arquivos: [
        {
          nome: "1_Matematica_1oAno.pdf",
          tamanho: "10.6 MB",
          url: "/colorindo-silabas/originais/produto_33_matematica/1_Matematica_1oAno.pdf",
          arquivoNome: "Caderno-Matematica-1Ano.pdf",
        },
        {
          nome: "2_Conhecendo_os_Numeros_e_Sinais.pdf",
          tamanho: "4.3 MB",
          url: "/colorindo-silabas/originais/produto_33_matematica/2_Conhecendo_os_Numeros_e_Sinais.pdf",
          arquivoNome: "Numeros-e-Sinais-1Ano.pdf",
        },
        {
          nome: "3_Adicao_e_Subtracao_Situacoes_problema.pdf",
          tamanho: "6.0 MB",
          url: "/colorindo-silabas/originais/produto_33_matematica/3_Ano_Adicao_e_Subtracao_Situacoes_problema.pdf",
          arquivoNome: "Adicao-Subtracao-Problemas-1Ano.pdf",
        },
        {
          nome: "Bonus1_Mural_da_Tabuada.pdf",
          tamanho: "3.4 MB",
          url: "/colorindo-silabas/originais/produto_33_matematica/Bonus1_Mural_da_Tabuada.pdf",
          arquivoNome: "Mural-da-Tabuada.pdf",
        },
        {
          nome: "Bonus2_Antes_Entre_e_Depois.pdf",
          tamanho: "3.4 MB",
          url: "/colorindo-silabas/originais/produto_33_matematica/Bonus2_Antes_Entre_e_Depois.pdf",
          arquivoNome: "Antes-Entre-Depois.pdf",
        },
        {
          nome: "Bonus3_Contando_para_tras.pdf",
          tamanho: "6.1 MB",
          url: "/colorindo-silabas/originais/produto_33_matematica/Bonus3_Contando_para_tras.pdf",
          arquivoNome: "Contando-para-tras.pdf",
        },
        {
          nome: "Bonus4_Atividades_de_dinossauros.pdf",
          tamanho: "5.4 MB",
          url: "/colorindo-silabas/originais/produto_33_matematica/Bonus4_Atividades_de_dinossauros.pdf",
          arquivoNome: "Atividades-Dinossauros-1Ano.pdf",
        },
      ],
    },
    {
      id: "folclore-1ano",
      titulo: "Folclore 1° Ano",
      subtitulo: "Caderno Temático Folclore Brasileiro · 41 Páginas",
      categoria: "Cultura & Alfabetização",
      numArquivos: 1,
      totalPaginas: "41 Páginas A4",
      capa: "/colorindo-silabas/covers/capa-folclore-1ano.jpg",
      arquivos: [
        {
          nome: "Folclore_1oAno.pdf",
          tamanho: "6.2 MB",
          url: "/colorindo-silabas/originais/produto_58_folclore/Folclore_1oAno.pdf",
          arquivoNome: "Caderno-Folclore-1Ano.pdf",
        },
      ],
    },
  ];

  const filtrados = produtos.filter(
    (p) =>
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      p.subtitulo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-['Inter',sans-serif]">
      {/* Topbar Alfacademi Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/colorindo-silabas/logo-colorindo-v2.jpg"
              alt="Logo Mundo da Alfabetização"
              className="h-9 w-auto rounded-lg object-contain shadow-xs"
            />
            <span className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight">
              Mundo da Alfabetização
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Pacote Completo VIP
            </span>
            <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-300">
              LT
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        {/* SE UM PRODUTO ESTIVER SELECIONADO: TELA DETALHADA COM LISTA DE ARQUIVOS */}
        {produtoAtivo ? (
          <div>
            {/* Botão Voltar */}
            <button
              onClick={() => setProdutoAtivo(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              <span>← Voltar para meus produtos</span>
            </button>

            {/* Cabeçalho do Produto */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 mb-8 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div className="w-36 sm:w-44 aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 p-2 flex items-center justify-center">
                <img
                  src={produtoAtivo.capa}
                  alt={produtoAtivo.titulo}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                  {produtoAtivo.categoria}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {produtoAtivo.titulo}
                </h1>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {produtoAtivo.subtitulo} · {produtoAtivo.totalPaginas}
                </p>
                <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    {produtoAtivo.numArquivos} arquivos disponíveis
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de Arquivos para Download dos Produtos Liberados */}
            <div className="space-y-4 mb-12">
              <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Arquivos disponíveis para download imediato</span>
              </h2>

              {produtoAtivo.arquivos.map((arq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 flex-shrink-0">
                      PDF
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                        {arq.nome}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium">
                        Tamanho: {arq.tamanho} · Formato A4 pronto para imprimir
                      </span>
                    </div>
                  </div>

                  <a
                    href={arq.url}
                    download={arq.arquivoNome}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar arquivo</span>
                  </a>
                </div>
              ))}
            </div>

            {/* Avaliação & Suporte */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Avaliação do “{produtoAtivo.titulo}”
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Qual a probabilidade de você recomendar este material pedagógico?
              </p>
              <div className="flex gap-1 mb-6 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Comentários Verificados
                  </span>
                  <span className="text-xs text-gray-400">100% dos pais aprovaram</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                    <p className="font-bold text-gray-800">Jaqueline Henriques de Souza</p>
                    <p className="text-gray-600 mt-1">Material excelente e de fácil acesso! Amei ❤️</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                    <p className="font-bold text-gray-800">Bruna Xavier Pereira</p>
                    <p className="text-gray-600 mt-1">Muito obrigada, um ótimo e útil arquivo! Recomendo para todas as mães. ☺️</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SE NENHUM PRODUTO ESTIVER SELECIONADO: GRADE GERAL COM TODOS OS 5 PRODUTOS LIBERADOS */
          <div>
            {/* Hero Section */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Acervo Completo VIP Liberado
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Meus produtos
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Todos os seus 5 materiais (incluindo Sílabas Cursivas) estão disponíveis abaixo.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 self-start md:self-auto">
                <strong className="text-xl font-black text-emerald-700">5</strong>
                <span className="text-xs font-semibold text-emerald-900">produtos liberados</span>
              </div>
            </div>

            {/* Product Search */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Encontre um produto..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrados.map((produto) => (
                <article
                  key={produto.id}
                  className="bg-white rounded-3xl border border-gray-200 hover:border-emerald-300 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cover */}
                    <div className="relative aspect-[4/3] bg-gray-50 border-b border-gray-100 flex items-center justify-center p-3 overflow-hidden">
                      <img
                        src={produto.capa}
                        alt={produto.titulo}
                        className="w-full h-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                        {produto.numArquivos} Arquivos
                      </span>
                    </div>

                    {/* Title & Info */}
                    <div className="p-5">
                      <h2 className="text-lg font-bold text-gray-900 leading-snug">
                        {produto.titulo}
                      </h2>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {produto.subtitulo}
                      </p>
                    </div>
                  </div>

                  {/* Action Button: Acessar */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setProdutoAtivo(produto)}
                      className="w-full bg-[#1FB826] hover:bg-[#1caa23] active:translate-y-0.5 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Acessar</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Footer Support Strip */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Precisa de Ajuda com a Impressão?</h4>
              <p className="text-xs text-gray-500">
                Os arquivos são compatíveis com qualquer impressora colorida ou preto e branco (formato A4).
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">© 2026 Mundo da Alfabetização · Todos os direitos reservados</p>
        </div>
      </main>
    </div>
  );
}
