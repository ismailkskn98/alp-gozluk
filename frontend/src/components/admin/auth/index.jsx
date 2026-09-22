'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CredentialsForm from './credentials-form';
import RecoveryCodes from './recovery-codes';
import TwoFactorForm from './two-factor-form';

export default function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState('credentials');
  const [setup, setSetup] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [serverError, setServerError] = useState('');

  async function parseResponse(response) {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'İşlem tamamlanamadı.');
    return payload;
  }

  async function submitCredentials(values) {
    setServerError('');
    try {
      const payload = await parseResponse(await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, loginContext: 'admin' }),
      }));
      if (!payload.data?.twoFactorRequired) {
        router.push('/admin');
        router.refresh();
        return;
      }

      if (payload.data.setupRequired) {
        const setupPayload = await parseResponse(await fetch('/api/auth/2fa-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }));
        setSetup(setupPayload.data);
      }
      setStep('two-factor');
    } catch (error) {
      setServerError(error.message);
    }
  }

  async function submitTwoFactor(values) {
    setServerError('');
    try {
      const payload = await parseResponse(await fetch('/api/auth/2fa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }));
      if (payload.data?.recoveryCodes?.length) {
        setRecoveryCodes(payload.data.recoveryCodes);
        setStep('recovery');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch (error) {
      setServerError(error.message);
    }
  }

  function resetLogin() {
    setStep('credentials');
    setSetup(null);
    setServerError('');
  }

  if (step === 'recovery') {
    return <RecoveryCodes codes={recoveryCodes} onContinue={() => { router.push('/admin'); router.refresh(); }} />;
  }
  if (step === 'two-factor') {
    return <TwoFactorForm setup={setup} onSubmit={submitTwoFactor} onBack={resetLogin} serverError={serverError} />;
  }
  return <CredentialsForm onSubmit={submitCredentials} serverError={serverError} />;
}
