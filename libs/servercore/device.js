
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
		this.tracks 		= []; //MANTENER
		this.tracksHistory     = [];
		this.last			= {};
		this.states 		= {};
		this.setup 			= {};
		this.config 		= {};
        this.apps           = [];
        this.appsHistory    = [];
		this.needUpdate		= false;
		this.configUpdated	= false;
		this.trackUpdated	= false;
		this.lastUpdated	= false;
		this.stateUpdated	= false;
		this.setupUpdated	= false;
        this.appsUpdated    = false;
		this.route			= {};
		this.personal		= {};		
		this.isDeleted		= false;
        //TREBOL-45Agregar tiempo de retención de datos de servidor
        this.connected		= true;
    }
    //TREBOL-45 Agregar tiempo de retención de datos de servidor
    createRecords(trackas){
        this.records.push({
            date:Date.now(),
            track:track,
        });
    }
    haveStates(){
        if (Object.keys(this.states).length > 0) return true;
        return false;
    }
    haveConfig(){        
        if (Object.keys(this.config).length > 0) return true;
        return false;
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
	deleteDevice(){
		this.isDeleted = true;		
	}
	get(){		
		return {"id" : this.getId(), "config": this.config, "elapsed":this.elapsed, "setup": this.setup, "states": this.states, "tracks": [],last: this.last };
	}
	getApps(){		
		return {"apps" : this.apps, "history": this.appsHistory};
	}
	getAllSetup(){
		let setup = JSON.parse(JSON.stringify(this.setup)); 
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
	getTracksHistory(){
		return this.tracksHistory;
	}
    
	setApps(b64, type="base64"){
		let me = this;
		if (type == 'base64'){
			//fs.writeFile(`tracks/apps-${this.id}.txt`, b64, err => {}); ONLY FOR DEBUG
			const decoded = Buffer.from(b64, "base64");			
            console.log("device.setApps: ",`tracks/apps-${this.id}.zip`);
			fs.writeFile(`tracks/apps-${this.id}.zip`, decoded, err => {});            
			decompress(decoded, 'dist').then(files => {
				let content = "";
				files.forEach(f => {
					const rowString = Buffer.from(f.data);
					me.apps = [];
					let lines = rowString.toString().split('\n');
					lines.forEach( line => {
						let [t,s,c,p,n] = line.split('\t');
                        if (t!="")
                            me.addApp({
                                t:t,sta:s,cha:c,pak:p,nam:n
                            });
					});
					me.appsUpdated = true;
				})
			});
		}
	}
	setAppsHistory(b64, type="base64"){
		let me = this;
		if (type == 'base64'){
			//fs.writeFile(`tracks/apps-history-${this.id}.txt`, b64, err => {}); ONLY FOR DEBUG
			 
			const decoded = Buffer.from(b64, "base64");			
            console.log("device.setAppsHistory: ",`tracks/apps-history-${this.id}.zip`);
			fs.writeFile(`tracks/apps-history-${this.id}.zip`, decoded, err => {});            
			decompress(decoded, 'dist').then(files => {
				let content = "";
				files.forEach(f => {
					const rowString = Buffer.from(f.data);
					me.appsHistory = [];
					let lines = rowString.toString().split('\n');
					lines.forEach( line => {
						let [t,s,c,p,n] = line.split('\t');
                        if (t!="")
                            me.addAppHistory({
                                t:t,sta:s,cha:c,pak:p,nam:n
                            });
					});
					me.appsUpdated = true;
				})
			});
		}
	}
	setTracks(b64, type="base64"){
		let me = this;
		if (type == 'base64'){
			fs.writeFile(`tracks/track-${this.id}.txt`, b64, err => {});
			
			const decoded = Buffer.from(b64, "base64");			
            console.log("device.setTracks: ",`tracks/track-${this.id}.zip`);
			fs.writeFile(`tracks/track-${this.id}.zip`, decoded, err => {});            
			decompress(decoded, 'dist').then(files => {
				let content = "";
				files.forEach(f => {
					const rowString = Buffer.from(f.data);
					//console.log(rowString.toString());
					me.tracks = [];
					let lines = rowString.toString().split('\n');
					lines.forEach( line => {
						let [t,lat,lon,b,int,acc,stp] = line.split('\t');
                        if (t!="")
                            me.addTrack(new Track({
                                t:t,
                                lat:lat,
                                lon:lon,
                                bat:b,
                                acc:acc,
                                stp:stp,
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
	addApp(app){		
		this.apps.push(app);	
	}
	addAppHistory(app){		
		this.appsHistory.push(app);	
	}
	addTrack(track){		
		this.tracks.push(track);	
		//this.trackUpdated = true;
	}
	setLast(track){		
		this.last = track;
		this.lastUpdated = true;
	}
    appendTrack(){
        this.tracksHistory.push(...this.tracks);        
    }
	clearTrack(){
        //if (this.states['ON_ROUTE']=="0")
            this.appendTrack();
		this.tracks = [];
		this.trackUpdated = true;
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
		if (key == 'IS_PAUSE') {
            this.isPaused = value=="1";
        }
		this.states[key] = value;
        /* TREBOL-37 Verificación de pausas en base al último trayecto  */
		if (key == 'IS_PAUSE') {
            this.states['IS_PAUSE'] = this.last.stp;
        }
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