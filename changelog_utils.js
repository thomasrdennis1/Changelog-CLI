/* ----- Utils ----- */

const utils = {
	determineUser: function(flags, baseGitConfig){
		if(flags.user) {
			this.user = flags.user;
		} else if(baseGitConfig){
			return baseGitConfig.user.name;
		} else{
			return "";
		}
	}
};

module.exports = utils;

/* ----- /Utils ----- */
