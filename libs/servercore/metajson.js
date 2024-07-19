var fs = require('fs');
class Metajson{
    
    constructor(fileName = 'meta.json'){
        this.data_json = null ;
        this.fileName = fileName;
        this.cargar();
    }
   
    get(){
        return this.data_json;
    }
    set(json){
        console.log("set json",json);
        this.data_json = json;
    }
    guardar(){
        let fileName = this.fileName;
        if (this.data_json == null)
            this.data_json = {};

        fs.writeFileSync(
            fileName,
            JSON.stringify(this.data_json, null, 4),
            function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log("JSON saved to " + `${fileName}`);
              }
            }
          );
    }
    cargar(){
        let fileName = this.fileName
        if (!fs.existsSync(fileName)) {
            if (this.data_json == null)
                this.data_json = {        
                };
            this.guardar(fileName, this.data_json);
        }
        const content = fs.readFileSync(`${fileName}`, "utf8");
        
        this.data_json = JSON.parse(content);        
        console.log("Metajson > data_json:",this.data_json);
    }
}


module.exports = { Metajson } ;