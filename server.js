const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');
const { WebSocketServer } = require('ws');

const { criarMemoria, travar, destravar } = require('./src/memoria');
const jogo = require('./src/jogo');

const PORTA_INICIAL = Number(process.env.PORT) || 3000;
let PORTA = PORTA_INICIAL;
const PUBLIC = path.join(__dirname, 'public');

const memoria = criarMemoria();
const mem = new Int32Array(memoria);

const sockets = { 1: null, 2: null };
const threads = {};

for (const j of [1, 2]) {
  threads[j] = new Worker(path.join(__dirname, 'src', 'jogador-thread.js'), {
    workerData: { jogador: j, memoria },
  });
  threads[j].on('message', ({ eu, todos }) => {
    eu.forEach((m) => enviar(j, m));
    todos.forEach((m) => { enviar(1, m); enviar(2, m); });
  });
  threads[j].on('error', (e) => console.error('erro na thread', j, e));
}

function enviar(j, texto) {
  const ws = sockets[j];
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(texto);
    console.log(`servidor -> J${j}: ${texto}`);
  }
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const arquivo = path.join(PUBLIC, url === '/' ? 'index.html' : url);

  if (!arquivo.startsWith(PUBLIC)) return res.writeHead(403).end();

  fs.readFile(arquivo, (erro, dados) => {
    if (erro) return res.writeHead(404).end('Nao encontrado');
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(dados);
  });
});

const wss = new WebSocketServer({ server: servidor });

wss.on('connection', (ws) => {
  const jogador = !sockets[1] ? 1 : !sockets[2] ? 2 : 0;

  if (jogador === 0) {
    ws.send('X');
    ws.close();
    return;
  }

  sockets[jogador] = ws;
  console.log(`Jogador ${jogador} entrou`);
  enviar(jogador, 'C' + jogador);

  if (sockets[1] && sockets[2]) {
    travar(mem);
    const inicio = jogo.novaPartida(mem);
    destravar(mem);
    enviar(1, inicio);
    enviar(2, inicio);
  }

  ws.on('message', (dados) => {
    const texto = dados.toString().slice(0, 16);
    console.log(`J${jogador} -> servidor: ${texto}`);
    threads[jogador].postMessage(texto);
  });

  ws.on('close', () => {
    sockets[jogador] = null;
    console.log(`Jogador ${jogador} saiu`);
    travar(mem);
    jogo.encerrar(mem);
    destravar(mem);
    enviar(1, 'D');
    enviar(2, 'D');
  });
});

function abrirServidor(porta) {
  wss.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && !process.env.PORT && porta < 65535) {
      const proximaPorta = porta + 1;
      console.warn(`Porta ${porta} ja esta em uso. Tentando ${proximaPorta}...`);
      PORTA = proximaPorta;
      abrirServidor(proximaPorta);
      return;
    }

    console.error(e.code === 'EADDRINUSE' ? `Porta ${porta} ja esta em uso` : e);
    process.exit(1);
  });

  servidor.listen(porta, () => {
    PORTA = porta;
    console.log(`Servidor na porta ${PORTA}`);
    console.log(`Neste computador: http://localhost:${PORTA}`);
    for (const lista of Object.values(os.networkInterfaces())) {
      for (const i of lista) {
        if (i.family === 'IPv4' && !i.internal) console.log(`Na mesma rede: http://${i.address}:${PORTA}`);
      }
    }

    if (process.platform === 'win32' && !process.env.NAO_ABRIR) {
      require('child_process').exec(`start "" http://localhost:${PORTA}`);
    }
  });
}

abrirServidor(PORTA_INICIAL);
