/**
 * API Limits Counter Component
 * 
 * Displays API usage limits and consumption for all providers.
 * Tracks daily, weekly, and monthly usage with visual progress bars.
 * Persists usage data in localStorage.
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import styles from './LimitsCounter.module.css';

/**
 * Provider limits configuration (free tier)
 */
const PROVIDER_LIMITS = {
  // OpenRouter - Temporarily hidden (commented out)
  // openrouter: {
  //   name: 'OpenRouter',
  //   daily: 50,
  //   weekly: 350,  // 50 * 7
  //   monthly: 1500 // 50 * 30
  // },
  huggingface: {
    name: 'Hugging Face',
    daily: 1000,
    weekly: 7000,   // 1000 * 7
    monthly: 30000  // 1000 * 30
  },
  moonshot: {
    name: 'Moonshot',
    daily: 200,     // Estimated based on typical free tier
    weekly: 1400,   // 200 * 7
    monthly: 6000   // 200 * 30
  }
};

/**
 * Get usage data from localStorage
 */
const getUsageData = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem('api_usage_data');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load usage data:', error);
    return null;
  }
};

/**
 * Save usage data to localStorage
 */
const saveUsageData = (data) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('api_usage_data', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save usage data:', error);
  }
};

/**
 * Initialize usage data structure
 */
const initializeUsageData = () => {
  const now = new Date();
  return {
    openrouter: { daily: 0, weekly: 0, monthly: 0 },
    huggingface: { daily: 0, weekly: 0, monthly: 0 },
    moonshot: { daily: 0, weekly: 0, monthly: 0 },
    lastReset: {
      daily: now.toISOString(),
      weekly: now.toISOString(),
      monthly: now.toISOString()
    }
  };
};

/**
 * Check if reset is needed based on time period
 */
const needsReset = (lastResetDate, period) => {
  const now = new Date();
  const lastReset = new Date(lastResetDate);
  
  if (period === 'daily') {
    return now.toDateString() !== lastReset.toDateString();
  } else if (period === 'weekly') {
    const daysSince = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
  } else if (period === 'monthly') {
    return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  }
  
  return false;
};

/**
 * @typedef {Object} LimitsCounterProps
 * @property {string} currentProvider - Currently selected provider
 * @property {number} requestsUsed - Number of requests used in current generation
 */

/**
 * LimitsCounter component for tracking API usage
 * @param {LimitsCounterProps} props
 */
export default function LimitsCounter({ currentProvider = 'openrouter', requestsUsed = 0 }) {
  const [usageData, setUsageData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Initialize usage data on mount
  useEffect(() => {
    let data = getUsageData();
    
    if (!data) {
      data = initializeUsageData();
      saveUsageData(data);
    } else {
      // Check if resets are needed
      let needsSave = false;
      
      if (needsReset(data.lastReset.daily, 'daily')) {
        Object.keys(data).forEach(key => {
          if (key !== 'lastReset') {
            data[key].daily = 0;
          }
        });
        data.lastReset.daily = new Date().toISOString();
        needsSave = true;
      }
      
      if (needsReset(data.lastReset.weekly, 'weekly')) {
        Object.keys(data).forEach(key => {
          if (key !== 'lastReset') {
            data[key].weekly = 0;
          }
        });
        data.lastReset.weekly = new Date().toISOString();
        needsSave = true;
      }
      
      if (needsReset(data.lastReset.monthly, 'monthly')) {
        Object.keys(data).forEach(key => {
          if (key !== 'lastReset') {
            data[key].monthly = 0;
          }
        });
        data.lastReset.monthly = new Date().toISOString();
        needsSave = true;
      }
      
      if (needsSave) {
        saveUsageData(data);
      }
    }
    
    setUsageData(data);
  }, []);

  // Update usage when requestsUsed changes
  useEffect(() => {
    if (requestsUsed > 0 && usageData && currentProvider) {
      const newData = { ...usageData };
      
      if (newData[currentProvider]) {
        newData[currentProvider].daily += requestsUsed;
        newData[currentProvider].weekly += requestsUsed;
        newData[currentProvider].monthly += requestsUsed;
        
        setUsageData(newData);
        saveUsageData(newData);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestsUsed]);

  // Calculate percentage for progress bar
  const calculatePercentage = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  // Get color based on usage percentage
  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#f44336'; // Red
    if (percentage >= 70) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  // Format time until next reset
  const getTimeUntilReset = (period) => {
    if (!usageData) return '';
    
    const now = new Date();
    const lastReset = new Date(usageData.lastReset[period]);
    
    if (period === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const hours = Math.floor((tomorrow - now) / (1000 * 60 * 60));
      return `Resets in ${hours}h`;
    } else if (period === 'weekly') {
      const nextWeek = new Date(lastReset);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const days = Math.ceil((nextWeek - now) / (1000 * 60 * 60 * 24));
      return `Resets in ${days}d`;
    } else if (period === 'monthly') {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      const days = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
      return `Resets in ${days}d`;
    }
    
    return '';
  };

  if (!usageData) {
    return <div className={styles.limitsCounter}>Loading usage data...</div>;
  }

  return (
    <div className={styles.limitsCounter}>
      <button 
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.headerIcon}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className={styles.headerTitle}>API Usage Limits (Free Tier)</span>
      </button>

      {isExpanded && (
        <div className={styles.content}>
          {Object.keys(PROVIDER_LIMITS).map(providerKey => {
            const provider = PROVIDER_LIMITS[providerKey];
            const usage = usageData[providerKey];
            
            return (
              <div 
                key={providerKey} 
                className={`${styles.providerSection} ${currentProvider === providerKey ? styles.active : ''}`}
              >
                <h3 className={styles.providerName}>
                  {provider.name}
                  {currentProvider === providerKey && <span className={styles.activeBadge}>Active</span>}
                </h3>

                {/* Daily Usage */}
                <div className={styles.usageRow}>
                  <div className={styles.usageLabel}>
                    <span>Daily</span>
                    <span className={styles.resetTime}>{getTimeUntilReset('daily')}</span>
                  </div>
                  <div className={styles.usageBar}>
                    <div 
                      className={styles.usageProgress}
                      style={{
                        width: `${calculatePercentage(usage.daily, provider.daily)}%`,
                        backgroundColor: getUsageColor(calculatePercentage(usage.daily, provider.daily))
                      }}
                    />
                  </div>
                  <div className={styles.usageStats}>
                    {usage.daily} / {provider.daily}
                  </div>
                </div>

                {/* Weekly Usage */}
                <div className={styles.usageRow}>
                  <div className={styles.usageLabel}>
                    <span>Weekly</span>
                    <span className={styles.resetTime}>{getTimeUntilReset('weekly')}</span>
                  </div>
                  <div className={styles.usageBar}>
                    <div 
                      className={styles.usageProgress}
                      style={{
                        width: `${calculatePercentage(usage.weekly, provider.weekly)}%`,
                        backgroundColor: getUsageColor(calculatePercentage(usage.weekly, provider.weekly))
                      }}
                    />
                  </div>
                  <div className={styles.usageStats}>
                    {usage.weekly} / {provider.weekly}
                  </div>
                </div>

                {/* Monthly Usage */}
                <div className={styles.usageRow}>
                  <div className={styles.usageLabel}>
                    <span>Monthly</span>
                    <span className={styles.resetTime}>{getTimeUntilReset('monthly')}</span>
                  </div>
                  <div className={styles.usageBar}>
                    <div 
                      className={styles.usageProgress}
                      style={{
                        width: `${calculatePercentage(usage.monthly, provider.monthly)}%`,
                        backgroundColor: getUsageColor(calculatePercentage(usage.monthly, provider.monthly))
                      }}
                    />
                  </div>
                  <div className={styles.usageStats}>
                    {usage.monthly} / {provider.monthly}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
