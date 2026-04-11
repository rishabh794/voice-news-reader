import { useState, useEffect, useRef } from "react";

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
      "Say anything — no rigid phrasing needed. The system captures your full spoken sentence via the microphone.",
    accent: "text-cyan-400",
    border: "border-cyan-400/20",
    bg: "bg-cyan-400/5",
  },
  {
    step: "02",
    label: "Llama 3 parses intent",
    description:
      "Groq Llama 3 reads your transcribed sentence and extracts three structured fields: action, destination page, and search topic.",
    accent: "text-indigo-400",
    border: "border-indigo-400/20",
    bg: "bg-indigo-400/5",
  },
  {
    step: "03",
    label: "Router navigates",
    description:
      "React Router receives the resolved route and navigates instantly — no clicks, no menus, no friction.",
    accent: "text-violet-400",
    border: "border-violet-400/20",
    bg: "bg-violet-400/5",
  },
  {
    step: "04",
    label: "News fetched and read aloud",
    description:
      "GNews API pulls live headlines matching your topic. Web Speech API reads the top result back to you automatically.",
    accent: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
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

  const micBorderColor = isListening
    ? "border-cyan-400"
    : isProcessing
    ? "border-indigo-500"
    : isResult
    ? "border-emerald-400"
    : "border-cyan-400/25";

  const micBg = isListening
    ? "bg-cyan-400/10"
    : isProcessing
    ? "bg-indigo-500/10"
    : isResult
    ? "bg-emerald-400/10"
    : "bg-slate-900";

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden">

      {/* ── SECTION 1: Hero ──────────────────────────────────────── */}
      <section className="relative min-h-screen grid grid-cols-2 overflow-hidden" style={{ background: '#020617' }}>

  {/* LEFT — Hero Text */}
  <div className="flex flex-col justify-center px-14 py-14">
    <p className="text-[11px] tracking-[0.3em] uppercase text-cyan-400/55 mb-6">
      AI-Powered News Interface
    </p>
    <div className="flex flex-col gap-0">
      <h1 className="text-[7rem] xl:text-[8rem] font-black leading-[0.93] tracking-[-0.03em] text-slate-100">
        Speak.
      </h1>
      <h1 className="text-[7rem] xl:text-[8rem] font-black leading-[0.93] tracking-[-0.03em] bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500 bg-clip-text text-transparent">
        Explore.
      </h1>
      <h1 className="text-[7rem] xl:text-[8rem] font-black leading-[0.93] tracking-[-0.03em] bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
        Listen.
      </h1>
    </div>
  </div>

  {/* RIGHT — Mic + Controls */}
  <div className="relative flex flex-col items-center justify-center px-12 py-14 gap-6 overflow-hidden">

    <div className="scanner-bar absolute left-0 right-0 h-20 pointer-events-none opacity-30 z-0" />

    <p className="text-[17px] text-slate-400 leading-relaxed text-center max-w-[300px]">
      Navigate global news with your voice. One command takes you anywhere — and reads the headlines aloud.
    </p>

    {/* Mic button */}
    <div className="relative flex items-center justify-center w-[100px] h-[100px]">
      {(isListening || isProcessing) && (
        <>
          <div className="mic-ring absolute w-[100px] h-[100px]" />
          <div className="mic-ring mic-ring-2 absolute w-[100px] h-[100px]" />
          <div className="mic-ring mic-ring-3 absolute w-[100px] h-[100px]" />
        </>
      )}
      <button
        onClick={handleMicClick}
        className={`relative z-10 flex items-center justify-center w-[90px] h-[90px] rounded-full border transition-all duration-300 ${micBg} ${micBorderColor} ${isListening ? 'pulse-glow' : ''}`}
      >
        {isProcessing ? (
          <svg className="processing-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" className="stroke-indigo-500/20" />
            <path d="M12 2 A10 10 0 0 1 22 12" className="stroke-indigo-400" />
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className={isListening ? 'stroke-cyan-400' : isResult ? 'stroke-emerald-400' : 'stroke-slate-400'}
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        )}
      </button>
    </div>

    {/* State label */}
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${isListening ? 'bg-cyan-400 blink' : 'bg-slate-600'}`} />
      <span className="text-[10px] tracking-[0.25em] uppercase text-slate-500">
        {STATE_LABELS[voiceState]}
      </span>
    </div>

    {/* Rotating command */}
    <div className="px-5 py-2.5 rounded-lg bg-slate-900 border border-indigo-500/20 text-sm font-mono">
      <span className="text-indigo-400">$&nbsp;</span>
      <span className="text-slate-300">
        {EXAMPLE_COMMANDS[ticker % EXAMPLE_COMMANDS.length].command}
      </span>
      <span className="blink text-slate-500">_</span>
    </div>

  </div>
</section>

      {/* ── SECTION 2: How It Works ───────────────────────────────── */}
      <section className="py-32 px-6 bg-[#020617]">
        <div className="max-w-7xl mx-auto">

          <div className="max-w-2xl mb-20">
            <p className="text-xs tracking-[0.3em] uppercase text-cyan-400/50 mb-4">
              System Architecture
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              How it works
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              A five-stage AI pipeline converts a spoken sentence into a
              navigated page with live headlines — in under two seconds.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center flex-1">

                <div
                  className={`flex-1 w-full rounded-xl p-6 transition-all duration-500 border ${
                    activeStep === i
                      ? "bg-cyan-400/5 border-cyan-400/35"
                      : "bg-slate-900 border-white/5"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold tracking-widest mb-4 ${
                      activeStep === i ? "text-cyan-400" : "text-slate-600"
                    }`}
                  >
                    {step.icon}
                  </p>
                  <p className="text-sm font-medium text-slate-200 mb-2">
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.sub}</p>
                </div>

                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden md:block flex-shrink-0 mx-2 w-8 h-px">
                    <div className="pipeline-line w-full h-full" />
                  </div>
                )}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="md:hidden flex-shrink-0 my-2 w-px h-6">
                    <div className="pipeline-line w-full h-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: AI Intent Understanding ───────────────────── */}
      <section className="py-32 px-6 grid-bg bg-[#030a18]">
        <div className="max-w-7xl mx-auto">

          <div className="max-w-2xl mb-20">
            <p className="text-xs tracking-[0.3em] uppercase text-indigo-400/50 mb-4">
              Natural Language Intelligence
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              Understands intent,
              <br />
              not just words
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Groq Llama 3 reads your full spoken sentence and extracts
              structured meaning — identifying the action, destination, and
              topic — then routes everything automatically.
            </p>
          </div>

          {/* four-step intent cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {INTENT_STEPS.map((item) => (
              <div
                key={item.step}
                className={`rounded-2xl p-8 border ${item.bg} ${item.border}`}
              >
                <p className={`text-xs font-semibold tracking-widest mb-5 ${item.accent}`}>
                  STEP {item.step}
                </p>
                <h3 className={`text-xl font-bold mb-4 ${item.accent}`}>
                  {item.label}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* extracted fields strip */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-8">
            <p className="text-xs tracking-widest uppercase text-slate-500 mb-8">
              Example — what Llama 3 extracts from a single sentence
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Action",
                  value: "navigate",
                  classes: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
                },
                {
                  label: "Destination",
                  value: "dashboard",
                  classes: "text-indigo-300 bg-indigo-400/10 border-indigo-400/20",
                },
                {
                  label: "Topic",
                  value: "space exploration",
                  classes: "text-violet-300 bg-violet-400/10 border-violet-400/20",
                },
              ].map((field) => (
                <div
                  key={field.label}
                  className={`flex flex-col gap-2 rounded-xl px-5 py-4 border ${field.classes}`}
                >
                  <span className="text-xs tracking-widest uppercase opacity-60">
                    {field.label}
                  </span>
                  <span className="text-base font-medium">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Voice Commands ─────────────────────────────── */}
      <section className="py-32 px-6 bg-[#020617]">
        <div className="max-w-7xl mx-auto">

          <div className="max-w-2xl mb-20">
            <p className="text-xs tracking-[0.3em] uppercase text-cyan-400/50 mb-4">
              Voice Commands
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              Say anything natural
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              No rigid phrases, no menus. Just speak the way you think and the
              system figures out the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXAMPLE_COMMANDS.map((cmd, i) => (
              <div
                key={i}
                className="cmd-card rounded-xl p-6 bg-slate-900 border border-white/5 cursor-default transition-all duration-300"
              >
                <span className="text-xs tracking-widest uppercase text-slate-600 mb-5 block">
                  {cmd.tag}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="text-cyan-400/60">"</span>
                  {cmd.command}
                  <span className="text-cyan-400/60">"</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}