import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, Check, X, Zap, DollarSign, Info, AlertTriangle, 
  Trophy, ArrowRight, UserPlus, FileText, Globe, Clock,
  Sparkles, CheckCircle, XCircle, Image, Video, CreditCard,
  RefreshCw, Users, UserCheck, UserMinus, Settings, Wrench,
  Download, BookOpen, Filter, Trash2, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useAuth';
import apiClient from "../lib/apiClient";

// Brand alert priority dot colors (red high / amber medium / muted low).
const ALERT_PRIORITY_DOT = {
  high: 'var(--cth-command-crimson)',
  medium: 'var(--cth-command-gold)',
  low: 'var(--cth-command-muted)',
};

const alertActionLabel = (url) =>
  url === '/signal-inbox' ? 'Go to Signal Inbox'
  : url === '/brand-audit' ? 'View Audit'
  : url === '/alerts' ? 'View Alerts'
  : 'Open';

const WS_URL = import.meta.env.VITE_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

// Icon mapping for notification types
const TYPE_ICONS = {
  // General
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: XCircle,
  
  // CRM
  deal: DollarSign,
  deal_won: Trophy,
  deal_lost: XCircle,
  deal_stage: ArrowRight,
  contact_added: UserPlus,
  
  // Content
  content: FileText,
  content_published: Globe,
  content_scheduled: Clock,
  blog_published: BookOpen,
  
  // AI Jobs
  ai_job: Sparkles,
  ai_complete: CheckCircle,
  ai_failed: XCircle,
  image_generated: Image,
  video_generated: Video,
  
  // Automation
  automation: Zap,
  automation_triggered: Zap,
  
  // Billing
  billing: CreditCard,
  payment_success: CheckCircle,
  payment_failed: XCircle,
  subscription_renewed: RefreshCw,
  credits_low: AlertTriangle,
  
  // Team
  team: Users,
  team_invite: UserPlus,
  team_joined: UserCheck,
  team_left: UserMinus,
  
  // System
  system: Settings,
  maintenance: Wrench,
  update: Download,
};

const TYPE_COLORS = {
  // General
  info: 'var(--cth-command-purple)',
  success: 'var(--cth-command-success)',
  warning: 'var(--cth-command-warning)',
  error: 'var(--cth-command-error)',
  
  // CRM
  deal: 'var(--cth-command-muted)',
  deal_won: 'var(--cth-command-success)',
  deal_lost: 'var(--cth-command-error)',
  deal_stage: 'var(--cth-command-purple)',
  contact_added: 'var(--cth-command-purple)',
  
  // Content
  content: 'var(--cth-command-cinnabar)',
  content_published: 'var(--cth-command-success)',
  content_scheduled: 'var(--cth-command-warning)',
  blog_published: 'var(--cth-command-cinnabar)',
  
  // AI Jobs
  ai_job: 'var(--cth-command-cinnabar)',
  ai_complete: 'var(--cth-command-success)',
  ai_failed: 'var(--cth-command-error)',
  image_generated: 'var(--cth-command-purple)',
  video_generated: 'var(--cth-command-cinnabar)',
  
  // Automation
  automation: 'var(--cth-command-cinnabar)',
  automation_triggered: 'var(--cth-command-warning)',
  
  // Billing
  billing: 'var(--cth-command-purple)',
  payment_success: 'var(--cth-command-success)',
  payment_failed: 'var(--cth-command-error)',
  subscription_renewed: 'var(--cth-command-success)',
  credits_low: 'var(--cth-command-warning)',
  
  // Team
  team: 'var(--cth-command-purple)',
  team_invite: 'var(--cth-command-purple)',
  team_joined: 'var(--cth-command-success)',
  team_left: 'var(--cth-command-error)',
  
  // System
  system: 'var(--cth-neutral-500)',
  maintenance: 'var(--cth-command-warning)',
  update: 'var(--cth-command-purple)',
};

const CATEGORY_LABELS = {
  all: 'All',
  brand_alerts: 'Brand Alerts',
  general: 'General',
  crm: 'CRM & Sales',
  content: 'Content',
  ai: 'AI Jobs',
  billing: 'Billing',
  team: 'Team',
  system: 'System',
};

export function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brandAlerts, setBrandAlerts] = useState([]);
  const [brandUnread, setBrandUnread] = useState(0);
  const triggerRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const brandPollRef = useRef(null);
  const navigate = useNavigate();

  // Load notifications from API
  const load = useCallback(async (append = false) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const offset = append ? notifications.length : 0;
      const params = new URLSearchParams({
        user_id: user.id,
        limit: '20',
        offset: offset.toString()
      });
      if (filter !== 'all') {
        params.append('category', filter);
      }
      
      const res = await apiClient.get("/api/notifications", {
        params: {
          user_id: user.id,
          limit: '20',
          offset: offset.toString(),
          ...(filter !== 'all' ? { category: filter } : {}),
        },
      });
      const newNotifications = res.notifications || [];
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }
      setUnread(res.unread_count || 0);
      setHasMore(res.has_more || false);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, notifications.length]);

  // Load brand alerts (workspace-scoped, polled — no WebSocket).
  const loadBrandAlerts = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/brand-alerts", { params: { limit: 20 } });
      const data = res?.data ?? res;
      setBrandAlerts(data?.alerts || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadBrandCount = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/brand-alerts/count");
      const data = res?.data ?? res;
      setBrandUnread(Number(data?.unread_count || 0));
    } catch {
      /* ignore */
    }
  }, []);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!user?.id || !WS_URL) return;
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const ws = new WebSocket(`${WS_URL}/api/notifications/ws/${user.id}`);
    
    ws.onopen = () => {
      setIsConnected(true);

      // Start ping interval to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_notification') {
          // Add new notification to the top
          setNotifications(prev => [data.notification, ...prev]);
          setUnread(data.unread_count);
          
          // Show browser notification if permitted
          showBrowserNotification(data.notification);
        } else if (data.type === 'unread_count') {
          setUnread(data.count);
        } else if (data.type === 'read_confirmed') {
          // Update notification as read in local state
          setNotifications(prev => 
            prev.map(n => n.id === data.notification_id ? { ...n, is_read: true } : n)
          );
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      clearInterval(pingIntervalRef.current);
      
      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  }, [user?.id]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }, []);

  // Initialize
  useEffect(() => {
    load();
    connectWebSocket();
    requestNotificationPermission();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pingIntervalRef.current);
    };
  }, [user?.id]);

  // Poll brand alerts on mount + every 60s (workspace-scoped, no WebSocket).
  useEffect(() => {
    loadBrandAlerts();
    loadBrandCount();
    brandPollRef.current = setInterval(() => {
      loadBrandAlerts();
      loadBrandCount();
    }, 60000);
    return () => clearInterval(brandPollRef.current);
  }, [loadBrandAlerts, loadBrandCount]);

  // Reload when filter changes
  useEffect(() => {
    if (user?.id) {
      load();
    }
  }, [filter]);

  // Escape closes the notifications panel and returns focus to the bell.
  // The listener is only attached while the panel is open, so Escape never
  // fires unrelated behaviour when it is closed, and it is always removed on
  // close or unmount.
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setShowFilter(false);
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const markRead = async (id) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnread(prev => Math.max(0, prev - 1));
    
    // Send via WebSocket if connected, otherwise use REST
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read', notification_id: id }));
    } else {
      await apiClient.put(`/api/notifications/${id}/read`, null, {
        params: { user_id: user.id },
      });
    }
  };

  const markAllRead = async () => {
    // Optimistic update — both streams.
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    setBrandAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setBrandUnread(0);

    await apiClient.put("/api/notifications/mark-all-read", null, {
      params: { user_id: user.id },
    });
    try {
      await apiClient.patch("/api/brand-alerts/read-all");
    } catch {
      /* ignore */
    }
  };

  // Brand alert item actions.
  const markAlertRead = async (alert) => {
    if (alert.read) return;
    setBrandAlerts(prev => prev.map(a => a.alert_id === alert.alert_id ? { ...a, read: true } : a));
    setBrandUnread(prev => Math.max(0, prev - 1));
    try {
      await apiClient.patch(`/api/brand-alerts/${alert.alert_id}/read`);
    } catch {
      /* ignore */
    }
  };

  const dismissAlert = async (alert) => {
    setBrandAlerts(prev => prev.filter(a => a.alert_id !== alert.alert_id));
    if (!alert.read) setBrandUnread(prev => Math.max(0, prev - 1));
    try {
      await apiClient.delete(`/api/brand-alerts/${alert.alert_id}`);
    } catch {
      /* ignore */
    }
  };

  const openAlert = async (alert) => {
    await markAlertRead(alert);
    setOpen(false);
    if (alert.action_url) navigate(alert.action_url);
  };

  const dismiss = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    await apiClient.delete(`/api/notifications/${id}`);
    load(); // Reload to get accurate unread count
  };

  const clearRead = async () => {
    await apiClient.delete("/api/notifications/clear-all", {
      params: { user_id: user.id, read_only: true },
    });
    load();
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      load(true);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Combined unread badge: notification stream (WS) + brand alerts (polling).
  const totalUnread = unread + brandUnread;

  // Merge both streams into one list, newest first. Brand alerts show when the
  // filter is 'all' or 'brand_alerts'; notifications hide on 'brand_alerts'.
  const showNotifs = filter !== 'brand_alerts';
  const showAlerts = filter === 'all' || filter === 'brand_alerts';
  const mergedItems = [
    ...(showNotifs ? notifications.map(n => ({ kind: 'notif', ts: n.created_at, n })) : []),
    ...(showAlerts ? brandAlerts.map(a => ({ kind: 'alert', ts: a.created_at, a })) : []),
  ].sort((x, y) => new Date(y.ts).getTime() - new Date(x.ts).getTime());

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => { setOpen(!open); if (!open) { load(); loadBrandAlerts(); loadBrandCount(); } }}
        data-testid="notification-bell"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative p-2 rounded-lg cth-muted hover:opacity-80 hover:bg-[var(--cth-command-panel-soft)] transition-all"
      >
        <Bell size={18} />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--cth-command-cinnabar)] cth-heading text-[10px] font-bold flex items-center justify-center animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
        {/* Connection indicator */}
        <span 
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-500'}`}
          title={isConnected ? 'Real-time connected' : 'Polling mode'}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            className="absolute right-0 top-12 z-50 w-96 max-h-[500px] overflow-hidden rounded-2xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] shadow-2xl"
            data-testid="notification-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cth-command-border)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold cth-heading">Notifications</span>
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[var(--cth-command-cinnabar)] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Filter bar */}
            <div className="px-4 py-2 border-b border-[var(--cth-command-border)] flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cth-card-muted text-xs cth-muted hover:bg-[var(--cth-command-panel-soft)] transition-colors"
                >
                  <Filter size={12} />
                  {CATEGORY_LABELS[filter]}
                  <ChevronDown size={12} />
                </button>
                
                {showFilter && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                    <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--cth-command-ivory)] border border-[var(--cth-command-border)] rounded-lg shadow-xl z-20 py-1">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setFilter(key); setShowFilter(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                            filter === key ? 'cth-text-accent cth-card-muted' : 'cth-muted hover:opacity-80 hover:bg-[var(--cth-command-panel-soft)]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {notifications.some(n => n.is_read) && (
                <button 
                  onClick={clearRead}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs cth-muted hover:cth-muted transition-colors"
                >
                  <Trash2 size={12} />
                  Clear read
                </button>
              )}
            </div>

            {/* Notifications + brand alerts list */}
            <div className="overflow-y-auto max-h-80">
              {loading && mergedItems.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--cth-command-muted)]">
                  <div className="w-5 h-5 border-2 border-[var(--cth-command-cinnabar)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : mergedItems.length > 0 ? (
                <>
                  {mergedItems.map((item) => {
                    if (item.kind === 'alert') {
                      const a = item.a;
                      return (
                        <div
                          key={`alert-${a.alert_id}`}
                          onClick={() => openAlert(a)}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--cth-command-border)] cursor-pointer transition-colors hover:cth-card-muted ${
                            !a.read ? 'cth-card-muted' : ''
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background: ALERT_PRIORITY_DOT[a.priority] || 'var(--cth-command-muted)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className={`text-xs font-semibold leading-tight ${!a.read ? 'cth-heading' : 'text-[var(--cth-command-muted)]'}`}>
                                {a.title}
                              </div>
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--cth-command-gold)]/20 text-[var(--cth-command-gold)]">
                                Brand Alert
                              </span>
                            </div>
                            <div className="text-xs text-[var(--cth-command-muted)] mt-0.5 line-clamp-2">{a.body}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-[var(--cth-brand-primary-soft)]">{getTimeAgo(a.created_at)}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); openAlert(a); }}
                                className="text-[10px] text-[var(--cth-command-cinnabar)] hover:underline"
                              >
                                {alertActionLabel(a.action_url)} →
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissAlert(a); }}
                              className="p-1 text-[var(--cth-command-muted)] hover:text-red-400 transition-colors"
                              title="Dismiss"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const n = item.n;
                    const Icon = TYPE_ICONS[n.type] || Info;
                    const color = TYPE_COLORS[n.type] || 'var(--cth-command-purple)';

                    return (
                      <div 
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--cth-command-border)] transition-colors hover:cth-card-muted ${
                          !n.is_read ? 'cth-card-muted' : ''
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${color}15` }}
                        >
                          <Icon size={14} style={{ color }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className={`text-xs font-semibold leading-tight ${!n.is_read ? 'cth-heading' : 'text-[var(--cth-command-muted)]'}`}>
                              {n.title}
                            </div>
                            {n.priority === 'high' || n.priority === 'urgent' && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--cth-command-cinnabar)]/20 text-[var(--cth-command-cinnabar)]">
                                {n.priority}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--cth-command-muted)] mt-0.5 line-clamp-2">{n.message}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-[var(--cth-brand-primary-soft)]">{getTimeAgo(n.created_at)}</span>
                            {n.link && (
                              <a 
                                href={n.link}
                                className="text-[10px] text-[var(--cth-command-cinnabar)] hover:underline"
                                onClick={() => { markRead(n.id); setOpen(false); }}
                              >
                                View →
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {!n.is_read && (
                            <button 
                              onClick={() => markRead(n.id)} 
                              className="p-1 text-[var(--cth-command-muted)] hover:text-green-400 transition-colors"
                              title="Mark as read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button 
                            onClick={() => dismiss(n.id)} 
                            className="p-1 text-[var(--cth-command-muted)] hover:text-red-400 transition-colors"
                            title="Dismiss"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Load more button (notifications only) */}
                  {showNotifs && hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full py-3 text-xs text-[var(--cth-command-cinnabar)] hover:cth-card-muted transition-colors"
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Bell size={24} className="mx-auto mb-2 text-[var(--cth-brand-primary-soft)]" />
                  <div className="text-xs text-[var(--cth-command-muted)]">No notifications</div>
                  <div className="text-[10px] text-[var(--cth-brand-primary-soft)] mt-1">
                    {filter !== 'all' ? `No ${CATEGORY_LABELS[filter]} items` : "You're all caught up!"}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--cth-command-border)] flex justify-between items-center">
              <a 
                href="/settings?tab=notifications"
                className="text-[10px] text-[var(--cth-command-muted)] hover:cth-heading transition-colors"
              >
                Notification Settings
              </a>
              {totalUnread > 0 && (
                <span className="text-[10px] text-[var(--cth-command-cinnabar)]">{totalUnread} unread</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
