const udp = require('dgram');
const { forEach } = require('jszip');

class UdpServer{
    className = 'UdpServer';
    constructor(port = 9944){
        this.port 		= port ;
        this.address 	= "" ;
        this.family 	= "" ;
        this.ipaddr 	= "" ;
		this.server 	= null;
		this.events 	= [] ;
        this.createServer()
    }   
	addReceiveEvent(event){
		this.events.push(event);

	}
	createServer(){				
		var me = this;
		var server = udp.createSocket('udp4');

		server.on('error',function(error){
			console.log('Error: ' + error);
			server.close();
			});

		server.on('listening',function(){
			var address 	= server.address();
			var port 		= address.port;
			var family 		= address.family;
			var ipaddr 		= address.address;
			me.server		= server;
			me.address		= address;
			me.family		= family;
			me.ipaddr		= ipaddr;
			console.log(`UdpServer.createServer.port : ${port}`);
			console.log(`UdpServer.createServer.port.ip : ${ipaddr}`);
			console.log(`UdpServer.createServer.IP4/IP6 : ${family}` );
			});		
			
		server.on('message', (msg, rinfo) => {
			console.log(`UdpServer.createServer.message : ${msg} from ${rinfo.address}:${rinfo.port}`);
			this.events.forEach( e => {
				e(`${msg}`);
			});
		});

		server.bind(this.port);
	}
	getInfo(){
		return {
			port: 		this.port,
			address: 	this.address,
			ipaddr: 	this.ipaddr
		};
	}
   
}


module.exports = { UdpServer } ;