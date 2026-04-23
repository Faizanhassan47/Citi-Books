import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';

export function Clients() {
  const { user } = useStore();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null);

  const loadClients = async () => {
    setLoading(true);

    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, payload);
        toast.success('Client updated successfully');
      } else {
        await api.createClient(payload);
        toast.success('Client added successfully');
      }

      e.target.reset();
      setEditingClient(null);
      await loadClients();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await api.deleteClient(id);
      toast.success('Client deleted');
      await loadClients();
    } catch (e) {
      toast.error('Failed to delete client');
    }
  };

  const filteredClients = clients.filter((client) => {
    if (!searchTerm) {
      return true;
    }

    const q = searchTerm.toLowerCase();
    return [client.name, client.phone, client.city, client.notes]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));
  });

  if (loading) {
    return <div>Loading clients...</div>;
  }

  return (
    <section className="page-shell clients-page">
      <section className="section-grid two">
        <article className="form-card reveal is-visible">
          <h3 className="section-title">{editingClient ? 'Edit client' : 'Add new client'}</h3>
          <p className="section-copy">Register a new customer or update existing records in the database.</p>
          <form className="form-grid" onSubmit={handleSubmit} key={editingClient?.id || 'new'}>
            <div className="field">
              <label>Client name</label>
              <input name="name" defaultValue={editingClient?.name || ''} required />
            </div>
            <div className="field">
              <label>City</label>
              <input name="city" defaultValue={editingClient?.city || ''} required />
            </div>
            <div className="field">
              <label>Phone</label>
              <input name="phone" defaultValue={editingClient?.phone || ''} required />
            </div>
            <div className="field full">
              <label>Notes</label>
              <textarea name="notes" defaultValue={editingClient?.notes || ''} />
            </div>
            <div className="field full">
              <div className="action-row">
                <button className="button" type="submit">{editingClient ? 'Update client' : 'Save client'}</button>
                {editingClient && (
                  <button className="ghost-button" type="button" onClick={() => setEditingClient(null)}>Cancel edit</button>
                )}
              </div>
            </div>
          </form>
        </article>

        <article className="panel-card reveal is-visible">
          <h3 className="section-title">Client directory</h3>
          <p className="section-copy">
            {user?.role === 'owner' 
              ? 'Manage your full client database and records.' 
              : 'Browse the client directory for city and contact information.'}
          </p>
          <div className="field" style={{ marginTop: '2rem' }}>
            <label>Search clients</label>
            <input
              placeholder="Name, city, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </article>
      </section>

      <article className="data-table reveal is-visible">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Phone</th>
              <th>City</th>
              <th>Notes</th>
              {user?.role === 'owner' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0
              ? <tr><td colSpan={user?.role === 'owner' ? "5" : "4"}>No clients match this search yet.</td></tr>
              : filteredClients.map((client) => (
                <tr key={client.id}>
                  <td><strong>{client.name}</strong></td>
                  <td>{client.phone}</td>
                  <td>{client.city}</td>
                  <td>{client.notes || '-'}</td>
                  {user?.role === 'owner' && (
                    <td>
                      <div className="action-row">
                        <button className="inline-button" onClick={() => handleEdit(client)}>Edit</button>
                        <button className="inline-button danger" onClick={() => handleDelete(client.id)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            }
          </tbody>
        </table>
      </article>
    </section>
  );
}
