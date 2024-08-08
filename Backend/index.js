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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const videoSchema = new mongoose.Schema({
  filename: { type: String, required: true, index: true },
  cloudinary_url: { type: String, required: true },
  cloudinary_public_id: { type: String, required: true },
  resolutions: { type: Map, of: String, required: true } // Store resolution URLs
});



const Video = mongoose.model('Video', videoSchema);

// Set up multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage: storage });

// POST endpoint to upload videos
app.post('/save-metadata', async (req, res) => {
  try {
    console.log('Request body:', req.body);

    const { filename, cloudinary_url, cloudinary_public_id, resolutions } = req.body;

    if (!filename || !cloudinary_url || !cloudinary_public_id || !resolutions) {
      console.error('Missing required fields:', { filename, cloudinary_url, cloudinary_public_id, resolutions });
      return res.status(400).send('Missing required fields');
    }

    const video = new Video({
      filename,
      cloudinary_url,
      cloudinary_public_id,
      resolutions: new Map(Object.entries(resolutions)) // Convert resolutions object to a Map
    });

    await video.save();
    res.json('Video metadata saved successfully.');
  } catch (error) {
    console.error('Error saving video metadata:', error.message); 
    res.status(500).send('Internal Server Error');
  }
});



// GET endpoint to serve videos from Cloudinary
app.get('/video/:resolution/:filename', async (req, res) => {
  const { resolution, filename } = req.params;

  try {
    const video = await Video.findOne({ filename });

    if (!video) {
      return res.status(404).send('Video not found');
    }

    if (!video.resolutions.has(resolution)) {
      return res.status(400).send('Invalid resolution');
    }

    const resolutionUrl = video.resolutions.get(resolution);

    res.redirect(resolutionUrl);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).send('Internal Server Error');
  }
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

    // Delete video from Cloudinary
    if (video.cloudinary_public_id) {
      const result = await cloudinary.uploader.destroy(video.cloudinary_public_id, { resource_type: 'video' });
      console.log('Cloudinary delete result:', result);
    }

    // Delete the video document from the database
    await Video.findByIdAndDelete(id);

    res.send('Video deleted successfully');
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).send('Internal Server Error');
  }
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
