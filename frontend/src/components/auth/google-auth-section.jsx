'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mergeGuestCommerceAfterAuthentication } from '@/features/commerce/merge-guest-commerce';
import { getPathname } from '@/i18n/navigation';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

async function requestGoogleNonce(locale) {
  const response = await fetch('/api/auth/google-nonce', {
    headers: { 'Accept-Language': locale },
    cache: 'no-store',
  });
  const payload = await response.json();

  if (!response.ok || !payload.data?.nonce) {
    throw new Error(payload.message || 'Google nonce unavailable');
  }

  return payload.data.nonce;
}

export default function GoogleAuthSection({
  locale = 'tr',
  mode = 'login',
  onSuccess,
  redirectOnSuccess = true,
  redirectTo,
}) {
  const router = useRouter();
  const buttonRef = useRef(null);
  const renderedWidthRef = useRef(0);
  const [scriptReady, setScriptReady] = useState(false);
  const [nonce, setNonce] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const tr = locale === 'tr';

  const loadNonce = useCallback(async () => {
    if (!googleClientId) return;

    try {
      const nextNonce = await requestGoogleNonce(locale);
      setErrorMessage('');
      setNonce(nextNonce);
    } catch {
      setErrorMessage(
        tr
          ? 'Google ile giriş şu anda kullanılamıyor.'
          : 'Google sign-in is currently unavailable.',
      );
    }
  }, [locale, tr]);

  useEffect(() => {
    if (!googleClientId) return undefined;
    let active = true;

    requestGoogleNonce(locale)
      .then((nextNonce) => {
        if (!active) return;
        setErrorMessage('');
        setNonce(nextNonce);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage(
          tr
            ? 'Google ile giriş şu anda kullanılamıyor.'
            : 'Google sign-in is currently unavailable.',
        );
      });

    return () => {
      active = false;
    };
  }, [locale, tr]);

  const handleCredential = useCallback(async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setErrorMessage(tr ? 'Google girişi tamamlanamadı.' : 'Google sign-in could not be completed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || (tr ? 'Google girişi tamamlanamadı.' : 'Google sign-in could not be completed.'));
      }

      onSuccess?.(payload.data?.user || null);
      void mergeGuestCommerceAfterAuthentication();
      if (redirectOnSuccess) {
        router.push(redirectTo || getPathname({ href: '/account', locale }));
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(error.message);
      setNonce('');
      await loadNonce();
    } finally {
      setIsSubmitting(false);
    }
  }, [loadNonce, locale, onSuccess, redirectOnSuccess, redirectTo, router, tr]);

  useEffect(() => {
    const buttonElement = buttonRef.current;
    const googleIdentity = window.google?.accounts?.id;

    if (!googleClientId || !scriptReady || !nonce || !buttonElement || !googleIdentity) {
      return undefined;
    }

    googleIdentity.initialize({
      client_id: googleClientId,
      callback: handleCredential,
      nonce,
      ux_mode: 'popup',
      context: mode === 'register' ? 'signup' : 'signin',
    });

    const renderButton = () => {
      const availableWidth = Math.floor(buttonElement.getBoundingClientRect().width);
      const buttonWidth = Math.min(400, availableWidth);

      if (buttonWidth < 1 || buttonWidth === renderedWidthRef.current) return;
      renderedWidthRef.current = buttonWidth;
      buttonElement.replaceChildren();
      googleIdentity.renderButton(buttonElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'register' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: String(buttonWidth),
        locale,
      });
    };

    renderedWidthRef.current = 0;
    renderButton();
    const resizeObserver = new ResizeObserver(renderButton);
    resizeObserver.observe(buttonElement);

    return () => resizeObserver.disconnect();
  }, [handleCredential, locale, mode, nonce, scriptReady]);

  if (!googleClientId) return null;

  return (
    <div className="mb-6 space-y-5">
      <Script
        id="google-identity-services"
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setErrorMessage(tr ? 'Google bağlantısı yüklenemedi.' : 'Google sign-in could not be loaded.')}
      />
      <div className={isSubmitting ? 'pointer-events-none opacity-60' : undefined} aria-busy={isSubmitting}>
        <div ref={buttonRef} className="flex min-h-11 w-full justify-center" />
      </div>
      {isSubmitting ? (
        <p className="text-center text-sm text-muted-foreground" role="status">
          {tr ? 'Google hesabın doğrulanıyor…' : 'Verifying your Google account…'}
        </p>
      ) : null}
      {errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          {tr ? 'veya e-posta ile' : 'or continue with email'}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
