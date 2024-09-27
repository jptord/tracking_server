const express = require("express");
const { exec } = require("child_process");
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
                        exec("supervisord stop restart",(err2,stdout2,stderr) => {
                            console.log("supervisord stdout: ", stdout2);
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
        servidor.get("/restart", (req, res) => {
            process.exit();
        });
        return servidor;
    }
}

module.exports = { AtxUpdater };
