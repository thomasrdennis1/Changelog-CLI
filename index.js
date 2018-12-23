#!/usr/bin/env node

const parseGitLog = require('parse-git-log');
const chalk = require('chalk');
const spawn = require('cross-spawn');
const path = require('path');
const gitlog = require('gitlog');
const args = require('args');
var xl = require('excel4node');

//Construct file path to the repository it is ran in
cwd = typeof cwd === 'string' ? cwd : process.cwd()
const gitDir = path.resolve(cwd, '.git');

//TODO: Get current machine user from git repo
//TODO: Write command to write to Excel
//TODO: Log Size params
//TODO: Typeof checks on flags?

//define defaults
var user = "Tom Dennis";
var logSize = '10';

//Parse arguements
args
	.option('write', 'Write output to a CSV file, specify path or default to parent directory')
	.option('user', 'specified user, defaults to logged in user')
	.option('logSize', 'The amount of entries in the log, default is 10')

const flags = args.parse(process.argv)

//Logic for Args
if (flags.logSize !== null && typeof flags.logSize === "number") {
	logSize = flags.logSize;
}

if (flags.user !== null && typeof flags.user === "string") {
	// console.log("USER " + flags.user)
	user = flags.user;
}

//Parsing options for the git log
const options = {
	repo: gitDir,
	number: logSize,
	author: user,
	fields: ['subject', 'authorName', 'authorDateRel'],
	execOptions: {
		after: new Date() - 1
	}
};

//Print and process the returned git log
// Asynchronous (with Callback)
//to return synchronous:
gitlog(options, function(error, commits) {

	// Commits is an array of commits in the repo
	for (let i = 0; i < commits.length; i++) {
		console.log("\n");
		console.log(chalk.yellow(JSON.stringify(commits[i].subject)));
		console.log(chalk.red(JSON.stringify(commits[i].authorName + "  |  " + commits[i].authorDateRel)));

		if (commits[i].files) {
			// console.log(chalk.green(commits[i].files))
			var fileName = processFiles(commits[i].files);
		}
	}

	if (flags.write !== null) {
		changelogWrite(commits);
	}

});

function processFiles(fileArray) {
	for (let i = 0; i < fileArray.length; i++) {
		let fileName = fileArray[i].split("/").pop();
		console.log(fileName);
	}
}

function processFilesToWrite(fileArray) {
	for (let i = 0; i < fileArray.length; i++) {
		let fileName = fileArray[i].split("/").pop();
		return fileName;
	}
}

function changelogWrite(commits){
	// Create a new instance of a Workbook class
	var wb = new xl.Workbook();

	// Add Worksheets to the workbook
	var ws = wb.addWorksheet('Metadata');

	for (let i = 0; i < commits.length; i += 1) {
	
		let data = objectParse(commits);

		//trim file names
		let fileName = processFilesToWrite(data[i].fileName);

		ws.cell(i + 2, 1).string(fileName);
		ws.cell(i + 2, 2).string(data[i].userName);
		ws.cell(i + 2, 3).string(data[i].dateRel);
	}

	wb.write('changelog.xlsx');
}

function objectParse(commits){
	var commitObj = [];

	for (var i = 0; i < commits.length; i++) {
		commitObj.push({
			'fileName': commits[i].files,
			'userName': commits[i].authorName,
			'dateRel': commits[i].authorDateRel,
		});
	}

	return commitObj;
}













