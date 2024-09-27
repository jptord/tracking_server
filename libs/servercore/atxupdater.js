const express = require("express");
const { exec,spawn  } = require("child_process");
const cp = require("child_process");;

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
        servidor.get("/backup", (req, res) => {
            //fs.copyFile( src, dest, mode, callback );
            console.log("route backup");            
            let cmd = "sshpass";        
            let params = ['-p Facil123','scp','-r','./tracks','root@172.20.50.59:/mnt/disk1/desarrollo/backups'];
            exec(cmd+" "+params.join(" "), (err, stdout1, stderr) => {
                console.log(`scp stdout: ${stdout1}`);
                res.end("backup ended");
            });
            /*const sp =  cp.spawn(cmd, ['-p Facil123','scp','-r','./tracks','root@172.20.50.59:/mnt/disk1/desarrollo/backups'],{shell: true
            });
            sp.stdout.on('data', (data) => {
                console.log(`scp stdout: ${data}`);
            });
            sp.stderr.on('data', (data) => {
                console.error(`scp stderr: ${data}`);
            });*/
              

            /*exec("scp -r /home/tracking-capture/tracks root@172.20.50.59:/mnt/disk1/desarrollo/backups", (err, stdout, stderr) => {                
                console.log("scp stderr:", stderr);
                console.log("scp stdout:", stdout);
                res.end("backup");
            });*/
        });
        servidor.get("/restore", (req, res) => {
            process.exit();
        });
        return servidor;
    }
}

module.exports = { AtxUpdater };
