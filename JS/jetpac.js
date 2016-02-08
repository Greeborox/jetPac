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
      /*if(self[self.config.currentState].update){
        self[self.config.currentState].update();
      }*/
      if(self[self.config.currentState].draw){
        self[self.config.currentState].draw();
      }
      /*if(self[self.config.currentState].toLeave){
        var nextState = self[self.config.currentState].nextState;
        self.pressedKeys = {};
        self[self.config.currentState].initialised = false;
        self[self.config.currentState].toLeave = false;
        self[self.config.currentState].nextState = "";
        self.config.currentState = nextState;
      }*/
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
        console.log("state initialised");
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
        console.log("state initialised");
        this.initialised = true;
        var gameLoop = setInterval(function(){
          self[self.config.currentState].update();
        },1000/self.config.fps);
      },
      update: function(){
        console.log("test");
        if(self.config.pressedKeys[self.keys.SPACE]){
          console.log("Space Pressed")
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


    return {
      init: function(){
        self.start();
      }
    }
})(canvas, ctx)

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d')

game.init(canvas,ctx);
