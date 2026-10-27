import { useEffect, useRef, useState } from 'react';
import type { Video } from '../data/videos';
import { useI18n } from '../i18n';
import { Icon } from './Icon';
import { VideoTrack, VideoTranscript } from './VideoPlayer';

/** Lecture automatique seulement si la personne n'a demandé ni moins d'animations ni moins de données. */
function canAutoplay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData;
}

/**
 * Vidéo de présentation mise en avant : muette, en boucle, lancée seule quand
 * elle devient visible et mise en pause hors de l'écran (rien n'est téléchargé
 * avant). Bouton pause toujours présent (WCAG 2.2.2). Pas de lecture
 * automatique si prefers-reduced-motion ou mode économie de données : la
 * personne lance la vidéo elle-même.
 */
export function ShowcaseVideo({ video }: { video: Video }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { t } = useI18n();
  const [auto] = useState(canAutoplay);
  /** Choix de la personne : une pause manuelle n'est pas annulée par le défilement. */
  const [wantsPlay, setWantsPlay] = useState(auto);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!wantsPlay) {
      el.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => setWantsPlay(false));
        else el.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [wantsPlay]);

  return (
    <figure className="showcase-video">
      <div className="showcase-video__frame">
        <video
          ref={ref}
          className="showcase-video__media"
          muted
          loop
          playsInline
          preload="none"
          poster={video.poster}
          aria-label={t(
            `${video.title} (vidéo sans son, ${video.duration})`,
            `${video.title} (video without sound, ${video.duration})`,
          )}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={video.src} type="video/mp4" />
          <VideoTrack video={video} />
        </video>
        <button
          type="button"
          className="showcase-video__toggle"
          aria-label={playing ? t('Mettre la vidéo en pause', 'Pause the video') : t('Lire la vidéo', 'Play the video')}
          onClick={() => setWantsPlay(!playing)}
        >
          <Icon name={playing ? 'pause' : 'play'} size={18} />
        </button>
      </div>
      <figcaption>
        <span className="video__title">{video.title}</span>
        <span className="video__meta">
          {video.duration} · {t('sans son · en boucle', 'no sound · looping')}
          {video.lang === 'en' && ' · on-screen text in French, English subtitles'}
        </span>
        <VideoTranscript video={video} />
      </figcaption>
    </figure>
  );
}
