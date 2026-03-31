import { useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const TIME_OPTIONS = ['Golden hour', 'Midday', 'Blue hour', 'Night', 'Overcast', 'Sunrise'];
const SEASON_OPTIONS = ['Summer', 'Autumn', 'Winter', 'Spring'];

export default function Home() {
  const [location, setLocation] = useState('');
  const [altitude, setAltitude] = useState(150);
  const [timeOfDay, setTimeOfDay] = useState('Golden hour');
  const [season, setSeason] = useState('Summer');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const inputRef = useRef(null);

  async function generate() {
    if (!location.trim()) {
      setError('Enter a location to fly over.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setImgLoaded(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, altitude, timeOfDay, season }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Drone Vision</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>DRONE VISION</div>
            <p className={styles.headerTag}>AI Aerial Photography</p>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.hero}>
            <p className={styles.eyebrow}>SEE THE WORLD FROM ABOVE</p>
            <h1 className={styles.headline}>
              <span>Any location.</span>
              <span className={styles.accentLine}>Any altitude.</span>
            </h1>
            <p className={styles.subhead}>
              Type an address, city, or coordinates and we'll generate a cinematic aerial shot powered by AI.
            </p>
          </div>

          <div className={styles.controls}>
            <div className={styles.inputRow}>
              <div className={styles.inputWrap}>
                <input
                  ref={inputRef}
                  className={styles.input}
                  type="text"
                  placeholder="Paris, France — Eiffel Tower — 48.8566, 2.3522"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generate()}
                />
              </div>
              <button className={styles.generateBtn} onClick={generate} disabled={loading}>
                {loading ? <span className={styles.loadingInner}><span className={styles.spinner} />Flying...</span> : 'Generate'}
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.settingsRow}>
              <div>
                <label className={styles.settingLabel}>
                  Altitude <span className={styles.sliderVal}>{altitude}m</span>
                </label>
                <input className={styles.slider} type="range" min="50" max="500" step="10"
                  value={altitude} onChange={e => setAltitude(Number(e.target.value))} />
                <div className={styles.sliderTicks}><span>50m</span><span>500m</span></div>
              </div>
              <div>
                <label className={styles.settingLabel}>Time of day</label>
                <div className={styles.pills}>
                  {TIME_OPTIONS.map(t => (
                    <button key={t} className={`${styles.pill} ${timeOfDay === t ? styles.pillActive : ''}`} onClick={() => setTimeOfDay(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={styles.settingLabel}>Season</label>
                <div className={styles.pills}>
                  {SEASON_OPTIONS.map(s => (
                    <button key={s} className={`${styles.pill} ${season === s ? styles.pillActive : ''}`} onClick={() => setSeason(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {(loading || result) && (
            <div className={styles.resultSection}>
              <div className={styles.imageCard}>
                {loading && !result && (
                  <div className={styles.imagePlaceholder}>
                    <div className={styles.scanLines} />
                    <div className={styles.loadingState}>
                      <div className={styles.radarRing} />
                      <p className={styles.loadingText}>Positioning drone over {location}...</p>
                    </div>
                  </div>
                )}
                {result && (
                  <>
                    {!imgLoaded && (
                      <div className={styles.imagePlaceholder}>
                        <div className={styles.scanLines} />
                        <div className={styles.loadingState}>
                          <div className={styles.radarRing} />
                          <p className={styles.loadingText}>Rendering image...</p>
                        </div>
                      </div>
                    )}
                    <div className={`${styles.imageWrap} ${imgLoaded ? styles.imageVisible : ''}`}>
                      <img src={result.imageUrl} alt={`Drone photo of ${location}`}
                        className={styles.droneImage} onLoad={() => setImgLoaded(true)} />
                      <div className={styles.imageOverlay}>
                        <div className={`${styles.overlayCorner} ${styles.cornerTL}`} />
                        <div className={`${styles.overlayCorner} ${styles.cornerTR}`} />
                        <div className={`${styles.overlayCorner} ${styles.cornerBL}`} />
                        <div className={`${styles.overlayCorner} ${styles.cornerBR}`} />
                        <div className={styles.hudTop}>
                          <span className={styles.hudLabel}>ALT {altitude}M</span>
                          <span className={styles.hudLabel}>{timeOfDay.toUpperCase()}</span>
                          <span className={styles.hudLabel}>{season.toUpperCase()}</span>
                        </div>
                        <div className={styles.hudBottom}>
                          <span className={styles.hudLocation}>{location.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <p className={styles.description}>{result.description}</p>
                      <div className={styles.tagsRow}>
                        {result.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>

        <footer className={styles.footer}>
          <p>Images by Pollinations.ai · Prompts by Claude · Built with Next.js</p>
        </footer>
      </div>
    </>
  );
}
