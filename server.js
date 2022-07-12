// Copyright (C) 2022  macarona salsa

// This file is part of wawa-news, a dynamic news website.
// License: GNU GPL version 2 only.


"use strict";

const { argv } = require("node:process");
const fsPromises = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const logger = require("./logger");

// constants
const WEBSITE_ROOT = path.join(__dirname, "website");

// options
const ARTICLE_ROOT = argv[4] ? argv[4] : "sample_articles";
const PORT = argv[3] ? argv[3] : 8080;


async function encode_articles() {
	/* build a JSON data representation of the articles in ARTICLE_ROOT */
	const jsonData = {};
	const rootDirPath = path.join(__dirname, ARTICLE_ROOT);

	// open rootDir as a directory stream
	let rootDir;
	try {
		rootDir = await fsPromises.opendir(ARTICLE_ROOT);
	} catch (err) {
		throw new Error(`Couldn't open articles directory: ${err}`);
	}

	// add each section directory under rootDir to the data object
	for await (const sectionDirent of rootDir) {
		const sectionName = sectionDirent.name;
		const sectionPath = path.join(rootDirPath, sectionName);

		// check if its actually a directory
		if (!sectionDirent.isDirectory()) {
			logger.log(`${sectionPath} is not a directory, moving to the next one`);
			continue;
		}

		// open sectionDir as a directory stream
		let sectionDir;
		try {
			sectionDir = await fsPromises.opendir(sectionPath);
		} catch (err) {
			logger.error(`Couldn't read section directory "${sectionDir}", moving to the next one`);
		}

		// add the section
		jsonData[sectionName] = [];

		// add each file name and file content under section entry to
		// the data object
		for await (const article_dirent of sectionDir) {
			const filename = article_dirent.name;
			const articlePath = path.join(sectionPath, filename);

			// check if its actually a file
			if (!article_dirent.isFile()) {
				logger.log(`${articlePath} is not a file, moving to the next one`);
				continue;
			}

			// article name is same as filename, minus file
			// extension if present 
			let articleName;
			{
				const matches = filename.match(/(.+)\.[^.]+$/i);
				if (matches !== null) {
					articleName = matches[1];
				} else {
					articleName = filename;
				}
			}
			
			// read file contents
			let articleContent;
			try {
				articleContent = await fsPromises.readFile(
					articlePath, "utf8"
				);
			} catch (err) {
				logger.error(`Couldn't read article file "${articlePath}", moving to the next one`);
				continue;
			}

			// add the article
			jsonData[sectionName].push(
				{ title: articleName, content: articleContent }
			);
		}
	}
	return JSON.stringify(jsonData);
}


const server = http.createServer(async (req, res) => {
	const { url, method } = req;
	logger.log(`recieved ${method} request to ${url}`);

	// only allow GET requests
	if (method !== "GET") {
		res.writeHead(405, { "Allow": "GET"});
		res.end();
		return;
	}

	// routing
	try {
		if (url === "/") {
			// respond with website html
			const indexContent = await fsPromises.readFile(
				path.join(WEBSITE_ROOT, "index.html"), "utf8"
			);
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(indexContent);
		} else if (url === "/articles") {
			// respond with articles as JSON
			const data = await encode_articles();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(data);
		} else {
			// respond with a file from WEBSITE_ROOT
			const filePath = path.join(WEBSITE_ROOT, url);

			// set correct content type
			const mimeTypes = {
				".html": "text/html",
				".css": "text/css",
				".js": "text/javascript",
				".svg": "image/svg+xml",
			};
			const extname = path.extname(filePath).toLowerCase();
			const fileType = mimeTypes[extname] || "application/octet-stream";
			
			const fileContent = await fsPromises.readFile(filePath, "utf8");
			res.writeHead(200, { "Content-Type": fileType });
			res.end(fileContent);
		}
	} catch (err) {
		if (err.code === "ENOENT") {
			res.writeHead(404);
			res.end(`Error ${err.code}: Can't find that`);
		} else {
			res.writeHead(500);
			res.end(`Error ${err.code}: tell your site admin that they did a horrible job`);
			logger.error(err);
		}
	}
});


server.listen(PORT, () => {
	logger.log(`listening on port ${PORT}`);
});

