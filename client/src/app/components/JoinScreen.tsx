import { useState } from 'react';

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
  onForgotPassword: (username: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onJoin(username.trim(), password.trim());
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotUsername.trim()) {
      onForgotPassword(forgotUsername.trim());
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    onClearForgotPassword();
    setForgotUsername('');
  };

  // Forgot Password Screen
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #fae8ff 100%)',
        fontFamily: 'Nunito, system-ui, sans-serif'
      }}>
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center relative z-10">
            <div className="inline-block px-8 py-6 mb-4" style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.5)',
            }}>
              <h1 style={{
                fontFamily: 'Fredoka, sans-serif',
                color: '#ffffff',
                fontSize: '28px',
                letterSpacing: '1px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                Forgot Password?
              </h1>
            </div>
            <p className="text-lg mb-6" style={{
              color: 'var(--text)',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: '600'
            }}>
              No worries, we'll tell you!
            </p>
          </div>

          {/* Form */}
          <div className="p-8 relative z-10" style={{
            background: 'white',
            borderRadius: '32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}>
            {forgotPasswordResult ? (
              <div className="space-y-5">
                {forgotPasswordResult.success ? (
                  <div className="text-center space-y-4">
                    <div className="text-5xl">🔑</div>
                    <p style={{
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '16px',
                      color: 'var(--text)',
                    }}>
                      Your password is:
                    </p>
                    <div className="px-4 py-3 rounded-xl" style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                      color: 'white',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '24px',
                      fontWeight: '600',
                    }}>
                      {forgotPasswordResult.password}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-5xl">😕</div>
                    <p style={{
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '16px',
                      color: '#ef4444',
                    }}>
                      {forgotPasswordResult.message}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full px-6 py-4 transition-all transform hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    borderRadius: '20px',
                    color: 'white',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '18px',
                    fontWeight: '600',
                    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block mb-3" style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '14px',
                    color: 'var(--text)',
                    fontWeight: '600'
                  }}>
                    What's your username?
                  </label>
                  <input
                    type="text"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    maxLength={20}
                    placeholder="Username"
                    className="w-full px-5 py-4 outline-none transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '16px',
                      borderRadius: '16px',
                      border: '2px solid transparent',
                      boxShadow: forgotUsername ? '0 0 0 2px #3b82f6' : 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!forgotUsername.trim()}
                  className="w-full px-6 py-4 transition-all transform hover:scale-105 active:scale-95"
                  style={{
                    background: forgotUsername.trim()
                      ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                      : 'var(--bg-secondary)',
                    borderRadius: '20px',
                    color: forgotUsername.trim() ? 'white' : 'var(--text-muted)',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '18px',
                    fontWeight: '600',
                    boxShadow: forgotUsername.trim()
                      ? '0 8px 24px rgba(59, 130, 246, 0.4)'
                      : 'none',
                    cursor: forgotUsername.trim() ? 'pointer' : 'not-allowed',
                    border: 'none'
                  }}
                >
                  Show My Password
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full text-center py-2"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Login Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #fae8ff 100%)',
      fontFamily: 'Nunito, system-ui, sans-serif'
    }}>
      <div className="w-full max-w-md space-y-6">
        {/* Floating Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🎈</div>
          <div className="absolute top-40 right-16 text-5xl opacity-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>⭐</div>
          <div className="absolute bottom-32 left-20 text-7xl opacity-20 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }}>✨</div>
        </div>

        {/* Header */}
        <div className="text-center relative z-10">
          <div className="inline-block px-8 py-6 mb-4 animate-pulse" style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.5)',
            transform: 'rotate(-2deg)'
          }}>
            <h1 style={{
              fontFamily: 'Fredoka, sans-serif',
              color: '#ffffff',
              fontSize: '32px',
              letterSpacing: '1px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              OtyChat
            </h1>
          </div>
          <p className="text-lg mb-6" style={{
            color: 'var(--text)',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: '600'
          }}>
            Join the party!
          </p>
        </div>

        {/* Join Form */}
        <div className="p-8 relative z-10" style={{
          background: 'white',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {joinError && (
              <div className="px-4 py-3 rounded-xl text-center" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                <p style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '14px',
                  color: '#ef4444',
                  fontWeight: '600'
                }}>
                  {joinError.message}
                </p>
              </div>
            )}

            <div>
              <label className="block mb-3" style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '14px',
                color: 'var(--text)',
                fontWeight: '600'
              }}>
                What's your name?
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (joinError) onClearError();
                }}
                maxLength={16}
                placeholder="Name"
                className="w-full px-5 py-4 outline-none transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '16px',
                  borderRadius: '16px',
                  border: '2px solid transparent',
                  boxShadow: username ? '0 0 0 2px #ec4899' : 'none'
                }}
              />
            </div>

            <div>
              <label className="block mb-3" style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '14px',
                color: 'var(--text)',
                fontWeight: '600'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (joinError) onClearError();
                }}
                placeholder="Password"
                className="w-full px-5 py-4 outline-none transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '16px',
                  borderRadius: '16px',
                  border: '2px solid transparent',
                  boxShadow: password ? '0 0 0 2px #ec4899' : 'none'
                }}
              />
              <p className="mt-2 text-center" style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                New user? Just pick any password!
              </p>
            </div>

            <button
              type="submit"
              disabled={!username.trim() || !password.trim()}
              className="w-full px-6 py-4 transition-all transform hover:scale-105 active:scale-95"
              style={{
                background: username.trim() && password.trim()
                  ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
                  : 'var(--bg-secondary)',
                borderRadius: '20px',
                color: username.trim() && password.trim() ? 'white' : 'var(--text-muted)',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: username.trim() && password.trim()
                  ? '0 8px 24px rgba(236, 72, 153, 0.4)'
                  : 'none',
                cursor: username.trim() && password.trim() ? 'pointer' : 'not-allowed',
                border: 'none'
              }}
            >
              {username.trim() && password.trim() ? 'Eat Shit Bucko' : 'Enter name & password'}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="w-full text-center py-2"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontFamily: 'Nunito, sans-serif',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Forgot password?
            </button>
          </form>
        </div>

        {/* Online Count */}
        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              color: 'var(--text)',
              fontWeight: '600'
            }}>
              {onlineCount} people online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
