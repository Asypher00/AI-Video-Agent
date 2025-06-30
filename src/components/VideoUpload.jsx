// src/components/VideoUpload.jsx
import React from 'react';
import { Upload, Play, CheckCircle } from 'lucide-react';

function VideoUpload({ video, handleVideoUpload, extractedFrames }) {
  return (
    <section className="bg-blue-50 p-6 rounded-2xl shadow-inner border border-blue-200">
      <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        <Upload className="w-6 h-6" /> Upload Video
      </h2>
      <label
        htmlFor="video-upload"
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-400 rounded-xl cursor-pointer bg-blue-100 hover:bg-blue-200 transition duration-200 ease-in-out"
      >
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
        />
        <Play className="w-10 h-10 text-blue-600 mb-3" />
        <p className="text-blue-700 font-semibold">
          Drag & Drop or Click to Upload Video
        </p>
        <p className="text-blue-500 text-sm mt-1">MP4, MOV, AVI, etc.</p>
      </label>
      {video && (
        <div className="mt-4 p-4 bg-blue-100 rounded-lg flex items-center justify-between text-blue-800">
          <span>Selected Video: {video.name}</span>
          <CheckCircle className="text-green-500 w-5 h-5" />
        </div>
      )}
      {extractedFrames.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Extracted Frames Preview ({extractedFrames.length} frames)
          </h3>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-blue-300 rounded-lg p-2 bg-blue-50">
            {extractedFrames.map((frame, index) => (
              <img
                key={index}
                src={frame.dataUrl}
                alt={`Frame ${frame.frameNumber}`}
                className="w-20 h-auto rounded-md object-cover shadow-sm border border-blue-200"
                title={`Frame ${frame.frameNumber} at ${frame.timestamp.toFixed(1)}s`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default VideoUpload;