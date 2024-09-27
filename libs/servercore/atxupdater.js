const express = require("express");
const { exec,spawn  } = require("child_process");
const cp = require("child_process");const { files } = require("jszip");
;
var toDateStr = function (str){
    return str.replaceAll(":","").replaceAll("-","");
};
class AtxUpdater {
    constructor() {
        this.router = express.Router();
    }

    init() {
        let servidor = this.router;
        servidor.get("/update", (req, res) => {
            console.log("update");
            exec("cd /home/tracking-capture; git fetch; git pull;", (err, stdout1, stderr) => {
                console.log("stdout:", stdout1);
                if (stdout1.includes("Updating")){
                    console.log("updated, and rebooting app");
                    res.end("updated, and rebooting app");
                    try{
                        //process.exit();
                        console.log("executing supervisord cmd");
                        exec("supervisord restart app",(err2,stdout2,stderr) => {
                            console.log("supervisord stdout:", stdout2);
                        });
                            
                    }catch(e){
                        console.log("try rebooing err:", e);    
                    }
                }
                console.log("err:", err);
                console.log("nothing to update");
                res.end("nothing to update");
            });
        });
        servidor.get("/backup_app", (req, res) => {
            
        });
        servidor.get("/backup", (req, res) => {
            //fs.copyFile( src, dest, mode, callback );
            console.log("route backup");            
            let cmd = "sshpass";        
            let scpData = {
                user:'root',
                pass:'Facil123',
                host:'172.20.50.59',
                base:'/mnt/disk1/desarrollo/backups',
                app:'tracking-capture'
             }
             let folderBackup = [
                 './tracks'
             ];
             let filesBackup = [];
             let folderApp = [
                 './public',
                 './tracks',
                 './libs'
            ];
             let filesApp = [
                 'Dockerfile',
                 'index.js',
                 'proxyserver.js',
                 'README.md',
                 '.gitignore',
                 '.gitmodules'
             ];
            var isodate = new Date().toISOString().replaceAll("-","").replaceAll(":","").replaceAll(".","").substr(0,15) ;
            
            let params = ['-p Facil123','scp','-r','./tracks',`${scpData.user}@${scpData.host}:${scpData.base}/${isodate}`];
            let cmds = [];
            cmds.push(`sshpass -p ${scpData.pass} ssh ${f} ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${scpData.app}_${isodate}_backup'`);
            cmds.push(`sshpass -p ${scpData.pass} ssh ${f} ${scpData.user}@${scpData.host} ' mkdir ${scpData.base}/${scpData.app}_${isodate}_app'`);
            folderBackup.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_backup/${f.replaceAll("./","")}`));
            filesBackup.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_backup`));
            folderApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp -r ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_app/${f.replaceAll("./","")}`));
            filesApp.forEach(f=>cmds.push(`sshpass -p ${scpData.pass} scp ${f} ${scpData.user}@${scpData.host}:${scpData.base}/${scpData.app}_${isodate}_app`));
            this.executeSerialize(cmds,0,'',(response)=>{
                res.end("backup: " + response);
            });
        });
        servidor.get("/restore", (req, res) => {
            process.exit();
        });
        return servidor;
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
