/* ===================== HOME SCENE ===================== */

class HomeScene extends Phaser.Scene {
  constructor() {
    super("HomeScene");
  }

  preload() {
    this.load.image("bg_home", "assets/images/backgrounds/petronas.png");
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, "bg_home");
    bg.setDisplaySize(width, height);

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);

    this.add.text(width / 2, 76, "JUPIKL", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      142,
      "Find the best liquidity route across Kuala Lumpur",
      { fontSize: "18px", color: "#d7dee8", align: "center" }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      218,
      "Collect liquidity coins\nUse shields, boosts, and magnets\nAvoid rug pools",
      { fontSize: "16px", color: "#ffffff", align: "center", lineSpacing: 8 }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      310,
      "Move: Arrow keys or tap left/right\nJump: Space, Up, or tap bottom",
      { fontSize: "15px", color: "#cad5e2", align: "center", lineSpacing: 6 }
    ).setOrigin(0.5);

    const startBtn = this.add.text(width / 2, height - 105, "START ROUTE", {
      fontSize: "26px",
      backgroundColor: "#1f7a6b",
      padding: { x: 26, y: 14 },
      color: "#ffffff"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on("pointerdown", () => {
      this.scene.start("MainScene");
    });

    const footer = this.add.text(width / 2, height - 34, "Built by lhajsol", {
      fontSize: "14px",
      color: "#aaaaaa"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    footer.on("pointerdown", () => {
      window.open("https://x.com/lhajsol", "_blank");
    });
  }
}

/* ===================== GAME SCENE ===================== */

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.image("cat", "assets/images/cat.png");
    this.load.image("coin", "assets/images/coin.png");
    this.load.image("rug", "assets/images/rug.png");

    this.load.image("bg_petronas", "assets/images/backgrounds/petronas.png");
    this.load.image("bg_batu", "assets/images/backgrounds/batu.png");
    this.load.image("bg_merdeka", "assets/images/backgrounds/merdeka.png");
    this.load.image("bg_bukit", "assets/images/backgrounds/bukit.png");
  }

  create() {
    this.levels = [
      {
        name: "Petronas Twin Towers",
        route: "Petronas -> Batu Caves",
        bg: "bg_petronas",
        comment: "Route scan started: deep liquidity ahead",
        summary: "Best route found: Petronas -> Batu Caves, 0.30% slippage",
        coinDelay: 900,
        obstacleDelay: 1800,
        coinSpeed: 260,
        rugSpeed: 300,
        spread: 80,
        movingRugs: false
      },
      {
        name: "Batu Caves",
        route: "Batu Caves -> Merdeka Square",
        bg: "bg_batu",
        comment: "Low slippage beats high gas",
        summary: "Best route found: Batu Caves -> Merdeka Square, 0.24% slippage",
        coinDelay: 820,
        obstacleDelay: 1550,
        coinSpeed: 290,
        rugSpeed: 330,
        spread: 55,
        movingRugs: true
      },
      {
        name: "Merdeka Square",
        route: "Merdeka Square -> Bukit Bintang",
        bg: "bg_merdeka",
        comment: "Permissionless route unlocked",
        summary: "Best route found: Merdeka Square -> Bukit Bintang, 0.18% slippage",
        coinDelay: 760,
        obstacleDelay: 1325,
        coinSpeed: 315,
        rugSpeed: 370,
        spread: 35,
        movingRugs: true
      },
      {
        name: "Bukit Bintang",
        route: "Bukit Bintang -> Final Swap",
        bg: "bg_bukit",
        comment: "Priority fee boost recommended",
        summary: "Best route found: Bukit Bintang -> Final Swap, 0.12% slippage",
        coinDelay: 690,
        obstacleDelay: 1125,
        coinSpeed: 345,
        rugSpeed: 420,
        spread: 20,
        movingRugs: true
      }
    ];

    this.currentLevel = 0;
    this.levelCoins = 0;
    this.coinsToNextLevel = 10;
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.invulnerable = false;

    this.touchLeft = false;
    this.touchRight = false;
    this.shieldActive = false;
    this.boostUntil = 0;
    this.magnetUntil = 0;

    const { width, height } = this.scale;

    this.bg = this.add.image(width / 2, height / 2, this.levels[0].bg);
    this.bg.setDisplaySize(width, height);

    this.floor = this.add.rectangle(width / 2, height - 30, width, 18, 0x1f2433);
    this.physics.add.existing(this.floor, true);

    this.cat = this.physics.add.sprite(120, height - 80, "cat");
    this.cat.setScale(0.12);
    this.cat.body.setGravityY(1400);
    this.cat.setCollideWorldBounds(true);
    this.physics.add.collider(this.cat, this.floor);

    this.coins = this.physics.add.group();
    this.obstacles = this.physics.add.group();
    this.powerups = this.physics.add.group();

    this.createHud();
    this.updateHud();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.jumpKeys = this.input.keyboard.addKeys({
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP
    });

    this.input.on("pointerdown", (pointer) => {
      if (pointer.y > height * 0.65) {
        this.jump();
      } else if (pointer.x < width / 2) {
        this.touchLeft = true;
      } else {
        this.touchRight = true;
      }
    });

    this.input.on("pointerup", () => {
      this.touchLeft = false;
      this.touchRight = false;
    });

    this.physics.add.overlap(this.cat, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.cat, this.powerups, this.collectPowerup, null, this);
    this.physics.add.collider(this.cat, this.obstacles, this.hitObstacle, null, this);

    this.startSpawners();
    this.showComment(this.levels[0].comment);
  }

  update(time) {
    if (this.gameOver) return;

    const moveSpeed = time < this.boostUntil ? 345 : 240;
    let moving = false;

    if (this.cursors.left.isDown || this.touchLeft) {
      this.cat.setVelocityX(-moveSpeed);
      moving = true;
    } else if (this.cursors.right.isDown || this.touchRight) {
      this.cat.setVelocityX(moveSpeed);
      moving = true;
    }

    if (!moving) this.cat.setVelocityX(0);

    if (
      Phaser.Input.Keyboard.JustDown(this.jumpKeys.space) ||
      Phaser.Input.Keyboard.JustDown(this.jumpKeys.up)
    ) {
      this.jump();
    }

    if (time < this.magnetUntil) {
      this.pullCoinsTowardPlayer();
    }

    this.moveRugsWithinBounds();
    this.cleanupFallingObjects();
    this.updatePowerupStatus(time);
  }

  jump() {
    if (this.cat.body.blocked.down) {
      this.cat.setVelocityY(-520);
      this.playTone("jump");
    }
  }

  createHud() {
    const { width } = this.scale;

    this.add.rectangle(width / 2, 38, width, 76, 0x07111f, 0.82);
    this.scoreText = this.add.text(18, 13, "", { color: "#ffffff", fontSize: "18px" });
    this.livesText = this.add.text(18, 43, "", { color: "#ffffff", fontSize: "16px" });

    this.levelText = this.add.text(width / 2, 10, "", {
      color: "#ffffff",
      fontSize: "18px",
      fontStyle: "bold"
    }).setOrigin(0.5, 0);

    this.routeText = this.add.text(width / 2, 37, "", {
      color: "#cad5e2",
      fontSize: "14px"
    }).setOrigin(0.5, 0);

    this.progressBack = this.add.rectangle(width - 178, 24, 150, 12, 0x1f2937);
    this.progressFill = this.add.rectangle(width - 253, 24, 0, 12, 0x3ddc97).setOrigin(0, 0.5);
    this.progressText = this.add.text(width - 103, 43, "", {
      color: "#ffffff",
      fontSize: "14px"
    }).setOrigin(0.5, 0);

    this.powerupText = this.add.text(width - 18, 13, "", {
      color: "#ffe08a",
      fontSize: "14px",
      align: "right"
    }).setOrigin(1, 0);
  }

  updateHud() {
    const level = this.levels[this.currentLevel];
    const progress = this.levelCoins / this.coinsToNextLevel;

    this.scoreText.setText("JUP: " + this.score);
    this.livesText.setText("Lives: " + this.lives);
    this.levelText.setText(level.name);
    this.routeText.setText(level.route);
    this.progressFill.width = 150 * progress;
    this.progressText.setText(`${this.levelCoins} / ${this.coinsToNextLevel} liquidity`);
  }

  updatePowerupStatus(time) {
    const active = [];
    if (this.shieldActive) active.push("Shield");
    if (time < this.boostUntil) active.push("Boost");
    if (time < this.magnetUntil) active.push("Magnet");

    this.powerupText.setText(active.join("\n"));
  }

  startSpawners() {
    const level = this.levels[this.currentLevel];

    if (this.coinTimer) this.coinTimer.remove();
    if (this.obstacleTimer) this.obstacleTimer.remove();
    if (this.powerupTimer) this.powerupTimer.remove();

    this.coinTimer = this.time.addEvent({
      delay: level.coinDelay,
      loop: true,
      callback: () => this.spawnCoin()
    });

    this.obstacleTimer = this.time.addEvent({
      delay: level.obstacleDelay,
      loop: true,
      callback: () => this.spawnObstacle()
    });

    this.powerupTimer = this.time.addEvent({
      delay: 6500,
      loop: true,
      callback: () => this.spawnPowerup()
    });
  }

  spawnCoin() {
    const level = this.levels[this.currentLevel];
    const { width } = this.scale;
    const left = Math.max(55, level.spread);
    const right = Math.min(width - 55, width - level.spread);
    const coin = this.coins.create(Phaser.Math.Between(left, right), -30, "coin");

    coin.setScale(0.08);
    coin.body.setVelocityY(level.coinSpeed);
    coin.body.setAllowGravity(false);
  }

  spawnObstacle() {
    const level = this.levels[this.currentLevel];
    const { width } = this.scale;
    const rug = this.obstacles.create(Phaser.Math.Between(90, width - 90), -40, "rug");

    rug.setScale(0.07);
    rug.body.setVelocityY(level.rugSpeed);
    rug.body.setVelocityX(level.movingRugs ? Phaser.Math.Between(-90, 90) : 0);
    rug.body.setAllowGravity(false);
    rug.body.setImmovable(true);
    rug.isMoving = level.movingRugs;
  }

  spawnPowerup() {
    const { width } = this.scale;
    const types = ["shield", "boost", "magnet"];
    const type = Phaser.Utils.Array.GetRandom(types);
    const powerup = this.powerups.create(Phaser.Math.Between(80, width - 80), -35, "coin");

    powerup.powerupType = type;
    powerup.setScale(0.1);
    powerup.setTint(this.getPowerupTint(type));
    powerup.body.setVelocityY(230);
    powerup.body.setAllowGravity(false);
  }

  getPowerupTint(type) {
    if (type === "shield") return 0x66d9ff;
    if (type === "boost") return 0xffc857;
    return 0xb887ff;
  }

  collectCoin(cat, coin) {
    coin.destroy();

    this.score++;
    this.levelCoins++;
    this.playTone("coin");
    this.updateHud();

    if (this.levelCoins === 1) {
      this.showComment("Jupiter finds the best route");
    }

    if (this.levelCoins >= this.coinsToNextLevel) {
      this.nextLevel();
    }
  }

  collectPowerup(cat, powerup) {
    const type = powerup.powerupType;
    powerup.destroy();

    if (type === "shield") {
      this.shieldActive = true;
      this.showComment("Low slippage shield ready");
    } else if (type === "boost") {
      this.boostUntil = this.time.now + 5500;
      this.showComment("Priority fee boost active");
    } else {
      this.magnetUntil = this.time.now + 6000;
      this.showComment("Route optimizer magnet active");
    }

    this.playTone("powerup");
  }

  hitObstacle(cat, rug) {
    if (this.invulnerable || this.gameOver) return;

    rug.destroy();

    if (this.shieldActive) {
      this.shieldActive = false;
      this.flashPlayer(0x66d9ff);
      this.showComment("Shield absorbed a bad pool");
      this.playTone("shield");
      return;
    }

    this.lives--;
    this.invulnerable = true;
    this.updateHud();
    this.flashPlayer(0xff6b6b);
    this.playTone("hit");

    if (this.lives <= 0) {
      this.endGame(false);
      return;
    }

    this.showComment("Bad pool avoided. Re-routing...");
    this.time.delayedCall(1100, () => {
      this.invulnerable = false;
      this.cat.clearTint();
    });
  }

  nextLevel() {
    const completed = this.levels[this.currentLevel];

    this.currentLevel++;
    this.levelCoins = 0;
    this.coins.clear(true, true);
    this.obstacles.clear(true, true);
    this.powerups.clear(true, true);

    if (this.currentLevel >= this.levels.length) {
      this.endGame(true, completed.summary);
      return;
    }

    const next = this.levels[this.currentLevel];
    this.showRouteSummary(completed.summary);
    this.bg.setTexture(next.bg);
    this.updateHud();
    this.startSpawners();
    this.time.delayedCall(1300, () => this.showComment(next.comment));
  }

  showRouteSummary(text) {
    const { width, height } = this.scale;
    const panel = this.add.container(width / 2, height / 2);
    const rect = this.add.rectangle(0, 0, 640, 90, 0x07111f, 0.9);
    const label = this.add.text(0, 0, text, {
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 580 }
    }).setOrigin(0.5);

    panel.add([rect, label]);
    panel.setAlpha(0);

    this.tweens.add({ targets: panel, alpha: 1, duration: 180, yoyo: true, hold: 1000 });
    this.time.delayedCall(1400, () => panel.destroy());
  }

  showComment(text) {
    if (this.commentText) this.commentText.destroy();

    const target = this.add.text(
      this.scale.width / 2,
      98,
      text,
      {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#07111f",
        padding: { x: 12, y: 8 }
      }
    ).setOrigin(0.5);

    this.commentText = target;
    target.setAlpha(0);

    this.tweens.add({
      targets: target,
      alpha: 1,
      duration: 180
    });

    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: target,
        alpha: 0,
        duration: 180,
        onComplete: () => target.destroy()
      });
    });
  }

  pullCoinsTowardPlayer() {
    this.coins.children.iterate((coin) => {
      if (!coin || !coin.body) return;

      const distance = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, coin.x, coin.y);
      if (distance > 170) return;

      this.physics.moveToObject(coin, this.cat, 360);
    });
  }

  moveRugsWithinBounds() {
    const { width } = this.scale;

    this.obstacles.children.iterate((rug) => {
      if (!rug || !rug.body || !rug.isMoving) return;

      if (rug.x < 35 && rug.body.velocity.x < 0) {
        rug.body.setVelocityX(Math.abs(rug.body.velocity.x));
      }

      if (rug.x > width - 35 && rug.body.velocity.x > 0) {
        rug.body.setVelocityX(-Math.abs(rug.body.velocity.x));
      }
    });
  }

  cleanupFallingObjects() {
    const limit = this.scale.height + 80;

    this.coins.children.iterate((coin) => coin && coin.y > limit && coin.destroy());
    this.obstacles.children.iterate((rug) => rug && rug.y > limit && rug.destroy());
    this.powerups.children.iterate((powerup) => powerup && powerup.y > limit && powerup.destroy());
  }

  flashPlayer(color) {
    this.cat.setTint(color);
    this.tweens.add({
      targets: this.cat,
      alpha: 0.45,
      duration: 90,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.cat.setAlpha(1);
        if (!this.invulnerable) this.cat.clearTint();
      }
    });
  }

  playTone(type) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const settings = {
      coin: [880, 0.07, "sine"],
      jump: [360, 0.06, "square"],
      powerup: [660, 0.14, "triangle"],
      shield: [520, 0.12, "sine"],
      hit: [120, 0.18, "sawtooth"],
      win: [740, 0.25, "triangle"]
    }[type];

    if (!settings) return;

    const [frequency, duration, wave] = settings;
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  endGame(win, finalSummary) {
    if (this.gameOver) return;
    this.gameOver = true;

    if (this.coinTimer) this.coinTimer.remove();
    if (this.obstacleTimer) this.obstacleTimer.remove();
    if (this.powerupTimer) this.powerupTimer.remove();

    this.playTone(win ? "win" : "hit");

    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.64);

    this.add.text(
      width / 2,
      height / 2 - 42,
      win ? "ROUTE COMPLETED" : "GAME OVER",
      { fontSize: "36px", color: "#ffffff", fontStyle: "bold" }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      height / 2 + 12,
      win ? finalSummary : "The route hit too many bad pools.",
      { fontSize: "18px", color: "#d7dee8", align: "center", wordWrap: { width: 620 } }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      height / 2 + 62,
      "Final JUP: " + this.score,
      { fontSize: "18px", color: "#ffffff" }
    ).setOrigin(0.5);

    this.time.delayedCall(3200, () => {
      this.scene.start("HomeScene");
    });
  }
}

/* ===================== GAME CONFIG ===================== */

new Phaser.Game({
  type: Phaser.AUTO,
  width: 900,
  height: 500,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 } }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [HomeScene, MainScene]
});
