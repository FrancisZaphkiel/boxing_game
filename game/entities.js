class Fighter {
  constructor(x, y, color, isPlayer) {
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.color = color;
    this.isPlayer = isPlayer;

    this.maxHealth = 10;
    this.health = 10;

    this.maxGuard = 3;
    this.guard = 3;

    this.state = "reposo";

    this.cooldownLeft = 0;
    this.cooldownRight = 0;
    this.COOLDOWN_TIME = 800;

    this.comboCount = 0;
    this.lastAttackTime = 0;
    this.COMBO_WINDOW = 1500;
    this.MAX_COMBO = 5;

    this.hitTimer = 0;

    this.vulnerableTimer = 0;
    this.VULNERABLE_DURATION = 3000;

    this.idleTime = 0;
    this.GUARD_RECOVERY_TIME = 2000;
  }

  update(dt) {
    let now = millis();

    if (this.comboCount > 0 && (now - this.lastAttackTime > this.COMBO_WINDOW)) {
      this.comboCount = 0;
    }
    if (this.cooldownLeft > 0) this.cooldownLeft -= dt;
    if (this.cooldownRight > 0) this.cooldownRight -= dt;

    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0 && this.state !== "vulnerable") {
        this.state = "reposo";
      }
    }

    if (this.state === "vulnerable") {
      this.vulnerableTimer -= dt;
      if (this.vulnerableTimer <= 0) {
        this.state = "reposo";
        this.guard = this.maxGuard;
      }
    }

    if (this.state === "reposo") {
      this.idleTime += dt;
      if (this.idleTime >= this.GUARD_RECOVERY_TIME) {
        if (this.guard < this.maxGuard) {
          this.guard++;
        }
        this.idleTime = 0;
      }
    } else {
      this.idleTime = 0;
    }
  }

  attackLeft(now) {
    if (this.state === "vulnerable" || this.state === "punish" || this.hitTimer > 0) return false;
    if (this.cooldownLeft > 0) return false;
    if (this.comboCount >= this.MAX_COMBO) return false;

    this.state = "izquierda";
    this.comboCount++;
    this.lastAttackTime = now;
    this.cooldownLeft = this.COOLDOWN_TIME;

    setTimeout(() => { if (this.state === "izquierda") this.state = "reposo"; }, 400);
    return true;
  }

  attackRight(now) {
    if (this.state === "vulnerable" || this.state === "punish" || this.hitTimer > 0) return false;
    if (this.cooldownRight > 0) return false;
    if (this.comboCount >= this.MAX_COMBO) return false;

    this.state = "derecha";
    this.comboCount++;
    this.lastAttackTime = now;
    this.cooldownRight = this.COOLDOWN_TIME;

    setTimeout(() => { if (this.state === "derecha") this.state = "reposo"; }, 400);
    return true;
  }

  block() {
    if (this.state === "vulnerable" || this.state === "punish" || this.hitTimer > 0) return;
    this.state = "bloqueo";
  }

  idle() {
    if (this.state === "vulnerable" || this.state === "punish" || this.hitTimer > 0) return;
    this.state = "reposo";
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.hitTimer = 300;

    if (this.state !== "vulnerable") {
      this.state = "hit";
    }
  }

  takeGuardDamage(amount) {
    this.guard -= amount;
    if (this.guard <= 0) {
      this.guard = 0;
      this.startVulnerable();
    }
  }

  startVulnerable() {
    this.state = "vulnerable";
    this.vulnerableTimer = this.VULNERABLE_DURATION;
  }

  startPunish() {
    this.state = "punish";
  }

  draw() {
    push();

    let drawX = this.x;
    if (this.hitTimer > 0) {
      drawX += random(-5, 5);
    }

    translate(drawX, this.y);

    let c = this.color;
    if (this.state === "vulnerable") c = color(200, 200, 0);
    if (this.hitTimer > 0) c = color(255, 0, 0);

    fill(c);
    noStroke();

    rectMode(CENTER);
    rect(0, 0, 60, 150);

    ellipse(0, -90, 50, 50);

    fill(200);
    let lx = -35;
    let ly = -20;
    let rx = 35;
    let ry = -20;

    let dir = this.isPlayer ? 1 : -1;

    if (this.state === "izquierda") {
      lx += 50 * dir;
    } else if (this.state === "derecha") {
      rx += 50 * dir;
    } else if (this.state === "bloqueo") {
      lx += 20 * dir;
      rx -= 20 * dir;
      ly -= 40;
      ry -= 40;
    }

    ellipse(lx, ly, 30, 30);
    ellipse(rx, ry, 30, 30);

    this.drawBars();

    if (this.isPlayer) {
      fill(0, 255, 255);
      if (this.cooldownLeft > 0) {
        let w = map(this.cooldownLeft, this.COOLDOWN_TIME, 0, 30, 0);
        rect(-20, 90, w, 5);
      }
      if (this.cooldownRight > 0) {
        let w = map(this.cooldownRight, this.COOLDOWN_TIME, 0, 30, 0);
        rect(20, 90, w, 5);
      }
    }

    if (this.state === "vulnerable") {
      fill(255);
      textAlign(CENTER);
      textSize(16);
      text("BREAK!", 0, -140);
    }

    if (this.comboCount > 1) {
      fill(0, 255, 0);
      textAlign(CENTER);
      textSize(16);
      text(this.comboCount + " HITS", 0, -160);
    }

    pop();
  }

  drawBars() {
    let barWidth = 80;
    let barHeight = 10;
    let yOff = -130;

    fill(100, 0, 0);
    rect(0, yOff, barWidth, barHeight);

    fill(0, 255, 0);
    let hw = map(this.health, 0, this.maxHealth, 0, barWidth);
    rect(-barWidth / 2 + hw / 2, yOff, hw, barHeight);

    fill(0, 0, 100);
    rect(0, yOff + 15, barWidth, 6);

    fill(0, 255, 255);
    let gw = map(this.guard, 0, this.maxGuard, 0, barWidth);
    rect(-barWidth / 2 + gw / 2, yOff + 15, gw, 6);
  }
}
