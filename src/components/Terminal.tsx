import { useState, type ReactNode } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { cores } from "./tema";
import { mono } from "./realce";

export type Saida =
  | { ok: true; linhas: string[]; gerado?: string }
  | { ok: false; texto: string };

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

interface Props {
  arquivo: string;
  saida: Saida | null;
  rodando?: boolean;
  altura?: string;
}

export function Terminal({ arquivo, saida, rodando = false, altura }: Props) {
  const [aba, setAba] = useState<"saida" | "js">("saida");
  const temJs = !!saida && saida.ok && !!saida.gerado;

  return (
    <Box
      h={altura ?? "100%"}
      minH={altura ? undefined : "220px"}
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

      {rodando && <Text opacity={0.7}>Rodando…</Text>}
      {!rodando && !saida && <Text opacity={0.6}>Aperte ▶ Rodar para ver a saída.</Text>}

      {!rodando && saida && !saida.ok && (
        <Box as="pre" m={0} color={cores.rosa} whiteSpace="pre-wrap">
          {saida.texto}
        </Box>
      )}

      {!rodando && saida && saida.ok && (
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