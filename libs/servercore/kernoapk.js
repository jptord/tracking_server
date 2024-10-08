const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const cors = require("cors");

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const CHUNKS_DIR = "./public";
async function assembleChunks(filename, totalChunks) {
  const writer = fs.createWriteStream(`./uploads/${filename}`);
  for (let i = 1; i <= totalChunks; i++) {
    const chunkPath = `${CHUNKS_DIR}/${filename}.${i}`;
    await pipeline(pump(fs.createReadStream(chunkPath)), pump(writer));
    fs.unlink(chunkPath, (err) => {
      if (err) {
        console.error("Error deleting chunk file:", err);
      }
    });
  }
}
class KernoApk {
  constructor() {
    this.router = express.Router();
  }
  publicar() {
    return this.router;
  }
}

module.exports = { KernoApk };
