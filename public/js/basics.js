
// Activate navBurger
document.addEventListener('DOMContentLoaded', () => {

    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  
    // Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {
  
        // Add a click event on each of them
        $navbarBurgers.forEach( el => {
            el.addEventListener('click', () => {
    
            // Get the target from the "data-target" attribute
            const target = el.dataset.target;
            const $target = document.getElementById(target);
    
            // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');
    
            });
        });
    }
  
});


document.addEventListener('DOMContentLoaded', () => {
    var imgs = document.getElementsByClassName('zoomable');

    //console.log("!");
    //console.log(imgs);

    for (let img of imgs) {
        img.setAttribute("id", "zoom-background");
    }

    

});

function clickPress(event) {
    if (event.key == "Enter") {
        //console.log("test");
        var password = document.getElementById('passInput').value;
        sendPass(password);
    }
}

/**
 * Function to send password for private album
 */
function sendPass(password) {

    
    // Sending and receiving data in JSON format using POST method
    var xhr = new XMLHttpRequest();
    // Build the url which is needed
    var url = window.location.protocol + '//' + window.location.host + "/" + "private-album";

    console.log(url);
    console.log(password);
    
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            //var json = JSON.parse(xhr.responseText);
            // console.log(xhr.responseText);
            forward(xhr.responseText);
        }
    };

    // var json = '{"url": ' + content + '}';
    var data = JSON.stringify({password: password})
    
    xhr.send(data);

}

function forward(data) {
    console.log(data);

    let error = JSON.parse(data).error;
    let url = JSON.parse(data).url;
    let routing = JSON.parse(data).albumPrivateRouting;

    if (url) {

        // If a url successfully arrived, build it together
        let path = window.location.protocol + '//' + window.location.host + "/" + routing + "/" + url;
        //console.log(path);

        // And redirect
        window.location.href = path;


    } else {
    
        let input = document.getElementById("passInput");
        let modal = document.getElementById("modalPassword");

        input.classList.add("is-danger");
        modal.classList.add("error");

        setTimeout(function(){
            input.classList.remove("is-danger");
            modal.classList.remove("error");
        }, 1000);
    }
}



// BULMA MODAL HANDLERS
document.addEventListener('DOMContentLoaded', () => {
    // Functions to open and close a modal
    function openModal($el) {
      $el.classList.add('is-active');
      setupInput();
    }
  
    function setupInput() {
      let input = document.getElementById("passInput");
      input.focus();
      input.value = "";
    }
  
    function closeModal($el) {
      $el.classList.remove('is-active');
    }
  
    function closeAllModals() {
      (document.querySelectorAll('.modal') || []).forEach(($modal) => {
        closeModal($modal);
      });
    }
  
    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
      const modal = $trigger.dataset.target;
      const $target = document.getElementById(modal);
  
      $trigger.addEventListener('click', () => {
        openModal($target);
      });
    });
  
    // Add a click event on various child elements to close the parent modal
    (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
      const $target = $close.closest('.modal');
  
      $close.addEventListener('click', () => {
        closeModal($target);
      });
    });
  
    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
      const e = event || window.event;
  
      if (e.keyCode === 27) { // Escape key
        closeAllModals();
      }
    });
});



