'use client'
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminSidebar from '@/components/AdminSidebar';
import MDEditor from '@uiw/react-md-editor';
import { marked } from 'marked';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface Email {
  id: string;
  title: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  type: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    type: 'marketing',
    body: '',
    scheduled_at: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string>('');
  const [sendLog, setSendLog] = useState<string[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<'created_at' | 'scheduled_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);

  const fetchEmails = () => {
    setLoading(true);
    fetch('/api/admin/emails')
      .then(res => res.json())
      .then(data => {
        setEmails(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load emails');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmails();
  }, [showForm, formSuccess]);

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const html = marked(form.body || '');
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          type: form.type,
          body_html: html,
          body_text: form.body,
          scheduled_at: form.scheduled_at || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create email');
      setFormSuccess('Email created!');
      setShowForm(false);
      setForm({ title: '', subject: '', type: 'marketing', body: '', scheduled_at: '' });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create email');
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (email: Email) => {
    setEditId(email.id);
    setForm({
      title: email.title,
      subject: email.subject,
      type: email.type,
      body: email.body_html || '',
      scheduled_at: email.scheduled_at ? email.scheduled_at.slice(0, 16) : ''
    });
    setShowForm(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const html = marked(form.body || '');
      const res = await fetch(`/api/admin/emails/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          type: form.type,
          body_html: html,
          body_text: form.body,
          scheduled_at: form.scheduled_at || null,
          status: form.scheduled_at ? 'scheduled' : 'draft'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update email');
      setFormSuccess('Email updated!');
      setShowForm(false);
      setEditId(null);
      setForm({ title: '', subject: '', type: 'marketing', body: '', scheduled_at: '' });
      fetchEmails();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update email');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this email?')) return;
    const res = await fetch(`/api/admin/emails/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFormSuccess('Email deleted');
    } else {
      setFormError('Failed to delete email');
    }
  };

  const handleSend = async (id: string) => {
    setSendResult('Sending...');
    setSendLog([]);
    const res = await fetch(`/api/admin/emails/${id}/send`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setSendResult(`Sent: ${data.sent}, Failed: ${data.failed}`);
      setSendLog(data.log ? (Array.isArray(data.log) ? data.log : [data.log]) : []);
      fetchEmails();
    } else {
      setSendResult(data.error || 'Failed to send');
      setSendLog(data.log ? (Array.isArray(data.log) ? data.log : [data.log]) : []);
    }
    setTimeout(() => { setSendResult(''); setSendLog([]); }, 10000);
  };

  // Filtering and sorting logic
  const filteredEmails = emails
    .filter(email =>
      (filterType === 'all' || email.type === filterType) &&
      (filterStatus === 'all' || email.status === filterStatus)
    )
    .sort((a, b) => {
      const aVal = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
      const bVal = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Calendar events: map scheduled emails to dates
  const scheduledEmails = emails.filter(e => !!e.scheduled_at);
  const calendarEvents: Record<string, { type: string; id: string; title: string }[]> = {};
  scheduledEmails.forEach(e => {
    if (e.scheduled_at) {
      const date = e.scheduled_at.slice(0, 10); // YYYY-MM-DD
      if (!calendarEvents[date]) calendarEvents[date] = [];
      calendarEvents[date].push({ type: e.type, id: e.id, title: e.title });
    }
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">Admin: Emails</h1>
          {/* Filtering controls */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <div>
              <label className="mr-2 font-medium">Type:</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-2 py-1">
                <option value="all">All</option>
                <option value="marketing">Marketing</option>
                <option value="transactional">Transactional</option>
              </select>
            </div>
            <div>
              <label className="mr-2 font-medium">Status:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
              </select>
            </div>
            <button
              className="ml-auto px-3 py-1 bg-primary text-white rounded hover:bg-primary/90"
              onClick={() => setCalendarOpen(v => !v)}
            >
              {calendarOpen ? 'Hide Calendar' : 'Show Calendar'}
            </button>
          </div>
          {/* Calendar */}
          {calendarOpen && (
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <Calendar
                value={calendarDate}
                onClickDay={date => {
                  setCalendarDate(date);
                  setShowForm(true);
                  setForm(f => ({ ...f, scheduled_at: date.toISOString().slice(0, 16) }));
                }}
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const key = date.toISOString().slice(0, 10);
                  const events = calendarEvents[key] || [];
                  return (
                    <div className="flex gap-1 mt-1">
                      {events.map((ev, i) => (
                        <span
                          key={ev.id}
                          title={ev.title}
                          className={`inline-block w-2 h-2 rounded-full ${ev.type === 'transactional' ? 'bg-blue-500' : 'bg-purple-500'}`}
                        />
                      ))}
                    </div>
                  );
                }}
              />
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500" /> Transactional</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-purple-500" /> Marketing</span>
              </div>
            </div>
          )}
          {/* Create Email button */}
          <button
            className="mb-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => setShowForm(true)}
          >
            + Create Email
          </button>
          {/* Table with sortable headers */}
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Status</th>
                <th
                  className="p-2 text-left cursor-pointer select-none hover:underline"
                  onClick={() => {
                    setSortField('scheduled_at');
                    setSortOrder(o => (sortField === 'scheduled_at' && o === 'desc') ? 'asc' : 'desc');
                  }}
                >
                  Scheduled {sortField === 'scheduled_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className="p-2 text-left cursor-pointer select-none hover:underline"
                  onClick={() => {
                    setSortField('created_at');
                    setSortOrder(o => (sortField === 'created_at' && o === 'desc') ? 'asc' : 'desc');
                  }}
                >
                  Created {sortField === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.map(email => (
                <tr key={email.id} className="border-t">
                  <td className="p-2">{email.title}</td>
                  <td className="p-2 capitalize">{email.type}</td>
                  <td className="p-2 capitalize">{email.status}</td>
                  <td className="p-2">{email.scheduled_at ? new Date(email.scheduled_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                  <td className="p-2">{new Date(email.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => openEdit(email)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                    <button onClick={() => handleDelete(email.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                    <button onClick={() => handleSend(email.id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Send</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>
                <h2 className="text-lg font-bold mb-4">Create Email</h2>
                <form onSubmit={editId ? handleEdit : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => handleFormChange('title', e.target.value)}
                      className="mt-1 block w-full border rounded px-2 py-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => handleFormChange('subject', e.target.value)}
                      className="mt-1 block w-full border rounded px-2 py-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Type</label>
                    <select
                      value={form.type}
                      onChange={e => handleFormChange('type', e.target.value)}
                      className="mt-1 block w-full border rounded px-2 py-1"
                    >
                      <option value="marketing">Marketing</option>
                      <option value="transactional">Transactional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Body (Markdown supported)</label>
                    <div className="mt-1">
                      <MDEditor
                        value={form.body}
                        onChange={v => handleFormChange('body', v || '')}
                        height={200}
                        previewOptions={{}} // can customize preview if needed
                        textareaProps={{ placeholder: 'Write your email content in Markdown...' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Schedule (optional)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="datetime-local"
                        value={form.scheduled_at}
                        onChange={e => handleFormChange('scheduled_at', e.target.value)}
                        className="mt-1 block w-full border rounded px-2 py-1"
                      />
                      {form.scheduled_at && (
                        <button
                          type="button"
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          onClick={() => handleFormChange('scheduled_at', '')}
                        >
                          Clear Schedule
                        </button>
                      )}
                    </div>
                  </div>
                  {formError && <div className="text-red-600">{formError}</div>}
                  {formSuccess && <div className="text-green-600">{formSuccess}</div>}
                  {sendResult && <div className="mt-2 text-blue-700">{sendResult}</div>}
                  {sendLog.length > 0 && (
                    <pre className="mt-2 p-2 bg-gray-100 text-xs text-gray-800 rounded overflow-x-auto max-h-40">{sendLog.join('\n')}</pre>
                  )}
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  >
                    {formLoading ? 'Saving...' : 'Save Email'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 