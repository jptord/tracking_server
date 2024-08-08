var http = require('http');
var httpProxy = require('http-proxy');
//var proxyhttp = httpProxy.createProxyServer({target:'http://localhost:7777'}).listen(5555); // See (†)

var proxy = new httpProxy.createProxyServer({
	target: {
	  host: 'localhost',
	  port: 7777
	}
  });
  proxy.on('error', function(err, req, res) {
    console.log("proxy.error:", err);
    if (err.errno == -4077) return;    
      res.writeHead(500, {
          'Content-Type': 'text/plain'
      });

      res.end('proxy Connection refused');
  });
  var proxyApiMaster = new httpProxy.createProxyServer({
	target: {
	  host: 'localhost',
	  port: 9988
	}
  });
  var proxyApiMaster2 = new httpProxy.createProxyServer({
	target: {
	  host: 'localhost',
	  port: 9989
	}
  });
  var proxyApiMaster3 = new httpProxy.createProxyServer({
	target: {
	  host: 'localhost',
	  port: 7575
	}
  });
  
  proxyApiMaster.on('error', function(err, req, res) {
    console.log("proxyApiMaster.error:", err);
    console.log("req:", req);
    
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });

    res.end('proxyApiMaster Connection refused');
  });
  
  proxyApiMaster2.on('error', function(err, req, res) {
    console.log("proxyApiMaster.error:", err);
    console.log("req:", req);
    
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });

    res.end('proxyApiMaster Connection refused');
  });
  var proxyServer = http.createServer(function (req, res) {
    //console.log("proxyServer.req",req);
    console.log("proxy access",req.url);
               
    if (req.url.includes("/excel")){
            proxyApiMaster3.web(req, res);

            return;
    }       
    if (req.url.includes("/trackingdbtest")){
            proxyApiMaster2.web(req, res);

            return;
    }
    if (req.url.includes("/trackingdb")){
            proxyApiMaster.web(req, res);
            return;
    }

    proxy.web(req, res);
    //console.log("proxyServer.req.url",req.url);
	///proxy.web(req, res);
    
  });
   
  proxyServer.on('upgrade', function (req, socket, head) {
	proxy.ws(req, socket, head);
  });
  console.log("proxy started");
  proxyServer.listen(80);	
  /*
http.createServer(function(req, res) {
    //console.log("received");
    //proxy.web(req, res, { target: 'http://www.google.com' });
		
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
	res.end();
}).listen(6666);*/
