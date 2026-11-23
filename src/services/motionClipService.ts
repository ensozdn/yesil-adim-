import type { DisposalMotionProof } from '../types';

export const CLIP_MIN_DURATION_MS = 1400;
export const CLIP_MAX_DURATION_MS = 3000;
export const CLIP_TARGET_WIDTH = 480;
export const CLIP_TARGET_HEIGHT = 360;
export const CLIP_JPEG_QUALITY = 0.6;
export const MIN_LIVE_MOTION_SCORE = 3;

export interface CapturedMotionFrame {
  dataUrl: string;
  lumaSample: Uint8Array;
  sizeBytes: number;
}

const SAMPLE_WIDTH = 32;
const SAMPLE_HEIGHT = 24;

export const isLiveCameraSupported = (): boolean => {
  return Boolean(
    typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
  );
};

export const requestLowResSilentCamera = async (): Promise<MediaStream> => {
  if (!isLiveCameraSupported()) {
    throw new Error('CAMERA_UNSUPPORTED');
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: CLIP_TARGET_WIDTH, max: 640 },
        height: { ideal: CLIP_TARGET_HEIGHT, max: 480 },
        frameRate: { ideal: 15, max: 24 }
      }
    });
  } catch {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: { ideal: CLIP_TARGET_WIDTH },
        height: { ideal: CLIP_TARGET_HEIGHT }
      }
    });
  }
};

export const stopCameraStream = (stream: MediaStream | null): void => {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

export const captureFrameFromVideo = (
  video: HTMLVideoElement
): CapturedMotionFrame | null => {
  if (!video.videoWidth || !video.videoHeight) return null;

  const scale = Math.min(
    CLIP_TARGET_WIDTH / video.videoWidth,
    CLIP_TARGET_HEIGHT / video.videoHeight,
    1
  );
  const width = Math.max(160, Math.round(video.videoWidth * scale));
  const height = Math.max(120, Math.round(video.videoHeight * scale));

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = width;
  frameCanvas.height = height;
  const frameCtx = frameCanvas.getContext('2d');
  if (!frameCtx) return null;

  frameCtx.drawImage(video, 0, 0, width, height);
  const dataUrl = frameCanvas.toDataURL('image/jpeg', CLIP_JPEG_QUALITY);

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = SAMPLE_WIDTH;
  sampleCanvas.height = SAMPLE_HEIGHT;
  const sampleCtx = sampleCanvas.getContext('2d');

  const lumaSample = new Uint8Array(SAMPLE_WIDTH * SAMPLE_HEIGHT);
  if (sampleCtx) {
    sampleCtx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const pixels = sampleCtx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
    for (let i = 0, p = 0; i < lumaSample.length; i += 1, p += 4) {
      lumaSample[i] = Math.round(
        pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114
      );
    }
  }

  const base64Body = dataUrl.split(',')[1] || '';
  const sizeBytes = Math.round((base64Body.length * 3) / 4);

  return {
    dataUrl,
    lumaSample,
    sizeBytes
  };
};

export const computeMotionScore = (samples: Uint8Array[]): number => {
  if (samples.length < 2) return 0;

  let totalDiff = 0;
  let pairCount = 0;

  for (let s = 1; s < samples.length; s += 1) {
    const prev = samples[s - 1];
    const curr = samples[s];
    const len = Math.min(prev.length, curr.length);
    if (len === 0) continue;

    let frameDiff = 0;
    for (let i = 0; i < len; i += 1) {
      frameDiff += Math.abs(curr[i] - prev[i]);
    }
    totalDiff += frameDiff / len;
    pairCount += 1;
  }

  if (pairCount === 0) return 0;
  const avgDiff = totalDiff / pairCount;
  return Math.min(100, Math.round(avgDiff * 2.2));
};

export const buildMotionProof = (
  frames: CapturedMotionFrame[],
  durationMs: number,
  mode: DisposalMotionProof['mode']
): DisposalMotionProof => {
  const totalBytes = frames.reduce((acc, f) => acc + f.sizeBytes, 0);
  const estimatedSizeKb = Math.max(12, Math.round(totalBytes / 1024));
  const motionScore = computeMotionScore(frames.map((f) => f.lumaSample));

  return {
    mode,
    frames: frames.map((f) => f.dataUrl),
    durationMs: Math.round(durationMs),
    estimatedSizeKb,
    motionScore,
    resolutionLabel: '360p',
    isSilent: true
  };
};

const seekVideo = (video: HTMLVideoElement, targetTime: number): Promise<void> => {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    const timer = window.setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    }, 1500);
    video.addEventListener('seeked', () => {
      window.clearTimeout(timer);
      onSeeked();
    });
    try {
      video.currentTime = Math.max(0, targetTime);
    } catch {
      window.clearTimeout(timer);
      resolve();
    }
  });
};

export const extractFramesFromVideoFile = async (
  file: File
): Promise<DisposalMotionProof> => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('VIDEO_LOAD_FAILED'));
      window.setTimeout(() => resolve(), 2500);
    });

    const rawDuration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 2.5;
    const effectiveDuration = Math.min(rawDuration, 3.5);
    const ratios = [0.15, 0.5, 0.85];
    const captured: CapturedMotionFrame[] = [];

    for (const ratio of ratios) {
      await seekVideo(video, effectiveDuration * ratio);
      const frame = captureFrameFromVideo(video);
      if (frame) {
        captured.push(frame);
      }
    }

    if (captured.length === 0) {
      throw new Error('NO_FRAMES_CAPTURED');
    }

    return buildMotionProof(
      captured,
      Math.min(Math.round(rawDuration * 1000), CLIP_MAX_DURATION_MS),
      'device_video_fallback'
    );
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
};

export const generateSimulatedMotionProof = (
  streamLabel: string,
  bagLabel: string,
  streamColor: string,
  durationMs: number
): DisposalMotionProof => {
  const stages = [
    { time: '0.5 sn', subtitle: 'Atık yaklaşıyor', offsetY: 118, alpha: 1 },
    { time: '1.5 sn', subtitle: 'Bölmeye bırakılıyor', offsetY: 186, alpha: 0.92 },
    { time: '2.5 sn', subtitle: 'Kutu içinde · El boş', offsetY: 248, alpha: 0.25 }
  ];

  const frames: string[] = [];
  let totalBytes = 0;

  for (const stage of stages) {
    const canvas = document.createElement('canvas');
    canvas.width = CLIP_TARGET_WIDTH;
    canvas.height = CLIP_TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#102118';
      ctx.fillRect(0, 0, CLIP_TARGET_WIDTH, CLIP_TARGET_HEIGHT);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(24, 22, 174, 34);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`360p · ${stage.time}`, 38, 45);

      ctx.fillStyle = streamColor;
      ctx.beginPath();
      ctx.roundRect(145, 215, 190, 118, 18);
      ctx.fill();

      ctx.fillStyle = '#0d1912';
      ctx.beginPath();
      ctx.roundRect(175, 232, 130, 26, 12);
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = stage.alpha;
      ctx.fillStyle = '#eef7f1';
      ctx.beginPath();
      ctx.roundRect(218, stage.offsetY, 44, 58, 12);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${bagLabel} · ${streamLabel}`, 240, 296);

      ctx.fillStyle = '#b9d8c4';
      ctx.font = '600 15px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(stage.subtitle, 240, 322);
      ctx.textAlign = 'left';
    }

    const dataUrl = canvas.toDataURL('image/jpeg', CLIP_JPEG_QUALITY);
    frames.push(dataUrl);
    const body = dataUrl.split(',')[1] || '';
    totalBytes += Math.round((body.length * 3) / 4);
  }

  return {
    mode: 'simulated_motion_clip',
    frames,
    durationMs: Math.round(durationMs),
    estimatedSizeKb: Math.max(18, Math.round(totalBytes / 1024)),
    motionScore: 44,
    resolutionLabel: '360p',
    isSilent: true
  };
};
