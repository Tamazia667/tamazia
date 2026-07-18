import React, { useState, useEffect } from 'react';
import { ChangelogEntry } from '../types';

const AboutPage: React.FC = () => {
  const [version, setVersion] = useState<string>('...');
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer la version en temps réel
    window.electronAPI.getVersion().then((v) => {
      setVersion(v);
    }).catch(() => setVersion('1.2.0'));

    // Récupérer le changelog
    window.electronAPI.getChangelog().then((cl) => {
      setChangelog(cl);
      if (cl.length > 0) setExpanded(cl[0].version);
    }).catch(() => setChangelog([]));
  }, []);

  return (
    <div className="page about-page">
      {/* En-tête avec logo */}
      <div className="about-hero">
        <div className="about-logo-container">
          <img
            src="../../assets/icon.png"
            alt="Tamazia Logo"
            className="about-logo-img"
            onError={(e) => {
              // Fallback si l'image ne charge pas
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="about-logo-fallback">
            <svg viewBox="0 0 24 24" width="36" height="36" stroke="white" strokeWidth="2" fill="none">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
            </svg>
          </div>
        </div>
        <div className="about-hero-info">
          <h1 className="about-app-name">Tamazia</h1>
          <div className="about-version-badge">
            <span className="version-dot"></span>
            <span>v{version}</span>
          </div>
          <p className="about-tagline">Moniteur iPhone en temps réel — Linux</p>
        </div>
      </div>

      {/* Infos techniques */}
      <div className="about-meta-grid">
        <div className="meta-item">
          <span className="meta-label">Auteur</span>
          <span className="meta-val">Hamza_ltc</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Plateforme</span>
          <span className="meta-val">Linux (Ubuntu)</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Framework</span>
          <span className="meta-val">Electron + React + TypeScript</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Licence</span>
          <span className="meta-val">MIT</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Notifications</span>
          <span className="meta-val">Linux (libnotify)</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Detection USB</span>
          <span className="meta-val">libimobiledevice</span>
        </div>
      </div>

      {/* Section Changelog */}
      <div className="changelog-section">
        <div className="changelog-header">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--accent)" strokeWidth="2.2" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Historique des versions (Changelog)</span>
        </div>

        <div className="changelog-list">
          {changelog.length === 0 ? (
            <div className="changelog-empty">Chargement du changelog...</div>
          ) : (
            changelog.map((entry, idx) => (
              <div
                key={entry.version}
                className={`changelog-entry ${expanded === entry.version ? 'open' : ''} ${idx === 0 ? 'latest' : ''}`}
              >
                <button
                  className="changelog-toggle"
                  onClick={() => setExpanded(expanded === entry.version ? null : entry.version)}
                >
                  <div className="changelog-version-line">
                    {idx === 0 && <span className="latest-badge">LATEST</span>}
                    <span className="cl-version">v{entry.version}</span>
                    <span className="cl-date">{entry.date}</span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    style={{
                      transform: expanded === entry.version ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {expanded === entry.version && (
                  <ul className="changelog-changes">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="changelog-change-item">
                        {change}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Liens */}
      <div className="about-links">
        <button
          className="btn btn-outline"
          onClick={() => window.open('https://github.com/hamza-ltc', '_blank')}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          GitHub
        </button>
      </div>

      <p className="about-footer-text">© 2026 Hamza_ltc — Tous droits réservés</p>
    </div>
  );
};

export default AboutPage;