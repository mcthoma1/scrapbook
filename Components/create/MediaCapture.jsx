
import React, { useState, useRef } from "react";
import { Camera, Upload, Mic, Square } from "lucide-react";

export default function MediaCapture({ onCapture, loading }) {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef(null);
  const recordingInterval = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      onCapture(file, 'photo');
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let mediaType = 'photo'; // default
    if (file.type.startsWith('image/')) {
      mediaType = 'photo';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.type.startsWith('audio/')) {
      mediaType = 'voice';
    }
    
    onCapture(file, mediaType);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        onCapture(file, 'voice');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
      setRecordingTime(0);

      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-coral-100 rounded-full mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
        <p className="text-gray-600 font-medium">Processing your memory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Capture your memory
        </h2>
        <p className="text-sage-400">
          Take a photo, upload a file, or record a voice note
        </p>
      </div>

      {/* Camera Interface */}
      {!cameraActive ? (
        <div className="grid gap-4">
          <button
            onClick={startCamera}
            className="bg-white p-6 rounded-2xl border border-coral-100 hover:border-coral-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-coral-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Take Photo</h3>
                <p className="text-sage-400 text-sm">Use your camera to capture the moment</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white p-6 rounded-2xl border border-coral-100 hover:border-coral-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-sage-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Upload File</h3>
                <p className="text-sage-400 text-sm">Choose a photo, video, or audio file</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </button>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`p-6 rounded-2xl border transition-all duration-200 transform hover:scale-105 ${
              recording
                ? "bg-red-50 border-red-300 hover:border-red-400"
                : "bg-white border-coral-100 hover:border-coral-300 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                recording ? "bg-red-100" : "bg-purple-100"
              }`}>
                {recording ? (
                  <Square className="w-6 h-6 text-red-500" />
                ) : (
                  <Mic className="w-6 h-6 text-purple-500" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {recording ? `Recording... ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}` : "Record Voice Note"}
                </h3>
                <p className="text-sage-400 text-sm">
                  {recording ? "Tap to stop recording" : "Share your thoughts with voice"}
                </p>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-square bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={stopCamera}
              className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              className="flex-1 bg-gradient-to-r from-coral-400 to-rose-400 text-white py-3 rounded-xl font-medium shadow-lg"
            >
              <Camera className="w-5 h-5 mx-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
