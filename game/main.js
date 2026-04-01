// Game States
const STATE_START = 0;
const STATE_COMBAT = 1;
const STATE_RESULTS = 2;
const STATE_ROUND_OVER = 3;

let gameState = STATE_START;

let player;
let npc;
let combatSys;

let canvasW = 800;
let canvasH = 600;

let winnerText = "";
let roundTimer = 0;

function setup() {
  let canvas = createCanvas(canvasW, canvasH);
  canvas.parent('game-container');

  setupML();
  // Player on left, NPC on right
  player = new Fighter(200, 450, color(0, 150, 255), true);
  npc = new Fighter(600, 450, color(255, 100, 0), false);

  combatSys = new CombatSystem();
  combatSys.setFighters(player, npc);

  frameRate(60);
}

function draw() {
  background(30);

  fill(50);
  rect(0, 500, canvasW, 100);

  let currentInput = getCurrentInput();

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
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("Cargando Modelo Teachable Machine...", canvasW / 2, canvasH / 2);
}

function drawStartMenu(input) {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("FIGHT GAME", canvasW / 2, 100);

  textSize(24);
  text("Utiliza IA y tu cámara web para jugar", canvasW / 2, 160);

  textSize(20);
  fill(200, 200, 0);
  text("Instrucciones:", canvasW / 2, 230);
  fill(255);
  text("- Golpe Izquierdo: Acción 'izquierda'", canvasW / 2, 260);
  text("- Golpe Derecho: Acción 'derecha'", canvasW / 2, 290);
  text("- Bloqueo: Acción 'bloqueo' (Manos arriba)", canvasW / 2, 320);
  text("- Reposo: Acción 'reposo' (Bajar manos recupera guardia)", canvasW / 2, 350);

  fill(0, 255, 255);
  textSize(28);
  text("Realiza 'Izquierda' para COMENZAR", canvasW / 2, 450);

  fill(150);
  textSize(16);
  text("Entrada actual: " + input, canvasW / 2, 500);

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
  player.draw();
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
    roundTimer = 2000;
  }
}

function drawCombatUI() {
  fill(255);
  textAlign(CENTER, TOP);
  textSize(24);
  text("Round " + combatSys.currentRound, canvasW / 2, 20);

  textSize(20);
  text(`Player: ${combatSys.roundsPlayerWon} | NPC: ${combatSys.roundsNpcWon}`, canvasW / 2, 50);

  textAlign(LEFT, TOP);
  textSize(16);
  fill(0, 255, 0);
  text("Input: " + getCurrentInput(), 20, 20);
}

function drawRoundOver() {
  player.draw();
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
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(64);

  if (combatSys.roundsPlayerWon > combatSys.roundsNpcWon) {
    fill(0, 255, 0);
    text("¡HAS GANADO LA PARTIDA!", canvasW / 2, 200);
  } else {
    fill(255, 0, 0);
    text("¡HAS PERDIDO LA PARTIDA!", canvasW / 2, 200);
  }

  fill(255);
  textSize(32);
  text(`Resultado Final: ${combatSys.roundsPlayerWon} - ${combatSys.roundsNpcWon}`, canvasW / 2, 300);

  textSize(24);
  fill(0, 255, 255);
  text("Realiza 'Derecha' para VOLVER AL MENÚ", canvasW / 2, 450);

  fill(150);
  textSize(16);
  text("Entrada actual: " + input, canvasW / 2, 500);

  if (input === "derecha") {
    gameState = STATE_START;
  }
}
