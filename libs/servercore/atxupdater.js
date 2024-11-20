const express = require("express");
const { exec,spawn  } = require("child_process");
const cp = require("child_process");const { files } = require("jszip");
;
var toDateStr = function (str){
    return str.replaceAll(":","").replaceAll("-","");
};

class AtxUpdater {
    constructor(options = {
        app : {name:''},
        scpData : { user:'', pass:'', host:'', base:'' },
        folderData : [],
        filesData : [],
        folderApp : [],
        filesApp : [],
        callbacks:{
            preBackup:null,
            postBackup:null,
            preRestore:null,
            postRestore:null,
        }
    }) {
        this.app = options.app;
        this.scpData = options.scpData;
        this.folderData = options.folderData;
        this.filesData = options.filesData;
        this.folderApp = options.folderApp;
        this.filesApp = options.filesApp;
        this.callbacks = options.callbacks;

        this.router = express.Router();
    }

    init() {
        let me = this;
        let servidor = this.router;
        
        servidor.get("/update_force", (req, res) => {
            console.log("update_force ");
            this.backupAll(req,res,(response)=>{ 
                console.log("/update backup data ended: " + response);
                exec(`cd /home/${me.app.name}; git reset --hard; git fetch; git pull origin main;`, (err, stdout1, stderr) => {
                    
                    console.log("/update stdout:", stdout1);
                    if (stdout1.includes("Updating")){
                        exec(`cd /home/${me.app.name}; npm i --force;`, (err, stdout1, stderr) => {
                            console.log("updated, and rebooting app");
                            res.end("updated[F], and rebooting app");
                            process.exit();                    
                        });
                        
                    }
                    console.log("err:", err);
                    console.log("nothing to update");
                    res.end("nothing to update[F]");
                });
            });
        });
        servidor.get("/update", (req, res) => {
            console.log("update ");
                     
            this.backupAll(req,res,(response)=>{ 
                console.log("/update backup data ended: " + response);
                exec(`cd /home/${me.app.name}; git fetch; git pull;`, (err, stdout1, stderr) => {
                    console.log("/update stdout:", stdout1);
                    if (stdout1.includes("Updating")){
                        console.log("updated, and rebooting app");
                        res.end("updated, and rebooting app");
                        process.exit();                    
                    }
                    console.log("err:", err);
                    console.log("nothing to update");
                    res.end("nothing to update");
                });
            });

           
        });
        servidor.get("/backup_app", (req, res) => {            
            this.backupApp(req,res,(response)=>{ 
                res.end("backup app ended: " + response);
            });
        });
        servidor.get("/backup_all", (req, res) => {             
            this.backupAll(req,res,(response)=>{ 
                res.end("backup all ended: " + response);
            });
        });
        servidor.get("/backup_data", (req, res) => {
            console.log("route /backup");                        
            this.backupData(req,res,(response)=>{ 
                res.end("backup data ended: " + response);
            });
        });
        servidor.post("/restore_data", (req, res) => {            
            this.restoreData(req,res,(response)=>{ 
                res.end("restore_data ended: " + response);
            });
        });
        servidor.post("/backup_app", (req, res) => {            
            this.backupApp(req,res,(response)=>{ 
                res.end("backup app ended: " + response);
            });
        });
        servidor.post("/backup_all", (req, res) => {             
            this.backupAll(req,res,(response)=>{ 
                res.end("backup all ended: " + response);
            });
        });
        servidor.post("/backup_data", (req, res) => {
            console.log("route /backup");                        
            this.backupData(req,res,(response)=>{ 
                res.end("backup data ended: " + response);
            });
        });
        servidor.post("/restore", (req, res) => {
            process.exit(); 
        });
        return servidor;
    }
    
    restoreData(req,res,callback){ 
        let app = this.app;
        let scpData = this.scpData;
        let folderData = this.folderData;
        let filesData = this.filesData;
        let folderApp = this.folderApp;
        let filesApp = this.filesApp;
        let callbacks = this.callbacks;
        if (callbacks!= null) if (callbacks.preRestore!= null) callbacks.preRestore();
        
        if (req.body.scpData!=undefined) scpData = req.body.scpData;
        if (req.body.folderData!=undefined) scpData = req.body.folderData;
        if (req.body.filesData!=undefined) scpData = req.body.filesData;
        if (req.body.folderApp!=undefined) scpData = req.body.folderApp;
        if (req.body.filesApp!=undefined) scpData = req.body.filesApp;

        //var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;            
        if (req.body.date == undefined){ callback("date is empty"); return;}
        let isodate = req.body.date;
        let cmds = [];
        
        //cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${app.name}_${isodate}_data'`);
        folderData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no -r ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_data/${f.replaceAll("./","")} ./`));
        filesData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_data ./`));        
        this.executeSerialize(cmds,0,'',(response)=>{
            if (callbacks!= null) if (callbacks.postRestore!= null) callbacks.postRestore();
            callback(response);
        });
    }
    backupData(req,res,callback){ 
        let app = this.app;
        let scpData = this.scpData;
        let folderData = this.folderData;
        let filesData = this.filesData;
        let folderApp = this.folderApp;
        let filesApp = this.filesApp;
        let callbacks = this.callbacks;
        if (callbacks!= null) if (callbacks.preBackup!= null) callbacks.preBackup();
        
        if (req.body.scpData!=undefined) scpData = req.body.scpData;
        if (req.body.folderData!=undefined) scpData = req.body.folderData;
        if (req.body.filesData!=undefined) scpData = req.body.filesData;
        if (req.body.folderApp!=undefined) scpData = req.body.folderApp;
        if (req.body.filesApp!=undefined) scpData = req.body.filesApp;

        var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;            
        let cmds = [];
        
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${app.name}_${isodate}_data'`);
        folderData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_data/${f.replaceAll("./","")}`));
        filesData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_data`));        
        this.executeSerialize(cmds,0,'',(response)=>{
            if (callbacks!= null) if (callbacks.postBackup!= null) callbacks.postBackup();
            callback(response);
        });
    }
    backupApp(req,res,callback){
        let app = this.app;
        let scpData = this.scpData;
        let folderData = this.folderData;
        let filesData = this.filesData;
        let folderApp = this.folderApp;
        let filesApp = this.filesApp;
        let callbacks = this.callbacks;
        if (callbacks!= null) if (callbacks.preBackup!= null) callbacks.preBackup();
        
        if (req.body.scpData!=undefined) scpData = req.body.scpData;
        if (req.body.folderData!=undefined) scpData = req.body.folderData;
        if (req.body.filesData!=undefined) scpData = req.body.filesData;
        if (req.body.folderApp!=undefined) scpData = req.body.folderApp;
        if (req.body.filesApp!=undefined) scpData = req.body.filesApp;

        var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;            
        let cmds = [];
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${app.name}_${isodate}_app'`);        
        folderApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_app/${f.replaceAll("./","")}`));
        filesApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_app`));
        this.executeSerialize(cmds,0,'',(response)=>{
            if (callbacks!= null) if (callbacks.postBackup!= null) callbacks.postBackup();
            callback(response);
        });
    }
    backupAll(req,res,callback){
        let app = this.app;
        let scpData = this.scpData;
        let folderData = this.folderData;
        let filesData = this.filesData;
        let folderApp = this.folderApp;
        let filesApp = this.filesApp;
        let callbacks = this.callbacks;
        if (callbacks!= null) if (callbacks.preBackup!= null) callbacks.preBackup();
        
        if (req.body.scpData!=undefined) scpData = req.body.scpData;
        if (req.body.folderData!=undefined) scpData = req.body.folderData;
        if (req.body.filesData!=undefined) scpData = req.body.filesData;
        if (req.body.folderApp!=undefined) scpData = req.body.folderApp;
        if (req.body.filesApp!=undefined) scpData = req.body.filesApp;

        var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;            
        let cmds = [];
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${app.name}_${isodate}_data'`);
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${app.name}_${isodate}_app'`);
        folderData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_data/${f.replaceAll("./","")}`));
        filesData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_data`));
        folderApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_app/${f.replaceAll("./","")}`));
        filesApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -o StrictHostKeyChecking=no ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${app.name}_${isodate}_app`));
        this.executeSerialize(cmds,0,'',(response)=>{
            if (callbacks!= null) if (callbacks.postBackup!= null) callbacks.postBackup();
            callback(response);
        });
    }
    executeSerialize(cmds, index, response, callback){
        let me = this;
        if (index == cmds.length){ callback(response); return;}
        console.log(`executing : ${cmds[index]}`);
        exec(cmds[index], (err, stdout, stderr) => {            
            if (err)
                console.log(`scp err: ${err}`);
            response += 'stdout : '+stdout +'\n';
            response += 'stderr: '+stderr +'\n';
            console.log(`scp stdout: ${stdout}`);
            console.log(`scp stdout: ${stderr}`);
            me.executeSerialize(cmds, index+1, response, callback);
        });
    }
}

module.exports = { AtxUpdater };
