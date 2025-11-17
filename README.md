# About

This repo serves as an archive of all iterations of my website project. The website itself acts as a fake digital retail website where users can place online orders for products. With each new version of the project, the scope, capabilities, and look of the website all improve. 

# Versions

**Version 1** of the project involves a website backend running in Python to navigate between the pages, and the pages themselves are constructed with simple HTML. 

**Version 2** involved implementing CSS and dynamic HTML through multi-line python strings, as well as some basic images.

**Version 3** allows users to place new orders, as well as update and cancel them. It also introduces the usage of Javascript to make pages more dynamic, and HTTP POST requests to update orders in the backend.

**Version 4**: better compliance with real HTTP standards. Created the ability to store/forget the user's name via cookies. Improved server robustness / ability to handle errors.

**Version 5**: Version 5 is a complete rewrite of the entire backend. The old Python server has been replaced with a Node.js & Express server. All dynamic HTML pages were converted from Python strings into Pug templates. Shares all the features of version 4.
# Running
To run versions 1-4, simply run the terminal command ```python server.py``` while your terminal is in the respective version directory.

Ex: If you want to run version 3, navigate to the version 3 subdirectory in your terminal then run ```python server.py```. Then, navigate to [http:](http://localhost:4131/) in your preffered web browser to view the page.

For versions 5 and 6, you will need to do the following:

1. Have Node.js installed on your computer. You can get it from https://nodejs.org/.
2. Navigate to the directory in your terminal (e.g., cd "Version 5").
3. Install NPM by running the command <code>npm install</code> (only needs to be done on the first time launching) 
4. To start the server, run the command <code>node server.js</code> and navigate to http://localhost:4131/ in your browser