import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import './Home.css';
import { ArrowRight, Play, Mail, Bookmark, ArrowDown, Activity, Filter, Clock } from 'lucide-react';
import VoxLogo from '../components/ui/VoxLogo';

/* ─── Animated Pipeline Icons ─── */

function AnimatedMicIcon() {
    return (
        <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
            <motion.path d="M8 22h8" />
            <motion.circle cx="12" cy="8" r="8" fill="currentColor" fillOpacity="0" variants={{
                rest: { scale: 1, opacity: 0 },
                hover: { scale: [1, 1.5], opacity: [0.2, 0], transition: { repeat: Infinity, duration: 1.5 } }
            }} />
        </motion.svg>
    );
}

function AnimatedSparklesIcon() {
    return (
        <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-400 relative">
            <motion.path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
                variants={{
                    rest: { rotate: 0 },
                    hover: { rotate: 180, scale: [1, 1.2, 1], transition: { duration: 2, repeat: Infinity, ease: "linear" } }
                }}
            />
            <motion.path d="M5 3v4M3 5h4" variants={{ hover: { opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], transition: { repeat: Infinity, duration: 1.2, delay: 0.2 } } }} />
            <motion.path d="M19 17v4M17 19h4" variants={{ hover: { opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], transition: { repeat: Infinity, duration: 1.5, delay: 0.5 } } }} />
        </motion.svg>
    );
}

function AnimatedSearchIcon() {
    return (
        <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-success">
            <motion.circle cx="11" cy="11" r="8" variants={{
                hover: { cx: [11, 14, 8, 11], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
            }} />
            <motion.path d="m21 21-4.3-4.3" variants={{
                hover: { x: [0, 3, -3, 0], y: [0, 3, -3, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
            }} />
        </motion.svg>
    );
}

function AnimatedVolumeIcon() {
    return (
        <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-500">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <motion.path d="M15.54 8.46a5 5 0 0 1 0 7.07" variants={{
                rest: { opacity: 0.5 },
                hover: { opacity: [0.3, 1, 0.3], transition: { repeat: Infinity, duration: 1 } }
            }} />
            <motion.path d="M19.07 4.93a10 10 0 0 1 0 14.14" variants={{
                rest: { opacity: 0.3 },
                hover: { opacity: [0.1, 1, 0.1], transition: { repeat: Infinity, duration: 1.5, delay: 0.2 } }
            }} />
        </motion.svg>
    );
}


/* ─── Hero Section Components ─── */
function HeroVisual() {
    return (
        <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center select-none">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-indigo-500/30 blur-3xl opacity-50 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />

            {/* Central glass orb */}
            <div className="relative w-48 h-48 rounded-full bg-base/40 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((i, index) => (
                        <motion.div
                            key={index}
                            animate={{ height: ['16px', `${Math.max(24, i * 14)}px`, '16px'] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: index * 0.1 }}
                            className="w-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                        />
                    ))}
                </div>
            </div>

            {/* Floating News Cards */}
            <motion.div
                animate={{ y: [-10, 10, -10], rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute top-0 right-0 md:top-1/4 md:-right-8 bg-surface/80 backdrop-blur-md border border-border p-3 md:p-4 rounded-xl shadow-xl w-40 md:w-48 scale-75 md:scale-100 origin-top-right"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Technology</span>
                </div>
                <div className="text-sm font-medium text-text leading-tight">
                    Tech Giants Unveil On-Device AI
                </div>
                <div className="text-[10px] text-muted mt-2">Just now</div>
            </motion.div>

            <motion.div
                animate={{ y: [10, -10, 10], rotate: [2, -2, 2] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 left-0 md:bottom-1/4 md:-left-8 bg-surface/80 backdrop-blur-md border border-border p-3 md:p-4 rounded-xl shadow-xl w-44 md:w-56 scale-75 md:scale-100 origin-bottom-left"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Environment</span>
                </div>
                <div className="text-sm font-medium text-text leading-tight">
                    Global solar capacity hits historic milestone
                </div>
                <div className="text-[10px] text-muted mt-2">2h ago</div>
            </motion.div>
        </div>
    );
}

/* ─── Pipeline Diagram Components ─── */
function PipelineDiagram() {
    const nodes = [
        { label: 'Voice Input', icon: AnimatedMicIcon, desc: 'You speak naturally', color: 'from-blue-500/20' },
        { label: 'AI Process', icon: AnimatedSparklesIcon, desc: 'Intent is understood', color: 'from-indigo-500/20' },
        { label: 'Live Search', icon: AnimatedSearchIcon, desc: 'Fresh articles fetched', color: 'from-emerald-500/20' },
        { label: 'Audio Playback', icon: AnimatedVolumeIcon, desc: 'Streamed to you', color: 'from-amber-500/20' }
    ];

    return (
        <div className="w-full max-w-5xl mx-auto py-20 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative">
                {/* Animated Connection Track for Desktop */}
                <div className="hidden md:block absolute top-1/2 left-8 right-8 h-[2px] bg-border/40 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
                        animate={{ x: ['-100%', '400%'] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    />
                </div>

                {/* Animated Connection Track for Mobile (Vertical) */}
                <div className="md:hidden absolute left-1/2 top-8 bottom-8 w-[2px] bg-border/40 -translate-x-1/2 z-0 rounded-full overflow-hidden">
                    <motion.div
                        className="w-full h-1/3 bg-gradient-to-b from-transparent via-primary to-transparent opacity-80"
                        animate={{ y: ['-100%', '400%'] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    />
                </div>

                {nodes.map((node, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: i * 0.15 }}
                        whileHover="hover"
                        animate="rest"
                        key={node.label}
                        className={`flex flex-col items-center gap-5 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 w-full md:w-56 text-center shadow-2xl relative z-10 transition-all duration-500 cursor-default group overflow-hidden select-none
                            ${i % 2 !== 0 ? 'md:translate-y-8' : 'md:-translate-y-8'}
                            hover:-translate-y-2 hover:border-white/10 hover:bg-card/60
                        `}
                    >
                        {/* Step Number */}
                        <div className="absolute top-4 left-5 text-[11px] font-mono font-bold tracking-wider text-muted/30 group-hover:text-primary/60 transition-colors duration-300">
                            STEP 0{i + 1}
                        </div>

                        {/* Ambient Glow on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${node.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none`} />

                        {/* Icon Container */}
                        <div className="w-16 h-16 rounded-2xl bg-surface/50 border border-white/5 flex items-center justify-center mt-4 mb-2 relative z-10 shadow-inner group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:border-primary/30 transition-all duration-300 transform group-hover:scale-110">
                            <node.icon />
                        </div>
                        
                        {/* Text Content */}
                        <div className="relative z-10">
                            <div className="font-display font-semibold text-lg text-text mb-1.5 tracking-tight group-hover:text-primary transition-colors">{node.label}</div>
                            <div className="text-sm text-muted leading-relaxed">{node.desc}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}


/* ─── Product Mockups (Realistic CSS components) ─── */
function MockupDashboard() {
    return (
        <div className="w-full h-full bg-base/90 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans relative select-none">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="h-14 border-b border-border bg-surface/50 flex items-center px-6 gap-4 relative z-10">
                <VoxLogo className="w-5 h-5 text-text" />
                <div className="font-display font-bold text-sm">VoxNews</div>
                <div className="ml-auto w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">JD</div>
            </div>
            <div className="flex-1 flex relative z-10">
                <div className="w-48 hidden sm:flex flex-col gap-3 border-r border-border p-4 bg-surface/20">
                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1 ml-2">Feeds</div>
                    <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg font-medium"><Activity size={14} /> Top Stories</div>
                    <div className="flex items-center gap-2 text-sm text-muted px-3 py-2 hover:bg-surface rounded-lg transition-colors"><Bookmark size={14} /> Saved</div>
                    <div className="flex items-center gap-2 text-sm text-muted px-3 py-2 hover:bg-surface rounded-lg transition-colors"><Clock size={14} /> History</div>
                </div>
                <div className="flex-1 p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold mb-1 tracking-tight">Your Briefing</h2>
                            <p className="text-muted text-sm">Curated for John based on preferences.</p>
                        </div>
                        <div className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted"><Filter size={14} /></div>
                    </div>
                    <div className="grid gap-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                            <div className="flex items-center gap-2 text-[11px] text-primary font-medium tracking-wide uppercase">
                                <span>Technology</span> • <span>3 min listen</span>
                            </div>
                            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">AI advancements in 2026 reach new milestones</h3>
                            <p className="text-muted text-sm line-clamp-2">Major tech companies announce breakthroughs in neural processing efficiency, promising faster on-device inference.</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-success scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                            <div className="flex items-center gap-2 text-[11px] text-success font-medium tracking-wide uppercase">
                                <span>Energy</span> • <span>5 min listen</span>
                            </div>
                            <h3 className="font-semibold text-lg leading-tight group-hover:text-success transition-colors">Global solar capacity surpasses coal</h3>
                            <p className="text-muted text-sm line-clamp-2">For the first time in history, global installed solar capacity has exceeded that of coal-fired power plants.</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MockupReader() {
    return (
        <div className="w-full h-full bg-base border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans relative select-none">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="h-14 border-b border-border bg-surface/50 flex items-center px-4 relative justify-between z-10 backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-muted">
                    <ArrowRight size={14} className="rotate-180" />
                </div>
                <div className="flex gap-1.5 items-center bg-card border border-border px-3 py-1 rounded-full shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-medium text-text uppercase tracking-wider">Live Readback</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-muted">
                    <Bookmark size={14} />
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative z-10">
                <div className="p-8 md:p-12 max-w-2xl mx-auto w-full flex flex-col gap-6">
                    <h1 className="text-3xl font-display font-bold leading-tight">AI advancements in 2026 reach new milestones</h1>

                    <div className="flex items-center gap-4 bg-gradient-to-r from-card to-surface p-4 rounded-xl border border-border/80 my-2 shadow-sm">
                        <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 shrink-0 hover:scale-105 transition-transform relative">
                            <Play size={18} className="ml-1 relative z-10" />
                            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
                        </button>
                        <div className="flex flex-col flex-1">
                            <span className="font-semibold text-sm">Listening to article...</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 bg-border rounded-full flex-1 overflow-hidden">
                                    <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 10, ease: "linear" }} />
                                </div>
                                <span className="text-[10px] font-mono text-muted">1:12 / 3:00</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 text-text/85 text-sm md:text-base leading-relaxed font-serif">
                        <p><span className="text-primary font-medium">Major tech companies have announced</span> significant breakthroughs in neural processing efficiency this week, promising a new era of faster, more secure on-device inference for consumers.</p>
                        <p className="opacity-70">The developments, unveiled at the annual Developer Summit, showcase a 40% reduction in power consumption for large language models running directly on smartphones and laptops. This shift away from cloud dependency addresses long-standing privacy concerns.</p>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-base via-base/80 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}

function MockupEmail() {
    return (
        <div className="w-full h-full bg-surface/50 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col p-4 sm:p-8 relative select-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-[60px]" />
            <div className="bg-card rounded-xl flex-1 border border-border shadow-lg flex flex-col max-w-md mx-auto w-full overflow-hidden relative z-10 transform -rotate-1 hover:rotate-0 transition-transform duration-500 ease-out mt-4 mb-4">
                <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-center text-white relative overflow-hidden shrink-0">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                    <Mail size={24} className="mx-auto mb-3 opacity-90" />
                    <h2 className="text-xl font-bold tracking-tight">Your Daily Briefing</h2>
                    <p className="text-white/70 text-xs mt-1.5 uppercase tracking-wider font-medium">Tuesday, July 27</p>
                </div>
                <div className="p-6 flex flex-col gap-6 overflow-y-auto bg-card">
                    <p className="text-sm text-text/90">Good morning! Here are the top stories tailored to your interests.</p>

                    <div className="flex flex-col gap-5">
                        <div className="flex gap-3 items-start group">
                            <div className="w-1 h-full min-h-[40px] bg-primary rounded-full mt-1 group-hover:scale-y-110 transition-transform" />
                            <div>
                                <h3 className="font-semibold text-text mb-1 text-sm leading-tight">Tech Giants Unveil On-Device AI</h3>
                                <p className="text-xs text-muted leading-relaxed">New neural processors reduce power consumption by 40%, enabling powerful local AI assistants.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start group">
                            <div className="w-1 h-full min-h-[40px] bg-success rounded-full mt-1 group-hover:scale-y-110 transition-transform" />
                            <div>
                                <h3 className="font-semibold text-text mb-1 text-sm leading-tight">Solar Eclipses Coal</h3>
                                <p className="text-xs text-muted leading-relaxed">Global solar capacity hits historic milestone, driven by massive installations in emerging markets.</p>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-elevated hover:border-primary/50 transition-all mt-4 text-primary shadow-sm">
                        Listen on VoxNews
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function Home() {

    return (
        <main className="min-h-screen text-text relative bg-base overflow-clip">
            <div className="landing-ambient-bg" />

            {/* 1. Hero */}
            <section className="relative z-10 min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-10 -mt-16">
                <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-16">
                    <div className="flex flex-col gap-6 max-w-xl mx-auto text-center lg:text-left lg:mx-0">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.15]">
                            Listen to the news<br />
                            <span className="text-primary">you care about.</span>
                        </h1>
                        <p className="text-base md:text-lg text-muted leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Speak what you want to know. We instantly fetch, summarize, and read back your personalized daily briefing. No scrolling required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-6">
                            <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-white font-medium hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all shadow-lg">
                                Start Listening for Free
                            </Link>
                            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border bg-surface/50 backdrop-blur hover:bg-surface text-text font-medium transition-colors flex items-center justify-center gap-2">
                                See how it works <ArrowDown size={16} />
                            </a>
                        </div>
                    </div>
                    <div className="w-full max-w-md mx-auto lg:max-w-none perspective-[1000px]">
                        <motion.div initial={{ rotateY: -5, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }}>
                            <HeroVisual />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. How it works (Pipeline) */}
            <section id="how-it-works" className="relative z-10 py-24 px-4 sm:px-6 lg:px-10 border-t border-border/50 bg-surface/30">
                <div className="w-full max-w-[1400px] mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 text-primary font-semibold mb-6 bg-primary/10 px-4 py-1.5 rounded-full w-max text-sm border border-primary/20">
                            How it works
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">From voice to ears in seconds.</h2>
                        <p className="text-muted text-lg max-w-2xl mx-auto">A seamless pipeline designed to give you exactly what you asked for, completely automated behind the scenes.</p>
                    </div>
                    <PipelineDiagram />
                </div>
            </section>

            {/* 4. Inside the product (Alternating Layout) */}
            <section className="relative z-10 px-4 sm:px-6 lg:px-10 py-24 bg-base border-t border-border/50 overflow-hidden">
                <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-20">

                    {/* Feature 1: Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col">
                            <div className="inline-flex items-center gap-2 text-primary font-semibold mb-6 bg-primary/10 px-4 py-1.5 rounded-full w-max text-sm border border-primary/20">
                                Dashboard
                            </div>
                            <h3 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">Your personalized hub</h3>
                            <p className="text-lg text-muted leading-relaxed mb-8">
                                A clean, distraction-free environment that curates articles based on your historical intent and explicit preferences.
                            </p>
                            <ul className="flex flex-col gap-4 text-text/80">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span><strong>Dynamic routing:</strong> Simply ask for a topic, and your feed instantly updates.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span><strong>Saved collections:</strong> Bookmark articles to read or listen to later.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span><strong>Complete history:</strong> Never lose track of what you've heard.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="w-full aspect-square max-w-[500px] mx-auto lg:ml-auto">
                            <MockupDashboard />
                        </div>
                    </div>

                    {/* Feature 2: Reader Mode (Image Left, Text Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 w-full aspect-square max-w-[500px] mx-auto lg:mr-auto">
                            <MockupReader />
                        </div>
                        <div className="flex flex-col order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 text-success font-semibold mb-6 bg-success/10 px-4 py-1.5 rounded-full w-max text-sm border border-success/20">
                                Reader Mode
                            </div>
                            <h3 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">Listen or read</h3>
                            <p className="text-lg text-muted leading-relaxed mb-8">
                                Content is stripped of ads and popups. A persistent audio controller lets you stream the article summary instantly while you multitask.
                            </p>
                            <ul className="flex flex-col gap-4 text-text/80">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-success" />
                                    <span><strong>Distraction-free:</strong> Beautiful typography tailored for reading.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-success" />
                                    <span><strong>AI Readback:</strong> Natural-sounding voices narrate the summary.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-success" />
                                    <span><strong>Audio tracking:</strong> Follow along with synchronized text highlighting.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Feature 3: Briefings */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col">
                            <div className="inline-flex items-center gap-2 text-indigo-400 font-semibold mb-6 bg-indigo-500/10 px-4 py-1.5 rounded-full w-max text-sm border border-indigo-500/20">
                                Briefings
                            </div>
                            <h3 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">Daily morning digests</h3>
                            <p className="text-lg text-muted leading-relaxed mb-8">
                                Wake up to a customized morning digest delivered straight to your inbox. Perfect for catching up on your commute before you even open the app.
                            </p>
                            <ul className="flex flex-col gap-4 text-text/80">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span><strong>Automated delivery:</strong> Runs reliably on schedule every day.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span><strong>Personalized summaries:</strong> LLM-curated based on your interests.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span><strong>One-click play:</strong> Jump straight from email to audio player.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="w-full aspect-square max-w-[500px] mx-auto lg:ml-auto">
                            <MockupEmail />
                        </div>
                    </div>

                </div>
            </section>

            {/* 5. Footer */}
            <footer className="relative z-10 pt-16 pb-8 px-4 sm:px-6 lg:px-10 border-t border-border bg-card">
                <div className="w-full max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2 flex flex-col gap-4">
                            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-text">
                                <VoxLogo className="w-8 h-8 text-primary" />
                                VoxNews
                            </Link>
                            <p className="text-muted text-sm max-w-sm">
                                Your personal audio news assistant. Search the web with your voice and get instant, ad-free summaries read back to you.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="font-semibold text-text mb-2">Product</h4>
                            <Link to="/register" className="text-sm text-muted hover:text-primary transition-colors">Sign Up</Link>
                            <Link to="/login" className="text-sm text-muted hover:text-primary transition-colors">Log In</Link>
                            <a href="#how-it-works" className="text-sm text-muted hover:text-primary transition-colors">How it Works</a>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="font-semibold text-text mb-2">Platform</h4>
                            <Link to="/dashboard" className="text-sm text-muted hover:text-primary transition-colors">Your Dashboard</Link>
                            <Link to="/settings" className="text-sm text-muted hover:text-primary transition-colors">Settings</Link>
                            <a href="https://github.com/rishabh794/voice-news-reader" target="_blank" rel="noreferrer" className="text-sm text-muted hover:text-primary transition-colors">Source Code</a>
                        </div>
                    </div>
                    <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
                        <p>© {new Date().getFullYear()} VoxNews. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}