
const { Device }   = require("./device.js")
const { Track }   = require("./track.js")
class KernoDevices{
    
	constructor(){
        this.devices = [];
    }
	/* new device */
	subscribe( device ){
		this.devices.push(device);
	}

	/* out device */
	unsubscribe(device){
		var index = devices.indexOf(device);		
		if (index > -1)
			devices.splice(index, 1);		
	}

	getDevices(){
		let result = [];
		//return this.devices.map( d => { return {"id" : d.getId(), "config": d.config, "tracks": d.tracks}; });
		return this.devices.map( d => { return d.get() });
	}
	clearDevices(){
		this.devices = [];
		console.log("KernoDevices.clearDevices: ", "ok");
		return "KernoDevices.clearDevices: " + "ok";
	}

	sendNotification(deviceId, notification = {
		title: "title",
		text: "text",
		vibrate: false,
	}){
		let device = this.devices.find( d => d.id == deviceId );
		device.addNotification(notification);
	}

	getDevice(deviceId){
		let device = this.devices.find( d => d.id == deviceId );
		if (device==null) {
			device = new Device();
			device.setId(deviceId);
			this.subscribe(device);
		}
		if (Object.keys(device.config).length == 0){
			console.log("KernoDevices.getDevice.config ", device.id, device.config);
			device.setSetup('REQ_UPDATE','1');	
			device.setSetup('REQ_TRACK','1');	
		}
		return device;
	}
	communication(){
		/*this.devices.forEach((device,index) => {
			device.communication(request,reponse);
		});*/
	}
	
	processStates(req,res, callback){
		let device = this.getDevice(req.params.id);
		Object.keys(req.body).forEach(k => {
			device.setState(k, req.body[k]);
		});	
		if ((device.elapsed > 10000 && device.getState("ON_ROUTE") == "1") || (device.getState("ON_ROUTE") == "1" && device.tracks.length == 0 ))
			device.setSetup("REQ_TRACK","1");
		device.updateTime();
		callback(device);
	}
	processConfig(req,res, callback){
		let device = this.getDevice(req.params.id);
		Object.keys(req.body).forEach(k => {
			device.setConfig(k, req.body[k]);
		});	
		callback(device);
	}
	process(message, callback){
		let data = JSON.parse(message);
		//let device = this.devices.find( d => d.id == data.device );
		let device = this.getDevice(data.device);
		if (device==null) {
			device = new Device();
			device.setId(data.device);
			this.subscribe(device);
		}
		let track = new Track({
			t:data.t,
			lat:data.lat,
			lon:data.lon,
			bat:data.b,
			acc:data.acc
		});
		device.addTrack(track);
		device.setLast(track);
		device.updateTime();
		callback(device,track);		
	}
}

module.exports = { KernoDevices } ;