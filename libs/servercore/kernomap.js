const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

var corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
class KernoMap{
	constructor(){
		this.router = express.Router();
    }
	publicar(){
        const router = this.router;
        router.get('/:id',cors(corsOptions),async function (req, res){
			console.log('KernoMap.publicar.router.get ', "descargando");
            try {
				const id = req.params.id;
				const filepath = path.join(__dirname, '../../maps', id);
				if (!fs.existsSync(filepath)) {
					res.status(404).send('File not found ' + filepath);
					return;
				}
				const fileSize = fs.statSync(filepath).size;
				const range = req.headers.range;
				res.set({
					'Content-Type': 'application/octet-stream',
					'Content-Length': fileSize,
					'Content-Disposition': `attachment; id="${id}"`,
					'Cache-Control': 'public, max-age=31536000'
				});
				if (range) {
					const parts = range.replace(/bytes=/, '').split('-');
					const start = parseInt(parts[0], 10);
					console.log('start: ', start);
					const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
					console.log('end: ', end);
					const chunksize = (end - start) + 1;
					res.writeHead(206, {
						'Content-Type': 'application/octet-stream',
						'Content-Range': `bytes ${start}-${end}/${fileSize}`,
						'Content-Length': chunksize,
					});
					const file = fs.createReadStream(filepath, { start, end });
					let downloadedBytes = 0;
					file.on('data', function (chunk) {
						downloadedBytes += chunk.length;
						res.write(chunk);
					});
					file.on('end', function () {
						console.log('Download completed');
						res.end();
					});
					file.on('error', function (err) {
						console.log('Error while downloading file:', err);
						res.status(500).send('Error while downloading file');
					});
				} else {
					const file = fs.createReadStream(filepath);
					file.pipe(res);
					console.log('Download completed');
				}
			} catch (error) {
				console.log('error: ', error);
				res.send(500)
			}
        })
        return this.router;
	}
	
}

module.exports = { KernoMap } ;