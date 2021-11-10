document.addEventListener('DOMContentLoaded', () => {
  
  Fancybox.defaults.Hash = false;

  Fancybox.bind(".card-image a", {
    infinite: false,
    groupAll: true,
    hideScrollbar: true,
    Toolbar: {
      display: [
        "slideshow",
        "fullscreen",
        "thumbs",
        "close",
      ],
    },
  });

  
});
