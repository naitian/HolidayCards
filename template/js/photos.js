function handleDragStart(e) {
  console.log(e);
};

window.onload = function () {
  console.log('Running Photo Script');
  document.querySelectorAll('.photo-card .inner').forEach(v => {
    console.log(v);
    v.ondragstart = handleDragStart;
  });
}
