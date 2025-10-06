import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Star, Heart, ShoppingCart, ArrowLeft, Search, Filter } from 'lucide-react'
import './ProductsPage.css'

// Product data
const products = [
  {
    id: 1,
    name: "Digital Marketing Mastery",
    price: 299,
    originalPrice: 599,
    rating: 4.8,
    reviews: 124,
    image: "📱",
    description: "Complete guide to digital marketing strategies, social media management, and online advertising techniques.",
    category: "Marketing",
    inStock: true,
    isNew: true
  },
  {
    id: 2,
    name: "E-commerce Success Blueprint",
    price: 399,
    originalPrice: 799,
    rating: 4.9,
    reviews: 89,
    image: "🛒",
    description: "Learn how to build and scale successful online stores with proven strategies and real-world case studies.",
    category: "Business",
    inStock: true,
    isNew: false
  },
  {
    id: 3,
    name: "Content Creation Handbook",
    price: 199,
    originalPrice: 399,
    rating: 4.7,
    reviews: 156,
    image: "✍️",
    description: "Master the art of creating engaging content that drives traffic and converts visitors into customers.",
    category: "Content",
    inStock: true,
    isNew: false
  },
  {
    id: 4,
    name: "SEO Optimization Guide",
    price: 349,
    originalPrice: 699,
    rating: 4.6,
    reviews: 203,
    image: "🔍",
    description: "Advanced SEO techniques to improve your website's search engine rankings and organic traffic.",
    category: "Marketing",
    inStock: true,
    isNew: true
  },
  {
    id: 5,
    name: "Social Media Strategy Kit",
    price: 249,
    originalPrice: 499,
    rating: 4.5,
    reviews: 178,
    image: "📸",
    description: "Comprehensive toolkit for building a strong social media presence and engaging with your audience.",
    category: "Social Media",
    inStock: false,
    isNew: false
  }
]

function ProductsPage() {
  const [favorites, setFavorites] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('name')

  const categories = ['All', ...new Set(products.map(product => product.category))]

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'All' || product.category === selectedCategory)
    )
    .sort((a, b) => {
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

  const addToCart = (product) => {
    alert(`Added "${product.name}" to cart! (This is a demo)`)
  }

  return (
    <div className="products-page">
      {/* Header */}
      <header className="products-header">
        <div className="products-header-content">
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-link">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
          <h1>Our Products</h1>
          <p>Discover our premium digital products designed to boost your success</p>
        </div>
      </header>

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
      <main className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <span className="product-emoji">{product.image}</span>
              {product.isNew && <span className="new-badge">New</span>}
              <button 
                className={`favorite-btn ${favorites.includes(product.id) ? 'favorited' : ''}`}
                onClick={() => toggleFavorite(product.id)}
                aria-label="Add to favorites"
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
                <span className="current-price">₹{product.price}</span>
                <span className="original-price">₹{product.originalPrice}</span>
                <span className="discount">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </div>
              
              <button 
                className={`add-to-cart-btn ${!product.inStock ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
              >
                {product.inStock ? (
                  <>
                    <ShoppingCart size={18} />
                    Add to Cart
                  </>
                ) : (
                  'Out of Stock'
                )}
              </button>
            </div>
          </div>
        ))}
      </main>

      {filteredProducts.length === 0 && (
        <div className="no-products">
          <ShoppingBag size={48} />
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

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
          <p>In Stock</p>
        </div>
        <div className="stat-item">
          <h3>4.7</h3>
          <p>Avg Rating</p>
        </div>
      </div>
    </div>
  )
}

export default ProductsPage
