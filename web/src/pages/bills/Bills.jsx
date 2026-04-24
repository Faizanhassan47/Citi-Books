import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import { shareOnWhatsApp } from '../../utils/share.js';

function getBillUploads(bills) {
  return bills.flatMap((bill) => {
    const uploads = bill.imageHistory?.length
      ? bill.imageHistory
      : bill.image ? [bill.image] : [];

    return uploads.map((upload, index) => ({
      ...upload,
      billId: bill.id,
      billTitle: bill.title,
      amount: bill.amount,
      dueAmount: bill.dueAmount,
      status: bill.status || 'pending',
      uploadKey: `${bill.id}-${upload.publicId || index}`,
      isCurrent: bill.image?.publicId === upload.publicId && bill.image?.imageUrl === upload.imageUrl
    }));
  });
}

function normalizeUploadDate(upload) {
  if (upload?.uploadedAt) {
    const date = new Date(upload.uploadedAt);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  return '';
}

async function compressImage(file, maxWidth = 1080, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error('Failed to read the selected image'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read the selected image'));
    reader.onload = (event) => {
      const source = event.target?.result;

      if (typeof source !== 'string' || source.length === 0) {
        reject(new Error('Failed to read the selected image'));
        return;
      }

      const img = new Image();

      img.onerror = () => reject(new Error('Failed to read the selected image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          reject(new Error('Failed to read the selected image'));
          return;
        }

        if (width > maxWidth) {
          height = Math.round((maxWidth / width) * height);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to read the selected image'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          reject(new Error('Failed to read the selected image'));
        }
      };

      img.src = source;
    };

    reader.readAsDataURL(file);
  });
}

export function Bills() {
  const { user } = useStore();
  const isEmployee = user?.role === 'employee';

  const [bills, setBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBill, setEditingBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedByFilter, setUploadedByFilter] = useState('all');
  const [uploadDateFilter, setUploadDateFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [api.getBills()];
      if (!isEmployee) requests.push(api.getUsers());
      const [billsData, usersData = []] = await Promise.all(requests);
      setBills(billsData);
      setUsers(usersData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingBill(null);
  }, []);

  const openCreateDrawer = useCallback(() => {
    setEditingBill(null);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((bill) => {
    setEditingBill(bill);
    setIsDrawerOpen(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const accessUsers = formData.getAll('accessUsers').filter(v => typeof v === 'string' && v.trim() !== '');
    const payload = {
      title: String(formData.get('title') || '').trim(),
      amount: Number(formData.get('amount')),
      dueAmount: Number(formData.get('dueAmount')),
      accessUsers
    };
    const file = formData.get('billImage');

    if (!payload.title || Number.isNaN(payload.amount) || Number.isNaN(payload.dueAmount)) {
      toast.error('Please fill all bill fields correctly');
      return;
    }

    try {
      setIsSubmitting(true);
      if (file instanceof File && file.size > 0) {
        payload.imageData = await compressImage(file);
      }
      const response = editingBill ? await api.updateBill(editingBill.id, payload) : await api.createBill(payload);
      if (response?.offline) {
        toast(response.message || 'Bill saved offline. It will sync automatically.');
      } else {
        toast.success(editingBill ? 'Bill updated successfully' : 'Bill saved successfully');
      }
      form.reset();
      closeDrawer();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save bill');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (billId) => {
    try {
      await api.updateBillStatus(billId, 'paid', 'Direct cash');
      toast.success('Bill marked as paid');
      if (selectedUpload && selectedUpload.billId === billId) {
        setSelectedUpload(prev => ({ ...prev, status: 'paid' }));
      }
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update bill status');
      console.error(error);
    }
  };

  const handleDelete = async (billId) => {
    if (!window.confirm("Delete this bill? This cannot be undone.")) return;
    try {
      await api.deleteBill(billId);
      toast.success('Bill deleted');
      setSelectedUpload(null);
      await loadData();
    } catch (error) {
      toast.error('Failed to delete bill');
      console.error(error);
    }
  };

  const allUploads = getBillUploads(bills);
  const uploaderOptions = [...new Map(
    allUploads
      .filter((upload) => upload.uploadedBy)
      .map((upload) => [upload.uploadedBy, { code: upload.uploadedBy, name: upload.uploadedByName || upload.uploadedBy }])
  ).values()];
  const employees = users.filter((item) => item.role === 'employee' && item.isActive);
  const filteredUploads = allUploads.filter((upload) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || [
      upload.billTitle,
      upload.uploadedByName,
      upload.uploadedBy,
      upload.publicId
    ]
      .filter((value) => typeof value === 'string' && value.trim() !== '')
      .some((value) => value.toLowerCase().includes(q));
    const matchUploader = uploadedByFilter === 'all' || upload.uploadedBy === uploadedByFilter;
    const matchDate = !uploadDateFilter || normalizeUploadDate(upload) === uploadDateFilter;

    return matchSearch && matchUploader && matchDate;
  });
  const myBills = isEmployee ? bills.filter((bill) => bill.createdBy === user?.userCode) : [];

  if (loading) {
    return <div>Loading bills...</div>;
  }

  if (isEmployee) {
    return (
      <section className="page-shell bills-page">
        <header className="page-header">
          <div className="header-copy">
            <span className="eyebrow">My Bill Submissions</span>
            <h2 className="section-title">Bills I Uploaded</h2>
            <p className="section-copy">View and update your own bill submissions.</p>
          </div>
          <div className="header-actions">
            <button className="button" type="button" onClick={openCreateDrawer}>
              + Upload Bill
            </button>
          </div>
        </header>

        <div className="data-table reveal is-visible">
          <table>
            <thead>
              <tr>
                <th>Bill Title</th>
                <th>Amount (Rs)</th>
                <th>Due (Rs)</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myBills.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No bills uploaded yet. Click &ldquo;Upload Bill&rdquo; to submit your first one.
                  </td>
                </tr>
              ) : myBills.map((bill) => (
                <tr key={bill.id}>
                  <td><strong>{bill.title}</strong></td>
                  <td>Rs {Number(bill.amount || 0).toLocaleString()}</td>
                  <td style={{ color: '#e11d48', fontWeight: 600 }}>Rs {Number(bill.dueAmount || 0).toLocaleString()}</td>
                  <td>
                    {bill.status === 'paid'
                      ? <span className="status-badge green">Paid</span>
                      : <span className="status-badge pink">Pending</span>}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {bill.image?.uploadedAt
                      ? new Date(bill.image.uploadedAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="inline-button success"
                      type="button"
                      onClick={() => openEditDrawer(bill)}
                      disabled={bill.status === 'paid'}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`side-drawer-overlay ${isDrawerOpen ? 'is-open' : ''}`} onClick={closeDrawer} />
        <aside className={`side-drawer ${isDrawerOpen ? 'is-open' : ''}`}>
          <div className="drawer-header">
            <h3 className="section-title" style={{ margin: 0 }}>{editingBill ? 'Edit Bill' : 'Upload New Bill'}</h3>
            <button className="drawer-close" type="button" onClick={closeDrawer}>x</button>
          </div>
          <form className="field" style={{ gap: '18px' }} onSubmit={handleSubmit}>
            <div className="field">
              <label>Bill Title</label>
              <input name="title" required placeholder="e.g. November Internet Bill" defaultValue={editingBill?.title || ''} />
            </div>
            <div className="field">
              <label>Total Amount (Rs)</label>
              <input name="amount" type="number" required placeholder="0" defaultValue={editingBill?.amount ?? ''} />
            </div>
            <div className="field">
              <label>Due Amount (Rs)</label>
              <input name="dueAmount" type="number" required placeholder="0" defaultValue={editingBill?.dueAmount ?? ''} />
            </div>
            <div className="field">
              <label>Bill Picture {editingBill ? '(leave blank to keep existing)' : ''}</label>
              <input name="billImage" type="file" accept="image/*" required={!editingBill} style={{ paddingTop: '10px' }} />
            </div>
            <input type="hidden" name="accessUsers" value="" />
            <button className="button" type="submit" style={{ width: '100%' }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingBill ? 'Save Changes' : 'Upload & Submit'}
            </button>
          </form>
        </aside>
      </section>
    );
  }

  return (
    <section className="page-shell bills-page">
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-copy">
          <span className="eyebrow">Financial Records</span>
          <h2 className="section-title">Bill Image Library</h2>
          <p className="section-copy">Browse, filter, and review every uploaded bill image. Click an image to expand.</p>
        </div>
        <div className="header-actions">
          <button className="button" type="button" onClick={openCreateDrawer}>+ Upload Bill</button>
        </div>
      </header>

      <div className="section-grid four reveal is-visible" style={{ marginBottom: '32px' }}>
        <article className="stat-card">
          <span className="eyebrow">Total Invoiced</span>
          <strong>Rs {bills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString()}</strong>
        </article>
        <article className="stat-card">
          <span className="eyebrow" style={{ color: 'var(--accent-pink)' }}>Total Outstanding</span>
          <strong style={{ color: 'var(--accent-pink)' }}>
            Rs {bills.filter((bill) => bill.status !== 'paid').reduce((sum, bill) => sum + (bill.dueAmount || 0), 0).toLocaleString()}
          </strong>
        </article>
        <article className="stat-card">
          <span className="eyebrow">Total Images</span>
          <strong>{allUploads.length}</strong>
        </article>
      </div>

      <div className="filters-row reveal is-visible">
        <div className="field">
          <label>Search Bills</label>
          <input placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="field">
          <label>Uploaded handler</label>
          <select value={uploadedByFilter} onChange={(e) => setUploadedByFilter(e.target.value)}>
            <option value="all">All specific uploaders</option>
            {uploaderOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Exact Upload Date</label>
          <input type="date" value={uploadDateFilter} onChange={(e) => setUploadDateFilter(e.target.value)} />
        </div>
      </div>

      <div className="bill-gallery reveal is-visible stagger-1">
        {filteredUploads.length > 0 ? (
          filteredUploads.map((upload) => (
            <article key={upload.uploadKey} className="bill-gallery-card">
              <div className="bill-gallery-image-container" onClick={() => setSelectedUpload(upload)} style={{ cursor: 'zoom-in' }}>
                <img src={upload.imageUrl} alt={upload.billTitle} className="bill-gallery-image" />
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                  {upload.status === 'paid'
                    ? <span className="status-badge green" style={{ boxShadow: 'var(--shadow-sm)' }}>PAID</span>
                    : <span className="status-badge pink" style={{ boxShadow: 'var(--shadow-sm)' }}>UNPAID</span>}
                  {upload.isCurrent
                    ? <span className="status-badge blue" style={{ boxShadow: 'var(--shadow-sm)' }}>Current</span>
                    : <span className="status-badge" style={{ boxShadow: 'var(--shadow-sm)', backgroundColor: '#94a3b8', color: '#fff' }}>History</span>}
                </div>
              </div>
              <div className="bill-gallery-meta">
                <strong>{upload.billTitle}</strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontWeight: 600 }}>Amt: Rs {Number(upload.amount || 0).toLocaleString()}</span>
                  <span className="status-badge pink" style={{ fontSize: '0.65rem', padding: '4px 8px' }}>Due: Rs {Number(upload.dueAmount || 0).toLocaleString()}</span>
                </div>

                <div className="bill-gallery-footer">
                  <div className="uploader-info">
                    <div className="uploader-avatar">{upload.uploadedByName?.charAt(0).toUpperCase() || upload.uploadedBy?.charAt(0).toUpperCase() || '?'}</div>
                    <span style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {upload.uploadedByName || upload.uploadedBy}
                    </span>
                  </div>
                  <div className="action-row" style={{ gap: '8px' }}>
                    <button
                      className="inline-button success"
                      type="button"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => setSelectedUpload(upload)}
                    >
                      View Full
                    </button>
                    <button 
                      className="whatsapp-button" 
                      style={{ padding: '6px 10px', borderRadius: '12px', fontSize: '0.75rem' }}
                      onClick={() => shareOnWhatsApp('', `Bill: ${upload.billTitle}\nStatus: ${upload.status?.toUpperCase()}\nAmount: Rs ${Number(upload.amount).toLocaleString()}`)}
                    >
                      Share
                    </button>
                    {!isEmployee && (
                      <button
                        className="inline-button danger"
                        type="button"
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        onClick={() => handleDelete(upload.billId)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="bill-gallery-empty">
            <h4 className="section-title">No bill pictures match criteria</h4>
            <p className="section-copy">Adjust your filters or upload a new bill to see images here.</p>
          </div>
        )}
      </div>

      {/* Bill Viewer Lightbox Modal */}
      {selectedUpload && (
        <div className="bill-viewer-overlay" onClick={() => setSelectedUpload(null)}>
          <div className="bill-viewer-content" onClick={e => e.stopPropagation()}>
            <button className="viewer-close-btn" onClick={() => setSelectedUpload(null)}>×</button>
            <div className="viewer-image-side">
              <img src={selectedUpload.imageUrl} alt={selectedUpload.billTitle} />
            </div>
            <div className="viewer-info-side">
              <div className="viewer-tag">#BillRecord</div>
              <h1 className="viewer-title">{selectedUpload.billTitle}</h1>
              <p style={{ color: '#888', margin: 0 }}>Detailed financial scan for documentation and tracking.</p>
              
              <div className="viewer-meta-row">
                <div className="viewer-meta-item">📅 {new Date(selectedUpload.uploadedAt || Date.now()).toLocaleDateString()}</div>
                <div className="viewer-meta-item">👤 {selectedUpload.uploadedByName || selectedUpload.uploadedBy}</div>
                <div className="viewer-meta-item">💰 Rs {Number(selectedUpload.amount).toLocaleString()}</div>
              </div>

              <div className="viewer-rating-card">
                <div className="viewer-rating-main">
                  <span className="viewer-rating-star">⭐</span>
                  <span className="viewer-rating-val">{selectedUpload.status === 'paid' ? '5.0' : 'pending'}</span>
                  <span className="viewer-rating-sub">/ status breakdown</span>
                </div>
                <div className="viewer-rating-breakdown">
                  <div className="rating-bar-row">
                    <span className="rating-bar-label">Paid</span>
                    <div className="rating-bar-track">
                      <div className="rating-bar-fill" style={{ width: selectedUpload.status === 'paid' ? '100%' : '0%', background: '#2dd4bf' }}></div>
                    </div>
                  </div>
                  <div className="rating-bar-row">
                    <span className="rating-bar-label">Due</span>
                    <div className="rating-bar-track">
                      <div className="rating-bar-fill" style={{ width: selectedUpload.status !== 'paid' ? '100%' : '0%', background: '#f43f5e' }}></div>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                  Current outstanding amount for this record: **Rs {Number(selectedUpload.dueAmount).toLocaleString()}**
                </p>
              </div>

              <div className="action-row" style={{ gap: '16px', marginTop: 'auto' }}>
                {selectedUpload.status !== 'paid' && selectedUpload.isCurrent && (
                  <button className="button success" onClick={() => handleMarkPaid(selectedUpload.billId)} style={{ flex: 1 }}>Mark Paid</button>
                )}
                {!isEmployee && (
                  <button className="button danger" onClick={() => handleDelete(selectedUpload.billId)} style={{ flex: 1 }}>Delete</button>
                )}
                <button 
                  className="whatsapp-button"
                  style={{ flex: 1, padding: '14px', borderRadius: '16px' }}
                  onClick={() => shareOnWhatsApp('', `CitiBooks - Bill Details\n\nTitle: ${selectedUpload.billTitle}\nStatus: ${selectedUpload.status?.toUpperCase()}\nTotal: Rs ${Number(selectedUpload.amount).toLocaleString()}\nOutstanding: Rs ${Number(selectedUpload.dueAmount).toLocaleString()}\n\nPlease verify this record.`)}
                >
                  Send to WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`side-drawer-overlay ${isDrawerOpen ? 'is-open' : ''}`} onClick={closeDrawer}></div>
      <aside className={`side-drawer ${isDrawerOpen ? 'is-open' : ''}`}>
        <div className="drawer-header">
          <h3 className="section-title" style={{ margin: 0 }}>Upload New Bill</h3>
          <button className="drawer-close" type="button" onClick={closeDrawer}>x</button>
        </div>

        <form className="field" style={{ gap: '24px' }} onSubmit={handleSubmit}>
          <div className="field">
            <label>Bill title</label>
            <input name="title" required placeholder="e.g. November Internet Bill" />
          </div>
          <div className="field">
            <label>Total Amount (Rs)</label>
            <input name="amount" type="number" required placeholder="0" />
          </div>
          <div className="field">
            <label>Due Amount (Rs)</label>
            <input name="dueAmount" type="number" required placeholder="0" />
          </div>
          <div className="field">
            <label>Bill Picture To Upload</label>
            <input name="billImage" type="file" accept="image/*" required style={{ paddingTop: '12px' }} />
          </div>
          <div className="field">
            <label>Assign Visibility Access</label>
            <select name="accessUsers" multiple size={Math.min(5, employees.length + 1)}>
              {employees.map((employee) => (
                <option key={employee.userCode} value={employee.userCode}>
                  {employee.name}
                </option>
              ))}
            </select>
            <small className="muted" style={{ fontSize: '0.75rem' }}>Hold Ctrl/Cmd to select multiple. Owners always have access.</small>
          </div>
          <div className="action-row" style={{ marginTop: '16px' }}>
            <button className="button" type="submit" style={{ width: '100%' }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Upload & Save Bill'}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}
