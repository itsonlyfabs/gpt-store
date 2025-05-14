import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Grid } from '@mui/material';

const Admin = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Analytics" />
          <Tab label="Products" />
          <Tab label="Users" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {currentTab === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Analytics dashboard coming soon.</Typography>
        </Box>
      )}
      {/* Add other tab content components here */}
    </Box>
  );
};

export default Admin; 