import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Doc {
  id: string;
  title: string;
  subtitle: string;
  context: string;
  created_at: string;
}

function getSupabaseToken() {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('sb-tcmkyzcbndmaqxfjvpfs-auth-token');
    if (token) return JSON.parse(token)[0] as string;
    const match = document.cookie.match(/sb-tcmkyzcbndmaqxfjvpfs-auth-token=([^;]+)/);
    if (match && match[1]) {
      try {
        return JSON.parse(decodeURIComponent(match[1]))[0] as string;
      } catch {}
    }
  }
  return '';
}

const DocumentationAdmin = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', context: '' });

  const fetchDocs = async () => {
    setLoading(true);
    const accessToken = getSupabaseToken();
    const res = await fetch('/api/admin/documentation', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleOpen = (doc?: Doc) => {
    setEditDoc(doc || null);
    setForm(doc ? { title: doc.title, subtitle: doc.subtitle, context: doc.context } : { title: '', subtitle: '', context: '' });
    setOpen(true);
  };
  const handleClose = () => { setOpen(false); setEditDoc(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const accessToken = getSupabaseToken();
    if (editDoc) {
      await fetch(`/api/admin/documentation/${editDoc.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/admin/documentation', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(form) });
    }
    handleClose();
    await fetchDocs();
  };

  const handleDelete = async (id: string) => {
    const accessToken = getSupabaseToken();
    await fetch(`/api/admin/documentation/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
    fetchDocs();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Documentation</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Create Doc</Button>
      </Box>
      <Paper>
        <List>
          {docs.map(doc => (
            <ListItem key={doc.id} divider>
              <ListItemText primary={doc.title} secondary={doc.subtitle} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleOpen(doc)}><EditIcon /></IconButton>
                <IconButton edge="end" color="error" onClick={() => handleDelete(doc.id)}><DeleteIcon /></IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editDoc ? 'Edit Document' : 'Create Doc'}</DialogTitle>
        <DialogContent>
          <TextField label="Title" name="title" value={form.title} onChange={handleChange} fullWidth margin="normal" />
          <TextField label="Subtitle" name="subtitle" value={form.subtitle} onChange={handleChange} fullWidth margin="normal" />
          <TextField label="Context" name="context" value={form.context} onChange={handleChange} fullWidth margin="normal" multiline rows={4} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentationAdmin; 