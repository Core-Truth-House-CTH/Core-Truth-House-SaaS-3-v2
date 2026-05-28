import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import apiClient from '../lib/apiClient';
import { usePlan } from '../context/PlanContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { PLAN_ORDER } from '../config/routeConfig';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, TopBar } from '../components/Layout';
import { Search, Star, Copy, ShoppingBag, Wand2, ChevronRight, Check, Loader2, Sparkles } from 'lucide-react';
import { PromptCard } from '../components/prompts/PromptCard';
import { toast } from 'sonner';

// Tabs configuration
const TABS = [
 { id: 'library', label: 'My Prompts', icon: Sparkles },
 { id: 'store', label: 'Store', icon: ShoppingBag },
 { id: 'generators', label: 'Generators', icon: Wand2 },
];

// Per-generator one-time access pricing, keyed by the lowercase plan tier
// that normally unlocks the generator.
const GENERATOR_PRICES = { structure: 27, house: 47, estate: 67 };
const PLAN_TIER_LABELS = { structure: 'The Structure', house: 'The House', estate: 'The Estate' };

const GENERATORS = [
 {
 id: 'scene',
 title: 'Infinite Scene Generator',
 description: 'Create unlimited cinematic brand scenes with consistent visual DNA',
 icon: '◎',
 color: 'var(--cth-command-cinnabar)',
 requiredPlan: 'STRUCTURE',
 fields: [
 { key: 'archetype', label: 'Brand Archetype', placeholder: 'e.g., Luxury Coach, Bold Creator' },
 { key: 'model_description', label: 'Model Description', placeholder: 'e.g., Professional woman, 30s, confident' },
 { key: 'location', label: 'Location', placeholder: 'e.g., Modern minimalist studio' },
 { key: 'mood', label: 'Mood', placeholder: 'e.g., Empowering and sophisticated' },
 { key: 'platform', label: 'Platform', placeholder: 'Instagram, LinkedIn, Website' },
 { key: 'colors', label: 'Color Palette', placeholder: 'var(--cth-brand-primary), var(--cth-command-cinnabar), var(--cth-surface-deep)' },
 ]
 },
 {
 id: 'dna',
 title: 'Brand DNA Scene Builder',
 description: 'Build a consistent visual DNA system for all your brand imagery',
 icon: '⬡',
 color: 'var(--cth-command-purple)',
 requiredPlan: 'STRUCTURE',
 fields: [
 { key: 'character', label: 'Character', placeholder: 'Brand founder/representative description' },
 { key: 'lighting', label: 'Lighting Style', placeholder: 'e.g., Soft, directional, golden hour' },
 { key: 'colors', label: 'Color Palette', placeholder: 'var(--cth-brand-primary), var(--cth-command-cinnabar)' },
 { key: 'mood', label: 'Mood/Emotion', placeholder: 'e.g., Confident, warm, approachable' },
 { key: 'style', label: 'Visual Style', placeholder: 'e.g., Editorial luxury, minimalist modern' },
 ]
 },
 {
 id: 'content-pillars',
 title: 'Content Pillar Architect',
 description: 'Define 4–6 brand content pillars with messaging frameworks for each',
 icon: '◱',
 color: 'var(--cth-command-muted)',
 requiredPlan: 'STRUCTURE',
 fields: [
 { key: 'brand_name', label: 'Brand Name', placeholder: 'e.g., Core Truth House' },
 { key: 'audience', label: 'Target Audience', placeholder: 'e.g., Female entrepreneurs, 30–50' },
 { key: 'transformation', label: 'Transformation You Deliver', placeholder: 'e.g., From scattered to systematic brand' },
 { key: 'platforms', label: 'Content Platforms', placeholder: 'Instagram, LinkedIn, Podcast' },
 { key: 'brand_voice', label: 'Brand Voice', placeholder: 'e.g., Authoritative, warm, direct' },
 ]
 },
 {
 id: 'god-prompt',
 title: 'God Prompt Builder',
 description: 'Create a comprehensive 10-component brand prompt architecture',
 icon: '◈',
 color: 'var(--cth-brand-primary)',
 requiredPlan: 'HOUSE',
 fields: [
 { key: 'industry', label: 'Industry', placeholder: 'e.g., Coaching, Consulting, Wellness' },
 { key: 'product', label: 'Product/Service', placeholder: 'e.g., Premium coaching program' },
 { key: 'audience', label: 'Target Audience', placeholder: 'e.g., Ambitious professionals' },
 { key: 'visual_style', label: 'Visual Style', placeholder: 'e.g., Luxury editorial' },
 { key: 'emotional_tone', label: 'Emotional Tone', placeholder: 'e.g., Empowering, sophisticated' },
 ]
 },
 {
 id: 'launch',
 title: 'Launch Content Machine',
 description: 'Generate a complete 7-day launch content calendar with copy, hooks, and CTAs',
 icon: '◆',
 color: 'var(--cth-brand-primary-soft)',
 requiredPlan: 'HOUSE',
 fields: [
 { key: 'offer_name', label: 'Offer Name', placeholder: 'e.g., Brand Builder Accelerator' },
 { key: 'launch_date', label: 'Launch Date', placeholder: 'e.g., January 15, 2025' },
 { key: 'pain_point', label: 'Audience Pain Point', placeholder: 'e.g., Struggling with inconsistent branding' },
 { key: 'transformation', label: 'Transformation Promise', placeholder: 'e.g., Build a brand that attracts premium clients' },
 { key: 'brand_voice', label: 'Brand Voice', placeholder: 'e.g., Confident, warm, expert' },
 ]
 },
 {
 id: 'ica-builder',
 title: 'ICA Deep-Dive Builder',
 description: 'Map your Ideal Client Avatar in psychological depth , fears, desires, objections, language patterns',
 icon: '◎',
 color: 'var(--cth-brand-primary-soft)',
 requiredPlan: 'HOUSE',
 fields: [
 { key: 'industry', label: 'Your Industry', placeholder: 'e.g., Brand Consulting' },
 { key: 'offer_type', label: 'Offer Type', placeholder: 'e.g., 1:1 coaching, group program, done-for-you' },
 { key: 'client_stage', label: 'Client Stage', placeholder: 'e.g., 6-figure entrepreneur ready to scale' },
 { key: 'transformation', label: 'Core Transformation', placeholder: 'e.g., From invisible to recognized authority' },
 { key: 'price_point', label: 'Price Point', placeholder: 'e.g., $5,000–$15,000' },
 ]
 },
 {
 id: 'email-sequence',
 title: 'Email Nurture Sequence',
 description: 'Generate a 5-part email sequence that converts subscribers into buyers using your brand voice',
 icon: '◻',
 color: 'color-mix(in srgb, var(--cth-brand-primary-soft) 85%, var(--cth-brand-primary))',
 requiredPlan: 'HOUSE',
 fields: [
 { key: 'offer_name', label: 'Offer Name', placeholder: 'e.g., Brand Mastery Program' },
 { key: 'audience_pain', label: 'Audience Pain', placeholder: 'e.g., Inconsistent revenue, unclear messaging' },
 { key: 'brand_voice', label: 'Brand Voice', placeholder: 'e.g., Bold, direct, no-fluff' },
 { key: 'sequence_goal', label: 'Sequence Goal', placeholder: 'e.g., Book a discovery call, enroll in course' },
 ]
 },
 {
 id: 'brand-story',
 title: 'Brand Story Arc Generator',
 description: "Craft your brand's hero journey narrative , origin, turning point, mission, and transformation arc",
 icon: '◬',
 color: 'color-mix(in srgb, var(--cth-brand-primary) 88%, black)',
 requiredPlan: 'ESTATE',
 fields: [
 { key: 'founders_journey', label: "Founder's Journey", placeholder: 'e.g., Left corporate after burnout to build this' },
 { key: 'turning_point', label: 'Turning Point Moment', placeholder: 'e.g., The moment you realized the old way was broken' },
 { key: 'mission', label: 'Brand Mission', placeholder: 'e.g., Help women monetize their expertise unapologetically' },
 { key: 'audience_mirror', label: 'How Client Mirrors You', placeholder: 'e.g., They were exactly where I was 3 years ago' },
 ]
 },
];

export default function PromptHub() {
 const { user } = useUser();
 const { plan } = usePlan();
 const { activeWorkspaceId } = useWorkspace();
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState('library');
 const [prompts, setPrompts] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedGenerator, setSelectedGenerator] = useState(null);
 const [generatorInputs, setGeneratorInputs] = useState({});
 const [generating, setGenerating] = useState(false);
 const [generatedResult, setGeneratedResult] = useState(null);
 const [copiedId, setCopiedId] = useState(null);
 const [showUpgradeModal, setShowUpgradeModal] = useState(null);
 const [deleteTarget, setDeleteTarget] = useState(null);
 const [deleting, setDeleting] = useState(false);

 const userId = user?.id || 'default';
 const isEstate = plan === 'estate';

 useEffect(() => {
 fetchPrompts();
 }, [userId]);

 const fetchPrompts = async () => {
 try {
 const res = await apiClient.get(`/api/prompts?user_id=${userId}`);
 setPrompts(res.prompts || []);
 } catch (err) {
 console.error('Error fetching prompts:', err);
 } finally {
 setLoading(false);
 }
 };

 const handleCopyPrompt = async (content, id) => {
 await navigator.clipboard.writeText(content);
 setCopiedId(id);
 setTimeout(() => setCopiedId(null), 2000);
 };

 const handleToggleFavorite = async (promptId) => {
 try {
 await apiClient.put(`/api/prompts/${promptId}/favorite?user_id=${userId}`);
 setPrompts(prompts.map(p =>
 p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p
 ));
 } catch (err) {
 console.error('Error toggling favorite:', err);
 toast.error("Could not update favorite. Please try again.");
 }
 };

 const handleDeletePrompt = (promptOrId) => {
 const target = typeof promptOrId === 'object'
 ? promptOrId
 : prompts.find((p) => p.id === promptOrId) || { id: promptOrId };
 setDeleteTarget(target);
 };

 const handleConfirmDeletePrompt = async () => {
 if (!deleteTarget) return;
 setDeleting(true);
 try {
 await apiClient.delete(`/api/prompts/${deleteTarget.id}?user_id=${userId}`);
 setPrompts(prompts.filter(p => p.id !== deleteTarget.id));
 setDeleteTarget(null);
 } catch (err) {
 console.error('Error deleting prompt:', err);
 toast.error("Could not delete prompt. Please try again.");
 } finally {
 setDeleting(false);
 }
 };

 const handleGeneratorSubmit = async () => {
 if (!selectedGenerator) return;
 setGenerating(true);
 setGeneratedResult(null);

 try {
 const res = await apiClient.post(`/api/generators/${selectedGenerator.id}?user_id=${userId}`, {
 generator_type: selectedGenerator.id,
 inputs: generatorInputs,
 workspace_id: activeWorkspaceId || 'default',
 user_id: userId,
 });
 setGeneratedResult(res.result);
 fetchPrompts(); // Refresh prompts to show the saved one
 } catch (err) {
 console.error('Generator error:', err);
 toast.error(err.message || "Generator failed. Please try again.");
 } finally {
 setGenerating(false);
 }
 };

 const handleStorePurchase = () => {
 toast.info('Redirecting to billing...');
 navigate('/billing');
 };

 // Filter prompts by search
 const filteredPrompts = prompts.filter(p =>
 p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.category?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 // Separate favorites
 const favoritePrompts = filteredPrompts.filter(p => p.is_favorite);
 const otherPrompts = filteredPrompts.filter(p => !p.is_favorite);

 return (
 <DashboardLayout>
 <TopBar
 title="Prompt Hub"
 subtitle="Your AI prompt library, premium packs, and generators"
 />
 <div
 className="max-w-[1200px] mx-auto w-full px-4 py-6 md:px-7 md:py-8 space-y-8"
 data-testid="prompt-hub-page"
 >
 {/* Tabs */}
 <div className="flex gap-2 border-b pb-1" style={{ borderColor: "var(--cth-command-border)" }}>
 {TABS.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2.5 transition-all text-sm font-medium ${
 activeTab === tab.id
 ? 'cth-card-muted cth-text-accent border-b-2 border-[var(--cth-command-cinnabar)]'
 : 'cth-muted hover:opacity-80 hover:bg-[var(--cth-command-panel-soft)]'
 }`}
 data-testid={`tab-${tab.id}`}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </div>

 {/* TAB: My Prompts Library */}
 {activeTab === 'library' && (
 <div className="space-y-6">
 {/* Search */}
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 cth-muted" />
 <input
 type="text"
 placeholder="Search prompts..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="cth-input w-full pl-10 pr-4 py-2.5 text-sm"
 />
 </div>

 {loading ? (
 <div className="flex items-center justify-center py-20">
 <Loader2 className="w-8 h-8 animate-spin cth-text-accent" />
 </div>
 ) : filteredPrompts.length === 0 ? (
 <div className="text-center py-20">
 <Sparkles className="w-12 h-12 mx-auto cth-muted mb-4" />
 <h3 className="text-lg font-semibold cth-heading mb-2">No prompts yet</h3>
 <p className="text-sm cth-muted mb-6">Use the generators to create your first prompts</p>
 <button
 onClick={() => setActiveTab('generators')}
 className="cth-button-primary px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
 >
 Go to Generators
 </button>
 </div>
 ) : (
 <>
 {/* Favorites */}
 {favoritePrompts.length > 0 && (
 <div>
 <h3 className="text-sm font-medium cth-text-accent mb-3 flex items-center gap-2">
 <Star className="w-4 h-4 fill-current" /> Favorites
 </h3>
 <div className="grid gap-3">
 {favoritePrompts.map(prompt => (
 <PromptCard
 key={prompt.id}
 prompt={prompt}
 onCopy={handleCopyPrompt}
 onFavorite={handleToggleFavorite}
 onDelete={handleDeletePrompt}
 copied={copiedId === prompt.id}
 />
 ))}
 </div>
 </div>
 )}

 {/* All Prompts */}
 <div>
 <h3 className="text-sm font-medium cth-muted mb-3">All Prompts ({otherPrompts.length})</h3>
 <div className="grid gap-3">
 {otherPrompts.map(prompt => (
 <PromptCard
 key={prompt.id}
 prompt={prompt}
 onCopy={handleCopyPrompt}
 onFavorite={handleToggleFavorite}
 onDelete={handleDeletePrompt}
 copied={copiedId === prompt.id}
 />
 ))}
 </div>
 </div>
 </>
 )}
 </div>
 )}

 {/* TAB: Store (Generator Access) */}
 {activeTab === 'store' && (
 <div className="space-y-6">
 <div className="p-4 border" style={{ background: "rgba(224,78,53,0.06)", borderColor: "rgba(224,78,53,0.18)" }}>
 <h3 className="cth-heading font-semibold mb-1">Generator Access</h3>
 <p className="text-sm cth-muted">Unlock individual generators with one-time purchases, or upgrade your plan for instant access to all.</p>
 </div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
 {GENERATORS.map(gen => {
 const requiredPlan = (gen.requiredPlan || 'foundation').toLowerCase();
 const isIncluded = isEstate || PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(requiredPlan);
 const price = GENERATOR_PRICES[requiredPlan] || 27;
 const tierLabel = PLAN_TIER_LABELS[requiredPlan] || 'Foundation';
 return (
 <div
 key={gen.id}
 className="p-5 border cth-card border-[var(--cth-command-border)] transition-all"
 data-testid={`store-generator-${gen.id}`}
 >
 <div className="flex items-start justify-between mb-3">
 <div
 className="w-12 h-12 flex items-center justify-center text-2xl"
 style={{ background: `linear-gradient(135deg, ${gen.color}, ${gen.color}88)` }}
 >
 {gen.icon}
 </div>
 {isIncluded && (
 <span className="px-2 py-1 text-xs rounded-full flex items-center gap-1" style={{ background: "rgba(63,122,95,0.14)", color: "var(--cth-success)" }}>
 <Check className="w-3 h-3" /> Included in your plan
 </span>
 )}
 </div>
 <h3 className="cth-heading font-semibold mb-1">{gen.title}</h3>
 <p className="text-xs cth-muted mb-3 line-clamp-2">{gen.description}</p>
 <p className="text-xs cth-muted mb-4">Normally unlocked with <strong style={{ color: 'var(--cth-command-ink)' }}>{tierLabel}</strong></p>
 <div className="flex items-center justify-between">
 <div className="text-lg font-bold cth-text-accent">${price}</div>
 {isIncluded ? (
 <button
 onClick={() => setActiveTab('generators')}
 className="cth-button-secondary px-4 py-2 text-sm"
 >
 Use Generator
 </button>
 ) : (
 <button
 data-testid={`store-buy-${gen.id}`}
 onClick={handleStorePurchase}
 className="cth-button-primary px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
 >
 Get Access
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* TAB: Generators */}
 {activeTab === 'generators' && (
 <div className="space-y-6">
 {!selectedGenerator ? (
 <>
 <div className="p-4 border" style={{ background: "rgba(224,78,53,0.06)", borderColor: "rgba(224,78,53,0.18)" }}>
 <h3 className="cth-heading font-semibold mb-1">AI Prompt Generators</h3>
 <p className="text-sm cth-muted">Create professional prompts powered by your Brand Memory</p>
 </div>

 <div className="grid md:grid-cols-2 gap-4">
 {GENERATORS.map(gen => {
 const planRequired = (gen.requiredPlan || 'foundation').toLowerCase();
 const isLocked = PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(planRequired);
 const effectiveLocked = isEstate ? false : isLocked;
 const planLabels = { structure: 'The Structure', house: 'The House', estate: 'The Estate' };
 return (
 <button
 key={gen.id}
 onClick={() => {
 if (effectiveLocked) { setShowUpgradeModal(gen); return; }
 setSelectedGenerator(gen);
 setGeneratorInputs({});
 setGeneratedResult(null);
 }}
 className="p-5 border text-left group relative overflow-hidden transition-all cth-card"
 style={{
 background: effectiveLocked ? 'var(--cth-command-panel-soft)' : 'var(--cth-command-ivory)',
 borderColor: 'var(--cth-command-border)',
 opacity: effectiveLocked ? 0.75 : 1,
 }}
 data-testid={`generator-${gen.id}`}
 >
 {effectiveLocked && (
 <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(224,78,53,0.12)', color: 'var(--cth-command-cinnabar)' }}>
 🔒 {planLabels[planRequired] || planRequired}
 </div>
 )}
 <div className="flex items-start justify-between mb-3">
 <div
 className="w-12 h-12 flex items-center justify-center text-2xl"
 style={{ background: effectiveLocked ? 'var(--cth-command-panel-soft)' : `linear-gradient(135deg, ${gen.color}, ${gen.color}88)` }}
 >
 {gen.icon}
 </div>
 {!effectiveLocked && <ChevronRight className="w-5 h-5 cth-muted group-hover:cth-text-accent transition-colors" />}
 </div>
 <h3 className="cth-heading font-semibold mb-1">{gen.title}</h3>
 <p className="text-sm cth-muted">{gen.description}</p>
 {effectiveLocked && (
 <div className="mt-3 text-xs font-semibold" style={{ color: 'var(--cth-command-cinnabar)' }}>
 Upgrade to {planLabels[planRequired]} to unlock →
 </div>
 )}
 </button>
 );
 })}
 </div>
 </>
 ) : (
 <div className="space-y-6">
 {/* Back button */}
 <button
 onClick={() => {
 setSelectedGenerator(null);
 setGeneratedResult(null);
 }}
 className="flex items-center gap-2 text-sm cth-muted hover:opacity-80 transition-colors"
 >
 <ChevronRight className="w-4 h-4 rotate-180" />
 Back to generators
 </button>

 {/* Generator header */}
 <div className="flex items-center gap-4">
 <div
 className="w-14 h-14 flex items-center justify-center text-2xl"
 style={{ background: `linear-gradient(135deg, ${selectedGenerator.color}, ${selectedGenerator.color}88)` }}
 >
 {selectedGenerator.icon}
 </div>
 <div>
 <h2 className="text-xl font-bold cth-heading">{selectedGenerator.title}</h2>
 <p className="text-sm cth-muted">{selectedGenerator.description}</p>
 </div>
 </div>

 {/* Generator form */}
 <div className="grid lg:grid-cols-2 gap-6">
 <div className="space-y-4">
 <h3 className="text-sm font-medium cth-muted uppercase tracking-wider">Inputs</h3>
 {selectedGenerator.fields.map(field => (
 <div key={field.key}>
 <label className="block text-sm font-medium cth-heading mb-1.5">{field.label}</label>
 <input
 type="text"
 placeholder={field.placeholder}
 value={generatorInputs[field.key] || ''}
 onChange={(e) => setGeneratorInputs({ ...generatorInputs, [field.key]: e.target.value })}
 className="cth-input w-full px-4 py-2.5 text-sm"
 />
 </div>
 ))}

 <button
 onClick={handleGeneratorSubmit}
 disabled={generating}
 className="cth-button-primary w-full mt-4 py-3 font-semibold transition-all flex items-center justify-center gap-2"
 style={{
 background: generating ? 'rgba(168,143,159,0.18)' : 'linear-gradient(135deg, var(--cth-command-cinnabar), var(--cth-command-purple))',
 cursor: generating ? 'not-allowed' : 'pointer'
 }}
 >
 {generating ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Generating...
 </>
 ) : (
 <>
 <Wand2 className="w-4 h-4" />
 Generate Prompts
 </>
 )}
 </button>
 </div>

 {/* Output */}
 <div className="space-y-4">
 <h3 className="text-sm font-medium cth-muted uppercase tracking-wider">Output</h3>
 <div className="p-4 border min-h-[400px] cth-card-muted" style={{ borderColor: "var(--cth-command-border)" }}>
 {generatedResult ? (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs flex items-center gap-1" style={{ color: "var(--cth-success)" }}>
 <Check className="w-3 h-3" /> Generated & Saved
 </span>
 <button
 onClick={() => handleCopyPrompt(generatedResult, 'result')}
 className="flex items-center gap-1 text-xs cth-muted hover:opacity-80 transition-colors"
 >
 {copiedId === 'result' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
 {copiedId === 'result' ? 'Copied!' : 'Copy'}
 </button>
 </div>
 <pre className="text-sm cth-body whitespace-pre-wrap font-mono leading-relaxed">
 {generatedResult}
 </pre>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-center py-16">
 <Wand2 className="w-10 h-10 cth-muted mb-3" />
 <p className="cth-muted text-sm">Fill in the inputs and click Generate</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 <style>{`
 .line-clamp-2 {
 display: -webkit-box;
 -webkit-line-clamp: 2;
 -webkit-box-orient: vertical;
 overflow: hidden;
 }
 `}</style>

 {/* Upgrade Modal */}
 {showUpgradeModal && (
 <div data-testid="upgrade-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
 onClick={() => setShowUpgradeModal(null)}>
 <div style={{ background: 'var(--cth-command-ivory)', border: '1px solid rgba(224,78,53,0.24)', borderRadius: 0, padding: 32, maxWidth: 400, width: '100%' }}
 onClick={e => e.stopPropagation()}>
 <div style={{ fontSize: 36, marginBottom: 12 }}>{showUpgradeModal.icon}</div>
 <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--cth-command-ink)', marginBottom: 8 }}>Upgrade to unlock</h2>
 <p style={{ fontSize: 14, color: 'var(--cth-command-muted)', marginBottom: 6 }}>
 <strong style={{ color: 'var(--cth-command-ink)' }}>{showUpgradeModal.title}</strong> is available on {' '}
 <strong style={{ color: 'var(--cth-command-cinnabar)' }}>
 {{ STRUCTURE: 'The Structure ($97/mo)', HOUSE: 'The House ($197/mo)', ESTATE: 'The Estate ($397/mo)' }[showUpgradeModal.requiredPlan]}
 </strong> and above.
 </p>
 <p style={{ fontSize: 13, color: 'var(--cth-command-muted)', marginBottom: 24 }}>{showUpgradeModal.description}</p>
 <div style={{ display: 'flex', gap: 10 }}>
 <a href="/billing" data-testid="upgrade-modal-billing-link" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: 0, background: 'linear-gradient(135deg,var(--cth-command-purple),var(--cth-command-cinnabar))', color: 'white', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
 View Plans & Upgrade
 </a>
 <button data-testid="upgrade-modal-close" onClick={() => setShowUpgradeModal(null)} style={{ padding: '12px 16px', borderRadius: 0, border: '1px solid var(--cth-command-border)', background: 'transparent', color: 'var(--cth-command-muted)', fontSize: 13, cursor: 'pointer' }}>
 Close
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Delete Prompt Modal */}
 {deleteTarget && (
 <div
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(0,0,0,0.5)',
 zIndex: 9100,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 }}
 onClick={() => !deleting && setDeleteTarget(null)}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 style={{
 background: 'var(--cth-command-panel)',
 border: '1px solid var(--cth-command-border)',
 padding: '32px',
 maxWidth: '400px',
 width: '90%',
 borderRadius: 0,
 }}
 >
 <h3 style={{ margin: '0 0 8px', color: 'var(--cth-command-ink)' }}>Delete Prompt</h3>
 <p style={{ margin: '0 0 24px', color: 'var(--cth-command-muted)', fontSize: '14px' }}>
 Are you sure you want to delete <strong>{deleteTarget.title || 'this prompt'}</strong>? This cannot be undone.
 </p>
 <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
 <button
 onClick={() => setDeleteTarget(null)}
 disabled={deleting}
 style={{
 padding: '8px 16px',
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 cursor: 'pointer',
 borderRadius: 0,
 }}
 >
 Cancel
 </button>
 <button
 onClick={handleConfirmDeletePrompt}
 disabled={deleting}
 style={{
 padding: '8px 16px',
 border: 'none',
 background: 'var(--cth-command-crimson)',
 color: '#fff',
 cursor: deleting ? 'not-allowed' : 'pointer',
 borderRadius: 0,
 }}
 >
 {deleting ? 'Deleting...' : 'Delete'}
 </button>
 </div>
 </div>
 </div>
 )}
 </DashboardLayout>
 );
}
