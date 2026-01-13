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

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    this.add.text(width / 2, 80, "JUPIKL 🪐", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      150,
      "A Jupiter-inspired game\nexploring Kuala Lumpur routes",
      { fontSize: "18px", color: "#cccccc", align: "center" }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      230,
      "🪐 Find the best route\n⚡ Speed + liquidity\n❌ Avoid rugs",
      { fontSize: "16px", color: "#ffffff", align: "center" }
    ).setOrigin(0.5);

    const startBtn = this.add.text(width / 2, height - 180, "▶ START GAME", {
      fontSize: "28px",
      backgroundColor: "#1f2937",
      padding: { x: 24, y: 14 },
      color: "#ffffff"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on("pointerdown", () => {
      this.scene.start("MainScene");
    });

    const footer = this.add.text(width / 2, height - 40, "Built by lhajsol", {
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
    /** LEVEL DATA **/
    this.levels = [
      {
        name: "Petronas Twin Towers",
        bg: "bg_petronas",
        comment: "Welcome to the best route 🌍"
      },
      {
        name: "Batu Caves",
        bg: "bg_batu",
        comment: "Low slippage beats high gas ⛽"
      },
      {
        name: "Merdeka Square",
        bg: "bg_merdeka",
        comment: "Freedom = permissionless finance"
      },
      {
        name: "Bukit Bintang",
        bg: "bg_bukit",
        comment: "Speed wins the route ⚡"
      }
    ];

    this.currentLevel = 0;
    this.levelCoins = 0;
    this.coinsToNextLevel = 10;
    this.score = 0;
    this.gameOver = false;

    this.touchLeft = false;
    this.touchRight = false;

    const { width, height } = this.scale;

    /** BACKGROUND **/
    this.bg = this.add.image(width / 2, height / 2, this.levels[0].bg);
    this.bg.setDisplaySize(width, height);

    /** FLOOR **/
    this.floor = this.add.rectangle(width / 2, height - 30, width, 18, 0x1f2433);
    this.physics.add.existing(this.floor, true);

    /** CAT **/
    this.cat = this.physics.add.sprite(120, height - 80, "cat");
    this.cat.setScale(0.12);
    this.cat.body.setGravityY(1400);
    this.cat.setCollideWorldBounds(true);
    this.physics.add.collider(this.cat, this.floor);

    /** GROUPS **/
    this.coins = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    /** UI **/
    this.scoreText = this.add.text(20, 20, "JUP: 0", { color: "#ffffff" });

    this.progressText = this.add.text(width / 2, 20, "0 / 10", {
      color: "#ffffff"
    }).setOrigin(0.5, 0);

    this.levelText = this.add.text(width / 2, 48, this.levels[0].name, {
      color: "#cccccc",
      fontSize: "16px"
    }).setOrigin(0.5, 0);

    /** INPUT **/
    this.cursors = this.input.keyboard.createCursorKeys();

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

    /** COLLISIONS **/
    this.physics.add.overlap(this.cat, this.coins, this.collectCoin, null, this);
    this.physics.add.collider(
      this.cat,
      this.obstacles,
      () => this.endGame(false),
      null,
      this
    );

    /** START **/
    this.startSpawners();
    this.showComment(this.levels[0].comment);
  }

  update() {
    if (this.gameOver) return;

    let moving = false;

    if (this.cursors.left.isDown || this.touchLeft) {
      this.cat.setVelocityX(-240);
      moving = true;
    } else if (this.cursors.right.isDown || this.touchRight) {
      this.cat.setVelocityX(240);
      moving = true;
    }

    if (!moving) this.cat.setVelocityX(0);

    this.coins.children.iterate(c => c && c.y > 600 && c.destroy());
    this.obstacles.children.iterate(o => o && o.y > 600 && o.destroy());
  }

  jump() {
    if (this.cat.body.blocked.down) {
      this.cat.setVelocityY(-520);
    }
  }

  /* ---------- SPAWNERS ---------- */

  startSpawners() {
    this.coinTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const coin = this.coins.create(
          Phaser.Math.Between(80, 820),
          -30,
          "coin"
        );
        coin.setScale(0.08);
        coin.body.setVelocityY(260);
        coin.body.setAllowGravity(false);
      }
    });

    this.obstacleTimer = this.time.addEvent({
      delay: 1800,
      loop: true,
      callback: () => {
        const rug = this.obstacles.create(
          Phaser.Math.Between(120, 800),
          -40,
          "rug"
        );
        rug.setScale(0.07);
        rug.body.setVelocityY(300);
        rug.body.setAllowGravity(false);
        rug.body.setImmovable(true);
      }
    });
  }

  /* ---------- GAME LOGIC ---------- */

  collectCoin(cat, coin) {
    coin.destroy();

    this.score++;
    this.levelCoins++;

    this.scoreText.setText("JUP: " + this.score);
    this.progressText.setText(`${this.levelCoins} / ${this.coinsToNextLevel}`);

    if (this.levelCoins === 1) {
      this.showComment("Jupiter finds the best route 🪐");
    }

    if (this.levelCoins === this.coinsToNextLevel) {
      this.nextLevel();
    }
  }

  nextLevel() {
    this.currentLevel++;
    this.levelCoins = 0;

    if (this.currentLevel >= this.levels.length) {
      this.endGame(true);
      return;
    }

    const level = this.levels[this.currentLevel];

    this.bg.setTexture(level.bg);
    this.levelText.setText(level.name);
    this.progressText.setText("0 / 10");

    this.showComment(level.comment);
  }

  /* ---------- COMMENTS ---------- */

  showComment(text) {
    if (this.commentText) this.commentText.destroy();

    this.commentText = this.add.text(
      this.scale.width / 2,
      100,
      text,
      {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 12, y: 8 }
      }
    ).setOrigin(0.5);

    this.commentText.setAlpha(0);

    this.tweens.add({
      targets: this.commentText,
      alpha: 1,
      duration: 200
    });

    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: this.commentText,
        alpha: 0,
        duration: 200,
        onComplete: () => this.commentText.destroy()
      });
    });
  }

  endGame(win) {
    if (this.gameOver) return;
    this.gameOver = true;

    this.coinTimer.remove();
    this.obstacleTimer.remove();

    this.add.rectangle(450, 250, 900, 500, 0x000000, 0.6);

    this.add.text(
      450,
      250,
      win ? "ROUTE COMPLETED 🪐" : "GAME OVER",
      { fontSize: "36px", color: "#ffffff" }
    ).setOrigin(0.5);

    this.time.delayedCall(2500, () => {
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
