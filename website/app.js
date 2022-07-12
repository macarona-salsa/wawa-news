// Copyright (C) 2022  macarona salsa

// This file is part of wawa-news, a dynamic news website.
// License: GNU GPL version 2 only.


"use strict";

const searchField = document.querySelector("#search-field");
const searchButton = document.querySelector("#search-button");
const navigationList = document.querySelector("#navigation-list");
const contentArea = document.querySelector("#content");

/* helpers */

function setAttributes(elem, attrs) {
	/* set array of css attributes to an element */
	for (let key in attrs) {
		elem.setAttribute(key, attrs[key]);
	}
}

function matchesAny(elem, selectors) {
	/* check if element matches any of a group of css selectors */
	return selectors.some(selector => elem.matches(selector));
}


/* handlers */

function handleSearchButton() {
	let searched = false;
	return function() {
		if (searched) {
			unHighlightMatches();
			searchButton.textContent = String.fromCodePoint("0x1f50D");
			searched = false;
		} else {
			const searchQuery = searchField.value;
			if (searchQuery === "") {
				return;
			}
			if (highlightMatches(searchQuery)) {
				searchButton.textContent = String.fromCodePoint("0x274c");
				searched = true;
			}
		}
	};
}

function handleClickNavigation(e) {
	/* mark clicked link and scroll into the target section in content area */
	const target = e.target;
	if (target.className !== "navigation-link") {
		return false;
	}

	// indicate click on current link 
	resetLinks();
	target.classList.add("active-link");

	// scroll to the appropriate section in the content area
	const sectionHeader = document.querySelector(
		`#${target.dataset.type}-section`);
	setTimeout(() => {
		sectionHeader.scrollIntoView({ behavior: "smooth" });
	});
}

function handleScroll() {
	/*
	 * highlight viewed section every 100ms, and clear link indicator after
	 * 200ms of non-scrolling
	 */
	let activationSelector = null;
	let throttleTimeoutID = null;
	let endTimeoutID = null;
	return function() {
		/*
		 * set active class for link corresponding to current active section
		 * at least 200ms after scrolling is done
		 */
		clearTimeout(endTimeoutID);
		endTimeoutID = setTimeout(() => {
			resetLinks();
			const link = document.querySelector(`#${activationSelector}-link`);
			if (link) {
				link.classList.add("active-link");
			}
		}, 200);
		// return if timeout id is defined (timeout is running)
		if (throttleTimeoutID) {
			return;
		}
		// check for and highlight viewed section at most one time per 100ms
		throttleTimeoutID = setTimeout(() => {
			activationSelector = highlightSection(activationSelector);
			throttleTimeoutID = null;
		}, 100);
	};
}


/* main */

function populate(json) {
	/* load data from json into the navigation and content areas */
	for (let newsSection in json) {
		const sectionTitle = document.createTextNode(newsSection);
		const sectionID = newsSection.toLowerCase();

		// navigation area population

		// add a navigation item to navigation list
		const navigationItem = document.createElement("li");
		navigationItem.classList.add("navigation-item");
		navigationList.append(navigationItem);

		// add a link to navigation item as a section indicator
		const navigationLink = document.createElement("a");
		navigationLink.classList.add("navigation-link");
		setAttributes(navigationLink, {
			"id": `${sectionID}-link`,
			"href": "#",
			"data-type": sectionID,
		});
		navigationLink.append(sectionTitle.cloneNode());
		navigationItem.append(navigationLink);


		// content area population

		// add a section element to the content area
		const sectionElement = document.createElement("section");
		setAttributes(sectionElement, {
			"id": `${sectionID}-section`,
			"data-type": sectionID,
		});
		contentArea.append(sectionElement);

		// create a news section header and add it to section element
		const sectionHeader = document.createElement("h2");
		sectionHeader.classList.add("section-header");
		sectionHeader.append(sectionTitle.cloneNode());
		sectionElement.append(sectionHeader);

		// insert relavent article elements to section element
		for (let article of json[newsSection]) {
			// article title
			const titleText = document.createTextNode(article.title);
			const articleTitle = document.createElement("h3");
			articleTitle.classList.add("article-title");
			articleTitle.append(titleText);

			// article content
			const contentText = document.createTextNode(article.content);
			const articleContent = document.createElement("p");
			articleContent.classList.add("article-content");
			articleContent.append(contentText);

			// add title and content to article element
			const articleElement = document.createElement("article");
			articleElement.append(articleTitle, articleContent);

			// add article to section
			sectionElement.append(articleElement);
		}
	}

	// make first section in content area active, same for first link
	contentArea.firstElementChild.classList.add("active-section");
	document.querySelector(".navigation-link").classList.add("active-link");
}

function resetLinks() {
	/* reset modified links' text and indicate click on current link */
	for (let link of document.querySelectorAll(".navigation-link")) {
		if (link.classList.contains("active-link")) {
			link.classList.remove("active-link");
		}
	}
}

function highlightSection(prevActiveSection) {
	/* highlight the correct section when a scroll happens */
	const bodyHeight = document.body.offsetHeight;
	let contentArray = contentArea.children;

	// set/unset "active-section" class state for sections in the content area
	for (let section of contentArray) {
		/*
		 * section is "in view" when it's top coordinate is in range:
		 * [0, (body's height - section's header height)]
		 */
		const sectionTop = section.getBoundingClientRect().top;
		const headerHeight = section.firstElementChild.offsetHeight;
		const lowerBound = 0;
		const upperBound = bodyHeight * 0.5 - headerHeight;
		const inView = sectionTop >= lowerBound && sectionTop <= upperBound;

		if (inView) {
			/*
			 * when a section is in view, remove active class from all sections
			 * then set it to the viewed section
			 */
			for (let section of contentArray) {
				section.classList.remove("active-section");
			}
			section.classList.add("active-section");
			
			// return currently highlighted section
			return section.dataset.type;
		}
	}
	// if no new active section, return last one
	return prevActiveSection;
}

function highlightMatches(searchQuery) {
	/*
	 * walk document body's node tree, highlighting parts of text nodes
	 * that match searchQuery by replacing the matching parts with mark elements
	 */
	let matchSucceeded = false;

	function highlight(elem) {
		/* replace searchQuery parts of child text node with mark elements */
		// find all parts to mark then split node text, both using search query
		const elementText = elem.textContent;
		const reg = new RegExp(`(${searchQuery})`, "gi");
		const splitTextArray = elementText.split(reg);
		// return if no matches
		if (splitTextArray.length === 1) {
			return;
		} else {
			matchSucceeded = true;
		}

		/* 
		 * create an array of text nodes interleaved with mark elements that
		 * highlight search query text
		 */
		let newChildren = [];
		for (let i = 0; i < splitTextArray.length; i++) {
			const textNode = document.createTextNode(splitTextArray[i]);
			if (i % 2 == 0) {
				newChildren.push(textNode);
			} else {
				const mark = document.createElement("mark");
				mark.appendChild(textNode);
				newChildren.push(mark);
			}
		}

		// strip empty text nodes
		newChildren = newChildren.filter(node => node.textContent !== "");

		// update the element
		elem.replaceChildren(...newChildren);
	}

	// css selectors to filter out while searching
	const cssExclude = [
		"script",
		"#search-area",
		"#navigator-seperator",
		"mark",
	];

	// setup walker
	const filter = { acceptNode: function(node) {
		// allow non excluded elements that have a single text node child
		if (matchesAny(node, cssExclude)) {
			return NodeFilter.FILTER_REJECT;
		} else if (
			node.childNodes.length === 1 
			&& node.firstChild.nodeType === 3
		) {
			return NodeFilter.FILTER_ACCEPT;
		} else {
			return NodeFilter.FILTER_SKIP;
		}
	}};
	const treeWalker = document.createTreeWalker(
		document.body,
		NodeFilter.SHOW_ELEMENT,
		filter,
	);

	// start walker
	let currentNode;
	while ((currentNode = treeWalker.nextNode()) !== null) {
		highlight(currentNode);
	}

	return matchSucceeded;
}

function unHighlightMatches() {
	/*
	 * walk document body's node tree, unhighlighting elements by replacing their
	 * children nodes with a single text node made from the element's textContent
	 */
	function childMatches(node, selector) {
		/* check if any of node's children matches a given selector */
		return Array.from(node.childNodes).some((childNode) => {
			return childNode.nodeType === 1 ? childNode.matches(selector) : false;
		});
	}

	// css selectors to filter out while walking tree
	const cssExclude = [
		"script",
		"#search-area",
		"#navigator-seperator",
	];

	// setup walker
	const filter = { acceptNode: function(node) {
		if (matchesAny(node, cssExclude)) {
			return NodeFilter.FILTER_REJECT;
		} else if (childMatches(node, "mark")) {
			return NodeFilter.FILTER_ACCEPT;
		} else {
			return NodeFilter.FILTER_SKIP;
		}
	}};
	const treeWalker = document.createTreeWalker(
		document.body,
		NodeFilter.SHOW_ELEMENT,
		filter,
	);

	// start walker
	let currentNode;
	while ((currentNode = treeWalker.nextNode()) !== null) {
		/*
		 * concatenates all decendant text nodes and assigns the result back to
		 * the parent node, thus getting rid of mark elements inside the node
		 */
		currentNode.textContent = String(currentNode.textContent);
	}
}


fetch("/articles")
.then((res) => res.json())
.then((articles) => {
	// dynamically load page content
	populate(articles);
	// attach listeners
	navigationList.addEventListener("click", handleClickNavigation);
	contentArea.addEventListener("scroll", handleScroll(), { "passive": true });
	searchButton.addEventListener("click", handleSearchButton());
});

