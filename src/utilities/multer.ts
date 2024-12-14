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
      folder: "medical_reports",
      allowedFormats: ["jpg", "png", "pdf"],
    };
  },
});

const upload = multer({ storage: storage });

export default upload;
