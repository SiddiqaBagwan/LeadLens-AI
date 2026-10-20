import React, { useRef, useState } from 'react';
import { Volume2, MicOff, Play, Pause } from 'lucide-react';

export default function AudioPlayer({ audioUrl, durationFormatted, callId }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTogglePlay = () => {
    if (!audioUrl || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatSec = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // If no recording exists yet, display strict honest empty state per requirements
  if (!audioUrl) {
    return (
      <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100/60 flex items-center justify-center mx-auto mb-3 text-indigo-500">
          <MicOff className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">Recording will be available soon.</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          The audio file for <span className="font-medium text-slate-700">{callId || 'this call'}</span> is scheduled for addition in Phase 2. The HTML5 audio player will automatically activate once linked.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Estimated Call Duration: {durationFormatted || 'N/A'}
        </div>
      </div>
    );
  }

  // Active HTML5 Player when audioUrl is provided
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleTogglePlay}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-xs"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-500 mb-1 font-mono">
            <span>{formatSec(currentTime)}</span>
            <span>{formatSec(duration || 0)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentTime(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div className="text-slate-400">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
