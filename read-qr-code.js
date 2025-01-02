const express = require("express");
const multer = require("multer");
const QRCodeReader = require("qrcode-reader");
const Jimp = require("jimp");

const app = express();

// Multer setup for handling file uploads
const upload = multer({ dest: "uploads/" });

const decodeQRCode = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  const qr = new QRCodeReader();

  return new Promise((resolve, reject) => {
    qr.callback = (err, value) => {
      if (err) {
        reject("Error decoding QR code: " + err);
      } else {
        resolve(value.result);
      }
    };
    qr.decode(image.bitmap);
  });
};

// Route to decode QR code
app.post("/decode-qr", upload.single("qrImage"), async (req, res) => {
  try {
    const imagePath = req.file.path; // Multer provides the uploaded file's path
    const decodedData = await decodeQRCode(imagePath);
    res.status(200).json({ message: "QR Code decoded successfully", data: decodedData });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
