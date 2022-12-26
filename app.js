// Imports
import express from 'express';
import * as eta from "eta"
import fs from "fs";
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid'
// import { Fancybox } from "@fancyapps/ui";
import pkg from "@fancyapps/ui";
// Import body parser for post form data
import bodyParser from 'body-parser';
import { SMTPClient } from 'emailjs';
const { Fancybox } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let smtpClient;

const app = express();
const port = 80;

const mailTimeOut = 10000;

const albumRounting = 'album';
const albumPublicFolderForPublicUse = '/img/albums-public/';
const albumPublicFolderForLocalUse = '/public/img/albums-public/';

const albumPrivateRouting = 'download';
const albumPrivateFolderForPublicUse = '/img/albums-private/';
const albumPrivateFolderForLocalUse = '/public/img/albums-private/';

let albumsInfo = [];
let albumsInfoPrivate = [];
let passwords = "";
const delimiter = " ";

// Variables to prevent mail spam
let mailTextLast = {};
let mailTextLastTimestamp = 0;

// Enable render engine
app.engine("eta", eta.renderFile);
app.set("view engine", "eta");
app.set('views', './views');

// Initiate body parser, which is used to parse post form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Include static files
app.use(express.json());
app.use(express.static('node_modules/bulma/css'));
app.use(express.static('node_modules/@creativebulma/bulma-divider/dist'));
app.use(express.static('node_modules/medium-zoom/dist'));
app.use(express.static('node_modules/@fancyapps/ui/dist'));
app.use(express.static('node_modules/font-awesome'));
app.use(express.static('public'));

/**
 * Function to initially do some tasks
 */
function init() {

    // Scan albums directories
    (async () => {
        albumsInfo = await collectAlbumsInfo(albumPublicFolderForLocalUse);
    })();

    // Scan private album directories
    (async () => {
        albumsInfoPrivate = await collectAlbumsInfo(albumPrivateFolderForLocalUse);
    })();
    
    // Collect smtp info
    readSmtp();

    // Read password files
    readPasswords();
}

async function readSmtp() {
    // Read smtp file
    try {
        // Read index.json file
        let data = await fs.promises.readFile('./smtp', 'utf8');
        let json = JSON.parse(data);

        // Initialize smtp client with json data
        smtpClient = new SMTPClient({
            user: json.user,
            password: json.pass,
            host: json.host,
            ssl: true,
        });

        console.log('Successfully read smtp file and initialized smtp client.');
        
    } catch (err) {

        if (err.code === 'ENOENT') {
            console.error('Smtp file for email service not found!');
        } else {
            console.log("There has been an error while reading the smtp file");
            console.error(err);
        }

    }
}




/**
 * Reads all album index.json and collects the information in one variable
 */
async function collectAlbumsInfo(albumPath) {

    // Clear it to make it fresh
    let albumInfoObject = [];
    let albumList = [];

    console.log('Scanning albums in ' + albumPath);
    
    // Scan Albums directory
    try {
        // Scan all albums. The dot is attached to make the path relative
        let files = await fs.promises.readdir('.' + albumPath);

        // console.log("All albums found in " + albumPath + " are: " + files);

        // Store the albums into the albums variable and sort alphabetically
        albumList = files.sort(function (a, b) {
            return a.localeCompare(b); //using String.prototype.localCompare()
        });
    } catch (err) {
        console.log("There has been an error while reading the albums directory");
        console.error(err);
    }

    // console.log(albumList);

    // Loop through the albums
    for (let i = 0; i < albumList.length; i++) {

        // Push this first, to create alphabetical order (reading file taked random amount of time)
        albumInfoObject.push({
            name: albumList[i],
            metadata: null,
            files: {
                full: [],
                thumb: []
            }
        });


        //TODO Catch when no index or thumbnail is present

        // Create path to album index file
        let path = '.' + albumPath + albumList[i] + '/index.json';

        
        // Read index.json
        try {
            // Read index.json file
            let data = await fs.promises.readFile(path, 'utf8');

            let json = JSON.parse(data);

            // Append content to albumsInfo variable
            albumInfoObject[i].metadata = json;
            
        } catch (err) {

            if (err.code === 'ENOENT') {
                console.error('Index file for album \"' + albumList[i] + '\" not found!');
            } else {
                console.log("There has been an error while reading the index.json of the " + albumList[i] + " directory");
                console.error(err);
            }

            // Remove this album entry in the albumsInfo array, when no index file is found
            // TODO Remove this album

        }

        // Read filenames of the images of the album
        try {

            let albumPathPublic = albumPath + albumList[i] + '/';

            // Read folder for the big images and compile it
            let albumFiles = await fs.promises.readdir('.' + albumPathPublic);

            /*
            // Find index.js and remove of list
            const indexOfIndexJson = files.indexOf('index.json');
            if (indexOfIndexJson > -1) {
                files.splice(indexOfIndexJson, 1);
            }
            */
            
            albumFiles.forEach(file => {
                if (file.includes(".jpg")) {
                    albumInfoObject[i].files.full.push(file);

                } else {
                    // This is the case for all other files, currently then can be discarded
                }
                
            });

            // Read folder with thumbnails
            let albumFilesThumb = await fs.promises.readdir('.' + albumPathPublic + "prev");

            albumFilesThumb.forEach(file => {
                if (file.includes('prev')) {
                    //console.log(file);
                    albumInfoObject[i].files.thumb.push("prev/" + file);
                } else {
                    // This is the case for all other files, currently then can be discarded
                }
                
            });

           

            
        } catch (err) {
            console.log("There has been an error while reading the " + albumList[i] + " directory");
            console.error(err);
        }

        
    }

    // console.log(albumInfoObject);

    logAlbumsInfo(albumInfoObject, albumPath);
    return albumInfoObject;

    // console.log(albumsInfo);

    //console.log(albumInfoObject[0].files.full[1]);


}

/**
 * Returns the album index of a specified album in the album list
 * In case it is not present, return -1
 */
function getAlbumIndex(albumName, albumList) {
    for (let i = 0; i < albumList.length; i++) {
        if (albumList[i].name == albumName)
            return i;
    }

    return -1;
}



function logAlbumsInfo(albumInfoObject, albumPath) {
    console.log('These albums have been found in ' + albumPath);

    albumInfoObject.forEach(album => {
        console.log(" - " + album.name + ' - ' + album.files.full.length + ' images');
    })
}

/**
 * Endpoint for the home page
 */
app.get('/', (req, res) => {
    // console.log(albumsInfo);
    logAlbumsInfo(albumsInfoPrivate);
    
    let dataRender = {
        albumsPathPrefix: albumPublicFolderForPublicUse,
        albums: albumsInfo,
        albumRouting: albumRounting
    }

    // console.log(dataRender);

    res.render("_home", dataRender);
});

// Create a callback function for the about page
var aboutRouting = function (req, res) {
    res.render("_about", {
        profilePicturePath: "/img/_others/ueber-mich.jpeg"
    })
}

// Create routes that serve all variants of über
app.get('/' + encodeURIComponent('über'), aboutRouting);
app.get('/über', aboutRouting);
app.get('/%C3%BCber', aboutRouting);



// Serve the contact page
app.get('/kontakt', (req, res) => {
    res.render("_contact", {
        picture1: "/img/_others/mail.png",
    })
})

// Serve the impressum page
app.get('/impressum', (req, res) => {
    res.render("_impressum")
})



// Serve a test page
app.get('/test', (req, res) => {
    
    //res.send(albumsInfo);
    res.render("_test", {});
})

/**
 * Will take the post request with the form data, check for spam and 
 * attempt to launch a mail
 */
app.post('/contact-processor', (req, res) => {
    
    // Check if the timeout is exceeded
    if (Date.now() - mailTextLastTimestamp < mailTimeOut) {
        // We need to wait a bit more
        res.render("_modal", {
            modal: "Es gab ein Problem mit der Kontaktanfrage. Gehe zurück und versuche es bitte nach einer kurzen Pause erneut. ❌",
            style: "is-danger"
        });
        console.log('A mail has not been launched due to the mail sending time out: ' + (Date.now() - mailTextLastTimestamp) / 1000 + 's left');
        return;
    } else {
        // The time was exceeded, everything okay
        // Save timestamp for next time
        mailTextLastTimestamp = Date.now();

        // Continue to next check
    }
    
    // Now check if this exact message has already been sent the last time
    if (JSON.stringify(mailTextLast) == JSON.stringify(req.body)) {
        // Just do nothing, no further mail is launched
        console.log('A mail has not been launched due to the exact message launch last time');
        res.render("_modal", {
            modal: "Die Kontaktanfrage wurde erfolgreich versendet! 📮",
            style: "is-success"
        });
    } else {
        // Everything okay, continue
        // Launch mail asynchronously
        let promise = sendMail(req.body.name, req.body.mail, req.body.msg)
        
        promise.then(
            resolve => {
                // When everything worked out well, save text
                mailTextLast = req.body;
                console.log('A mail has been launched successfully because of the contact form');
                res.render("_modal", {
                    modal: "Die Kontaktanfrage wurde erfolgreich versendet! 📮",
                    style: "is-success"
                });
            },
            reject => {
                // There was an smtp issue
                res.render("_modal", {
                    modal: "Es gab ein Problem auf unserer Seite mit der Kontaktanfrage. Gehe zurück und versuche es bitte nach einiger Zeit erneut. ❌",
                    style: "is-danger"
                });
                console.log('A mail has not been launched due to a smtp mail error');
            }
        );
    }
});

app.get('/modal', (req, res) => {
    res.render("_modal", {
        modal: "This is a dangerous modal!",
        style: "is-success"
    });
});

/**
 * POST Route to forward to private album
 * Receives the password and will then check if this exists
 */
app.post('/private-album', (req, res) => {
    // get url from post body
    let password = req.body.password;

    //console.log(password);
    //console.log(getUrlUsingPassword(password));
    //let path = '/' + albumPrivateRouting + "/" + getUrlUsingPassword(password);

    let url = getUrlUsingPassword(password);

    if (typeof url !== "undefined") {
        res.json({
            albumPrivateRouting: albumPrivateRouting,
            url: url
        });
    } else {
        // Continue to the next handler (404)
        res.json({
            error: "Not found"
        });
    }
    
});

/**
 * Read the passwords for private albums
 */
function readPasswords() {
    fs.readFile('passwords', 'utf8' , (err, data) => {
        if (err) {
          console.log("No urls.txt could be found. Therefore a new one will be created.");
          return
        }

        // console.log(new Date().toISOString());

        // console.log(data);
        passwords = data.split("\n");
        // console.log(paths);
        console.log("Number of passwords for private albums is " + passwords.length);
    });
}

/** 
 * Go through all passwords and find the corresponding link
 */
function getUrlUsingPassword(pass) {
    let index, pair, result;

    for (index = 0; index < passwords.length; ++index) {

        pair = passwords[index].split(delimiter);

        if (pair[0] == pass) {
            // store url
            result = pair[1];
            break;
        }
    }

    return result;
}

/**
 * Sends a mail
 */
async function sendMail(name, mail, message) {

    let mailText = '<b>Sender</b>: ' + name + '<br>' + 
                   '<b>Mail</b>: ' + mail + '<br>' +
                   '<b>Message</b>: ' + message + '<br>'; 
    
    // sending to hallo@überblendet.de asynchronically
    try {
        const message = await smtpClient.sendAsync({
            text: 'Message to be overwritten by html',
            from: 'überblendet.de <noreply@xn--berblendet-8db.de>',
            to: 'überblendet.de <hallo@xn--berblendet-8db.de>',
            cc: '',
            subject: 'überblendet.de: Neue Kontaktanfrage von ' + name,
            attachment: [
                { data: '<html>' + mailText + '</html>', alternative: true },
            ],
        });
        // console.log(message);
    } catch (error) {
        // TODO Await this error
        // res.send('Es gab ein Problem mit der Kontaktanfrage. Versuche es bitte erneut.');
        console.log(error);
        throw error;
    }
}



/**
 * Album endpoint
 */
app.get('/' + albumRounting + '/:albumName', (req, res) => {

    // Extract album parameter from request
    let album = req.params.albumName;

    let albumIndex = getAlbumIndex(album, albumsInfo);

    if (albumIndex == -1){
        res.send("This album does not exist");
    }
    
    let albumPath = albumPublicFolderForPublicUse + album + '/';

    let dataRender = {
        pathPrefix: albumPath,
        images: {
            full: albumsInfo[albumIndex].files.full,
            thumb: albumsInfo[albumIndex].files.thumb
        },
        title: albumsInfo[albumIndex].metadata.title,
        subtitle: albumsInfo[albumIndex].metadata.subtitle,
        description: albumsInfo[albumIndex].metadata.description
    }

    // console.log(dataRender);

    res.render("_album-grid", dataRender);

    

});

app.get('/new-private-album' + '/:password', (req, res) => {

    // Extract album parameter from request
    let passwordNew = req.params.password;

    let key = getUrlUsingPassword(passwordNew);

    if (typeof key !== "undefined") {
        res.send("This password has already been used, the key is: " + key)
        return;
    }

    // Generate uuid
    let uuid = generateUuid();

    // send response with the key
    res.send("password: " + passwordNew + "\nkey: " + uuid);

    // Prepare the string to be appended
    let append = passwordNew + delimiter + uuid;
    
    // Write to file
    fs.appendFileSync('passwords', "\n" + append, function (err) {
        if (err) throw err;
    });

    // then load the paths into the variable
    readPasswords();
      

});



/**
 * Album private endpoint
 */
app.get('/' + albumPrivateRouting + '/:albumKey', (req, res) => {

    // Extract album parameter from request
    let album = req.params.albumKey;

    // get list index of album
    let albumIndex = getAlbumIndex(album, albumsInfoPrivate);

    // if not found, return
    if (albumIndex == -1){
        res.send("Sorry! This album does not exist");
        return;
    }
    
    let albumPath = albumPrivateFolderForPublicUse + album + '/';

    let dataRender = {
        pathPrefix: albumPath,
        images: {
            full: albumsInfoPrivate[albumIndex].files.full,
            thumb: albumsInfoPrivate[albumIndex].files.thumb
        },
        title: albumsInfoPrivate[albumIndex].metadata.title,
        subtitle: albumsInfoPrivate[albumIndex].metadata.subtitle,
        description: albumsInfoPrivate[albumIndex].metadata.description
    }

    // console.log(dataRender);

    res.render("_album-grid-private", dataRender);

});

function generateUuid() {
    let uuid;
    //TODO check uuids which are already taken
    uuid = nanoid(10);
    
    return uuid;
}


/**
 * 404 Handler
 */
app.use(function(req, res, next) {
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
        res.status(404).send('Sorry cant find that!');
        return;
    }
  
    // respond with json
    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }
  
    // default to plain-text. send()
    res.type('txt').send('Not found');
});



/**
 * Start the server
 */
app.listen(port, () => {
  console.log('Example app listening at port ' + port);
  // console.log("Paths variable is: " + keyUrlPairs)
});

init();



