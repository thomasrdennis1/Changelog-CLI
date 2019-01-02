#!/usr/bin/env node

const parseGitLog = require('parse-git-log');
const chalk = require('chalk');
const spawn = require('cross-spawn');
const path = require('path');
const fs = require('fs');
const gitlog = require('gitlog');
const gitconfig = require('gitconfig');
const args = require('args');
const xlsx = require('xlsx');
var xl = require('excel4node');

//Supporting Changelog files
const utils = require('./changelog_utils.js');
const validations = require('./changelog_validations.js');

//Construct file path to the repository changelog is ran in
cwd = typeof cwd === 'string' ? cwd : process.cwd();
const gitDir = path.resolve(cwd, '.git');

/* ----- Handle Arguments and Help File ----- */
/* Section handles parsing of options to be executed in our application */

//Preliminary parsing of args to be passed to Opt constructor for determining app processes
args
	.option('user', 'Specified user, defaults to logged in user')
	.option('timeSpan', 'Range of time for the git logs, accepts dates or TODAY, LAST WEEK and other git log params')
	.option('logSize', 'The max amount of entries in the log, default is 10')
	.option('write', 'Write output to a CSV file, specify path or default to parent directory');

//Opt constructor takes in command line args and git config for defaults when no args provided
function Opts(flags, baseGitConfig) {
	this.gitDefaults = baseGitConfig;
	this.user = utils.determineUser(flags, baseGitConfig);
	this.timeSpan = (flags.timeSpan) ? (flags.timeSpan) : ("TODAY");
	this.logSize =(flags.logSize) ? (flags.logSize) : (10);
	this.write = (flags.write) ? (flags.write) : (false);
}

if(gitDir){
	gitconfig.get({location: 'global'}).then((baseGitConfig) => {
		//Send to options model to be handled throughout application
		opt = new Opts(args.parse(process.argv), baseGitConfig);
		//Execute validations on input and check if execution context is git repo
		let isValid = validations.init(opt);
		if(isValid){ changelogApp.init(opt); }
	});
} else {
	return console.log("Error: not a valid git repository");
}

/* ----- /Handle Arguments and Help File ----- */

/* ----- Main Application ----- */
/* Execute core processes for outputting log into excel file and logging to terminal */

const changelogApp = {
	config: "",
	commits: "",
	init: function(config){
		this.config = config;
		this.setOptions(config);
		this.fetchLogs();
	},
	options: {
		//Git log fields
		repo: gitDir,
		fields: ['subject', 'authorName', 'authorDateRel'],
	},
	setOptions: function(config){
		//set the dynamic options
		this.options.number = config.logSize,
		this.options.author = config.user,
		this.options.execOptions = {
			after: new Date() - 1
		}
	},
	fetchLogs: function() {
		//Async call to get the log information
		const self = this;
		gitlog(this.options, function(error, commits) {
			self.commits = commits;
			self.parseMethods();
		});
	},
	parseMethods: function(){

		//Determines actions aside from log to console
		writeLogToConsole.execute(this.commits);

		if(this.config.write){
			writeToExcel.init(this.commits);
		}
	}
};

/* ----- /Main Application ----- */

/* ----- Logging Methods ----- */
/* Console logs the output by default */

const writeLogToConsole = {
	execute: function(commits){
		for (let i = 0; i < commits.length; i++) {
			console.log("\n");
			console.log(chalk.green(commits[i].subject));
			console.log(chalk.blue(commits[i].authorName + "  |  " + commits[i].authorDateRel));
			if (commits[i].files) {
				this.processFiles(commits[i].files);
			}
		}
	},
	processFiles: function(fileArray){
		for (let i = 0; i < fileArray.length; i++) {
			let fileName = fileArray[i].split("/").pop();
			console.log(fileName);
		}
		console.log('\n')
	}
};

/* ----- /Logging Methods ----- */

/* ----- Excel Methods ----- */
/* Writes to excel workbook when write flag (-w) is set to true */

const excelFileReader = {
	readCurrentFile: function(){

		let files = fs.readdirSync(__dirname);
		for (let i in files) {
			if (files[i] === 'changelog.xlsx'){
				const file = xlsx.readFile('changelog.xlsx');
				const worksheet = file.SheetNames;
				return xlsx.utils.sheet_to_json(file.Sheets[worksheet[0]]);
			}
		}

		return false;
	}
};

const writeToExcel = {
	// Create a new instance of a Workbook
	wb: "", ws: "",
	incrementCurrentRow: function(){ this.currentRow++ },
	currentRow: 2, //current row maintained throughout write function, skips first row for header
	init: function(commits){
		this.wb = new xl.Workbook();
		this.ws = this.wb.addWorksheet('Metadata');
		this.writeHeaders();
		this.reWriteExistingData();
		this.execute(commits);
	},
	writeHeaders: function(){
		this.ws.cell(1, 1).string("File Name");
	},
	reWriteExistingData: function(){
		const self = this;
		let existingData = excelFileReader.readCurrentFile();
		if(existingData) {
			existingData.forEach(function (data, i) {
				for(prop in data){
					self.ws.cell(self.currentRow, 1).string(data[prop]);
					self.incrementCurrentRow();
				}
			});
		}
	},
	execute: function(commits){
		const self = this;
		//Prints file names from each commit
		commits.forEach(function (commit, i) {
			commit.files.forEach(function (file, x) {
				let currentProcessedFile = file.split("/").pop();
				self.ws.cell(self.currentRow, 1).string(currentProcessedFile);
				self.incrementCurrentRow();
			});
		});

		this.writeToWorkbook();
	},
	writeToWorkbook: function(){
		this.wb.write('changelog.xlsx');
	}
};

/* ----- /Excel Methods ----- */