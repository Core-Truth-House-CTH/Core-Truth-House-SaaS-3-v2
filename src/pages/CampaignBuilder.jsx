import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout } from '../components/Layout';
import { Loader2, Plus, Zap, Calendar as CalendarIcon, X, Trash2, RefreshCw, Pencil, Radio, Search, User, Package, Megaphone, Check } from 'lucide-react';
import TrackingLinkManager from "../components/mail/TrackingLinkManager";
import UploadZone from '../components/shared/UploadZone';
import apiClient from '../lib/apiClient';
import { API_PATHS } from '../lib/apiPaths';
import RegenerateModal from '../components/campaign/RegenerateModal';
import RetrospectiveSection from '../components/campaign/RetrospectiveSection';

const MAGNET_STEPS = [
 { id: 'M', letter: 'M', label: 'Mission', description: 'Define why this campaign exists and what offer drives it' },
 { id: 'A', letter: 'A', label: 'Audience', description: 'Define the exact person , problem, desire, awareness stage' },
 { id: 'G', letter: 'G', label: 'Gravity Message', description: 'Craft the emotional hook that attracts and converts' },
 { id: 'N', letter: 'N', label: 'Narrative Content System', description: 'Plan the content engine , types, formats, weekly rhythm' },
 { id: 'E', letter: 'E', label: 'Engagement Engine', description: 'Design how your audience interacts with the campaign' },
 { id: 'T', letter: 'T', label: 'Transaction', description: 'Build the conversion funnel from attention to sale' },
];

const OFFER_REQUIRED_GOALS = new Set(['offer_launch', 'sales_conversion']);
const goalRequiresOffer = (goal) => OFFER_REQUIRED_GOALS.has(goal);

const GOAL_CONFIG = {
 offer_launch: { label: 'Offer Launch', color: 'var(--cth-command-crimson)', bg: 'rgba(224,78,53,0.12)' },
 lead_generation: { label: 'Lead Generation', color: 'var(--cth-command-ink)', bg: 'rgba(43,16,64,0.08)' },
 audience_growth: { label: 'Audience Growth', color: 'var(--cth-command-crimson)', bg: 'rgba(118,59,91,0.10)' },
 engagement: { label: 'Engagement', color: 'var(--cth-command-crimson)', bg: 'rgba(224,78,53,0.10)' },
 sales_conversion: { label: 'Sales Conversion', color: 'var(--cth-command-crimson)', bg: 'rgba(118,59,91,0.14)' },
 authority_building: { label: 'Authority Building', color: 'var(--cth-command-ink)', bg: 'rgba(43,16,64,0.10)' },
 re_engagement: { label: 'Re-Engagement', color: 'var(--cth-command-crimson)', bg: 'rgba(118,59,91,0.10)' },
 brand_awareness: { label: 'Brand Awareness', color: 'var(--cth-command-ink)', bg: 'rgba(43,16,64,0.12)' },
};

const GOAL_OPTIONS = [
 { value: 'offer_launch', label: 'Offer Launch' },
 { value: 'lead_generation', label: 'Lead Generation' },
 { value: 'audience_growth', label: 'Audience Growth' },
 { value: 'engagement', label: 'Engagement' },
 { value: 'sales_conversion', label: 'Sales Conversion' },
 { value: 'authority_building', label: 'Authority Building' },
 { value: 're_engagement', label: 'Re-Engagement' },
 { value: 'brand_awareness', label: 'Brand Awareness' },
];

const AWARENESS_STAGE_OPTIONS = [
 { value: 'unaware', label: 'Unaware' },
 { value: 'problem_aware', label: 'Problem Aware' },
 { value: 'solution_aware', label: 'Solution Aware' },
 { value: 'product_aware', label: 'Product Aware' },
 { value: 'most_aware', label: 'Most Aware' },
];

const PLATFORM_OPTIONS = [
 { value: 'instagram', label: 'Instagram' },
 { value: 'linkedin', label: 'LinkedIn' },
 { value: 'tiktok', label: 'TikTok' },
 { value: 'facebook', label: 'Facebook' },
 { value: 'youtube', label: 'YouTube' },
 { value: 'twitter', label: 'Twitter/X' },
 { value: 'email', label: 'Email' },
 { value: 'blog', label: 'Blog' },
];

const METRIC_PRESETS = [
 'Impressions',
 'Reach',
 'Clicks',
 'Link-in-bio visits',
 'Email opens',
 'Email clicks',
 'Leads captured',
 'Sales calls booked',
 'Revenue',
 'New followers',
 'Engagement rate',
 'Content pieces published',
];

const STATUS_CONFIG = {
 draft: { label: 'Draft', color: 'var(--cth-command-muted)', bg: 'var(--cth-command-panel-soft)', border: '1px solid var(--cth-command-border)' },
 active: { label: 'Active', color: 'var(--cth-command-crimson)', bg: 'rgba(175, 0, 42, 0.1)', border: '1px solid rgba(175, 0, 42, 0.2)' },
 paused: { label: 'Paused', color: 'var(--cth-command-gold)', bg: 'rgba(196, 169, 91, 0.1)', border: '1px solid rgba(196, 169, 91, 0.2)' },
 complete: { label: 'Complete', color: 'var(--cth-command-purple)', bg: 'rgba(51, 3, 60, 0.1)', border: '1px solid rgba(51, 3, 60, 0.2)' },
 completed_won: { label: 'Won', color: 'var(--cth-command-crimson)', bg: 'rgba(175, 0, 42, 0.16)', border: '1px solid rgba(175, 0, 42, 0.32)' },
 completed_lost: { label: 'Lost', color: 'var(--cth-command-muted)', bg: 'rgba(122, 106, 114, 0.08)', border: '1px solid rgba(122, 106, 114, 0.22)' },
 completed_learning: { label: 'Learning', color: 'var(--cth-command-gold)', bg: 'rgba(196, 169, 91, 0.16)', border: '1px solid rgba(196, 169, 91, 0.32)' },
};

const DEFAULT_FORM = {
 id: null,
 name: '',
 goal: 'offer_launch',
 offer_id: '',
 offer_name: '',
 offer_description: '',
 transformation: '',
 start_date: '',
 end_date: '',
 platforms: [],
 target_metric: '',
 target_value: '',
 avatar_id: '',
 audience_description: '',
 audience_problem: '',
 audience_desire: '',
 awareness_stage: 'problem_aware',
 emotional_hook: '',
 problem_statement: '',
 promise: '',
 authority: '',
 content_plan: [],
 engagement_tactics: [],
 lead_magnet_idea: '',
 conversion_funnel: [
 { id: 'f1', order: 1, label: 'Organic content (social)', type: 'post' },
 { id: 'f2', order: 2, label: 'Lead magnet', type: 'lead_magnet' },
 { id: 'f3', order: 3, label: 'Email sequence', type: 'email' },
 { id: 'f4', order: 4, label: 'Offer page', type: 'offer_page' },
 { id: 'f5', order: 5, label: 'Purchase / signup', type: 'purchase' },
 ],
 cta_primary: '',
 landing_page_url: '',
 cta_url: '',
 urgency_trigger: '',
 notes: '',
 brief: '',
 generated_hooks: [],
 actual_value: '',
 additional_metrics: [],
 weekly_results: [
 { week: 1, type: 'awareness', label: 'Week 1', reach: '', engagements: '', leads: '' },
 { week: 2, type: 'education', label: 'Week 2', reach: '', engagements: '', leads: '' },
 { week: 3, type: 'authority', label: 'Week 3', reach: '', engagements: '', leads: '' },
 { week: 4, type: 'promotion', label: 'Week 4', reach: '', engagements: '', leads: '' },
 ],
 brand_voice: '',
 os_context_used: [],
 campaign_assets: [],
};

function daysLeft(end) {
 return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000));
}

function magnetCompletion(c) {
 return {
 M: !!(
 c.goal &&
 c.start_date &&
 c.end_date &&
 (c.platforms || []).length &&
 (!goalRequiresOffer(c.goal) || c.offer_name)
 ),
 A: !!(c.audience_description && c.audience_problem && c.awareness_stage),
 G: !!(c.emotional_hook && c.promise),
 N: (c.content_plan || []).length >= 1,
 E: (c.engagement_tactics || []).length >= 1,
 T: !!c.cta_primary,
 };
}

// New MAGNET steps (rebuild) — labels per the Campaign Builder reference.
const MAGNET_ORDER = [
 { key: 'message', letter: 'M', label: 'Message', desc: 'The core message and promise this campaign leads with.' },
 { key: 'audience', letter: 'A', label: 'Audience', desc: 'Who this campaign is for and the problem it speaks to.' },
 { key: 'goal', letter: 'G', label: 'Goal', desc: 'What this campaign drives, on what timeline and platforms.' },
 { key: 'narrative', letter: 'N', label: 'Narrative', desc: 'The story arc — how it moves your audience from where they are to where they want to be.' },
 { key: 'execution', letter: 'E', label: 'Execution', desc: 'The content plan and engagement tactics that carry the campaign.' },
 { key: 'tracking', letter: 'T', label: 'Tracking', desc: 'The conversion path and the links you track it with.' },
];

// Completion derived from each step's actual fields (not the legacy booleans).
function magnetStepDone(c) {
 return {
 message: !!(c.emotional_hook && c.promise),
 audience: !!(c.audience_description && c.audience_problem && c.awareness_stage),
 goal: !!(c.goal && c.start_date && c.end_date && (c.platforms || []).length && (!goalRequiresOffer(c.goal) || c.offer_name)),
 narrative: !!c.narrative_arc,
 execution: (c.content_plan || []).length >= 1 && (c.engagement_tactics || []).length >= 1,
 tracking: !!c.cta_primary,
 };
}

function magnetDoneCount(c) {
 return Object.values(magnetStepDone(c)).filter(Boolean).length;
}

// Active = launched; Complete = marked complete; Draft = otherwise.
function campaignDisplayStatus(c) {
 const s = c?.status || 'draft';
 if (s === 'complete' || s.startsWith('completed')) return 'complete';
 if (s === 'active') return 'active';
 return 'draft';
}

function getGoalDescription(c) {
 return (
 c.transformation ||
 c.promise ||
 c.emotional_hook ||
 (GOAL_CONFIG[c.goal]?.label || '')
 );
}

export function buildCalendarItems(campaign) {
 if (!campaign.content_plan?.length) return [];

 const start = campaign.start_date ? new Date(campaign.start_date) : new Date();

 return campaign.content_plan.map((item) => {
 const weekOffset = (item.week - 1) * 7;
 const dayOffset =
 item.type === 'awareness'
 ? 0
 : item.type === 'education'
 ? 3
 : item.type === 'authority'
 ? 0
 : 3;

 const scheduledDate = new Date(start.getTime() + (weekOffset + dayOffset) * 86400000);

 return {
 campaign_id: campaign.id,
 campaign_name: campaign.name,
 content_item_id: item.id,
 format: item.format,
 platform: item.platform,
 topic: item.topic,
 phase: item.type,
 status: 'draft',
 scheduled_date: scheduledDate.toISOString().split('T')[0],
 generated_id: item.generatedId || null,
 };
 });
}

function StatusBadge({ status }) {
 const c = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
 return (
 <span
 className="font-semibold uppercase"
 style={{
 color: c.color,
 background: c.bg,
 border: c.border,
 borderRadius: 0,
 fontSize: 11,
 letterSpacing: '0.14em',
 padding: '3px 8px',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 {c.label}
 </span>
 );
}

function GoalBadge({ goal }) {
 const c = GOAL_CONFIG[goal] || { label: goal };
 return (
 <span
 className="font-semibold uppercase"
 style={{
 color: 'var(--cth-command-ink)',
 background: 'var(--cth-command-panel-soft)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 0,
 fontSize: 11,
 letterSpacing: '0.14em',
 padding: '3px 8px',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 {c.label}
 </span>
 );
}

function MAGNETProgress({ campaign }) {
 const completion = magnetCompletion(campaign);
 const count = Object.values(completion).filter(Boolean).length;

 return (
 <div className="flex items-center gap-1">
 {MAGNET_STEPS.map((step) => {
 const done = completion[step.id];
 return (
 <div
 key={step.id}
 title={`${step.letter} — ${step.label}`}
 className="w-5 h-5 flex items-center justify-center text-[9px] font-bold transition-all"
 style={{
 background: done ? 'var(--cth-command-crimson)' : 'var(--cth-command-panel-soft)',
 color: done ? 'var(--cth-command-ivory)' : 'var(--cth-command-muted)',
 border: done ? 'none' : '1px solid var(--cth-command-border)',
 borderRadius: 0,
 }}
 >
 {step.letter}
 </div>
 );
 })}
 <span className="text-[10px] cth-muted ml-1">{count}/6</span>
 </div>
 );
}

function TabResults({ campaign, onSaveResults }) {
 const [actual, setActual] = useState(campaign.actual_value || '');
 const [metrics, setMetrics] = useState(campaign.additional_metrics || []);
 const [weekly, setWeekly] = useState(
 campaign.weekly_results?.length
 ? campaign.weekly_results
 : DEFAULT_FORM.weekly_results
 );
 const [targetMetric, setTargetMetric] = useState(campaign.target_metric || '');
 const [targetValue, setTargetValue] = useState(campaign.target_value || '');
 const [isSaved, setIsSaved] = useState(false);

 useEffect(() => {
 setActual(campaign.actual_value || '');
 setMetrics(campaign.additional_metrics || []);
 setWeekly(campaign.weekly_results?.length ? campaign.weekly_results : DEFAULT_FORM.weekly_results);
 setTargetMetric(campaign.target_metric || '');
 setTargetValue(campaign.target_value || '');
 }, [campaign]);

 const target = parseFloat(targetValue) || 0;
 const act = parseFloat(actual) || 0;
 const pct = target > 0 ? Math.min(Math.round((act / target) * 100), 200) : 0;
 const overAchieved = pct > 100;

 const addMetric = () =>
 setMetrics((prev) => [...prev, { id: Date.now().toString(), label: '', target: '', actual: '' }]);

 const updateMetric = (id, key, val) =>
 setMetrics((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: val } : m)));

 const removeMetric = (id) =>
 setMetrics((prev) => prev.filter((m) => m.id !== id));

 const updateWeekly = (week, key, val) =>
 setWeekly((prev) => prev.map((w) => (w.week === week ? { ...w, [key]: val } : w)));

 const addWeek = () =>
 setWeekly((prev) => [
 ...prev,
 { week: prev.length + 1, type: 'custom', label: `Week ${prev.length + 1}`, reach: '', engagements: '', leads: '' },
 ]);

 const handleSave = async () => {
 try {
 await onSaveResults(campaign.id, {
 target_metric: targetMetric,
 target_value: targetValue,
 actual_value: actual,
 additional_metrics: metrics,
 weekly_results: weekly,
 });
 setIsSaved(true);
 setTimeout(() => setIsSaved(false), 1500);
 } catch (err) {
 toast.error('Could not save results. Please try again.');
 }
 };

 return (
 <div data-testid="results-tab" className="space-y-5">
 <div className="flex items-center justify-between">
 <p className="text-sm font-semibold cth-muted">Campaign Results</p>
 <button
 onClick={handleSave}
 data-testid="save-results-btn"
 className={`flex items-center gap-1.5 px-3.5 py-1.5 border text-xs font-medium transition-all ${
 isSaved
 ? 'border-[var(--cth-command-crimson)]/15 bg-[var(--cth-command-crimson)]/10 text-[var(--cth-command-crimson)]'
 : 'border-[var(--cth-command-crimson)]/25 bg-[var(--cth-command-crimson)]/10 cth-text-accent'
 }`}
 >
 {isSaved ? '✓ Saved' : 'Save results'}
 </button>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="p-5 cth-card-muted border border-[var(--cth-command-border)]">
 <p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-2">Target</p>
 <input
 value={targetValue}
 onChange={(e) => setTargetValue(e.target.value)}
 placeholder="0"
 className="bg-transparent border-none outline-none text-3xl font-bold w-full p-0"
 style={{
 fontFamily: 'DM Sans, system-ui, sans-serif',
 color: targetValue ? 'var(--cth-command-ink)' : 'var(--cth-command-muted)',
 }}
 />
 <input
 value={targetMetric}
 onChange={(e) => setTargetMetric(e.target.value)}
 placeholder="e.g. Revenue, Leads, Sign-ups"
 className="bg-transparent border-none outline-none text-xs w-full p-0 mt-0.5"
 style={{
 fontFamily: 'DM Sans, system-ui, sans-serif',
 color: 'var(--cth-command-muted)',
 }}
 />
 </div>

 <div className="p-5 cth-card-muted border border-[var(--cth-command-border)]">
 <p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-2">Actual</p>
 <input
 value={actual}
 onChange={(e) => setActual(e.target.value)}
 placeholder="Enter result..."
 className="bg-transparent border-none outline-none text-3xl font-bold w-full p-0"
 style={{
 fontFamily: 'DM Sans, system-ui, sans-serif',
 color: act > 0 ? (overAchieved ? 'var(--cth-command-gold)' : 'var(--cth-command-crimson)') : 'var(--cth-command-muted)',
 }}
 />
 <p className="text-xs cth-muted mt-0.5">
 {targetMetric || 'Primary metric'} {act > 0 && target > 0 ? `· ${pct}% of target` : ''}
 </p>
 </div>
 </div>

 <div>
 <div className="h-2 cth-card-muted rounded-full overflow-hidden">
 <div
 className="h-full rounded-full"
 style={{
 width: `${Math.min(pct, 100)}%`,
 background: overAchieved ? 'var(--cth-command-gold)' : pct >= 70 ? 'var(--cth-command-ink)' : 'var(--cth-command-crimson)',
 }}
 />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-2.5">
 <p className="text-xs font-semibold cth-muted">Additional Metrics</p>
 <button onClick={addMetric} className="text-[10.5px] cth-text-accent">+ Add metric</button>
 </div>

 <div className="cth-card-muted border border-[var(--cth-command-border)] overflow-hidden">
 <div className="grid grid-cols-[1fr_100px_100px_80px] px-3.5 py-2 border-b border-[var(--cth-command-border)] cth-card-muted">
 {['Metric', 'Target', 'Actual', ''].map((h) => (
 <span key={h} className="text-[9px] font-semibold uppercase tracking-widest cth-muted">
 {h}
 </span>
 ))}
 </div>

 {metrics.length === 0 && (
 <p className="text-xs cth-muted px-3.5 py-3">No additional metrics yet.</p>
 )}

 {metrics.map((m) => (
 <div key={m.id} className="grid grid-cols-[1fr_100px_100px_80px] items-center px-3.5 py-2 border-b border-[var(--cth-command-border)] last:border-b-0">
 <input
 value={m.label}
 onChange={(e) => updateMetric(m.id, 'label', e.target.value)}
 placeholder="e.g. Impressions"
 list="metric-presets"
 className="bg-transparent border-none outline-none text-xs cth-muted"
 />
 <input
 value={m.target}
 onChange={(e) => updateMetric(m.id, 'target', e.target.value)}
 className="bg-transparent border-none outline-none text-xs cth-muted"
 />
 <input
 value={m.actual}
 onChange={(e) => updateMetric(m.id, 'actual', e.target.value)}
 className="bg-transparent border-none outline-none text-xs cth-muted"
 />
 <button onClick={() => removeMetric(m.id)} className="cth-muted hover:text-red-400 text-sm ml-auto">
 ×
 </button>
 </div>
 ))}
 </div>

 <datalist id="metric-presets">
 {METRIC_PRESETS.map((p) => (
 <option key={p} value={p} />
 ))}
 </datalist>
 </div>

 <div>
 <div className="flex items-center justify-between mb-2.5">
 <p className="text-xs font-semibold cth-muted">Weekly Breakdown</p>
 <button onClick={addWeek} className="text-[10.5px] cth-text-accent">+ Add week</button>
 </div>

 <div className="cth-card-muted border border-[var(--cth-command-border)] overflow-hidden">
 <div className="grid grid-cols-[100px_1fr_1fr_1fr] px-3.5 py-2 border-b border-[var(--cth-command-border)] cth-card-muted">
 {['Week', 'Reach', 'Engagements', 'Leads'].map((h) => (
 <span key={h} className="text-[9px] font-semibold uppercase tracking-widest cth-muted">
 {h}
 </span>
 ))}
 </div>

 {weekly.map((w, idx) => (
 <div key={w.week} className={`grid grid-cols-[100px_1fr_1fr_1fr] items-center px-3.5 py-2 ${idx < weekly.length - 1 ? 'border-b border-[var(--cth-command-border)]' : ''}`}>
 <div>
 <p className="text-xs font-semibold cth-muted">Week {w.week}</p>
 <p className="text-[9.5px] cth-muted">{w.label}</p>
 </div>
 <input value={w.reach || ''} onChange={(e) => updateWeekly(w.week, 'reach', e.target.value)} className="bg-transparent border-none outline-none text-xs cth-muted" />
 <input value={w.engagements || ''} onChange={(e) => updateWeekly(w.week, 'engagements', e.target.value)} className="bg-transparent border-none outline-none text-xs cth-muted" />
 <input value={w.leads || ''} onChange={(e) => updateWeekly(w.week, 'leads', e.target.value)} className="bg-transparent border-none outline-none text-xs cth-muted" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

function CalendarPopulateModal({ campaign, onConfirm, onCancel }) {
 const items = buildCalendarItems(campaign);

 return (
 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" data-testid="calendar-modal">
 <div className="cth-card border border-[var(--cth-command-border)] p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-1">
 <p className="text-base font-bold cth-heading" >
 Push to Calendar
 </p>
 <button onClick={onCancel} className="cth-muted hover:cth-muted">
 <X size={16} />
 </button>
 </div>

 <p className="text-xs cth-muted mb-4">
 This will create {items.length} scheduled draft{items.length !== 1 ? 's' : ''}.
 </p>

 <div className="mb-4 space-y-1.5">
 {items.map((item) => (
 <div key={`${item.campaign_id}-${item.content_item_id}`} className="flex items-center gap-2.5 p-2.5 cth-card-muted border border-[var(--cth-command-border)]">
 <div className="flex-1 min-w-0">
 <p className="text-[11.5px] font-medium cth-muted truncate">{item.format}</p>
 <p className="text-[10px] cth-muted truncate">{item.platform} · {item.topic || 'No topic set'}</p>
 </div>
 <span className="text-[10px] cth-muted font-mono flex-shrink-0">{item.scheduled_date}</span>
 </div>
 ))}
 </div>

 <div className="flex gap-2">
 <button onClick={onCancel} className="flex-1 py-2.5 border border-[var(--cth-command-border)] cth-muted text-xs">
 Cancel
 </button>
 <button onClick={() => onConfirm(items)} className="flex-[2] py-2.5 bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] text-xs font-semibold">
 Push {items.length} items to Calendar
 </button>
 </div>
 </div>
 </div>
 );
}

const LINKAGE_PANEL_STYLE = {
 marginTop: 24,
 padding: '20px 24px',
 background: 'var(--cth-command-panel, #fbf7f1)',
 border: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
 borderRadius: 0,
};
const LINKAGE_EYEBROW_STYLE = {
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 10,
 fontWeight: 600,
 letterSpacing: '0.22em',
 textTransform: 'uppercase',
 color: 'var(--cth-command-muted, #7a6a72)',
 marginBottom: 6,
};
const LINKAGE_HEADING_STYLE = {
 fontFamily: '"Playfair Display", serif',
 fontSize: 20,
 color: 'var(--cth-command-ink, #2a1a25)',
 margin: 0,
};
const LINKAGE_ADD_BTN_STYLE = {
 padding: '8px 16px',
 borderRadius: 0,
 backgroundColor: 'var(--cth-command-purple, #33033C)',
 color: 'var(--cth-command-gold, #C4A95B)',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 12,
 fontWeight: 600,
 letterSpacing: '0.04em',
 border: 'none',
 cursor: 'pointer',
};
const LINKAGE_SOURCE_BADGE = {
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 9,
 fontWeight: 700,
 letterSpacing: '0.14em',
 textTransform: 'uppercase',
 padding: '3px 7px',
 borderRadius: 0,
 background: 'var(--cth-command-panel-soft, #f4eee5)',
 color: 'var(--cth-command-purple, #33033C)',
 border: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
};

function CampaignLinkagePanels({
 selected,
 linkedMedia,
 linkedContent,
 linkedSocialPosts,
 linkageLoading,
 onRemoveMedia,
 onAddMedia,
 onAddContent,
 onAddSocial,
}) {
 if (!selected) return null;

 const cardBg = 'var(--cth-command-panel-soft, #f4eee5)';
 const cardBorder = '1px solid var(--cth-command-border, rgba(216,197,195,0.6))';
 const ink = 'var(--cth-command-ink, #2a1a25)';
 const muted = 'var(--cth-command-muted, #7a6a72)';

 return (
 <div style={{ padding: '0 32px 32px' }}>
 {/* CAMPAIGN MEDIA */}
 <div style={LINKAGE_PANEL_STYLE}>
 <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
 <div>
 <div style={LINKAGE_EYEBROW_STYLE}>Campaign Media</div>
 <h3 style={LINKAGE_HEADING_STYLE}>Linked Media</h3>
 </div>
 <button type="button" onClick={onAddMedia} style={LINKAGE_ADD_BTN_STYLE}>+ Add Media</button>
 </div>
 {linkageLoading ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>Loading…</p>
 ) : linkedMedia.length === 0 ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>No media linked yet. Generate or upload assets in Media Studio.</p>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
 {linkedMedia.map((m) => {
 const id = m.asset_id || m.id;
 const url = m.preview_url || m.file_url || m.url || '';
 const isVideo = m.media_type === 'video' || m.file_type?.startsWith?.('video');
 return (
 <div key={id} style={{ background: cardBg, border: cardBorder, borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
 <div style={{ aspectRatio: '4 / 3', background: 'var(--cth-command-panel, #fbf7f1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 {url ? (
 isVideo ? (
 <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
 ) : (
 <img src={url} alt={m.label || m.prompt || 'Media'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 )
 ) : (
 <span style={{ color: muted, fontSize: 11 }}>No preview</span>
 )}
 </div>
 <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
 <span style={LINKAGE_SOURCE_BADGE}>{m.source === 'uploaded' ? 'Uploaded' : 'Generated'}</span>
 <button
 type="button"
 onClick={() => onRemoveMedia(id)}
 style={{
 background: 'none',
 border: 'none',
 padding: 0,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 11,
 color: 'var(--cth-command-crimson, #AF0024)',
 cursor: 'pointer',
 textDecoration: 'underline',
 }}
 >
 Remove
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* CAMPAIGN CONTENT */}
 <div style={LINKAGE_PANEL_STYLE}>
 <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
 <div>
 <div style={LINKAGE_EYEBROW_STYLE}>Campaign Content</div>
 <h3 style={LINKAGE_HEADING_STYLE}>Linked Content</h3>
 </div>
 <button type="button" onClick={onAddContent} style={LINKAGE_ADD_BTN_STYLE}>+ Create Content</button>
 </div>
 {linkageLoading ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>Loading…</p>
 ) : linkedContent.length === 0 ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>No content linked yet. Generate copy in Content Studio.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {linkedContent.map((c) => (
 <div key={c.id} style={{ background: cardBg, border: cardBorder, borderRadius: 0, padding: '12px 14px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
 <span style={LINKAGE_SOURCE_BADGE}>{c.content_type || 'Content'}</span>
 <span style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: ink }}>{c.title || 'Untitled'}</span>
 </div>
 <p style={{ margin: 0, color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 12, lineHeight: 1.5 }}>
 {(c.content || '').replace(/[#*_>`]/g, '').slice(0, 100)}{(c.content || '').length > 100 ? '…' : ''}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* SOCIAL POSTS */}
 <div style={LINKAGE_PANEL_STYLE}>
 <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
 <div>
 <div style={LINKAGE_EYEBROW_STYLE}>Social Posts</div>
 <h3 style={LINKAGE_HEADING_STYLE}>Scheduled Posts</h3>
 </div>
 <button type="button" onClick={onAddSocial} style={LINKAGE_ADD_BTN_STYLE}>+ Schedule Post</button>
 </div>
 {linkageLoading ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>Loading…</p>
 ) : linkedSocialPosts.length === 0 ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>No social posts linked yet. Schedule one in Social Planner.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {linkedSocialPosts.map((p) => {
 const statusColors = {
 draft: { bg: 'var(--cth-command-panel, #fbf7f1)', fg: muted },
 scheduled: { bg: 'rgba(196,169,91,0.18)', fg: 'var(--cth-command-purple, #33033C)' },
 published: { bg: 'rgba(51,3,60,0.10)', fg: 'var(--cth-command-purple, #33033C)' },
 failed: { bg: 'rgba(175,0,36,0.12)', fg: 'var(--cth-command-crimson, #AF0024)' },
 };
 const sc = statusColors[p.status] || statusColors.draft;
 return (
 <div key={p.id} style={{ background: cardBg, border: cardBorder, borderRadius: 0, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
 <div style={{ minWidth: 0, flex: 1 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
 <span style={LINKAGE_SOURCE_BADGE}>{p.platform || 'Platform'}</span>
 <span style={{ ...LINKAGE_SOURCE_BADGE, background: sc.bg, color: sc.fg }}>{p.status || 'draft'}</span>
 {p.scheduled_for ? (
 <span style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 11, color: muted }}>
 {new Date(p.scheduled_for).toLocaleDateString()}
 </span>
 ) : null}
 </div>
 <p style={{ margin: 0, color: ink, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 {(p.content || '').slice(0, 140)}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}

const EDIT_LABEL_STYLE = {
 display: 'block',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: '0.18em',
 textTransform: 'uppercase',
 color: 'var(--cth-command-muted)',
 marginBottom: 6,
};

const EDIT_INPUT_STYLE = {
 width: '100%',
 padding: '10px 12px',
 background: 'var(--cth-command-panel)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 0,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 14,
 color: 'var(--cth-command-ink)',
 outline: 'none',
};

const EDIT_TEXTAREA_STYLE = {
 ...EDIT_INPUT_STYLE,
 minHeight: 90,
 resize: 'vertical',
 lineHeight: 1.6,
};

function OverviewEditForm({ draft, onChange, onTogglePlatform, onSave, onCancel }) {
 const platforms = Array.isArray(draft.platforms) ? draft.platforms : [];

 return (
 <div
 data-testid="overview-edit-form"
 style={{
 padding: 24,
 background: 'var(--cth-command-panel)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 0,
 }}
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-4">
 <div>
 <label style={EDIT_LABEL_STYLE}>Campaign Name</label>
 <input
 type="text"
 value={draft.name || ''}
 onChange={(e) => onChange('name', e.target.value)}
 style={EDIT_INPUT_STYLE}
 />
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>Goal</label>
 <select
 value={draft.goal || ''}
 onChange={(e) => onChange('goal', e.target.value)}
 style={EDIT_INPUT_STYLE}
 >
 <option value="">Choose a goal…</option>
 {GOAL_OPTIONS.map((opt) => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>Emotional Hook</label>
 <textarea
 value={draft.emotional_hook || ''}
 onChange={(e) => onChange('emotional_hook', e.target.value)}
 style={EDIT_TEXTAREA_STYLE}
 />
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>Promise</label>
 <textarea
 value={draft.promise || ''}
 onChange={(e) => onChange('promise', e.target.value)}
 style={EDIT_TEXTAREA_STYLE}
 />
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label style={EDIT_LABEL_STYLE}>Primary CTA</label>
 <input
 type="text"
 value={draft.cta_primary || ''}
 onChange={(e) => onChange('cta_primary', e.target.value)}
 style={EDIT_INPUT_STYLE}
 />
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>Audience Description</label>
 <textarea
 value={draft.audience_description || ''}
 onChange={(e) => onChange('audience_description', e.target.value)}
 style={EDIT_TEXTAREA_STYLE}
 />
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>Audience Problem</label>
 <textarea
 value={draft.audience_problem || ''}
 onChange={(e) => onChange('audience_problem', e.target.value)}
 style={EDIT_TEXTAREA_STYLE}
 />
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>Awareness Stage</label>
 <select
 value={draft.awareness_stage || ''}
 onChange={(e) => onChange('awareness_stage', e.target.value)}
 style={EDIT_INPUT_STYLE}
 >
 <option value="">Select stage…</option>
 {AWARENESS_STAGE_OPTIONS.map((opt) => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
 <div>
 <label style={EDIT_LABEL_STYLE}>Start Date</label>
 <input
 type="date"
 value={draft.start_date || ''}
 onChange={(e) => onChange('start_date', e.target.value)}
 style={EDIT_INPUT_STYLE}
 />
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>End Date</label>
 <input
 type="date"
 value={draft.end_date || ''}
 onChange={(e) => onChange('end_date', e.target.value)}
 style={EDIT_INPUT_STYLE}
 />
 </div>
 <div>
 <label style={EDIT_LABEL_STYLE}>Offer Name</label>
 <input
 type="text"
 value={draft.offer_name || ''}
 onChange={(e) => onChange('offer_name', e.target.value)}
 style={EDIT_INPUT_STYLE}
 />
 </div>
 </div>

 <div className="mt-4">
 <label style={EDIT_LABEL_STYLE}>Platforms</label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 {PLATFORM_OPTIONS.map((opt) => {
 const checked = platforms.includes(opt.value);
 return (
 <label
 key={opt.value}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 8,
 padding: '8px 12px',
 background: checked ? 'rgba(175, 0, 42, 0.08)' : 'transparent',
 border: checked
 ? '1px solid var(--cth-command-crimson)'
 : '1px solid var(--cth-command-border)',
 borderRadius: 0,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 13,
 color: 'var(--cth-command-ink)',
 cursor: 'pointer',
 }}
 >
 <input
 type="checkbox"
 checked={checked}
 onChange={() => onTogglePlatform(opt.value)}
 style={{ accentColor: 'var(--cth-command-crimson)' }}
 />
 {opt.label}
 </label>
 );
 })}
 </div>
 </div>

 <div
 className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-5"
 style={{ borderTop: '1px solid var(--cth-command-border)' }}
 >
 <button
 type="button"
 onClick={onCancel}
 data-testid="overview-cancel-btn"
 style={{
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 0,
 padding: '10px 18px',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 13,
 fontWeight: 500,
 cursor: 'pointer',
 }}
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={onSave}
 data-testid="overview-save-btn"
 style={{
 background: 'var(--cth-command-purple)',
 color: 'var(--cth-command-gold)',
 border: 'none',
 borderRadius: 0,
 padding: '10px 22px',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 13,
 fontWeight: 600,
 letterSpacing: '0.04em',
 cursor: 'pointer',
 }}
 >
 Save Changes
 </button>
 </div>
 </div>
 );
}

function CampaignBuilderPageContent() {
 const { user } = useUser();
 const { currentWorkspace } = useWorkspace();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();

 const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || '';
 const userId = user?.id || '';

 const [campaigns, setCampaigns] = useState([]);
 const [selectedId, setSelectedId] = useState(null);
 const [statusFilter, setStatusFilter] = useState('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [sortOrder, setSortOrder] = useState('newest');
 const [detailTab, setDetailTab] = useState('overview');
 const [isEditingOverview, setIsEditingOverview] = useState(false);
 const [overviewDraft, setOverviewDraft] = useState({});
 const [loading, setLoading] = useState(true);
 const [savedOffers, setSavedOffers] = useState([]);
 const [avatars, setAvatars] = useState([]); // Audience-tab avatars for the Audience step dropdown
 const [calendarCampaign, setCalendarCampaign] = useState(null);
 const [calendarDone, setCalendarDone] = useState({});

 const [linkedMedia, setLinkedMedia] = useState([]);
 const [deleteTarget, setDeleteTarget] = useState(null);
 const [deleting, setDeleting] = useState(false);
 const [linkedContent, setLinkedContent] = useState([]);
 const [linkedSocialPosts, setLinkedSocialPosts] = useState([]);
 const [linkageLoading, setLinkageLoading] = useState(false);

 const [briefGenerating, setBriefGenerating] = useState(false);
 const [briefRegenerating, setBriefRegenerating] = useState(false);
 const [briefModalOpen, setBriefModalOpen] = useState(false);

 const [hooksGenerating, setHooksGenerating] = useState(false);
 const [hooksRegenerating, setHooksRegenerating] = useState(false);
 const [hooksModalOpen, setHooksModalOpen] = useState(false);

 const loadCampaigns = useCallback(async () => {
 if (!workspaceId || !userId) return;

 try {
 const res = await apiClient.get('/api/campaigns', {
 params: {
 user_id: userId,
 workspace_id: workspaceId,
 },
 });
 const nextCampaigns = res?.campaigns || [];
 setCampaigns(nextCampaigns);

 const idFromUrl = searchParams.get('id');
 setSelectedId((prev) => {
 if (idFromUrl && nextCampaigns.some((c) => c.id === idFromUrl)) return idFromUrl;
 if (prev && nextCampaigns.some((c) => c.id === prev)) return prev;
 return nextCampaigns[0]?.id || null;
 });
 } catch (e) {
 console.error('Failed to load campaigns:', e);
 } finally {
 setLoading(false);
 }
 }, [workspaceId, userId, searchParams]);

 const loadOffers = useCallback(async () => {
 if (!workspaceId || !userId) return;
 try {
 const res = await apiClient.get('/api/offers', {
 params: {
 user_id: userId,
 workspace_id: workspaceId,
 },
 });
 setSavedOffers(res?.offers || []);
 } catch (e) {
 console.error('Failed to load offers:', e);
 setSavedOffers([]);
 }
 }, [workspaceId, userId]);

 // Avatars come from the Audience collection (same source as Offer Builder)
 // so the Audience step is a dropdown of real avatars, not free text.
 const loadAvatars = useCallback(async () => {
 if (!workspaceId) return;
 try {
 const res = await apiClient.get(API_PATHS.audience.avatars);
 const list = Array.isArray(res?.avatars) ? res.avatars : Array.isArray(res) ? res : [];
 setAvatars(list.filter((a) => a?.id && a?.name));
 } catch (e) {
 console.error('Failed to load avatars:', e);
 setAvatars([]);
 }
 }, [workspaceId]);

 useEffect(() => {
 if (!workspaceId) return;
 loadCampaigns();
 loadOffers();
 loadAvatars();
 }, [workspaceId, loadCampaigns, loadOffers, loadAvatars]);

 const selected = useMemo(
 () => campaigns.find((c) => c.id === selectedId) || null,
 [campaigns, selectedId]
 );

 const loadLinkedAssets = useCallback(async (campaignId) => {
 if (!campaignId) {
 setLinkedMedia([]);
 setLinkedContent([]);
 setLinkedSocialPosts([]);
 return;
 }
 setLinkageLoading(true);
 try {
 const [mediaRes, contentRes, socialRes] = await Promise.allSettled([
 apiClient.get(`/api/media/campaign/${campaignId}`),
 apiClient.get('/api/persist/content/library', { params: { user_id: userId, workspace_id: workspaceId, campaign_id: campaignId } }),
 apiClient.get(`/api/social/posts/by-campaign/${campaignId}`),
 ]);
 setLinkedMedia(mediaRes.status === 'fulfilled' ? (mediaRes.value?.media || []) : []);
 const allContent = contentRes.status === 'fulfilled' ? (contentRes.value?.items || contentRes.value?.content || []) : [];
 setLinkedContent(allContent.filter((it) => it.campaign_id === campaignId));
 setLinkedSocialPosts(socialRes.status === 'fulfilled' ? (socialRes.value?.posts || []) : []);
 } catch (e) {
 console.error('Failed to load linked assets:', e);
 } finally {
 setLinkageLoading(false);
 }
 }, [userId, workspaceId]);

 useEffect(() => {
 if (selectedId) loadLinkedAssets(selectedId);
 else {
 setLinkedMedia([]);
 setLinkedContent([]);
 setLinkedSocialPosts([]);
 }
 }, [selectedId, loadLinkedAssets]);

 const handleRemoveLinkedMedia = useCallback(async (assetId) => {
 if (!selected || !assetId) return;
 const currentIds = Array.isArray(selected.media_asset_ids) ? selected.media_asset_ids : [];
 const nextIds = currentIds.filter((id) => id !== assetId);
 try {
 await apiClient.put(`/api/campaigns/${selected.id}`, { media_asset_ids: nextIds });
 setCampaigns((prev) => prev.map((c) => (c.id === selected.id ? { ...c, media_asset_ids: nextIds } : c)));
 setLinkedMedia((prev) => prev.filter((m) => (m.asset_id || m.id) !== assetId));
 } catch (e) {
 console.error('Failed to remove media from campaign:', e);
 }
 }, [selected]);

 const filtered = useMemo(
 () => {
 let list = campaigns.filter((c) => statusFilter === 'all' || c.status === statusFilter);

 const term = searchQuery.trim().toLowerCase();
 if (term) {
 list = list.filter((c) => (c.name || '').toLowerCase().includes(term));
 }

 const sorted = [...list];
 const STATUS_RANK = { active: 0, draft: 1, complete: 2 };
 switch (sortOrder) {
 case 'status':
 sorted.sort((a, b) => (STATUS_RANK[campaignDisplayStatus(a)] ?? 9) - (STATUS_RANK[campaignDisplayStatus(b)] ?? 9));
 break;
 case 'magnet':
 sorted.sort((a, b) => magnetDoneCount(b) - magnetDoneCount(a));
 break;
 case 'newest':
 default:
 sorted.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
 break;
 }

 return sorted;
 },
 [campaigns, statusFilter, searchQuery, sortOrder]
 );

 const renderedCampaignBrief = useMemo(() => {
 if (!selected?.brief) return '';
 return DOMPurify.sanitize(marked.parse(selected.brief));
 }, [selected?.brief]);

 const handleSave = (campaign) => {
 setCampaigns((prev) => [campaign, ...prev.filter((c) => c.id !== campaign.id)]);
 setSelectedId(campaign.id);
 setDetailTab('overview');
 setSearchQuery('');
 };

 const handleStatusChange = async (id, status) => {
 const previous = campaigns;
 setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

 try {
 await apiClient.post(`/api/campaigns/${id}/status`, null, { params: { status } });

 if (status === 'active') {
 const camp = campaigns.find((c) => c.id === id);
 if (camp?.content_plan?.length) {
 navigate('/social-media-manager', {
 state: {
 campaignId: camp.id,
 campaignName: camp.name,
 offerName: camp.offer_name || '',
 contentPlan: camp.content_plan || [],
 source: 'campaign-builder',
 },
 });
 }
 }
 } catch (err) {
 setCampaigns(previous);
 toast.error('Could not update status. Please try again.');
 }
 };

 const handleSaveResults = async (id, updates) => {
 const previous = campaigns;
 setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
 try {
 await apiClient.post(`/api/campaigns/${id}/update-results`, updates);
 } catch (err) {
 setCampaigns(previous);
 toast.error('Could not save results. Please try again.');
 throw err;
 }
 };

 const handleDelete = (id) => {
 const target = campaigns.find((c) => c.id === id);
 if (!target) return;
 setDeleteTarget(target);
 };

 const handleConfirmDelete = async () => {
 if (!deleteTarget) return;
 const id = deleteTarget.id;
 const previous = campaigns;
 setDeleting(true);
 setCampaigns((prev) => prev.filter((c) => c.id !== id));
 if (selectedId === id) {
 const remaining = previous.filter((c) => c.id !== id);
 setSelectedId(remaining[0]?.id || null);
 }
 try {
 await apiClient.delete(`/api/campaigns/${id}`);
 setDeleteTarget(null);
 } catch (e) {
 console.error('Delete failed:', e);
 setCampaigns(previous);
 setSelectedId(id);
 toast.error('Could not delete campaign. Please try again.');
 } finally {
 setDeleting(false);
 }
 };

 const handleCalendarConfirm = async (items) => {
 try {
 await apiClient.post('/api/campaigns/calendar-items', { items });
 } catch (e) {
 console.error('Calendar push failed:', e);
 }
 if (calendarCampaign?.id) {
 setCalendarDone((prev) => ({ ...prev, [calendarCampaign.id]: true }));
 }
 setCalendarCampaign(null);
 };

 const handleAssetsUpdate = async (campaignId, nextAssets) => {
 setCampaigns((prev) =>
 prev.map((c) => (c.id === campaignId ? { ...c, campaign_assets: nextAssets } : c))
 );

 try {
 await apiClient.patch(`/api/campaigns/${campaignId}`, {
 campaign_assets: nextAssets,
 });
 } catch (e) {
 console.error('Failed to persist campaign assets:', e);
 }
 };

 const handleGenerateBrief = async () => {
 if (!selected || briefGenerating) return;
 setBriefGenerating(true);
 try {
 const res = await apiClient.post(`/api/campaigns/${selected.id}/generate-brief`);
 const newBrief = res?.brief || '';
 setCampaigns((prev) =>
 prev.map((c) => (c.id === selected.id ? { ...c, brief: newBrief } : c))
 );
 toast.success('Brief generated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to generate brief.');
 } finally {
 setBriefGenerating(false);
 }
 };

 const handleBriefRegenerate = async (mode) => {
 if (!selected || briefRegenerating) return;
 setBriefRegenerating(true);
 try {
 const res = await apiClient.post(
 API_PATHS.campaigns.regenerateBrief(selected.id),
 null,
 { params: { mode } }
 );
 if (res?.id) {
 setCampaigns((prev) =>
 prev.map((c) => (c.id === res.id ? res : c))
 );
 }
 setBriefModalOpen(false);
 toast.success('Brief regenerated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to regenerate brief.');
 } finally {
 setBriefRegenerating(false);
 }
 };

 const handleGenerateHooks = async () => {
 if (!selected || hooksGenerating) return;
 setHooksGenerating(true);
 try {
 const res = await apiClient.post(`/api/campaigns/${selected.id}/generate-hooks`);
 const newHooks = Array.isArray(res?.hooks) ? res.hooks : [];
 setCampaigns((prev) =>
 prev.map((c) => (c.id === selected.id ? { ...c, generated_hooks: newHooks } : c))
 );
 toast.success('Hooks generated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to generate hooks.');
 } finally {
 setHooksGenerating(false);
 }
 };

 const handleHooksRegenerate = async (mode) => {
 if (!selected || hooksRegenerating) return;
 setHooksRegenerating(true);
 try {
 const res = await apiClient.post(
 API_PATHS.campaigns.regenerateHooks(selected.id),
 null,
 { params: { mode } }
 );
 if (res?.id) {
 setCampaigns((prev) =>
 prev.map((c) => (c.id === res.id ? res : c))
 );
 }
 setHooksModalOpen(false);
 toast.success('Hooks regenerated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to regenerate hooks.');
 } finally {
 setHooksRegenerating(false);
 }
 };

 const handleCampaignUpdate = (updated) => {
 if (!updated?.id) return;
 setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
 };

 useEffect(() => {
 setIsEditingOverview(false);
 }, [selectedId]);

 const handleStartEditOverview = () => {
 if (!selected) return;
 setOverviewDraft({
 name: selected.name || '',
 goal: selected.goal || '',
 emotional_hook: selected.emotional_hook || '',
 promise: selected.promise || '',
 audience_description: selected.audience_description || '',
 audience_problem: selected.audience_problem || '',
 awareness_stage: selected.awareness_stage || '',
 cta_primary: selected.cta_primary || '',
 start_date: selected.start_date || '',
 end_date: selected.end_date || '',
 platforms: Array.isArray(selected.platforms) ? selected.platforms : [],
 offer_name: selected.offer_name || '',
 });
 setIsEditingOverview(true);
 };

 const handleOverviewDraftChange = (key, value) => {
 setOverviewDraft((prev) => ({ ...prev, [key]: value }));
 };

 const handleTogglePlatform = (platform) => {
 setOverviewDraft((prev) => {
 const current = Array.isArray(prev.platforms) ? prev.platforms : [];
 const next = current.includes(platform)
 ? current.filter((p) => p !== platform)
 : [...current, platform];
 return { ...prev, platforms: next };
 });
 };

 const handleSaveOverview = async () => {
 if (!selected) return;
 try {
 await apiClient.put(`/api/campaigns/${selected.id}`, overviewDraft);
 handleCampaignUpdate({ ...selected, ...overviewDraft });
 setIsEditingOverview(false);
 toast.success('Campaign updated.');
 } catch (e) {
 console.error('Overview save failed:', e);
 toast.error('Failed to save changes.');
 }
 };

 // ---- MAGNET editor modal (create + edit) ----
 const [editorOpen, setEditorOpen] = useState(false);
 const [editorCampaign, setEditorCampaign] = useState(null); // null = creating
 const [form, setForm] = useState(DEFAULT_FORM);
 const [activeMagnetStep, setActiveMagnetStep] = useState('message');
 const [savingCampaign, setSavingCampaign] = useState(false);
 const [zuriBusyStep, setZuriBusyStep] = useState(null);
 const [zuriOutput, setZuriOutput] = useState(null); // { step, text }

 const openEditor = useCallback((campaign) => {
 if (campaign) {
 setEditorCampaign(campaign);
 setForm({ ...DEFAULT_FORM, ...campaign });
 } else {
 setEditorCampaign(null);
 setForm({ ...DEFAULT_FORM });
 }
 setActiveMagnetStep('message');
 setZuriOutput(null);
 setEditorOpen(true);
 }, []);

 const setField = useCallback((key, value) => {
 setForm((prev) => ({ ...prev, [key]: value }));
 }, []);

 const handleSaveCampaign = async () => {
 if (!(form.name || '').trim()) {
 toast.error('Give the campaign a name first.');
 return;
 }
 setSavingCampaign(true);
 try {
 if (editorCampaign?.id) {
 await apiClient.put(`/api/campaigns/${editorCampaign.id}`, form);
 const updated = { ...editorCampaign, ...form };
 handleCampaignUpdate(updated);
 setEditorCampaign(updated);
 toast.success('Campaign saved.');
 } else {
 const res = await apiClient.post('/api/campaigns', { ...form, user_id: userId, workspace_id: workspaceId });
 if (res?.id) {
 setCampaigns((prev) => [res, ...prev.filter((c) => c.id !== res.id)]);
 // Keep the modal open and switch to edit mode: now that the campaign
 // has an id, the next save is a PUT and the founder can keep building
 // MAGNET steps without reopening anything.
 setEditorCampaign(res);
 setForm({ ...DEFAULT_FORM, ...res });
 }
 toast.success('Campaign created.');
 }
 // Modal intentionally stays open after save (create or update) so the
 // founder can continue building MAGNET steps. Use Cancel/Close to dismiss.
 } catch (e) {
 console.error('Save campaign failed:', e);
 toast.error('Could not save the campaign. Please try again.');
 } finally {
 setSavingCampaign(false);
 }
 };

 // Per-step Zuri — scoped to the ACTIVE step only. We send just that step's
 // fields (plus campaign name + goal for context), never the whole campaign
 // document, so the generation stays anchored to the step the founder is on.
 const handleZuriStep = async (step) => {
 if (!editorCampaign?.id) {
 toast.error('Save the campaign first, then Zuri can help.');
 return;
 }
 // Build the scoped payload for exactly this step.
 const payload = { step, name: form.name || '', goal: form.goal || '' };
 if (step === 'message') {
 payload.emotional_hook = form.emotional_hook || '';
 payload.promise = form.promise || '';
 payload.problem_statement = form.problem_statement || '';
 } else if (step === 'narrative') {
 payload.emotional_hook = form.emotional_hook || '';
 payload.narrative_arc = form.narrative_arc || '';
 }
 setZuriBusyStep(step);
 setZuriOutput(null);
 try {
 const res = await apiClient.post(`/api/campaigns/${editorCampaign.id}/zuri-step`, payload);
 setZuriOutput({ step, text: res?.text || '' });
 } catch (e) {
 toast.error('Zuri could not generate that right now.');
 } finally {
 setZuriBusyStep(null);
 }
 };

 if (!workspaceId || loading) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center h-full">
 <Loader2 className="animate-spin cth-text-accent" size={32} />
 </div>
 </DashboardLayout>
 );
 }

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Campaign Builder
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {`${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`} · Build campaigns that move your audience through the five signal levels.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <button
            type="button"
            data-testid="campaigns-new-button"
            onClick={() => openEditor(null)}
            style={{ padding: '9px 18px', background: 'var(--cth-command-crimson)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}
          >
            <Plus size={14} /> New campaign
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-7 md:px-8" style={{ background: 'var(--cth-command-blush)', minHeight: '100vh' }} data-testid="campaign-builder-page">
        <div className="mx-auto w-full max-w-[1100px]" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="flex items-center gap-2" style={{ flex: 1, maxWidth: 360, background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 8, padding: '8px 12px' }}>
              <Search size={14} style={{ color: 'var(--cth-command-muted)', flexShrink: 0 }} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search campaigns..." data-testid="campaigns-search-input" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--cth-command-ink)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }} />
            </div>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} data-testid="campaigns-sort-select" style={{ padding: '8px 12px', border: '1px solid var(--cth-command-border)', borderRadius: 8, background: 'var(--cth-command-panel)', color: 'var(--cth-command-ink)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer' }}>
              <option value="newest">Newest first</option>
              <option value="status">Status</option>
              <option value="magnet">MAGNET progress</option>
            </select>
          </div>

          {campaigns.length === 0 ? (
            <div style={{ background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
              <div className="mx-auto flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--cth-command-panel-soft)', border: '1px solid var(--cth-command-border)' }}>
                <Megaphone size={22} style={{ color: 'var(--cth-command-muted)' }} />
              </div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: 'var(--cth-command-ink)', marginTop: 16 }}>Build your first campaign</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--cth-command-muted)', margin: '8px auto 20px', maxWidth: 440, lineHeight: 1.6 }}>Every piece of content should serve a campaign.</p>
              <button type="button" onClick={() => openEditor(null)} style={{ padding: '10px 18px', background: 'var(--cth-command-purple)', color: 'var(--cth-command-gold)', border: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> New campaign
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {filtered.map((c) => {
                const dispStatus = campaignDisplayStatus(c);
                const stepDone = magnetStepDone(c);
                const firstTodo = MAGNET_ORDER.findIndex((s) => !stepDone[s.key]);
                const audience = c.avatar_snapshot?.name || c.audience_description || '';
                const offer = c.offer_name || '';
                const signals = c.signal_count || 0;
                const accent = dispStatus === 'active'
                  ? 'linear-gradient(90deg, var(--cth-command-crimson), var(--cth-command-cinnabar))'
                  : dispStatus === 'complete'
                  ? 'linear-gradient(90deg, var(--cth-command-success), #4a9e7a)'
                  : 'var(--cth-command-border)';
                const editLabel = dispStatus === 'complete' ? 'View results' : dispStatus === 'draft' ? 'Edit & complete' : 'Edit campaign';
                const onEdit = () => (dispStatus === 'complete' ? navigate('/analytics') : openEditor(c));
                return (
                  <div key={c.id} data-testid={`campaign-card-${c.id}`} style={{ background: 'var(--cth-command-panel)', border: `1px solid ${dispStatus === 'active' ? 'var(--cth-command-crimson)' : 'var(--cth-command-border)'}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 3, background: accent }} />
                    <div style={{ padding: '15px 16px 11px', flex: 1 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: dispStatus === 'draft' ? 'var(--cth-command-panel-soft)' : 'color-mix(in srgb, var(--cth-command-success) 12%, var(--cth-command-panel))', color: dispStatus === 'draft' ? 'var(--cth-command-muted)' : 'var(--cth-command-success)', border: `1px solid ${dispStatus === 'draft' ? 'var(--cth-command-border)' : 'color-mix(in srgb, var(--cth-command-success) 35%, var(--cth-command-border))'}` }}>
                          {dispStatus === 'active' ? 'Active' : dispStatus === 'complete' ? 'Complete' : 'Draft'}
                        </span>
                        <span className="inline-flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, color: 'var(--cth-command-gold)' }}>
                          <Radio size={11} /> {signals} signal{signals === 1 ? '' : 's'}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 500, lineHeight: 1.3, margin: '0 0 5px', color: 'var(--cth-command-ink)' }}>{c.name || 'Untitled campaign'}</h3>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, lineHeight: 1.55, color: 'var(--cth-command-muted)', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{getGoalDescription(c)}</p>
                      <div className="flex flex-wrap" style={{ gap: 6 }}>
                        <span className="inline-flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'var(--cth-command-panel-soft)', border: '1px solid var(--cth-command-border)', color: 'var(--cth-command-muted)', opacity: audience ? 1 : 0.6 }}>
                          <User size={10} /> {audience ? (audience.length > 28 ? `${audience.slice(0, 28)}…` : audience) : 'No audience linked'}
                        </span>
                        <span className="inline-flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'var(--cth-command-panel-soft)', border: '1px solid var(--cth-command-border)', color: 'var(--cth-command-muted)', opacity: offer ? 1 : 0.6 }}>
                          <Package size={10} /> {offer || 'No offer linked'}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '0 16px 12px' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cth-command-muted)', marginBottom: 7, fontWeight: 600 }}>MAGNET progress</div>
                      <div className="flex" style={{ gap: 4 }}>
                        {MAGNET_ORDER.map((step, i) => {
                          const st = stepDone[step.key] ? 'done' : (i === firstTodo ? 'active' : 'todo');
                          const barColor = st === 'done' ? 'var(--cth-command-success)' : st === 'active' ? 'var(--cth-command-gold)' : 'var(--cth-command-panel-soft)';
                          return (
                            <div key={step.key} className="flex flex-col items-center" style={{ flex: 1, gap: 3 }}>
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500, color: 'var(--cth-command-muted)', letterSpacing: '0.06em' }}>{step.letter}</span>
                              <div style={{ width: '100%', height: 3, borderRadius: 2, background: barColor }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: 6, padding: '10px 16px', borderTop: '1px solid var(--cth-command-border)' }}>
                      <button type="button" data-testid={`campaign-edit-${c.id}`} onClick={onEdit} style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--cth-command-ink)', background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 6, padding: '6px', cursor: 'pointer' }}>
                        {editLabel}
                      </button>
                      {dispStatus === 'draft' ? (
                        <button type="button" data-testid={`campaign-launch-${c.id}`} onClick={() => handleStatusChange(c.id, 'active')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: '#fff', background: 'var(--cth-command-crimson)', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                          Launch
                        </button>
                      ) : null}
                      <button type="button" data-testid={`campaign-delete-${c.id}`} onClick={() => handleDelete(c.id)} aria-label={`Delete ${c.name}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--cth-command-crimson)', background: 'transparent', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button type="button" data-testid="add-campaign-card" onClick={() => openEditor(null)} style={{ background: 'transparent', border: '1px dashed var(--cth-command-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 16px', cursor: 'pointer', minHeight: 200, color: 'var(--cth-command-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
                <Megaphone size={20} style={{ color: 'var(--cth-command-border)' }} />
                Add another campaign
              </button>
            </div>
          )}
        </div>
      </div>

      {editorOpen && (() => {
        const stepDoneMap = magnetStepDone(form);
        const doneCount = Object.values(stepDoneMap).filter(Boolean).length;
        const idx = MAGNET_ORDER.findIndex((s) => s.key === activeMagnetStep);
        const active = MAGNET_ORDER[idx] || MAGNET_ORDER[0];
        const prev = idx > 0 ? MAGNET_ORDER[idx - 1] : null;
        const next = idx < MAGNET_ORDER.length - 1 ? MAGNET_ORDER[idx + 1] : null;
        const canZuri = Boolean(editorCampaign?.id);
        const fld = (k, v) => setForm((p) => ({ ...p, [k]: v }));
        const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cth-command-muted)', fontWeight: 500 };
        const inputStyle = { padding: '9px 12px', background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 8, fontSize: 12, color: 'var(--cth-command-ink)', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%' };
        const areaStyle = { ...inputStyle, resize: 'none', lineHeight: 1.6, minHeight: 72 };
        const GUIDE = {
          message: 'Lead with the one true thing your audience already feels but has not heard named. Recognition before revelation.',
          audience: 'Name one person, one problem. The sharper the audience, the sharper everything downstream.',
          goal: 'A campaign goal is a movement between signal levels — pick the shift you want, then the timeline and platforms that serve it.',
          narrative: 'The strongest narrative for a Lv 2→3 campaign leads with recognition, not revelation. Name the problem precisely before they can.',
          execution: 'Content is the vehicle, not the campaign. Map the few pieces that actually carry the narrative each week.',
          tracking: 'If you cannot see the signal, you cannot improve it. Define the one CTA and the path you will measure.',
        };
        return (
          <div role="dialog" aria-modal="true" aria-label={editorCampaign ? 'Edit campaign' : 'New campaign'} onClick={() => setEditorOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(26,8,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div data-testid="campaign-editor-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 14, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div className="flex items-start justify-between" style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--cth-command-border)', background: 'var(--cth-command-panel)', flexShrink: 0, gap: 12 }}>
                <div className="min-w-0">
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, fontWeight: 600, color: 'var(--cth-command-ink)', lineHeight: 1.2 }}>{(form.name || '').trim() || (editorCampaign ? 'Edit campaign' : 'New campaign')}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--cth-command-muted)', marginTop: 2 }}>Build out each MAGNET step to complete this campaign.</div>
                </div>
                <div className="flex items-center" style={{ gap: 10, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--cth-command-muted)', marginBottom: 4 }}>{doneCount} of 6 complete</div>
                    <div style={{ width: 90, height: 2, background: 'var(--cth-command-panel-soft)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((doneCount / 6) * 100)}%`, background: 'var(--cth-command-success)', borderRadius: 2 }} />
                    </div>
                  </div>
                  <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close" style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cth-command-panel-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cth-command-muted)', flexShrink: 0 }}><X size={11} /></button>
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '152px 1fr', overflow: 'hidden', minHeight: 0 }}>
                {/* Step nav */}
                <div style={{ borderRight: '1px solid var(--cth-command-border)', padding: '14px 0', background: 'var(--cth-command-panel-soft)', overflowY: 'auto' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--cth-command-muted)', padding: '0 14px 8px', fontWeight: 600 }}>MAGNET steps</div>
                  {MAGNET_ORDER.map((step) => {
                    const isActive = step.key === activeMagnetStep;
                    const done = stepDoneMap[step.key];
                    const barColor = done ? 'var(--cth-command-success)' : isActive ? 'var(--cth-command-gold)' : 'var(--cth-command-panel-soft)';
                    return (
                      <button key={step.key} type="button" onClick={() => { setActiveMagnetStep(step.key); setZuriOutput(null); }} data-testid={`magnet-step-${step.key}`} className="text-left" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', cursor: 'pointer', border: 'none', borderLeft: `2px solid ${isActive ? 'var(--cth-command-crimson)' : 'transparent'}`, background: isActive ? 'var(--cth-command-panel)' : 'transparent' }}>
                        {done ? <Check size={12} style={{ color: 'var(--cth-command-success)', flexShrink: 0 }} /> : isActive ? <Pencil size={12} style={{ color: 'var(--cth-command-crimson)', flexShrink: 0 }} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--cth-command-border)', flexShrink: 0, display: 'inline-block' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center" style={{ gap: 6 }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: isActive ? 'var(--cth-command-crimson)' : 'var(--cth-command-muted)' }}>{step.letter}</span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--cth-command-crimson)' : 'var(--cth-command-muted)' }}>{step.label}</span>
                          </div>
                          <div style={{ height: 2, borderRadius: 2, marginTop: 4, width: '100%', background: barColor }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Field area */}
                <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 600, color: 'var(--cth-command-ink)', marginBottom: 2 }}>{active.label}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--cth-command-muted)', lineHeight: 1.5 }}>{active.desc}</div>
                  </div>

                  {activeMagnetStep === 'message' && (<>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Campaign name</div><input data-testid="campaign-name-input" style={inputStyle} value={form.name || ''} onChange={(e) => fld('name', e.target.value)} placeholder="Name this campaign" /></div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Campaign hook</div><input style={inputStyle} value={form.emotional_hook || ''} onChange={(e) => fld('emotional_hook', e.target.value)} placeholder="The one true thing they already feel…" /></div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Promise</div><textarea style={areaStyle} value={form.promise || ''} onChange={(e) => fld('promise', e.target.value)} placeholder="What this campaign promises to change." /></div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Problem statement</div><input style={inputStyle} value={form.problem_statement || ''} onChange={(e) => fld('problem_statement', e.target.value)} placeholder="The problem this names." /></div>
                  </>)}

                  {activeMagnetStep === 'audience' && (<>
                    <div className="flex flex-col" style={{ gap: 5 }}>
                      <div style={labelStyle}>Target audience</div>
                      <select
                        data-testid="campaign-audience-select"
                        style={inputStyle}
                        value={form.avatar_id || ''}
                        onChange={(e) => {
                          const a = avatars.find((x) => x.id === e.target.value);
                          setForm((p) => {
                            if (!a) return { ...p, avatar_id: '' };
                            const next = { ...p, avatar_id: a.id };
                            // Auto-fill from the selected avatar, but never clobber custom content the founder already typed.
                            if (!String(p.audience_description || '').trim()) next.audience_description = a.description || a.name || '';
                            if (!String(p.audience_problem || '').trim()) next.audience_problem = a.core_fear || a.primary_problem || '';
                            // awareness_stage has a default ('problem_aware'); treat the untouched default as fillable.
                            if (!p.awareness_stage || p.awareness_stage === 'problem_aware') next.awareness_stage = a.stage || a.awareness_stage || p.awareness_stage || '';
                            return next;
                          });
                        }}
                      >
                        <option value="">{avatars.length ? 'Select an avatar…' : 'No avatars yet'}</option>
                        {avatars.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                      </select>
                      {avatars.length === 0 ? (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10.5, color: 'var(--cth-command-muted)' }}>Create an avatar in the Audience tab, then select it here.</span>
                      ) : null}
                    </div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Audience problem</div><textarea style={areaStyle} value={form.audience_problem || ''} onChange={(e) => fld('audience_problem', e.target.value)} placeholder="The problem in their words." /></div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Awareness stage</div><select style={inputStyle} value={form.awareness_stage || ''} onChange={(e) => fld('awareness_stage', e.target.value)}><option value="">Select stage…</option>{AWARENESS_STAGE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}</select></div>
                  </>)}

                  {activeMagnetStep === 'goal' && (<>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Goal</div><select style={inputStyle} value={form.goal || ''} onChange={(e) => fld('goal', e.target.value)}><option value="">Choose a goal…</option>{GOAL_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}</select></div>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Linked offer</div><input style={inputStyle} value={form.offer_name || ''} onChange={(e) => fld('offer_name', e.target.value)} placeholder="Offer name" /></div>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Start date</div><input type="date" style={inputStyle} value={form.start_date || ''} onChange={(e) => fld('start_date', e.target.value)} /></div>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>End date</div><input type="date" style={inputStyle} value={form.end_date || ''} onChange={(e) => fld('end_date', e.target.value)} /></div>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Target metric</div><input style={inputStyle} value={form.target_metric || ''} onChange={(e) => fld('target_metric', e.target.value)} placeholder="e.g. Leads" /></div>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Target value</div><input style={inputStyle} value={form.target_value || ''} onChange={(e) => fld('target_value', e.target.value)} placeholder="e.g. 50" /></div>
                    </div>
                    <div className="flex flex-col" style={{ gap: 5 }}>
                      <div style={labelStyle}>Platforms</div>
                      <div className="flex flex-wrap" style={{ gap: 6 }}>
                        {PLATFORM_OPTIONS.map((o) => {
                          const on = (form.platforms || []).includes(o.value);
                          return (<button key={o.value} type="button" onClick={() => fld('platforms', on ? (form.platforms || []).filter((p) => p !== o.value) : [...(form.platforms || []), o.value])} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: '5px 11px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${on ? 'var(--cth-command-crimson)' : 'var(--cth-command-border)'}`, background: on ? 'color-mix(in srgb, var(--cth-command-crimson) 10%, var(--cth-command-panel))' : 'var(--cth-command-panel)', color: on ? 'var(--cth-command-crimson)' : 'var(--cth-command-muted)' }}>{o.label}</button>);
                        })}
                      </div>
                    </div>
                  </>)}

                  {activeMagnetStep === 'narrative' && (<>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Campaign hook</div><input style={inputStyle} value={form.emotional_hook || ''} onChange={(e) => fld('emotional_hook', e.target.value)} placeholder="The hook the story leads with." /></div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Core narrative arc</div><textarea style={{ ...areaStyle, minHeight: 96 }} value={form.narrative_arc || ''} onChange={(e) => fld('narrative_arc', e.target.value)} placeholder="How this campaign takes your audience from where they are to where they want to be." /></div>
                  </>)}

                  {activeMagnetStep === 'execution' && (<>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <div className="flex items-center justify-between"><div style={labelStyle}>Content plan</div><button type="button" onClick={() => fld('content_plan', [...(form.content_plan || []), { id: `cp-${Date.now()}`, week: 1, format: '', platform: 'instagram', topic: '', status: 'pending' }])} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10.5, color: 'var(--cth-command-crimson)', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ Add item</button></div>
                      {(form.content_plan || []).length === 0 ? (<p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--cth-command-muted)' }}>No content items yet.</p>) : (form.content_plan || []).map((it, i) => (
                        <div key={it.id || i} className="grid items-center" style={{ gridTemplateColumns: '1fr 110px 70px 24px', gap: 6 }}>
                          <input style={{ ...inputStyle, padding: '7px 10px' }} value={it.format || ''} placeholder="Format / topic" onChange={(e) => { const n = [...(form.content_plan || [])]; n[i] = { ...n[i], format: e.target.value }; fld('content_plan', n); }} />
                          <select style={{ ...inputStyle, padding: '7px 10px' }} value={it.platform || 'instagram'} onChange={(e) => { const n = [...(form.content_plan || [])]; n[i] = { ...n[i], platform: e.target.value }; fld('content_plan', n); }}>{PLATFORM_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}</select>
                          <select style={{ ...inputStyle, padding: '7px 10px' }} value={it.week || 1} onChange={(e) => { const n = [...(form.content_plan || [])]; n[i] = { ...n[i], week: Number(e.target.value) }; fld('content_plan', n); }}>{[1, 2, 3, 4].map((w) => (<option key={w} value={w}>W{w}</option>))}</select>
                          <button type="button" onClick={() => fld('content_plan', (form.content_plan || []).filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: 'var(--cth-command-muted)', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <div className="flex items-center justify-between"><div style={labelStyle}>Engagement tactics</div><button type="button" onClick={() => fld('engagement_tactics', [...(form.engagement_tactics || []), ''])} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10.5, color: 'var(--cth-command-crimson)', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ Add tactic</button></div>
                      {(form.engagement_tactics || []).length === 0 ? (<p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--cth-command-muted)' }}>No tactics yet.</p>) : (form.engagement_tactics || []).map((t, i) => (
                        <div key={i} className="grid items-center" style={{ gridTemplateColumns: '1fr 24px', gap: 6 }}>
                          <input style={{ ...inputStyle, padding: '7px 10px' }} value={t} placeholder="e.g. Reply to every comment in 1h" onChange={(e) => { const n = [...(form.engagement_tactics || [])]; n[i] = e.target.value; fld('engagement_tactics', n); }} />
                          <button type="button" onClick={() => fld('engagement_tactics', (form.engagement_tactics || []).filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: 'var(--cth-command-muted)', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Lead magnet idea</div><input style={inputStyle} value={form.lead_magnet_idea || ''} onChange={(e) => fld('lead_magnet_idea', e.target.value)} placeholder="Optional" /></div>
                  </>)}

                  {activeMagnetStep === 'tracking' && (<>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Primary CTA</div><input style={inputStyle} value={form.cta_primary || ''} onChange={(e) => fld('cta_primary', e.target.value)} placeholder="The one action you want." /></div>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Landing page URL</div><input style={inputStyle} value={form.landing_page_url || ''} onChange={(e) => fld('landing_page_url', e.target.value)} placeholder="https://" /></div>
                      <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>CTA URL</div><input style={inputStyle} value={form.cta_url || ''} onChange={(e) => fld('cta_url', e.target.value)} placeholder="https://" /></div>
                    </div>
                    <div className="flex flex-col" style={{ gap: 5 }}><div style={labelStyle}>Urgency trigger</div><input style={inputStyle} value={form.urgency_trigger || ''} onChange={(e) => fld('urgency_trigger', e.target.value)} placeholder="Deadline, scarcity, bonus…" /></div>
                  </>)}

                  {/* Zuri card */}
                  <div style={{ background: '#1a0828', borderRadius: 10, padding: '13px 15px' }} data-testid="zuri-campaign-step">
                    <div className="flex items-center gap-2" style={{ marginBottom: 9 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--cth-command-crimson)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 8, fontWeight: 600, color: '#fff' }}>Z</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a6090' }}>Zuri · {active.label.toLowerCase()} guidance</span>
                    </div>
                    {zuriBusyStep === activeMagnetStep ? (
                      <div className="flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}><Loader2 size={13} className="animate-spin" /> Zuri is drafting…</div>
                    ) : (zuriOutput && zuriOutput.step === activeMagnetStep && zuriOutput.text) ? (
                      <>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#e8dff0', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto', marginBottom: 8 }} data-testid="zuri-campaign-output">{zuriOutput.text}</div>
                        <div className="flex items-center gap-2">
                          {activeMagnetStep === 'narrative' ? (<button type="button" onClick={() => { fld('narrative_arc', zuriOutput.text); setZuriOutput(null); }} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, color: 'var(--cth-command-crimson)', background: 'transparent', border: '0.5px solid rgba(224,78,53,0.4)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Use as narrative arc</button>) : null}
                          <button type="button" onClick={() => setZuriOutput(null)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#7a6090', background: 'transparent', border: 'none', padding: '4px 6px', cursor: 'pointer' }}>Dismiss</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, fontWeight: 500, color: '#e8dff0', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 8 }}>&ldquo;{GUIDE[activeMagnetStep]}&rdquo;</div>
                        {(activeMagnetStep === 'message' || activeMagnetStep === 'narrative') ? (
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleZuriStep(activeMagnetStep)} disabled={!canZuri} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, color: 'var(--cth-command-crimson)', background: 'transparent', border: '0.5px solid rgba(224,78,53,0.4)', borderRadius: 5, padding: '4px 10px', cursor: canZuri ? 'pointer' : 'not-allowed', opacity: canZuri ? 1 : 0.5 }}>{activeMagnetStep === 'message' ? 'Draft hooks' : 'Draft narrative arc'}</button>
                            {!canZuri ? (<span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#5a4868' }}>Save the campaign first · uses AI credits</span>) : (<span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#5a4868' }}>Uses AI credits</span>)}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between" style={{ padding: '11px 20px', borderTop: '1px solid var(--cth-command-border)', background: 'var(--cth-command-panel-soft)', flexShrink: 0, gap: 10 }}>
                <button type="button" onClick={() => prev && setActiveMagnetStep(prev.key)} disabled={!prev} data-testid="magnet-prev" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--cth-command-muted)', background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 7, padding: '7px 14px', cursor: prev ? 'pointer' : 'default', opacity: prev ? 1 : 0.4 }}>{prev ? `← ${prev.label}` : '← Previous'}</button>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <button type="button" onClick={() => setEditorOpen(false)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--cth-command-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button type="button" data-testid="save-campaign-btn" onClick={handleSaveCampaign} disabled={savingCampaign || !(form.name || '').trim()} className="inline-flex items-center gap-1.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#fff', background: 'var(--cth-command-success)', border: 'none', borderRadius: 7, padding: '7px 16px', cursor: (savingCampaign || !(form.name || '').trim()) ? 'not-allowed' : 'pointer', opacity: (savingCampaign || !(form.name || '').trim()) ? 0.6 : 1 }}>{savingCampaign ? (<><Loader2 size={12} className="animate-spin" /> Saving…</>) : 'Save campaign'}</button>
                </div>
                <button type="button" onClick={() => next && setActiveMagnetStep(next.key)} disabled={!next} data-testid="magnet-next" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#fff', background: 'var(--cth-command-crimson)', border: 'none', borderRadius: 7, padding: '7px 16px', cursor: next ? 'pointer' : 'default', opacity: next ? 1 : 0.4 }}>{next ? `${next.label} →` : 'Last'}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,0,16,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => !deleting && setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', padding: 28, maxWidth: 440, width: '100%', borderRadius: 12 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: 'var(--cth-command-ink)' }}>Delete Campaign</h3>
            <p style={{ margin: '0 0 24px', color: 'var(--cth-command-muted)', fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ padding: '9px 16px', border: '1px solid var(--cth-command-border)', background: 'transparent', color: 'var(--cth-command-ink)', cursor: 'pointer', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Cancel</button>
              <button onClick={handleConfirmDelete} disabled={deleting} data-testid="confirm-delete-campaign-btn" style={{ padding: '9px 16px', border: 'none', background: 'var(--cth-command-crimson)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function CampaignBuilderPage() {
 return <CampaignBuilderPageContent />;
}
