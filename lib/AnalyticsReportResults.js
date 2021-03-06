const Connect = require('./Connect.js');
const Normalize = require('./Normalize.js');

module.exports = {

	run:(options) => {
		options.url = 'analyticsReportResults';
		return new Promise(async (resolve,reject)=>{
			try{
				_validateReportAttributes(options);
				var response = await Connect.post(options);

				if(options.debug == true){
					return resolve(response);
				}
				
				let finalResponse = Normalize._printMetaCorrectly(options,response);

				return resolve(finalResponse);

			}catch(error){

				if(options.debug == true || error.response === undefined){
					return reject(error);
				}

				let finalError = Normalize._printMetaCorrectly(options,error.response.data);

				return reject(finalError);

			}
		
		})
	
	},

}

const _validateReportAttributes = options => {
	if(options.json == undefined || (options.json.id == undefined && options.json.lookupName)){
		let example = "\n\nconst OSvCNode = require('osvc_node');\nconst env = process.env;\n\nconst rn_client = OSvCNode.Client({\n\tusername: env['OSC_ADMIN'],\n\tpassword: env['OSC_PASSWORD'],\n\tinterface: env['OSC_SITE'],\n});\n\nvar options = {\n\tclient: rn_client,\n\t\033[32mjson: {id: 176}\033[0m,\n}\n\nOSvCNode.AnalyticsReportResults.run(options).then((results) => {\n\tresults.map((result)=>{\n\t\tconsole.log(`Columns: ${Object.keys(result).join(\", \")}`);\n\t\tconsole.log(`Values: ${Object.values(result).join(\", \")}`);\n\t})\n}).catch((error)=>{\n\tconsole.log(error);\n})";
		return Validations.customError("AnalyticsReportResults must have an 'id' or 'lookupName' set within the json data object.",example); 
	}
}