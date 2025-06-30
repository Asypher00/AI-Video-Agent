// src/components/HiddenCanvasAndVideo.jsx
import React from 'react';

function HiddenCanvasAndVideo({ videoRef, canvasRef }) {
  return (
    <>
      <video ref={videoRef} className="hidden"></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </>
  );
}

export default HiddenCanvasAndVideo;