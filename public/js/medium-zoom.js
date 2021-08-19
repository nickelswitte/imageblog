document.addEventListener('DOMContentLoaded', () => {
    const zoomDefault = mediumZoom('#zoom-default')
    const zoomMargin = mediumZoom('#zoom-margin', { margin: 48 })
    const zoomBackground = mediumZoom('#zoom-background', { background: '#212530' })
    const zoomScrollOffset = mediumZoom('#zoom-scrollOffset', {
      scrollOffset: 0,
      background: 'rgba(25, 18, 25, .9)',
    })
});
