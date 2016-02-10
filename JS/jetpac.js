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
    }
    this.config = {
      masterSprite: undefined,
      assets: [],
      loadedAssets: 0,
      fps: 60,
      currentState: "loadingState",
      spriteSize: 64,
      pressedKeys: {},
      gravity: 40,
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
        this.initialised = true;
        var gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },1000/self.config.fps);
      },
      update: function(){
        if(self.config.pressedKeys[self.keys.SPACE]){
          clearInterval(self[self.config.currentState].gameLoop);
          self[self.config.currentState].initialised = false;
          self.config.pressedKeys = {};
          self.config.currentState = "storyState";
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
    this.storyState = {
      initialised: false,
      init: function(){
        console.log("story state initialised");
        this.initialised = true;
        var gameLoop = setInterval(function(){
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
        self.ctx.fillText("Story will appear here",20,self.canvas.height/2-20);
      }
    }
    this.gameState = {
      initialised: false,
      platforms: [],
      player: undefined,
      init: function(){
        console.log("game state initialised");
        this.initialised = true;

        this.platform = Object.create(self.spriteObject);
        this.platform.sourceY = 116;
        this.platform.height = 40;
        this.platform.draw = function(){
          for(var i = 0;i<this.width/64;i++){
            self.ctx.drawImage(self.config.masterSprite,
                                this.sourceX,this.sourceY,this.sourceHeight,this.sourceWidth,
                                this.x+this.sourceWidth*i,this.y,this.sourceWidth,this.sourceHeight)
          }
        }

        this.ground = Object.create(this.platform);
        this.ground.width = self.canvas.width;
        this.ground.y = self.canvas.height-this.ground.height;

        this.platform1 = Object.create(this.platform);
        this.platform1.width = 3*this.platform1.sourceWidth;
        this.platform1.y = 5*this.platform1.sourceHeight;
        this.platform1.x = 2*this.platform1.sourceWidth;

        this.platform2 = Object.create(this.platform);
        this.platform2.width = 4*this.platform1.sourceWidth;
        this.platform2.y = 3*this.platform1.sourceHeight;
        this.platform2.x = 11*this.platform1.sourceWidth;

        this.platforms.push(this.ground);
        this.platforms.push(this.platform1);
        this.platforms.push(this.platform2);

        this.player = Object.create(self.spriteObject);
        this.player.sourceWidth = 42;
        this.player.sourceHeight = 58;
        this.player.width = 42;
        this.player.height = 58;
        this.player.facing = 0;
        this.player.sideSpeed = 40;
        this.player.enginePower = 0;
        this.player.maxEnginePower = 70;
        this.player.onGround = false;
        this.player.frames = 3;
        this.player.currFrame = 0;
        this.player.dispFor = 10;
        this.player.dispTime = 0;
        this.player.x = self.canvas.width/2-this.player.width/2;
        this.player.y = self.canvas.height/2-this.player.height/2;
        this.player.draw = function(){
          self.ctx.drawImage(self.config.masterSprite,
                              this.sourceX+this.sourceWidth*this.currFrame,this.sourceY+this.height*this.facing,this.sourceWidth,this.sourceHeight,
                              this.x,this.y,this.width,this.height)
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
              this.enginePower +=0.5;
            }
          } else {
            this.currFrame = 0;
            this.enginePower -= 0.5;
            if(this.enginePower < 0){
              this.enginePower = 0;
            }
          }

          this.y += (self.config.gravity*(1/self.config.fps))-(this.enginePower*(1/self.config.fps));
          this.x = Math.max(0, Math.min(this.x, self.canvas.width - this.width));
          this.y = Math.max(0, Math.min(this.y, self.canvas.height - this.height));
        };

        var gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },1000/self.config.fps);
      },
      update: function(){
        if(this.player){
          this.player.update();
        }
        for(var i = 0; i<this.platforms.length;i++){
          this.blockRect(this.player,this.platforms[i])
        };
      },
      draw: function(){
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
        self.ctx.fillStyle = "#000";
        self.ctx.fillRect(0,0,self.canvas.width,self.canvas.height)
        for(var i = 0; i<this.platforms.length;i++){
          this.platforms[i].draw();
        }
        this.player.draw();
      },
      blockRect: function(r1,r2){
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
      },
    };

    return {
      init: function(){
        self.start();
      }
    }
})(canvas, ctx)

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d')

game.init(canvas,ctx);
