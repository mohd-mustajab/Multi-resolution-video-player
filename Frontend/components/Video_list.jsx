import React from 'react';

const Video_list = ({ videos, onVideoSelect, onDelete, isdeleting }) => {
  return (
    <div>
      <h2>Uploaded Videos</h2>
      <ul>
        {videos.map((video) => (
          <li key={video._id}>
            <span>{video.filename}</span>
            <button onClick={() => onVideoSelect(video.filename)}>Play</button>
            <button 
              onClick={() => onDelete(video._id)} 
              disabled={isdeleting[video._id]}
            >
              {isdeleting[video._id] ? 'Deleting...' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Video_list;
