import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Login } from './pages/Login'
import { Register } from './pages/Register';
import { CompanyEditor } from './pages/CompanyEditor';
import { TourEditor } from './pages/TourEditor';
import { CompaniesList } from './pages/CompaniesList';
import { CompanyViewer } from './pages/CompanyViewer';

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />

			<Route path="/company/new" element={<CompanyEditor />} />
			<Route path="/company/edit/:companyId" element={<CompanyEditor />} />

			<Route path="/companies/my" element={<CompaniesList />} />
			<Route path="/company/:companyId" element={<CompanyViewer />} />
			<Route path="/company/:companyId/tours/new" element={<TourEditor />} />
			<Route path="/company/:companyId/tours/edit/:tourId" element={<TourEditor />} />
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
