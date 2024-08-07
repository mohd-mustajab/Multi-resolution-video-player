const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Load environment variables

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

ffmpeg.setFfmpegPath(require('ffmpeg-static'));

const app = express();

// Enable CORS
const allowedOrigins = ['https://multi-resolution-video-player-backend.onrender.com', 'https://multi-resolution-video-player.onrender.com'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Connect to MongoDB
const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Server is connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

connectdb();

// Video Schema
const videoSchema = new mongoose.Schema({
  filename: { type: String, index: true }, // Add an index
  resolutions: [String],
  cloudinary_ids: [String]
});

const Video = mongoose.model('Video', videoSchema);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST endpoint to upload videos
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const filePath = req.file.path;
    const resolutions = ['144', '240', '320', '480', '720', '1080'];
    const fileName = path.basename(filePath, path.extname(filePath));
    const cloudinary_ids = [];

    // Process video to different resolutions and upload to Cloudinary
    await Promise.all(resolutions.map(async (res) => {
      const output = `${fileName}_${res}p.mp4`;
      const result = await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .size(`?x${res}`)
          .output(output)
          .on('end', async () => {
            try {
              const uploadResult = await cloudinary.uploader.upload(output, {
                resource_type: 'video',
                public_id: `${fileName}_${res}p`
              });
              fs.unlinkSync(output); // Remove the locally stored file
              resolve(uploadResult.public_id);
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (err) => {
            reject(err);
          })
          .run();
      });
      cloudinary_ids.push(result);
    }));

    // Save video info to the database
    const video = new Video({
      filename: fileName,
      resolutions: resolutions,
      cloudinary_ids: cloudinary_ids
    });

    await video.save();

    fs.unlinkSync(filePath); // Remove the original uploaded file

    res.json('Video uploaded and processing started.');
  } catch (error) {
    console.error('Error during video upload and processing:', error);
    res.status(500).send('Internal Server Error');
  }
});

// GET endpoint to serve videos from Cloudinary
app.get('/video/:resolution/:filename', (req, res) => {
  const { resolution, filename } = req.params;
  const video = Video.findOne({ filename });

  if (!video) {
    return res.status(404).send('Video not found');
  }

  const index = video.resolutions.indexOf(resolution);
  if (index === -1) {
    return res.status(404).send('Resolution not found');
  }

  const cloudinaryId = video.cloudinary_ids[index];
  const videoUrl = cloudinary.url(cloudinaryId, { resource_type: 'video' });

  res.redirect(videoUrl);
});

// GET endpoint to fetch the list of videos
app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    res.status(500).send('Error fetching videos');
  }
});

app.delete('/video/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the video by ID
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).send('Video not found');
    }

    // Delete video files from Cloudinary
    await Promise.all(video.cloudinary_ids.map(async (public_id) => {
      await cloudinary.uploader.destroy(public_id, { resource_type: 'video' });
    }));

    // Delete the video document from the database
    await Video.findByIdAndDelete(id);

    res.send('Video deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting video');
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
