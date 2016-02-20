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
      rocketParts: [],
      player: undefined,
      init: function(){
        console.log("game state initialised");
        this.initialised = true;

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
        this.ground.y = self.canvas.height-this.ground.height-25;

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
        this.thruster.onPlaceY = self.gameState.ground.y - this.thruster.height;

        this.cabin = Object.create(this.rocketPart);
        this.cabin.type = "cabin";
        this.cabin.prev = "thruster";
        this.cabin.x = 150;
        this.cabin.y = 60;
        this.cabin.sourceY = 224;
        this.cabin.onPlaceY = self.gameState.ground.y - this.cabin.height*2;

        this.head = Object.create(this.rocketPart);
        this.head.type = "head";
        this.head.prev = "cabin";
        this.head.x = 750;
        this.head.y = 20;
        this.head.sourceY = 160;
        this.head.onPlaceY = self.gameState.ground.y - this.head.height*3;

        this.rocketParts.push(this.thruster,this.cabin,this.head);

        this.rocketLandingZone = {
          onPlaceParts: ["thruster"],
          x: 590,
          width: 64,
          draw: function(){
            for(var i = 0; i<this.onPlaceParts.length;i++){
              self.gameState[this.onPlaceParts[i]].draw();
            }
          },
        }

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
        this.player.carrying = false;
        this.player.frames = 3;
        this.player.currFrame = 0;
        this.player.dispFor = 10;
        this.player.dispTime = 0;
        this.player.x = self.canvas.width/2-this.player.width/2;
        this.player.y = self.canvas.height/2-150;
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
          this.handlePlayerPickups();
        }
        // check if something needs to be droped
        for(var i = 0; i < this.rocketParts.length; i++){
          if(this.rocketParts[i].isCarried) {
            this.dropItemToZone(this.rocketParts[i])
          }
        }
        // updated carried item location
        for(var i = 0; i < this.rocketParts.length; i++){
          var p = this.player;
          if(this.rocketParts[i].isCarried) {
            this.updateCarriedItem(this.rocketParts[i])
          }
        };
        //blocking player and items against platforms
        for(var i = 0; i<this.platforms.length;i++){
          for(var j = 0; j<this.rocketParts.length;j++){
            this.blockRect(this.rocketParts[j],this.platforms[i]);
          };
          this.blockRect(this.player,this.platforms[i]);
        };
        //putting the item on place
        for(var i = 0; i<this.rocketParts.length;i++){
          var part = this.rocketParts[i];
          part.update();
          if(part.fallingOnPlace) {
            this.itemFallingOnPlace(part);
          }
        };
      },
      draw: function(){
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
        self.ctx.fillStyle = "#000";
        self.ctx.fillRect(0,0,self.canvas.width,self.canvas.height)
        for(var i = 0; i<this.rocketParts.length;i++){
          this.rocketParts[i].draw();
        };
        for(var i = 0; i<this.platforms.length;i++){
          this.platforms[i].draw();
        }
        this.rocketLandingZone.draw();
        this.player.draw();
      },
      itemFallingOnPlace: function(item){
        item.x = this.rocketLandingZone.x;
        if(item.y > this.ground.y-item.height-50){
          if('onPlace' in item){
            this.rocketLandingZone.onPlaceParts.push(item.type);
            item.fallingOnPlace = false;
            item.onPlace = true;
          }
        }
      },
      updateCarriedItem: function(item){
        var item = item;
        item.x = this.player.x-15;
        item.y = this.player.y-5;
      },
      dropItemToZone: function(item){
        var item = item;
        var zone = this.rocketLandingZone;
        if(item.x+item.width > zone.x+25 && item.x < zone.x+zone.width-25){
          if(zone.onPlaceParts[zone.onPlaceParts.length-1] == item.prev) {
            this.player.carrying = false;
            item.isCarried = false;
            item.fallingOnPlace = true;
          }
        }
      },
      handlePlayerPickups: function(){
        if(self.config.pressedKeys[self.keys.z]){
          if(!this.player.carrying){
            for(var i = 0; i < this.rocketParts.length; i++){
              var p = this.player;
              var rocketP = this.rocketParts[i];
              if(this.checkCollision(p,rocketP) && !rocketP.isCarried && !rocketP.fallingOnPlace) {
                p.carrying = true;
                rocketP.isCarried = true;
              }
            }
          }
        }
        if(self.config.pressedKeys[self.keys.x]){
          for(var i = 0; i < this.rocketParts.length; i++){
            if(this.rocketParts[i].isCarried) {
              this.rocketParts[i].isCarried = false;
              this.player.carrying = false;
            }
          }
        }
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
      checkCollision: function(obj1,obj2) {
        return !(obj1.x + obj1.width < obj2.x ||
                 obj2.x + obj2.width < obj1.x ||
                 obj1.y + obj1.height < obj2.y ||
                 obj2.y + obj2.height < obj1.y);
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
