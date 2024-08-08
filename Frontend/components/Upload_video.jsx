import React, { useState } from 'react';
import axios from 'axios';
import "./main.css"

const Upload_video = ({ onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', 'video_preset');
  
    setIsLoading(true);
  
    try {
      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dtghszkjv/video/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      console.log('Upload successful:', response.data);
  
      // Construct the resolutions object
      const resolutions = {
        '144': `https://res.cloudinary.com/dtghszkjv/video/upload/w_256,h_144/${response.data.public_id}.mp4`,
        '240': `https://res.cloudinary.com/dtghszkjv/video/upload/w_426,h_240/${response.data.public_id}.mp4`,
        '320': `https://res.cloudinary.com/dtghszkjv/video/upload/w_640,h_320/${response.data.public_id}.mp4`,
        '480': `https://res.cloudinary.com/dtghszkjv/video/upload/w_854,h_480/${response.data.public_id}.mp4`,
        '720': `https://res.cloudinary.com/dtghszkjv/video/upload/w_1280,h_720/${response.data.public_id}.mp4`,
        '1080': `https://res.cloudinary.com/dtghszkjv/video/upload/w_1920,h_1080/${response.data.public_id}.mp4`
      };
  
      // Send metadata to your backend
      await axios.post('https://multi-resolution-video-player-backend.onrender.com/save-metadata', {
        filename: response.data.public_id, 
        cloudinary_url: response.data.secure_url,
        cloudinary_public_id: response.data.public_id,
        resolutions 
      });
  
      onUpload(); // Call the onUpload callback to refresh the list
    } catch (error) {
      if (error.response) {
        console.error('Error uploading video:', error.response.data);
      } else if (error.request) {
        console.error('Error uploading video:', error.request);
      } else {
        console.error('Error uploading video:', error.message);
      }
    } finally {
      setIsLoading(false); 
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Uploading...' : 'Upload Video'}
      </button>
      {isLoading && <div className="loader">.</div>}
    </form>
  );
};

export default Upload_video;
