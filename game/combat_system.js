class CombatSystem {
  constructor() {
    this.roundsPlayerWon = 0;
    this.roundsNpcWon = 0;
    this.currentRound = 1;
    this.maxRounds = 3;

    this.player = null;
    this.npc = null;

    this.npcAttackTimer = 0;
    this.npcActionCooldown = 500;
  }

  setFighters(p, n) {
    this.player = p;
    this.npc = n;
  }

  update(dt) {
    if (this.player.health <= 0 || this.npc.health <= 0) {
      return;
    }

    this.updateNPC(dt);
  }

  processAttack(attacker, defender) {
    if (defender.state === "bloqueo" && defender.guard > 0) {
      defender.takeGuardDamage(1);
    }
    else if (defender.state === "vulnerable") {
      this.triggerPunish(attacker, defender);
    }
    else {
      defender.takeDamage(1);
    }
  }

  triggerPunish(attacker, defender) {
    attacker.startPunish();
    defender.state = "hit";

    let hitCount = 0;
    let punishInterval = setInterval(() => {
      defender.takeDamage(1.6);
      hitCount++;

      if (hitCount >= 5 || defender.health <= 0) {
        clearInterval(punishInterval);
        attacker.state = "reposo";
      }
    }, 200);
  }

  updateNPC(dt) {
    if (this.npc.state === "vulnerable" || this.npc.hitTimer > 0) return;

    this.npcAttackTimer -= dt;

    if (this.npcAttackTimer <= 0) {
      let r = random(1);

      if (this.player.state === "izquierda" || this.player.state === "derecha") {
        if (r < 0.8 && this.npc.guard > 0) {
          this.npc.block();
          this.npcAttackTimer = random(4000, 6000); // 4 to 6 secs blocking
          return;
        }
      }

      if (r < 0.4) {
        this.npc.attackLeft(millis());
        this.processAttack(this.npc, this.player);
      } else if (r < 0.8) {
        this.npc.attackRight(millis());
        this.processAttack(this.npc, this.player);
      } else {
        if (this.npc.guard < this.npc.maxGuard) {
          this.npc.idle();
        } else {
          this.npc.block();
        }
      }
      this.npcAttackTimer = this.npcActionCooldown + random(200, 600);
    }
  }

  checkRoundEnd() {
    if (this.player.health <= 0) {
      this.roundsNpcWon++;
      return "npc";
    } else if (this.npc.health <= 0) {
      this.roundsPlayerWon++;
      return "player";
    }
    return null;
  }

  resetRound() {
    this.player.health = this.player.maxHealth;
    this.player.guard = this.player.maxGuard;
    this.player.state = "reposo";

    this.npc.health = this.npc.maxHealth;
    this.npc.guard = this.npc.maxGuard;
    this.npc.state = "reposo";

    this.currentRound++;
  }

  isMatchOver() {
    let requiredWins = Math.ceil(this.maxRounds / 2);
    return (this.roundsPlayerWon >= requiredWins) || (this.roundsNpcWon >= requiredWins);
  }
}
