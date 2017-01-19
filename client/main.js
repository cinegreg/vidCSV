import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';



// Future: write code to export a part of the DB for editing
// Future: fix this if we want to use non-YT videos. Must fix 
//	getPreview() and add a column in CSV

// This code also converts tags to lowercase. Remove if desired.
///////////////////////////// MUST MODIFY TO CORRECT DB ON CS
Videos = new Mongo.Collection('videos');
///////////////////////////// MUST MODIFY TO CORRECT DB ON CS




Template.fileupload.events({
	'submit form': function(event) {
		event.preventDefault();

		var file = event.target.fileupload.files[0];
		var reader = new FileReader();
		reader.onload = function(fileLoadEvent) {

			var filestring = reader.result;
			var csv = parseCSV(filestring);

			for (var i = 0; i < csv.length; i++) {
				//Omit header row
				if (i > 0) {
					var temp = {
						"title": csv[i][0],
						"description": csv[i][5],
						"categories": getWords(csv[i][2]),
						"connections": getWords(csv[i][3]),
						"URL": getURL(csv[i][1]),
						"preview": getPreview(getURL(csv[i][1])),
						"meta": getWords(csv[i][4])
					};

					//Check if video already exists in DB
					var match = Videos.findOne({"URL": temp["URL"]});

					//if so, replace
					if (match) {
						Videos.remove({"_id":match["_id"]});
						Videos.insert(temp);
					}

					//if not, insert
					else {
						Videos.insert(temp);
					}

				}
			}

		};
		reader.readAsBinaryString(file);
	}
});


// Create a string with the URL to preview video on YouTube
// *error* assumption is that video is from YouTube
function getPreview(youtubeID) {
	return "https://img.youtube.com/vi/"+youtubeID+"/mqdefault.jpg";
}

//Split a string by spaces and sort 'words' into array
function getWords(catstring) {
	var wordarray = catstring.split(" ");
	var finalarray = [];
	for (i = 0; i < wordarray.length; i++) {
		if (wordarray[i].length > 0) {

			//Convert to lowercase and add to array
			finalarray.push(wordarray[i].toLowerCase());
		}
	}
	return finalarray;
}

//Extract the YouTube ID from a given youtube URL
//Covers multiple URL types
function getURL(urlstring) {
	var r, rx = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
	r = urlstring.match(rx);

	return r[1];
}


//Parse CSV file uploaded into an array
function parseCSV(str) {
    var arr = [];
    var quote = false;  // true means we're inside a quoted field

    // iterate over each character, keep track of current row and column (of the returned array)
    for (var row = col = c = 0; c < str.length; c++) {
        var cc = str[c], nc = str[c+1];        // current character, next character
        arr[row] = arr[row] || [];             // create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') { quote = !quote; continue; }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { ++col; continue; }

        // If it's a newline and we're not in a quoted field, move on to the next
        // row and move to column 0 of that new row
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    return arr;
}
