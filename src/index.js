console.log('hello world')
// img = document.createElement('img')
// img.src = './assets/alien.png'
// document.querySelector('body').appendChild(img)

const gameState = {};
let bullets;
let ship;
let speed;
let stats;
let cursors;
let lastFired = 0;

var Bullet = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:

    function Bullet (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

        this.speed = Phaser.Math.GetSpeed(400, 1);

    },

    fire: function (x, y)
    {
        this.setPosition(x, y + 5)
        this.setActive(true);
        this.setVisible(true);
    },

    update: function (time, delta)
    {
        this.x += this.speed * delta;

        if (this.x > 820)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }

});

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.heights = [4, 7, 5, null, 5, 4, null, 4, 4]
  }

  preload() {
    this.load.image('bg', './assets/space1.png');
    // this.load.image('bg', './assets/bkgd_0.png');
    this.load.image('bg2', './assets/bkgd_1.png');
    this.load.image('bg3', './assets/bkgd_4.png');

    //this.load.image('bullet', 'assets/sprites/purple_ball.png')

    this.load.image('bug1', 'https://s3.amazonaws.com/codecademy-content/courses/learn-phaser/physics/bug_1.png');
		this.load.image('bug2', 'https://s3.amazonaws.com/codecademy-content/courses/learn-phaser/physics/bug_2.png');
		this.load.image('bug3', 'https://s3.amazonaws.com/codecademy-content/courses/learn-phaser/physics/bug_3.png');

    this.load.image('platform', 'https://s3.amazonaws.com/codecademy-content/courses/learn-phaser/Codey+Tundra/platform.png');
    // this.load.spritesheet('alien', './assets/alien.png', {frameWidth: 83, frameHeight: 116});
    this.load.spritesheet('bullet', './assets/rgblaser.png', {frameWidth: 4, frameHeight: 4});
    this.load.multiatlas('alien', './assets/alien.json', 'assets');
  }

  create() {
    gameState.active = true;
    // gameState.platforms = this.physics.add.group();
    // gameState.platforms.setAll('body.allowGravity', false);

    gameState.cursors = this.input.keyboard.createCursorKeys();

    gameState.bg = this.add.tileSprite(0, 0, 0, 0, 'bg').setOrigin(0, 0);
    gameState.bg2 = this.add.tileSprite(0, 0, 0, 0, 'bg2').setOrigin(0, 0);
    gameState.bg3 = this.add.tileSprite(0, 0, 0, 0, 'bg3').setOrigin(0, -100);
    gameState.bg.setScale(1.25);

    gameState.player = this.physics.add.sprite(config.width / 4, 0, 'alien', 'idle/01').setScale(.8);
    gameState.player.body.gravity.y = 800;


    this.createPlatforms();
    gameState.platform1 = this.physics.add.sprite(config.width / 3, 500, 'platform');
    gameState.platform2 = this.physics.add.sprite( (2 * config.width) / 3, 400, 'platform');
    gameState.platform3 = this.physics.add.sprite(config.width, 300, 'platform');
    gameState.platforms = [gameState.platform1, gameState.platform2, gameState.platform3]
    gameState.platforms.forEach(platform => {
      platform.body.allowGravity = false;
      platform.body.immovable = true;
      platform.setVelocityX(-100);

      this.physics.add.collider(gameState.player, platform);
    })
    const platformGen = () => {
      const yCoord = Math.random() * (window.innerHeight - 200) + 150;
      let randomPlatform = this.physics.add.sprite(gameState.bg.width + 300, yCoord, 'platform')
      randomPlatform.body.allowGravity = false;
      randomPlatform.body.immovable = true;
      randomPlatform.setVelocityX(-100);
      this.physics.add.collider(gameState.player, randomPlatform);
    }

    const platformGenLoop = this.time.addEvent({
      delay: 3000,
      callback: platformGen,
      callbackScope: this,
      loop: true,
    });

    this.createAnimations();


    gameState.player.setCollideWorldBounds(true);
    gameState.player.setSize(62, 105, true);
    gameState.player.setOffset(-10, 0);

    this.cameras.main.setBounds(0, 0, gameState.bg.width, gameState.bg.height);
    this.physics.world.setBounds(0, 0, gameState.width, gameState.bg3.height + gameState.player.height);


    this.cameras.main.startFollow(gameState.player, true, 0.5, 0.5)



    // bugs

    const bugs = this.physics.add.group();

    const bugList = ['bug1', 'bug2', 'bug3']

    const bugGen = () => {
      const xCoord = Math.random() * window.innerWidth * 2
      let randomBug = bugList[Math.floor(Math.random() * 3)]
      bugs.create(xCoord, 10, randomBug).body.gravity.y = 800;
    }

    const bugGenLoop = this.time.addEvent({
      delay: 400,
      callback: bugGen,
      callbackScope: this,
      loop: true,
    });

    // this.physics.add.collider(bugs, gameState.platforms, function (bug) {
    //   bug.destroy()
    // })

    this.physics.add.collider(gameState.player, bugs, () => {
      gameState.player.play('die', true);
      gameState.active = false;
      bugGenLoop.destroy();
      platformGenLoop.destroy();
      this.physics.pause();
      console.log(this)
      this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Game Over', { fontSize: '15px', fill: '#ffffff' });
      this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 50, 'Click to Restart', { fontSize: '15px', fill: '#ffffff' });

      this.input.on('pointerup', () => {
        gameState.score = 0;
        this.scene.restart();
      });
    });


    // gameState.player.frame = 5



    //  Limited to 20 objects in the pool, not allowed to grow beyond it
    // bullets = this.pool.createObjectPool(Bullet, 20);

    bullets = this.physics.add.group({
        classType: Bullet,
        maxSize: 40,
        runChildUpdate: true
    });

    //  Create the objects in advance, so they're ready and waiting in the pool
    bullets.create(20);

    this.physics.add.overlap(bugs, bullets, function(bug) {
      bug.destroy();
    })

    cursors = this.input.keyboard.createCursorKeys();

    speed = Phaser.Math.GetSpeed(300, 1);


  }

  createPlatforms() {

  }


  createAnimations() {

    // attack
    const attackFrames = this.anims.generateFrameNames('alien', {
                        start: 1, end: 4, zeroPad: 2,
                        prefix: 'attack/'
                    });
    this.anims.create({ key: 'attack', frames: attackFrames, frameRate: 10, repeat: 5 });
    // attack option 2 --> 'draw' 'fire'
    const drawFrames = this.anims.generateFrameNames('alien', {
                        start: 1, end: 5, zeroPad: 2,
                        prefix: 'fire/'
                    });
    this.anims.create({ key: 'draw', frames: drawFrames, frameRate: 10, repeat: 0});

    const fireFrames = this.anims.generateFrameNames('alien', {
                        start: 6, end: 11, zeroPad: 2,
                        prefix: 'fire/'
                    });
    this.anims.create({ key: 'fire', frames: fireFrames, frameRate: 10, repeat: -1 });

    // walk
    const walkFrames = this.anims.generateFrameNames('alien', {
      start: 1, end: 6, zeroPad: 2, prefix: 'walk/'
    })
    this.anims.create({key: 'walk', frames: walkFrames, frameRate: 10, repeat: -1 })
    // jump
    const jumpFrames = this.anims.generateFrameNames('alien', {
      start: 1, end: 4, zeroPad: 2, prefix: 'jump/'
    })
    this.anims.create({key: 'jump', frames: jumpFrames, frameRate: 10 })
    // die
    const deathFrames = this.anims.generateFrameNames('alien', {
      start: 1, end: 5, zeroPad: 2, prefix: 'dead/'
    })
    this.anims.create({key: 'die', frames: deathFrames, frameRate: 5})

  }

  createPlatforms() {

  }


  update(time, delta) {

    gameState.bg2.tilePositionX += 5;
    gameState.bg3.tilePositionX += 10;
    // gameState.platform1.x -= 1

    if (gameState.active) {

      if (gameState.cursors.right.isDown) {
        gameState.player.flipX = false;
        gameState.player.setVelocityX(300);
      }
      else if (gameState.cursors.left.isDown) {
        gameState.player.flipX = true;
        gameState.player.setVelocityX(-200);
      }
      else {
        gameState.player.anims.play('walk', true)
        gameState.player.setVelocityX(0);
      }

      if (Phaser.Input.Keyboard.JustDown(gameState.cursors.up) && gameState.player.body.touching.down) {
        // gameState.player.setVelocity(250);
        gameState.player.setVelocityY(-600);
        gameState.player.anims.play('jump', true);
      }


      if (!gameState.player.body.touching.down){
        // gameState.player.anims.play('jump', true);
      };


      if (gameState.player.y > gameState.bg3.height - 1300) {
        gameState.player.anims.play('die', true);
        this.cameras.main.shake(240, .01, false, function(camera, progress) {
          if (progress > .9) {
            this.scene.restart(this.levelKey);
          }
        });
      }

      // BUTTON FOR SHOOTING
      if (gameState.cursors.space.isDown && time > lastFired) {
        gameState.player.anims.play('fire', true);
          var bullet = bullets.get();

           if (bullet){
               bullet.fire(gameState.player.x, gameState.player.y);
               lastFired = time + 50;
           }
       }

    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth - 15,
  height: window.innerHeight - 25,
  backgroundColor: "010408",
  physics: {
    default: 'arcade',
    arcade: {
      //debug: true,
      //gravity: { y: 800 },
      enableBody: true,
    }
  },
  scene: [StartScene, GameScene]
};

const game = new Phaser.Game(config);
