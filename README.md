# Wawa news

## A dynamic article website


### Description

Wawa news consists of a nodejs server that provides a JSON representation of supplied text articles, which is fetched by the javascript frontend and dynamically loaded into sections for browsing.


### Features:

* Dynamic loading of articles from stored text files.
* Navigation panel to quickly scroll through news sections.
* Global search throughout the page using a search bar.


### Dependencies:

- Server: a Node.js runtime. Confirmed to work on Node.js LTS 16.15.1 (Gallium).
- Frontend: any modern browser would do.


### Setup:

1. Create an article directory (directory sample_articles is used by default for demonstration).
2. Inside it create sub-directories for each article section (Ex: Sports, Tech, etc).
3. Go inside an article section directory and write text files for each article. On the website, the filename will become the article's title (minus the file extension, if present), and the file's content will become the article's body.
2. Run the server with the article directory as the first argument (default: sample_articles), and the port to listen to as the second argument (default: 8080).
3. To test the server go to localhost:8080 or 127.0.0.1:8080 (Or any port number you specified).
4. Enjoy ^_^


### Usage:

	$ node server.js [ARTICLE_DIR] [PORT]  
	PORT: port to listen on (default: 8080)  
	ARTICLE_DIR: directory to read articles from (default: sample_articles)  


### Browsing:

Select a news section from the navigation panel to the left or manually scroll through news in the content area.

