import React, { useState } from 'react';

const Upload_video = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('https://multi-resolution-video-player-backend.onrender.com/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      console.log('Video uploaded and processed.');
      onUpload(); // Notify parent to refresh the video list
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Failed to upload video. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button type="submit">Upload</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default Upload_video;
