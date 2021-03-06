const axios = require('axios');
const config = require('./Config.js');
const normalize = require('./Normalize.js');
const fs = require('fs');
const path = require('path');

module.exports = { 
	
	get: function(options){
		let optionsFinal = config.optionsFinalize("get",options);
		if(options.url.indexOf("?download") > -1){
			return _downloadCheck(optionsFinal,options);
		}
		return _makeRequest(optionsFinal,options);
	},

	post: function(options){
		let optionsFinal = config.optionsFinalize("post",options);
		if(options.files != undefined){
			return _uploadCheck(optionsFinal,options);
		}
		return _makeRequest(optionsFinal,options);
	},

	patch: function(options){
		let optionsFinal = config.optionsFinalize("post",options, true);
		if(options.files != undefined){
			return _uploadCheck(optionsFinal,options);
		}
		return _makeRequest(optionsFinal,options);
	},

	delete: function(options){
		let optionsFinal = config.optionsFinalize("delete",options);
		return _makeRequest(optionsFinal,options);
	},

	options: function(options){
		let optionsFinal = config.optionsFinalize("options",options);
		return _makeRequest(optionsFinal,options);
	},

}

const _makeRequest = async function(optionsFinal, printingOptions){
	let response = await axios(optionsFinal);
	return normalize._printCorrectly(printingOptions, response);
}

const _oneOrMoreFiles = fileResults =>{
	let fileInfo = {};
	if(fileResults.fileName != undefined){
		fileInfo.file = fs.createWriteStream(fileResults.fileName);
		fileInfo.finalFileName = fileResults.fileName;
	}else{
		fileInfo.file = fs.createWriteStream("downloadedAttachment.tgz");
		fileInfo.finalFileName = "downloadedAttachment.tgz";
	}
	return fileInfo;
}

const _setDownloadInfo = optionsCopy => {
	let downloadfileObj =  JSON.parse(JSON.stringify(optionsCopy));
	downloadfileObj.url += "?download";
	downloadfileObj.responseType = 'stream';
	return downloadfileObj;
}

const _downloadCheck = async function(optionsFinal,printingOptions){
	return new Promise(async (resolve,reject)=>{
		try{

			let optionsCopy = JSON.parse(JSON.stringify(optionsFinal));
			optionsCopy.url = optionsFinal.url.replace("?download","")
			let fileResults = await _makeRequest(optionsCopy,printingOptions);
			
			let {file, finalFileName} = _oneOrMoreFiles(fileResults);
			let downloadfileObj = _setDownloadInfo(optionsCopy);
			
			let fileResponse = await _makeRequest(downloadfileObj,printingOptions);
			fileResponse.pipe(file);

			if(optionsFinal.debug == true){
				return resolve(fileResponse);
			}else{
				return resolve("Downloaded " + finalFileName);
			}

		}catch(error){

			return reject(error);

		}

	})
	
}

const _fileCheckAndConvert = async function(filePath){
	return new Promise((resolve,reject)=>{
		try {
			fs.readFile(filePath,(err,data) => {
				if(err){ 
					reject("There was an error with the file specified at " + filePath);
				}else{
					return resolve(data);
				}
			});
		}catch(err){
			return reject("There was an error with the file specified at " + filePath);
		}
	})
}

const _uploadCheck = async function(optionsFinal,printingOptions){
	return new Promise(async (resolve,reject)=>{
		try{
			let optionsCopy = JSON.parse(JSON.stringify(optionsFinal));
			optionsCopy.data['fileAttachments'] = [];

			printingOptions.files.map(async file =>{
				_fileCheckAndConvert(file).then(fileData =>{
					let finalFileData = new Buffer(fileData).toString('base64');

					let cleanFileName = path.basename(file);
					
					optionsCopy.data['fileAttachments'].push({
						fileName: cleanFileName,
						data: finalFileData
					});				
					
				}).catch(err=>{
					reject(err);			
				})
			});

			let fileResponse = await _makeRequest(optionsCopy,printingOptions);
			
			return resolve(fileResponse);

		}catch(error){

			return reject(error);

		}

	})
	
}