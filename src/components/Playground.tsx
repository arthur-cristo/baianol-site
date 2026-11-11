import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { cores, FitasBonfim } from "./tema";
import { mono } from "./realce";
import { Terminal, type Saida } from "./Terminal";
import Editor from "./Editor";
import type { Pedido, Resposta } from "./baianol.worker";

import ola from "baianol/exemplos/01_ola_bahia.oxe?raw";
import primos from "baianol/exemplos/02_primos.oxe?raw";
import conta from "baianol/exemplos/03_conta_bancaria.oxe?raw";
import cardapio from "baianol/exemplos/04_cardapio.oxe?raw";

const LIMITE_MS = 3000;

const inicial = `colé

// Escreva seu código e aperte Ctrl+Enter
por_vida nome = "meu rei"

trocar_ideias("Colé,", nome)

tá_ligado
`;

const modelos = [
  { nome: "Olá, Bahia", fonte: ola, cor: cores.rosa },
  { nome: "Primos", fonte: primos, cor: cores.amarelo },
  { nome: "Conta bancária", fonte: conta, cor: cores.azul },
  { nome: "Cardápio (JSON)", fonte: cardapio, cor: cores.verde },
];

const atalhos: [string, string][] = [
  ["Ctrl+Enter", "roda"],
  ["Ctrl+Espaço", "sugestões"],
  ["Tab / Shift+Tab", "indenta / recua"],
];

const estiloBotao = (bg: string) => ({
  bg,
  color: cores.marrom,
  border: "3px solid",
  borderColor: cores.marrom,
  borderRadius: "14px",
  boxShadow: `4px 4px 0 ${cores.marrom}`,
  _hover: { transform: "translate(2px, 2px)", boxShadow: `2px 2px 0 ${cores.marrom}` },
});

export default function Playground() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState(inicial);
  const [saida, setSaida] = useState<Saida | null>(null);
  const [rodando, setRodando] = useState(false);
  const [linhaErro, setLinhaErro] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);

  const novoWorker = useCallback(() => {
    workerRef.current?.terminate();
    const w = new Worker(new URL("./baianol.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<Resposta>) => {
      if (e.data.id !== idRef.current) return;
      window.clearTimeout(timerRef.current);
      setRodando(false);
      if (e.data.ok) {
        setSaida({ ok: true, linhas: e.data.linhas, gerado: e.data.gerado });
        setLinhaErro(null);
      } else {
        setSaida({ ok: false, texto: e.data.texto });
        setLinhaErro(e.data.linha ?? null);
      }
    };
    workerRef.current = w;
  }, []);

  useEffect(() => {
    novoWorker();
    return () => {
      workerRef.current?.terminate();
      window.clearTimeout(timerRef.current);
    };
  }, [novoWorker]);

  function executar() {
    if (rodando) return;
    const id = ++idRef.current;
    setRodando(true);
    workerRef.current?.postMessage({ id, fonte: codigo, arquivo: "playground.oxe" } satisfies Pedido);
    timerRef.current = window.setTimeout(() => {
      idRef.current++;
      novoWorker();
      setRodando(false);
      setSaida({
        ok: false,
        texto: `Ôxe! O programa passou de ${LIMITE_MS / 1000}s e foi interrompido. Tem algum laço sem fim (corropio sem borimbora)?`,
      });
    }, LIMITE_MS);
  }

  function parar() {
    window.clearTimeout(timerRef.current);
    idRef.current++;
    novoWorker();
    setRodando(false);
    setSaida({ ok: false, texto: "Execução interrompida." });
  }

  function carregar(fonte: string) {
    setCodigo(fonte);
    setSaida(null);
    setLinhaErro(null);
  }

  return (
    <Box bg={cores.bege} color={cores.marrom} minH="100vh">
      <FitasBonfim />

      <Box maxW="1100px" mx="auto" px={{ base: 5, md: 8 }} pt={{ base: 8, md: 12 }} pb={{ base: 10, md: 16 }}>
        <Button size="sm" {...estiloBotao(cores.azul)} boxShadow={`3px 3px 0 ${cores.marrom}`} onClick={() => navigate("/")}>
          ← Início
        </Button>

        <Heading as="h1" mt={6} fontSize={{ base: "4xl", md: "6xl" }} lineHeight="1">
          Playground
        </Heading>
        <Text mt={4} fontSize={{ base: "lg", md: "xl" }} maxW="640px" lineHeight="1.6">
          Escreva em <b>baianol#</b> e rode aqui mesmo.
        </Text>

        <Flex mt={6} gap={2} wrap="wrap" align="center">
          <Text fontWeight="700" fontSize="sm">
            Carregar:
          </Text>
          {modelos.map((m) => (
            <Button
              key={m.nome}
              size="xs"
              bg={m.cor}
              color={cores.marrom}
              border="2px solid"
              borderColor={cores.marrom}
              borderRadius="full"
              onClick={() => carregar(m.fonte)}
            >
              {m.nome}
            </Button>
          ))}
          <Button
            size="xs"
            bg="transparent"
            color={cores.marrom}
            border="2px solid"
            borderColor={cores.marrom}
            borderRadius="full"
            onClick={() => carregar("")}
          >
            Limpar
          </Button>
        </Flex>

        <Box
          mt={6}
          border="3px solid"
          borderColor={cores.marrom}
          borderRadius="24px"
          bg="#FFFBF2"
          boxShadow={`8px 8px 0 ${cores.lilas}`}
          overflow="hidden"
        >
          <Flex
            bg={cores.lilas}
            borderBottom="3px solid"
            borderColor={cores.marrom}
            px={{ base: 4, md: 6 }}
            py={3}
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={3}
          >
            <Text fontFamily={mono} fontSize="sm" fontWeight="700">
              playground.oxe
            </Text>
            {rodando ? (
              <Button {...estiloBotao(cores.rosa)} onClick={parar}>
                ■ Parar
              </Button>
            ) : (
              <Button {...estiloBotao(cores.verde)} onClick={executar}>
                ▶ Rodar
              </Button>
            )}
          </Flex>

          <Flex direction={{ base: "column", lg: "row" }}>
            <Box flex="1.2" minW={0}>
              <Editor
                valor={codigo}
                onChange={(v) => {
                  setCodigo(v);
                  setLinhaErro(null);
                }}
                onExecutar={executar}
                linhaErro={linhaErro}
                altura="480px"
              />
            </Box>
            <Box
              flex="1"
              minW={0}
              borderTop={{ base: "3px solid", lg: "none" }}
              borderLeft={{ base: "none", lg: "3px solid" }}
              borderColor={cores.marrom}
            >
              <Terminal arquivo="playground.oxe" saida={saida} rodando={rodando} altura="480px" />
            </Box>
          </Flex>
        </Box>

        <Flex mt={5} gap={4} wrap="wrap" fontSize="sm">
          {atalhos.map(([tecla, acao]) => (
            <Text key={tecla}>
              <Box
                as="kbd"
                px={2}
                py={0.5}
                mr={1}
                fontFamily={mono}
                fontSize="xs"
                bg="#FFFBF2"
                border="2px solid"
                borderColor={cores.marrom}
                borderRadius="8px"
              >
                {tecla}
              </Box>
              {acao}
            </Text>
          ))}
        </Flex>
      </Box>

      <FitasBonfim />
    </Box>
  );
}