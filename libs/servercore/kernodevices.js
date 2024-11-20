
const { Device }   = require("./device.js")
const { Track }   = require("./track.js")
const { Http }   = require("./http.js")

class KernoDevices{
    
	constructor(){
        this.devices = [];
        this.setup = {};
        //TREBOL-10 registrar eventos de conexión
		this.events = [];
        //  TREBOL-11 controlar equipos desconectados con un bucle
		this.updateTimer(this);
        this.responses = [
            {trigger: "REQ_USSD",states: 
                [   "USSD_NUMBER",
                    "USSD_CREDIT_TOTAL",
                    "USSD_TIME",
                    "USSD_CREDIT_ADD",
                    "USSD_CREDIT_DATE",
                    "USSD_CREDIT_MAIN",
                    "USSD_CREDIT_DATA",
                    "USSD_SESSION_CREDIT_TOTAL",
                    "USSD_SESSION_TIME",
                    "USSD_SESSION_CREDIT_ADD",
                    "USSD_SESSION_CREDIT_DATE",
                    "USSD_SESSION_CREDIT_MAIN",
                    "USSD_SESSION_CREDIT_DATA",
                ]},
        ];
        this.checkStates = [
            {triggers: [
                {state:"IS_SESSION", value:'0'}
                ],
                transform : (device)=>{
                    if(device.connected){
                        device.connected = false;
                        device.endSession(true);
                        console.log("--end session")
                    }
                },
            },
            {triggers: [
                {state:"IS_SESSION", value:'1'}
                ],
                transform : (device)=>{
                    if(!device.connected){
                        device.connected = true;
                        device.startSession(true);
                        console.log("--start session");
                    }
                },
            }
        ];
        this.responsesTimeout = 120000;
    }
	updateTimer(self){
		self.update();
		setTimeout(()=>{this.updateTimer(self)},5000); // controlar desconexiones cada 5 segundos
	}
	addEvent(event){
		this.events.push(event);
	}
    setSetup(key,value){
        this.setup[key] = value;
    }
    deleteSetup(key){
        delete this.setup[key];
    }  
    getAllSetup(key){
        return this.setup;  
    }
    setupClear(){
        Object.keys(this.setup).forEach( key => {
            delete this.setup[key];
        });
    }
    
	/* new device */
	subscribe( device ){
        // TREBOL-10 registrar eventos de conexión
		this.events.forEach(e=>e.onNewDevice(device));
		this.devices.push(device);
	}

	/* out device */
	unsubscribe(device){
		var index = this.devices.indexOf(device);		
		if (index > -1){
			this.devices.splice(index, 1);
            //   TREBOL-11  registrar eventos de conexión
			this.events.forEach(e=>e.onRemoveDevice(device));
		}
	}
	getDevices(){
		let result = [];
		//return this.devices.map( d => { return {"id" : d.getId(), "config": d.config, "tracks": d.tracks}; });
		return this.devices.map( d => { return d.get() });
	}
	clearDevices(){
		this.devices.forEach(device=>{
            //    TREBOL-11  enviar eventos de desconexión o se limpiaron los equipos eliminados
			this.events.forEach(e=>e.onRemoveDevice(device));
		});
		this.devices = [];
		/*this.devices.forEach(device=>{
		/	device.deleteDevice();
		});*/
		console.log("KernoDevices.clearDevices: ", "ok");
		return "KernoDevices.clearDevices: " + "ok";
	}
    setSetupRequest(req,res,callback){
        let me = this;
        
        res.setHeader('Content-Type', 'application/json');
        let device = me.getDevice(req.params.id);
        Object.keys(req.body).forEach(k => {
            device.setSetup(k, req.body[k]);
            let _response = me.responses.find(r=>r.trigger == k);
            if(_response != null){
                device.addRequest({
                    timeout : me.responsesTimeout,
                    time: Date.now(),
                    process:(elapsed)=>{
                        let data = {id:device.id,states:{},response:'ok',elapsed:elapsed};
                        _response.states.forEach(r=> data.states[r] = device.getState(r) );
                        res.end(JSON.stringify(data));
                    },
                    processTimeout:()=>{
                        let data = {id:device.id,states:{},response:'timeout', elapsed: me.responsesTimeout};
                        res.end(JSON.stringify(data));
                    },
                    active : true,
                });
            }else{
                let data={response:'ok'};
                res.end(JSON.stringify(data));
            }
        });	
        callback(device);
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
            if (device.getState("ON_ROUTE") == "1")
			    device.setSetup('REQ_TRACK','1');	
		}
		return device;
	}
	removeDevice(device){
		this.events.forEach(e=>e.onRemoveDevice(device));
		this.devices.splice(this.devices.indexOf(device),1);
	}
	communication(){
		/*this.devices.forEach((device,index) => {
			device.communication(request,reponse);
		});*/
	}
	update(){
		let self = this;
		let currentTime = Date.now();
		this.devices.forEach(device=>{
            //TREBOL-45Agregar tiempo de retención de datos de servidor
			if (currentTime-device.lasttime > 14400000 ){			
				self.unsubscribe(device);
			}
		});		
	}
    processCheckStates(device){
        this.checkStates.forEach(checkState=>{
            let conditions = checkState.triggers.map(t=>device.states[t.state] == t.value).includes(false);            
          //  console.log(" condition " + conditions);
            if (!conditions){
                checkState.transform(device);    
            }            
        });
    }
	processStates(req,res, callback){
		let device = this.getDevice(req.params.id);
		device.updateTime();
        
        //TREBOL-12 configuración global de dispositivos
		Object.keys(req.body).forEach(k => {
			device.setState(k, req.body[k]);
		});	
		if ( device.getState("ID_SESSION") == "0" || device.getState("ID_SESSION") == "1"|| device.getState("ID_SESSION") == "" ){
			device.setSetup("REQ_UPDATE","1");
			console.log("Required session for " + device.id);
		}
		if ( !device.haveStates() ){
			device.setSetup("REQ_UPDATE","1");
			console.log("Required states for " + device.id);
		}
        //TREBOL-38 no se reciben tracks
		if ( !device.haveConfig() ){
            device.setSetup("REQ_APPS","1");
			device.setSetup("REQ_TRACK","1");
			device.setSetup("REQ_UPDATE","1");
			console.log("Required config for " + device.id);
		}
        
        //TREBOL-38 no se reciben tracks
		if ((device.elapsed > 25000 && device.getState("ON_ROUTE") == "1") || (device.getState("ON_ROUTE") == "1" && device.tracks.length == 0 )){						
            device.setSetup("REQ_TRACK","1");
			device.setSetup('REQ_UPDATE','1');	
			console.log("Required Track for " + device.id);
		}
		/*if (device.elapsed > 50000 ){			
			device.deleteDevice();
		}*/
        //TREBOL-13 Control de versiones dinámica 
        if (device.states['LAST_VERSION']!=this.setup['LAST_VERSION'] && this.setup['LAST_VERSION']!=undefined ){
            console.log("proccessing version for", device.id);
            device.setSetup("LAST_VERSION",this.setup['LAST_VERSION']);
            device.setSetup("UPDATE_URL",this.setup['UPDATE_URL']);
			device.setSetup('REQ_UPDATE','1');	
        }
        Object.keys(this.setup).forEach(k => {
            if (k == 'LAST_VERSION') return;
            if (k == 'UPDATE_URL') return;
            device.setSetup(k,this.setup[k]);
        });

        this.processCheckStates(device);

        device.processPendientRequest();
		callback(device);
	}
	processConfig(req,res, callback){
		let device = this.getDevice(req.params.id);
		Object.keys(req.body).forEach(k => {
			device.setConfig(k, req.body[k]);
		});
		callback(device);
	}
	processStatesFull(req,res, callback){
		let device = this.getDevice(req.params.id);
		Object.keys(req.body).forEach(k => {
			device.setState(k, req.body[k]);
		});
		callback(device);
	}
    
	process(message, callback){
        let data
        try{
		    data = JSON.parse(message);
        }catch(e){
            return;
        }
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
			acc:data.acc,
			stp:data['s'],
		});
		device.addTrack(track);
		device.setLast(track);
		//device.updateTime();
		callback(device,track);		
	}
}

module.exports = { KernoDevices } ;