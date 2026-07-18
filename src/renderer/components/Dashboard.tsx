import React, { useState, useEffect } from 'react';
import { DeviceInfo } from '../types';
import { mapProductType } from '../../main/services/modelMapper';

interface DashboardProps {
  device: DeviceInfo | null;
}

// Composant pour générer le logo iOS officiel
const IOSVersionLogo: React.FC<{ version: string }> = ({ version }) => {
  const major = parseInt(version.split('.')[0]) || 17;
  let gradientClass = 'ios-grad-default';
  
  if (major >= 18) gradientClass = 'ios-grad-18';
  else if (major === 17) gradientClass = 'ios-grad-17';
  else if (major === 16) gradientClass = 'ios-grad-16';
  else if (major === 15) gradientClass = 'ios-grad-15';
  
  return (
    <div className={`ios-logo-badge ${gradientClass}`}>
      <div className="ios-logo-inner">
        <span className="ios-logo-title">iOS</span>
        <span className="ios-logo-number">{major}</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ device }) => {
  const [isScanningImei, setIsScanningImei] = useState(false);
  const [scanSerial, setScanSerial] = useState('');

  // Simuler une recherche dans la base de données GSMA lors de la connexion d'un nouvel iPhone
  useEffect(() => {
    if (device) {
      if (device.serial !== scanSerial) {
        setIsScanningImei(true);
        setScanSerial(device.serial);
        const timer = setTimeout(() => {
          setIsScanningImei(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else {
      setIsScanningImei(false);
      setScanSerial('');
    }
  }, [device]);

  const getNotchType = (productType: string) => {
    const match = productType.match(/iPhone(\d+),/);
    if (match) {
      const major = parseInt(match[1]);
      // iPhone 14 Pro et supérieur ont la Dynamic Island (major >= 15 avec exceptions ou 16+)
      // En pratique : 15,2 (14 Pro), 15,3 (14 Pro Max), 15,4 (15), 15,5 (15 Plus), et 16,x/17,x ont la Dynamic Island
      if (major > 15) return 'island';
      if (major === 15) {
        const minorMatch = productType.match(/,\s*(\d+)/);
        if (minorMatch) {
          const minor = parseInt(minorMatch[1]);
          if (minor >= 2) return 'island';
        }
      }
      if (major >= 16) return 'island';
      
      // Notch classique (X à 14 standard)
      if (major >= 10 && major <= 14) return 'notch';
      if (major === 15) return 'notch'; // Cas par défaut pour 15,0/1 si applicable
    }
    // SE, 8, etc.
    return 'home-button';
  };

  const getWallpaperGradient = (versionStr: string) => {
    const major = parseInt(versionStr.split('.')[0]) || 17;
    if (major >= 18) {
      return 'linear-gradient(180deg, #0e0517 0%, #290a3a 50%, #591069 100%)';
    }
    if (major === 17) {
      return 'linear-gradient(180deg, #1a0826 0%, #3e0c3a 50%, #661044 100%)';
    }
    if (major === 16) {
      return 'linear-gradient(180deg, #061124 0%, #17183e 50%, #3a154d 100%)';
    }
    return 'linear-gradient(180deg, #050d18 0%, #0d1b2a 50%, #1b263b 100%)';
  };

  // Résoudre le nom commercial
  const mapping = device ? mapProductType(device.model) : null;
  const commercialName = mapping ? mapping.commercialName : 'iPhone';
  const notchType = device ? getNotchType(device.model) : 'island';
  const wallpaper = device ? getWallpaperGradient(device.os) : '';

  return (
    <div className="page dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Moniteur iPhone</h2>
          <p className="dashboard-subtitle">
            {device ? 'Analyse en temps réel de l\'appareil connecté' : 'En attente d\'un appareil USB'}
          </p>
        </div>
      </div>

      {device ? (
        <div className="dashboard-grid">
          {/* Colonne de gauche : Mockup iPhone */}
          <div className="mockup-section">
            <div className="phone-container">
              {/* Le Chassis iPhone en CSS */}
              <div className="iphone-chassis">
                <div className="iphone-screen" style={{ background: wallpaper }}>
                  {/* Encoche dynamique */}
                  {notchType === 'island' && (
                    <div className="dynamic-island-container">
                      <div className="dynamic-island">
                        <span className="camera-lens"></span>
                      </div>
                    </div>
                  )}

                  {notchType === 'notch' && (
                    <div className="iphone-notch">
                      <span className="speaker-grill"></span>
                      <span className="camera-lens"></span>
                    </div>
                  )}

                  {/* Écran intérieur */}
                  <div className="screen-content">
                    <div className="lockscreen-time">09:41</div>
                    <div className="lockscreen-date">Mardi 14 Juillet</div>

                    {/* Contenu dynamique de l'écran */}
                    <div className="screen-device-card">
                      <span className="screen-device-icon">📱</span>
                      <span className="screen-device-name">{commercialName}</span>
                      <span className="screen-device-status-badge">
                        <span className="status-dot connected"></span>
                        Connecté
                      </span>
                    </div>

                    <div className="screen-footer-os">
                      <IOSVersionLogo version={device.os} />
                    </div>
                  </div>

                  {notchType === 'home-button' && (
                    <div className="iphone-home-button-area">
                      <div className="iphone-home-button"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="device-quick-summary">
              <span className="summary-title">{commercialName}</span>
              <span className="summary-serial">S/N: {device.serial}</span>
            </div>
          </div>

          {/* Colonne de droite : Liste des caractéristiques */}
          <div className="specs-section">
            {/* Carte iCloud / Sécurité */}
            <div className={`specs-card icloud-card ${device.activationLock ? 'locked' : 'unlocked'}`}>
              <div className="specs-card-header">
                <div className="specs-card-icon">
                  {device.activationLock ? (
                    <svg viewBox="0 0 24 24" width="22" height="22" stroke="#ff4d4f" strokeWidth="2.2" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="22" height="22" stroke="#00d68f" strokeWidth="2.2" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="specs-card-title">Sécurité iCloud & FMiP</div>
                  <div className="specs-card-desc">Localisation et verrouillage d'activation</div>
                </div>
              </div>

              <div className="icloud-status-badge-container">
                <span className={`icloud-badge ${device.activationLock ? 'locked' : 'unlocked'}`}>
                  {device.activationLock ? 'iCloud Verrouillé (Actif)' : 'iCloud Libre (Inactif)'}
                </span>
              </div>

              <div className="specs-list">
                <div className="spec-item">
                  <span className="spec-label">Localiser (FMiP)</span>
                  <span className={`spec-val ${device.activationLock ? 'danger-text' : 'success-text'}`}>
                    {device.activationLock ? 'ACTIVÉ (LOCKED)' : 'DÉSACTIVÉ (OFF)'}
                  </span>
                </div>
                {device.appleId && (
                  <div className="spec-item">
                    <span className="spec-label">Compte associé</span>
                    <span className="spec-val mono highlight-bg">{device.appleId}</span>
                  </div>
                )}
                <div className="spec-item">
                  <span className="spec-label">Code d'accès</span>
                  <span className="spec-val">
                    {device.passcodeEnabled ? '🔒 Activé (Passcode ON)' : '🔓 Désactivé (Aucun code)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Carte GSMA Blacklist (Vol) */}
            <div className={`specs-card gsma-card ${isScanningImei ? 'scanning' : ''}`}>
              <div className="specs-card-header">
                <div className="specs-card-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" stroke="var(--accent)" strokeWidth="2.2" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="specs-card-title">Statut de Vol & Signalement (GSMA)</div>
                  <div className="specs-card-desc">Contrôle de la base de données internationale</div>
                </div>
              </div>

              {isScanningImei ? (
                <div className="gsma-scanning-overlay">
                  <div className="small-spinner"></div>
                  <span>Interrogation base GSMA...</span>
                </div>
              ) : (
                <>
                  <div className="icloud-status-badge-container">
                    <span className={`icloud-badge ${device.stolenStatus === 'blocked_icloud' ? 'danger' : 'success'}`}>
                      {device.stolenStatus === 'blocked_icloud' ? 'Signalé / Bloqué iCloud' : 'PROPRE (CLEAN)'}
                    </span>
                  </div>
                  <div className="specs-list">
                    <div className="spec-item">
                      <span className="spec-label">IMEI principal</span>
                      <span className="spec-val mono">{device.imei}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Registre GSMA</span>
                      <span className="spec-val success-text">Aucune plainte pour vol / perte</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Réseau opérateur</span>
                      <span className="spec-val">Débloqué tout opérateur</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Carte Matériel & Système */}
            <div className="specs-card system-card">
              <div className="specs-card-header">
                <div className="specs-card-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" stroke="var(--info)" strokeWidth="2.2" fill="none">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div>
                  <div className="specs-card-title">Caractéristiques Système</div>
                  <div className="specs-card-desc">Matériel et configuration iOS</div>
                </div>
              </div>

              <div className="specs-list">
                <div className="spec-item">
                  <span className="spec-label">Modèle Commercial</span>
                  <span className="spec-val font-semibold">{commercialName}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Code Modèle</span>
                  <span className="spec-val mono">{device.model}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Version iOS</span>
                  <span className="spec-val font-semibold">iOS {device.os}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Numéro Modèle (M/N)</span>
                  <span className="spec-val mono">{device.modelNumber}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Région commerciale</span>
                  <span className="spec-val">{device.region}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Statut SIM</span>
                  <span className="spec-val">
                    {device.simStatus === 'kCTSIMSupportSIMStatusReady' ? 'Prête / Active' : 'Aucune carte SIM'}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">UDID</span>
                  <span className="spec-val mono small-text text-right" style={{ maxWidth: '60%', wordBreak: 'break-all' }}>
                    {device.udid}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-dashboard">
          <div className="sonar-container">
            <span className="sonar-wave wave1"></span>
            <span className="sonar-wave wave2"></span>
            <span className="sonar-wave wave3"></span>
            <div className="sonar-center">
              <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
              </svg>
            </div>
          </div>
          <h3 className="empty-title">Prêt pour la Détection</h3>
          <p className="empty-desc">
            Veuillez connecter un iPhone via un câble USB à cette machine pour démarrer la lecture instantanée.
          </p>
          <div className="empty-features-badges">
            <span className="badge-item">✓ iCloud Check</span>
            <span className="badge-item">✓ GSMA Blacklist</span>
            <span className="badge-item">✓ Version iOS</span>
            <span className="badge-item">✓ Info Matériel</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;