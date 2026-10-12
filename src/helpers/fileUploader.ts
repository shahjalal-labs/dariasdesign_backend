import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 3000 * 1024 * 1024 }, // 3000 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/avif",
      "video/mpeg",
      "video/mp4",
      "audio/mpeg",
      "audio/mp3",
      "video/x-matroska",
      "audio/mpeg",
      "application/zip",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("File type not allowed") as unknown as null, false);
    }
    cb(null, true);
  },
});

// upload single image
const profileImage = upload.single("profileImage");
const coverPhoto = upload.single("coverPhoto");
const bannerImage = upload.single("bannerImage");
const reviewImage = upload.single("reviewImage");

// upload multiple image
const uploadMultiple = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "classVideo", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
  { name: "sideImage", maxCount: 1 },
  { name: "overlapImgs", maxCount: 50 },
  { name: "sliderImages", maxCount: 50 },
 
]);

export const fileUploader = {
  upload,
  uploadMultiple,
  profileImage,
  coverPhoto,
  reviewImage,
  bannerImage
};
