document.addEventListener('DOMContentLoaded', () => {
  
  const zoomBackground = mediumZoom('#zoom-background', { background: '#212530' })
  
  const attachKeyEvents = e => {
    document.addEventListener('keyup', handleKey, false)
  }

  const detachKeyEvents = e => {
    document.removeEventListener('keyup', handleKey, false)
  }

  const handleKey = e => {
    const images = zoomBackground.getImages();
    const currentImageIndex = images.indexOf(zoomBackground.getZoomedImage());
    let target;

    if (images.length <= 1) {
      return;
    }

    switch (e.code) {
      case 'ArrowLeft':
        target = currentImageIndex - 1 < 0 ? images[images.length - 1] : images[currentImageIndex - 1];
        
        zoomBackground.close().then(() => {
          target.scrollIntoView();
          zoomBackground.open({
            target: target
          })
        })
        break;
      case 'ArrowRight':
        target = currentImageIndex + 1 >= images.length ? images[0] : images[currentImageIndex + 1];
          zoomBackground.close().then(() => {
            target.scrollIntoView();
            zoomBackground.open({
            target: target
          });
        });
        break;

      default:
        break;
    }
  }

  zoomBackground.on('open', attachKeyEvents);
  zoomBackground.on('close', detachKeyEvents);
});
