// Copyright (C) 2022  macarona salsa

// This file is part of wawa-news, a dynamic news website.
// License: GNU GPL version 2 only.


"use strict";

/* helper functions */

function hexToRGB(hex) {
	/* convert hex triplet string to RGB array*/
	if ( typeof hex !== "string" || !hex.startsWith("#") ) {
		throw new Error(`hex triplet must be a string starting with #, got ${hex}`);
	}
	if ( !/^#([a-z0-9])+$/i.test(hex) ) {
		throw new Error(`Hex triplet must contain only alphnumericals and #, got ${hex}`);
	}
	if (hex.length !== 4 && hex.length !== 7) {
		throw new Error(`hex triplet must be in form: #XXX or #XXXXXX, got ${hex}`);
	}

	hex = hex.slice(1); // get rid of the # sign
	// convert shorthand form to RGB array
	if (hex.length === 3) {
		const hexRGBArray = hex.split("");
		return hexRGBArray.map( (s) => Number(`0x${s.repeat(2)}`) );
	// convert full form to RGB array
	} else if (hex.length === 6) {
		const hexRGBArray = hex.match(/.{2}/g);
		return hexRGBArray.map( (s) => Number(`0x${s}`) );
	}
}

function createSGR(fgHex = "", bgHex = "", bold = true) {
	const parameters = [];
	// bold parameter
	const boldParam = bold ? "1": "";
	parameters.push(boldParam);
	
	// foreground color parameter
	if (fgHex !== "") {
		// convert hex to "R;G;B" form
		const fgArgs = hexToRGB(fgHex).join(";");
		// build SGR parameter and add to parameter list
		const fgParam = "38"    // colorize foreground
			+";2;"              // using 24-bit color 
			+ fgArgs;           // specify foreground RGB color components
		parameters.push(fgParam);
	}

	// background color parameter
	if (bgHex !== "") {
		// convert hex to "R;G;B" form
		const bgArgs = hexToRGB(bgHex).join(";");
		// build SGR parameter and add to parameter list
		const bgParam = "48"    // colorize foreground
			+";2;"              // using 24-bit color 
			+ bgArgs;           // specify background RGB color components
		parameters.push(bgParam);
	}

	// build final SGR color sequence
	const color = "\x1B["         // start SGR sequence
		+ parameters.join(";")    // insert SGR parameters (";" -> parameter seperator)
		+ "m";                    // end SGR sequence
	
	return color;
}

/* logger definition */

const logger = {};

// define logLevels here
const logLevels = [
	{
		name: "debug",
		bgColor: "#431f66",
		head: "DEBUG",
	},
	{
		name: "info",
		bgColor: "#1f4366",
		head: "INFO",
	},
	{
		name: "log",
		bgColor: "#595959",
		head: "LOG",
	},
	{
		name: "warning",
		bgColor: "#66431f",
		head: "WARNING",
	},
	{
		name: "error",
		bgColor: "#661f1f",
		head: "ERROR",
	},
];


// dynamically add logging methods to logger from the logLevels array
for (const logLevel of logLevels) {
	logger[logLevel.name] = (body) => {
		const time = `[${new Date().toLocaleString()}]`;
		const head = ` ${logLevel.head}: `;
		const color = createSGR("#ffffff", logLevel.bgColor);
		const reset = "\x1B[0m";
		console.log(`%s ${color}%s${reset} %s`, time, head, body);
	};
}

logger.customLog = function (
	body,
	head = " LOG: ",
	logTime = true,
	fgHex = "",
	bgHex = "",
	bold = true,
	colorSpan = "head")
{
	const time = logTime ? `[${new Date().toLocaleString()}]` : "";

	// build color escape sequences
	let color = "", reset = "";
	if (fgHex !== ""  || bgHex !== "") {
		color = createSGR(fgHex, bgHex, bold);
		reset = "\x1B[0m"; // make a SGR reset sequence
	}

	// assemble final message according to sgrSpan
	if (colorSpan === "head") {	
		// colorize only message head
		console.log(`%s ${color}%s${reset} %s`, time, head, body);
	} else if (colorSpan === "message") {
		// colorize message without time
		console.log(`%s ${color}%s %s${reset}`, time, head, body);
	} else if (colorSpan === "all") {
		// colorize entire message
		console.log(`${color}%s %s %s${reset}`, time, head, body);
	} else {
		// dont colorize message
		console.log(`%s %s %s`, time, head, body);
	}
};

// testing exports
//module.exports = {
//	hexToRGB,
//	createSGR,
//	logger,
//}

// exports
module.exports = logger;
