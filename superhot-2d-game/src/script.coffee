#---------------------------------------------------
# VARIABLES
#---------------------------------------------------
player = null
bullets = null
bullets_count = 3
bullet_time = 0
enemies = null
enemies_count = 0
enemies_bullets = null
time = 0
speed = 10
motion = 0
motion_timer = null
max_delay = 60
min_delay = 1
text = null
score = 0
score_text = null
controls = []
currentVerticalDirection = false
currentHorizontalDirection = false
preview = new PreviewImage("https://s3-us-west-2.amazonaws.com/s.cdpn.io/150586/superhot2d.png") #PREVIEW IMAGE

#---------------------------------------------------
# GAME CLASS
#---------------------------------------------------

#PRELOAD STATE
preload = ->
  # nothing to preload ¯\_(ツ)_/¯
  
#CREATE STATE
create = ->
  
  #remove preview image
  preview.clear()
  
  #set scale mode
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
  game.scale.pageAlignVertically = true
  game.scale.pageAlignHorizontally = true
  
  #background color
  game.stage.backgroundColor = '#CCCCCC'
  
  #start physics engine
  game.physics.startSystem(Phaser.Physics.ARCADE)

  #input
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR)
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP)
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN)
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.LEFT)
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.RIGHT)
  
  controls = 
    "up": game.input.keyboard.addKey(Phaser.Keyboard.UP)
    "down": game.input.keyboard.addKey(Phaser.Keyboard.DOWN)
    "left": game.input.keyboard.addKey(Phaser.Keyboard.LEFT)
    "right": game.input.keyboard.addKey(Phaser.Keyboard.RIGHT)

  #start the game
  nextLevel()

#RESET THE GAME
resetGame = ->
  
  #nuke everything
  game.world.removeAll()

  #score text
  score_text = game.add.text(game.world.width - 60, 10, score)
  score_text.align = 'right'
  score_text.font = 'Orbitron'
  score_text.fontSize = 40
  score_text.fill = '#ff0000'
  
  #add player  
  player = new Player game, game.rnd.integerInRange(100, game.world.width - 100), 500, drawShape(32,32,'#FFFFFF')
  
  #ada player's bullet group
  bullets = game.add.group()
  
  #add bullets to memory so we can throttle the shot 
  i = 0
  while i < bullets_count
    bullet = new Bullet game, 0, 0, drawShape(10, 10, '#000000')
    bullets.add bullet 
    bullet.events.onOutOfBounds.add bullet.kill, bullet
    i++
 
  #add enemies and enemy bullets
  enemies = game.add.group()
  enemies_bullets = game.add.group()
  
  i = 0
  while i < enemies_count
    enemy = new Enemy game, game.rnd.integerInRange(100, game.world.width - 100), game.rnd.integerInRange(50, 150), drawShape()
    enemies.add enemy
    i++
    
  #create a new timer. this timer will act as our motion timer that we'll use to update time and motion instead of the main game update loop
  motion_timer = game.time.events.loop(60, motionUpdate, this)
  
#DRAW SHAPES
drawShape = (width=64, height=64, color='#ff0000')->
  bmd = game.add.bitmapData(width, height)
  bmd.ctx.beginPath()
  bmd.ctx.rect 0, 0, width, height
  bmd.ctx.fillStyle = color
  bmd.ctx.fill()
  return bmd
  
#CHECK INPUT
checkInput = ->
  # change time on input
  if controls.up.isDown or controls.down.isDown or controls.left.isDown or controls.right.isDown
    speedUpTime()
  else
    slowDownTime()
    
  # determine what direction the player is moving
  if controls.left.isDown
    currentHorizontalDirection = "left"
  else if controls.right.isDown
    currentHorizontalDirection = "right"
  else
    currentHorizontalDirection = false
    
  if controls.up.isDown
    currentVerticalDirection = "up"
  else if controls.down.isDown
    currentVerticalDirection = "down"
  else if !currentHorizontalDirection # if nothing assume up
    currentVerticalDirection = "up"
  else
    currentVerticalDirection = false

  # fire!
  if game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)
    player.fireBullet(currentHorizontalDirection, currentVerticalDirection)

#MOVEMENT
movePlayer = ->
  player.motionUpdate()
    
moveEnemies = ->
  # Move the enemies towards the player at the rate of the game motion
  enemies.forEachAlive (enemy) ->  
    enemy.motionUpdate()
      
moveBullets = ->
  # player bullets
  bullets.forEachAlive (bullet) ->
    bullet.motionUpdate()

  # enemy bullets
  enemies_bullets.forEachAlive (bullet) ->
    bullet.motionUpdate()
    
#COLLISION HANDLERS
playerEnemyHandler = (player, enemy)->
  #you dead. tint the player for a moment and then reset the game
  if enemy.can_kill
    enemy.can_kill = false
    player.tint = 0xff0000
    game.time.events.add(Phaser.Timer.SECOND * 0.2, ->
        gameOver()
    , this)

bulletEnemyHandler = (bullet, enemy)->
  enemy.tint = 0x000000
  bullet.kill()
  enemy.can_kill = false
  updateScore score+=1
  game.time.events.add(Phaser.Timer.SECOND * 0.2, ->
    killEnemy(enemy)
  , this)
  
killEnemy = (enemy)->
  enemy.kill()
  #check if all enemies are dead
  if !enemies.getFirstAlive()
    nextLevel() 
  
#MANIPULATE TIME
speedUpTime = ->
  if motion_timer.delay > min_delay
    motion_timer.delay -= 2
  else 
    motion_timer.delay = min_delay
  time = motion_timer.delay + speed
  
slowDownTime = ->
  if motion_timer.delay < max_delay
    motion_timer.delay += 2
  else 
    motion_timer.delay = max_delay
  time = motion_timer.delay - speed
   
#UPDATE MOTION
updateMotion = ->
  # always keep some motion and factor it by the time
  motion = (100 - (time * 2)) + speed
  
#GAME OVER
gameOver = ->
  enemies_count = 1
  updateScore 0
  resetGame()
  spawnText "GAME"
  game.time.events.add(Phaser.Timer.SECOND * 0.5, ->
    spawnText "OVER"
  , this)
  
#NEXT LEVEL  
nextLevel = ->
  # increase enemies and reset the game
  enemies_count++
  resetGame()
  spawnText "SUPER"
  game.time.events.add(Phaser.Timer.SECOND * 0.5, ->
    spawnText "HOT"
  , this)
  
#SPAWN TEXT
spawnText = (text=false, lifespan=0.5)->
  if text
    text = game.add.text(game.world.centerX, game.world.centerY, text)
    text.anchor.set 0.5
    text.align = 'center'
    text.font = 'Orbitron'
    text.fontSize = 150
    text.fill = '#ff0000'

    game.time.events.add(Phaser.Timer.SECOND * lifespan, ->
      text.kill()
    , this)

#MANAGE SCORE
updateScore = (points)->
  score = points
  score_text.text = score
  
#MOTION UPDATE LOOP
motionUpdate = ->
  updateMotion()
  movePlayer()
  moveEnemies()
  moveBullets()
  
#MAIN GAME UPDATE LOOP
update = ->
  checkInput()
  
  # player vs enemies
  game.physics.arcade.overlap(player, enemies, playerEnemyHandler, null, this)
  # enemy fire vs player
  game.physics.arcade.overlap(player, enemies_bullets, playerEnemyHandler, null, this)
  # bullets vs enemies
  game.physics.arcade.overlap(bullets, enemies, bulletEnemyHandler, null, this)
  # bullets vs bullets
  game.physics.arcade.collide(bullets, enemies_bullets)
  # enemies vs enemies
  # game.physics.arcade.collide(enemies)

#RENDER / DEBUG
render = ->
  #game.debug.text "Move with arrow keys. Shoot with spacebar.", 30, 40
  # game.debug.text "Clock Delay " + motion_timer.delay + " / Time " + time + " / Motion " + motion, 30, 65

#---------------------------------------------------
# Player CLASS
#---------------------------------------------------
Player = (game, x, y, sprite)->
  Phaser.Sprite.call @, game, x, y, sprite
  game.physics.arcade.enable @
  @game = game
  @anchor.set 0.5
  @checkWorldBounds = true
  @events.onOutOfBounds.add @reposition, @
  @body.drag.x = 1
  @body.drag.y = 1
  game.add.existing @

#EXTENDS SPRITE CLASS
Player.prototype = Object.create(Phaser.Sprite.prototype)
Player::constructor = Player

#PLAYER MOTION UPDATE LOOP
Player::motionUpdate = ->
  #player should move slightly faster than enemies
  speed_modifier = speed / 6
  if controls.up.isDown
    @body.velocity.y = -motion * speed_modifier
  else if controls.down.isDown
    @body.velocity.y = motion * speed_modifier 
  if controls.left.isDown
    @body.velocity.x = -motion * speed_modifier 
  else if controls.right.isDown
    @body.velocity.x = motion * speed_modifier
    
  # lack of movement
  if !controls.up.isDown and !controls.down.isDown and !controls.left.isDown and !controls.right.isDown
    if @body.velocity.x > 0 then @body.velocity.x -= (motion / 2)
    else if @body.velocity.x < 0 then @body.velocity.x += (motion / 2)
    if @body.velocity.y > 0 then @body.velocity.y -= (motion / 2)
    else if @body.velocity.y < 0 then @body.velocity.y += (motion / 2)

Player::reposition = ->
  if @x < 0 then @x = game.world.width
  else if @x > game.world.width then @x = 0
  else if @y < 0 then @y = game.world.height
  else if @y > game.world.height then @y = 0
  
Player::fireBullet = (h=false, v=false)->
  if game.time.now > bullet_time
    bullet = bullets.getFirstExists(false)
    if bullet
      bullet.reset @x, @y  
      bullet.h = h
      bullet.v = v
      bullet.mass = 1
      bullet_time = game.time.now + 150
  
#---------------------------------------------------
# BULLET CLASS
#---------------------------------------------------
Bullet = (game, x, y, sprite, h=false, v="up")->
  Phaser.Sprite.call @, game, x, y, sprite
  game.physics.arcade.enable @
  @game = game
  @exists = false
  @visible = false
  @checkWorldBounds = true
  @angle = 45
  @anchor.set 0.5
  @mass = 0.2
  @can_kill = true
  @h = h
  @v = v

#EXTENDS SPRITE CLASS
Bullet.prototype = Object.create(Phaser.Sprite.prototype)
Bullet::constructor = Bullet

#BULLET MOTION UPDATE LOOP
Bullet::motionUpdate = ->
     
    #bullets should move faster than characters
    speed_modifier = speed / 2
    switch @h
      when "left"
        @body.velocity.x = -motion * speed_modifier 
      when "right"
        @body.velocity.x = motion * speed_modifier
        
    switch @v
      when "up"
        @body.velocity.y = -motion * speed_modifier 
      when "down"
        @body.velocity.y = motion * speed_modifier
  
#---------------------------------------------------
# ENEMY CLASS
#---------------------------------------------------
Enemy = (game, x, y, sprite)->
  Phaser.Sprite.call @, game, x, y, sprite
  game.physics.arcade.enable @
  @game = game
  @anchor.set 0.5
  @checkWorldBounds = true
  @events.onOutOfBounds.add @reposition, @
  @body.bounce.x = 1
  @body.bounce.y = 1
  @body.drag.x = 1
  @body.drag.y = 1
  @type = _.sample([1...6]) # random. some enemies will follow the players, others just move around
  @can_kill = true
  @can_shoot = true

#EXTENDS SPRITE CLASS
Enemy.prototype = Object.create(Phaser.Sprite.prototype)
Enemy::constructor = Enemy

#ENEMY MOTION UPDATE LOOP
Enemy::motionUpdate = ->
  
  # move enemy based on type
  switch @type
    when 1
      # just move down
      @body.velocity.y = motion
    when 2
      # just move left
      @body.velocity.x = -motion
    when 3
      # just move right
      @body.velocity.x = motion
    else
      #follow the player
      @game.physics.arcade.moveToObject(@, player, motion)
      
  # shoot to kill!
  if @can_shoot 
    @fireBullet()
    @can_shoot = false
    
    # randomly throttle firing
    @game.time.events.add(Phaser.Timer.SECOND * @game.rnd.integerInRange(3, 10), ->
      @can_shoot = true
    , this)
    
Enemy::reposition = ->
  if @x < 0 then @x = game.world.width
  else if @x > game.world.width then @x = 0
  else if @y < 0 then @y = game.world.height
  else if @y > game.world.height then @y = 0

Enemy::fireBullet = ->
  bullet = new Bullet game, 0, 0, drawShape(10, 10, '#ff0000')
  enemies_bullets.add bullet
  bullet.reset @x, @y
  # shoot towards the player
  buffer = 100
  if player.x < @x - buffer  then h = "left"
  else if player.x > @x + buffer then h = "right"
  else h = false
  if player.y < @y - buffer then v = "up"
  else if player.y > @y + buffer then v = "down"
  else v = false 
  bullet.h = h
  bullet.v = v
  
#---------------------------------------------------
# INIT
#---------------------------------------------------
game = new Phaser.Game(900, 600, Phaser.AUTO, "game",
  preload: preload
  create: create
  update: update
  render: render
)