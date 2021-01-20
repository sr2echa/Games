
var g = {
    interval:1000/30,
    lastTime:0,
	highscore: {
		0:0,
		1:0,
		2:0
	},
	title: true,
	music: false,
	images: {
	},
	story: [
		"It's dark. Warnings are flashing everywhere.",
		"I'm on some kind of... damaged space station?",
		"The reactor's working, but everything's offline.",
		"I need to connect the oxygen, my suit won't last long.",
		"Then let's see if the escape systems are working..."
	],
	tooltips: {
		main:    "Main Power. Connect to systems to power them.",
		aux:     "Aux Power. Just needs a little kick to get started.",
		o2:      "Oxygen. Connect hexes to this to make them breathable.",
		fuel:    "Fuel. Connect to the Escape system to fuel it.",
		escape:  "Escape Pod. Add fuel then power to operate.",
		fabber:  "Fabrication Systems. Pick up new conduits from here.",
		spare:   "Connects empty faces of this hex with a conduit.",
		spareNo: "Cannot place conduit in this hex."
	},
	options: {
		invertControls: false,
		difficulty: 0,
		colorblind: false
	},
	menuButtons: {
		invertControls: new MenuButton(235,125,330,30,function(){ return true; }, function(){ g.options.invertControls = !g.options.invertControls }),
		diffNormal:  new MenuButton(235,345,330,30,function(){ return g.title || g.showStory; }, function(){ if (g.title || g.showStory) g.options.difficulty = 0 }),
		diffHard:    new MenuButton(235,385,330,30,function(){ return g.title || g.showStory; }, function(){ if (g.title || g.showStory) g.options.difficulty = 1 }),
		diffIronman: new MenuButton(235,425,330,30,function(){ return g.title || g.showStory; }, function(){ if (g.title || g.showStory) g.options.difficulty = 2 }),
		colorblind: new MenuButton(220,495,345,30,function(){ return true; }, function(){ g.options.colorblind = !g.options.colorblind })
	}
	
};
function MenuButton(x,y,width,height,selectableWhile,calls){
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.selectableWhile = selectableWhile;
	this.calls = calls;
}

function setup(){
	document.getElementById("canvasContainer").innerHTML = "";
    g.canvas = document.createElement('canvas');
    g.canvas.id = "canvas";
    g.canvas.width = 800;
    g.canvas.height = 600;
	g.canvas.font = "24px monospace";
    document.getElementById("canvasContainer").appendChild(g.canvas);
    g.ctx = g.canvas.getContext("2d");
	document.getElementById('canvas').onmousemove = function(e){ handleMouseMove(e); };
    document.getElementById('canvas').onmousedown = function(e){ handleMousedown(e); };
	document.getElementById('canvas').oncontextmenu = function(e){ return false }; //allow right clicking to not bring up the context menu
	//document.onkeypress = function(e){ handleKeyPress(e); };
    g.ctx.strokeStyle = "white";
	load();

    initialiseData();

    gameLoop();
}
function load(){
	try {
		var savegame = localStorage.getItem("offline");
		if (savegame) {
			if (!isNaN(parseInt(savegame))){ //old old saves
				g.highscore[0] = parseInt(savegame)
				g.highscore[1] = 0;
				g.highscore[2] = 0;
			} else {
				var s = JSON.parse(savegame);
				if (!isNaN(s.highscore)) { //old saves
					g.highscore[0] = s.highscore;
					g.highscore[1] = 0;
					g.highscore[2] = 0;
				} else if (s.highscore){
					g.highscore = s.highscore;
				}
				if (s.options.invertControls) g.options.invertControls = true;
				if (s.options.difficulty) g.options.invertControls = s.options.difficulty;
				if (s.options.colorblind) g.options.colorblind = true;
			}
		}
	} catch(err){};
}

///////////////////////////////////////////////////////////////////////////

function initialiseData(){
	g.showStory = false;
	g.storyClicks = 0;
	g.stars = [];
	for (var i=0; i<120; i++){
		g.stars.push(new Star(
			Math.floor(g.canvas.width * Math.random()),
			Math.floor(g.canvas.height * Math.random())
		));
	}
	g.tooltip = false;
	g.score = 0;
	//g.player = chooseRandom(["👩‍🚀","👨‍🚀"]); //why is there no gender neutral astronaut emoji?
	var img = new Image();
	img.src = "astronaut.gif";
	g.images.astronaut = img;
}
function initialiseMap(){
	g.spareConduit = false;
	g.status = {	
		"Main Power": false,
		"Oxygen": false,
		"Aux Power": false,
		"Fuel": false,
		"Fabber": false,
		"Escape": false,
	};
	g.loc = {
		x:0,
		y:0
	};
	g.o2 = 10;
	g.escapeSequence = 0;
	
	generateHexes();
	//done in this order because there was a very small chance that aux power could become hooked up
	//in initial generation and then become true, and then the hex grid could be rejected.
	g.status = {	
		"Main Power": false,
		"Oxygen": false,
		"Aux Power": false,
		"Fuel": false,
		"Fabber": false,
		"Escape": false,
	};
	checkConnections();
}
function generateHexes(){
	g.hexes = [];
	
	for (var i=-4;i<=4;i++){
		for (var j=-4;j<=4;j++){
			g.hexes.push(new Hex(i,j));
		}
	}
	//Main Power
	var ps = getHex(-1,-1);
	ps.cons = [
		new Conduit(0,0),
		new Conduit(1,1),
		new Conduit(2,2),
		new Conduit(3,3),
		new Conduit(4,4),
		new Conduit(5,5)
	];
	ps.isPowerSource = true;
	
	//Oxygen
	var os = getHex(1,1);
	os.cons = [
		new Conduit(0,0),
		new Conduit(1,1),
		new Conduit(2,2),
		new Conduit(3,3),
		new Conduit(4,4),
		new Conduit(5,5)
	];
	os.isO2Source = true;
	
	//Aux Power
	var aux = getHex(4,-4);
	aux.isAuxPower = true;
	aux.rot = 0;
	aux.dispRot = 0;
	aux.cons = [
		new Conduit(0,0),
		new Conduit(1,1),
		new Conduit(2,2)
	];
	
	//Fuel Systems
	var fs = getHex(-4,4);
	fs.isFuelSource = true;
	fs.rot = 0;
	fs.dispRot = 0;
	fs.cons = [
		new Conduit(3,3),
		new Conduit(4,4),
		new Conduit(5,5)
	];
	var es = getHex(4,4);
	es.isEscape = true;
	es.rot = 0;
	es.dispRot = 0;
	es.cons = [
		new Conduit(2,2),
		new Conduit(3,3)
	];
	
	//Fabber
	var fa = getHex(-4,-4);
	fa.isFabber = true;
	fa.rot = 0;
	fa.dispRot = 0;
	fa.cons = [
		new Conduit(5,5),
		new Conduit(0,0)
	];
	
	//Corner Hexes
	generateValidCornerHexes([[-3,-4],[-4,-3],[3,4],[4,3]]);
	
	checkConnections();
	
	if (g.options.difficulty == 0){
		//EASY MODE
		if (getHex(1,1).isPowered){ //only accept grids where there is a connection
			//then rotate all the hexes around the oxygen out of alignment
			var hexes = [[0,1],[0,2],[1,0],[1,2],[2,0],[2,1]];
			for (var hex in hexes){
				rotateHex(getHex(hexes[hex][0],hexes[hex][1]), Math.random() > 0.5 ? 1 : -1, true);
			}
			checkConnections();
			if (getHex(1,1).isPowered){ //finally make sure it's not still powered after the jumbling
				generateHexes(); 
			} else {
				return true;
			}
		} else {
			generateHexes();
		}
	} else {
		if (getHex(1,1).isPowered){ //don't make it auto powered
			generateHexes(); 
		}
	}
	if (g.options.difficulty == 2){
		//IRONMAN MODE
		getHex(3,4).cons = [];
		getHex(4,3).cons = [];
	}
}
function Star(x,y){
	this.x = x;
	this.y = y;
	this.d = Math.random()/2 + 0.75;
}
function Hex(x,y,rot,cons){
	this.x = x;
	this.y = y;
	this.rot = rot ? rot : Math.floor(Math.random() * 5);
	this.dispRot = Math.floor(this.rot);
	this.cons = cons ? cons : randomHexCons();
	this.isPowered = false;
	this.isPowerSource = false;
	this.isAuxPower = false;
	this.isOxygenated = false;
	this.isO2Source = false;
	this.isFuelSource = false;
	this.isFueled = false;
}
function Conduit(face1,face2){
	this.face1 = face1;
	this.face2 = face2;
	this.hasPower = false;
	this.hasO2 = false;
}
function randomHexCons(){
	var c1 = randomCon();
	var c2 = randomCon(c1);
	return [c1, c2];
}
function randomCon(not){
	var f1 = chooseRandom([0,1,2,3,4,5]);
	var f2 = chooseDiffRandom([0,1,2,3,4,5],f1);
	var notFaces = not ? [not.face1,not.face2] : false;
	if (typeof not === 'undefined' || (notFaces.indexOf(f1) === -1 && notFaces.indexOf(f2) === -1)){
		return new Conduit(f1, f2);
	} else {
		return randomCon(not);
	}
}
function generateValidCornerHexes(hexes){
	for (var hex in hexes){
		var h = getHex(hexes[hex][0],hexes[hex][1]);
		var c1 = new Conduit(0,3);
		var c2 = randomCon(c1);
		h.cons = [c1,c2];
	}
}

function toggleMusic(){
	if (!g.music){
		when = ac.currentTime;
		
		sequence1.play(when + (60/tempo)*48);
		sequence2.play(when + (60/tempo)*16);
		sequence3.play(when);
		g.music = true;
	} else {
		sequence1.stop();
		sequence2.stop();
		sequence3.stop();
		g.music = false;
	}
}
function toggleMenu(){
	g.menu = !g.menu;
}
function moveStars(dist){
	for (var star in g.stars){
		g.stars[star].x -= dist * g.stars[star].d;
		if (g.stars[star].x < 0) g.stars[star].x += g.canvas.width;
	}
}

////////////////////////////////////////////////////////////////////////////////

function checkConnections(){
	var powerSources = [];
	var o2Sources = [];
	var fuelSources = [];
	g.status["Main Power"] = false;
	g.status["Oxygen"] = false;
	g.status["Fuel"] = false;
	g.status["Fabber"] = false;
	g.status["Escape"] = false;
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		h.isPowered = false;
		h.isOxygenated = false;
		for (var con in h.cons){
			h.cons[con].hasPower = false;
			h.cons[con].hasO2 = false;
			h.cons[con].hasFuel = false;
		}
		if (h.isPowerSource){
			g.status["Main Power"] = true;
			for (var con in h.cons){
				h.cons[con].hasPower = true;
				powerSources.push([h,h.cons[con]]);
			}
		}
	}
	spreadPower(powerSources);
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		if (h.isO2Source && h.isPowered){
			g.status["Oxygen"] = true;
			h.isOxygenated = true;
			for (var con in h.cons){
				h.cons[con].hasO2 = true;
				o2Sources.push([h,h.cons[con]]);
			}
		}
	}
	spreadO2(o2Sources);
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		if (h.isFuelSource && h.isPowered){
			g.status["Fuel"] = true;
			for (var con in h.cons){
				h.cons[con].hasFuel = true;
				fuelSources.push([h,h.cons[con]]);
			}
		}
	}
	spreadFuel(fuelSources);
}
function spreadPower(powerSources){
	var outPowerSources = [];
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		for (var con in h.cons){
			var hCon = h.cons[con];
			if (!hCon.hasPower){
				for (var powerSource in powerSources){
					var ps = powerSources[powerSource];
					if (testForConnection(h, ps[0], hCon, ps[1])){
						h.isPowered = true;
						hCon.hasPower = true;
						outPowerSources.push([h, hCon]);
					}
				}
			}
		}
		if (h.isAuxPower && h.isPowered){
			h.isPowerSource = true;
			g.status["Aux Power"] = true;
			for (var con in h.cons){
				if (!h.cons[con].hasPower){ 
					h.cons[con].hasPower = true;
					outPowerSources.push([h,h.cons[con]]);
				}
			}
		}
		if (h.isFabber && h.isPowered){
			g.status["Fabber"] = true;
		}
		if (h.isEscape && h.isPowered && h.isFueled){
			g.status["Escape"] = true;
		}
	}
	if (powerSources.length > 0) spreadPower(outPowerSources);
}
function spreadO2(o2Sources){
	var outO2Sources = [];
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		for (var con in h.cons){
			var hCon = h.cons[con];
			if (!hCon.hasPower && !hCon.hasO2){ //power always overrides o2
				for (var o2Source in o2Sources){
					var os = o2Sources[o2Source];
					if (testForConnection(h, os[0], hCon, os[1])){
						h.isOxygenated = true;
						hCon.hasO2 = true;
						outO2Sources.push([h, hCon]);
					}
				}
			}
		}
		if (h.isEscape && h.isPowered){
			h.isOxygenated = true;
		}
	}
	if (o2Sources.length > 0) spreadO2(outO2Sources);
}
function spreadFuel(fuelSources){
	var outFuelSources = [];
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		for (var con in h.cons){
			var hCon = h.cons[con];
			if (!hCon.hasPower && !hCon.hasO2 && !hCon.hasFuel){ //power and o2 override fuel
				for (var fuelSource in fuelSources){
					var fs = fuelSources[fuelSource];
					if (testForConnection(h, fs[0], hCon, fs[1])){
						if (h.isEscape){
							h.isFueled = true;
							if (h.isPowered) g.status["Escape"] = true;
						}
						hCon.hasFuel = true;
						outFuelSources.push([h, hCon]);
					}
				}
			}
		}
	}
	if (fuelSources.length > 0) spreadFuel(outFuelSources);
}
function testForConnection(hex1, hex2, con1, con2){
	if (hex1.x === hex2.x && hex1.y === hex2.y){
		return false;
	} else if (!testAdjacency(hex1,hex2)){
		return false;
	} else {
		//face 0 at 0 rot is -1y, +0x
		var f1 = returnFaceIndex(hex1, hex2);
		var f2 = returnFaceIndex(hex2, hex1);
		
		if (getWrapped(con1.face1 + hex1.rot) === f1 || getWrapped(con1.face2 + hex1.rot) === f1){
			if (getWrapped(con2.face1 + hex2.rot) === f2 || getWrapped(con2.face2 + hex2.rot) === f2){
				return true;
			}
		}
		return false;
	}
}
function testAdjacency(hex1, hex2){
	var dX = hex1.x - hex2.x;
	var dY = hex1.y - hex2.y;
	if (dX > 1 || dX < -1) return false;
	if (dY > 1 || dY < -1) return false;
	if (Math.abs(dX + dY) > 1) return false;
	return true;
}
function returnFaceIndex(fromHex, toHex){
	var dX = fromHex.x - toHex.x;
	var dY = fromHex.y - toHex.y;
	if (dX == 0 && dY == -1) return 0;
	if (dX == 1 && dY == -1) return 1;
	if (dX == 1 && dY == 0) return 2;
	if (dX == 0 && dY == 1) return 3;
	if (dX == -1 && dY == 1) return 4;
	if (dX == -1 && dY == 0) return 5;
	throw new Error("can't find face of hex " + fromHex.x + "," + fromHex.y + " to hex " + toHex.x + "," + toHex.y);
}

function canPlaceConduit(){
	var h = getHex(g.loc.x, g.loc.y);
	return h.cons.length <= 2 && !h.isFabber && !h.isEscape;
}
function addConduit(){
	if (canPlaceConduit()){
		var h = getHex(g.loc.x, g.loc.y);
		var faces = [];
		for (var i=0;i<6;i++){
			var face = true;
			for (var con in h.cons){
				if (h.cons[con].face1 == i) face = false;
				if (h.cons[con].face2 == i) face = false;
			}
			if (face) faces.push(i);
		}
		var c1 = chooseRandom(faces);
		var c2 = chooseDiffRandom(faces,c1);
		h.cons.push(new Conduit(c1,c2));
		checkConnections();
		g.spareConduit = false;
		takeTurn();
	}
}

function takeTurn(){
	var h = getHex(g.loc.x, g.loc.y);
	if (h.isOxygenated){
		g.o2 = 10;
	} else {
		g.o2--;
		if (g.o2 < 0){
			g.gameover = 1;
		}
	}
	g.score++;
}

function checkFabber(){
	var h = getHex(g.loc.x,g.loc.y);
	if (h.isFabber && h.isPowered){
		g.spareConduit = true;
	}
}
function checkEscape(){
	var h = getHex(g.loc.x,g.loc.y);
	if (h.isEscape && h.isFueled && h.isPowered){
		escaped();
		return true;
	}
}
function escaped(){
	g.escapeSequence = 1;
	if (g.highscore[g.options.difficulty] == 0 || typeof g.highscore[g.options.difficulty] === "undefined" || g.score < g.highscore[g.options.difficulty]){
		g.highscore[g.options.difficulty] = g.score;
	}
	save();
}
function save(){
	var s = {
		highscore: g.highscore,
		options: g.options
	}
	localStorage.setItem('offline', JSON.stringify(s));
}

///////////////////////////////////////////////////////////////////////////

function gameLoop(){	
	window.requestAnimationFrame(gameLoop);
    var currentTime = (new Date()).getTime();
    var delta = currentTime - g.lastTime;
    if (delta > g.interval) {
        
		clear();
		drawStars();
		if (g.menu) {
			drawMenu();
		} else if (g.gameover){
			drawHexMap();
			drawPlayer();
			drawGameOver();
		} else if (g.title){
			drawTitle();
		} else if (g.showStory){
			drawStory(g.storyClicks);
		} else if (g.escapeSequence) {
			moveStars(0.01 * g.escapeSequence/10)
			drawHexMap();
			drawEscape(g.escapeSequence);
			drawPlayer();
			g.loc.x += 0.01 * g.escapeSequence/20;
			g.loc.y += 0.01 * g.escapeSequence/20;
			g.escapeSequence++;
			if (g.escapeSequence > 100){
				drawEndTitle(g.escapeSequence);
			}
		} else {
			drawHexMap();
			drawPlayer();
			drawInterface();
		}
		drawMenuIcon();
		drawMusic();
		
        g.lastTime = currentTime - (delta % g.interval);
    }
}

//////////////////////////////////////////////////////////////////////////////

function clear(){
	g.ctx.fillStyle = "black";
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
}
function drawMenu(){
	g.ctx.fillStyle = "white";
	drawFontCenter(g.ctx, "Menu", 50, 5);
	drawFontCenter(g.ctx, (g.options.invertControls ? "☑" : "☐") + " Invert Controls", 130, 3);
	drawFontCenter(g.ctx, "Click adjacent hex to move", 180, 2);
	drawFontCenter(g.ctx, "Click current hex to rotate", 210, 2);
	if (!g.options.invertControls) {
		drawFontCenter(g.ctx, "(LMB ↶ / RMB ↷)", 240, 2);
	} else {
		drawFontCenter(g.ctx, "(RMB ↶ / LMB ↷)", 240, 2);
	}
	drawFontCenter(g.ctx, "Difficulty", 300, 4);
	if (!g.title && !g.showStory) g.ctx.fillStyle = "#444";
	drawFontCenter(g.ctx, (g.options.difficulty === 0 ? "☑" : "☐") + " Normal", 350, 3);
	drawFontCenter(g.ctx, (g.options.difficulty === 1 ? "☑" : "☐") + " Hard", 390, 3);
	drawFontCenter(g.ctx, (g.options.difficulty === 2 ? "☑" : "☐") + " Ironman", 430, 3);
	
	g.ctx.fillStyle = "white";
	drawFontCenter(g.ctx, (g.options.colorblind ? "☑" : "☐") + " Colourblind Mode", 500, 3);
}
function drawTitle(){
	g.ctx.fillStyle = "white";
	drawFont(g.ctx, "Systems Offline", 400-270, 300-64, 6);
	drawFont(g.ctx, "@dhmstark js13k 2018", 400-18*10, 300+32, 3);
	drawFont(g.ctx, "toggle music →", 600, 600-32, 1.7);
	drawFont(g.ctx, "← menu", 70, 600-32, 1.7);
}
/*
function drawArrow(){
	g.ctx.beginPath();
	g.ctx.moveTo(g.canvas.width - 120, g.canvas.height - 50);
	g.ctx.quadraticCurveTo(g.canvas.width - 90, g.canvas.height - 30, g.canvas.width - 50, g.canvas.height - 30);
	g.ctx.lineTo(g.canvas.width - 58, g.canvas.height - 38);
	g.ctx.moveTo(g.canvas.width - 50, g.canvas.height - 30);
	g.ctx.lineTo(g.canvas.width - 60, g.canvas.height - 24);
	g.ctx.stroke();
}
*/
function drawStory(storyClicks){
	g.ctx.beginPath();
	if (g.storyClicks >= g.story.length){
		g.showStory = false;
		g.storyClicks = 0;
		initialiseMap();
		return false;
	}
	g.ctx.fillStyle = "white";
	var scale = 2;
	for (var i=0; i<=storyClicks; i++){
		drawFont(g.ctx, g.story[i], g.canvas.width/2 - (g.story[i].length/2*6*scale), 120 + 80*i, scale);
	}
}

function drawGameOver(){
	g.ctx.fillStyle = "rgba(0,0,0,0.8)";
	g.ctx.fillRect(400 - 31/2*6*3, 240, 31*6*3, 42);
	g.ctx.fillRect(400 - 18/2*6*3, 340, 18*6*3, 42);
	g.ctx.fillStyle = "white";
	drawFontCenter(g.ctx,"You ran out of O₂. Game Over.",250,3);
	drawFontCenter(g.ctx,"Click to restart",350,3);
	if (g.gameover > 1){
		initialiseData();
		g.title = true;
		g.gameover = 0;
	}
}

function drawStars(){
	g.ctx.fillStyle = "white";
	for (var star in g.stars){
		var s = g.stars[star];
		g.ctx.fillRect(s.x,s.y,1,1);
	}
}
function drawHexMap(){
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		drawHex(h, 50);
	}
}
function drawHex(hex, rad){
	var rot = hex.dispRot;
	
	var x = hexToCanvas(hex.x - g.loc.x, hex.y - g.loc.y).x;
	var y = hexToCanvas(hex.x - g.loc.x, hex.y - g.loc.y).y;
	g.ctx.beginPath();
	g.ctx.moveTo(x + Math.cos(rot * Math.PI/3) * rad, y + Math.sin(rot * Math.PI/3) * rad);
	for (var i=1;i<=6;i++){
		g.ctx.lineTo(x + Math.cos((rot + i)*Math.PI/3) * rad, y + Math.sin((rot + i)*Math.PI/3) * rad);
	}
	g.ctx.closePath();
	g.ctx.strokeStyle = "white";
	g.ctx.stroke();
	
	var fv = 1;
	if (hex.selected) fv++;
	var fs = "#" + fv + fv + fv + fv;
	if (hex.isOxygenated) fv += 2;
	fs += "" + fv + fv;
	g.ctx.fillStyle = fs;
	g.ctx.fill();
	
	for (var con in hex.cons){
		var c = hex.cons[con];
		drawConnection(hex,rad,c);
	}
	
	g.ctx.textAlign = "center";
	var powerColor = g.options.colorblind ? "yellow" : "red";
	var escapeColor = g.options.colorblind ? "red" : "yellow";
	if (hex.isPowerSource){
		drawCircle(x,y,20,powerColor,powerColor);
		g.ctx.fillStyle = "white";
		g.ctx.fillText("⚡",x+2,y+8);
	} else if (hex.isO2Source){
		drawCircle(x,y,20,"royalblue",hex.isPowered ? "royalblue" : false);
		g.ctx.fillStyle = "white";
		//g.ctx.fillText("O₂",x+2,y+8);
		drawFont(g.ctx,"O₂",x-12,y-10,2.5);
	} else if (hex.isAuxPower){
		drawCircle(x,y,20,powerColor,hex.isPowered ? powerColor : false);
		g.ctx.fillStyle = hex.isPowered ? "white" : powerColor;
		g.ctx.fillText("⚡",x+2,y+8);
	} else if (hex.isFuelSource){
		drawCircle(x,y,20,"green",hex.isPowered ? "green" : false);
		g.ctx.fillStyle = hex.isPowered ? "white" : "green";
		g.ctx.fillText("🛢",x+2,y+6);
	} else if (hex.isEscape){
		g.ctx.lineWidth = hex.isFueled ? 2 : 1;
		drawCircle(x,y,20,escapeColor,hex.isPowered && hex.isFueled ? escapeColor : hex.isFueled ? "#030" : false);
		g.ctx.lineWidth = 1;
		g.ctx.fillStyle = "white";
		if (!g.escapeSequence) g.ctx.fillText("🚀",x+3,y+8);
	} else if (hex.isFabber){
		drawCircle(x,y,20,"white",hex.isPowered ? "white" : false);
		g.ctx.fillStyle = "grey";
		g.ctx.fillText("🏭",x+2,y+6);
	}
	// DEBUG - Hex Numbers
	//g.ctx.textAlign = "center";
	//g.ctx.strokeStyle = "white";
	//g.ctx.font = "10px monospace";
	//g.ctx.strokeText(hex.x + "," + hex.y, x, y);
	
	if (hex.rot != hex.dispRot){
		var dir = (hex.rot - hex.dispRot)/Math.abs(hex.rot - hex.dispRot);
		hex.dispRot += dir * 0.1;
		if (Math.abs(hex.rot - hex.dispRot) < 0.01) hex.dispRot = hex.rot; //goddamnit floating point numbers why are you like this
	}
}
function drawConnection(hex,rad,c){
	var rot = hex.dispRot;
	var x = hexToCanvas(hex.x - g.loc.x, hex.y - g.loc.y).x;
	var y = hexToCanvas(hex.x - g.loc.x, hex.y - g.loc.y).y;
	var o = Math.cos(-1/6*Math.PI);
	
	g.ctx.beginPath();
	g.ctx.moveTo(x + Math.cos((rot + c.face1) * Math.PI/3 + Math.PI/6) * rad * o, y + Math.sin((rot + c.face1) * Math.PI/3 + Math.PI/6) * rad * o);
	g.ctx.quadraticCurveTo(
		x, y,
		x + Math.cos((rot + c.face2) * Math.PI/3 + Math.PI/6) * rad * o,
		y + Math.sin((rot + c.face2) * Math.PI/3 + Math.PI/6) * rad * o
	);
	if (c.hasPower){
		g.ctx.strokeStyle = g.options.colorblind ? "yellow" : "red";
		g.ctx.shadowColor = g.options.colorblind ? "#cc0" : '#c00';
		g.ctx.shadowBlur = 10;
	} else if (c.hasO2){
		g.ctx.strokeStyle = "royalblue";
	} else if (c.hasFuel){
		g.ctx.strokeStyle = "green";
	} else {
		g.ctx.strokeStyle = "grey";
	}
	
	g.ctx.lineWidth = 4;
	g.ctx.stroke();
	
	//reset stroke styles
	g.ctx.shadowBlur = 0;
	g.ctx.lineWidth = 1;
}
function drawPlayer(){
	var x = g.canvas.width/2;
	var y = g.canvas.height/2;
	g.ctx.font = "32px monospace";
	g.ctx.textAlign = "center";
	
	g.ctx.shadowColor = getO2Color();
	g.ctx.shadowBlur = 30;
	
	g.ctx.drawImage(g.images.astronaut, x - 15, y - 17);
	//g.ctx.fillText(g.player,x + 3,y + 10);
	g.ctx.shadowBlur = 0;
}

function drawInterface(){
	var statusOrder = 0;
	g.ctx.strokeStyle = "white";
	g.ctx.textAlign = "right";
	g.ctx.font = "10px monospace";
	g.ctx.fillStyle = "black";
	//g.ctx.fillRect(14,14,250,30);
	for (var i=1; i<=10; i++){
		drawCircle(8 + 24*i, 29, 9, "white", g.o2 >= i ? "royalblue" : "black");
		g.ctx.beginPath();
		g.ctx.arc(8 + 24*i, 29, 6, 0, Math.PI / 3);
		g.ctx.stroke();
	}
	var scale = 1.5;
	for (var st in g.status){
		g.ctx.fillStyle = "white";
		drawFont(g.ctx, st, g.canvas.width - 48 - (st.length*6*scale), 24 + statusOrder * 32, scale);
		drawCircle(g.canvas.width - 32, 29 + statusOrder * 32, 9, "white", g.status[st] && g.status["Main Power"] ? "limegreen" : "black");
		g.ctx.beginPath();
		g.ctx.arc(g.canvas.width - 32, + 29 + statusOrder * 32, 6, 0, Math.PI / 3);
		g.ctx.stroke();
		statusOrder++;
	}
	if (g.spareConduit){
		g.ctx.strokeStyle = "white";
		g.ctx.fillStyle = canPlaceConduit() ? "#333" : "black";
		g.ctx.fillRect(24,52,130,26);
		g.ctx.strokeRect(24,52,130,26);
		g.ctx.fillStyle = canPlaceConduit() ? "white" : "grey";
		drawFont(g.ctx, "Spare Conduit", 32, 60, 1.5);
	}
	if (g.tooltip) drawTooltip(g.tooltips[g.tooltip]);
}
function getO2Color(){
	var red = Math.floor(65*g.o2/10);
	var green = Math.floor(105*g.o2/10);
	var blue = Math.floor(225*g.o2/10);
	return "rgb(" + red + ", " + green + ", " + blue + ")";
}
function drawTooltip(tooltip){
	g.ctx.fillStyle = "black";
	g.ctx.fillRect(50, g.canvas.height - 52, g.canvas.width - 100, 32);
	g.ctx.fillStyle = "white";
	//g.ctx.textAlign = "center";
	//g.ctx.font = "14px monospace";
	//g.ctx.shadowColor = "black";
	//g.ctx.shadowBlur = 20;
	var scale = 1.5;
	drawFont(g.ctx, tooltip, g.canvas.width/2 - (tooltip.length/2*6*scale), g.canvas.height - 42, scale)
	//g.ctx.fillText(tooltip, g.canvas.width/2, g.canvas.height - 32);
	//g.ctx.shadowBlur = 0;
}
function drawMenuIcon(){
	g.ctx.textAlign = "left";
	g.ctx.font = "24px sans-serif";
	g.ctx.fillText("⚙️", 12, g.canvas.height - 16);
}
function drawMusic(){
	g.ctx.textAlign = "right";
	g.ctx.font = "24px sans-serif";
	g.ctx.fillText(g.music ? "🔊" : "🔈 ", g.canvas.width - 8, g.canvas.height - 16);
}

function drawCircle(x,y,radius,strokeColor,fillColor){
	g.ctx.lineWidth++;
	g.ctx.beginPath();
	g.ctx.arc(x, y, radius, 0, 2*Math.PI);
	if (strokeColor){
		g.ctx.strokeStyle = strokeColor;
		g.ctx.stroke();
	}
	g.ctx.lineWidth--;
	g.ctx.beginPath();
	g.ctx.arc(x, y, radius-1, 0, 2*Math.PI);
	if (fillColor){
		g.ctx.fillStyle = fillColor;
		g.ctx.fill();
	}
}

function drawEscape(timing){
	var x = g.canvas.width/2;
	var y = g.canvas.height/2;
	drawCircle(x,y,25,"yellow", "#111111");
	g.ctx.strokeStyle = "#555";
	for (var i=0; i<3; i++){
		g.ctx.beginPath();
		var back = (5*i + timing%5);
		g.ctx.arc(x - back, y, 30, (12 + back/4)*Math.PI/16, (20 - back/4)*Math.PI/16);
		g.ctx.stroke();
	}
}
function drawEndTitle(timing){
	g.ctx.fillStyle = "white";
	var c = g.canvas.width/2;
	var scale = 4;
	var message = "Thank you for playing!";
	drawFont(g.ctx, message, g.canvas.width/2 - (message.length/2*6*scale), g.canvas.height/2 - 120, scale);
	
	scale = 3;
	var hs = g.highscore[g.options.difficulty];
	if (timing > 150){
		if (g.score == hs) {
			var red =   Math.cos(((timing*6    )%255)/255 * 2 * Math.PI) * 255;
			var green = Math.cos(((timing*6+ 85)%255)/255 * 2 * Math.PI) * 255;
			var blue =  Math.cos(((timing*6+170)%255)/255 * 2 * Math.PI) * 255;
			g.ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
			message = "New high score!";
			drawFont(g.ctx, message, g.canvas.width/2 - (message.length/2*6*scale), g.canvas.height/2 + 60, scale);
			
			g.ctx.fillStyle = "white";
			message = "You beat "
			if (g.options.difficulty == 0) message += "the game";
			if (g.options.difficulty == 1) message += "hard mode";
			if (g.options.difficulty == 2) message += "ironman mode";
			message += " in " + g.score + " moves!";
			drawFont(g.ctx, message, g.canvas.width/2 - (message.length/2*6*scale), g.canvas.height/2 + 100, scale);
		} else {
			message = "You beat ";
			if (g.options.difficulty == 0) message += "the game";
			if (g.options.difficulty == 1) message += "hard mode";
			if (g.options.difficulty == 2) message += "ironman mode";
			message += " in " + g.score + " moves!";
			drawFont(g.ctx, message, g.canvas.width/2 - (message.length/2*6*scale), g.canvas.height/2 + 60, scale);
			message = "Your best was " + hs + " moves.";
			drawFont(g.ctx, message, g.canvas.width/2 - (message.length/2*6*scale), g.canvas.height/2 + 100, scale);
		}
	}
	
	if (timing > 200){
		message = "Click to restart";
		drawFont(g.ctx, message, g.canvas.width/2 - (message.length/2*6*scale), g.canvas.height/2 + 180, scale);
	}
}

/////////////////////////////////////////////////////////////////////////

function hexToCanvas(hexX,hexY){
	var y = g.canvas.height/2;
	var x = g.canvas.width/2;
	var o = Math.cos(-1/6*Math.PI);
	y += Math.sin(-1/6*Math.PI)*100*o*hexX;
	x += Math.cos(-1/6*Math.PI)*100*o*hexX;
	y += Math.sin(1/6*Math.PI)*100*o*hexY;
	x += Math.cos(1/6*Math.PI)*100*o*hexY;
	return {
		x: x,
		y: y
	}
}
function canvasToHex(x,y){
	var hexes = [ //only want the seven around the player to be selectable
		[0,0],
		[0,1],
		[-1,1],
		[-1,0],
		[0,-1],
		[1,-1],
		[1,0]
	];
	var r = Math.cos(-1/6*Math.PI) * 50;
	
	for (var hex in g.hexes){
		var h = g.hexes[hex];
		var hx = x - hexToCanvas(h.x, h.y).x;
		var hy = y - hexToCanvas(h.x, h.y).y;
		if (Math.sqrt(hx*hx + hy*hy) < r){
			var selectable = false;
			for (var i=0;i<hexes.length;i++){
				if (h.x === hexes[i][0] && h.y === hexes[i][1]) selectable = true;
			}
			return {
				hex: getHex(h.x + g.loc.x, h.y + g.loc.y),
				selectable: selectable
			}
		}
	}
	return false;
}
function getHex(x,y){
	for (var hex in g.hexes){
		if (g.hexes[hex].x === x && g.hexes[hex].y === y) return g.hexes[hex];
	}
	return false;
}
function getWrapped(n){
	return n%6;
}
function chooseDiffRandom(arr,last){
	var random = chooseRandom(arr);
	if (random === last){
		return chooseDiffRandom(arr, last);
	} else {
		return random;
	}
}
function chooseRandom(arr){
	var r = Math.random() * arr.length;
	return arr[Math.floor(r)];
}

//////////////////////////////////////////////////////////////////////////

function handleMouseMove(e){
	var x = e.offsetX;
	var y = e.offsetY;
	var cursor = false;
	if (g.menu) {
		for (var button in g.menuButtons){
			var b = g.menuButtons[button];
			if (b.selectableWhile()){
				if (x > b.x && x < b.x + b.width &&
					y > b.y && y < b.y + b.height){
					cursor = true;
				}
			}
		}
	} else if (!g.gameover) {
		for (var hex in g.hexes){
			g.hexes[hex].selected = false;
		}
		var c2h = canvasToHex(x,y);
		if (c2h && c2h.hex){
			var hex = c2h.hex;
			if (c2h.selectable){
				hex.selected = true;
				cursor = true;
			}
			if (hex.isPowerSource){
				if (!hex.isAuxPower) g.tooltip = "main";
			} else if (hex.isAuxPower){
				g.tooltip = "aux";
			} else if (hex.isO2Source){
				g.tooltip = "o2";
			} else if (hex.isFuelSource){
				g.tooltip = "fuel";
			} else if (hex.isEscape){
				g.tooltip = "escape";
			} else if (hex.isFabber){
				g.tooltip = "fabber";
			} else {
				g.tooltip = false;
			}
		}
		if (g.spareConduit && x >= 24 && x <= 24+130 && y >= 52 && y <= 52+26){
			g.tooltip = canPlaceConduit() ? "spare" : "spareNo";
			cursor = true;
		}
	}
	if ((x < 48 && y + 48 > g.canvas.height) || (x + 48 > g.canvas.width && y + 48 > g.canvas.height)){
		cursor = true;
	}
	g.canvas.style.cursor = cursor ? "pointer" : "default";
}
function handleMousedown(e){
	var x = e.offsetX;
	var y = e.offsetY;
	var hex = canvasToHex(x,y).hex;
	if (x + 48 > g.canvas.width && y + 48 > g.canvas.height){
		toggleMusic();
		return false;
	}
	if (x < 48 && y + 48 > g.canvas.height){
		toggleMenu();
		return false;
	}
	if (g.menu){
		for (var button in g.menuButtons){
			var b = g.menuButtons[button];
			if (x > b.x && x < b.x + b.width &&
				y > b.y && y < b.y + b.height){
				b.calls();
				save();
			}
		}
	} else {
		if (g.gameover){
			g.gameover++;
			return false;
		}
		if (g.title){
			g.title = false;
			g.showStory = true;
			return false;
		}
		if (g.showStory){
			g.storyClicks++;
			return false;
		}
		if (g.escapeSequence){
			if (g.escapeSequence > 200){
				g.title = true;
				initialiseData();
			}
			return false;
		}
		if (g.spareConduit && x >= 24 && x <= 24+130 && y >= 52 && y <= 52+26){
			addConduit();
		}
		if (hex && hex.selected){
			if (hex.x === g.loc.x && hex.y === g.loc.y){
				if (!hex.isPowerSource && !hex.isO2Source && !hex.isAuxPower && !hex.isEscape && !hex.isFuelSource && !hex.isFabber){
					if (e.button === 0) {
						g.options.invertControls ? rotateHex(hex, 1) : rotateHex(hex,-1);
					} else {
						g.options.invertControls ? rotateHex(hex, -1) : rotateHex(hex,1);
					}
					takeTurn();
				}
			} else {
				g.loc.x = hex.x;
				g.loc.y = hex.y;
				handleMouseMove(e);
				checkFabber();
				takeTurn();
				checkEscape();
			}
		}
	}
	return false;
}
function rotateHex(hex, num, cancelAnim){
	hex.rot += num;
	if (hex.rot > 5) hex.rot -= 6;
	if (hex.rot < 0) hex.rot += 6;
	if (cancelAnim){
		hex.dispRot = hex.rot;
	} else {
		hex.dispRot = hex.rot - num;
	}
	checkConnections();
}

////////////////////////////////////////////// MUSIC /////////////////////////////

var ac = typeof AudioContext !== 'undefined' ? new AudioContext : new webkitAudioContext,
	when = ac.currentTime,
	tempo = 132,
	sequence1,
	sequence2,
	sequence3,
	lead = ['D4 w', 'F#4 w', 'G4 w', 'D4 w'],
	harmony = ['D4 e', 'A3 e', 'G3 e', 'A3 e'],
	bass = ['D3 w', 'A2 w', 'B2 w', 'G2 w'],
	dMajor = ['D4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', '-'];
	
for (var i = 0; i < 32; i++){
	if (Math.random() > 0.25){
		lead.push(chooseDiffRandom(dMajor, lead[lead.length-1].split(" ")[0]) + " w");
	} else {
		lead.push(chooseDiffRandom(dMajor, lead[lead.length-1].split(" ")[0]) + " h");
		lead.push(chooseDiffRandom(dMajor, lead[lead.length-1].split(" ")[0]) + " h");
	}
}

sequence1 = new TinyMusic.Sequence(ac, tempo, lead);
sequence1.gain.gain.value = 0.3 / 2;
sequence1.mid.frequency.value = 800;
sequence1.mid.gain.value = 3;

sequence2 = new TinyMusic.Sequence(ac, tempo, harmony);
sequence2.gain.gain.value = 0.4 / 2;
sequence2.mid.frequency.value = 1200;

sequence3 = new TinyMusic.Sequence(ac, tempo, bass);
sequence3.gain.gain.value = 0.3 / 2;
sequence3.mid.gain.value = 3;
sequence3.bass.gain.value = 6;
sequence3.bass.frequency.value = 80;
sequence3.mid.gain.value = -6;
sequence3.mid.frequency.value = 500;
sequence3.treble.gain.value = -2;
sequence3.treble.frequency.value = 1400;

setup();