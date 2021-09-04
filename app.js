
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


// Serve the index page
app.get('/me', (req, res) => {
    res.render("_about", {
        profilePicturePath: "/img/IMG_00034.jpg"
    })
})

// Serve the index page
app.get('/kamera', (req, res) => {
    res.render("_camera", {
        picture1: "/img/camera.jpg",
        picture2: "/img/camera2.jpg",
        picture3: "/img/objektiv.jpg"
    })
})




app.get('/', (req, res) => {

    const testFolder = './public/img/bornholm/';
    

    fs.readdir(testFolder, (err, files) => {
        console.log(files);

        let data = {
            pathPrefix: "/img/bornholm/",
            imageNames: files,
            title: "Bornholm 2021",
            subtitle: "Eine Reise auf die Ostseeinsel"
        }
        
        res.render("_album", data);
        
    });

    
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
})
