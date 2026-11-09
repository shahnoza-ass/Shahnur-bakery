import React, { useEffect, useState } from 'react';
import '../../styles/install-app.css';

type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone || !window.isSecureContext) return;
    try { if (sessionStorage.getItem('shahnur-install-dismissed')) { setHidden(true); return; } } catch { /* Storage can be disabled. */ }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIos(isIos && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent));
    const available = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
    const installed = () => { setHidden(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', available); window.removeEventListener('appinstalled', installed); };
  }, []);
  const close = () => { setHidden(true); try { sessionStorage.setItem('shahnur-install-dismissed', '1'); } catch { /* Optional. */ } };
  if (hidden || (!prompt && !ios)) return null;
  return <aside className="install-app" aria-label="Shahnur ilovasi"><img src="/icons/icon-192.png" alt="" width="44" height="44" /><div><b>Shahnur doim yoningizda</b><p>{ios ? 'Safari: Ulashish → Bosh ekranga qo‘shish.' : 'Do‘konni telefoningizga ilova sifatida qo‘shing.'}</p>{failed && <p role="status">Brauzer menyusidan “Ilovani o‘rnatish”ni tanlang.</p>}</div>{prompt && <button disabled={busy} onClick={async () => { if (!prompt || busy) return; setBusy(true); try { await prompt.prompt(); const choice = await prompt.userChoice; setPrompt(null); if (choice.outcome === 'accepted') setHidden(true); } catch { setFailed(true); } finally { setBusy(false); } }}>{busy ? '…' : 'O‘rnatish'}</button>}<button className="install-dismiss" onClick={close} aria-label="Yopish">×</button></aside>;
}
