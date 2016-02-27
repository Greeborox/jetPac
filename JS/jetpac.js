var game = (function(){
    var self = this;
    this.canvas = canvas;
    this.ctx = ctx;
    this.keys = {
      SPACE: 32,
      UP: 38,
      DOWN: 40,
      LEFT: 37,
      RIGHT: 39,
      z: 90,
      x: 88,
    }
    this.config = {
      masterSprite: undefined,
      assets: [],
      loadedAssets: 0,
      fps: 60,
      currentState: "loadingState",
      spriteSize: 64,
      pressedKeys: {},
      gravity: 120,
      level: 1,
      lives: 3,
      score: 0,
    };
    this.spriteObject = {
      sourceX: 0,
      sourceY: 0,
      sourceWidth: this.config.spriteSize,
      sourceHeight: this.config.spriteSize,
      x: 0,
      y: 0,
      width: this.config.spriteSize,
      height: this.config.spriteSize,
      centerY: function() {
        return this.y + this.height/2
      },
      centerX: function() {
        return this.x + this.width/2
      },
    };
    this.activateKeys = function(){
      window.addEventListener("keydown", function keydown(e) {
        self.config.pressedKeys[e.keyCode] = true;
      },false)
      window.addEventListener("keyup", function keydown(e) {
        delete self.config.pressedKeys[e.keyCode];
      },false)
    };
    this.mainLoop = function(){
      window.requestAnimationFrame(self.mainLoop,self.canvas);
      if(self[self.config.currentState].init){
        if(!self[self.config.currentState].initialised){
          self[self.config.currentState].init();
        }
      }
      if(self[self.config.currentState].draw){
        self[self.config.currentState].draw();
      }
    };
    this.start = function(){
      this.activateKeys();
      this.mainLoop();
    }

    this.loadingState = {
      initialised: false,
      counter: 0,
      gameLoop: undefined,
      text: "Loading",
      init: function() {
        console.log("loading state initialised");
        this.initialised = true;
        this.loadAssets();
        this.gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },200)
      },
      draw: function() {
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
        self.ctx.font="20px Arial";
  			self.ctx.fillStyle = '#000';
  			self.ctx.textAlign = "left";
        self.ctx.fillText(this.text,20,self.canvas.height/2-20);
      },
      update: function(){
        if(this.counter < 3){
          this.text += '.';
          this.counter++;
        } else {
          this.counter = 0;
          this.text = "Loading";
        }
        if(self.config.loadedAssets === self.config.assets.length && self.config.assets.length > 0){
          clearInterval(self[self.config.currentState].gameLoop);
          self[self.config.currentState].initialised = false;
          self.config.currentState = "menuState";
        }
      },
      loadAssets : function(){
        self.config.masterSprite = new Image();
        self.config.masterSprite.src = "GFX/spriteSheet.png";
        self.config.masterSprite.addEventListener("load",function(){self.config.loadedAssets++},false)
        self.config.assets.push(self.config.masterSprite);
      }
    }
    this.menuState = {
      initialised: false,
      init: function(){
        console.log("menu state initialised");
        self.config.level = 1;
        self.config.lives = 3;
        self.config.score = 0;
        this.initialised = true;
        this.gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },1000/self.config.fps);
      },
      update: function(){
        if(self.config.pressedKeys[self.keys.SPACE]){
          clearInterval(self[self.config.currentState].gameLoop);
          self[self.config.currentState].initialised = false;
          self.config.pressedKeys = {};
          self.config.currentState = "announceState";
        }
      },
      draw: function(){
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
        self.ctx.font="20px Arial";
  			self.ctx.fillStyle = '#000';
  			self.ctx.textAlign = "left";
        self.ctx.fillText("Menu State",20,self.canvas.height/2-20);
      }
    }
    this.announceState = {
      initialised: false,
      init: function(){
        console.log("announce state initialised");
        this.initialised = true;
        this.gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },1000/self.config.fps);
      },
      update: function(){
        if(self.config.pressedKeys[self.keys.SPACE]){
          clearInterval(self[self.config.currentState].gameLoop);
          self[self.config.currentState].initialised = false;
          self.config.pressedKeys = {};
          self.config.currentState = "gameState";
        }
      },
      draw: function(){
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
        self.ctx.font="20px Arial";
  			self.ctx.fillStyle = '#000';
  			self.ctx.textAlign = "left";
        self.ctx.fillText("Loading level "+self.config.level,20,self.canvas.height/2-20);
        self.ctx.fillText("Your score: "+self.config.score,20,self.canvas.height/2-40);
      }
    }
    this.gameState = {
      initialised: false,
      gameLoop: undefined,
      platforms: [],
      rocketParts: [],
      bullets: [],
      monsters: [],
      monsterChance: 0.2,
      restartLevelTime: 60,
      player: undefined,
      rocket: undefined,
      init: function(){
        console.log("game state initialised");
        this.initialised = true;
        this.rocketComplete = false;
        this.rocketFuelMeter = 0;
        this.countDownToRestartLevel = 0;
        this.monsterInterval = 40;
        this.lastMonster = 0;
        this.messageMachine = {
          texts: [],
          dispTimes: [],
          dispLimit: 240,
          x: self.canvas.width/2,
          addMsg: function(msg) {
            this.texts.push(msg);
            this.dispTimes.push(0);
          },
          removeMsg: function(index) {
            this.texts.splice(index,1);
            this.dispTimes.splice(index,1);
          },
          updateMsgs: function(){
            for(var i = 0; i<this.dispTimes.length; i++) {
              if(this.dispTimes[i] <= this.dispLimit){
                this.dispTimes[i]++;
              } else {
                this.removeMsg(i);
              }
            }
          },
          drawMsgs: function() {
            for(var i = 0; i<this.texts.length; i++) {
              self.ctx.font="20px Arial";
        			self.ctx.fillStyle = '#FFF';
        			self.ctx.textAlign = "center";
              self.ctx.fillText(this.texts[i],self.canvas.width/2,25+(23*i));
            }
          },
        }

        this.platform = Object.create(self.spriteObject);
        this.platform.sourceY = 116;
        this.platform.sourceHeight = 44;
        this.platform.height = 44;
        this.platform.draw = function(){
          for(var i = 0;i<this.width/64;i++){
            self.ctx.drawImage(self.config.masterSprite,
                                this.sourceX,this.sourceY,this.sourceWidth,this.sourceHeight,
                                this.x+this.sourceWidth*i,this.y,this.sourceWidth,this.sourceHeight)
          }
        }

        this.ground = Object.create(this.platform);
        this.ground.width = self.canvas.width;
        this.ground.y = self.canvas.height-this.ground.height+5;

        this.platform1 = Object.create(this.platform);
        this.platform1.width = 3*this.platform1.sourceWidth;
        this.platform1.y = 4*this.platform1.sourceHeight;
        this.platform1.x = 1*this.platform1.sourceWidth;

        this.platform2 = Object.create(this.platform);
        this.platform2.width = 3*this.platform2.sourceWidth;
        this.platform2.y = 3*this.platform2.sourceHeight;
        this.platform2.x = 11*this.platform2.sourceWidth;

        this.platform3 = Object.create(this.platform);
        this.platform3.width = 2*this.platform3.sourceWidth;
        this.platform3.y = 7*this.platform3.sourceHeight;
        this.platform3.x = 6*this.platform3.sourceWidth;

        this.platforms.push(this.ground);
        this.platforms.push(this.platform1,this.platform2,this.platform3);

        this.rocketPart = Object.create(self.spriteObject)
        this.rocketPart.fallingOnPlace = false;
        this.rocketPart.onPlace = false;
        this.rocketPart.isCarried = false;
        this.rocketPart.onPlaceX = 590;
        this.rocketPart.update = function(){
          this.y += (self.config.gravity*(1/self.config.fps)/2)
        };
        this.rocketPart.draw = function(){
          if(!this.onPlace){
            self.ctx.drawImage(self.config.masterSprite,
                                this.sourceX,this.sourceY,this.sourceWidth,this.sourceHeight,
                                this.x,this.y,this.sourceWidth,this.sourceHeight)
          } else {
            self.ctx.drawImage(self.config.masterSprite,
                                this.sourceX,this.sourceY,this.sourceWidth,this.sourceHeight,
                                this.onPlaceX,this.onPlaceY,this.sourceWidth,this.sourceHeight)
          }
        }

        this.thruster = Object.create(this.rocketPart);
        this.thruster.onPlace = true;
        this.thruster.sourceY = 288;
        this.thruster.onPlaceY = self.gameState.ground.y+5 - this.thruster.height;

        this.cabin = Object.create(this.rocketPart);
        this.cabin.type = "cabin";
        this.cabin.prev = "thruster";
        this.cabin.x = 150;
        this.cabin.y = 60;
        this.cabin.sourceY = 224;
        this.cabin.onPlaceY = self.gameState.ground.y+5 - this.cabin.height*2;

        this.head = Object.create(this.rocketPart);
        this.head.type = "head";
        this.head.prev = "cabin";
        this.head.x = 750;
        this.head.y = 20;
        this.head.sourceY = 160;
        this.head.onPlaceY = self.gameState.ground.y+5 - this.head.height*3;

        this.fuelTank = Object.create(this.rocketPart);
        this.fuelTank.type = "fuel";
        this.fuelTank.x = -21;
        this.fuelTank.y = -40;
        this.fuelTank.onScreen = false;
        this.fuelTank.sourceX = 64;
        this.fuelTank.sourceY = 116;
        this.fuelTank.width = 21;
        this.fuelTank.height = 21;
        this.fuelTank.sourceWidth = 21;
        this.fuelTank.sourceHeight = 21;

        this.rocketParts.push(this.thruster,this.cabin,this.head);

        this.rocketLandingZone = {
          onPlaceParts: ["thruster"],
          x: 590,
          y: self.canvas.height-64-192,
          width: 64,
          height: 192,
          draw: function(){
            for(var i = 0; i<this.onPlaceParts.length;i++){
              if(this.onPlaceParts[i]){
                self.gameState[this.onPlaceParts[i]].draw();
              }
            }
          },
        };

        this.rocket = Object.create(self.spriteObject);
        this.rocket.sourceWidth = 64;
        this.rocket.sourceHeight = 192;
        this.rocket.width = 64;
        this.rocket.height = 192;
        this.rocket.sourceY = 160;
        this.rocket.x = 590;
        this.rocket.y = self.canvas.height-64-192;
        this.rocket.blastOff = false;
        this.rocket.draw = function(){
          self.ctx.drawImage(self.config.masterSprite,
                             this.sourceX,this.sourceY,this.sourceWidth,this.sourceHeight,
                             this.x,this.y,this.sourceWidth,this.sourceHeight)
        };
        this.rocket.update = function(){
          this.y -= 8;
        };

        this.player = Object.create(self.spriteObject);
        this.player.sourceWidth = 42;
        this.player.sourceHeight = 58;
        this.player.width = 42;
        this.player.height = 58;
        this.player.facing = 0;
        this.player.sideSpeed = 120;
        this.player.enginePower = 0;
        this.player.maxEnginePower = 240;
        this.player.onGround = false;
        this.player.carrying = false;
        this.player.inRocket = false;
        this.player.shooting = false;
        this.player.isHit = false;
        this.player.frames = 3;
        this.player.currFrame = 0;
        this.player.dispFor = 10;
        this.player.dispTime = 0;
        this.player.x = self.canvas.width/2-this.player.width/2;
        this.player.y = self.canvas.height/2-150;
        this.player.draw = function(){
          if(!this.isHit){
            self.ctx.drawImage(self.config.masterSprite,
                              this.sourceX+this.sourceWidth*this.currFrame,this.sourceY+this.height*this.facing,this.sourceWidth,this.sourceHeight,
                              this.x,this.y,this.width,this.height)
          };
        };
        this.player.update = function() {
          if(self.config.pressedKeys[self.keys.LEFT] && !self.config.pressedKeys[self.keys.RIGHT]) {
            this.facing = 1;
            if(!this.onGround){
              this.x -= this.sideSpeed*(1/self.config.fps)
            }
          }
          if(self.config.pressedKeys[self.keys.RIGHT] && !self.config.pressedKeys[self.keys.LEFT]) {
            this.facing = 0;
            if(!this.onGround){
              this.x += this.sideSpeed*(1/self.config.fps)
            }
          }
          if(self.config.pressedKeys[self.keys.UP]) {
            this.onGround = false;
            if(this.dispFor > this.dispTime){
              this.currFrame++;
              if(this.currFrame === this.frames){
                this.currFrame = 0;
              }
              this.dispFor = 0;
            } else {
              this.dispFor++;
            }
            if(this.enginePower <= this.maxEnginePower){
              this.enginePower +=6;
            }
          } else {
            this.currFrame = 0;
            this.enginePower -= 6;
            if(this.enginePower < 0){
              this.enginePower = 0;
            }
          }
          if(self.config.pressedKeys[self.keys.SPACE]){
            if(!this.shooting){
              var bulletY = this.y+this.height/2;
              var bulletX;
              if(!this.facing){
                bulletX = this.x+this.width;
              } else {
                bulletX = this.x;
              }
              self[self.config.currentState].shootBullet(bulletX,bulletY,this.facing);
              this.shooting = true;
            }
          } else {
            this.shooting = false;
          }

          this.y += (self.config.gravity*(1/self.config.fps))-(this.enginePower*(1/self.config.fps));
          this.x = Math.max(0, Math.min(this.x, self.canvas.width - this.width));
          this.y = Math.max(0, Math.min(this.y, self.canvas.height - this.height));
        };

        this.bullet = Object.create(self.spriteObject);
        this.bullet.width = 12;
        this.bullet.height = 4;
        this.bullet.sourceWidth = 12;
        this.bullet.sourceHeight = 4;
        this.bullet.sourceY = 352;
        this.bullet.direction = 0;
        this.bullet.speed = 460;
        this.bullet.update = function() {
          if(!this.direction){
            this.x += this.speed*(1/self.config.fps)
          } else {
            this.x -= this.speed*(1/self.config.fps)
          };
        };
        this.bullet.draw = function(){
          self.ctx.drawImage(self.config.masterSprite,
                              this.sourceX+this.width*this.direction,this.sourceY,this.sourceWidth,this.sourceHeight,
                              this.x,this.y,this.width,this.height)
        };

        this.monster = Object.create(self.spriteObject);
        this.monster.sourceX = 80;
        this.monster.sourceY = 146;
        this.monster.sourceWidth = 40;
        this.monster.sourceHeight = 30;
        this.monster.width = 40;
        this.monster.height = 30;
        this.monster.frames = 2;
        this.monster.speed = 120;
        this.monster.currFrame = 0;
        this.monster.dispFor = 0;
        this.monster.dispTime = 10;
        this.monster.direction = 0;
        this.monster.angle = 0;
        this.monster.baseY = 0;
        this.monster.value = 15;
        this.monster.waveRange = 30;
        this.monster.isShotDown = false;
        this.monster.lingerAfterShotDown = 30;
        this.monster.shotDownFor = 0;
        this.monster.update = function() {
          if(!this.isShotDown){
            if(this.dispFor > this.dispTime){
              this.currFrame++;
              if(this.currFrame === this.frames){
                this.currFrame = 0;
              }
              this.dispFor = 0;
            } else {
              this.dispFor++;
            }
            if(!this.direction){
              this.x += this.speed*(1/self.config.fps)
            } else {
              this.x -= this.speed*(1/self.config.fps)
            };
            this.y = this.baseY + Math.sin(this.angle) * this.waveRange;
            this.angle += 0.1;
            if(this.angle > Math.PI*2){
              this.angle = 0;
            };
          } else {
            this.shotDownFor++;
          }
        }
        this.monster.draw = function(){
          if(!this.isShotDown){
            var currSourceX = this.sourceX+this.sourceWidth*this.currFrame;
            var currSourceY = this.sourceY+(this.height*(self.config.level%3))
            self.ctx.drawImage(self.config.masterSprite,
                                currSourceX,currSourceY,this.sourceWidth,this.sourceHeight,
                                this.x,this.y,this.width,this.height);
          } else {
            self.ctx.drawImage(self.config.masterSprite,
                                80,236,this.sourceWidth,this.sourceHeight,
                                this.x,this.y,this.width,this.height);
          }
        }

        this.treasure = Object.create(spriteObject);
        this.treasure.sourceX = 80;
        this.treasure.sourceY = 266;
        this.treasure.sourceWidth = 40;
        this.treasure.sourceHeight = 30;
        this.treasure.width = 40;
        this.treasure.height = 30;
        this.treasure.y = -50;
        this.treasure.value = 250;
        this.treasure.onScreen = false;
        this.treasure.update = function(){
          this.y += (self.config.gravity*(1/self.config.fps)/2)
        };
        this.treasure.draw = function(){
            self.ctx.drawImage(self.config.masterSprite,
                                this.sourceX,this.sourceY,this.sourceWidth,this.sourceHeight,
                                this.x,this.y,this.sourceWidth,this.sourceHeight)
        }


        var msg = "welcome to Jetpac level "+self.config.level+". You have "+self.config.lives+" lives left."
        this.messageMachine.addMsg(msg);

        this.gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },1000/self.config.fps);
      },
      update: function(){
        if(this.player && !this.player.inRocket && !this.player.isHit){
          this.player.update();
          this.handlePlayerPickups();
        }
        if(this.player.isHit) {
          if(this.countDownToRestartLevel > this.restartLevelTime) {
            clearInterval(self[self.config.currentState].gameLoop);
            self[self.config.currentState].initialised = false;
            this.player = undefined;
            this.rocket = undefined;
            this.rocketLandingZone = undefined;
            this.rocketParts = [];
            this.bullets = [];
            this.monsters = [];
            self.config.pressedKeys = {};
            self.config.lives--;
            if(self.config.lives > 0) {
              self.config.currentState = "announceState";
            } else {
              self.config.currentState = "gameOver";
            }

          }
          this.countDownToRestartLevel++
        }
        if(this.fuelTank && this.fuelTank.onScreen){
          this.fuelTank.update();
        }
        this.spawnTreasure();
        if(this.treasure && this.treasure.onScreen){
          this.treasure.update();
          if(this.checkCollision(this.player,this.treasure)){
            this.collectTreasure();
          }
        }
        // update items
        for(var i = 0; i < this.rocketParts.length; i++) {
          this.rocketParts[i].update();
      	  if(this.rocketParts[i].isCarried) {
            this.dropItemToZone(this.rocketParts[i])
      	    this.updateCarriedItem(this.rocketParts[i])
          }
          if(this.rocketParts[i].fallingOnPlace) {
            this.itemFallingOnPlace(this.rocketParts[i]);
          }
        }
        for(var i = 0; i < this.bullets.length; i++) {
          this.bullets[i].update();
          if(this.bullets[i].x < 0 - this.bullets[i].width ||
             this.bullets[i].x > self.canvas.width + this.bullets[i].width){
               this.bullets.splice[i,1];
             }
        }
        for(var i = 0; i < this.monsters.length; i++) {
          this.monsters[i].update();
          if(this.monsters[i].isShotDown && this.monsters[i].shotDownFor > this.monsters[i].lingerAfterShotDown) {
            this.monsters.splice(i,1);
          } else if(this.monsters[i].x < -100 ||
             this.monsters[i].x > self.canvas.width + 100){
               this.monsters.splice(i,1);
               i--;
          }
        }
        this.checkMonsterCollision();
        if(this.lastMonster > (this.monsterInterval-self.config.level)) {
          this.spawnMonster();
          this.lastMonster = 0;
        } else {
          this.lastMonster++;
        }
        if(this.fuelTank && this.fuelTank.isCarried) {
          this.dropItemToZone(this.fuelTank)
      	  this.updateCarriedItem(this.fuelTank)
        }
        if(this.fuelTank && this.fuelTank.fallingOnPlace) {
          this.itemFallingOnPlace(this.fuelTank);
        }
        //blocking player and items against platforms
        for(var i = 0; i<this.platforms.length;i++){
          for(var j = 0; j<this.rocketParts.length;j++){
            this.blockRect(this.rocketParts[j],this.platforms[i]);
          };
          this.blockRect(this.player,this.platforms[i]);
          this.blockRect(this.fuelTank,this.platforms[i]);
          this.blockRect(this.treasure,this.platforms[i]);
        };

        //checkign if rocket is complete
        if(this.rocketLandingZone &&
           this.rocketLandingZone.onPlaceParts.length === 3 &&
           !this.fuelTank.onScreen &&
           this.rocketFuelMeter < 100){
             this.spawnFuelTank();
           }
        //check if player got into rocket
        if(this.rocketFuelMeter >= 100){
          if(this.checkCollision(this.player,this.rocketLandingZone)){
            if(!this.player.inRocket){
              this.messageMachine.addMsg("You made it!");
            }
            this.player.inRocket = true;
            this.rocket.blastOff = true;
            self.config.score += 100*self.config.level;
          }
        }
        //update the blastOff rocket
        if(this.rocket && this.rocket.blastOff){
          this.rocket.update();
        }
        //update messages
        if(this.messageMachine && this.messageMachine.texts.length > 0){
          this.messageMachine.updateMsgs();
        }
        if(this.rocket && this.rocket.blastOff && this.rocket.y < -200){
          clearInterval(self[self.config.currentState].gameLoop);
          self[self.config.currentState].initialised = false;
          this.player = undefined;
          this.rocket = undefined;
          this.rocketLandingZone = undefined;
          this.rocketParts = [];
          this.bullets = [];
          this.monsters = [];
          self.config.pressedKeys = {};
          self.config.level++;
          self.config.currentState = "announceState";
        }
      },
      draw: function(){
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
        self.ctx.fillStyle = "#000";
        self.ctx.fillRect(0,0,self.canvas.width,self.canvas.height)
        if(!this.rocket.blastOff){
          for(var i = 0; i<this.rocketParts.length;i++){
            this.rocketParts[i].draw();
          };
        }
        for(var i = 0; i<this.platforms.length;i++){
          this.platforms[i].draw();
        }
        if(!this.rocket.blastOff){
          this.rocketLandingZone.draw();
        } else {
          this.rocket.draw();
        }
        if(this.fuelTank.onScreen){
          this.fuelTank.draw();
        };
        if(this.treasure.onScreen){
          this.treasure.draw();
        };
        if(!this.player.inRocket){
          this.player.draw();
        };
        for(var i = 0; i < this.bullets.length; i++) {
          this.bullets[i].draw();
        }
        for(var i = 0; i < this.monsters.length; i++) {
          this.monsters[i].draw();
        }
        this.drawGui();
        if(this.messageMachine && this.messageMachine.texts.length > 0){
          this.messageMachine.drawMsgs();
        }
      },
      collectTreasure: function(){
        self.config.score += this.treasure.value*self.config.level;
        this.treasure.x = -41;
        this.treasure.y = -40;
        this.treasure.onScreen = false;
      },
      spawnTreasure: function(){
        if(!this.treasure.onScreen){
          var treasureChance = Math.random();
          console.log(treasureChance)
          if(treasureChance < 0.005){
            var treasureType = Math.random();
            this.treasure.sourceY = treasureType > 0.5 ? 266 : 296;
            var newX = Math.floor(Math.random()*(self.canvas.width-21));
            this.treasure.x = newX;
            this.treasure.onScreen = true;
          }
        }
      },
      checkMonsterCollision: function() {
        for(var i = 0; i < this.monsters.length; i++){
          var monster = this.monsters[i];
          if(!monster.isShotDown){
            for(var j = 0; j < this.bullets.length; j++){
              var bullet = this.bullets[j];
              if(this.checkCollision(monster,bullet)){
                monster.isShotDown = true;
                this.bullets.splice(j,1);
                self.config.score += monster.value*self.config.level;
              }
            }
            if(this.checkCollision(monster,this.player)){
              if(!this.player.isHit){
                this.messageMachine.addMsg("Oh no! You have been hit!");
              }
              this.player.isHit = true;
            }
          }
        }
      },
      spawnMonster: function() {
        var rand = Math.random();
        if(rand < this.monsterChance) {
          var randDirection = Math.random();
          var direction = randDirection < 0.5 ? 0 : 1;
          var newY = Math.floor(Math.random() * ((self.canvas.height-64) - 40) + 40);
          var newMonster = Object.create(this.monster);
          var randWave = Math.floor(Math.random() * (45 - 15) + 15);
          newMonster.x = direction ? self.canvas.width : -40;
          newMonster.baseY = newY;
          newMonster.direction = direction;
          newMonster.waveRange = randWave;
          this.monsters.push(newMonster);
          //console.log(this.monsters.length);
        }
      },
      shootBullet: function(x,y,direction) {
        var newBullet = Object.create(this.bullet);
        newBullet.direction = direction;
        newBullet.x = x;
        newBullet.y = y;
        this.bullets.push(newBullet);
      },
      drawGui: function() {

      },
      resetFuelTank: function(){
        this.fuelTank.x = -21;
        this.fuelTank.y = -40;
        this.fuelTank.onScreen = false;
      },
      itemFallingOnPlace: function(item){
        item.x = this.rocketLandingZone.x;
        item.x += this.rocketLandingZone.width/2;
        item.x -= item.width/2 ;
        if(item.y > this.ground.y-item.height-20){
          if('onPlace' in item){
            item.fallingOnPlace = false;
            if(item.type != 'fuel'){
              item.onPlace = true;
              this.rocketLandingZone.onPlaceParts.push(item.type);
              this.messageMachine.addMsg(item.type + " deployed");
              if(this.rocketLandingZone.onPlaceParts.length === 3) {
                this.messageMachine.addMsg("the space ship is ready, now fill it's fuel tanks!")
              } else {
                this.messageMachine.addMsg("the space ship is almost ready, only the rocket head to go")
              }
            } else {
              this.rocketFuelMeter += 20;
              this.resetFuelTank();
              this.messageMachine.addMsg("You add some fuel to the space ship!");
              if(this.rocketFuelMeter >= 100) {
                this.messageMachine.addMsg("The fuel tanks are full! get into the ship and get out of here!")
              } else {
                this.messageMachine.addMsg("The fuel tanks are "+this.rocketFuelMeter+" percent full. Keep 'em coming'")
              }
            }
          }
        }
      },
      spawnFuelTank: function(){
        var newX = Math.floor(Math.random()*(self.canvas.width-21));
        this.fuelTank.x = newX;
        this.fuelTank.onScreen = true;
      },
      updateCarriedItem: function(item){
        var player = this.player;
        item.x = player.x+player.width/2-item.width/2;
        item.y = player.y+player.height/2-item.height/2;
      },
      dropItemToZone: function(item){
        var item = item;
        var zone = this.rocketLandingZone;
        if(item.x+item.width > zone.x+(item.width/2) && item.x < zone.x+zone.width-(item.width/2)){
          if(zone.onPlaceParts[zone.onPlaceParts.length-1] == item.prev ||
             this.fuelTank.isCarried) {
            this.player.carrying = false;
            item.isCarried = false;
            item.fallingOnPlace = true;
            this.messageMachine.addMsg("You deploy the "+item.type);
          }
        }
      },
      handlePlayerPickups: function(){
        var p = this.player;
        var fuel = this.fuelTank
        if(self.config.pressedKeys[self.keys.z]){
          if(!this.player.carrying){
            for(var i = 0; i < this.rocketParts.length; i++){
              var rocketP = this.rocketParts[i];
              if(this.checkCollision(p,rocketP) && !rocketP.isCarried && !rocketP.fallingOnPlace) {
                p.carrying = true;
                rocketP.isCarried = true;
                this.messageMachine.addMsg("You pick up the "+rocketP.type)
              }
            }
            if(fuel.onScreen){
              if(this.checkCollision(p,fuel) && !fuel.isCarried && !fuel.fallingOnPlace) {
                p.carrying = true;
                fuel.isCarried = true;
                this.messageMachine.addMsg("You pick up the fuel tank")
              }
            }
          }
        }
        if(self.config.pressedKeys[self.keys.x]){
          for(var i = 0; i < this.rocketParts.length; i++){
            if(this.rocketParts[i].isCarried) {
              this.rocketParts[i].isCarried = false;
              this.player.carrying = false;
              this.messageMachine.addMsg("You drop the "+this.rocketParts[i].type)
            }
          }
          if(this.fuelTank.isCarried) {
            this.fuelTank.isCarried = false;
            this.player.carrying = false;
            this.messageMachine.addMsg("You drop the fuel tank")
          }
        }
      },
      blockRect: function(r1,r2){
        if(r1&&r2){
          var vx = r1.centerX() - r2.centerX();
          var vy = r1.centerY() - r2.centerY();
          var combinedHalfWidths = r1.width/2 + r2.width/2;
          var combinedHalfHeights = r1.height/2 + r2.height/2;
          if(Math.abs(vx) < combinedHalfWidths){
            if(Math.abs(vy) < combinedHalfHeights){
              var overlapX = combinedHalfWidths - Math.abs(vx);
              var overlapY = combinedHalfHeights - Math.abs(vy);
              if(overlapX >= overlapY) {
                if(vy > 0) {
                  r1.y = r1.y + overlapY;
                } else {
                  if(r1.hasOwnProperty('onGround'))
                  r1.onGround = true;
                  r1.y = r1.y - overlapY;
                }
              } else {
                if(vx > 0) {
                  r1.x = r1.x + overlapX;
                } else {
                  r1.x = r1.x - overlapX;
                }
              }
            }
          }
        }
      },
      checkCollision: function(obj1,obj2) {
        return !(obj1.x + obj1.width < obj2.x ||
                 obj2.x + obj2.width < obj1.x ||
                 obj1.y + obj1.height < obj2.y ||
                 obj2.y + obj2.height < obj1.y);
      },
    };
    this.gameOver = {
      initialised: false,
      init: function(){
        console.log("game Over state initialised");
        this.initialised = true;
        this.gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },1000/self.config.fps);
      },
      update: function(){
        if(self.config.pressedKeys[self.keys.SPACE]){
          clearInterval(self[self.config.currentState].gameLoop);
          self[self.config.currentState].initialised = false;
          self.config.pressedKeys = {};
          self.config.currentState = "menuState";
        }
      },
      draw: function(){
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
        self.ctx.font="20px Arial";
  			self.ctx.fillStyle = '#000';
  			self.ctx.textAlign = "left";
        self.ctx.fillText("Game Over",20,self.canvas.height/2-20);
        self.ctx.fillText("score: "+self.config.score,20,self.canvas.height/2-40);
      }
    }

    return {
      init: function(){
        self.start();
      }
    }
})(canvas, ctx)

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d')

game.init(canvas,ctx);
