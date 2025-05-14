'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Paper, Typography, TextField, Button } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';

const widgetStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 9999,
};

const chatBoxStyle: React.CSSProperties = {
  width: 340,
  height: 420,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: '👋 Hi! I am your onboarding assistant. How can I help you get started?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    setInput('');
    // Placeholder: echo bot
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: 'bot', text: "I'm here to help! (AI integration coming soon)" }]);
    }, 600);
  };

  return (
    <div style={widgetStyle}>
      {!open && (
        <IconButton
          size="large"
          onClick={() => setOpen(true)}
          sx={{ background: 'var(--primary, #7F7BBA)', boxShadow: 2, '&:hover': { background: 'var(--primary, #6c68a5)' } }}
        >
          <ChatBubbleOutlineIcon fontSize="large" sx={{ color: 'white' }} />
        </IconButton>
      )}
      {open && (
        <Paper sx={chatBoxStyle}>
          <Box display="flex" alignItems="center" justifyContent="space-between" p={2} borderBottom={1} borderColor="#eee">
            <Typography variant="subtitle1" fontWeight={600}>Onboarding Assistant</Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box flex={1} p={2} overflow="auto" bgcolor="#fafbfc">
            {messages.map((msg, idx) => (
              <Box key={idx} mb={1} textAlign={msg.from === 'user' ? 'right' : 'left'}>
                <Box
                  component="span"
                  px={2}
                  py={1}
                  borderRadius={2}
                  bgcolor={msg.from === 'user' ? 'primary.light' : 'grey.200'}
                  color={msg.from === 'user' ? 'primary.contrastText' : 'text.primary'}
                  display="inline-block"
                >
                  {msg.text}
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
          <Box p={2} borderTop={1} borderColor="#eee" display="flex" gap={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <Button variant="contained" onClick={handleSend} disabled={!input.trim()}>Send</Button>
          </Box>
        </Paper>
      )}
    </div>
  );
};

export default ChatWidget; 