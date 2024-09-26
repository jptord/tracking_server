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
        console.log("stdout1:", stdout1);
        
        console.log("err:", err);
        res.end("updated");
      });
    });
    return servidor;
  }
}

module.exports = { AtxUpdater };
