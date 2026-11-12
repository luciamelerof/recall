const navButtons = document.querySelectorAll('nav button');
const views = document.querySelectorAll('.view');

function showView(viewId) {
  views.forEach(view => view.classList.toggle('active', view.id === viewId));
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});