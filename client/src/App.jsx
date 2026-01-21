import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import HostLobby from './pages/HostLobby';
import HostGame from './pages/HostGame';
import JoinGame from './pages/JoinGame';
import PlayerGame from './pages/PlayerGame';

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateQuiz />} />
        <Route path="/edit/:id" element={<EditQuiz />} />
        <Route path="/host/:pin" element={<HostLobby />} />
        <Route path="/host/:pin/game" element={<HostGame />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/play/:pin" element={<PlayerGame />} />
      </Routes>
    </div>
  );
}

export default App;
