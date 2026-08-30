const slides = [...document.querySelectorAll(".slide")];
const emptyState = document.querySelector(".empty-state");
const counter = document.querySelector(".counter");
const status = document.querySelector(".status");
const progress = document.querySelector(".progress");
const toggleButton = document.querySelector('[data-action="toggle"]');

let photos = [];
let history = [];
let historyIndex = -1;
let activeSlide = 0;
let intervalSeconds = 8;
let timer = null;
let paused = false;

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function nextPhoto() {
  if (historyIndex < history.length - 1) {
    historyIndex += 1;
    return history[historyIndex];
  }

  const currentId = history[historyIndex]?.id;
  const candidates = shuffled(photos).filter((photo) => photo.id !== currentId);
  const photo = candidates[0] || photos[0];
  if (photo) {
    history = history.slice(Math.max(0, history.length - 49));
    history.push(photo);
    historyIndex = history.length - 1;
  }
  return photo;
}

function restartTimer() {
  clearTimeout(timer);
  progress.classList.remove("is-running");
  void progress.offsetWidth;
  if (!paused && photos.length > 0) {
    progress.style.setProperty("--interval", `${intervalSeconds}s`);
    progress.classList.add("is-running");
    timer = setTimeout(showNext, intervalSeconds * 1000);
  }
}

function displayPhoto(photo) {
  if (!photo) {
    return;
  }

  const incomingIndex = activeSlide === 0 ? 1 : 0;
  const incoming = slides[incomingIndex];
  incoming.onload = () => {
    slides[activeSlide].classList.remove("is-visible");
    incoming.classList.add("is-visible");
    activeSlide = incomingIndex;
    emptyState.hidden = true;
    counter.hidden = false;
    counter.textContent = `${historyIndex + 1}`.padStart(2, "0");
    restartTimer();
  };
  incoming.onerror = () => {
    photos = photos.filter((candidate) => candidate.id !== photo.id);
    showNext();
  };
  incoming.src = `/api/photos/${encodeURIComponent(photo.id)}`;
}

function showNext() {
  displayPhoto(nextPhoto());
}

function showPrevious() {
  if (historyIndex <= 0) {
    return;
  }
  historyIndex -= 1;
  displayPhoto(history[historyIndex]);
}

function togglePlayback() {
  paused = !paused;
  document.body.classList.toggle("is-paused", paused);
  toggleButton.setAttribute("aria-label", paused ? "Resume slideshow" : "Pause slideshow");
  toggleButton.title = paused ? "Resume slideshow" : "Pause slideshow";
  restartTimer();
}

async function refreshPhotos() {
  try {
    const response = await fetch("/api/photos", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    photos = payload.photos;
    status.hidden = true;
    status.textContent = "";

    if (photos.length === 0) {
      emptyState.hidden = false;
      counter.hidden = true;
    } else if (history.length === 0) {
      showNext();
    }
  } catch (error) {
    status.hidden = false;
    status.textContent = "Reconnecting to the slideshow.";
    console.error(error);
  }
}

document.querySelector('[data-action="next"]').addEventListener("click", showNext);
document.querySelector('[data-action="previous"]').addEventListener("click", showPrevious);
toggleButton.addEventListener("click", togglePlayback);
document.querySelector('[data-action="fullscreen"]').addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") showNext();
  if (event.key === "ArrowLeft") showPrevious();
  if (event.key === " ") togglePlayback();
  if (event.key.toLowerCase() === "f") document.querySelector('[data-action="fullscreen"]').click();
});

fetch("/api/config", { cache: "no-store" })
  .then((response) => response.json())
  .then((config) => {
    intervalSeconds = config.intervalSeconds;
    document.title = config.title;
    document.querySelectorAll("[data-slideshow-title]").forEach((element) => {
      element.textContent = config.title;
    });
  })
  .catch(console.error)
  .finally(refreshPhotos);

setInterval(refreshPhotos, 5000);