import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Login } from './pages/Login'
import { Register } from './pages/Register';
import { CompanyEditor } from './pages/CompanyEditor';

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />

			<Route path="/company/new" element={<CompanyEditor />} />
			<Route path="/company/edit/:id" element={<CompanyEditor />} />
		</Routes>
	);
}

function App() {
	return (
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<AppRoutes />
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
	)
}

export default App;
