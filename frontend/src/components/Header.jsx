import { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ selectedCategory, setSelectedCategory }) => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['Clothing', 'Electronics', 'Furniture', 'Groceries', 'Toys'];
  const categoryIds = { Clothing: 0, Electronics: 1, Furniture: 2, Groceries: 3, Toys: 4 };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/avg_data?product_category=${categoryIds[selectedCategory]}`);
        const data = await response.json();
        
        // Calculate averages and percentage changes
        const monthlyData = Object.values(data.sales_2021);
        const metrics = {
          avg_purchase_value: {
            value: monthlyData.reduce((acc, month) => acc + month.avg_purchase_value, 0) / 12,
            change: calculatePercentageChange(monthlyData, 'avg_purchase_value')
          },
          avg_transaction_value: {
            value: monthlyData.reduce((acc, month) => acc + month.avg_transaction_value, 0) / 12,
            change: calculatePercentageChange(monthlyData, 'avg_transaction_value')
          },
          total_sales: {
            value: monthlyData.reduce((acc, month) => acc + month.total_sales, 0) / 12,
            change: calculatePercentageChange(monthlyData, 'total_sales')
          },
          total_transactions: {
            value: monthlyData.reduce((acc, month) => acc + month.total_transactions, 0) / 12,
            change: calculatePercentageChange(monthlyData, 'total_transactions')
          }
        };
        
        setMetrics(metrics);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedCategory]);

  const calculatePercentageChange = (data, field) => {
    const firstMonth = data[0][field];
    const lastMonth = data[data.length - 1][field];
    return ((lastMonth - firstMonth) / firstMonth) * 100;
  };

  const formatValue = (value, type) => {
    if (type.includes('avg')) return `$${value.toFixed(2)}`;
    if (type.includes('total_sales')) return `$${(value / 1000000).toFixed(2)}M`;
    return value.toLocaleString('en-US');
  };

  if (isLoading) return <div className="header-loading">Loading metrics...</div>;

  return (
    <div className="metrics-header">
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="metrics-container">
        <div className="metric-card">
          <h3>Average Purchase Value</h3>
          <h2>{formatValue(metrics.avg_purchase_value.value, 'avg_purchase')}</h2>
          <p className={metrics.avg_purchase_value.change >= 0 ? 'trend-up' : 'trend-down'}>
            {metrics.avg_purchase_value.change >= 0 ? '↑' : '↓'} 
            {Math.abs(metrics.avg_purchase_value.change).toFixed(1)}% Last month
          </p>
        </div>

        <div className="metric-card">
          <h3>Average Transaction Value</h3>
          <h2>{formatValue(metrics.avg_transaction_value.value, 'avg_transaction')}</h2>
          <p className={metrics.avg_transaction_value.change >= 0 ? 'trend-up' : 'trend-down'}>
            {metrics.avg_transaction_value.change >= 0 ? '↑' : '↓'} 
            {Math.abs(metrics.avg_transaction_value.change).toFixed(1)}% Last month
          </p>
        </div>

        <div className="metric-card">
          <h3>Total Sales</h3>
          <h2>{formatValue(metrics.total_sales.value, 'total_sales')}</h2>
          <p className={metrics.total_sales.change >= 0 ? 'trend-up' : 'trend-down'}>
            {metrics.total_sales.change >= 0 ? '↑' : '↓'} 
            {Math.abs(metrics.total_sales.change).toFixed(1)}% Last month
          </p>
        </div>

        <div className="metric-card">
          <h3>Total Transactions</h3>
          <h2>{formatValue(metrics.total_transactions.value, 'total_transactions')}</h2>
          <p className={metrics.total_transactions.change >= 0 ? 'trend-up' : 'trend-down'}>
            {metrics.total_transactions.change >= 0 ? '↑' : '↓'} 
            {Math.abs(metrics.total_transactions.change).toFixed(1)}% Last month
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;