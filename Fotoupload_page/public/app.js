const form = document.querySelector("#upload-form");
const input = document.querySelector("#photo-input");
const dropZone = document.querySelector("#drop-zone");
const fileList = document.querySelector("#file-list");
const fileCount = document.querySelector("#file-count");
const uploadButton = document.querySelector("#upload-button");
const statusMessage = document.querySelector("#status-message");

fetch("/api/config", { cache: "no-store" })
  .then((response) => response.json())
  .then((config) => {
    document.title = `Photos for ${config.title}`;
    document.querySelector("[data-slideshow-title]").textContent = config.title;
  })
  .catch((error) => {
    console.error("Configuration could not be loaded.", error);
  });

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${type ? ` is-${type}` : ""}`;
}

function renderSelectedFiles() {
  const files = Array.from(input.files || []);
  fileList.replaceChildren();

  fileCount.textContent = files.length === 0
    ? "No photos selected"
    : `${files.length} photo${files.length === 1 ? "" : "s"} ready`;

  for (const file of files) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const size = document.createElement("span");

    name.textContent = file.name;
    size.textContent = formatSize(file.size);
    item.append(name, size);
    fileList.append(item);
  }
}

function setFilesFromDrop(files) {
  const transfer = new DataTransfer();

  for (const file of files) {
    if (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)) {
      transfer.items.add(file);
    }
  }

  input.files = transfer.files;
  renderSelectedFiles();
}

input.addEventListener("change", () => {
  setStatus("", "");
  renderSelectedFiles();
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  setStatus("", "");
  setFilesFromDrop(event.dataTransfer.files);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const files = Array.from(input.files || []);

  if (files.length === 0) {
    setStatus("Please select at least one photo.", "error");
    return;
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("photos", file);
  }

  uploadButton.disabled = true;
  setStatus("Uploading photos ...", "");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "The upload failed.");
    }

    input.value = "";
    renderSelectedFiles();
    setStatus(result.message || "Thank you, your photos have arrived.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    uploadButton.disabled = false;
  }
});

renderSelectedFiles();
