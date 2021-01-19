# USAGE:
# 1. include this pen in your pen's javascript assets
# 2. create a new instance with `var preview = new PreviewImage("path/to/your/image.jpg");
# 3. kill it when you want it to go away `p.clear();`
# var p = new PreviewImage("https://s3-us-west-2.amazonaws.com/s.cdpn.io/150586/angry-bossman-v2.png");
#p.clear();

PreviewImage = (url) ->
  pi = 
    setup: ->
      pi.el = document.createElement('div')
      pi.el.style.background = 'url(' + url + ') no-repeat center center'
      pi.el.style.backgroundSize = 'cover'
      pi.el.style.zIndex = '1000'
      pi.el.style.width = '100%'
      pi.el.style.top = '0'
      pi.el.style.bottom = '0'
      pi.el.style.left = '0'
      pi.el.style.position = 'fixed'
      document.body.appendChild pi.el
      return
    clear: ->
      pi.el.remove()
      return
  pi.setup()
  pi
