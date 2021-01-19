var c = document.getElementById('canvas');
var ctx = c.getContext('2d');
var key = 39;
var w = 660; //ctx.canvas.clientWidth;
var h = 510; //ctx.canvas.clientHeight;
c.width = w;
c.height = h;
var speed = 5;
var enemy = {};
var enemyID;
var pause = false;

socket.on('re', function(arr) {
  delete arr[player.id];
  if (arr) {
    enemy = arr;
    enemyID = Object.keys(enemy);
  }
})

var Vector = function(x,y) {
  this.x = x;
  this.y = y;
};

Vector.left = new Vector(-speed, 0);
Vector.up = new Vector(0, -speed);
Vector.right = new Vector(speed, 0);
Vector.down = new Vector(0, speed);

Vector.add = function(v1, v2) {
  return new Vector(v1.x + v2.x, v1.y + v2.y);
}

var Player = function() {
  this.pos = new Vector(~~(Math.random()*(w-360)) + 50, ~~(Math.random()*(h-50)) + 50)
  //this.c = '#B60C48',//'#' + Math.floor(Math.random()*16777215).toString(16);
  this.dir = Vector.right;
  this.tail = [this.pos, this.pos];
  socket.emit('created', player);
  // ctx.fillStyle = this.c;
  // ctx.strokeStyle = this.c;
};

var player = new Player();

socket.on('id', function(id) {
  player.id = id;
});

socket.on('sync', function() {
  if(!pause){
    player.tail.push(player.pos);
    socket.emit('syncReady', player);
  }
})

function reset(){
  player = new Player();
  key = 39;
  socket.emit('dead', 'T_T');
}


function line_intersects(v1, v2, v3, v4) {

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = v2.x - v1.x;
    s1_y = v2.y - v1.y;
    s2_x = v4.x - v3.x;
    s2_y = v4.y - v3.y;

    var s, t;
    s = (-s1_y * (v1.x - v3.x) + s1_x * (v1.y - v3.y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (v1.y - v3.y) - s2_y * (v1.x - v3.x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s > 0 && s <= 1 && t > 0 && t <= 1)
    {
      return true;
    }
    return false;
}

// function point(x,y){
//   ctx.fillRect(x,y,5,5);
// }

function line (tail, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(tail[0].x, tail[0].y);
  for (var i = 1; i < tail.length; i++) {
    ctx.lineTo(tail[i].x, tail[i].y);
  };
  ctx.stroke();
  ctx.closePath();
}

document.body.addEventListener("keydown", function (e) {
  if( Math.abs(e.keyCode - key) !== 2 ) {
    key = e.keyCode;
    switch(key) {
      case 37: //left
        player.dir = Vector.left;
        break;
      case 38: //up
        player.dir = Vector.up;
        break;
      case 39: //right
        player.dir = Vector.right;
        break;
      case 40: //down
        player.dir = Vector.down;
        break;
    }
    player.tail.push(player.pos);
    socket.emit("keyUpdate", player);
  }
});

window.addEventListener('blur', function() {
  pause = true;
  // socket.emit('dead', 'blur');
  reset();
})

window.addEventListener('focus', function() {
  pause = false;
  //player = new Player();
})


function grid(){
  for(var i = 0; i <= w; i+=30){
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255, 0.2)";
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.moveTo(0, i);
    ctx.lineTo(w, i);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}


var head; //?
function update () {
  ctx.clearRect(0,0,w,h);
  grid();

if (!pause) {

  var parts = []
  for (var i = 0; i < player.tail.length - 1; i++) {
    parts.push([player.tail[i], player.tail[i+1]])
  };
  head = parts.pop();
  if(parts.length > 0){
  for (var i = 0; i < parts.length; i++) {
    if(line_intersects(head[0], head[1], parts[i][0], parts[i][1])){
      reset();
      break;
    }
  }
  }
  player.pos = Vector.add(player.pos, player.dir);
  player.tail[player.tail.length - 1] = player.pos;
  line(player.tail, '#B60C48');

  if(player.pos.x > w || player.pos.y > h || player.pos.x < 0 || player.pos.y < 0) {
    reset();
  }
}

  if(enemyID) {
    for (var i = 0; i < enemyID.length; i++) {
      if(enemy[enemyID[i]]){
        var e = enemy[enemyID[i]].tail.slice();
        var partsE = []
        for (var i1 = 0; i1 < e.length - 1; i1++) {
          partsE.push([e[i1], e[i1+1]])
        };
        if(partsE.length > 0){
        for (var i2 = 0; i2 < partsE.length; i2++) {
          if(line_intersects(head[0], head[1], partsE[i2][0], partsE[i2][1])){
            reset();
            break;
          }
        }
        }

        enemy[enemyID[i]].pos = Vector.add(enemy[enemyID[i]].pos, enemy[enemyID[i]].dir);
        enemy[enemyID[i]].tail[enemy[enemyID[i]].tail.length - 1] = enemy[enemyID[i]].pos;
        line(enemy[enemyID[i]].tail, '#0F868F');
      }
    }
  }

  requestAnimationFrame(update);

}

update();



// var lastCalledTime;
// var fps;
// var delta;


//   if(!lastCalledTime) {
//      lastCalledTime = Date.now();
//      fps = 0;
//   }
//   delta = (new Date().getTime() - lastCalledTime)/1000;
//   lastCalledTime = Date.now();
//   fps = 1/delta;

//   if (fps < 30 ) socket.emit("fps", fps);
