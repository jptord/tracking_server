var http = require('http');
var httpProxy = require('http-proxy');
var proxyhttp = httpProxy.createProxyServer({target:'http://localhost:7777'}).listen(5555); // See (†)

var proxy = new httpProxy.createProxyServer({
	target: {
	  host: 'localhost',
	  port: 8989
	}
  });
  var proxyServer = http.createServer(function (req, res) {
	proxy.web(req, res);
  });
   
  proxyServer.on('upgrade', function (req, socket, head) {
	proxy.ws(req, socket, head);
  });
  
  proxyServer.listen(80);	
  /*
http.createServer(function(req, res) {
    //console.log("received");
    //proxy.web(req, res, { target: 'http://www.google.com' });
		
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
	res.end();
}).listen(6666);*/