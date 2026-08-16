import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, FastForward } from 'lucide-react';
import { useToast } from './Toast';

export default function AudioPlayer({ title, content }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speechSupported, setSpeechSupported] = useState(true);
  const utteranceRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const prepareText = () => {
    // Strip markdown formatting symbols for clean audio speech
    const cleanText = (title + '. ' + content)
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted for audio narration.')
      .replace(/[#*`_>\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleanText;
  };

  const handlePlayPause = () => {
    if (!('speechSynthesis' in window)) {
      addToast('Audio narration is not supported by your browser', 'error');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        window.speechSynthesis.cancel();
        const text = prepareText();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = playbackRate;
        utterance.pitch = 1;

        utterance.onend = () => {
          setIsPlaying(false);
          addToast('Finished audio narration', 'info');
        };

        utterance.onerror = (e) => {
          console.error('Speech synthesis error:', e);
          setIsPlaying(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        addToast('Playing audio article narration', 'info');
      }
    }
  };

  const handleRestart = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setTimeout(() => {
      handlePlayPause();
    }, 100);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);

    if (isPlaying && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = prepareText();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = nextRate;
      utterance.onend = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="audio-player-card">
      <button 
        className="audio-play-btn" 
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pause narration' : 'Listen to article'}
      >
        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: '2px' }} />}
      </button>

      <div className="audio-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={16} color="var(--accent-primary)" />
          <span className="audio-title">Listen to Article (Audio Narration)</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {isPlaying ? 'Speaking article with natural synthesis...' : 'AI Text-to-Speech narration with custom playback speed'}
        </p>
      </div>

      <div className="audio-controls">
        <button 
          className="speed-select-btn"
          onClick={cycleSpeed}
          title="Change playback speed"
        >
          {playbackRate}x
        </button>

        <button 
          className="btn-icon" 
          style={{ width: '32px', height: '32px' }}
          onClick={handleRestart}
          title="Restart audio"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
