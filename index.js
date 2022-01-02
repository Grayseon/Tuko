const { app, BrowserWindow, ipcMain } = require('electron')
const hook = require('iohook')
const WebSocket = require('ws')
const robot = require('robotjs')
robot.setMouseDelay(0)
robot.setKeyboardDelay(0)
const { networkInterfaces } = require(`os`)
const nets = networkInterfaces()
const results = Object.create(null)
var ipv4
var prefix
var c2
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
    })
})
app.on('ready', function(){
    var win = new BrowserWindow({
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
                new WebSocket(`ws://${prefix}.${msg[1]}:81`).send(['request'])
            break
        }
    })
})

hook.on('keydown', function(e){
    console.log(e)
})
hook.start()