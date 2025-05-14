import React, { useEffect, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsData {
  userGrowth: { month: string; newUsers: number; activeUsers?: number }[];
  productUsage: { id: string; label: string; value: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 24,
};
const halfWidth: React.CSSProperties = {
  flex: '1 1 45%',
  minWidth: 300,
  maxWidth: '48%',
};
const fullWidth: React.CSSProperties = {
  flex: '1 1 100%',
  minWidth: 300,
  maxWidth: '100%',
};

const exampleUserGrowth = [
  { month: 'Jan', newUsers: 10 },
  { month: 'Feb', newUsers: 20 },
  { month: 'Mar', newUsers: 15 },
];
const exampleProductUsage = [
  { id: 'Product A', label: 'Product A', value: 30 },
  { id: 'Product B', label: 'Product B', value: 20 },
];
const exampleMonthlyRevenue = [
  { month: 'Jan', amount: 1000 },
  { month: 'Feb', amount: 1500 },
  { month: 'Mar', amount: 1200 },
];
const isDev = process.env.NODE_ENV === 'development';

const AdminAnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { session } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`${backendUrl}/admin/analytics`, {
          credentials: 'include',
          headers,
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    if (session?.access_token) fetchData();
  }, [session]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>;
  if (error || !data) return <Box p={4} textAlign="center"><Typography color="error">{error || 'No data'}</Typography></Box>;

  // Use example data in dev, or show empty state in prod
  const userGrowthData = data.userGrowth.length === 0 && isDev ? exampleUserGrowth : data.userGrowth;
  const productUsageData = data.productUsage.length === 0 && isDev ? exampleProductUsage : data.productUsage;
  const monthlyRevenueData = data.monthlyRevenue.length === 0 && isDev ? exampleMonthlyRevenue : data.monthlyRevenue;

  return (
    <Box>
      <div style={gridStyle}>
        {/* User Growth */}
        <div style={halfWidth}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>User Growth Over Time</Typography>
            {userGrowthData.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={350}>
                <Typography color="textSecondary">No user growth data available yet.</Typography>
              </Box>
            ) : (
              <ResponsiveBar
                data={userGrowthData}
                keys={['newUsers']}
                indexBy="month"
                margin={{ top: 40, right: 30, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Month',
                  legendPosition: 'middle',
                  legendOffset: 32
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Users',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                legends={[]}
                animate={true}
              />
            )}
          </Paper>
        </div>
        {/* Product Usage */}
        <div style={halfWidth}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Product Usage</Typography>
            {productUsageData.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={350}>
                <Typography color="textSecondary">No product usage data available yet.</Typography>
              </Box>
            ) : (
              <ResponsiveBar
                data={productUsageData}
                keys={["value"]}
                indexBy="label"
                margin={{ top: 40, right: 30, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Product',
                  legendPosition: 'middle',
                  legendOffset: 32
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Usage',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                animate={true}
              />
            )}
          </Paper>
        </div>
        {/* Revenue Over Time */}
        <div style={fullWidth}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Revenue Over Time</Typography>
            {monthlyRevenueData.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={350}>
                <Typography color="textSecondary">No revenue data available yet.</Typography>
              </Box>
            ) : (
              <ResponsiveLine
                data={[
                  {
                    id: 'revenue',
                    data: monthlyRevenueData.map(item => ({ x: item.month, y: item.amount }))
                  }
                ]}
                margin={{ top: 40, right: 30, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Month',
                  legendPosition: 'middle',
                  legendOffset: 32
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Revenue ($)',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                useMesh={true}
                legends={[]}
              />
            )}
          </Paper>
        </div>
      </div>
    </Box>
  );
};

export default AdminAnalyticsDashboard; 