import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../services/store.js';
import { api } from '../../services/api.js';
import toast from 'react-hot-toast';
import './employee.css';

export function Employee() {
  const { user, fetchData, tasks, attendance, language, translations } = useStore();
  const t = translations[language] || translations.en;
  const isUrdu = language === 'ur';
  const [time, setTime] = useState(new Date());
  const [note, setNote] = useState(localStorage.getItem(`note-${user?.userCode}`) || '');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [nativeLocation, setNativeLocation] = useState(null);
  const navigate = useNavigate();

  const requestNativeLocation = useCallback(() => {
    if (typeof window !== 'undefined' && window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GET_LOCATION' }));
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Listen for coordinates from native mobile app
    const handleMessage = (event) => {
      try {
        const rawMessage = typeof event.data === 'string'
          ? event.data
          : event?.detail?.data;
        const data = JSON.parse(rawMessage);
        const coords = data?.data || data?.coords;

        if ((data.type === 'LOCATION_UPDATE' || data.type === 'native-location') && coords) {
          setNativeLocation(coords);
        }
      } catch {
        // Not our message
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage); // For some old Android WebViews
    window.addEventListener('citibooks-native-message', handleMessage);
    requestNativeLocation();

    return () => {
      clearInterval(timer);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
      window.removeEventListener('citibooks-native-message', handleMessage);
    };
  }, [fetchData, requestNativeLocation]);

  useEffect(() => {
    if (showLocationPrompt) {
      requestNativeLocation();
    }
  }, [requestNativeLocation, showLocationPrompt]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`note-${user.userCode}`, note);
    }
  }, [note, user]);

  if (!user) return null;

  const performCheckIn = async () => {
    setShowLocationPrompt(false);
    const toastId = toast.loading('Verifying location...');
    
    // Strategy 1: Use native location if recently received
    if (nativeLocation) {
      const loc = `${nativeLocation.latitude.toFixed(4)},${nativeLocation.longitude.toFixed(4)}`;
      try {
        await api.checkIn({ location: loc });
        toast.success('Check-in successful!', { id: toastId });
        void fetchData();
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Check-in failed.';
        toast.error(msg, { id: toastId, duration: 5000 });
        return;
      }
    }

    // Strategy 2: Fallback to browser geolocation
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = `${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`;
        try {
          await api.checkIn({ location: loc });
          toast.success('Check-in successful!', { id: toastId });
          void fetchData();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Check-in failed.';
          toast.error(msg, { id: toastId, duration: 5000 });
        }
      },
      () => {
        toast.error('Location access denied. Please check your phone settings.', { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleCheckIn = async () => {
    const todayRecord = attendance.find(r => r.userCode === user.userCode && r.date === new Date().toISOString().slice(0, 10));
    
    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
      const toastId = toast.loading('Checking out...');
      try {
        await api.checkOut();
        toast.success('Good work! See you tomorrow.', { id: toastId });
        void fetchData();
      } catch {
        toast.error('Check-out failed.', { id: toastId });
      }
    } else {
      setShowLocationPrompt(true);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    if (task.status === 'review' || task.status === 'done') {
      toast('Task is pending owner review', { icon: '⏳' });
      return;
    }
    const nextStatus = task.status === 'pending' ? 'in-progress' : 'review';
    try {
      await api.updateTaskStatus(task.id, nextStatus);
      toast.success(nextStatus === 'review' ? 'Sent for Review' : 'Task In Progress');
      void fetchData();
    } catch {
      toast.error('Update failed');
    }
  };

  const myTasks = tasks.filter(t => t.assignee === user.userCode || t.assignee === 'All');

  
  // Stats calculations
  const sevenDaysAgo = new Date(time.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyAttendance = attendance.filter(r => 
    r.userCode === user.userCode && 
    new Date(r.date) > sevenDaysAgo
  ).length;
  const taskCompletionRate = myTasks.length ? Math.round((myTasks.filter(t => t.status === 'done').length / myTasks.length) * 100) : 0;

  const todayRecord = attendance.find(r => r.userCode === user.userCode && r.date === new Date().toISOString().slice(0, 10));
  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;

  if (user.role === 'owner') {
    const today = new Date().toISOString().slice(0, 10);
    const todayAttendance = attendance.filter(a => a.date === today);
    const presentRecords = todayAttendance.filter(a => a.status === 'present');
    const presentCount = new Set(presentRecords.map((record) => record.userCode)).size;
    const lateCount = presentRecords.filter(a => a.isLate).length;

    return (
      <section className="employee-app-shell manager-shell" style={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
        <main className="employee-content">
          <div className="employee-hero-card manager-hero">
             <div className="hero-content">
                <span className="date-chip">{t.managerHub}</span>
                <h2 className="time-heavy">{isUrdu ? 'لائیو ویو' : 'Live Shop View'}</h2>
                <p className="welcome-msg">{isUrdu ? 'دکان کی لائیو مانیٹرنگ' : 'Monitoring CitiBooks Islamabad'}</p>
             </div>
          </div>

          <div className="stats-mini-row">
            <div className="stat-pill">
              <span className="label">{t.presentToday}</span>
              <span className="value" style={{ color: '#16a34a' }}>{presentCount}</span>
            </div>
            <div className="stat-pill">
              <span className="label">{t.lateArrivals}</span>
              <span className="value" style={{ color: '#e11d48' }}>{lateCount}</span>
            </div>
          </div>

          <div className="employee-card tasks-section">
            <div className="card-header">
              <h3>📍 {isUrdu ? 'حاضر سٹاف' : 'Active Staff (Today)'}</h3>
               <span className="count-badge">{presentCount}</span>
            </div>
            <div className="task-list-minimal">
               {presentRecords.length === 0 ? (
                  <p className="empty-state">{isUrdu ? 'کوئی حاضری نہیں' : 'No check-ins yet.'}</p>
               ) : (
                  presentRecords.map(record => (
                     <div key={record.id} className="task-item-compact">
                       <div className={`status-circle ${record.isLate ? 'review' : 'done'}`}>
                         {record.isLate ? 'L' : 'P'}
                       </div>
                       <div style={{ flex: 1, marginLeft: isUrdu ? 0 : 12, marginRight: isUrdu ? 12 : 0 }}>
                          <span className="task-title" style={{ fontWeight: 700 }}>{record.userName || record.userCode}</span>
                          <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>{isUrdu ? `${record.checkIn} پر آئے` : `Arrived at ${record.checkIn}`}</span>
                       </div>
                       <span className={`task-priority-tag ${record.isLate ? 'high' : 'medium'}`}>
                         {record.isLate ? (isUrdu ? 'دیری' : 'LATE') : (isUrdu ? 'وقت پر' : 'ON TIME')}
                       </span>
                     </div>
                  ))
               )}
            </div>
          </div>
          
          <button className="check-in-btn-premium" style={{ marginTop: '24px', backgroundColor: 'var(--citi-purple)' }} onClick={() => navigate('/attendance')}>
            {isUrdu ? 'مکمل ریکارڈ دیکھیں' : 'View Full Records'}
          </button>
        </main>
      </section>
    );
  }

  const myAttendance = attendance
    .filter(r => r.userCode === user.userCode)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.checkIn || '').localeCompare(String(a.checkIn || '')))
    .slice(0, 5);

  return (
    <section className="employee-app-shell" style={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
      <main className="employee-content">
        {/* HERO SECTION */}
        <div className="employee-hero-card">
           <div className="hero-content">
              <span className="date-chip">{time.toLocaleDateString(isUrdu ? 'ur-PK' : undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <h2 className="time-heavy">{time.toLocaleTimeString(isUrdu ? 'ur-PK' : [], { hour: '2-digit', minute: '2-digit' })}</h2>
              <p className="welcome-msg">{t.welcome} {user.name.split(' ')[0]}!</p>
           </div>
        </div>

        {/* STATS ROW */}
        <div className="stats-mini-row">
           <div className="stat-pill">
              <span className="label">{isUrdu ? 'ہفتہ وار حاضری' : 'Weekly Presence'}</span>
              <span className="value">{weeklyAttendance} {isUrdu ? 'دن' : 'Days'}</span>
           </div>
           <div className="stat-pill">
              <span className="label">{isUrdu ? 'ٹاسک پرفارمنس' : 'Task Score'}</span>
              <span className="value">{taskCompletionRate}%</span>
           </div>
        </div>

        <div className="employee-grid">
           {/* DAILY TASKS */}
           <div className="employee-card tasks-section">
              <div className="card-header">
                 <h3>✨ {isUrdu ? 'آج کے کام' : 'My Tasks'}</h3>
                 <span className="count-badge">{myTasks.filter(t => t.status !== 'done').length} Pending</span>
              </div>
              <div className="task-list-minimal">
                 {myTasks.length === 0 ? (
                    <p className="empty-state">{isUrdu ? 'آج کے لیے کوئی کام نہیں' : 'No tasks assigned today.'}</p>
                 ) : (
                    myTasks.map(task => (
                       <div key={task.id} className={`task-item-compact ${task.status}`} onClick={() => handleToggleTaskStatus(task)}>
                          <div className={`status-circle ${task.status}`}>
                             {task.status === 'done' ? '✓' : (task.status === 'review' ? '⏳' : '')}
                          </div>
                          <span className="task-title">{task.title}</span>
                          <span className={`task-priority-tag ${task.priority.toLowerCase()}`}>{task.priority}</span>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* ATTENDANCE TABLE */}
           <div className="employee-card attendance-section">
              <div className="card-header">
                 <h3>📅 {isUrdu ? 'تازہ ترین حاضری' : 'History'}</h3>
              </div>
              <div className="attendance-table-compact">
                 <table>
                    <thead>
                       <tr>
                          <th>{isUrdu ? 'تاریخ' : 'Date'}</th>
                          <th>{isUrdu ? 'وقت' : 'Time'}</th>
                          <th>{isUrdu ? 'سٹیٹس' : 'State'}</th>
                       </tr>
                    </thead>
                    <tbody>
                       {myAttendance.map(record => (
                          <tr key={record.id}>
                             <td>{record.date.split('-').slice(1).join('/')}</td>
                             <td>{record.checkIn || '--'}</td>
                             <td><span className={`status-tag ${record.status}`}>{isUrdu ? (record.status === 'present' ? 'موجود' : 'غیر حاضر') : record.status}</span></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* NOTE PAD */}
           <div className="employee-card notepad-section">
              <div className="card-header">
                 <h3>✍️ {isUrdu ? 'ذاتی نوٹ بک' : 'Quick Notes'}</h3>
              </div>
              <textarea 
                className="note-area" 
                placeholder={isUrdu ? 'یہاں اپنے نوٹ لکھیں...' : 'Type your notes here...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
           </div>
        </div>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <button 
        className={`check-in-btn-premium ${isCheckedIn ? 'is-checked-in' : ''}`} 
        onClick={handleCheckIn}
      >
         <span className="icon">{isCheckedIn ? '👋' : '📍'}</span> 
         {isCheckedIn ? t.checkOut : t.markAttendance}
      </button>

      {/* LOCATION PERMISSION PORTAL */}
      {showLocationPrompt && (
        <div className="location-portal">
          <div className="portal-content">
            <span className="portal-icon">📍</span>
            <h2>Location Required</h2>
            <p>
              To check in at the shop, we need to verify your location. 
              Please allow location access to continue.
            </p>
            <div className="btn-group">
              <button className="grant-btn" onClick={performCheckIn}>
                Allow & Continue
              </button>
              <button className="deny-btn" onClick={() => setShowLocationPrompt(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
