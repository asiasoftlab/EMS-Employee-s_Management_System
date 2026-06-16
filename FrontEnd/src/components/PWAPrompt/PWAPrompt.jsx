import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function PWAPrompt() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later from the Profile page.
      window.deferredPWAInstallPrompt = e;

      // Show custom install alert only once
      const hasPrompted = localStorage.getItem('pwaPromptShown');
      if (!hasPrompted) {
        toast.info(
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Install EMS App</p>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>Install our app for a better mobile experience!</p>
            <button
              onClick={() => {
                window.deferredPWAInstallPrompt.prompt();
                toast.dismiss('pwa-toast');
              }}
              style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '8px', fontWeight: 'bold' }}
            >
              Install Now
            </button>
          </div>,
          { toastId: 'pwa-toast', autoClose: false, closeOnClick: false }
        );
        localStorage.setItem('pwaPromptShown', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
