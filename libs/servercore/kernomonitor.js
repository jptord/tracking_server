
const { Device }   = require("./device.js");
const { Track }   = require("./track.js");
const { Server } = require("socket.io");
const http = require('http');

class KernoClient{
	constructor(socket){
		this.socket = socket;
		this.devices = [];
	}
	addDevice(device){
		console.log('KernoClient.addDevice:',device.id);
		let deviceExist = this.devices.find(d=>d.id==device.id);
		if (deviceExist!=null) return; 		 
		this.devices.push(device);
	}
	removeDevice(device){
		console.log('KernoClient.removeDevice:',device.id);	
		let deviceExist = this.devices.find(d=>d.id==device.id);
		if (deviceExist==null) return; 		 
		this.devices.splice(this.devices.indexOf(device),1);
	}
	removeAll(){
		console.log('KernoClient.removeAll:');	
		this.devices=[];
	}
	haveDevice(device){
		return this.devices.find(d=>d.id==device.id)!=null;
	}
	emit(tag,msg){
		this.socket.emit(tag,msg);
	}
	emitAll(tag,msg){
	}
	emitDevice(device,tag,msg){
		if(!this.haveDevice(device))return;
		this.socket.emit(tag,msg);
	}
}

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
		this.kernoDevices.addEvent({
			onNewDevice:(device)=>{
				console.log("setDevices.onNewDevice",device.id);				
				this.clients.forEach(client =>
					client.emit('device.new',device.get())					
				);			
			},
			onRemoveDevice:(device)=>{
				console.log("setDevices.onRemoveDevice",device.getId());
				this.clients.forEach(client =>
					client.emit('device.remove',{id:device.getId()})					
				);			
			}
		});
	}
	config(){
		var server 	= this.server;
		var io 		= this.io;
		io.on('connection', (socket) => {
			let client = new KernoClient(socket);
			this.clients.push(client);
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
				/*console.log('device.id:',id);
				let device = this.kernoDevices.getDevice(id);
				if (device != null)
					socket.emit('device', device.get() );
				*/
			});
			
			socket.on('device.subscribe', (idArray) => {
				console.log('device.id:',idArray);
				if (Array.isArray(idArray)){
					idArray.forEach(idDevice=>{
						let device = this.kernoDevices.getDevice(idDevice);
						if (device == null) return ;
						client.addDevice(device);
					})
				}
			});
			socket.on('device.unsubscribe', (idDevice) => {
			
				let device = this.kernoDevices.getDevice(idDevice);
				if (device == null) return ;
				client.removeDevice(device);
			});
			socket.on('device.unsubscribe.all', () => {
				client.removeAll();
			});
			socket.on('disconnect', () => {
				console.log('usuario desconectado');
				this.clients.splice(this.clients.indexOf(client),1);
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
					client.emitDevice(device,'device.state',{id:device.getId(),states:device.getStates()})
				);
			if (device.trackUpdated)
				this.clients.forEach(client =>
					client.emitDevice(device,'device.tracks',{id:device.getId(),tracks:device.getTracks()})
				);
			if (device.setupUpdated)
				this.clients.forEach(client =>
					client.emitDevice(device,'device.setup',{id:device.getId(),setup:device.getSetups()})
				);
			if (device.configUpdated)
				this.clients.forEach(client =>
					client.emitDevice(device,'device.config',{id:device.getId(),config:device.getConfigs()})
				);
			if (device.lastUpdated)
				this.clients.forEach(client =>
					client.emitDevice(device,'device.last',{id:device.getId(),last:device.getLast()})					
				);						
		/*	if (device.isPaused)
				this.clients.forEach(client =>
					client.emit('device.pause',{id:device.getId(),pause_ini:device.states["PAUSE_INI"],last:device.getLastPause()})
				);*/
			if (device.isDeleted){
				this.clients.forEach(client =>
					client.emitDevice(device,'device.removed',{id:device.getId()})					
				);
				this.kernoDevices.removeDevice(device);
			}
			//client.emit('deviceUpdate',device.get());
	}
}

module.exports = { KernoMonitor } ;