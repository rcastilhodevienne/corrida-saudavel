const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configurações e Estado do Jogo
let jogando = false;
let tempoRestante = 180; // 3 minutos
let pontos = 0;
let timerJogo;
let emojiBase = '👦';

// Constantes
const COMIDA_BOA = ['🍎', '🥦', '🍌', '🥕', '🍉', '🍇', '🥑'];
const COMIDA_RUIM = ['🍔', '🍕', '🍩', '🍫', '🍟', '🥤'];

// O Jogador
let jogador = {
    x: canvas.width / 2,
    y: 100, // Fica perto do topo (estilo SkiFree)
    tamanho: 50,
    alvoX: canvas.width / 2,
    saude: 100, // 0 = Doente/Fim, 100 = Topo
    velocidadeLateral: 5,
    gordura: 1, // Escala X. > 1 = gordo
    estado: 'normal' // normal, brilho, vomito
};

let itens = [];
let velocidadeCenario = 4;
let estadoEfeitoTempo = 0;

// Input do PC
window.addEventListener('keydown', (e) => {
    if (!jogando) return;
    if (e.key === 'ArrowLeft') jogador.alvoX -= 40;
    if (e.key === 'ArrowRight') jogador.alvoX += 40;
});

// Input Mobile
document.getElementById('btn-esquerda').addEventListener('touchstart', (e) => { e.preventDefault(); jogador.alvoX -= 60; });
document.getElementById('btn-direita').addEventListener('touchstart', (e) => { e.preventDefault(); jogador.alvoX += 60; });

function iniciarJogo(personagem) {
    emojiBase = personagem;
    document.getElementById('tela-inicial').classList.add('escondido');
    document.getElementById('hud').classList.remove('escondido');
    document.getElementById('controles-touch').classList.remove('escondido');
    
    // Inicia Cronómetro
    timerJogo = setInterval(() => {
        tempoRestante--;
        atualizarHUD();
        if (tempoRestante <= 0) fimDeJogo(true);
    }, 1000);

    jogando = true;
    loop();
}

function atualizarHUD() {
    // Atualiza Pontos e Tempo
    document.getElementById('pontos').textContent = pontos;
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    document.getElementById('tempo').textContent = `${min < 10 ? '0' : ''}${min}:${seg < 10 ? '0' : ''}${seg}`;

    // Atualiza Barra de Saúde (Cor e Tamanho)
    const barra = document.getElementById('barra-saude');
    barra.style.width = jogador.saude + '%';
    if (jogador.saude > 70) barra.style.backgroundColor = '#4caf50'; // Verde
    else if (jogador.saude > 30) barra.style.backgroundColor = '#ff9800'; // Laranja
    else barra.style.backgroundColor = '#f44336'; // Vermelho
}

function spawnItem() {
    if (Math.random() < 0.04) { // Probabilidade de surgir item
        const isRuim = Math.random() > 0.6; // 40% de chance de ser besteira
        const tipo = isRuim ? COMIDA_RUIM[Math.floor(Math.random() * COMIDA_RUIM.length)] : COMIDA_BOA[Math.floor(Math.random() * COMIDA_BOA.length)];
        
        itens.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: canvas.height + 50, // Nasce lá em baixo
            tipo: tipo,
            isRuim: isRuim,
            tamanho: 40
        });
    }
}

function loop() {
    if (!jogando) return;

    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Física e Lógica
    atualizarJogador();
    spawnItem();
    atualizarEDesenharItens(); // O ERRO ESTAVA AQUI (tinha um espaço)
    desenharJogador();

    // Pede o próximo frame
    requestAnimationFrame(loop);
}

function atualizarJogador() {
    // Suaviza o movimento lateral (agilidade afeta a rapidez de resposta)
    jogador.velocidadeLateral = 2 + (jogador.saude / 20); // Mais saúde = mais ágil
    
    if (Math.abs(jogador.alvoX - jogador.x) > jogador.velocidadeLateral) {
        jogador.x += jogador.alvoX > jogador.x ? jogador.velocidadeLateral : -jogador.velocidadeLateral;
    }

    // Limites da tela
    if (jogador.x < 30) { jogador.x = 30; jogador.alvoX = 30; }
    if (jogador.x > canvas.width - 30) { jogador.x = canvas.width - 30; jogador.alvoX = canvas.width - 30; }
    
    // A velocidade do cenário (do jogo) varia com a saúde
    velocidadeCenario = 3 + (jogador.saude / 15);
}

function desenharJogador() {
    ctx.save();
    ctx.translate(jogador.x, jogador.y);
    
    // Efeito de engordar (estica na horizontal baseado na gordura)
    ctx.scale(jogador.gordura, 1);
    
    ctx.font = `${jogador.tamanho}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let emojiRender = emojiBase;

    // Estados temporários
    if (estadoEfeitoTempo > 0) {
        estadoEfeitoTempo--;
        if (jogador.estado === 'brilho') {
            // Efeito bonito
            ctx.shadowColor = 'yellow';
            ctx.shadowBlur = 20;
            ctx.fillText('✨', 0, -30);
        } else if (jogador.estado === 'vomito') {
            emojiRender = '🤮';
            ctx.shadowColor = 'green';
            ctx.shadowBlur = 20;
        }
    }

    ctx.fillText(emojiRender, 0, 0);
    ctx.restore();
}

function atualizarEDesenharItens() { // E AQUI (corrigido para ficar tudo junto)
    for (let i = itens.length - 1; i >= 0; i--) {
        let item = itens[i];
        
        // Move para cima simulando o chão descendo
        item.y -= velocidadeCenario;

        // Desenha Item
        ctx.font = `${item.tamanho}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.tipo, item.x, item.y);

        // Colisão (Distância entre dois pontos)
        const dx = jogador.x - item.x;
        const dy = jogador.y - item.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < (jogador.tamanho / 2 + item.tamanho / 2)) {
            // COMEU!
            processarColisao(item.isRuim);
            itens.splice(i, 1); // Remove item
        } 
        // Remove itens que saíram da tela por cima
        else if (item.y < -50) {
            itens.splice(i, 1);
        }
    }
}

function processarColisao(isRuim) {
    if (isRuim) {
        pontos = 0; // Zera pontuação!
        jogador.saude -= 20;
        jogador.gordura += 0.2; // Fica mais largo
        jogador.estado = 'vomito';
        estadoEfeitoTempo = 60; // Duração do efeito (60 frames)
        
        if (jogador.saude <= 0) fimDeJogo(false);
    } else {
        pontos += 10;
        jogador.saude = Math.min(100, jogador.saude + 10);
        jogador.gordura = Math.max(1, jogador.gordura - 0.1); // Volta ao normal
        jogador.estado = 'brilho';
        estadoEfeitoTempo = 30;
    }
    atualizarHUD();
}

function fimDeJogo(sobreviveu) {
    jogando = false;
    clearInterval(timerJogo);
    
    document.getElementById('hud').classList.add('escondido');
    document.getElementById('controles-touch').classList.add('escondido');
    document.getElementById('tela-fim').classList.remove('escondido');
    
    document.getElementById('pontos-finais').textContent = pontos;
    
    const titulo = document.getElementById('titulo-fim');
    const msg = document.getElementById('mensagem-fim');
    
    if (sobreviveu) {
        titulo.textContent = "🏆 Parabéns! Tempo esgotado!";
        msg.textContent = "Você chegou ao fim com ótimos hábitos. Continue assim na vida real!";
        titulo.style.color = "#2e7d32";
    } else {
        titulo.textContent = "🚑 Game Over!";
        msg.textContent = "Você comeu muita besteira, ficou doente, obeso e não conseguiu terminar a corrida. Cuidado com a alimentação!";
        titulo.style.color = "#d32f2f";
    }
}

// Redimensionar tela dinamicamente
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
