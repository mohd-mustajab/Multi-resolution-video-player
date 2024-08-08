import React, { useRef, useState, useEffect } from 'react';
import "./main.css";

const resolutions = ['144', '240', '320', '480', '720', '1080'];

const Video_player = ({ filename }) => {
  const videoRef = useRef(null);
  const [currentResolution, setCurrentResolution] = useState('480');
  const [videoUrl, setVideoUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (filename) {
      const url = `https://multi-resolution-video-player-backend.onrender.com/video/${currentResolution}/${filename}`;
      console.log(`Updated video URL: ${url}`);
      setVideoUrl(url);
    }
  }, [filename, currentResolution]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
      videoRef.current.play(); // auto-play after resolution change
    }
  }, [videoUrl]);

  const handleDoubleClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (x < rect.width / 3) {
      videoRef.current.currentTime -= 5;
    } else if (x > rect.width * 2 / 3) {
      videoRef.current.currentTime += 10;
    } else {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleResolutionChange = (event) => {
    setCurrentTime(videoRef.current.currentTime); // Save the current time
    setCurrentResolution(event.target.value); // Change resolution
  };

  const handleMouseDown = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const interval = setInterval(() => {
      if (x < rect.width / 2) {
        videoRef.current.currentTime -= 3;
      } else {
        videoRef.current.currentTime += 2;
      }
    }, 100);

    const handleMouseUp = () => {
      clearInterval(interval);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleVideoError = () => {
    console.error('Error loading video');
  };

  return (
    <div>
      {videoUrl ? (
        <div>
          <video
            ref={videoRef}
            src={videoUrl}
            width="1000"
            height="700"
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onError={handleVideoError}
          />
        </div>
      ) : (
        <div>Loading video...</div>
      )}
      <select onChange={handleResolutionChange} value={currentResolution}>
        {resolutions.map((res) => (
          <option key={res} value={res}>{res}p</option>
        ))}
      </select>
      <div className="rules">
        <ul>
          <li>Double tap in middle to play/pause</li>
          <li>Double tap on right to move 10s forward</li>
          <li>Double tap on left to move 5s backward</li>
          <li>Press and hold on the right side to go forward at 2x speed</li>
          <li>Press and hold on the left side to go back at 3x speed</li>
        </ul>
      </div>
    </div>
  );
};

export default Video_player;
