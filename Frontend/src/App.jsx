import React, { useState, useEffect } from 'react';
import Video_player from '../components/Video_player';
import Upload_video from '../components/Upload_video';
import Video_list from '../components/Video_list';
import "./App.css"

const App = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const[isdeleting,setisDeleting]=useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('https://multi-resolution-video-player-backend.onrender.com/videos');
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
    fetchVideos(); // Refresh 
  };

  const handleVideoDelete = async (id) => {
    setisDeleting(prevState => ({ ...prevState, [id]: true }));
    try {
      const response = await fetch(`https://multi-resolution-video-player-backend.onrender.com/video/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
    }finally {
      setisDeleting(prevState => ({ ...prevState, [id]: false }));
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
          <Video_list videos={videos} onVideoSelect={handleVideoSelect} onDelete={handleVideoDelete} isdeleting={isdeleting} />
        </div>
      </div>
    </div>
  );
};

export default App;
