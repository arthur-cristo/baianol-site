import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  compilar,
  executarCapturando,
  tokenizar,
  ErroBaianol,
  LEXEMAS,
  type Token,
} from "baianol";
import { cores, FitasBonfim } from "./tema";

import ola from "baianol/exemplos/01_ola_bahia.oxe?raw";
import primos from "baianol/exemplos/02_primos.oxe?raw";
import conta from "baianol/exemplos/03_conta_bancaria.oxe?raw";
import cardapio from "baianol/exemplos/04_cardapio.oxe?raw";
import erro1 from "baianol/exemplos/erros/erro1_sem_valor.oxe?raw";
import erro2 from "baianol/exemplos/erros/erro2_dois_comandos_na_linha.oxe?raw";
import erro3 from "baianol/exemplos/erros/erro3_sintaxe_js.oxe?raw";
import erro4 from "baianol/exemplos/erros/erro4_bloco_aberto.oxe?raw";
import erro5 from "baianol/exemplos/erros/erro5_ponto_e_virgula.oxe?raw";

const mono = "'JetBrains Mono', 'Fira Code', monospace";

/* ───────── dados ───────── */

interface Exemplo {
  arquivo: string;
  titulo: string;
  descricao: string;
  fonte: string;
  cor: string;
}

const exemplos: Exemplo[] = [
  {
    arquivo: "01_ola_bahia.oxe",
    titulo: "Olá, Bahia",
    descricao: "Saudação, variáveis, função, condicional e laço.",
    fonte: ola,
    cor: cores.rosa,
  },
  {
    arquivo: "02_primos.oxe",
    titulo: "Números primos",
    descricao: "corropio (while), siga_certo (continue) e borimbora (break).",
    fonte: primos,
    cor: cores.amarelo,
  },
  {
    arquivo: "03_conta_bancaria.oxe",
    titulo: "Conta bancária",
    descricao: "Classes, herança, tratamento de erros e JSON (enrolar / desapartar).",
    fonte: conta,
    cor: cores.azul,
  },
  {
    arquivo: "04_cardapio.oxe",
    titulo: "Cardápio (JSON)",
    descricao: "Subdialeto JSON: chaves sem aspas, aspas simples, comentários e massa/aonde/vazio.",
    fonte: cardapio,
    cor: cores.verde,
  },
];

const exemplosErro: Exemplo[] = [
  { arquivo: "erro1_sem_valor.oxe", titulo: "por_vida sem valor", descricao: "Constante declarada sem valor inicial.", fonte: erro1, cor: cores.rosa },
  { arquivo: "erro2_dois_comandos_na_linha.oxe", titulo: "Dois comandos na linha", descricao: "O comando termina na quebra de linha.", fonte: erro2, cor: cores.laranja },
  { arquivo: "erro3_sintaxe_js.oxe", titulo: "Sintaxe de JavaScript", descricao: "console.log e ; não existem em baianol#.", fonte: erro3, cor: cores.lilas },
  { arquivo: "erro4_bloco_aberto.oxe", titulo: "Bloco aberto", descricao: "Um { que nunca foi fechado.", fonte: erro4, cor: cores.azul },
  { arquivo: "erro5_ponto_e_virgula.oxe", titulo: "Ponto e vírgula", descricao: "O ; solto gera erro.", fonte: erro5, cor: cores.amarelo },
];

/* ───────── colorização dos tokens ───────── */

type Classe =
  | "reservada"
  | "identificador"
  | "funcao"
  | "propriedade"
  | "numero"
  | "texto"
  | "operador"
  | "pontuacao"
  | "comentario"
  | "espaco";

interface Parte {
  valor: string;
  classe: Classe;
  categoria?: string;
}

// palavras reservadas: fundo pastel por categoria (igual ao destaque do Home)
const fundoCategoria: Record<string, string> = {
  Declaração: cores.rosa,
  Controle: cores.amarelo,
  Erros: cores.laranja,
  Valor: cores.verde,
  Operador: cores.azul,
  "E/S": cores.lilas,
  JSON: cores.lilas,
  Envelope: cores.begeEscuro,
};

// demais tokens: tons mais fortes da paleta, para ler bem no fundo claro
const corTexto: Partial<Record<Classe, string>> = {
  identificador: "#C03A52", // vermelho
  funcao: "#7050B0", // lilás
  propriedade: "#B85C14", // laranja
  numero: "#9A6A00", // âmbar
  texto: "#3F7A2B", // verde
  operador: "#2B78A0", // azul
  comentario: "#9B8A78", // cinza-bege
  pontuacao: cores.marrom,
};

const ehLexema = (v: string) => Object.prototype.hasOwnProperty.call(LEXEMAS, v);

function classificar(fonte: string): Parte[] {
  let tokens: Token[];
  try {
    tokens = tokenizar(fonte);
  } catch {
    return [{ valor: fonte, classe: "espaco" }];
  }

  const sig = tokens.filter((t) => t.tipo !== "ESPACO" && t.tipo !== "COMENTARIO");
  const indice = new Map(sig.map((t, i) => [t, i] as const));

  return tokens.map((t): Parte => {
    switch (t.tipo) {
      case "ESPACO":
        return { valor: t.valor, classe: "espaco" };
      case "COMENTARIO":
        return { valor: t.valor, classe: "comentario" };
      case "NUMERO":
        return { valor: t.valor, classe: "numero" };
      case "TEXTO":
      case "TEMPLATE":
        return { valor: t.valor, classe: "texto" };
      case "OPERADOR":
        return { valor: t.valor, classe: "operador" };
      case "PONTUACAO":
        return { valor: t.valor, classe: "pontuacao" };
      case "PALAVRA": {
        const i = indice.get(t) ?? 0;
        const ant = sig[i - 1];
        const prox = sig[i + 1];
        // obj.massa -> propriedade, não palavra reservada
        if (ant && (ant.valor === "." || ant.valor === "?.")) return { valor: t.valor, classe: "propriedade" };
        // { chave: valor }
        if (prox?.valor === ":" && ant && (ant.valor === "{" || ant.valor === ",")) {
          return { valor: t.valor, classe: "propriedade" };
        }
        if (t.valor === "colé" || t.valor === "tá_ligado") {
          return { valor: t.valor, classe: "reservada", categoria: "Envelope" };
        }
        if (ehLexema(t.valor)) {
          return { valor: t.valor, classe: "reservada", categoria: LEXEMAS[t.valor].categoria };
        }
        if (prox?.valor === "(") return { valor: t.valor, classe: "funcao" };
        return { valor: t.valor, classe: "identificador" };
      }
    }
  });
}

function estiloDe(p: Parte): CSSProperties {
  if (p.classe === "reservada") {
    return {
      background: fundoCategoria[p.categoria ?? ""] ?? cores.amarelo,
      borderRadius: 4,
      padding: "0 3px",
      fontWeight: 700,
    };
  }
  if (p.classe === "espaco") return {};
  return {
    color: corTexto[p.classe],
    fontStyle: p.classe === "comentario" ? "italic" : undefined,
    fontWeight: p.classe === "operador" ? 600 : undefined,
  };
}

function CodigoColorido({ fonte }: { fonte: string }) {
  const partes = useMemo(() => classificar(fonte), [fonte]);
  return (
    <Box
      as="pre"
      m={0}
      p={{ base: 4, md: 6 }}
      h="100%"
      bg="#FFFBF2"
      fontFamily={mono}
      fontSize={{ base: "xs", md: "sm" }}
      lineHeight="1.7"
      color={cores.marrom}
      overflowX="auto"
      userSelect="text"
    >
      <code>
        {partes.map((p, i) => (
          <span key={i} style={estiloDe(p)}>
            {p.valor}
          </span>
        ))}
      </code>
    </Box>
  );
}

/* ───────── execução ───────── */

type Saida =
  | { ok: true; linhas: string[]; gerado?: string }
  | { ok: false; texto: string };

function rodar(arquivo: string, fonte: string): Saida {
  try {
    const r = compilar(fonte);
    if (r.tipo === "json") return { ok: true, linhas: r.codigo.trimEnd().split("\n") };
    return { ok: true, linhas: executarCapturando(r.codigo), gerado: r.codigo };
  } catch (e) {
    if (e instanceof ErroBaianol) return { ok: false, texto: e.formatar(arquivo, fonte) };
    return { ok: false, texto: `Erro em execução: ${(e as Error).message}` };
  }
}

function Aba({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Box
      as="button"
      onClick={onClick}
      px={3}
      py={0.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight="700"
      bg={ativa ? cores.amarelo : "transparent"}
      color={ativa ? cores.marrom : cores.bege}
      border="1px solid"
      borderColor={ativa ? cores.amarelo : "whiteAlpha.400"}
      cursor="pointer"
    >
      {children}
    </Box>
  );
}

function Terminal({ arquivo, saida }: { arquivo: string; saida: Saida | null }) {
  const [aba, setAba] = useState<"saida" | "js">("saida");
  const temJs = !!saida && saida.ok && !!saida.gerado;

  return (
    <Box
      h="100%"
      minH="220px"
      p={{ base: 4, md: 5 }}
      bg={cores.marrom}
      color={cores.bege}
      fontFamily={mono}
      fontSize={{ base: "xs", md: "sm" }}
      lineHeight="1.7"
      overflow="auto"
      userSelect="text"
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={2} mb={3}>
        <Text color={cores.amarelo} fontWeight="700">
          $ baianol {arquivo}
        </Text>
        {temJs && (
          <Flex gap={1}>
            <Aba ativa={aba === "saida"} onClick={() => setAba("saida")}>
              Saída
            </Aba>
            <Aba ativa={aba === "js"} onClick={() => setAba("js")}>
              JavaScript
            </Aba>
          </Flex>
        )}
      </Flex>

      {!saida && <Text opacity={0.6}>Aperte ▶ Rodar para ver a saída.</Text>}

      {saida && !saida.ok && (
        <Box as="pre" m={0} color={cores.rosa} whiteSpace="pre-wrap">
          {saida.texto}
        </Box>
      )}

      {saida && saida.ok && (
        <Box as="pre" m={0} whiteSpace="pre-wrap">
          {aba === "js" && saida.gerado
            ? saida.gerado
            : saida.linhas.length
              ? saida.linhas.join("\n")
              : "(sem saída)"}
        </Box>
      )}
    </Box>
  );
}

/* ───────── cartão ───────── */

function CartaoExemplo({ ex }: { ex: Exemplo }) {
  const [saida, setSaida] = useState<Saida | null>(null);

  return (
    <Box
      border="3px solid"
      borderColor={cores.marrom}
      borderRadius="24px"
      bg="#FFFBF2"
      boxShadow={`8px 8px 0 ${ex.cor}`}
      overflow="hidden"
    >
      <Flex
        bg={ex.cor}
        borderBottom="3px solid"
        borderColor={cores.marrom}
        px={{ base: 4, md: 6 }}
        py={4}
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading as="h3" fontSize="xl">
            {ex.titulo}
          </Heading>
          <Text fontFamily={mono} fontSize="xs" opacity={0.7}>
            {ex.arquivo}
          </Text>
          <Text fontSize="sm" mt={1}>
            {ex.descricao}
          </Text>
        </Box>
        <Button
          bg={cores.verde}
          color={cores.marrom}
          border="3px solid"
          borderColor={cores.marrom}
          borderRadius="14px"
          boxShadow={`4px 4px 0 ${cores.marrom}`}
          _hover={{ transform: "translate(2px, 2px)", boxShadow: `2px 2px 0 ${cores.marrom}` }}
          onClick={() => setSaida(rodar(ex.arquivo, ex.fonte))}
        >
          ▶ Rodar
        </Button>
      </Flex>

      <Flex direction={{ base: "column", lg: "row" }}>
        <Box flex="1.2" minW={0}>
          <CodigoColorido fonte={ex.fonte} />
        </Box>
        <Box
          flex="1"
          minW={0}
          borderTop={{ base: "3px solid", lg: "none" }}
          borderLeft={{ base: "none", lg: "3px solid" }}
          borderColor={cores.marrom}
        >
          <Terminal arquivo={ex.arquivo} saida={saida} />
        </Box>
      </Flex>
    </Box>
  );
}

/* ───────── legenda ───────── */

const legendaChips: [string, string][] = [
  ["Declaração", cores.rosa],
  ["Controle", cores.amarelo],
  ["Erros", cores.laranja],
  ["Valor", cores.verde],
  ["Operador (palavra)", cores.azul],
  ["E/S e JSON", cores.lilas],
];

const legendaTexto: [string, Classe][] = [
  ["identificador", "identificador"],
  ["função", "funcao"],
  ["propriedade", "propriedade"],
  ["número", "numero"],
  ["texto", "texto"],
  ["operador", "operador"],
  ["comentário", "comentario"],
];

function Legenda() {
  return (
    <Flex
      mt={8}
      p={4}
      gap={x(3)}
      wrap="wrap"
      bg="#FFFBF2"
      border="3px solid"
      borderColor={cores.marrom}
      borderRadius="20px"
      fontFamily={mono}
      fontSize="xs"
    >
      {legendaChips.map(([nome, fundo]) => (
        <span key={nome} style={{ background: fundo, borderRadius: 4, padding: "0 6px", fontWeight: 700 }}>
          {nome}
        </span>
      ))}
      {legendaTexto.map(([nome, classe]) => (
        <span key={nome} style={{ color: corTexto[classe], fontWeight: 700 }}>
          {nome}
        </span>
      ))}
    </Flex>
  );
}

// pequeno helper só para manter o gap legível
function x(n: number) {
  return n;
}

/* ───────── página ───────── */

export default function Exemplos() {
  const navigate = useNavigate();

  return (
    <Box bg={cores.bege} color={cores.marrom} minH="100vh">
      <FitasBonfim />

      <Box as="header" maxW="1100px" mx="auto" px={{ base: 5, md: 8 }} pt={{ base: 8, md: 12 }} pb={{ base: 6, md: 8 }}>
        <Button
          size="sm"
          bg={cores.azul}
          color={cores.marrom}
          border="3px solid"
          borderColor={cores.marrom}
          borderRadius="14px"
          boxShadow={`3px 3px 0 ${cores.marrom}`}
          _hover={{ transform: "translate(2px, 2px)", boxShadow: `1px 1px 0 ${cores.marrom}` }}
          onClick={() => navigate("/")}
        >
          ← Início
        </Button>

        <Heading as="h1" mt={6} fontSize={{ base: "4xl", md: "6xl" }} lineHeight="1">
          Exemplos
        </Heading>
        <Text mt={4} fontSize={{ base: "lg", md: "xl" }} maxW="640px" lineHeight="1.6">
          Programas <b>.oxe</b> que vêm junto com o baianol. Aperte ▶ Rodar e o transpilador compila e executa aqui mesmo, no navegador.
        </Text>

        <Legenda />
      </Box>

      <Box maxW="1100px" mx="auto" px={{ base: 5, md: 8 }} pb={{ base: 10, md: 16 }}>
        <Flex direction="column" gap={10}>
          {exemplos.map((ex) => (
            <CartaoExemplo key={ex.arquivo} ex={ex} />
          ))}
        </Flex>
      </Box>

      <Box bg={cores.begeEscuro} borderY="3px solid" borderColor={cores.marrom}>
        <Box maxW="1100px" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 10, md: 16 }}>
          <Heading as="h2" fontSize={{ base: "2xl", md: "4xl" }} mb={2}>
            Erros de propósito
          </Heading>
          <Text fontSize="lg" opacity={0.75} mb={8} maxW="640px">
            O parser para no primeiro erro e mostra arquivo, linha, coluna e o trecho.
          </Text>
          <Flex direction="column" gap={10}>
            {exemplosErro.map((ex) => (
              <CartaoExemplo key={ex.arquivo} ex={ex} />
            ))}
          </Flex>
        </Box>
      </Box>

      <FitasBonfim />
    </Box>
  );
}