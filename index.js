const { Servidor } = require("./libs/servercore/servidor.js");
const { Metajson } = require("./libs/servercore/metajson.js");
const { UdpServer } = require("./libs/updserver/udpserver.js")
const { KafkaGPS } = require("./libs/kafka/kafkagps.js")
const { KernoDevices } = require("./libs/servercore/kernodevices.js")
const { KernoMap } = require("./libs/servercore/kernomap.js")
const { KernoMonitor } = require("./libs/servercore/kernomonitor.js")
const { KernoApk } = require("./libs/servercore/kernoapk.js")
const { AtxUpdater } = require("./libs/servercore/atxupdater.js")
const fs = require('node:fs');
const { version } = require("node:os");

let servidor = new Servidor("8989", __dirname + '/public');
let metajson = new Metajson('datos.json');
let udpServerLive = new UdpServer(9944);
let udpServerTrack = new UdpServer(9945);
let kafkagps = new KafkaGPS({ brokers: ["172.20.50.67:9092"] });
let kernoDevices = new KernoDevices();
let kernoApk = new KernoApk();
let kernoMap = new KernoMap();
let atxupdater = new AtxUpdater({
    app:{
       name:'tracking-capture'
    },
    scpData : {
        user:'root',
        pass:'Facil123',
        host:'172.20.50.59',
        base:'/mnt/disk1/desarrollo/backups',
    },
    folderData : [
         './tracks'
    ],
    filesData : [],
    folderApp : [
         './public',
         './tracks',
         './libs'
    ],
    filesApp : [
         'Dockerfile',
         'index.js',
         'proxyserver.js',
         'package.json',
         'README.md',
         '.gitignore',
         '.gitmodules'
    ],
    callbacks : {
        preRestore : ()=>{ console.log("preRestore") },
        postRestore : ()=>{ console.log("postRestore") },
        preBackup : ()=>{ console.log("preBackup") },
        postBackup : ()=>{ console.log("postBackup") },
    }
});
let kernoMonitor = new KernoMonitor({ port: 7777, app: servidor });
kernoMonitor.setDevices(kernoDevices);
kernoMonitor.start();

const SAVE_TIME = 50;
const DEBUG_LEVEL = 4; //5,4,3,2,1,0 HIGH - LOW   

udpServerLive.addReceiveEvent((msg) => {
  kafkagps.send('gps-live',msg);
});

udpServerTrack.addReceiveEvent((msg) => {
  kafkagps.send('gps-track',msg);
});

servidor.use(`/atxupdater`, atxupdater.init());

servidor.use(`/kernomap`, kernoMap.publicar());

servidor.get('/connected', (req, res) => {
	console.log('connected test');
	res.end(JSON.stringify({ result:"ok" }));
});
servidor.get('/', (req, res) => {
	console.log('connected test');
	res.end(JSON.stringify({ result:"server 7777 ok " }));
});
servidor.get('/info', (req, res) => {
	console.log('info');
	console.log(udpServerLive.getInfo());
	console.log(udpServerTrack.getInfo());
    res.end(JSON.stringify({ liveServer: udpServerLive.getInfo(), trackServer: udpServerTrack.getInfo()}));
});

servidor.get('/readme', (req, res) => {
    fs.readFile('./README.md', 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        
        res.end( data );
      });
	
});

servidor.get('/devices', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "devices": kernoDevices.getDevices() }));
});
//TREBOL-12 configuración global de dispositivos
servidor.get('/devices/setup', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "setup": kernoDevices.getAllSetup() }));
});
//TREBOL-12 configuración global de dispositivos
servidor.post('/devices/setup', (req, res) => {
	Object.keys(req.body).forEach(k => {
        kernoDevices.setSetup(k,req.body[k]);
	});
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "setup": kernoDevices.getAllSetup() }));
});
servidor.get('/devices/setup/version', (req, res) => { 
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "setup": kernoDevices.getAllSetup() }));
});
servidor.post('/devices/setup/version', (req, res) => {
    let LAST_VERSION = req.body.LAST_VERSION;
    let UPDATE_URL = req.body.UPDATE_URL;
    kernoDevices.setSetup('LAST_VERSION',LAST_VERSION);
    kernoDevices.setSetup('UPDATE_URL',UPDATE_URL);
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "setup": kernoDevices.getAllSetup() }));
});

servidor.get('/devices/setup/clear', (req, res) => {
    kernoDevices.setupClear();
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "setup": kernoDevices.getAllSetup() }));
});

servidor.get('/devices/clear', (req, res) => {
	console.log("route /device/:id/track");
	let result = kernoDevices.clearDevices();	
	res.end(`{"result":"${result}"}`);
});

servidor.get('/device/:id/tracks', (req, res) => {
	let device = kernoDevices.getDevice(req.params.id);
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "tracks": device.getTracks() }));
});

servidor.get('/device/:id/apps', (req, res) => {
	let device = kernoDevices.getDevice(req.params.id);
    res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ "apps": device.getApps() }));
});

servidor.post('/device/:id/update/track', (req, res) => {
	console.log("route /device/:id/track");
	let device = kernoDevices.getDevice(req.params.id);
	device.setTracks( req.body['track'] ,'base64');
	res.end(`{"result":"ok"}`);
});

servidor.post('/device/:id/update/apps', (req, res) => {
	console.log("route /device/:id/update/apps");
	let device = kernoDevices.getDevice(req.params.id);
	device.setApps( req.body['apps'] ,'base64');
    device.setAppsHistory( req.body['history'] ,'base64');
	res.end(`{"result":"ok"}`);
});

/* ONLY DEVELOP */
servidor.get('/devices/clear', (req, res) => {
	console.log("route /device/:id/track");
	let result = kernoDevices.clearDevices();	
	res.end(`{"result":"${result}"}`);
});

servidor.get('/device/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
	let device = kernoDevices.getDevice(req.params.id);
	if (device != null)
		res.end(JSON.stringify(device.get()));
	else
		res.end();
});

servidor.post('/device/:id/startapp', (req, res) => {
	console.log("/device/:id/startapp");
	let device = kernoDevices.getDevice(req.params.id);
	Object.keys(req.body).forEach(k => {
		device.setConfig(k, req.body[k]);
	});
	console.log(device.config);
	console.log("req.body", req.body);
	res.end(`{"result":"ok"}`);
});

let last_version = '1.0.14';
servidor.post('/device/:id/update/state/silence', (req, res) => {
	//console.log("/device/:id/update/state/silence",req.params.id);
	kernoDevices.processStates( req,res, (device) => {
		kernoMonitor.updateDevice(device);
		res.end(JSON.stringify(device.getAllSetup()));
	});
});

servidor.post('/device/:id/update/config', (req, res) => {
	console.log("/device/:id/update/config ",req.params.id);
	kernoDevices.processConfig( req,res, (device) => {		
		kernoMonitor.updateDevice(device);
		res.end(`{"result":"ok"}`);
	});
});

servidor.post('/device/:id/setup/state', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
	console.log("/device/:id/setup/state ",req.params.id);
	let device = kernoDevices.getDevice(req.params.id);
	Object.keys(req.body).forEach(k => {
		device.setSetup(k, req.body[k]);
	});	
	kernoMonitor.updateDevice(device);
	res.end(`{"result":"ok"}`);
});

// ???
servidor.get('/device/:id/update', (req, res) => {
	let device = kernoDevices.getDevice(req.params.id);
	kernoMonitor.updateDevice(device);
	if (device != null)
		res.end(JSON.stringify(device.tracks));
	else
		res.end();
});

servidor.get('/device/:id/reset', (req, res) => {
	let device = kernoDevices.getDevice(req.params.id);
	device.clearTrack();
	kernoMonitor.updateDevice(device);
	if (device != null){
		res.setHeader('Content-Type', 'application/json');
		res.end(`{"result":"ok"}`);
	}else
		res.end();
});

servidor.get('/device/:id/clear', (req, res) => {
	let device = kernoDevices.getDevice(req.params.id);
	device.deleteDevice();
	if (device != undefined) kernoMonitor.updateDevice(device);	
	if (device != null){
		res.setHeader('Content-Type', 'application/json');
		res.end(`{"result":"ok"}`);
	}else
		res.end();
});

servidor.get('/data', (req, res) => {
	kernoDevices.process(req.query.msg, (d, t) => {
		kernoMonitor.updateDevice(d);
	});
	if (DEBUG_LEVEL >= 5) console.log(req.query.msg);
	res.end();
});
