import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register";
import { CompanyEditor } from "./pages/CompanyEditor";
import { TourEditor } from "./pages/TourEditor";
import { CompaniesList } from "./pages/CompaniesList";
import { CompanyViewer } from "./pages/CompanyViewer";
import { TourViewer } from "./pages/TourViewer";
import { Logout } from "./pages/Logout";
import { Header } from "./components/Header";

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/logout" element={<Logout />} />

			<Route path="/company/new" element={<CompanyEditor />} />
			<Route path="/company/edit/:companyId" element={<CompanyEditor />} />
			<Route path="/company/edit/:companyId" element={<CompanyEditor />} />

			<Route path="/companies/my" element={<CompaniesList />} />
			<Route path="/company/:companyId" element={<CompanyViewer />} />
			<Route path="/company/:companyId/tours/new" element={<TourEditor />} />
			<Route path="/company/:companyId/tours/edit/:tourId" element={<TourEditor />} />
			<Route path="/session/:tourId/:sessionId" element={<TourViewer />} />
		</Routes>
	);
}

function App() {
	return (
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<Header />
					<AppRoutes />
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
	)
}

export default App;
