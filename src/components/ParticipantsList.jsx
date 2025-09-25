import { useState, useEffect } from 'react';
import { getAllParticipants, getPaymentStats } from '../services/firebaseService';

const ParticipantsList = () => {
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalCollected: 0,
    averageAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from API instead of direct Firebase service
      const [participantsResponse, statsResponse] = await Promise.all([
        fetch('/api/participants'),
        fetch('/api/stats')
      ]);

      if (!participantsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const participantsData = await participantsResponse.json();
      const statsData = await statsResponse.json();

      if (participantsData.success) {
        setParticipants(participantsData.participants);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
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
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="participants-loading">
        <div className="spinner"></div>
        <p>Loading participants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="participants-error">
        <p>❌ Error loading participants: {error}</p>
        <button onClick={fetchData} className="retry-button">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="participants-container">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalParticipants}</h3>
            <p>Total Participants</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatAmount(stats.totalCollected)}</h3>
            <p>Total Collected</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{formatAmount(stats.averageAmount)}</h3>
            <p>Average Amount</p>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="participants-section">
        <div className="participants-header">
          <h2>🎉 Participants List</h2>
          <button onClick={fetchData} className="refresh-button">
            🔄 Refresh
          </button>
        </div>

        {participants.length === 0 ? (
          <div className="no-participants">
            <p>No participants yet. Be the first to join! 🚀</p>
          </div>
        ) : (
          <div className="participants-list">
            {participants.map((participant) => (
              <div key={participant.id} className="participant-card">
                <div className="participant-info">
                  <div className="participant-main">
                    <h4>{participant.name}</h4>
                    <p className="participant-email">{participant.email}</p>
                    {participant.phone && (
                      <p className="participant-phone">📞 {participant.phone}</p>
                    )}
                  </div>
                  
                  <div className="participant-details">
                    <div className="participant-amount">
                      <span className="amount-label">Amount:</span>
                      <span className="amount-value">{formatAmount(participant.amount)}</span>
                    </div>
                    
                    <div className="participant-status">
                      <span className={`status-badge ${participant.paymentStatus}`}>
                        {participant.paymentStatus === 'completed' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                    
                    <div className="participant-date">
                      <span className="date-label">Joined:</span>
                      <span className="date-value">{formatDate(participant.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;
