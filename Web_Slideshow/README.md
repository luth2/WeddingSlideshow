# Web Slideshow

The web slideshow reads images directly from the same shared directory used by the upload service and presents them in any modern browser.

## Docker Compose

From the repository root, run:

```bash
SLIDESHOW_TITLE="Our Wedding" docker compose up --build
```

The upload page is available at `http://localhost:8080` and the slideshow at `http://localhost:8090`.

## Standalone Container

```bash
docker build -t wedding-web-slideshow ./Web_Slideshow
docker run --rm -p 8090:8080 \
  -e SLIDESHOW_TITLE="Our Wedding" \
  -v "$PWD/photos:/data/photos:ro" \
  wedding-web-slideshow
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP server port |
| `PHOTO_DIR` | `/data/photos` | Shared photo directory |
| `SLIDESHOW_TITLE` | `Wedding Slideshow` | Page and browser tab title |
| `SLIDESHOW_INTERVAL_SECONDS` | `8` | Display duration for each photo |

HEIC and HEIF files are converted to JPEG when requested by the browser. The slideshow only requires read access to the photo directory.

## Kubernetes

Use the Helm chart in `WeddingSlideshow/`. The upload and slideshow deployments mount the same persistent volume claim, with the slideshow mount set to read-only.
