import { SocketProvider, useSocket } from '../contexts/SocketContext';
import JoinScreen from './components/JoinScreen';
import MainApp from './components/MainApp';

function AppContent() {
  const {
    user,
    onlineCount,
    join,
    joinError,
    clearJoinError,
    forgotPassword,
    forgotPasswordResult,
    clearForgotPasswordResult
  } = useSocket();

  const handleJoin = (name: string, password: string) => {
    localStorage.setItem('otychat_username', name);
    join(name, password);
  };

  if (!user) {
    return (
      <JoinScreen
        onJoin={handleJoin}
        onlineCount={onlineCount}
        joinError={joinError}
        onClearError={clearJoinError}
        onForgotPassword={forgotPassword}
        forgotPasswordResult={forgotPasswordResult}
        onClearForgotPassword={clearForgotPasswordResult}
      />
    );
  }

  return <MainApp username={user.odName} />;
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
