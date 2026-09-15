import { useState } from 'react';
import { Bar, Window, Key, Field } from './ds';

interface JoinError {
  message: string;
  code: string;
}

interface ForgotPasswordResult {
  success: boolean;
  password?: string;
  message: string;
}

interface JoinScreenProps {
  onJoin: (username: string, password: string) => void;
  onlineCount: number;
  joinError: JoinError | null;
  onClearError: () => void;
  onForgotPassword: (username: string, adminCode: string) => void;
  forgotPasswordResult: ForgotPasswordResult | null;
  onClearForgotPassword: () => void;
}

export default function JoinScreen({
  onJoin,
  onlineCount,
  joinError,
  onClearError,
  onForgotPassword,
  forgotPasswordResult,
  onClearForgotPassword
}: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [partyCode, setPartyCode] = useState('');

  const ready = username.trim().length > 0 && password.trim().length > 0;
  const canReset = forgotUsername.trim().length > 0 && partyCode.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ready) onJoin(username.trim(), password.trim());
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (canReset) onForgotPassword(forgotUsername.trim(), partyCode.trim());
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    onClearForgotPassword();
    setForgotUsername('');
    setPartyCode('');
  };

  const logo = (
    <div style={{ textAlign: 'center', margin: '22px 0 8px' }}>
      <div style={{ fontSize: 30, letterSpacing: 1 }}>OtyChat</div>
      <div className="ds-muted" style={{ fontSize: 12, letterSpacing: 0.5, marginTop: 2 }}>PRESENTATION COMPANION</div>
    </div>
  );

  if (showForgotPassword) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Bar title="Forgot password" sub="ask the host" />
        <div className="ds-lcd ds-scroll" style={{ flex: 1, padding: 12 }}>
          {logo}
          <Window title="Reset it">
            {forgotPasswordResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {forgotPasswordResult.success ? (
                  <>
                    <div>Password reset. Your new password is:</div>
                    <div className="ds-field" style={{ display: 'flex', alignItems: 'center', fontSize: 20, background: 'var(--ds-yellow)' }}>
                      {forgotPasswordResult.password}
                    </div>
                    <div className="ds-small ds-muted">Write it down. You can keep it, it is yours now.</div>
                  </>
                ) : (
                  <div style={{ color: 'var(--ds-red)' }}>{forgotPasswordResult.message}</div>
                )}
                <Key kind="primary" big wide onClick={handleBackToLogin}>BACK TO LOGIN</Key>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label className="ds-small">Your username</label>
                <Field type="text" value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} maxLength={20} placeholder="Username" autoCapitalize="none" />
                <label className="ds-small">Party code (ask the host)</label>
                <Field type="text" value={partyCode} onChange={(e) => setPartyCode(e.target.value)} maxLength={40} placeholder="Party code" autoCapitalize="none" />
                <div className="ds-small ds-muted">Passwords are not stored readable, so the host resets it to a new one for you.</div>
                <Key type="submit" kind="primary" big wide disabled={!canReset}>RESET MY PASSWORD</Key>
                <Key type="button" wide onClick={handleBackToLogin}>Back to login</Key>
              </form>
            )}
          </Window>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar title="OtyChat" sub={`${onlineCount} online`} />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, padding: 12 }}>
        {logo}
        <Window title="Who are you?">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {joinError && (
              <div className="ds-window" style={{ padding: '6px 10px', color: 'var(--ds-red)', borderColor: 'var(--ds-red)' }}>
                {joinError.message}
              </div>
            )}
            <Field
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (joinError) onClearError(); }}
              maxLength={16}
              placeholder="Name"
              autoCapitalize="none"
              autoComplete="username"
            />
            <Field
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (joinError) onClearError(); }}
              placeholder="Password"
              autoComplete="current-password"
            />
            <div className="ds-small ds-muted">New here? Pick any password and it is yours.</div>
            <Key type="submit" kind="primary" big wide disabled={!ready}>
              {ready ? 'Eat Shit Bucko' : 'ENTER ROOM'}
            </Key>
            <Key type="button" wide onClick={() => setShowForgotPassword(true)}>Forgot password?</Key>
          </form>
        </Window>
      </div>
    </div>
  );
}
