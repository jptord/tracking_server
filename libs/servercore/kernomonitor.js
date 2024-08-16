
const { Device }   = require("./device.js");
const { Track }   = require("./track.js");
const { Server } = require("socket.io");
const http = require('http');

class KernoMonitor{
    
	

	constructor(params = {port:8989, app: null}){
		this.port 		= params.port;
		this.server 	= http.createServer(params.app);
        this.io 		= new Server(this.server, { cors: {
			origin: "*",
			//origin: "http://172.20.50.67:4200",
			methods: ["GET", "POST"],
		  }});				 
		//this.io.origin('*:*'); // for latest version
		this.clients	= [];
		//this.io.origins('*:*');
    }
	
	setDevices( kernoDevices ){
		this.kernoDevices = kernoDevices;
	}
	config(){
		var server 	= this.server;
		var io 		= this.io;
		io.on('connection', (socket) => {
			this.clients.push(socket);
			console.log('usuario conectado');		  
			socket.on('message', (msg) => {
				console.log('mensaje:',msg);
				socket.emit('devices',(this.kernoDevices.getDevices()));
			});
			/*socket.on('tracks', (id) => {
				console.log('tracks.id:',id);
				socket.emit('tracks',{id:id, tracks:this.kernoDevices.find(d => d.id == id).getTracks()} );
			});*/
			socket.on('device', (id) => {
				console.log('device.id:',id);
				let device = this.kernoDevices.getDevice(id);
				if (device != null)
					socket.emit('device', device.get() );
			});
			socket.on('disconnect', () => {
				console.log('usuario desconectado');
				this.clients.splice(this.clients.indexOf(socket),1);
			});
		});
	}

	start(){
		var server 	= this.server;
		var io 		= this.io;

		this.config();

		server.listen(this.port, () => {
			console.log(`escuchando puerto ws *:${this.port}`);
		});		
	}
	updateDevice(device){
			if (device.stateUpdated)				
				this.clients.forEach(client =>
					client.emit('device.state',{id:device.getId(),states:device.getStates()})
				);
			if (device.trackUpdated)
				this.clients.forEach(client =>
					client.emit('device.tracks',{id:device.getId(),tracks:device.getTracks()})
				);
			if (device.setupUpdated)
				this.clients.forEach(client =>
					client.emit('device.setup',{id:device.getId(),setup:device.getSetups()})
				);
			if (device.configUpdated)
				this.clients.forEach(client =>
					client.emit('device.config',{id:device.getId(),config:device.getConfigs()})
				);
			if (device.lastUpdated)
				this.clients.forEach(client =>
					client.emit('device.last',{id:device.getId(),last:device.getLast()})					
				);						
		/*	if (device.isPaused)
				this.clients.forEach(client =>
					client.emit('device.pause',{id:device.getId(),pause_ini:device.states["PAUSE_INI"],last:device.getLastPause()})
				);*/
			if (device.isDeleted){
				this.clients.forEach(client =>
					client.emit('device.removed',{id:device.getId()})					
				);
				this.kernoDevices.removeDevice(device);
			}
			//client.emit('deviceUpdate',device.get());
	}
}

module.exports = { KernoMonitor } ;