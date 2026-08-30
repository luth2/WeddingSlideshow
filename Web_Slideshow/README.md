# Web Slideshow

Die Web Slideshow ersetzt den bildschirmgebundenen Raspberry-Pi-Player. Sie liest Bilder direkt aus demselben Ordner, in den der Upload-Service schreibt, und stellt die Diashow auf jedem aktuellen Browser bereit.

## Mit Docker Compose starten

Upload und Slideshow teilen sich dabei das Docker-Volume `wedding-photos`:

```bash
SLIDESHOW_TITLE="Johanne und Lucas" docker compose up --build
```

Danach stehen der Upload unter `http://localhost:8080` und die Slideshow unter `http://localhost:8090` bereit.

Alternativ kann der Container mit einem beliebigen lokalen Ordner gestartet werden:

```bash
docker build -t wedding-web-slideshow ./Web_Slideshow
docker run --rm -p 8090:8080 \
  -e SLIDESHOW_TITLE="Johanne und Lucas" \
  -v "$PWD/photos:/data/photos:ro" \
  wedding-web-slideshow
```

## Konfiguration

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `PORT` | `8080` | HTTP-Port |
| `PHOTO_DIR` | `/data/photos` | Gemeinsamer Fotoordner |
| `SLIDESHOW_TITLE` | `Wedding Slideshow` | Titel in der Kopfzeile und im Browser-Tab |
| `SLIDESHOW_INTERVAL_SECONDS` | `8` | Anzeigedauer pro Foto |

HEIC- und HEIF-Dateien werden beim Abruf durch den Browser dynamisch als JPEG ausgeliefert. Die Slideshow benoetigt nur Lesezugriff auf den Fotoordner.

## Kubernetes

Upload und Slideshow mounten beide den bestehenden `wedding-photo-pvc`. Der Upload schreibt nach `/data/uploads`, waehrend die Slideshow denselben PVC unter `/data/photos` read-only liest. Der LoadBalancer-Service stellt die Slideshow auf Port 80 bereit.

Vor dem Deployment muss `ghcr.io/YOUR_GITHUB_USER/wedding-web-slideshow:latest` in `slideshow-deployment.yaml` durch das gebaute Image ersetzt werden. Der sichtbare Titel wird dort mit `SLIDESHOW_TITLE` gesetzt.

Wurde die aeltere Sync-Version bereits ausgerollt, muessen deren Ressourcen einmalig entfernt werden:

```bash
kubectl delete \
  cronjob/wedding-photo-sync \
  secret/onedrive-rclone-config \
  pvc/wedding-slideshow-cache-pvc \
  -n wedding-photos \
  --ignore-not-found
```