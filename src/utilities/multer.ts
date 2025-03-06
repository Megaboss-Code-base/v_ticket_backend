import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { CLOUDINARY_URL } from "../config";

cloudinary.config({
  cloudinary_url: CLOUDINARY_URL,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "",
      allowedFormats: ["jpg", "png", "pdf"],
    };
  },
});

const upload = multer({ storage: storage });

export async function uploadICSFileToCloudinary(filename: string, icsContent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // This is the trick to upload any non-image file like `.ics`
        public_id: `calendar/${filename}`,
        format: "ics",
      },
      (error, result) => {
        if (error) {
          console.error("Error uploading ICS to Cloudinary:", error);
          return reject(error);
        }
        resolve(result?.secure_url || "");
      }
    );

    // Write the ICS content to the stream
    uploadStream.end(Buffer.from(icsContent));
  });
}


export default upload;
