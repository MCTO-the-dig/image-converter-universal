# 🖼️ Universal Image Converter

A lightweight Cloud Run microservice that converts and resizes images to **AVIF**, **JPG**, or **PNG** formats using [Sharp](https://sharp.pixelplumbing.com/).  
Designed for automation workflows (e.g., Make.com) and secure access via an API key.

---

## 🚀 Overview

This service fetches an image from a public URL, resizes it, converts it to a specified format, and saves the result to a Google Cloud Storage (GCS) bucket.

- **Input:** Publicly accessible image URL  
- **Output:** Converted image stored in a GCS bucket  
- **Supported formats:** `avif`, `jpg`, `png`  
- **Auth:** Strict via `x-api-key`

---

## ⚙️ Deployment

### Option 1: Deploy via Cloud Run UI

1. Open [Google Cloud Console → Cloud Run](https://console.cloud.google.com/run)
2. Click **Deploy Service**
3. Upload this folder (must contain `index.js`, `package.json`, `.gcloudignore`)
4. Runtime: **Node.js 22**
5. Entry point: `start`
6. Authentication: **Allow unauthenticated invocations**
7. Add Environment Variable:
   ```bash
   AUTH_KEY=<your-secret-key>
   ```
8. Click **Deploy**

### Option 2: Deploy via CLI

```bash
gcloud run deploy image-converter-universal \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars AUTH_KEY=your-secret-key
```

---

## 🔑 Environment Variables

| Name       | Description                           |
| ----------- | ------------------------------------- |
| `AUTH_KEY`  | Required API key for access           |
| `PORT`      | Optional port override (default 8080) |

---

## 🗾 API Reference

**POST** `/convert`

### Headers

```json
{
  "Content-Type": "application/json",
  "x-api-key": "<your-secret-key>"
}
```

### Request Body

```json
{
  "imageUrl": "https://example.com/photo.jpg",
  "format": "jpg",
  "quality": 80,
  "targetWidth": 1200,
  "bucketName": "images.digitisingevents.com",
  "filePrefix": "youtube-thumbnails",
  "fileName": "example"
}
```

### Parameters

| Field | Type | Default | Description |
| :---- | :---- | :---- | :---- |
| `imageUrl` | string | — | Source image URL (required) |
| `format` | string | `avif` | Output format (`avif`, `jpg`, `png`) |
| `quality` | number | `70` | Compression quality |
| `targetWidth` | number | `1500` | Resize target width in px |
| `bucketName` | string | `images.digitisingevents.com` | Target GCS bucket |
| `filePrefix` | string | `""` | Optional folder path in bucket |
| `fileName` | string | derived from URL | Optional file base name |

---

## ✅ Example Response

```json
{
  "original": "https://example.com/source.jpg",
  "converted": "https://storage.googleapis.com/images.digitisingevents.com/youtube-thumbnails/example_1200.jpg",
  "width": 1200,
  "format": "jpg",
  "bucket": "images.digitisingevents.com"
}
```

---

## ⚡ Example cURL Test

```bash
curl -X POST https://<your-service-url>/convert \
  -H "x-api-key: <your-secret-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.googleapis.com/thumbimages/sample.png",
    "format": "png",
    "targetWidth": 800,
    "bucketName": "thumbimages",
    "filePrefix": "youtube-thumbnails",
    "fileName": "testImage"
  }'
```

---

## 🧪 Testing Checklist

| Test | Expected Result |
| :---- | :---- |
| Missing `x-api-key` | `403 Forbidden` |
| Invalid `format` | `400 Invalid format` |
| Default payload (only `imageUrl`) | Converts to AVIF at 1500px width |
| Small image (< targetWidth) | Does not upscale |
| Alternate bucket | Saves to specified GCS bucket |
| Bad URL | `500 Conversion failed` with fetch error |

---

## 🛠️ Notes

- Uses **Sharp v0.33** for efficient AVIF/JPG/PNG conversion  
- Preserves aspect ratio; no upscaling  
- Overwrites existing files with same name  
- Requires public source images (no auth fetch)

---

## 💡 Future Enhancements

- Add `stripMetadata` flag for smaller outputs  
- Add `autoDetectFormat` for best format selection  
- Optional placeholder modes (grayscale, blur)  
- Skip overwrite if file already exists

---

**Engineer:** Adam Malik
**Coder: ** ChatGPT5 with training
**Project:** [Digitising Events Microservices](https://digitisingevents.com)  
**Service:** `image-converter-universal`  
**License:** MIT  
