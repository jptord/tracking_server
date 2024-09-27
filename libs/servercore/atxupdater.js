const express = require("express");
const { exec,spawn  } = require("child_process");
const cp = require("child_process");const { files } = require("jszip");
;
var toDateStr = function (str){
    return str.replaceAll(":","").replaceAll("-","");
};

class AtxUpdater {
    constructor(options = {
        scpData : { user:'', pass:'', host:'', base:'', app:'' },
        folderData : [],
        filesData : [],
        folderApp : [],
        filesApp : []
    }) {
        this.scpData = options.scpData;
        this.folderData = options.folderData;
        this.filesData = options.filesData;
        this.folderApp = options.folderApp;
        this.filesApp = options.filesApp;

        this.router = express.Router();
    }

    init() {
        let servidor = this.router;
        servidor.get("/update", (req, res) => {
            console.log("update ");
                     
            this.backupAll(req,res,(response)=>{ 
                console.log("/update backup data ended: " + response);
                exec(`cd /home/${this.scpData.app}; git fetch; git pull;`, (err, stdout1, stderr) => {
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
        servidor.get("/restore", (req, res) => {
            process.exit();
        });
        return servidor;
    }
    backupData(req,res,callback){ 
        let scpData = this.scpData;
        let folderData = this.folderData;
        let filesData = this.filesData;
        let folderApp = this.folderApp;
        let filesApp = this.filesApp;
        
        if (req.body.scpData!=undefined) scpData = req.body.scpData;
        if (req.body.folderData!=undefined) scpData = req.body.folderData;
        if (req.body.filesData!=undefined) scpData = req.body.filesData;
        if (req.body.folderApp!=undefined) scpData = req.body.folderApp;
        if (req.body.filesApp!=undefined) scpData = req.body.filesApp;

        var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;            
        let cmds = [];
        
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${scpData.app}_${isodate}_data'`);
        folderData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_data/${f.replaceAll("./","")}`));
        filesData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_data`));        
        this.executeSerialize(cmds,0,'',(response)=>{
            callback(response);
        });
    }
    backupApp(req,res,callback){
        let scpData = this.scpData;
        let folderData = this.folderData;
        let filesData = this.filesData;
        let folderApp = this.folderApp;
        let filesApp = this.filesApp;
        
        if (req.body.scpData!=undefined) scpData = req.body.scpData;
        if (req.body.folderData!=undefined) scpData = req.body.folderData;
        if (req.body.filesData!=undefined) scpData = req.body.filesData;
        if (req.body.folderApp!=undefined) scpData = req.body.folderApp;
        if (req.body.filesApp!=undefined) scpData = req.body.filesApp;

        var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;            
        let cmds = [];
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${scpData.app}_${isodate}_app'`);        
        folderApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_app/${f.replaceAll("./","")}`));
        filesApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_app`));
        this.executeSerialize(cmds,0,'',(response)=>{
            callback(response);
        });
    }
    backupAll(req,res,callback){
        let scpData = this.scpData;
        let folderData = this.folderData;
        let filesData = this.filesData;
        let folderApp = this.folderApp;
        let filesApp = this.filesApp;
        
        if (req.body.scpData!=undefined) scpData = req.body.scpData;
        if (req.body.folderData!=undefined) scpData = req.body.folderData;
        if (req.body.filesData!=undefined) scpData = req.body.filesData;
        if (req.body.folderApp!=undefined) scpData = req.body.folderApp;
        if (req.body.filesApp!=undefined) scpData = req.body.filesApp;

        var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;            
        let cmds = [];
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${scpData.app}_${isodate}_data'`);
        cmds.push(`sshpass -p ${scpData.pass} ssh ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${scpData.app}_${isodate}_app'`);
        folderData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_data/${f.replaceAll("./","")}`));
        filesData.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_data`));
        folderApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_app/${f.replaceAll("./","")}`));
        filesApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_app`));
        this.executeSerialize(cmds,0,'',(response)=>{
            callback(response);
        });
    }
    executeSerialize(cmds, index, response, callback){
        let me = this;
        if (index == cmds.length){ callback(response); return;}
        exec(cmds[index], (err, stdout, stderr) => {            
            if (err)
                console.log(`scp err: ${err}`);
            response += 'stdout :'+stdout +'\n';
            response += 'stderr :'+stderr +'\n';
            console.log(`scp stdout: ${stdout}`);
            console.log(`scp stdout: ${stderr}`);
            me.executeSerialize(cmds, index+1, response, callback);
        });
    }
}

module.exports = { AtxUpdater };
