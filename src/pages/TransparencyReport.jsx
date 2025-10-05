import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, RefreshCw, Users, DollarSign, Calendar, Shield, Eye, ArrowLeft, BookOpen, Home, BarChart3, Menu, X } from 'lucide-react';
import BackToTop from '../components/BackToTop';
import { getAllParticipants, getPaymentStats } from '../services/firebaseService';
import './TransparencyReport.css';

const TransparencyReport = () => {
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalCollected: 0,
    averageAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from Firebase directly
      const [participants, stats] = await Promise.all([
        getAllParticipants(),
        getPaymentStats()
      ]);

      setParticipants(participants);
      setStats(stats);
      setLastUpdated(new Date());
      
      console.log('Firebase data loaded in TransparencyReport:', {
        participants: participants.length,
        totalCollected: stats.totalCollected
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const exportToCSV = () => {
    const filteredParticipants = filterParticipants();
    const headers = ['Name', 'Email', 'Phone', 'Amount', 'Payment Status', 'Payment ID', 'Order ID', 'Date Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredParticipants.map(participant => [
        `"${participant.name}"`,
        `"${participant.email}"`,
        `"${participant.phone || ''}"`,
        participant.amount,
        `"${participant.paymentStatus}"`,
        `"${participant.razorpayPaymentId || ''}"`,
        `"${participant.razorpayOrderId || ''}"`,
        `"${formatDate(participant.createdAt)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transparency-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterParticipants = () => {
    if (filterStatus === 'all') return participants;
    return participants.filter(p => p.paymentStatus === filterStatus);
  };

  const filteredParticipants = filterParticipants();

  if (loading) {
    return (
      <div className="transparency-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading transparency report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transparency-container">
        <div className="error-container">
          <p>❌ Error loading transparency report: {error}</p>
          <button onClick={fetchData} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transparency-page">
      {/* Navigation Header */}
      <header className="header-nav">
        <div className="header-container">
          <div className="header-brand">
            <BookOpen className="brand-icon" />
            <span className="brand-text">Digital Success Guide</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="header-nav-desktop">
            <Link to="/" className="nav-link">
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link to="/transparency" className="nav-link active">
              <BarChart3 size={18} />
              <span>Transparency Report</span>
            </Link>
            <Link to="/privacy" className="nav-link">
              <Shield size={18} />
              <span>Privacy Policy</span>
            </Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Sidebar */}
        <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-content">
            <div className="mobile-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen className="sidebar-brand-icon" />
                <span className="sidebar-brand-text">Digital Success Guide</span>
              </div>
              <button 
                className="mobile-sidebar-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close mobile menu"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="mobile-nav">
              <Link 
                to="/" 
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link 
                to="/transparency" 
                className="mobile-nav-link active"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 size={20} />
                <span>Transparency Report</span>
              </Link>
              <Link 
                to="/privacy" 
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Shield size={20} />
                <span>Privacy Policy</span>
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </header>

      <div className="transparency-container">
        {/* Page Header */}
        <header className="transparency-header">
          <div className="header-content">
            <Link to="/" className="back-button">
              <ArrowLeft className="icon" />
              Back to Home
            </Link>
            <div className="header-title">
              <Shield className="title-icon" />
              <h1>Transparency Report</h1>
              <p>Complete financial transparency for iPhone Giveaway</p>
            </div>
            <div className="header-actions">
              <button onClick={fetchData} disabled={loading} className="refresh-button">
                <RefreshCw className={`icon ${loading ? 'spinning' : ''}`} />
                Refresh
              </button>
              <button onClick={exportToCSV} className="export-button">
                <Download className="icon" />
                Export CSV
              </button>
            </div>
          </div>
        </header>

      {/* Statistics Overview */}
      <section className="stats-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <Users className="stat-icon" />
            <div className="stat-content">
              <h3>{stats.totalParticipants}</h3>
              <p>Total Participants</p>
            </div>
          </div>
          
          <div className="stat-card">
            <DollarSign className="stat-icon" />
            <div className="stat-content">
              <h3>{formatAmount(stats.totalCollected)}</h3>
              <p>Total Collected</p>
            </div>
          </div>
          
          <div className="stat-card">
            <Calendar className="stat-icon" />
            <div className="stat-content">
              <h3>{formatAmount(stats.averageAmount)}</h3>
              <p>Average Amount</p>
            </div>
          </div>

          <div className="stat-card">
            <Eye className="stat-icon" />
            <div className="stat-content">
              <h3>{filteredParticipants.length}</h3>
              <p>Showing Records</p>
            </div>
          </div>
        </div>

        <div className="report-info">
          <p><strong>Report Generated:</strong> {lastUpdated ? formatDate(lastUpdated.toISOString()) : 'Never'}</p>
          <p><strong>Data Source:</strong> Firebase Firestore (Real-time)</p>
          <p><strong>Total Records:</strong> {participants.length} participants</p>
        </div>
      </section>

      {/* Filters */}
      <section className="filters-section">
        <div className="filter-controls">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select 
            id="status-filter"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Participants ({participants.length})</option>
            <option value="completed">Completed Payments ({participants.filter(p => p.paymentStatus === 'completed').length})</option>
            <option value="pending">Pending Payments ({participants.filter(p => p.paymentStatus === 'pending').length})</option>
          </select>
        </div>
      </section>

      {/* Participants Table */}
      <section className="participants-section">
        <div className="section-header">
          <h2>Participant Records</h2>
          <p>Complete transaction history with payment verification</p>
        </div>

        {filteredParticipants.length === 0 ? (
          <div className="no-data">
            <Users className="no-data-icon" />
            <p>No participants found matching the current filter.</p>
          </div>
        ) : (
          <div className="participants-table-container">
            <table className="participants-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment ID</th>
                  <th>Date Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant, index) => (
                  <tr key={participant.id}>
                    <td className="row-number">{index + 1}</td>
                    <td className="name-cell">
                      <strong>{participant.name}</strong>
                    </td>
                    <td className="email-cell">
                      {participant.email}
                    </td>
                    <td className="phone-cell">
                      {participant.phone || 'N/A'}
                    </td>
                    <td className="amount-cell">
                      <span className="amount-value">{formatAmount(participant.amount)}</span>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${participant.paymentStatus}`}>
                        {participant.paymentStatus === 'completed' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="payment-id-cell">
                      <code className="payment-id">
                        {participant.razorpayPaymentId ? participant.razorpayPaymentId.slice(-8) : 'N/A'}
                      </code>
                    </td>
                    <td className="date-cell">
                      {formatDate(participant.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="transparency-footer">
        <div className="footer-content">
          <div className="footer-info">
            <h3>Data Integrity & Security</h3>
            <ul>
              <li>✅ All transactions are cryptographically verified</li>
              <li>✅ Data is stored securely in Firebase Firestore</li>
              <li>✅ No data can be deleted or modified after payment</li>
              <li>✅ Complete audit trail for transparency</li>
            </ul>
          </div>
          <div className="footer-actions">
            <Link to="/#/" className="footer-link">
              <ArrowLeft className="icon" />
              Back to Giveaway
            </Link>
            <button onClick={exportToCSV} className="footer-export">
              <Download className="icon" />
              Download Report
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 iPhone Giveaway. Complete transparency maintained.</p>
        </div>
      </footer>
      </div>
      
      <BackToTop />
    </div>
  );
};

export default TransparencyReport;
