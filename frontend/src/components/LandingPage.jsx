import { useState, useEffect } from 'react';
import './LandingPage.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Map from './Map';
import Header from './Header';

const LandingPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [historicalSales, setHistoricalSales] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Clothing');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [userId, setUserId] = useState('1');
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const categories = ['All', 'Clothing', 'Electronics', 'Furniture', 'Groceries', 'Toys'];
  const categoryColors = {
    Clothing: '#EF5350',
    Electronics: '#42A5F5',
    Furniture: '#FFA726',
    Groceries: '#66BB6A',
    Toys: '#AB47BC'
  };

  // Add fake store names mapping
  const storeNames = {
    Clothing: ['Fashion Hub', 'Style Studio', 'Trendy Threads', 'Urban Wear'],
    Electronics: ['Tech World', 'Digital Dreams', 'Gadget Galaxy', 'Electronic Express'],
    Furniture: ['Home Haven', 'Comfort Zone', 'Decor Delights', 'Furniture Fusion'],
    Groceries: ['Fresh Mart', 'Daily Essentials', 'Green Grocer', 'Super Foods'],
    Toys: ['Toy Paradise', 'Kid\'s Corner', 'Play World', 'Fun Factory']
  };

  // Helper function to get random store name
  const getRandomStore = (category) => {
    const stores = storeNames[category] || [];
    return stores[Math.floor(Math.random() * stores.length)];
  };

  // Fetch predictions
  useEffect(() => {
    const fetchSalesPredictions = async () => {
      try {
        setIsLoading(true);
        const categories = ['Clothing', 'Electronics', 'Furniture', 'Groceries', 'Toys'];
        const predictions = {};
        
        for (const category of categories) {
          const response = await fetch(
            `http://127.0.0.1:5000/predict-sales?product_category=${category}&discount_applied=0.2`
          );
          const data = await response.json();
          predictions[category] = data.sales_predictions_2022;
        }

        const months = Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`);
        const formattedData = months.map(month => ({
          month: month.replace('Month ', ''),
          Clothing: parseFloat(predictions['Clothing'][month] || 0).toFixed(2),
          Electronics: parseFloat(predictions['Electronics'][month] || 0).toFixed(2),
          Furniture: parseFloat(predictions['Furniture'][month] || 0).toFixed(2),
          Groceries: parseFloat(predictions['Groceries'][month] || 0).toFixed(2),
          Toys: parseFloat(predictions['Toys'][month] || 0).toFixed(2),
        }));

        setSalesData(formattedData);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError('Failed to load predictions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesPredictions();
  }, []);

  // Update the historical sales fetch and transformation
  useEffect(() => {
    const fetchHistoricalSales = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/sales_2021');
        const data = await response.json();
        
        // Transform the data to match our needs
        const transformedData = {};
        Object.keys(data).forEach(key => {
          const category = key.split('_')[0]; // Extract category name
          transformedData[category] = {};
          // Transform month keys to match the expected format
          Object.keys(data[key]).forEach(monthKey => {
            // Handle both formats: "Month 1" and "Month 1.0"
            const monthNum = monthKey.includes('.') ? 
              parseInt(monthKey.split('.')[0]) : 
              parseInt(monthKey.replace('Month ', ''));
            const cleanMonthKey = `Month ${monthNum}`;
            transformedData[category][cleanMonthKey] = data[key][monthKey];
          });
        });
        setHistoricalSales(transformedData);
      } catch (err) {
        console.error('Error fetching historical sales:', err);
        setError('Failed to load historical data');
      }
    };

    fetchHistoricalSales();
  }, []);

  // Update the historical sales data transformation
  const getHistoricalSalesData = () => {
    if (!historicalSales) return [];

    const months = Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`);

    if (selectedCategory !== 'All') {
      // Single category view
      return months.map(monthKey => {
        const categoryData = historicalSales[selectedCategory] || {};
        return {
          month: monthKey.replace('Month ', ''),
          [selectedCategory]: categoryData[monthKey] ? 
            categoryData[monthKey] / 1000000 : 0
        };
      }).sort((a, b) => parseInt(a.month) - parseInt(b.month));
    } else {
      // Stacked view for all categories
      return months.map(monthKey => {
        const month = monthKey.replace('Month ', '');
        const monthData = { month };
        
        Object.keys(categoryColors).forEach(category => {
          const categoryData = historicalSales[category] || {};
          monthData[category] = categoryData[monthKey] ? 
            categoryData[monthKey] / 1000000 : 0;
        });
        
        return monthData;
      }).sort((a, b) => parseInt(a.month) - parseInt(b.month));
    }   
  };

  // Modify the recommendations fetch
  const fetchRecommendations = async (id) => {
    try {
      setIsLoadingRecommendations(true);
      setShowRecommendations(false); // Hide previous recommendations
      const response = await fetch(`http://127.0.0.1:5000/recommend?user_id=${id}`);
      const data = await response.json();
      
      // Add store names to recommendations
      const recommendationsWithStores = data.map(item => ({
        ...item,
        storeName: getRandomStore(item.category)
      }));
      
      setRecommendations(recommendationsWithStores);
      setShowRecommendations(true); // Show new recommendations
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleUserIdSubmit = (e) => {
    e.preventDefault();
    fetchRecommendations(userId);
  };

  // Modify the email sending function to handle errors better
  const handleSendRecommendations = async () => {
    if (!recommendations.length) {
      alert('Please get recommendations first before sending email');
      return;
    }

    try {
      setEmailSending(true);
      const response = await fetch('http://127.0.0.1:5000/send-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          recommendations: recommendations,
          user_email: "rajneelchouguleone8@gmail.com"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        throw new Error(data.message || 'Failed to send recommendations');
      }
    } catch (err) {
      console.error('Error sending recommendations:', err);
      alert(err.message || 'Error sending recommendations. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="landing-page">
      <Header 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory}
      />
      <div className="map-section">
        <Map />
      </div>

      <div className="charts-container">
        {/* Line Chart */}
        <div className="chart-section">
          <h3>Monthly Sales Trends (Predictions)</h3>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={salesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                style={{ filter: 'drop-shadow(0px 20px 30px rgba(0, 0, 0, 0.15))' }}
              >
                <defs>
                  <filter id="line-shadow" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                  <linearGradient id="colorClothing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF5350" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF5350" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorElectronics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#42A5F5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFurniture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFA726" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFA726" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGroceries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#66BB6A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorToys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AB47BC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#AB47BC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke="rgba(255,255,255,0.2)"
                />
                <XAxis 
                  dataKey="month" 
                  stroke="#1a237e"
                  tick={{ fill: '#1a237e' }}
                  axisLine={{ stroke: '#1a237e', strokeWidth: 2 }}
                />
                <YAxis 
                  stroke="#1a237e"
                  tick={{ fill: '#1a237e' }}
                  axisLine={{ stroke: '#1a237e', strokeWidth: 2 }}
                  domain={[20, 30]}
                  ticks={[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]}
                  interval={0}
                  tickFormatter={(value) => value.toFixed(0)}
                  allowDataOverflow={true}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="Clothing" 
                  stroke="#EF5350" 
                  strokeWidth={3}
                  dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                  filter="url(#line-shadow)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Electronics" 
                  stroke="#42A5F5" 
                  strokeWidth={3}
                  dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                  filter="url(#line-shadow)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Furniture" 
                  stroke="#FFA726" 
                  strokeWidth={3}
                  dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                  filter="url(#line-shadow)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Groceries" 
                  stroke="#66BB6A" 
                  strokeWidth={3}
                  dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                  filter="url(#line-shadow)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Toys" 
                  stroke="#AB47BC" 
                  strokeWidth={3}
                  dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                  filter="url(#line-shadow)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <h3>Monthly Sales Distribution 2021</h3>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={getHistoricalSalesData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              stackOffset="none"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="#E0E0E0"
              />
              <XAxis 
                dataKey="month"
                stroke="#666"
                tick={{ fill: '#666' }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fill: '#666' }}
                domain={[0, 50]}
                tickFormatter={(value) => `${value.toFixed(0)}M`}
              />
              <Tooltip
                formatter={(value, name) => [`$${value.toFixed(2)}M`, name]}
                contentStyle={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '8px'
                }}
              />
              <Legend />
              {selectedCategory === 'All' ? (
                // Stacked bars for all categories
                Object.entries(categoryColors).map(([category, color]) => (
                  <Bar 
                    key={category}
                    dataKey={category}
                    stackId="sales"
                    fill={color}
                  >
                    <LabelList
                      dataKey={category}
                      position="center"
                      formatter={(value) => value?.toFixed(1)}
                      style={{
                        fill: 'white',
                        fontSize: '11px',
                        fontWeight: '500',
                        textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                      }}
                    />
                  </Bar>
                ))
              ) : (
                // Single bar for selected category
                <Bar 
                  dataKey={selectedCategory}
                  fill={categoryColors[selectedCategory]}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    position="top"
                    formatter={(value) => `$${value?.toFixed(2)}M`}
                    style={{
                      fill: '#666',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modified recommendations section */}
      <div className="recommendations-section">
        <div className="user-input-container">
          <h3>Personalized Recommendations</h3>
          <p className="recommendation-subtitle">
            Based on your past purchases, we recommend these stores and products
          </p>
          <form onSubmit={handleUserIdSubmit} className="user-form">
            <div className="input-group">
              <label htmlFor="userId">User ID:</label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <button type="submit" className="fetch-button">
              Get Recommendations
            </button>
          </form>
        </div>

        {isLoadingRecommendations ? (
          <div className="loading">Loading recommendations...</div>
        ) : showRecommendations && (
          <>
            <div className="recommendations-grid">
              {recommendations.map((item) => (
                <div key={item.product_id} className="recommendation-card">
                  <div className="store-badge">{item.storeName}</div>
                  <div className="recommendation-header">
                    <h4>{item.category}</h4>
                    <span className="price">₹{item.price.toFixed(2)}</span>
                  </div>
                  {item.offers && item.offers.length > 0 && (
                    <div className="offers-container">
                      <div className="best-offer">
                        <span className="offer-label">Best Offer:</span>
                        <span className="offer-value">{item.offers[0].discount}</span>
                      </div>
                      {item.offers[0].min_purchase > 0 && (
                        <div className="min-purchase">
                          Min. purchase: ₹{item.offers[0].min_purchase}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="email-section">
              <button 
                className={`email-button ${emailSending ? 'sending' : ''} ${emailSent ? 'sent' : ''}`}
                onClick={handleSendRecommendations}
                disabled={emailSending || emailSent}
              >
                {emailSending ? 'Sending...' : emailSent ? 'Sent!' : 'Send Recommendations to Email'}
              </button>
              {emailSent && (
                <div className="success-message">
                  Recommendations sent successfully!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LandingPage; 