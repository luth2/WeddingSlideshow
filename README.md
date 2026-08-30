# Wedding Slideshow

A self-hosted photo upload and browser-based slideshow for weddings, parties, and other events. Guests upload their pictures through a simple web interface, and new photos automatically become available in the slideshow.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U6B2261GAE)

## Features

- Interactive multi-photo upload page
- Full-screen browser slideshow with automatic transitions
- Previous, next, pause, and full-screen controls
- Configurable event title and slide interval
- JPG, JPEG, PNG, GIF, WebP, HEIC, and HEIF support
- Shared persistent photo storage
- Docker Compose setup for standalone hosting
- Helm chart for Kubernetes deployments
- Responsive interfaces for desktop and mobile browsers

## Architecture

The project consists of two independent containers:

- **Photo Upload** receives images and writes completed uploads to shared storage.
- **Web Slideshow** reads the same storage and displays available images in a browser.

The slideshow mounts the photo storage as read-only. Files are first written with an `.uploading` suffix and renamed after a successful upload, preventing incomplete images from appearing.

```text
Guest browser -> Photo Upload -> Shared photo storage -> Web Slideshow -> Display browser
```

## Repository Structure

```text
.
├── Fotoupload_page/   # Upload frontend and API
├── Web_Slideshow/     # Browser-based slideshow
├── WeddingSlideshow/  # Helm chart
└── compose.yaml       # Local container deployment
```

## Docker Compose

### Requirements

- Docker with Docker Compose, or a compatible container runtime

### Start

```bash
SLIDESHOW_TITLE="Our Wedding" docker compose up --build -d
```

The services are available at:

- Upload page: <http://localhost:8080>
- Slideshow: <http://localhost:8090>

To change the time between photos:

```bash
SLIDESHOW_TITLE="Our Wedding" \
SLIDESHOW_INTERVAL_SECONDS=10 \
docker compose up --build -d
```

Uploaded photos are stored in the `wedding-photos` Docker volume.

### Stop

```bash
docker compose down
```

This keeps the photo volume. To remove the volume and all uploaded photos, run `docker compose down --volumes` only when the data is no longer needed.

## Kubernetes with Helm

### Requirements

- Kubernetes cluster
- Helm 3 or newer
- A storage class supporting the configured access mode
- Published upload and slideshow container images

Update the image repositories and storage class in `WeddingSlideshow/values.yaml`:

```yaml
persistence:
  storageClass: azurefile-csi
  accessModes:
  - ReadWriteMany

upload:
  image:
    repository: ghcr.io/luth2/wedding-photo-upload

slideshow:
  image:
    repository: ghcr.io/luth2/wedding-web-slideshow
  config:
    title: Our Wedding
    intervalSeconds: 8
```

Install or upgrade the release:

```bash
helm upgrade --install wedding-slideshow ./WeddingSlideshow \
  --namespace wedding-photos \
  --create-namespace
```

The default chart creates two `LoadBalancer` services and one shared PVC. The PVC uses the Helm `keep` policy to protect uploaded photos during uninstall.

### Use an Existing PVC

```bash
helm upgrade --install wedding-slideshow ./WeddingSlideshow \
  --namespace wedding-photos \
  --create-namespace \
  --set persistence.create=false \
  --set persistence.existingClaim=wedding-photo-pvc
```

The existing claim must be writable by the upload pod and readable by the slideshow pod.

### Validate the Chart

```bash
helm lint ./WeddingSlideshow
helm template wedding-slideshow ./WeddingSlideshow \
  --namespace wedding-photos
```

## Configuration

### Shared

| Variable | Default | Description |
| --- | --- | --- |
| `SLIDESHOW_TITLE` | `Wedding Slideshow` | Event title displayed by both websites |

### Photo Upload

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP server port |
| `UPLOAD_DIR` | `/data/uploads` | Shared upload directory |
| `MAX_FILE_SIZE_MB` | `25` | Maximum size of one uploaded file |
| `MAX_FILES_PER_REQUEST` | `25` | Maximum number of files per request |

### Web Slideshow

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP server port |
| `PHOTO_DIR` | `/data/photos` | Shared photo directory |
| `SLIDESHOW_INTERVAL_SECONDS` | `8` | Display duration for each photo |

## Security

The upload endpoint does not include authentication or rate limiting. When exposing it publicly, place the services behind HTTPS and consider adding access control, upload limits, and network-level protection appropriate for your event.

Do not expose the shared photo volume directly. Back up important photos before deleting container volumes or persistent volume claims.

## Development

Install dependencies and run the checks for both applications:

```bash
npm --prefix Fotoupload_page install
npm --prefix Fotoupload_page run check

npm --prefix Web_Slideshow install
npm --prefix Web_Slideshow run check
```

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

## Support

If you find this project useful, you can support its development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U6B2261GAE)
