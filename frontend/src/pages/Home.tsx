import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const PIPELINE_STAGES = ['Transcribe', 'Intent', 'Fetch', 'Summarize'];

const STAGE_RESULTS = [
    {
        title: 'Transcribing your voice input...',
        excerpt: 'Converting speech to text using Groq Whisper. Your spoken question is being processed into a searchable query.',
        source: 'System',
        readTime: '',
        category: 'Processing',
    },
    {
        title: 'Understanding what you meant',
        excerpt: 'Parsing your intent to determine the right topic, action, and scope. This ensures results match what you actually asked for.',
        source: 'System',
        readTime: '',
        category: 'Analysis',
    },
    {
        title: 'Solar capacity surpasses coal for the first time globally',
        excerpt: 'The International Energy Agency reports that solar photovoltaic installations have reached a new milestone, overtaking coal-fired power in total installed capacity across 40 nations.',
        source: 'Reuters',
        readTime: '3 min read',
        category: 'Energy',
    },
    {
        title: 'Solar capacity surpasses coal for the first time globally',
        excerpt: 'Global solar installations now exceed coal-fired capacity across 40 countries, marking a historic shift in the energy landscape according to the IEA.',
        source: 'Reuters',
        readTime: '3 min read',
        category: 'Energy',
    },
];

function useScrollFadeIn() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

function FadeIn({ className = '', delay = 0, children }: { className?: string; delay?: number; children: React.ReactNode }) {
    const ref = useScrollFadeIn();
    const delayClass = delay > 0 ? ` delay-${delay}` : '';
    return (
        <div ref={ref} className={`landing-fade-in${delayClass} ${className}`}>
            {children}
        </div>
    );
}

/* ─── Product Preview ─── */
function ProductPreview() {
    const [activeStage, setActiveStage] = useState(0);

    const advance = useCallback(() => {
        setActiveStage(prev => (prev + 1) % PIPELINE_STAGES.length);
    }, []);

    const result = STAGE_RESULTS[activeStage];
    const isProcessing = activeStage < 2;

    return (
        <div className="landing-preview" onClick={advance} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && advance()} aria-label="Click to advance pipeline stage">
            <div className="landing-preview-header">
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
                <span className="landing-preview-header-hint">Click to advance</span>
            </div>

            <div className="landing-preview-query">
                <svg className="landing-preview-query-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span className="landing-preview-query-text">"What's happening with renewable energy this week?"</span>
            </div>

            <div className="landing-preview-pipeline">
                {PIPELINE_STAGES.map((stage, i) => (
                    <div key={stage} style={{ display: 'contents' }}>
                        {i > 0 && <div className={`landing-preview-connector${i <= activeStage ? ' done' : ''}`} />}
                        <div className={`landing-preview-stage${activeStage === i ? ' active' : ''}${i < activeStage ? ' done' : ''}`}>
                            <span className="landing-preview-stage-label">{stage}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`landing-preview-result${isProcessing ? ' processing' : ''}`} key={activeStage}>
                <p className="landing-preview-result-title">
                    {result.title}
                </p>
                <p className="landing-preview-result-excerpt">
                    {result.excerpt}
                </p>
                {!isProcessing && (
                    <div className="landing-preview-result-meta">
                        <span>{result.source}</span>
                        <span className="landing-preview-result-dot" />
                        <span>{result.readTime}</span>
                        <span className="landing-preview-result-dot" />
                        <span>{result.category}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Icons ─── */
function ArrowDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </svg>
    );
}

/* ─── Main Page ─── */
export default function Home() {
    return (
        <main className="min-h-screen text-text">
            {/* ─── Hero ─── */}
            <section className="landing-hero">
                <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
                    <div className="landing-hero-grid">
                        <FadeIn>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <h1 className="landing-hero-headline font-display text-text">
                                    Search the news<br />by speaking.
                                </h1>
                                <p className="landing-hero-sub text-muted">
                                    VoxNews turns your spoken questions into curated briefings from trusted sources. No tabs, no feeds, no noise — just the stories that matter to you, read aloud or delivered as clean text.
                                </p>
                                <div className="landing-cta-group">
                                    <Link to="/register" className="landing-cta-primary">
                                        Get Started
                                    </Link>
                                    <a href="#how-it-works" className="landing-cta-secondary">
                                        See How It Works
                                        <ArrowDownIcon />
                                    </a>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={2}>
                            <ProductPreview />
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section className="landing-section" id="how-it-works">
                <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
                    <FadeIn>
                        <p className="landing-section-label">How it works</p>
                        <h2 className="landing-section-heading font-display text-text">Three steps, no learning curve</h2>
                        <p className="landing-section-sub">
                            Speak naturally, and VoxNews handles the rest. No commands to memorize, no menus to navigate.
                        </p>
                    </FadeIn>

                    <div className="landing-how-grid">
                        <FadeIn delay={1}>
                            <div className="landing-how-item">
                                <div className="landing-how-number">01</div>
                                <div className="landing-how-content">
                                    <h3 className="landing-how-title">Speak your question</h3>
                                    <p className="landing-how-desc">
                                        Ask anything naturally. The microphone captures your voice and transcribes it in real time.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                        <FadeIn delay={2}>
                            <div className="landing-how-item">
                                <div className="landing-how-number">02</div>
                                <div className="landing-how-content">
                                    <h3 className="landing-how-title">AI understands your intent</h3>
                                    <p className="landing-how-desc">
                                        A language model parses what you meant — not just the words — and routes you to the right results.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                        <FadeIn delay={3}>
                            <div className="landing-how-item">
                                <div className="landing-how-number">03</div>
                                <div className="landing-how-content">
                                    <h3 className="landing-how-title">Read or listen</h3>
                                    <p className="landing-how-desc">
                                        Articles are fetched, summarized, and presented in a clean reader. Play them aloud or read at your own pace.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ─── Features — alternating rows ─── */}
            <section className="landing-section">
                <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
                    <FadeIn>
                        <div className="landing-feature-row">
                            <div className="landing-feature-text">
                                <p className="landing-section-label">Voice-first search</p>
                                <h3 className="landing-feature-row-title font-display text-text">
                                    Search for any topic by speaking naturally
                                </h3>
                                <p className="landing-feature-row-desc">
                                    The AI pipeline transcribes your voice, interprets your intent, fetches relevant articles from live sources, and summarizes them — all from a single spoken sentence. No typing, no filters, no menus.
                                </p>
                            </div>
                            <div className="landing-feature-visual">
                                <div className="landing-feature-visual-inner">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                                        <rect x="9" y="2" width="6" height="12" rx="3" />
                                        <path d="M5 10a7 7 0 0 0 14 0" />
                                        <line x1="12" y1="19" x2="12" y2="22" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn>
                        <div className="landing-feature-row reverse">
                            <div className="landing-feature-text">
                                <p className="landing-section-label">Daily briefings</p>
                                <h3 className="landing-feature-row-title font-display text-text">
                                    A personalized morning briefing, built for you
                                </h3>
                                <p className="landing-feature-row-desc">
                                    Choose your topics and receive a curated news briefing each morning. Listen to it as audio during your commute, or read the summary over coffee. Every source is linked and verifiable.
                                </p>
                            </div>
                            <div className="landing-feature-visual">
                                <div className="landing-feature-visual-inner">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                                        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                                        <path d="M18 14h-8" />
                                        <path d="M15 18h-5" />
                                        <path d="M10 6h8v4h-8V6Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn>
                        <div className="landing-feature-row">
                            <div className="landing-feature-text">
                                <p className="landing-section-label">Distraction-free reader</p>
                                <h3 className="landing-feature-row-title font-display text-text">
                                    Read articles without the noise
                                </h3>
                                <p className="landing-feature-row-desc">
                                    Open any article in a clean reader view stripped of ads, popups, and clutter. Play it back as audio with one tap. Save articles into organized collections for later reference.
                                </p>
                            </div>
                            <div className="landing-feature-visual">
                                <div className="landing-feature-visual-inner">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ─── CTA Block ─── */}
            <section className="landing-cta-section">
                <div className="landing-cta-gradient" />
                <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 relative z-10">
                    <FadeIn>
                        <div className="landing-cta-inner">
                            <h2 className="landing-cta-block-heading font-display">
                                Stop scrolling. Start asking.
                            </h2>
                            <p className="landing-cta-block-sub">
                                Create a free account and start using your voice to search the news in under a minute.
                            </p>
                            <Link to="/register" className="landing-cta-primary">
                                Create Free Account
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
                <footer className="landing-footer">
                    <span className="landing-footer-copy">VoxNews</span>
                    <div className="landing-footer-links">
                        <Link to="/login" className="landing-footer-link">Login</Link>
                        <Link to="/register" className="landing-footer-link">Register</Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}