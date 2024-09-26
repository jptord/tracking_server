const express = require("express");
const { exec } = require("child_process");
class AtxUpdater {
  constructor() {
    this.router = express.Router();
  }

  init() {
    let servidor = this.router;

    servidor.get("/update", (req, res) => {
      console.log("sc1");
      exec("cd /home/tracking-capture", (err, stdout, stderr) => {
        exec("git fetch; git pull;", (err, stdout, stderr) => {
          console.log("stdout:", stdout);
        });
      });
    });
    return servidor;
  }
}

module.exports = { AtxUpdater };
