document.addEventListener('DOMContentLoaded', () => {
  
  Fancybox.defaults.Hash = false;

  // #1 Grouped Images
  Fancybox.bind(".card-image a", {
    infinite: false,
    hideScrollbar: true,
    groupAll: true,
    Toolbar: {
      display: [
        { id: "prev", position: "center" },
        { id: "counter", position: "center" },
        { id: "next", position: "center" },
        "slideshow",
        "fullscreen",
        "thumbs",
        "close",
      ],
    },
  });

  
});
