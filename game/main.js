const STATE_START = 0;
const STATE_COMBAT = 1;
const STATE_RESULTS = 2;
const STATE_ROUND_OVER = 3;

let gameState = STATE_START;

let player;
let npc;
let combatSys;

let canvasW = 615;
let canvasH = 695;

let winnerText = "";
let roundTimer = 0;

let bgImg;
let sprites = {};

function preload() {
  bgImg = loadImage('assets/escenario.png');

  sprites.normal = loadImage('assets/sprites_animados/luchador_normal.png');
  sprites.bloqueo = loadImage('assets/sprites_animados/luchador_bloqueo.png');
  sprites.noqueado = loadImage('assets/sprites_animados/luchador_noqueado.png');
  sprites.golpe_izquierdo = loadImage('assets/sprites_animados/luchador_golpe_izquierdo.png');
  sprites.golpe_derecho = loadImage('assets/sprites_animados/luchador_golpe_derecho.png');
  sprites.estrellas = loadImage('assets/sprites_animados/estrellas.png');
}

function setup() {
  let canvas = createCanvas(canvasW, canvasH);
  canvas.parent('game-container');

  setupML();

  // El jugador controla la cámara en primera persona.
  player = new Fighter(0, 0, color(0), true, sprites);

  // El NPC (oponente) se procesa abarcando todo el viewport.
  npc = new Fighter(0, 0, color(255), false, sprites);

  combatSys = new CombatSystem();
  combatSys.setFighters(player, npc);

  frameRate(60);
}

function draw() {
  if (bgImg) {
    image(bgImg, 0, 0, canvasW, canvasH);
  } else {
    background(30);
  }

  let currentInput = getCurrentInput();

  // Detiene la renderización del entorno mientras el modelo de IA no retorne el callback de éxito
  if (!isModelLoaded) {
    drawLoading();
    return;
  }

  switch (gameState) {
    case STATE_START:
      drawStartMenu(currentInput);
      break;
    case STATE_COMBAT:
      drawCombat(currentInput);
      break;
    case STATE_ROUND_OVER:
      drawRoundOver();
      break;
    case STATE_RESULTS:
      drawResults(currentInput);
      break;
  }
}

function drawLoading() {
  fill(0, 150);
  rect(0, 0, canvasW, canvasH);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("Cargando Modelo Teachable Machine...", canvasW / 2, canvasH / 2);
}

function drawStartMenu(input) {
  fill(0, 150);
  rect(0, 0, canvasW, canvasH);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("FIGHT GAME", canvasW / 2, 80);

  textSize(20);
  text("Utiliza IA y tu cámara web para jugar", canvasW / 2, 140);

  textSize(18);
  fill(200, 200, 0);
  text("Instrucciones:", canvasW / 2, 200);
  fill(255);
  text("- Golpe Izq: Acción 'izquierda'", canvasW / 2, 230);
  text("- Golpe Der: Acción 'derecha'", canvasW / 2, 260);
  text("- Bloqueo: Acción 'bloqueo' (Manos arriba)", canvasW / 2, 290);
  text("- Reposo: Bajar manos (recupera guardia)", canvasW / 2, 320);

  fill(0, 255, 255);
  textSize(24);
  text("Realiza 'Izquierda' para COMENZAR", canvasW / 2, 420);

  fill(150);
  textSize(16);
  text("Entrada actual: " + input, canvasW / 2, 480);

  if (input === "izquierda") {
    gameState = STATE_COMBAT;
    player.health = player.maxHealth;
    player.guard = player.maxGuard;
    npc.health = npc.maxHealth;
    npc.guard = npc.maxGuard;
    combatSys.currentRound = 1;
    combatSys.roundsPlayerWon = 0;
    combatSys.roundsNpcWon = 0;
  }
}

function drawCombat(input) {
  let dt = deltaTime;
  let now = millis();

  // Gestión de prioridades: Bloqueo ineficaz ignorado automáticamente en lógica de clases si carece de estamina
  if (input === "izquierda") {
    let fired = player.attackLeft(now);
    if (fired) combatSys.processAttack(player, npc);
  } else if (input === "derecha") {
    let fired = player.attackRight(now);
    if (fired) combatSys.processAttack(player, npc);
  } else if (input === "bloqueo") {
    player.block();
  } else if (input === "reposo") {
    player.idle();
  }

  player.update(dt);
  npc.update(dt);
  combatSys.update(dt);

  // Condicional de dibujo: player queda excluido y npc procesa la carga en buffer de sus sprites
  npc.draw();
  drawCombatUI();

  let roundLoser = combatSys.checkRoundEnd();
  if (roundLoser) {
    if (roundLoser === "player") {
      winnerText = "¡El LUCHADOR GANA EL ASALTO!";
    } else {
      winnerText = "¡GANASTE EL ASALTO!";
    }

    gameState = STATE_ROUND_OVER;
    roundTimer = 3000;
  }
}

function drawCombatUI() {
  fill(255);
  textAlign(CENTER, TOP);
  textSize(24);
  text("Round " + combatSys.currentRound, canvasW / 2, 20);

  textSize(20);
  text(`Player: ${combatSys.roundsPlayerWon} | NPC: ${combatSys.roundsNpcWon}`, canvasW / 2, 50);

  drawHealthGuardBar(50, 20, player.health, player.maxHealth, player.guard, player.maxGuard, "TÚ");

  drawHealthGuardBar(canvasW - 250, 20, npc.health, npc.maxHealth, npc.guard, npc.maxGuard, "OPONENTE");

  textAlign(LEFT, TOP);
  textSize(16);
  fill(0, 255, 0);
  text("Input: " + getCurrentInput(), 20, 100);

  // Alerta inmersiva de quiebre de defensa y cooldown reactivo limitante
  if (player.state === "vulnerable") {
    textAlign(CENTER, CENTER);
    fill(255, 0, 0);
    textSize(64);
    text("¡GUARDIA ROTA!", canvasW / 2, canvasH / 2);
  } else if (player.cooldownLeft > 0 || player.cooldownRight > 0) {
    fill(0, 255, 255);
    rect(canvasW / 2 - 50, canvasH - 30,
      map(max(player.cooldownLeft, player.cooldownRight), 0, player.COOLDOWN_TIME, 100, 0), 10);
  }
}

function drawHealthGuardBar(x, y, h, maxH, g, maxG, title) {
  push();
  translate(x, y);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  text(title, 0, 0);

  let w = 200;

  fill(100, 0, 0);
  rect(0, 25, w, 15);
  fill(0, 255, 0);
  rect(0, 25, map(h, 0, maxH, 0, w), 15);

  fill(0, 0, 100);
  rect(0, 45, w, 8);
  fill(0, 255, 255);
  rect(0, 45, map(g, 0, maxG, 0, w), 8);

  pop();
}

function drawRoundOver() {
  npc.draw();
  drawCombatUI();

  fill(0, 150);
  rect(0, 0, canvasW, canvasH);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text(winnerText, canvasW / 2, canvasH / 2);

  roundTimer -= deltaTime;
  if (roundTimer <= 0) {
    if (combatSys.isMatchOver()) {
      gameState = STATE_RESULTS;
    } else {
      combatSys.resetRound();
      gameState = STATE_COMBAT;
    }
  }
}

function drawResults(input) {
  fill(0, 150);
  rect(0, 0, canvasW, canvasH);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);

  if (combatSys.roundsPlayerWon > combatSys.roundsNpcWon) {
    fill(0, 255, 0);
    text("¡HAS GANADO!", canvasW / 2, 200);
  } else {
    fill(255, 0, 0);
    text("¡HAS PERDIDO!", canvasW / 2, 200);
  }

  fill(255);
  textSize(24);
  text(`Resultado Final: ${combatSys.roundsPlayerWon} - ${combatSys.roundsNpcWon}`, canvasW / 2, 300);

  textSize(20);
  fill(0, 255, 255);
  text("Realiza 'Derecha' para VOLVER", canvasW / 2, 450);

  fill(150);
  textSize(16);
  text("Entrada actual: " + input, canvasW / 2, 500);

  if (input === "derecha") {
    gameState = STATE_START;
  }
}
