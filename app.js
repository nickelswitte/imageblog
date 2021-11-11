
import express from 'express';
import * as eta from "eta"
import fs from "fs";
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import path from 'path';
import { fileURLToPath } from 'url';
// import { Fancybox } from "@fancyapps/ui";
import pkg from "@fancyapps/ui";
const { Fancybox } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var md = new MarkdownIt().use(taskLists);


const app = express();
const port = 80;


const albumRounting = 'album';
const albumFolderForPublicUse = '/img/albums/';
const albumFolderForLocalUse = '/public/img/albums/';

let albums = [];
let albumsInfo = [];

// Enable render engine
app.engine("eta", eta.renderFile);
app.set("view engine", "eta");
app.set('views', './views');


app.use(express.json());
app.use(express.static('node_modules/bulma/css'));
app.use(express.static('node_modules/@creativebulma/bulma-divider/dist'));
app.use(express.static('node_modules/medium-zoom/dist'));
app.use(express.static('node_modules/@fancyapps/ui/dist'));
app.use(express.static('public'));
// Include static files of bulma

/**
 * Function to initially do some tasks
 */
function init() {

    collectAlbumsInfo();
       
}



/**
 * Reads all album index.json and collects the information in one variable
 */
async function collectAlbumsInfo() {
    
    // Scan Albums directory
    try {
        // Scan all albums. The dot is attached to make the path relative
        let files = await fs.promises.readdir('.' + albumFolderForLocalUse);

        console.log("All albums found in " + albumFolderForLocalUse + " are: " + files);

        // Store the albums into the albums variable and sort alphabetically
        albums = files.sort(function (a, b) {
            return a.localeCompare(b); //using String.prototype.localCompare()
        });
    } catch (err) {
        console.log("There has been an error while reading the albums directory");
        console.error(err);
    }


    // Loop through the albums
    for (let i = 0; i < albums.length; i++) {

        // Push this first, to create alphabetical order (reading file taked random amount of time)
        albumsInfo.push({
            name: albums[i],
            metadata: null,
            files: {
                full: [],
                thumb: []
            }
        });


        //TODO Catch when no index or thumbnail is present

        // Create path to album index file
        let path = '.' + albumFolderForLocalUse + albums[i] + '/index.json';

        
        // Read index.json
        try {
            // Read index.json file
            let data = await fs.promises.readFile(path, 'utf8');

            let json = JSON.parse(data);

            // Append content to albumsInfo variable
            albumsInfo[i].metadata = json;
            
        } catch (err) {
            console.log("There has been an error while reading the index.json of the " + albums[i] + " directory");
            console.error(err);
        }

        // Read filenames of the album
        try {

            let albumPathPublic = albumFolderForLocalUse + albums[i] + '/';

            // Read all files from folder
            let albumFiles = await fs.promises.readdir('.' + albumPathPublic);

            /*
            // Find index.js and remove of list
            const indexOfIndexJson = files.indexOf('index.json');
            if (indexOfIndexJson > -1) {
                files.splice(indexOfIndexJson, 1);
            }
            */
            
            albumFiles.forEach(file => {
                if (file.includes('full')) {
                    albumsInfo[i].files.full.push(file);

                } else if (file.includes('thumb')) {
                    albumsInfo[i].files.thumb.push(file);
                } else {
                    // This is the case for all other files, currently then can be discarded
                }
                
            });

            
        } catch (err) {
            console.log("There has been an error while reading the " + albums[i] + " directory");
            console.error(err);
        }

        
    }

    // console.log(albumsInfo);
    /* 
    console.log(albumsInfo[0].files.full);
    console.log(albumsInfo[0].files.thumb); */


}

function getAlbumIndex(albumName) {
    for (let i = 0; i < albumsInfo.length; i++) {
        if (albumsInfo[i].name == albumName)
            return i;
    }
}

/**
 * Endpoint for the home page
 */
app.get('/', (req, res) => {
    // console.log(albumsInfo);
    
    let dataRender = {
        albumsPathPrefix: albumFolderForPublicUse,
        albums: albumsInfo,
        albumRouting: albumRounting
    }

    res.render("_home", dataRender);
});

// Serve the index page
app.get('/me', (req, res) => {
    res.render("_about", {
        profilePicturePath: "/img/_others/IMG_00034.jpg"
    })
})

// Serve the index page
app.get('/kamera', (req, res) => {
    res.render("_camera", {
        picture1: "/img/_camera/camera.jpg",
        picture2: "/img/_camera/camera2.jpg",
        picture3: "/img/_camera/objektiv.jpg"
    })
})

// Serve the index page
app.get('/test', (req, res) => {
    
    //res.send(albumsInfo);
    res.render("_test", {});
})





/**
 * Album endpoint
 */
app.get('/' + albumRounting + '/:albumName', (req, res) => {

    // Extract album parameter from request
    let album = req.params.albumName;

    // if this is an actual album
    if (!albums.includes(album)) {
        res.send("This album does not exist");
    }
    
    let albumPath = albumFolderForPublicUse + album + '/';
    let albumIndex = getAlbumIndex(album);

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

    res.render("_album", dataRender);

    

});


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



