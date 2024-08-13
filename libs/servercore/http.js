const http = require('https');
const httppost = require('http');
const fetch = require ('node-fetch');
//const {AbortSignal } = require ('node-fetch');
const URL = require('url');

class Http{	
	get(url){
		/*
		let  aoe = {				
			subscribe : (res_,err_=()=>{})=>{
				fetch(url, {
					method: 'GET',
					signal: AbortSignal.timeout(50000) ,
					headers: {'Content-Type': 'application/json'}
				}).then((response) => response.json())
				.then((json) => res_(json))
				.catch(error => {
					err_(error)
				})
		
			}
		}
		
		return aoe;*/
		
		let adr = url;
		let address = URL.parse(adr, true);
		var options = {
			host: address.hostname,
			port: address.port,
			path: address.path,
			timeout: 120000
			};
		let  aoe = {				
			subscribe : (res_,err_)=>{
				var req = http.get(options, function(res) {
					var bodyChunks = [];
					//var bodyChunks = '';
					res.on('data', function(chunk) {
						bodyChunks.push(chunk);
						//bodyChunks+=chunk;
					}).on('end', function() {
						var body = Buffer.concat(bodyChunks);
						console.log(JSON.parse(body));
						res_(JSON.parse(body));
						//console.log(body);
						//res_(body);
					})
				});
				
				req.on('error', function(e) {
					err_(e);
				});
                req.on('timeout', () => {
					err_("timeout");
                });
				
				req.shouldKeepAlive = false;
			}
		}
		return aoe;
	};
	post(url, data){
		var postData = JSON.stringify(data);
		
		let  aoe = {				
			subscribe : (res_,err_=()=>{})=>{
				fetch(url, {
					method: 'POST',
					body: postData,
					headers: {'Content-Type': 'application/json'}
				}).then((response) => response.json())
				.then((json) => res_(json))
				.catch(error => {
					err_(error)
				})
		
			}
		}
		
		return aoe;
	};
	put(url, data){		
		var postData = JSON.stringify(data);		
		let  aoe = {				
			subscribe : (res_,err_=()=>{})=>{
				fetch(url, {
					method: 'PUT',
					body: postData,
					headers: {'Content-Type': 'application/json'}
				}).then((response) => response.json())
				.then((json) => res_(json))
				.catch(error => {
					err_(error)
				})
		
			}
		}
		return aoe;
	};
}


//module.exports = { Http}  ;
//module.exports = { default:Http}  ;
module.exports = Http;
//export default Http;