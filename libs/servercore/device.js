
const fs = require('node:fs');
const decompress = require('decompress');
const { Track }   = require("./track.js")

let HISTORY_MAX_TIME    = 2120000;
let TRACKS_MAX_TIME     = 960000;
class Device{
    
	constructor(){
		this.id 			= '0';
		this.brand 			= '0';
		this.model 			= '0';
		this.elapsed		= 0;
		this.lasttime		= Date.now();
		this.notifications 	= [];
		this.tracks 		= []; //MANTENER
		this.tracksHistory  = [];
		this.last			= {};
		this.states 		= {};
		this.setup 			= {};
		this.config 		= {};
        this.apps           = [];
        this.lastAppend     = -1;
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
		this.isCleared		= false;
        this.endedTrack     = false;
        this.endedSession   = false;
        this.startedSession = false;
        //TREBOL-45 Agregar tiempo de retención de datos de servidor
        this.connected		= true;
        this.request       = [];        
    }
    processPendientRequest(){        
        //console.log("process pendients");
		if ( this.setupUpdated ) return ;
        this.request.forEach((request,i)=>{
            //console.log("process pendient " + i);
            if (request.active)
                request.process(Date.now()-request.time);
            request.active = false;            
        });
        this.request = [];
    }
    addRequest(request){
        //console.log("request added");
        setTimeout(()=>{
            //console.log("setTimeout check");
            if (request.active){
                request.active = false;
                request.processTimeout();
                //console.log("setTimeout active ended");
                this.request.splice(this.request.indexOf(request),1);
            }
        },request.timeout);
        this.request.push(request);
    }
    //TREBOL-45 Agregar tiempo de retención de datos de servidor
    createRecords(tracks){
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
	clearDevice(){
		this.isCleared = true;
	}
    endTrack(value){
        this.endedTrack = value;
    }    
    endSession(value){
        this.endedSession = value;
    }    
    startSession(value){
        this.startedSession = value;
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
            //console.log("device.setApps: ",`tracks/apps-${this.id}.zip`);
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
            //console.log("device.setAppsHistory: ",`tracks/apps-history-${this.id}.zip`);
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
            //console.log("device.setTracks: ",`tracks/track-${this.id}.zip`);
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
                    if (me.states['ON_ROUTE']!=1){
                        console.log("setTracks me.states['ON_ROUTE']",me.states['ON_ROUTE'] );
                        me.clearTrack();
                    }
					
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
    parseTrack(track){
        return {t:Number(track.t),lat:Number(track.lat),lon:Number(track.lon),bat:Number(track.bat),acc:Number(track.acc),stp:Number(track.stp)}
    }
	addTrack(track){		
		this.tracks.push(this.parseTrack(track));
		//this.trackUpdated = true;
	}
	setLast(track){		
		this.last = track;
		this.lastUpdated = true;
	}
    trimHistory(time){
        let tempHistory = [];
        let fromTime = Date.now() - time; //16hrs
        for(let i=0; i < this.tracksHistory.length; i++){
            if(this.tracksHistory[i].t>fromTime)
                tempHistory.push(this.tracksHistory[i]);
        }
        //console.log("trimHistory trimed to:",tempHistory.length);
        return tempHistory;        
    }
    swapHistory(){
        var stats = fs.statSync(`tracks/track-history-${this.id}.txt`)
        var fileSizeInBytes = stats.size;
        var fileSizeInKBytes = stats.size/1024;
        //var fileSizeInMegabytes = fileSizeInBytes / (1024*1024);
        if (fileSizeInKBytes>6){ //if > 2k  swap history
          //  console.log("swap history");
            let dateString = new Date().toISOString().replaceAll(':','').replaceAll('-','');
            fs.rename( `tracks/track-history-${this.id}.txt`, `tracks/track-history-${this.id}-${dateString}.txt`, ()=>{} )
            fs.writeFile(`tracks/track-history-${this.id}.txt`, "", err => {});
        }

    }
    appendTrack(){
        //console.log("appendTrack start");
        //console.log("appendTrack this.tracks ", this.tracks.length);
        this.tracksHistory.push(...this.tracks);
        let me = this;
        let content = "";
        this.tracks.forEach(t=> {
            if (t.t<me.lastAppend) return;
            content += `${t.t}\t${t.lat}\t${t.lon}\t${t.bat}\t1\t${t.acc}\t${t.stp}\n`;
        });
        fs.appendFile(`tracks/track-history-${this.id}.txt`, content, err => {});
        this.tracksHistory = this.trimHistory(HISTORY_MAX_TIME);
        this.swapHistory();
        //console.log("appendTrack ended");
        this.lastAppend = Date.now(); 
    }
    recoverHistory(){
        //history + currentTracks        
        let me = this;
        //console.log("recoverHistory recovering tracks " );
        let existFile = fs.existsSync(`tracks/track-history-${this.id}.txt`);
        if (!existFile) {
            fs.writeFile(`tracks/track-history-${this.id}.txt`, "", err => {});
            //console.log("recoverHistory no exist history" );
            return;
        }
        fs.readFile(`tracks/track-history-${this.id}.txt`,"utf8", (err, data) => {
            let lines = data.trim().split('\n');
            me.tracksHistory = [];
            lines.forEach( line => {
                let [t,lat,lon,b,int,acc,stp] = line.split('\t');
                if (t!="")
                    me.tracksHistory.push(new Track({t:t,lat:lat,lon:lon,bat:b,acc:acc,stp:stp,}));
            });            
            me.tracksHistory    = me.trimHistory(HISTORY_MAX_TIME);
            me.tracks           = me.trimHistory(TRACKS_MAX_TIME);
            //console.log("recoverHistory recovered " + me.tracks.length + "tracks");
        })
        this.lastAppend = Date.now(); 
    }
	clearTrack(){
        //if (this.states['ON_ROUTE']=="0")
        this.appendTrack();
		this.tracks = [];
        this.tracks.push(...this.trimHistory(TRACKS_MAX_TIME)); 
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