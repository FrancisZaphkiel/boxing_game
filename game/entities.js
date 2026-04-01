class Fighter {
  constructor(x, y, color, isPlayer, sprites) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isPlayer = isPlayer;
    this.sprites = sprites;

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

    // Controles de Animación de Sprites
    this.currentFrame = 0;
    this.animTimer = 0;
    this.ANIM_SPEED = 150; // milisegundos por fotograma
    this.lastState = "reposo";
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
        // Solo recupera el estado si la salud es mayor a 0
        if (this.health > 0) {
           this.state = "reposo";
           this.guard = this.maxGuard;
        }
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

    this.updateAnimation(dt);
  }

  updateAnimation(dt) {
    if (this.state !== this.lastState) {
        this.currentFrame = 0; // Reinicia el fotograma en cambios de estado
        this.animTimer = 0;
        this.lastState = this.state;
    }

    this.animTimer += dt;
    if (this.animTimer >= this.ANIM_SPEED) {
        this.animTimer = 0;
        let config = this.getAnimConfig(this.state);
        
        if (config.loop) {
            this.currentFrame = (this.currentFrame + 1) % config.frames;
        } else {
            // Detiene la animación en el último fotograma
            if (this.currentFrame < config.frames - 1) {
                this.currentFrame++;
            }
        }
    }
  }

  getAnimConfig(state) {
      switch(state) {
          case "reposo": return { img: this.sprites.normal, frames: 2, loop: true };
          case "bloqueo": return { img: this.sprites.bloqueo, frames: 2, loop: false };
          case "vulnerable": return { img: this.sprites.noqueado, frames: 2, loop: false };
          case "hit": return { img: this.sprites.normal, frames: 2, loop: true };
          case "izquierda": return { img: this.sprites.golpe_izquierdo, frames: 4, loop: false };
          case "derecha": return { img: this.sprites.golpe_derecho, frames: 4, loop: false };
          default: return { img: this.sprites.normal, frames: 2, loop: true };
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
    
    // Auto restauración de estado esperando que la animación finalice
    setTimeout(() => { if (this.state === "izquierda") this.state = "reposo"; }, 600);
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

    setTimeout(() => { if (this.state === "derecha") this.state = "reposo"; }, 600);
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
    if (this.health <= 0) {
        this.health = 0;
        this.startVulnerable();
    } else {
        this.hitTimer = 300; 
        if (this.state !== "vulnerable") this.state = "hit";
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
    // Renderización exclusiva de Inteligencia Artificial (Primera persona)
    if (this.isPlayer) return;

    push();
    
    let drawX = 0;
    let drawY = 0;

    if (this.hitTimer > 0) {
      drawX += random(-5, 5);
      tint(255, 100, 100);
    }

    let config = this.getAnimConfig(this.state);
    let img = config.img;
    let sW = 615;
    let sH = 695;

    if (img) {
       // Obtiene coordenada 'x' dinámicamente según el fotograma actual
       let sx = this.currentFrame * sW;
       image(img, drawX, drawY, sW, sH, sx, 0, sW, sH);
    } else {
       fill(255, 0, 0);
       rect(100, 100, 100, 100);
    }

    if (this.state === "vulnerable") {
      let starImg = this.sprites.estrellas;
      if (starImg) {
        let sW_star = 192;
        let sH_star = 128;
        // Mantiene iteración rítmica del fotograma usando tiempo global (millis) para evitar acumuladores visuales
        let starFrame = floor(millis() / 100) % 9;
        image(starImg, sW/2 - sW_star/2, 50, sW_star, sH_star, starFrame * sW_star, 0, sW_star, sH_star);
      }
      
      if (this.health > 0) {
        fill(255, 255, 0);
        textAlign(CENTER);
        textSize(32);
        text("¡GUARDIA ROTA!", sW/2, sH/2 - 100);
      } else {
        fill(255, 0, 0);
        textAlign(CENTER);
        textSize(48);
        text("K O ! !", sW/2, sH/2 - 100);
      }
    }
    
    pop();
  }
}
