class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // Sprites
    this.load.image("cat", "assets/images/cat.png");
    this.load.image("coin", "assets/images/coin.png");
    this.load.image("rug", "assets/images/rug.png");

    // Backgrounds
    this.load.image("bg_petronas", "assets/images/backgrounds/petronas.png");
    this.load.image("bg_batu", "assets/images/backgrounds/batu.png");
    this.load.image("bg_merdeka", "assets/images/backgrounds/merdeka.png");
    this.load.image("bg_bukit", "assets/images/backgrounds/bukit.png");
  }

  create() {
    /** LEVELS **/
    this.levels = [
      {
        name: "Petronas Twin Towers",
        bg: "bg_petronas",
        coinRate: 900,
        obstacleRate: 1800,
        message: "Welcome to the best route 🌍"
      },
      {
        name: "Batu Caves",
        bg: "bg_batu",
        coinRate: 800,
        obstacleRate: 1500,
        message: "Low slippage beats high gas ⛽"
      },
      {
        name: "Merdeka Square",
        bg: "bg_merdeka",
        coinRate: 700,
        obstacleRate: 1300,
        message: "Freedom = permissionless finance"
      },
      {
        name: "Bukit Bintang",
        bg: "bg_bukit",
        coinRate: 650,
        obstacleRate: 1100,
        message: "Speed wins the route ⚡"
      }
    ];

    /** STATE **/
    this.currentLevel = 0;
    this.score = 0;
    this.levelCoins = 0;
    this.coinsToNextLevel = 10;
    this.levelCompleted = false; // 🔒 IMPORTANT FIX
    this.best = Number(localStorage.getItem("best")) || 0;
    this.gameOver = false;

    /** MOBILE STATE **/
    this.touchLeft = false;
    this.touchRight = false;

    /** BACKGROUND **/
    this.bg = this.add.image(450, 250, this.levels[0].bg);
    this.bg.setDisplaySize(900, 500);

    /** FLOOR **/
    this.floor = this.add.rectangle(450, 470, 900, 18, 0x1f2433);
    this.physics.add.existing(this.floor, true);

    /** CAT **/
    this.cat = this.physics.add.sprite(120, 420, "cat");
    this.cat.setScale(0.12);
    this.cat.setCollideWorldBounds(true);
    this.cat.body.setGravityY(1400);

    this.cat.body.setSize(
      this.cat.width * 0.45,
      this.cat.height * 0.6
    );
    this.cat.body.setOffset(
      this.cat.width * 0.28,
      this.cat.height * 0.35
    );

    this.physics.add.collider(this.cat, this.floor);

    /** GROUPS **/
    this.coins = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    /** UI **/
    this.scoreText = this.add.text(20, 20, "JUP: 0", { color: "#ffffff" });
    this.bestText = this.add.text(20, 44, "BEST: " + this.best, { color: "#888888" });

    this.levelText = this.add.text(450, 20, this.levels[0].name, {
      color: "#aaaaaa"
    }).setOrigin(0.5, 0);

    this.progressText = this.add.text(450, 44, "0 / 10", {
      color: "#ffffff"
    }).setOrigin(0.5, 0);

    /** INPUT (DESKTOP) **/
    this.cursors = this.input.keyboard.createCursorKeys();

    /** INPUT (MOBILE TOUCH) **/
    this.input.on("pointerdown", (pointer) => {
      if (pointer.x < this.scale.width / 2) {
        this.touchLeft = true;
      } else {
        this.touchRight = true;
      }

      if (pointer.y > this.scale.height * 0.6) {
        this.jump();
      }
    });

    this.input.on("pointerup", () => {
      this.touchLeft = false;
      this.touchRight = false;
    });

    /** COLLISIONS **/
    this.physics.add.overlap(this.cat, this.coins, this.collectCoin, null, this);
    this.physics.add.collider(this.cat, this.obstacles, this.hitObstacle, null, this);

    /** START **/
    this.startLevel();
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

    if (!moving) {
      this.cat.setVelocityX(0);
    }

    // Cleanup
    this.coins.children.iterate(c => c && c.y > 550 && c.destroy());
    this.obstacles.children.iterate(o => o && o.y > 550 && o.destroy());
  }

  jump() {
    if (this.cat.body.blocked.down) {
      this.cat.setVelocityY(-520);
    }
  }

  /** LEVEL CONTROL **/
  startLevel() {
    const level = this.levels[this.currentLevel];

    this.levelCoins = 0;
    this.levelCompleted = false; // 🔓 RESET LOCK
    this.progressText.setText(`0 / ${this.coinsToNextLevel}`);
    this.levelText.setText(level.name);

    this.tweens.add({
      targets: this.bg,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.bg.setTexture(level.bg);
        this.tweens.add({
          targets: this.bg,
          alpha: 1,
          duration: 300
        });
      }
    });

    this.showMessage(level.message);

    if (this.coinTimer) this.coinTimer.remove();
    if (this.obstacleTimer) this.obstacleTimer.remove();

    this.coinTimer = this.time.addEvent({
      delay: level.coinRate,
      loop: true,
      callback: this.spawnCoin,
      callbackScope: this
    });

    this.obstacleTimer = this.time.addEvent({
      delay: level.obstacleRate,
      loop: true,
      callback: this.spawnObstacle,
      callbackScope: this
    });
  }

  collectCoin(cat, coin) {
    if (this.levelCompleted) return; // 🔒 BLOCK MULTIPLE TRIGGERS

    this.tweens.add({
      targets: coin,
      scale: coin.scale * 1.4,
      alpha: 0,
      duration: 150,
      onComplete: () => coin.destroy()
    });

    this.score++;
    this.levelCoins++;

    this.scoreText.setText("JUP: " + this.score);
    this.progressText.setText(`${this.levelCoins} / ${this.coinsToNextLevel}`);

    if (this.levelCoins >= this.coinsToNextLevel) {
      this.levelCompleted = true;

      this.time.delayedCall(300, () => {
        this.nextLevel();
      });
    }
  }

  nextLevel() {
    this.currentLevel++;

    if (this.currentLevel >= this.levels.length) {
      this.endGame(true);
      return;
    }

    this.startLevel();
  }

  showMessage(text) {
    const msg = this.add.text(450, 120, text, {
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5);

    msg.setAlpha(0);

    this.tweens.add({
      targets: msg,
      alpha: 1,
      y: 100,
      duration: 300
    });

    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: msg,
        alpha: 0,
        duration: 300,
        onComplete: () => msg.destroy()
      });
    });
  }

  spawnCoin() {
    const coin = this.coins.create(
      Phaser.Math.Between(80, 820),
      -30,
      "coin"
    );

    coin.setScale(Phaser.Math.FloatBetween(0.06, 0.09));
    coin.body.setVelocityY(Phaser.Math.Between(200, 320));
    coin.body.setAllowGravity(false);
  }

  spawnObstacle() {
    const rug = this.obstacles.create(
      Phaser.Math.Between(120, 800),
      -40,
      "rug"
    );

    rug.setScale(0.055);
    rug.body.setVelocityY(Phaser.Math.Between(260, 340));
    rug.body.setAllowGravity(false);
    rug.body.setImmovable(true);
  }

  hitObstacle() {
    this.endGame(false);
  }

  endGame(win) {
    if (this.gameOver) return;
    this.gameOver = true;

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem("best", this.best);
    }

    this.add.rectangle(450, 250, 900, 500, 0x000000, 0.6);

    this.add.text(450, 220, win ? "ROUTE COMPLETED 🪐" : "GAME OVER", {
      fontSize: "36px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(450, 270, "JUP: " + this.score, {
      fontSize: "18px",
      color: "#cccccc"
    }).setOrigin(0.5);

    this.time.delayedCall(2500, () => this.scene.restart());
  }
}

/** GAME CONFIG **/
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
  scene: MainScene
});
