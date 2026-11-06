import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Heart,
  Users,
  ShieldCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../services/notificationService.js';
import { useToast } from '../context/ToastContext.jsx';

export const NotificationCenter = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState('ALL');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (filterUnreadOnly) params.unreadOnly = 'true';

      const res = await getNotifications(params);
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      showToast('Unable to load notifications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterUnreadOnly]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllAsRead();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
        showToast('All notifications marked as read.', 'success');
      }
    } catch (err) {
      console.error('Mark all read error:', err);
      showToast('Failed to mark all as read.', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await deleteNotification(id);
      if (res.success) {
        const target = notifications.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        showToast('Notification removed.', 'info');
      }
    } catch (err) {
      console.error('Delete notification error:', err);
      showToast('Could not delete notification.', 'error');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'DONATION':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'VOLUNTEER_APPLICATION':
      case 'VOLUNTEER':
        return <Users className="w-5 h-5 text-teal-600" />;
      case 'VERIFICATION':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'SYSTEM':
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="relative">
              <Bell className="w-7 h-7 text-teal-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with donation milestones, volunteer applications, and account activity.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-teal-700 shadow-xs transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-teal-600" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        {['ALL', 'DONATION', 'VOLUNTEER_APPLICATION', 'VERIFICATION', 'SYSTEM'].map((type) => {
          const labels = {
            ALL: 'All Updates',
            DONATION: 'Donations',
            VOLUNTEER_APPLICATION: 'Volunteer',
            VERIFICATION: 'Verification',
            SYSTEM: 'System'
          };
          const active = filterType === type;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {labels[type]}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterUnreadOnly}
              onChange={(e) => setFilterUnreadOnly(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            Unread Only
          </label>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-20"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filterUnreadOnly
              ? "You've read all your notifications!"
              : 'You have no notifications in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`group bg-white rounded-2xl border p-4 transition-all cursor-pointer flex items-start gap-4 ${
                !n.isRead
                  ? 'border-teal-200 bg-teal-50/20 hover:bg-teal-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm tracking-tight ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {n.link && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 group-hover:underline">
                    View Details
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.isRead && (
                  <button
                    onClick={(e) => handleMarkAsRead(n._id, e)}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(n._id, e)}
                  title="Delete notification"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

