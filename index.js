const express = require("express");
const fetch = require("node-fetch");
const sharp = require("sharp");
const { Storage } = require("@google-cloud/storage");

const app = express();
const storage = new Storage();

// --- 🔑 Auth configuration ---
const AUTH_KEY = process.env.AUTH_KEY;
if (!AUTH_KEY) {
  console.warn("⚠️ AUTH_KEY not set in environment — deployment will fail strict auth.");
}

app.use(express.json({ limit: "10mb" }));

// --- 🔐 Strict Auth Middleware ---
app.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== AUTH_KEY) {
    return res.status(403).json({ error: "Forbidden: invalid or missing API key" });
  }
  next();
});

// --- ⚙️ Endpoint ---
app.post("/convert", async (req, res) => {
  try {
    
	// --- set your defaults here --- 
	
	const {
      imageUrl,
      format = "avif",
      quality = 70,
      targetWidth = 1500,
      bucketName = "<your-default-bucket-name>",
      filePrefix = "",
      fileName = ""
    } = req.body;

    // Validate inputs
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const allowedFormats = ["avif", "jpg", "jpeg", "png"];
    if (!allowedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ error: `Invalid format: ${format}. Use avif, jpg, or png.` });
    }

    // Fetch source image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch source image: ${response.statusText}`);
    const buffer = await response.buffer();

    // Process image
    const baseName = fileName || imageUrl.split("/").pop().split(".")[0];
    const safePrefix = filePrefix ? `${filePrefix.replace(/\/+$/, "")}/` : "";

    let processed;
    const sharpInstance = sharp(buffer).resize(targetWidth);

    switch (format.toLowerCase()) {
      case "jpg":
      case "jpeg":
        processed = await sharpInstance.jpeg({ quality }).toBuffer();
        break;
      case "png":
        processed = await sharpInstance.png({ quality }).toBuffer();
        break;
      default:
        processed = await sharpInstance.avif({ quality }).toBuffer();
    }

    const outputFileName = `${safePrefix}${baseName}_${targetWidth}.${format}`;
    const mimeType =
      format === "png" ? "image/png" :
      format === "jpg" || format === "jpeg" ? "image/jpeg" :
      "image/avif";

    // Upload to GCS
    const file = storage.bucket(bucketName).file(outputFileName);
    await file.save(processed, { contentType: mimeType, resumable: false });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${outputFileName}`;

    res.json({
      original: imageUrl,
      converted: publicUrl,
      width: targetWidth,
      format,
      bucket: bucketName
    });

  } catch (err) {
    console.error("❌ Conversion error:", err);
    res.status(500).json({ error: "Conversion failed", details: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Universal image converter running on port ${PORT}`));

