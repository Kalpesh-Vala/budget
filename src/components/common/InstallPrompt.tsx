'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { Alert } from './Alert';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installError, setInstallError] = useState('');

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setInstallError('Installation is not available on your device');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('Installation error:', err);
      setInstallError('Installation failed. Please try again.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show anything if app is installed or prompt is not available
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        {installError && (
          <Alert
            type="error"
            message={installError}
            onClose={() => setInstallError('')}
          />
        )}

        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Install Budget Tracker
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Install the app on your device to access it anytime, offline and like a native app.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstallBanner() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setCanInstall(false);
    } catch (err) {
      console.error('Installation failed:', err);
    }
  };

  if (!canInstall || isInstalled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium">
          Get the best experience by installing Budget Tracker as an app
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstall}
          className="bg-white text-blue-600 hover:bg-gray-100"
        >
          Install App
        </Button>
      </div>
    </div>
  );
}
