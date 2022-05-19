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
    Thumbs: {
      autoStart: false,
    },
    Image: {
      Panzoom: {
        ratio: function (panzoom) {
          const imgWidth = panzoom.$content.naturalWidth;
          const containerWidth = panzoom.$container.getBoundingClientRect().width;
          const ratio = imgWidth / containerWidth;

          if (ratio > 1.5) {
            return 1.5 / ratio;
          }

          return 1;
        },
      },
    }
  });

  
});
