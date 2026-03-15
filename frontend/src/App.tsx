import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ToursList } from './pages/ToursList';
import { TourEditor } from './pages/TourEditor';
import { SessionAuthor } from './pages/SessionAuthor';
import { SessionClient } from './pages/SessionClient';

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const { token } = useAuth();
	return token ? children : <Navigate to="/login" />;
};

function AppRoutes() {
	return (
		<Routes>
		<Route path="/login" element={<Login />} />
		<Route path="/register" element={<Register />} />
		<Route path="/tours" element={<PrivateRoute><ToursList /></PrivateRoute>} />
		<Route path="/tours/new" element={<PrivateRoute><TourEditor /></PrivateRoute>} />
		<Route path="/tours/edit/:id" element={<PrivateRoute><TourEditor /></PrivateRoute>} />
		<Route path="/session/:sessionId/author/:tourId" element={<PrivateRoute><SessionAuthor /></PrivateRoute>} />
		<Route path="/session/:sessionId/:tourId" element={<SessionClient />} />
		<Route path="*" element={<Navigate to="/tours" />} />
		</Routes>
	);
}

function App() {
	return (
		<BrowserRouter>
		<AuthProvider>
		<AppRoutes />
		</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
