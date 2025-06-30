// src/components/ReferenceImageUpload.jsx
import React from 'react';
import { Upload, XCircle } from 'lucide-react';

function ReferenceImageUpload({ referenceImages, handleImageUpload, removeReferenceImage }) {
  return (
    <section className="bg-purple-50 p-6 rounded-2xl shadow-inner border border-purple-200">
      <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
        <Upload className="w-6 h-6" /> Upload Reference Images
      </h2>
      <label
        htmlFor="image-upload"
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-400 rounded-xl cursor-pointer bg-purple-100 hover:bg-purple-200 transition duration-200 ease-in-out"
      >
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <img src="/placeholder-image.svg" alt="placeholder" className="w-10 h-10 text-purple-600 mb-3" /> {/* Assuming you have a placeholder image */}
        <p className="text-purple-700 font-semibold">
          Drag & Drop or Click to Upload Images
        </p>
        <p className="text-purple-500 text-sm mt-1">PNG, JPG, JPEG, GIF</p>
      </label>
      {referenceImages.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">
            Selected Reference Images ({referenceImages.length})
          </h3>
          <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto border border-purple-300 rounded-lg p-3 bg-purple-50">
            {referenceImages.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-24 h-24 object-cover rounded-md shadow-sm border border-purple-200"
                />
                <button
                  onClick={() => removeReferenceImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs leading-none hover:bg-red-600 transition"
                  aria-label="Remove image"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default ReferenceImageUpload;