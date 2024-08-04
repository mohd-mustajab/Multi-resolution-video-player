const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config(); // Load environment variables
PORT='https://multi-resolution-video-player-backend.onrender.com';
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

// Enable CORS
app.use(cors());

// Connect to MongoDB
const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Server is connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

connectdb();

// Video Schema
const videoSchema = new mongoose.Schema({
  filename: { type: String, index: true }, // Add an index
  resolutions: [String]
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
  const filePath = req.file.path;
  const resolutions = ['144', '240', '320', '480', '720', '1080'];
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath, path.extname(filePath));

  const video = new Video({
    filename: fileName,
    resolutions: resolutions
  });

  await video.save();

  // Process video to different resolutions
  resolutions.forEach((res) => {
    const output = `${fileDir}/${fileName}_${res}p.mp4`;
    ffmpeg(filePath)
      .size(`?x${res}`)
      .output(output)
      .on('end', () => {
        console.log(`Processed ${res}p resolution for ${fileName}`);
      })
      .on('error', (err) => {
        console.error(`Error processing ${res}p resolution: ${err}`);
      })
      .run();
  });

  res.send('Video uploaded and processing started.');
});

// GET endpoint to serve videos
app.get('/video/:resolution/:filename', (req, res) => {
  const { resolution, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', `${filename}_${resolution}p.mp4`);
  
  console.log(`Fetching video: ${filePath}`);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).send('File not found');
    }
    res.sendFile(filePath);
  });
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

    // Delete video files from the filesystem
    const resolutions = video.resolutions;
    const fileDir = path.join(__dirname, 'uploads');
    resolutions.forEach((res) => {
      const filePath = path.join(fileDir, `${video.filename}_${res}p.mp4`);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${filePath}`);
        } else {
          console.log(`Deleted file: ${filePath}`);
        }
      });
    });

    // Delete the video document from the database
    await Video.findByIdAndDelete(id);

    res.send('Video deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting video');
  }
});


app.listen(process.env.PORT||5000, () => {
  console.log('Server started on port 5000');
});
