import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { BookOpen, Users, Target, CheckCircle, Gift, CreditCard, Loader, Download, Star, Heart, ShoppingCart, Search, Filter } from 'lucide-react'
import ParticipantsList from './components/ParticipantsList'
import TransparencyReport from './pages/TransparencyReport'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ProductsPage from './pages/ProductsPage'
import BackToTop from './components/BackToTop'
import Header from './components/Header'
import PaymentPopup from './components/PaymentPopup'
import { openRazorpayCheckout } from './utils/razorpayCheckout'
import './App.css'

// Product data
const products = [
  {
    id: 1,
    name: "Unseen Wings",
    price: 10,
    originalPrice: 10,
    rating: 4.9,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop&crop=center",
    description: "Discover hidden potential and soar beyond limitations.",
    category: "Fiction",
    inStock: true,
    isNew: true,
    isComingSoon: false
  },
  {
    id: 2,
    name: "Digital Marketing Mastery",
    price: 299,
    originalPrice: 599,
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=center",
    description: "Complete digital marketing and social media guide.",
    category: "Marketing",
    inStock: false,
    isNew: false,
    isComingSoon: true
  },
  {
    id: 3,
    name: "E-commerce Success Blueprint",
    price: 399,
    originalPrice: 799,
    rating: 4.9,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&crop=center",
    description: "Build and scale successful online stores.",
    category: "Business",
    inStock: false,
    isNew: false,
    isComingSoon: true
  },
  {
    id: 4,
    name: "Content Creation Handbook",
    price: 199,
    originalPrice: 399,
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop&crop=center",
    description: "Create engaging content that drives traffic.",
    category: "Content",
    inStock: false,
    isNew: false,
    isComingSoon: true
  },
  {
    id: 5,
    name: "SEO Optimization Guide",
    price: 349,
    originalPrice: 699,
    rating: 4.6,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=400&fit=crop&crop=center",
    description: "Advanced SEO techniques for better rankings.",
    category: "Marketing",
    inStock: false,
    isNew: false,
    isComingSoon: true
  },
  {
    id: 6,
    name: "Social Media Strategy Kit",
    price: 249,
    originalPrice: 499,
    rating: 4.5,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop&crop=center",
    description: "Build strong social media presence.",
    category: "Social Media",
    inStock: false,
    isNew: false,
    isComingSoon: true
  }
]

// Main Ebook Sales Page Component
function EbookSalesPage() {
  const [participants, setParticipants] = useState([])
  const [totalCollected, setTotalCollected] = useState(0)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const targetAmount = 100000 // ₹1 lakh
  const ebookPrice = 10 // ₹10 for ebook
  const giveawayPrize = 80000 // ₹80,000 iPhone

  // Function to fetch real-time data from Firebase
  const fetchFirebaseData = async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true);
      
      // Import Firebase service functions
      const { getAllParticipants, getPaymentStats } = await import('./services/firebaseService');
      
      const [participants, stats] = await Promise.all([
        getAllParticipants(),
        getPaymentStats()
      ]);

      // Filter only completed participants
      const completedParticipants = participants.filter(p => p.paymentStatus === 'completed');
      
      setParticipants(completedParticipants);
      setTotalCollected(stats.totalCollected);
      
      console.log('Firebase data loaded:', {
        participants: completedParticipants.length,
        totalCollected: stats.totalCollected
      });
    } catch (error) {
      console.error('Error fetching Firebase data:', error);
      // No fallback needed - Firebase is the single source of truth
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch initial data from Firebase
    fetchFirebaseData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchFirebaseData, 30000);
    
    return () => clearInterval(interval);
  }, [])

  const categories = ['All', ...new Set(products.map(product => product.category))]

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'All' || product.category === selectedCategory)
    )
    .sort((a, b) => {
      // First priority: Available products (inStock: true) come first
      if (a.inStock && !b.inStock) return -1
      if (!a.inStock && b.inStock) return 1
      
      // Second priority: Apply the selected sort criteria
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const toggleFavorite = (productId) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const buyNow = (product) => {
    setSelectedProduct(product)
    setShowPaymentPopup(true)
  }

  const handleClosePopup = () => {
    setShowPaymentPopup(false)
    setSelectedProduct(null)
  }

  const handlePaymentSuccess = (response, customerData) => {
    console.log('Payment successful:', response)
    // Refresh data from Firebase to get the latest statistics
    fetchFirebaseData()
  }

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error)
  }

  const handlePaymentClose = () => {
    console.log('Payment popup closed')
  }

  // Data security: No clear data functionality - all data is permanently stored for transparency

  const isTargetReached = totalCollected >= targetAmount
  const progressPercentage = Math.min((totalCollected / targetAmount) * 100, 100)
  
  // Debug logging only when values change
  useEffect(() => {
    console.log('Progress Updated:', {
      totalCollected,
      targetAmount,
      participants: participants.length,
      progressPercentage: progressPercentage.toFixed(2)
    });
  }, [totalCollected, participants.length, progressPercentage]);

  return (
    <div className="app">
      {/* Navigation Header */}
      <Header />

      {/* Main Header Content */}
      <header className="header">
        <h1>📚 Granzia</h1>
        <p>Discover our premium digital products and get a chance to win an iPhone worth ₹80,000!</p>
      </header>

      <main className="main">
        {/* Filters and Search */}
        <div className="products-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <Filter size={16} />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className={`product-card ${product.isComingSoon ? 'coming-soon-card' : ''}`}>
              <div className="product-image">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="product-book-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <span className="product-emoji-fallback" style={{display: 'none'}}>📚</span>
                {product.isNew && <span className="new-badge">New</span>}
                {product.isComingSoon && <span className="coming-soon-badge">Coming Soon</span>}
                <button 
                  className={`favorite-btn ${favorites.includes(product.id) ? 'favorited' : ''}`}
                  onClick={() => toggleFavorite(product.id)}
                  aria-label="Add to favorites"
                  disabled={product.isComingSoon}
                >
                  <Heart size={20} />
                </button>
              </div>
              
              <div className="product-info">
                <div className="product-category">{product.category}</div>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-rating">
                  <div className="rating-badge">
                    <Star size={12} />
                    {product.rating}
                  </div>
                  <span className="rating-text">
                    ({product.reviews.toLocaleString()} reviews)
                  </span>
                </div>
                
                <div className="product-price">
                  {product.isComingSoon ? (
                    <span className="coming-soon-price">Coming Soon</span>
                  ) : (
                    <>
                      <span className="current-price">₹{product.price}</span>
                      {product.originalPrice !== product.price && (
                        <>
                          <span className="original-price">₹{product.originalPrice}</span>
                          <span className="discount">
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                <button 
                  className={`buy-now-btn ${!product.inStock ? 'out-of-stock' : ''} ${product.isComingSoon ? 'coming-soon' : ''}`}
                  onClick={() => buyNow(product)}
                  disabled={!product.inStock || product.isComingSoon}
                >
                  {product.isComingSoon ? (
                    'Coming Soon'
                  ) : product.inStock ? (
                    <>
                      <ShoppingCart size={18} />
                      Buy Now
                    </>
                  ) : (
                    'Out of Stock'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-header">
            <div className="refresh-stats">
              <button 
                onClick={() => fetchFirebaseData(true)}
                disabled={isRefreshing}
                className="refresh-button"
                title="Refresh data from Firebase"
              >
                {isRefreshing ? <Loader className="spinner" /> : '🔄'} 
                {isRefreshing ? ' Refreshing...' : ' Refresh'}
              </button>
            </div>
            <div className="progress-stat">
              <Target className="stat-icon" />
              <div>
                <span className="stat-value">₹{totalCollected.toLocaleString()}</span>
                <span className="stat-label">Total Sales</span>
              </div>
            </div>
            <div className="progress-stat">
              <Users className="stat-icon" />
              <div>
                <span className="stat-value">{participants.length}</span>
                <span className="stat-label">Customers</span>
              </div>
            </div>
            <div className="progress-stat">
              <Gift className="stat-icon" />
              <div>
                <span className="stat-value">₹{targetAmount.toLocaleString()}</span>
                <span className="stat-label">Giveaway Target</span>
              </div>
            </div>
          </div>

          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
      </div>
          <p className="progress-text">
            <strong>{progressPercentage.toFixed(1)}% towards giveaway target</strong>
            <br />
            <small>₹{totalCollected.toLocaleString()} of ₹{targetAmount.toLocaleString()} ({participants.length} customers)</small>
            {isTargetReached && (
              <span className="target-reached">
                <CheckCircle size={16} />
                Giveaway Target Reached!
              </span>
            )}
          </p>
      </div>

        {/* Stats */}
        <div className="products-stats">
          <div className="stat-item">
            <h3>{products.length}</h3>
            <p>Total Products</p>
          </div>
          <div className="stat-item">
            <h3>{categories.length - 1}</h3>
            <p>Categories</p>
          </div>
          <div className="stat-item">
            <h3>{products.filter(p => p.inStock).length}</h3>
            <p>Available Now</p>
          </div>
          <div className="stat-item">
            <h3>4.7</h3>
            <p>Avg Rating</p>
          </div>
        </div>

        {/* Customers Section */}
        <div className="participants-section">
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className="toggle-participants"
          >
            {showParticipants ? 'Hide' : 'Show'} Customers ({participants.length})
          </button>
          
          {showParticipants && <ParticipantsList />}
        </div>

        {/* Terms and Conditions */}
        <div className="rules-section">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>You are purchasing a digital ebook for ₹10</li>
            <li>Giveaway entry is a bonus benefit with your purchase</li>
            <li>Each customer can purchase only once</li>
            <li>Giveaway target is ₹{targetAmount.toLocaleString()}</li>
            <li>Once target is reached, winner will be randomly selected</li>
            <li>Winner will be contacted via email</li>
            <li>iPhone will be delivered within 7-10 business days</li>
            <li>Ebook will be delivered immediately after payment</li>
            <li>All sales are final - no refunds</li>
          </ul>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Granzia. All rights reserved.</p>
        <div className="privacy-links">
          <button
            onClick={() => window.open('/#/transparency', '_blank')}
            className="privacy-link"
          >
            📊 Transparency Report
          </button>
          <Link 
            to="/privacy" 
            className="privacy-link"
          >
            🔒 Privacy Policy
          </Link>
        </div>
      </footer>

      {/* Payment Popup */}
      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={handleClosePopup}
        product={selectedProduct}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        onPaymentClose={handlePaymentClose}
      />
      
      <BackToTop />
    </div>
  )
}

// Main App Component with Routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EbookSalesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/transparency" element={<TransparencyReport />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  )
}

export default App