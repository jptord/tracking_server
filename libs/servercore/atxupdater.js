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
      exec("cd /home/tracking-capture", (err, stdout1, stderr) => {
        console.log("stdout1:", stdout1);
        exec("git fetch", (err, stdout2, stderr) => {
            console.log("stdout2:", stdout2);
            exec("git fetch", (err, stdout3, stderr) => {
                console.log("stdout3:", stdout3);
                console.log("err:", err);
                req.end("updated");
            });            
        });
      });
    });
    return servidor;
  }
}

module.exports = { AtxUpdater };
