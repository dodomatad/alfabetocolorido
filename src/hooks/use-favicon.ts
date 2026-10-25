import { useEffect } from "react";

/**
 * Força um favicon específico enquanto a página estiver montada.
 * Adiciona os <link rel="icon"> ao final do <head> (o navegador usa o último declarado)
 * e remove ao desmontar, restaurando o favicon padrão do sistema nas demais rotas.
 */
export function useFavicon(href: string, appleTouchHref?: string) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const criados: HTMLLinkElement[] = [];

    const adicionar = (rel: string, url: string, sizes?: string) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.type = "image/png";
      link.href = url;
      if (sizes) link.sizes.value = sizes;
      link.setAttribute("data-favicon-pagina", "true");
      document.head.appendChild(link);
      criados.push(link);
    };

    adicionar("icon", href);
    adicionar("shortcut icon", href);
    if (appleTouchHref) adicionar("apple-touch-icon", appleTouchHref, "180x180");

    return () => {
      criados.forEach((link) => link.remove());
    };
  }, [href, appleTouchHref]);
}
