import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import Footer from './components/Footer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import CookieBanner from './components/CookieBanner';
import AiChatWidget from './components/AiChatWidget';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleNavigate = (page: string, propertyId?: string) => {
    setCurrentPage(page);
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
    if (page === 'vehicle-detail' && propertyId) {
      setSelectedVehicleId(propertyId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'properties':
        return <PropertiesPage onNavigate={handleNavigate} />;
      case 'vehicles':
        return <VehiclesPage onNavigate={handleNavigate} />;
      case 'property-detail':
        return selectedPropertyId ? (
          <PropertyDetailPage propertyId={selectedPropertyId} onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case 'vehicle-detail':
        return selectedVehicleId ? (
          <VehicleDetailPage vehicleId={selectedVehicleId} onNavigate={handleNavigate} />
        ) : (
          <VehiclesPage onNavigate={handleNavigate} />
        );
      case 'contact':
        return <ContactPage />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        {renderPage()}
        <Footer onNavigate={handleNavigate} />

        {/* Global UI */}
        <AiChatWidget />
        <WhatsAppFloatingButton />
        <CookieBanner />
      </div>
    </AuthProvider>
  );
}

export default App;
