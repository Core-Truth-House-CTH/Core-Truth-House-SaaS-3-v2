import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '@clerk/react';
import {
 Rocket,
 Plus,
 Calendar,
 CheckCircle2,
 Circle,
 Clock,
 Target,
 Trash2,
 X,
 Loader2,
} from 'lucide-react';
import apiClient from '../lib/apiClient';

const CTH_PAGE_COLORS = {
 darkest: "var(--cth-admin-bg)",
 darker: "var(--cth-admin-panel-alt)",
 cardBg: "var(--cth-admin-panel)",
 crimson: "var(--cth-admin-accent)",
 cinnabar: "var(--cth-admin-accent)",
 tuscany: "var(--cth-admin-tuscany)",
 ruby: "var(--cth-admin-ruby)",
 textPrimary: "var(--cth-admin-ink)",
 textSecondary: "var(--cth-admin-ruby)",
 textMuted: "var(--cth-admin-ink-soft, var(--cth-admin-muted))",
 border: "var(--cth-admin-border)",
 accent: "var(--cth-admin-accent)",
 sidebarStart: "var(--cth-admin-sidebar-start)",
 sidebarEnd: "var(--cth-admin-sidebar-end)",
 sidebarHover: "var(--cth-admin-sidebar-hover)",
 panel: "var(--cth-admin-panel)",
 appBg: "var(--cth-admin-bg)",
};

const PHASE_COLORS = {
 'pre-launch': 'var(--cth-brand-primary)',
 launch: 'var(--cth-admin-accent)',
 'post-launch': 'var(--cth-brand-primary-soft)',
};

const DEFAULT_PHASES = [
 {
 id: 'pre-launch',
 name: 'Pre-Launch',
 description: 'Build anticipation and prepare your audience',
 tasks: [
 { id: '1', title: 'Define launch goals and success metrics', completed: false },
 { id: '2', title: 'Create launch landing page', completed: false },
 { id: '3', title: 'Build email waitlist', completed: false },
 { id: '4', title: 'Prepare social media content calendar', completed: false },
 { id: '5', title: 'Create teaser content', completed: false },
 { id: '6', title: 'Reach out to potential partners or affiliates', completed: false },
 ],
 },
 {
 id: 'launch',
 name: 'Launch Day',
 description: 'Execute your launch strategy',
 tasks: [
 { id: '7', title: 'Send launch email to list', completed: false },
 { id: '8', title: 'Post launch announcement on all platforms', completed: false },
 { id: '9', title: 'Go live with sales page', completed: false },
 { id: '10', title: 'Monitor and respond to comments and DMs', completed: false },
 { id: '11', title: 'Track real-time metrics', completed: false },
 ],
 },
 {
 id: 'post-launch',
 name: 'Post-Launch',
 description: 'Sustain momentum and optimize',
 tasks: [
 { id: '12', title: 'Send follow-up emails to non-buyers', completed: false },
 { id: '13', title: 'Collect and share testimonials', completed: false },
 { id: '14', title: 'Analyze launch performance', completed: false },
 { id: '15', title: 'Create case study from results', completed: false },
 { id: '16', title: 'Plan evergreen funnel', completed: false },
 ],
 },
];

function normalizeLaunch(launch) {
 return {
 id: launch.id,
 name: launch.name || 'Untitled Launch',
 launch_date: launch.launch_date || null,
 phases: Array.isArray(launch.phases) && launch.phases.length > 0
 ? launch.phases
 : DEFAULT_PHASES,
 status: launch.status || 'planning',
 };
}

function LaunchPlannerContent() {
 const colors = CTH_PAGE_COLORS;
 const { currentWorkspace } = useWorkspace();
 const { userId } = useAuth();

 const workspaceId =
 currentWorkspace?.id ||
 currentWorkspace?.workspace_id ||
 '';

 const [launches, setLaunches] = useState([]);
 const [activeLaunchId, setActiveLaunchId] = useState('');
 const [isLoading, setIsLoading] = useState(true);
 const [showNewLaunchModal, setShowNewLaunchModal] = useState(false);
 const [newLaunchName, setNewLaunchName] = useState('');
 const [newLaunchDate, setNewLaunchDate] = useState('');
 const [error, setError] = useState('');

 const activeLaunch = useMemo(
 () => launches.find((launch) => launch.id === activeLaunchId) || null,
 [launches, activeLaunchId]
 );

 useEffect(() => {
 loadLaunches();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [workspaceId, userId]);

 async function loadLaunches() {
 if (!workspaceId || !userId) {
 setIsLoading(false);
 return;
 }

 setIsLoading(true);
 setError('');

 try {
 const response = await apiClient.get('/api/launches');
 const items = Array.isArray(response) ? response.map(normalizeLaunch) : [];

 setLaunches(items);

 if (items.length > 0) {
 setActiveLaunchId((current) =>
 current && items.some((item) => item.id === current)
 ? current
 : items[0].id
 );
 } else {
 setActiveLaunchId('');
 }
 } catch (err) {
 console.error('Failed to load launches:', err);
 setError(err?.message || 'Failed to load Launch Planner.');
 } finally {
 setIsLoading(false);
 }
 }

 async function handleCreateLaunch() {
 if (!newLaunchName.trim()) return;

 try {
 const response = await apiClient.post('/api/launches', {
 name: newLaunchName.trim(),
 launch_date: newLaunchDate || null,
 phases: DEFAULT_PHASES,
 });
 const created = normalizeLaunch(response);

 setLaunches((current) => [created, ...current]);
 setActiveLaunchId(created.id);
 setShowNewLaunchModal(false);
 setNewLaunchName('');
 setNewLaunchDate('');
 } catch (err) {
 console.error('Failed to create launch:', err);
 setError(err?.message || 'Failed to create launch.');
 }
 }

 async function persistLaunchPhases(launchId, phases) {
 const launch = launches.find((item) => item.id === launchId);
 if (!launch) return;

 const response = await apiClient.put(`/api/launches/${launchId}`, {
 phases,
 });

 const mapped = normalizeLaunch(response);

 setLaunches((current) =>
 current.map((item) => (item.id === launchId ? mapped : item))
 );
 }

 async function handleToggleTask(phaseId, taskId) {
 if (!activeLaunch) return;

 const updatedPhases = activeLaunch.phases.map((phase) => {
 if (phase.id !== phaseId) return phase;

 return {
 ...phase,
 tasks: phase.tasks.map((task) =>
 task.id === taskId ? { ...task, completed: !task.completed } : task
 ),
 };
 });

 const optimistic = { ...activeLaunch, phases: updatedPhases };
 setLaunches((current) =>
 current.map((item) => (item.id === activeLaunch.id ? optimistic : item))
 );

 try {
 await persistLaunchPhases(activeLaunch.id, updatedPhases);
 } catch (err) {
 console.error('Failed to update task:', err);
 setError(err?.message || 'Failed to update task.');
 await loadLaunches();
 }
 }

 async function handleAddTask(phaseId) {
 if (!activeLaunch) return;

 const taskTitle = window.prompt('Enter new task:');
 if (!taskTitle?.trim()) return;

 const newTask = {
 id: Date.now().toString(),
 title: taskTitle.trim(),
 completed: false,
 };

 const updatedPhases = activeLaunch.phases.map((phase) =>
 phase.id === phaseId
 ? { ...phase, tasks: [...phase.tasks, newTask] }
 : phase
 );

 const optimistic = { ...activeLaunch, phases: updatedPhases };
 setLaunches((current) =>
 current.map((item) => (item.id === activeLaunch.id ? optimistic : item))
 );

 try {
 await persistLaunchPhases(activeLaunch.id, updatedPhases);
 } catch (err) {
 console.error('Failed to add task:', err);
 setError(err?.message || 'Failed to add task.');
 await loadLaunches();
 }
 }

 async function handleDeleteLaunch(launchId) {
 if (!window.confirm('Are you sure you want to delete this launch?')) return;

 try {
 await apiClient.delete(`/api/launches/${launchId}`);
 const remaining = launches.filter((item) => item.id !== launchId);
 setLaunches(remaining);
 setActiveLaunchId(remaining[0]?.id || '');
 } catch (err) {
 console.error('Failed to delete launch:', err);
 setError(err?.message || 'Failed to delete launch.');
 }
 }

 function getProgress(launch) {
 if (!launch) return { completed: 0, total: 0, percentage: 0 };

 const allTasks = launch.phases.flatMap((phase) => phase.tasks);
 const completed = allTasks.filter((task) => task.completed).length;
 const total = allTasks.length;

 return {
 completed,
 total,
 percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
 };
 }

 const progress = getProgress(activeLaunch);

 return (
 <DashboardLayout>
 <TopBar
 title="Launch Planner"
 subtitle="Plan launches on top of the live Campaigns backend"
 />

 <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
 {error ? (
 <div
 style={{
 marginBottom: 16,
 padding: '12px 16px',
 borderRadius: 12,
 background: "color-mix(in srgb, var(--cth-danger) 10%, var(--cth-admin-panel))",
 border: '1px solid rgba(239, 68, 68, 0.22)',
 color: "var(--cth-danger)",
 fontSize: 13,
 }}
 >
 {error}
 </div>
 ) : null}

 {isLoading ? (
 <div style={{ textAlign: 'center', padding: '60px 20px' }}>
 <Loader2 size={32} style={{ color: colors.cinnabar, animation: 'spin 1s linear infinite' }} />
 </div>
 ) : launches.length === 0 ? (
 <div
 style={{
 textAlign: 'center',
 padding: '80px 20px',
 background: colors.cardBg,
 border: `1px solid ${colors.tuscany}22`,
 borderRadius: 16,
 }}
 >
 <Rocket size={48} style={{ color: colors.textMuted, marginBottom: 16 }} />
 <div style={{ fontSize: 18, color: colors.textPrimary, marginBottom: 8 }}>
 No launches planned yet
 </div>
 <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>
 Create your first offer launch plan and manage it through Campaigns.
 </div>
 <button
 onClick={() => setShowNewLaunchModal(true)}
 style={{
 padding: '12px 24px',
 borderRadius: 10,
 border: 'none',
 background: "var(--cth-admin-accent)",
 color: 'white',
 fontSize: 13,
 fontWeight: 700,
 cursor: 'pointer',
 }}
 >
 Plan Your First Launch
 </button>
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
 <div>
 <div
 style={{
 background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.06))`,
 border: `1px solid ${colors.tuscany}22`,
 borderRadius: 16,
 padding: 16,
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <span style={{ fontSize: 14, color: colors.tuscany, fontWeight: 600 }}>
 Your Launches
 </span>
 <button
 onClick={() => setShowNewLaunchModal(true)}
 style={{
 padding: '6px 12px',
 borderRadius: 6,
 border: 'none',
 background: "var(--cth-admin-accent)",
 color: 'white',
 fontSize: 11,
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: 4,
 }}
 >
 <Plus size={12} />
 New
 </button>
 </div>

 {launches.map((launch) => (
 <div
 key={launch.id}
 onClick={() => setActiveLaunchId(launch.id)}
 style={{
 padding: 12,
 borderRadius: 10,
 marginBottom: 8,
 cursor: 'pointer',
 background:
 activeLaunch?.id === launch.id
 ? "color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))"
 : 'transparent',
 border:
 activeLaunch?.id === launch.id
 ? `1px solid ${colors.crimson}55`
 : '1px solid transparent',
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
 <div>
 <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>
 {launch.name}
 </div>
 {launch.launch_date ? (
 <div style={{ fontSize: 11, color: colors.tuscany, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
 <Calendar size={10} />
 {new Date(launch.launch_date).toLocaleDateString()}
 </div>
 ) : null}
 </div>

 <button
 onClick={(event) => {
 event.stopPropagation();
 handleDeleteLaunch(launch.id);
 }}
 style={{
 padding: 4,
 borderRadius: 4,
 border: 'none',
 background: 'transparent',
 color: colors.textMuted,
 cursor: 'pointer',
 }}
 >
 <Trash2 size={12} />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div>
 {activeLaunch ? (
 <>
 <div
 style={{
 background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.08))`,
 border: `1px solid ${colors.crimson}33`,
 borderRadius: 16,
 padding: '20px 24px',
 marginBottom: 20,
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
 <div>
 <div
 style={{
 fontFamily: "'Playfair Display', Georgia, serif",
 fontSize: 20,
 color: colors.textPrimary,
 fontWeight: 600,
 }}
 >
 {activeLaunch.name}
 </div>
 {activeLaunch.launch_date ? (
 <div style={{ fontSize: 12, color: colors.tuscany, marginTop: 4 }}>
 Launch Date: {new Date(activeLaunch.launch_date).toLocaleDateString('en-US', {
 weekday: 'long',
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 })}
 </div>
 ) : null}
 </div>

 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
 <div style={{ flex: 1 }}>
 <div style={{ background: `${colors.tuscany}22`, borderRadius: 4, height: 8 }}>
 <div
 style={{
 width: `${progress.percentage}%`,
 height: '100%',
 background: "var(--cth-admin-accent)",
 borderRadius: 4,
 transition: 'width 0.3s ease',
 }}
 />
 </div>
 </div>
 <span style={{ fontSize: 14, color: colors.cinnabar, fontWeight: 700 }}>
 {progress.percentage}%
 </span>
 <span style={{ fontSize: 12, color: colors.textMuted }}>
 {progress.completed}/{progress.total} tasks
 </span>
 </div>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 {activeLaunch.phases.map((phase) => {
 const phaseProgress = phase.tasks.filter((task) => task.completed).length;
 const phaseColor = PHASE_COLORS[phase.id] || colors.cinnabar;

 return (
 <div
 key={phase.id}
 style={{
 background: colors.cardBg,
 border: `1px solid ${phaseColor}33`,
 borderRadius: 16,
 overflow: 'hidden',
 }}
 >
 <div
 style={{
 padding: '16px 20px',
 borderBottom: `1px solid ${colors.border}`,
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <div
 style={{
 width: 36,
 height: 36,
 borderRadius: 8,
 background: `${phaseColor}22`,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 }}
 >
 {phase.id === 'pre-launch' && <Clock size={18} style={{ color: phaseColor }} />}
 {phase.id === 'launch' && <Rocket size={18} style={{ color: phaseColor }} />}
 {phase.id === 'post-launch' && <Target size={18} style={{ color: phaseColor }} />}
 </div>

 <div>
 <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
 {phase.name}
 </div>
 <div style={{ fontSize: 11, color: colors.textMuted }}>
 {phase.description}
 </div>
 </div>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <span style={{ fontSize: 12, color: phaseColor, fontWeight: 600 }}>
 {phaseProgress}/{phase.tasks.length}
 </span>

 <button
 onClick={() => handleAddTask(phase.id)}
 style={{
 padding: '6px 10px',
 borderRadius: 6,
 border: `1px solid ${colors.tuscany}44`,
 background: 'transparent',
 color: colors.tuscany,
 fontSize: 11,
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: 4,
 }}
 >
 <Plus size={12} />
 Add Task
 </button>
 </div>
 </div>

 <div style={{ padding: '12px 20px' }}>
 {phase.tasks.map((task) => (
 <div
 key={task.id}
 onClick={() => handleToggleTask(phase.id, task.id)}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 12,
 padding: '10px 0',
 borderBottom: `1px solid ${colors.border}`,
 cursor: 'pointer',
 }}
 >
 {task.completed ? (
 <CheckCircle2 size={18} style={{ color: 'var(--cth-status-success-bright)', flexShrink: 0 }} />
 ) : (
 <Circle size={18} style={{ color: colors.textMuted, flexShrink: 0 }} />
 )}

 <span
 style={{
 fontSize: 13,
 color: task.completed ? colors.textMuted : colors.textPrimary,
 textDecoration: task.completed ? 'line-through' : 'none',
 }}
 >
 {task.title}
 </span>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>

 </>
 ) : null}
 </div>
 </div>
 )}

 {showNewLaunchModal ? (
 <div
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(0, 0, 0, 0.8)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 zIndex: 1000,
 padding: 20,
 }}
 onClick={() => setShowNewLaunchModal(false)}
 >
 <div
 style={{
 background: colors.cardBg,
 borderRadius: 16,
 padding: 24,
 maxWidth: 400,
 width: '100%',
 }}
 onClick={(event) => event.stopPropagation()}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
 <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: colors.textPrimary }}>
 New Launch
 </div>

 <button
 onClick={() => setShowNewLaunchModal(false)}
 style={{
 padding: 8,
 borderRadius: 6,
 border: 'none',
 background: 'transparent',
 color: colors.textMuted,
 cursor: 'pointer',
 }}
 >
 <X size={20} />
 </button>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
 Launch Name *
 </label>
 <input
 type="text"
 value={newLaunchName}
 onChange={(event) => setNewLaunchName(event.target.value)}
 placeholder="e.g., Course Launch, Product Release"
 style={{
 width: '100%',
 padding: '12px 16px',
 borderRadius: 8,
 border: `1px solid ${colors.tuscany}22`,
 background: colors.darkest,
 color: colors.textPrimary,
 fontSize: 14,
 boxSizing: 'border-box',
 }}
 />
 </div>

 <div>
 <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
 Launch Date
 </label>
 <input
 type="date"
 value={newLaunchDate}
 onChange={(event) => setNewLaunchDate(event.target.value)}
 style={{
 width: '100%',
 padding: '12px 16px',
 borderRadius: 8,
 border: `1px solid ${colors.tuscany}22`,
 background: colors.darkest,
 color: colors.textPrimary,
 fontSize: 14,
 boxSizing: 'border-box',
 }}
 />
 </div>

 <button
 onClick={handleCreateLaunch}
 disabled={!newLaunchName.trim()}
 style={{
 marginTop: 8,
 padding: 14,
 borderRadius: 10,
 border: 'none',
 background: !newLaunchName.trim()
 ? colors.textMuted
 : "var(--cth-admin-accent)",
 color: 'white',
 fontSize: 13,
 fontWeight: 700,
 cursor: !newLaunchName.trim() ? 'not-allowed' : 'pointer',
 }}
 >
 Create Launch Plan
 </button>
 </div>
 </div>
 </div>
 ) : null}
 </div>

 <style>
 {`
 @keyframes spin {
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
 }
 `}
 </style>
 </DashboardLayout>
 );
}

export default function LaunchPlanner() {
 return <LaunchPlannerContent />;
}
