const validations = {
	config: "",
	errorList: [],
	init: function(config){
		this.config = config;

		//Chain validation methods here
		this.validateTypes();

		//Write validations to the console
		this.writeValidations();

		//If errors are present determine validation
		(this.errorList.length > 0) ? (isValid = false) : ( isValid = true);
		return isValid;
	},
	validateTypes: function(){
		if(typeof this.config.logSize !== "number"){
			this.errorList.push("Error: Git log size must be a number.");
		}
	},
	writeValidations: function(){
		if(this.errorList.length > 0) {
			let errorString = "ERROR:";
			this.errorList.forEach(function (errorList) {
				errorString += ` ${errorList} `;
			});
			console.log(errorString);
		}
	}
};

module.exports = validations;