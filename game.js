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
    /** LEVELS **/
    this.levels = [
      { name: "Petronas Twin Towers", bg: "bg_petronas", coinRate: 900, obstacleRate: 1800, message: "Welcome to the best route 🌍" },
      { name: "Batu Caves", bg: "bg_batu", coinRate: 800, obstacleRate: 1500, message: "Low slippage beats high gas ⛽" },
      { name: "Merdeka Square", bg: "bg_merdeka", coinRate: 700, obstacleRate: 1300, message: "Freedom = permissionless finance" },
      { name: "Bukit Bintang", bg: "bg_bukit", coinRate: 650, obstacleRate: 1100, message: "Speed wins the route ⚡" }
    ];

    /** STATE **/
    this.currentLevel = 0;
    this.score = 0;
    this.levelCoins = 0;
    this.coinsToNextLevel = 10;
    this.levelCompleted = false;
    this.gameOver = false;

    /** MOBILE **/
    this.touchLeft = false;
    this.touchRight = false;

    /** BG **/
    this.bg = this.add.image(450, 250, this.levels[0].bg).setDisplaySize(900, 500);

    /** FLOOR **/
    this.floor = this.add.rectangle(450, 470, 900, 18, 0x1f2433);
    this.physics.add.existing(this.floor, true);

    /** CAT **/
    this.cat = this.physics.add.sprite(120, 420, "cat");
    this.cat.setScale(0.12);
    this.cat.setCollideWorldBounds(true);
    this.cat.body.setGravityY(1400);
    this.physics.add.collider(this.cat, this.floor);

    /** GROUPS **/
    this.coins = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    /** UI **/
    this.scoreText = this.add.text(20, 20, "JUP: 0", { color: "#fff" });
    this.levelText = this.add.text(450, 20, this.levels[0].name, { color: "#aaa" }).setOrigin(0.5);
    this.progressText = this.add.text(450, 44, "0 / 10", { color: "#fff" }).setOrigin(0.5);

    /** INPUT **/
    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.on("pointerdown", (p) => {
      if (p.x < this.scale.width / 2) this.touchLeft = true;
      else this.touchRight = true;
      if (p.y > this.scale.height * 0.6) this.jump();
    });

    this.input.on("pointerup", () => {
      this.touchLeft = false;
      this.touchRight = false;
    });

    /** COLLISIONS **/
    this.physics.add.overlap(this.cat, this.coins, this.collectCoin, null, this);
    this.physics.add.collider(this.cat, this.obstacles, this.hitObstacle, null, this);

    this.startLevel();
  }

  update() {
    if (this.gameOver) return;

    if (this.cursors.left.isDown || this.touchLeft) this.cat.setVelocityX(-240);
    else if (this.cursors.right.isDown || this.touchRight) this.cat.setVelocityX(240);
    else this.cat.setVelocityX(0);

    this.coins.children.iterate(c => c && c.y > 550 && c.destroy());
    this.obstacles.children.iterate(o => o && o.y > 550 && o.destroy());
  }

  jump() {
    if (this.cat.body.blocked.down) this.cat.setVelocityY(-520);
  }

  /** LEVEL **/
  startLevel() {
    const level = this.levels[this.currentLevel];

    this.levelCoins = 0;
    this.levelCompleted = false;
    this.progressText.setText(`0 / ${this.coinsToNextLevel}`);
    this.levelText.setText(level.name);
    this.bg.setTexture(level.bg);

    this.showMessage(level.message);

    if (this.coinTimer) this.coinTimer.remove();
    if (this.obstacleTimer) this.obstacleTimer.remove();

    this.coinTimer = this.time.addEvent({ delay: level.coinRate, loop: true, callback: this.spawnCoin, callbackScope: this });
    this.obstacleTimer = this.time.addEvent({ delay: level.obstacleRate, loop: true, callback: this.spawnObstacle, callbackScope: this });
  }

  collectCoin(cat, coin) {
    // 🔥 HARD STOP: coin can be collected ONLY ONCE
    if (!coin.active || this.levelCompleted) return;

    // REMOVE FROM PHYSICS IMMEDIATELY
    coin.disableBody(true, true);

    this.score++;
    this.levelCoins++;

    this.scoreText.setText("JUP: " + this.score);
    this.progressText.setText(`${this.levelCoins} / ${this.coinsToNextLevel}`);

    if (this.levelCoins >= this.coinsToNextLevel) {
      this.levelCompleted = true;
      this.time.delayedCall(300, () => this.nextLevel());
    }
  }

  nextLevel() {
    this.currentLevel++;
    if (this.currentLevel >= this.levels.length) return this.endGame(true);
    this.startLevel();
  }

  spawnCoin() {
    const coin = this.coins.create(Phaser.Math.Between(80, 820), -30, "coin");
    coin.setScale(0.08);
    coin.body.setVelocityY(260);
    coin.body.setAllowGravity(false);
  }

  spawnObstacle() {
    const rug = this.obstacles.create(Phaser.Math.Between(120, 800), -40, "rug");
    rug.setScale(0.055);
    rug.body.setVelocityY(300);
    rug.body.setAllowGravity(false);
    rug.body.setImmovable(true);
  }

  hitObstacle() {
    this.endGame(false);
  }

  endGame(win) {
    this.gameOver = true;
    this.add.rectangle(450, 250, 900, 500, 0x000000, 0.6);
    this.add.text(450, 220, win ? "ROUTE COMPLETED 🪐" : "GAME OVER", { fontSize: "36px", color: "#fff" }).setOrigin(0.5);
    this.time.delayedCall(2000, () => this.scene.restart());
  }

  showMessage(text) {
    const t = this.add.text(450, 120, text, { color: "#fff", backgroundColor: "#000", padding: { x: 10, y: 6 } }).setOrigin(0.5);
    this.time.delayedCall(1000, () => t.destroy());
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 900,
  height: 500,
  parent: "game-container",
  physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: MainScene
});
