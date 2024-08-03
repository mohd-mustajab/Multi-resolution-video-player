import React, { useState, useEffect } from 'react';
import Video_player from '../components/Video_player';
import Upload_video from '../components/Upload_video';
import Video_list from '../components/Video_list';
import "./App.css"

const App = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('http://localhost:5000/videos');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleVideoSelect = (filename) => {
    setSelectedVideo(filename);
  };

  const handleVideoUpload = () => {
    fetchVideos(); // Refresh the list after a new video is uploaded
  };

  const handleVideoDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/video/${id}`, {
        method: 'DELETE',
      });
      fetchVideos(); // Refresh the list after a video is deleted
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  return (
    <div>
      <h1>Video Player</h1>
      <div className="Upload">
      <Upload_video onUpload={handleVideoUpload} />
      </div>
      <div className="media">
      <div className="player">
      {selectedVideo && <Video_player filename={selectedVideo} />}
      </div>
      <div className="list">
      <Video_list videos={videos} onVideoSelect={handleVideoSelect} onDelete={handleVideoDelete} />
      </div>
      </div>
    </div>
  );
};

export default App;
