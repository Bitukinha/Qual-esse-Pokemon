const IMAGEM = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const ERROS = {
  1: 'Não é a sua vez.',
  2: 'Essa carta não pode ser aberta.',
  3: 'A partida não está em andamento.',
  4: 'Mensagem inválida.',
};

let eu = 0;
let vez = 0;
let pontos = { 1: 0, 2: 0 };
let jogando = false;
let esperando = false;
let mostrandoErro = false;
let textoStatus = 'Conectando...';
let timerErro, timerFim, timerAviso;

const $ = (id) => document.getElementById(id);
const tabuleiro = $('tabuleiro');
const cartas = [];

const dois = (n) => String(n).padStart(2, '0');
const tres = (n) => String(n).padStart(3, '0');
const nome = (n) => NOMES_POKEMON[n - 1] || '#' + tres(n);

function criarTabuleiro() {
  for (let pos = 0; pos < 16; pos++) {
    const botao = document.createElement('button');
    botao.className = 'carta';
    botao.innerHTML = `<span class="verso">${dois(pos)}</span>
      <span class="frente"><img alt=""><span class="nome-pk"></span></span>`;
    botao.onclick = () => clicar(pos);
    tabuleiro.appendChild(botao);
    cartas.push({ botao, img: botao.querySelector('img'), aberta: false, achada: false });
  }
}

function revelar(pos, pokemon) {
  const c = cartas[pos];
  c.aberta = true;
  c.img.src = IMAGEM + pokemon + '.png';
  c.img.alt = '#' + tres(pokemon);
  c.botao.querySelector('.nome-pk').textContent = nome(pokemon);
  c.botao.classList.add('virada');
}

function esconder(pos) {
  cartas[pos].aberta = false;
  cartas[pos].botao.classList.remove('virada', 'errou');
}

function limparTabuleiro() {
  clearTimeout(timerErro);
  for (const c of cartas) {
    c.aberta = false;
    c.achada = false;
    c.botao.className = 'carta';
  }
}

function atualizarTela() {
  for (const j of [1, 2]) {
    const p = $('placar-' + j);
    p.classList.toggle('ativo', jogando && vez === j);
    p.querySelector('.voce').hidden = eu !== j;
    p.querySelector('.pontos').textContent = pontos[j];
  }
  if (jogando) $('status').textContent = vez === eu ? 'Sua vez' : `Vez do Jogador ${vez}`;
  else $('status').textContent = textoStatus;
}

function avisar(texto) {
  $('aviso').textContent = texto;
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => { $('aviso').textContent = ''; }, 2000);
}

function registrar(seta, m) {
  const li = document.createElement('li');
  li.textContent = `${seta} ${m}`;
  $('log').prepend(li);
  while ($('log').children.length > 80) $('log').lastChild.remove();
}

const ws = new WebSocket('ws://' + location.host);

ws.onmessage = (e) => receber(String(e.data));
ws.onclose = () => {
  jogando = false;
  textoStatus = 'Desconectado do servidor';
  atualizarTela();
};

function enviar(texto) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(texto);
  registrar('>', texto);
}

function clicar(pos) {
  if (!jogando) return avisar('A partida ainda não começou.');
  if (vez !== eu) return avisar('Espere a sua vez.');
  if (esperando || mostrandoErro || cartas[pos].aberta || cartas[pos].achada) return;
  esperando = true;
  enviar(`${eu}A${dois(pos)}`);
}

$('botao-novo').onclick = () => enviar(`${eu}R`);

function receber(m) {
  registrar('<', m);

  switch (m[0]) {
    case 'C':
      eu = Number(m[1]);
      textoStatus = 'Aguardando o adversário...';
      break;
    case 'X':
      textoStatus = 'Sala cheia';
      break;
    case 'I':
      iniciar(Number(m[1]));
      break;
    case 'T':
      vez = Number(m[1]);
      break;
    case 'D':
      jogando = false;
      textoStatus = 'O adversário saiu. Aguardando...';
      clearTimeout(timerFim);
      $('fim').hidden = true;
      limparTabuleiro();
      break;
    case 'E':
      fim(Number(m[1]));
      break;
    case '!':
      esperando = false;
      avisar(ERROS[m[1]] || 'Jogada recusada.');
      break;
    default:
      jogada(m);
  }
  atualizarTela();
}

function iniciar(primeiro) {
  clearTimeout(timerFim);
  limparTabuleiro();
  vez = primeiro;
  pontos = { 1: 0, 2: 0 };
  jogando = true;
  esperando = false;
  mostrandoErro = false;
  $('fim').hidden = true;
}

function jogada(m) {
  const jogador = Number(m[0]);
  const a = Number(m.slice(2, 4));
  esperando = false;

  if (m[1] === 'A') {
    revelar(a, Number(m.slice(4, 7)));
    return;
  }

  const b = Number(m.slice(4, 6));

  if (m[1] === 'Y') {
    const pokemon = Number(m.slice(6, 9));
    for (const pos of [a, b]) {
      revelar(pos, pokemon);
      cartas[pos].achada = true;
      cartas[pos].botao.classList.add('j' + jogador);
    }
    pontos[jogador]++;
    avisar(`Jogador ${jogador} achou ${nome(pokemon)}`);
  }

  if (m[1] === 'N') {
    revelar(a, Number(m.slice(6, 9)));
    revelar(b, Number(m.slice(9, 12)));
    cartas[a].botao.classList.add('errou');
    cartas[b].botao.classList.add('errou');
    mostrandoErro = true;
    timerErro = setTimeout(() => {
      esconder(a);
      esconder(b);
      mostrandoErro = false;
    }, 1400);
  }
}

function fim(vencedor) {
  jogando = false;
  textoStatus = 'Fim de jogo';
  $('fim-titulo').textContent = vencedor === 0 ? 'Empate' : vencedor === eu ? 'Você venceu' : 'Você perdeu';
  $('fim-placar').textContent = `Jogador 1: ${pontos[1]}  Jogador 2: ${pontos[2]}`;
  timerFim = setTimeout(() => { $('fim').hidden = false; }, 900);
}

criarTabuleiro();
atualizarTela();
