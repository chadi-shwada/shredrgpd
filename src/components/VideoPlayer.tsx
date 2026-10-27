import { useId } from 'react';
import type { Video } from '../data/videos';
import { useI18n } from '../i18n';
import type { Cue } from '../lib/vtt';

/** Regroupe les répliques consécutives d'une même étape, pour la transcription. */
function groupByStep(cues: readonly Cue[]): { step?: string; lines: string[] }[] {
  const groups: { step?: string; lines: string[] }[] = [];
  for (const cue of cues) {
    const last = groups.at(-1);
    if (last && cue.step && last.step === cue.step) last.lines.push(cue.text);
    else groups.push({ step: cue.step, lines: [cue.text] });
  }
  return groups;
}

/**
 * Vidéo hébergée sur le site (aucun lecteur tiers). Rien n'est chargé avant
 * la lecture (preload="none"), pas de lecture automatique. Vidéo muette :
 * sous-titres disponibles dans le lecteur et transcription complète dessous.
 */
export function VideoPlayer({ video }: { video: Video }) {
  const titleId = useId();
  const { t } = useI18n();
  return (
    <figure className="video" aria-labelledby={titleId}>
      <video controls preload="none" playsInline poster={video.poster} aria-labelledby={titleId}>
        <source src={video.src} type="video/mp4" />
        <VideoTrack video={video} />
        <a href={video.src}>{t('Télécharger la vidéo', 'Download the video')}</a>
      </video>
      <figcaption>
        <span className="video__title" id={titleId}>
          {video.title}
        </span>
        <span className="video__meta">
          {video.duration} · {t('sans son', 'no sound')}
          {video.lang === 'en' && ' · on-screen text in French, English subtitles'}
        </span>
        <VideoTranscript video={video} />
      </figcaption>
    </figure>
  );
}

/** Transcription repliable sous une vidéo. */
export function VideoTranscript({ video }: { video: Video }) {
  const { t } = useI18n();
  return (
    <details className="video__transcript">
      <summary>{t('Lire la transcription', 'Read the transcript')}</summary>
      {groupByStep(video.cues).map((group, i) =>
        group.step ? (
          <div key={i}>
            <h3>{group.step}</h3>
            {group.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          group.lines.map((line) => <p key={line}>{line}</p>)
        ),
      )}
    </details>
  );
}

/**
 * Sous-titres de la vidéo. En anglais, affichés d'office : le texte incrusté à l'image est en
 * français, les sous-titres le traduisent.
 */
export function VideoTrack({ video }: { video: Video }) {
  return (
    <track
      kind="captions"
      src={video.captions}
      srcLang={video.lang}
      label={video.lang === 'en' ? 'English' : 'Français'}
      default={video.lang === 'en'}
    />
  );
}
