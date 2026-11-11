import { compilar, executarCapturando, ErroBaianol } from "baianol";

export interface Pedido {
  id: number;
  fonte: string;
  arquivo: string;
}

export type Resposta =
  | { id: number; ok: true; linhas: string[]; gerado?: string }
  | { id: number; ok: false; texto: string; linha?: number };

self.onmessage = (e: MessageEvent<Pedido>) => {
  const { id, fonte, arquivo } = e.data;
  try {
    const r = compilar(fonte);
    if (r.tipo === "json") {
      postMessage({ id, ok: true, linhas: r.codigo.trimEnd().split("\n") } satisfies Resposta);
      return;
    }
    const linhas = executarCapturando(r.codigo);
    postMessage({ id, ok: true, linhas, gerado: r.codigo } satisfies Resposta);
  } catch (err) {
    if (err instanceof ErroBaianol) {
      postMessage({ id, ok: false, texto: err.formatar(arquivo, fonte), linha: err.linha ?? undefined } satisfies Resposta);
    } else {
      postMessage({ id, ok: false, texto: `Erro em execução: ${(err as Error).message}` } satisfies Resposta);
    }
  }
};