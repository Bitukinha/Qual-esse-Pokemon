# Jogo da Memória

Trabalho 02 de Sistemas Operacionais. Jogo da memória por turnos para 2 jogadores em Node.js.

## Rodar

    npm install
    npm start

Ou abrir o `memoria-pokemon.exe` (precisa do Node.js instalado). O servidor tenta usar a porta 3000 e, se ela estiver ocupada, usa a próxima livre automaticamente. Depois abra o endereço que aparecer no console (normalmente `http://localhost:3000` ou `http://localhost:3001`) em duas abas, uma para cada jogador. Em outro computador da mesma rede, usar o IP que aparece no console.

As imagens vêm do repositório de sprites da PokeAPI, sem internet aparece só o nome.

Gerar o exe (abre o servidor com o Node.js do computador, sem instalar nada para compilar):

    C:WindowsMicrosoft.NETFramework644.0.30319c.exe /out:memoria-pokemon.exe launcherMemoriaPokemon.cs

Versão que já leva o Node junto (cerca de 57 MB): `npx @yao-pkg/pkg .`

## Regras

16 cartas, 8 pares. Na sua vez o jogador abre duas cartas. Se acertar, marca ponto e joga de novo. Se errar, passa a vez. Ganha quem tiver mais pares.

## Mensagens

`p` = jogador, `nn`/`mm` = carta (00-15), `kkk`/`qqq` = pokémon (001-151), `v` = jogador da vez.

Cliente para servidor:

| Mensagem | Significado |
|---|---|
| `pAnn` | abre a carta nn (`1A07`) |
| `pR` | pede nova partida |

Servidor para clientes:

| Mensagem | Significado |
|---|---|
| `Cp` | você é o jogador p |
| `X` | sala cheia |
| `Iv` | começou a partida, vez de v |
| `Tv` | a vez passou para v |
| `pAnnkkk` | p abriu nn, que é kkk |
| `pYnnmmkkk` | p acertou o par nn/mm |
| `pNnnmmkkkqqq` | p errou |
| `Ev` | fim de jogo, v ganhou (0 = empate) |
| `D` | adversário saiu |
| `!c` | recusada: 1 não é sua vez, 2 carta inválida, 3 sem partida, 4 mensagem inválida |

Exemplo:

    1A02          J1 abre a carta 02
    1A02128       servidor revela
    1A07          J1 abre a carta 07
    1N0207128030  errou
    T2            vez do J2

A variável `vez` existe no servidor (na memória compartilhada) e em cada navegador, e no navegador só muda ao receber `I` ou `T`. O navegador não conhece o tabuleiro, só o que o servidor revela.

## Memória compartilhada

O estado fica em um `SharedArrayBuffer` usado pela thread principal e por uma thread de cada jogador (`src/jogador-thread.js`).

| Índice | Conteúdo |
|---|---|
| 0 | lock |
| 1 | vez |
| 2, 3 | pontos |
| 4 | estado (0 aguardando, 1 jogando, 2 fim) |
| 5 | primeira carta aberta (-1 nenhuma) |
| 6 | pares achados |
| 7-22 | cartas |
| 23-38 | cartas já achadas |

O mutex está em `src/memoria.js`: `travar` usa `Atomics.compareExchange` para pegar o lock e `Atomics.wait` para dormir se estiver ocupado, `destravar` usa `Atomics.store` e `Atomics.notify`. `node teste-mutex.js` compara a soma com e sem mutex.
