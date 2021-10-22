
import express from 'express';
import * as eta from "eta"
import fs from "fs";
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var md = new MarkdownIt().use(taskLists);


const app = express();
const port = 80;

let albums = "";
let images = [];


// Enable render engine
app.engine("eta", eta.renderFile);
app.set("view engine", "eta");
app.set('views', './views');


app.use(express.json());
app.use(express.static('node_modules/bulma/css'));
app.use(express.static('node_modules/@creativebulma/bulma-divider/dist'));
app.use(express.static('node_modules/medium-zoom/dist'));
app.use(express.static('public'));
// Include static files of bulma


function init() {

    const imageFolder = './public/img/';

    fs.readdir(imageFolder, (err, files) => {
        console.log(files);

        // Store the folders into the albums variable
        albums = files;
    
    });
    
}


// Serve the index page
app.get('/me', (req, res) => {
    res.render("_about", {
        profilePicturePath: "/img/others/IMG_00034.jpg"
    })
})

// Serve the index page
app.get('/kamera', (req, res) => {
    res.render("_camera", {
        picture1: "/img/camera/camera.jpg",
        picture2: "/img/camera/camera2.jpg",
        picture3: "/img/camera/objektiv.jpg"
    })
})




app.get('/', (req, res) => {

    const testFolder = './public/img/bornholm/';
    

    fs.readdir(testFolder, (err, files) => {
        // console.log(files);

        let index;

        fs.readFile(testFolder + '/index.json', 'utf8' , (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log(data);

            index = JSON.parse(data);

            let dataRender = {
                pathPrefix: "/img/bornholm/",
                imageNames: files,
                title: index.title,
                subtitle: index.subtitle
            }

            res.render("_album", dataRender);
        });

    });

});

app.get('/album/:albumName', (req, res) => {

    console.log(req.params.albumName);

    // Save album parameter
    let album = req.params.albumName;

    // if this is an actual album
    if (albums.includes(album)) {
        
        let albumPathLocal = './public/img/' + album + '/';
        let albumPath = '/img/' + album + '/';
        let index;

        fs.readdir(albumPathLocal, (err, files) => {
            console.log(files);

            const indexArray = files.indexOf('index.json');
            
            if (indexArray > -1) {
                files.splice(indexArray, 1);
            }



            fs.readFile(albumPathLocal + '/index.json', 'utf8' , (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }

                // console.log(data);

                index = JSON.parse(data);

                let dataRender = {
                    pathPrefix: albumPath,
                    imageNames: files,
                    title: index.title,
                    subtitle: index.subtitle
                }

                res.render("_album", dataRender);
            });
        });


    } else {
        res.send("This album does not exist");
    }

});

app.get('/h', (req, res) => {

    res.render("_home");

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
  console.log('Example app listening at port' + port);
  // console.log("Paths variable is: " + keyUrlPairs)
});

init();
