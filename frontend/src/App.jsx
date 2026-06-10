import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import NewUserPage from './pages/NewUserPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RoomPage from './pages/RoomPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/new-user" element={<NewUserPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
