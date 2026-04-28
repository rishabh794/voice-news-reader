import { useState, useEffect, useRef } from "react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import SectionContainer from "../components/ui/SectionContainer";

type VoiceState = "idle" | "listening" | "processing" | "result";

const EXAMPLE_COMMANDS = [
  { command: "Take me to the dashboard", tag: "Navigation" },
  { command: "Find news about space exploration", tag: "Search" },
  { command: "What's happening in tech today?", tag: "Discovery" },
  { command: "Read me the top headline", tag: "Playback" },
  { command: "Show me breaking news from India", tag: "Regional" },
  { command: "Go to sports and read the latest", tag: "Category" },
];

const PIPELINE_STEPS = [
  { label: "Voice Input", sub: "MediaRecorder API", icon: "MIC" },
  { label: "Transcription", sub: "Groq Whisper-v3", icon: "STT" },
  { label: "Intent Parse", sub: "Groq Llama 3", icon: "LLM" },
  { label: "News Fetch", sub: "GNews API", icon: "API" },
  { label: "Read Aloud", sub: "Web Speech API", icon: "TTS" },
];

const INTENT_STEPS = [
  {
    step: "01",
    label: "You speak naturally",
    description:
      "Say anything - no rigid phrasing needed. The system captures your full spoken sentence via the microphone.",
  },
  {
    step: "02",
    label: "Llama 3 parses intent",
    description:
      "Groq Llama 3 reads your transcribed sentence and extracts three structured fields: action, destination page, and search topic.",
  },
  {
    step: "03",
    label: "Router navigates",
    description:
      "React Router receives the resolved route and navigates instantly - no clicks, no menus, no friction.",
  },
  {
    step: "04",
    label: "News fetched and read aloud",
    description:
      "GNews API pulls live headlines matching your topic. Web Speech API reads the top result back to you automatically.",
  },
];


const STATE_LABELS: Record<VoiceState, string> = {
  idle: "Press to speak",
  listening: "Listening...",
  processing: "Processing intent",
  result: "Navigating",
};

const STATE_CYCLE: VoiceState[] = [
  "idle",
  "listening",
  "processing",
  "result",
  "idle",
];

export default function Home() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [ticker, setTicker] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTicker((n) => n + 1), 3200);
    return () => clearInterval(t);
  }, []);

  const handleMicClick = () => {
    if (intervalRef.current) return;
    let idx = 1;
    setVoiceState("listening");
    intervalRef.current = setInterval(() => {
      const next = STATE_CYCLE[idx];
      setVoiceState(next);
      idx++;
      if (idx >= STATE_CYCLE.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setVoiceState("idle");
      }
    }, 1200);
  };

  useEffect(() => {
    const steps = [0, 1, 2, 3, 4];
    let i = 0;
    const t = setInterval(() => {
      setActiveStep(steps[i % steps.length]);
      i++;
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const isListening = voiceState === "listening";
  const isProcessing = voiceState === "processing";
  const isResult = voiceState === "result";

  return (
    <main className="min-h-screen text-text">
      <section className="py-16 lg:py-24">
        <SectionContainer>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-6">
              <Badge variant="primary">AI-powered voice news</Badge>
              <h1 className="text-4xl lg:text-5xl font-display tracking-tight">
                Track the news that moves your industry.
              </h1>
              <p className="text-[15px] text-muted max-w-prose">
                VoiceNews delivers fast summaries and trusted source links for professionals who track high-value, niche topics.
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-mono uppercase tracking-wider text-subtle">
                <span>Clear summaries</span>
                <span>Low eye strain</span>
                <span>Voice playback</span>
              </div>
            </div>

            <Card className="p-6 space-y-6" variant="elevated">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono uppercase tracking-wider text-subtle">
                  Voice console
                </p>
                <Badge variant={isListening ? 'primary' : isProcessing ? 'warning' : isResult ? 'success' : 'neutral'}>
                  {STATE_LABELS[voiceState]}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleMicClick}
                  className={[
                    'flex h-14 w-14 items-center justify-center rounded-full border transition-colors duration-150',
                    isListening
                      ? 'border-primary text-primary bg-primary/10'
                      : isProcessing
                      ? 'border-warning text-warning bg-warning/10'
                      : isResult
                      ? 'border-success text-success bg-success/10'
                      : 'border-border/70 text-muted bg-surface'
                  ].join(' ')}
                >
                  {isProcessing ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-80" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                      <line x1="9" y1="22" x2="15" y2="22" />
                    </svg>
                  )}
                </button>
                <div>
                  <p className="text-sm text-text">{STATE_LABELS[voiceState]}</p>
                  <p className="text-xs text-subtle">Tap to preview the voice flow.</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-subtle">Example command</p>
                <div className="rounded-lg border border-border/70 bg-surface px-3 py-2 text-sm font-mono text-text">
                  {EXAMPLE_COMMANDS[ticker % EXAMPLE_COMMANDS.length].command}
                </div>
              </div>
            </Card>
          </div>
        </SectionContainer>
      </section>

      <section className="py-16">
        <SectionContainer className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-subtle">System architecture</p>
            <h2 className="text-[20px] font-display">How it works</h2>
            <p className="text-[15px] text-muted">
              A five-stage pipeline converts spoken requests into clean, readable briefings in under two seconds.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {PIPELINE_STEPS.map((step, i) => (
              <Card
                key={i}
                className={[
                  'p-4 space-y-3 transition-colors duration-150',
                  activeStep === i ? 'border-primary/40 bg-elevated' : 'border-border/70 bg-surface'
                ].join(' ')}
              >
                <p className="text-xs font-mono uppercase tracking-wider text-subtle">{step.icon}</p>
                <p className="text-sm font-medium text-text">{step.label}</p>
                <p className="text-xs text-muted">{step.sub}</p>
              </Card>
            ))}
          </div>
        </SectionContainer>
      </section>

      <section className="py-16">
        <SectionContainer className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-subtle">Natural language intelligence</p>
            <h2 className="text-[20px] font-display">Understands intent, not just words</h2>
            <p className="text-[15px] text-muted">
              Groq Llama 3 interprets your sentence into a structured action, destination, and topic for fast navigation.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {INTENT_STEPS.map((item) => (
              <Card key={item.step} className="p-6 space-y-3" variant="surface">
                <p className="text-xs font-mono uppercase tracking-wider text-subtle">Step {item.step}</p>
                <h3 className="text-lg font-display text-text">{item.label}</h3>
                <p className="text-[15px] text-muted">{item.description}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6" variant="elevated">
            <p className="text-xs font-mono uppercase tracking-wider text-subtle mb-4">
              Example extraction
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Action', value: 'navigate' },
                { label: 'Destination', value: 'dashboard' },
                { label: 'Topic', value: 'space exploration' }
              ].map((field) => (
                <div key={field.label} className="rounded-lg border border-border/70 bg-surface p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-subtle">{field.label}</p>
                  <p className="text-sm text-text mt-2">{field.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </SectionContainer>
      </section>

      <section className="py-16">
        <SectionContainer className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-subtle">Voice commands</p>
            <h2 className="text-[20px] font-display">Speak naturally</h2>
            <p className="text-[15px] text-muted">
              No rigid phrasing needed. VoiceNews reads intent and responds with the right briefing.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLE_COMMANDS.map((cmd, i) => (
              <Card key={i} className="p-5 space-y-3" variant="surface">
                <Badge variant="neutral">{cmd.tag}</Badge>
                <p className="text-[15px] text-text">{cmd.command}</p>
              </Card>
            ))}
          </div>
        </SectionContainer>
      </section>
    </main>
  );
}