import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ProvedorSessao } from "@/hooks/use-sessao";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/colorindo-as-silabas-v2"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para Colorindo as Sílabas
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente atualizar a página ou voltar para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/colorindo-as-silabas-v2"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Colorindo as Sílabas Simples – 1° Ano" },
      {
        name: "description",
        content:
          "Transforme o aprendizado das sílabas em uma brincadeira divertida de pintura por código que ajuda a criança a avançar na leitura e na escrita.",
      },
      { name: "author", content: "Colorindo as Sílabas" },
      { property: "og:title", content: "Colorindo as Sílabas Simples – 1° Ano" },
      {
        property: "og:description",
        content: "40 atividades prontas, lúdicas e organizadas para o 1° Ano + Bônus Exclusivos em PDF.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/colorindo-silabas/logo-colorindo-v2.jpg" },
      { name: "twitter:image", content: "/colorindo-silabas/logo-colorindo-v2.jpg" },
      { name: "theme-color", content: "#FF6799" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/colorindo-silabas/favicon-colorindo-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/colorindo-silabas/favicon-colorindo-192.png" },
      { rel: "shortcut icon", href: "/colorindo-silabas/favicon-colorindo-32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/colorindo-silabas/favicon-colorindo-180.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {/* Tracker oficial da Cakto: contagem de visitas e persistência de UTMs */}
        <script src="https://api.cakto.com.br/api/product/checkout/tracker.js" async></script>
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ProvedorSessao>
        <Outlet />
      </ProvedorSessao>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
