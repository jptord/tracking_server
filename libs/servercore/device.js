
const fs = require('node:fs');
const decompress = require('decompress');
const { Track }   = require("./track.js")
class Device{
    
	constructor(){
		this.id 			= '0';
		this.brand 			= '0';
		this.model 			= '0';
		this.elapsed		= 0;
		this.lasttime		= Date.now();
		this.notifications 	= [];
		this.tracks 		= [];
		this.last			= {};
		this.states 		= {};
		this.setup 			= {};
		this.config 		= {};
		this.needUpdate		= false;
		this.configUpdated	= false;
		this.trackUpdated	= false;
		this.lastUpdated	= false;
		this.stateUpdated	= false;
		this.setupUpdated	= false;
		this.isPaused		= false;
		this.route			= {};
		this.personal		= {};
    }
	getSetups(){ 
		this.setupUpdated=false;
		return this.setup;
	}
	getStates(){ 
		this.stateUpdated=false;
		return this.states;
	}
	getConfigs(){ 
		this.configUpdated=false;
		return this.config;
	}
	get(){		
		return {"id" : this.getId(), "config": this.config, "elapsed":this.elapsed, "setup": this.setup, "states": this.states, "tracks": [],last: this.last };
	}
	getAllSetup(){
		let setup = { ... this.setup }; 
		this.setup = {};
		this.setupUpdated = false;
		return setup;
	}

	updateTime(){
		this.elapsed = Date.now()-this.lasttime;
		this.lasttime = Date.now();
	}

	getLast(){
		this.lastUpdated = false;
		return this.last;
	}
	getLastPause(){
		this.lastUpdated = false;
		this.last.t = Date.now();
		return this.last;
	}
	getTracks(){
		this.trackUpdated = false;
		return this.tracks;
	}
	setTracks(b64, type="base64"){
		let me = this;
		if (type == 'base64'){
			fs.writeFile(`tracks/track-${this.id}.txt`, b64, err => {});
			
			const decoded = Buffer.from(b64, "base64");			
			fs.writeFile(`tracks/track-${this.id}.zip`, decoded, err => {});
			
			decompress(decoded, 'dist').then(files => {
				let content = "";
				files.forEach(f => {
					const rowString = Buffer.from(f.data);
					//console.log(rowString.toString());
					me.tracks = [];
					let lines = rowString.toString().split('\n');
					lines.forEach( line => {
						let [t,lat,lon,b,acc] = line.split('\t');
						me.addTrack(new Track({
							t:t,
							lat:lat,
							lon:lon,
							bat:b,
							acc:acc
						}));
					});
					me.trackUpdated = true;
				})
			});
		}
	}
	getId(){
		return this.id;
	}
	setId(id){
		this.id = id;
	}
	update(){
		this.needUpdate = true;
	}
	addNotification(notification){		
		this.notifications.push(notification);
	}
	addTrack(track){		
		this.tracks.push(track);	
		//this.trackUpdated = true;
	}
	setLast(track){		
		this.last = track;
		this.lastUpdated = true;
	}
	setConfig(key, value){
		if (value == undefined) return;
		if (this.config[key] != value) this.configUpdated = true;	
		this.config[key] = value;	
	}
	getConfig(key){
		this.configUpdated = false;
		return this.config[key];
	}
	setState(key, value){		
		if (this.states[key] != value) this.stateUpdated = true;
		if (key == 'IS_PAUSE') this.isPaused = value=="1";
		this.states[key] = value;
	}
	getState(key){
		return this.states[key];
	}
	setSetup(key, value){
		if (value == undefined) return;
		if (this.setup[key] != value) this.setupUpdated = true;
		this.setup[key] = value;
		this.setupUpdated = true;
	}
	getSetup(key){
		return this.setup[key];
	}
	communication(request, response, callback){

	}
}

module.exports = { Device } ;