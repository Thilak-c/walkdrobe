// Reports utility functions

// Format currency values
export const formatCurrency = (amount, currency = '₹') => {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

// Format numbers with commas
export const formatNumber = (number) => {
  return number.toLocaleString('en-IN');
};

// Format percentage values
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// Calculate growth percentage
export const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Get growth type (positive, negative, neutral)
export const getGrowthType = (growth) => {
  if (growth > 0) return 'positive';
  if (growth < 0) return 'negative';
  return 'neutral';
};

// Format date for display
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN');
  } else if (format === 'long') {
    return d.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } else if (format === 'datetime') {
    return d.toLocaleString('en-IN');
  }
  
  return d.toISOString();
};

// Generate date range options
export const getDateRangeOptions = () => {
  const now = new Date();
  const ranges = [
    {
      label: 'Last 7 days',
      value: '7d',
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now
    },
    {
      label: 'Last 30 days',
      value: '30d',
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now
    },
    {
      label: 'Last 90 days',
      value: '90d',
      start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      end: now
    },
    {
      label: 'Last year',
      value: '1y',
      start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      end: now
    }
  ];
  
  return ranges;
};

// Calculate time-based groupings
export const groupDataByTime = (data, timeField, interval = 'day') => {
  const groups = {};
  
  data.forEach(item => {
    const date = new Date(item[timeField]);
    let key;
    
    switch (interval) {
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  
  return groups;
};

// Calculate statistics for grouped data
export const calculateGroupStats = (groups, valueField) => {
  return Object.entries(groups).map(([key, items]) => {
    const values = items.map(item => item[valueField] || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      key,
      count: items.length,
      sum,
      avg,
      min,
      max
    };
  }).sort((a, b) => a.key.localeCompare(b.key));
};

// Generate chart data for time series
export const generateTimeSeriesData = (data, timeField, valueField, interval = 'day') => {
  const groups = groupDataByTime(data, timeField, interval);
  const stats = calculateGroupStats(groups, valueField);
  
  return {
    labels: stats.map(stat => stat.key),
    data: stats.map(stat => stat.sum),
    counts: stats.map(stat => stat.count)
  };
};

// Generate pie chart data
export const generatePieChartData = (data, labelField, valueField) => {
  const groups = {};
  
  data.forEach(item => {
    const label = item[labelField] || 'Unknown';
    const value = item[valueField] || 0;
    
    if (!groups[label]) {
      groups[label] = 0;
    }
    groups[label] += value;
  });
  
  return {
    labels: Object.keys(groups),
    data: Object.values(groups)
  };
};

// Calculate top performers
export const getTopPerformers = (data, valueField, limit = 10) => {
  return data
    .sort((a, b) => (b[valueField] || 0) - (a[valueField] || 0))
    .slice(0, limit);
};

// Calculate bottom performers
export const getBottomPerformers = (data, valueField, limit = 10) => {
  return data
    .sort((a, b) => (a[valueField] || 0) - (b[valueField] || 0))
    .slice(0, limit);
};

// Generate summary statistics
export const generateSummaryStats = (data, valueField) => {
  const values = data.map(item => item[valueField] || 0);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = values.length > 0 ? sum / values.length : 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate median
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  return {
    count: values.length,
    sum,
    avg,
    min,
    max,
    median
  };
};

// Export data to CSV
export const exportToCSV = (data, filename, fields = null) => {
  if (!data || data.length === 0) return;
  
  const headers = fields || Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = value ? value.toString().replace(/"/g, '""') : '';
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Export data to JSON
export const exportToJSON = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Generate report title
export const generateReportTitle = (type, dateRange, period) => {
  const dateStr = dateRange ? 
    `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}` : 
    period || 'All Time';
  
  return `${type} Report - ${dateStr}`;
};

// Validate date range
export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  if (start > now) {
    return { valid: false, error: 'Start date cannot be in the future' };
  }
  
  if (end > now) {
    return { valid: false, error: 'End date cannot be in the future' };
  }
  
  return { valid: true };
};

// Generate color palette for charts
export const generateColorPalette = (count) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(14, 165, 233, 0.8)',   // Sky
    'rgba(34, 197, 94, 0.8)',    // Emerald
    'rgba(251, 146, 60, 0.8)',   // Orange
    'rgba(168, 85, 247, 0.8)',   // Violet
  ];
  
  return colors.slice(0, count);
};

// Calculate conversion rate
export const calculateConversionRate = (conversions, total) => {
  if (!total || total === 0) return 0;
  return (conversions / total) * 100;
};

// Calculate average order value
export const calculateAOV = (totalRevenue, totalOrders) => {
  if (!totalOrders || totalOrders === 0) return 0;
  return totalRevenue / totalOrders;
};

// Calculate customer lifetime value (simplified)
export const calculateCLV = (averageOrderValue, averageOrdersPerCustomer, profitMargin = 0.3) => {
  return averageOrderValue * averageOrdersPerCustomer * profitMargin;
};

// Generate trend analysis
export const generateTrendAnalysis = (current, previous) => {
  const growth = calculateGrowth(current, previous);
  const growthType = getGrowthType(growth);
  
  let trend = 'stable';
  let description = 'No significant change';
  
  if (Math.abs(growth) > 10) {
    trend = growthType === 'positive' ? 'increasing' : 'decreasing';
    description = `${growthType === 'positive' ? 'Significant increase' : 'Significant decrease'} of ${Math.abs(growth).toFixed(1)}%`;
  } else if (Math.abs(growth) > 5) {
    trend = growthType === 'positive' ? 'slightly increasing' : 'slightly decreasing';
    description = `${growthType === 'positive' ? 'Slight increase' : 'Slight decrease'} of ${Math.abs(growth).toFixed(1)}%`;
  }
  
  return {
    growth,
    growthType,
    trend,
    description
  };
};
