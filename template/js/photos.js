let mouseDown = false;
let startX = startY = null;
let el = null;

function handleDragStart(e) {
  e.preventDefault();
  if (!e.target.matches('.photo-card .inner')) return;
  el = e.target;
  if (e.type == 'touchstart') {
    startX = e.targetTouches[0].clientX;
    startY = e.targetTouches[0].clientY;
  } else {
    startX = e.clientX;
    startY = e.clientY;
  }

  e.target.parentElement.style.zIndex = 10;
  // console.log('start', startX, startY);
};

function handleDrag(e) {
  e.preventDefault();
  if (startX && startY && e.target === el) {
    let container = e.target.parentElement;
    let [xOld, yOld] = container.style.transform.match(/(-?\d+\.?\d*)px/g)
    xOld = parseInt(xOld.slice(0, -2));
    yOld = parseInt(yOld.slice(0, -2));
    if (e.type == "touchmove") {
      deltaX = e.targetTouches[0].clientX - startX;
      deltaY = e.targetTouches[0].clientY - startY;
      startX = e.targetTouches[0].clientX;
      startY = e.targetTouches[0].clientY;
    } else {
      deltaX = e.clientX - startX;
      deltaY = e.clientY - startY;
      startX = e.clientX;
      startY = e.clientY;
    }
    newX = xOld + deltaX;
    newY = yOld + deltaY;
    // console.log('----');
    // console.log('delta', deltaX, deltaY);
    // console.log('old', xOld, yOld);
    // console.log('new', newX, newY);
    container.style.transform = `translate(${newX}px, ${newY}px)`;
  }
}

function handleDragEnd(e) {
  e.preventDefault();
  // if (!e.target.matches('.photo-card .inner')) return;
  startX = null;
  startY = null;
  el = null;
  e.target.parentElement.style.zIndex = 0;
}

console.log('Running Photo Script');
document.body.addEventListener('mousedown', handleDragStart);
document.body.addEventListener('touchstart', handleDragStart);
document.body.addEventListener('mouseup', handleDragEnd);
document.body.addEventListener('touchend', handleDragEnd);
document.querySelectorAll('.photo-card .inner').forEach(v => {
  console.log(v);
  v.addEventListener('mousemove', handleDrag, true);
  v.addEventListener('touchmove', handleDrag, true);
  // v.ondrag = handleDrag;
});
