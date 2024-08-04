import React from 'react';

const Video_list = ({ videos, onVideoSelect, onDelete }) => {
  return (
    <div>
      <h2>Uploaded Videos</h2>
      <ul>
        {videos.map((video) => (
          <li key={video._id}>
            <span onClick={() => onVideoSelect(video.filename)}>{video.filename}</span>
            <button onClick={() => onDelete(video._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Video_list;
