import React, { useState } from 'react';

const Upload_video = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]) ;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('video', file);

    await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('Video uploaded and processed.');
    onUpload(); // Notify parent to refresh the video list
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button type="submit">Upload</button>
    </form>
  );
};

export default Upload_video;
