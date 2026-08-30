# Wedding Slideshow Helm Chart

Das Chart installiert den Foto-Upload und die browserbasierte Slideshow. Beide Deployments verwenden denselben persistenten Foto-Speicher; die Slideshow mountet ihn read-only.

## Konfiguration

Vor der Installation muessen mindestens die beiden Image-Repositories in `values.yaml` gesetzt werden:

```yaml
upload:
  image:
    repository: ghcr.io/OWNER/wedding-photo-upload

slideshow:
  image:
    repository: ghcr.io/OWNER/wedding-web-slideshow
  config:
    title: Our Wedding
```

Weitere wichtige Werte:

- `persistence.storageClass`, `persistence.size` und `persistence.accessModes`
- `upload.service.type` und `slideshow.service.type`
- `slideshow.config.intervalSeconds`
- Ressourcen sowie Scheduling unter `upload` und `slideshow`

## Installieren

```bash
helm upgrade --install wedding-slideshow ./WeddingSlideshow \
  --namespace wedding-photos \
  --create-namespace
```

Der vom Chart erzeugte PVC wird standardmaessig durch `helm.sh/resource-policy: keep` vor dem Loeschen bei `helm uninstall` geschuetzt.

## Bestehenden PVC verwenden

Beim Umstieg vom bisherigen Kustomize-Deployment kann dessen PVC weiterverwendet werden:

```bash
helm upgrade --install wedding-slideshow ./WeddingSlideshow \
  --namespace wedding-photos \
  --create-namespace \
  --set persistence.create=false \
  --set persistence.existingClaim=wedding-photo-pvc
```

Die bisherigen Deployments und Services muessen vor der Installation entfernt werden. Den PVC dabei nicht loeschen.

## Pruefen

```bash
helm lint ./WeddingSlideshow
helm template wedding-slideshow ./WeddingSlideshow --namespace wedding-photos
```