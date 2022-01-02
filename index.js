const { app, BrowserWindow, ipcMain } = require('electron')
const hook = require('iohook')
const WebSocket = require('ws')
const robot = require('robotjs')
robot.setMouseDelay(0)
robot.setKeyboardDelay(0)
const { networkInterfaces } = require(`os`)
const nets = networkInterfaces()
const results = Object.create(null)
var win
var ipv4
var prefix
var c2
var weso
for(const name of Object.keys(nets)){
	for(const net of nets[name]){
		if(net.family === `IPv4` && !net.internal){
			if(!results[name]){
				results[name] = []
			}
			results[name].push(net.address)
			ipv4 = results[name][0]
            prefix = ipv4.slice(0, -ipv4.split('.')[ipv4.split('.').length - 1].length - 1)
            console.log(prefix)
		}
	}
}
var wss = new WebSocket.Server({ port: 81 })
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message)
        if(message.toString() == 'request'){
            win.webContents.send('channel', ['request'])
        }
        message = message.toString().split('&&')
        if(message[0]){
            switch(message[0]){
                case 'keypress':
                    modifiers = []
                    if(message[2] === true){
                        modifiers.push('shift')
                    }
                    if(message[3] === true){
                        modifiers.push('alt')
                    }
                    if(message[3] === true){
                        modifiers.push('ctrl')
                    }
                    if(message[3] === true){
                        modifiers.push('command')
                    }
                    robot.keyTap(message[1], modifiers)
                break
                case 'mousemove':
                    robot.moveMouse(robot.getScreenSize().width / (100 / message[1]), robot.getScreenSize().height / (100 / message[2]))
                break
                case 'mouseclick':
                    if(message[1] === 1){
                        robot.mouseClick('left')
                    }else{
                        robot.mouseClick('right')
                    }
                break
                case 'mousewheel':
                    robot.scrollMouse(message[1])
                break
            }
        }else{
            console.log(message)
        }
    })
})
app.on('ready', function(){
    win = new BrowserWindow({
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.loadFile(`${__dirname}/index.html`)
    win.webContents.on('did-finish-load', function(){
        win.webContents.send('channel', ['dc', ipv4.replace(prefix+'.', '')])
    })
    ipcMain.on('channel', (err, msg)=>{
        switch(msg[0]){
            case 'request':
                weso = new WebSocket(`ws://${prefix}.${msg[1]}:81`)
                weso.onopen = function(){
                    weso.send('request')
                }
            break
            case 'accept':
                c2 = weso
            break
        }
    })
})

hook.on('keypress', function(e){
    if(c2 != null){
        c2.send(`keypress&&${String.fromCharCode(e.keychar)}&&${e.shiftKey, e.altKey, e.ctrlKey, e.metaKey}`)
    }
})
hook.on('mousemove', function(e){
    if(c2){
        c2.send(`mousemove&&${(e.x * 100) / robot.getScreenSize().width}&&${(e.x * 100) / robot.getScreenSize().height}`)
    }
})
hook.on('mouseclick', function(e){
    if(c2 != null){
        c2.send(`mouseclick&&${e.button}`)
    }
})
hook.on('mousewheel', function(e){
    if(c2 != null){
        c2.send(`mousewheel&&${e.rotation}`)
    }
})
hook.on('mousedrag', function(e){
    if(c2 != null){
        c2.send(`mousemove&&${(e.x * 100) / robot.getScreenSize().width}&&${(e.x * 100) / robot.getScreenSize().height}`)
    }
})
hook.start()