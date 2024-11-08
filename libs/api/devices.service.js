


class DevicesService {
	apiUrl = "https://trackingserver.kernotec.com/trackingdb/";
	apiName = 'devices';
	prefix = '';
	http = null;
	
	constructor(http) {
		this.http = http;
	}
	setPrefix(prefix) {
		this.prefix = prefix;
	}

	register(datos) {
		return this.http.post(
			this.apiUrl + this.prefix + `/${this.apiName}/sync`,
			datos
		);
	}

	update(datos, id) {
		return this.http.put(
			this.apiUrl + this.prefix + `/${this.apiName}/${id}`,
			datos
		);
	}

	find(id = '') {
		return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}/${id}`);
	}

	getAll(
	) {
		return this.http.get(
			this.apiUrl +
			this.prefix +
			`/${this.apiName}`
		);
	}

	delete(id){
		return this.http.delete(
			this.apiUrl + this.prefix + `/${this.apiName}/${id}`
		);
	}
  }
  

//module.exports = { RoutesService } ;
export default DevicesService;