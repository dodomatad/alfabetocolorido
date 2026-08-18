import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => {
    // Redireciona para o dashboard
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  },
});
