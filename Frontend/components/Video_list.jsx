import React from 'react';

const Video_list = ({ videos, onVideoSelect, onDelete ,isdeleting}) => {
  return (
    <div>
      <h2>Uploaded Videos</h2>
      <ul>
        {videos.map((video) => (
          <li key={video._id}>
            <span onClick={() => onVideoSelect(video.filename)}>{video.filename}</span>
            <button onClick={() => onDelete(video._id)}  disabled={isdeleting}> {isdeleting ? 'Deleting...' : 'Delete'}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Video_list;
