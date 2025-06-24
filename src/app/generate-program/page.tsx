'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GenerateProgramPage = () => {
  // State management
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{content: string; role: 'user' | 'assistant'}[]>([]);
  const [callEnded, setCallEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vapiReady, setVapiReady] = useState(false);
  const [micAccessGranted, setMicAccessGranted] = useState(false);

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Check microphone permissions
  useEffect(() => {
    const checkMicPermissions = async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.permissions) {
          console.warn("Permissions API not supported");
          return;
        }
        
        const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
        setMicAccessGranted(micStatus.state === 'granted');
        
        micStatus.onchange = () => {
          setMicAccessGranted(micStatus.state === 'granted');
        };
      } catch (err) {
        console.warn("Mic permission check failed:", err);
      }
    };

    checkMicPermissions();
  }, []);

  // Initialize VAPI
  useEffect(() => {
    if (!isLoaded) return;

    try {
      // Test VAPI availability
      if (vapi) {
        setVapiReady(true);
      } else {
        setError("Voice service is not available");
      }
    } catch (err) {
      console.error("VAPI initialization error:", err);
      setError("Failed to initialize voice service");
    }
  }, [isLoaded]);

  // Auto-scroll messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Redirect after call ends
  useEffect(() => {
    if (callEnded) {
      const timer = setTimeout(() => {
        router.push("/profile");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [callEnded, router]);

  // VAPI event handlers
  useEffect(() => {
    if (!isLoaded || !vapiReady) return;

    const handleCallStart = () => {
      console.log("Call started");
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
      setError(null);
    };

    const handleCallEnd = () => {
      console.log("Call ended");
      setCallActive(false);
      setConnecting(false);
      setIsSpeaking(false);
      setCallEnded(true);
    };

    const handleSpeechStart = () => {
      console.log("AI started speaking");
      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      console.log("AI stopped speaking");
      setIsSpeaking(false);
    };

    const handleMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages(prev => [...prev, {
          content: message.transcript,
          role: message.role
        }]);
      }
    };

    const handleError = (error: any) => {
      console.error("Detailed VAPI Error:", error);
      setError(error?.message || error?.toString() || "Voice call error occurred");
      setConnecting(false);
      setCallActive(false);
    };

    vapi
      .on("call-start", handleCallStart)
      .on("call-end", handleCallEnd)
      .on("speech-start", handleSpeechStart)
      .on("speech-end", handleSpeechEnd)
      .on("message", handleMessage)
      .on("error", handleError);

    return () => {
      vapi
        .off("call-start", handleCallStart)
        .off("call-end", handleCallEnd)
        .off("speech-start", handleSpeechStart)
        .off("speech-end", handleSpeechEnd)
        .off("message", handleMessage)
        .off("error", handleError);
    };
  }, [isLoaded, vapiReady]);

  const toggleCall = async () => {
    if (callActive) {
      vapi.stop();
      return;
    }

    if (!isLoaded || !user) {
      setError("User not loaded");
      return;
    }

    if (!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
      setError("Voice service configuration error");
      return;
    }

    if (!micAccessGranted) {
      setError("Microphone access is required. Please enable microphone permissions.");
      return;
    }

    try {
      setConnecting(true);
      setMessages([]);
      setError(null);

      const fullName = user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : "User";

      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          full_name: fullName,
          user_id: user.id,
        },
        clientMessages: [],
        serverMessages: []
      });
    } catch (err) {
      console.error("Call start failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start voice call");
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-5xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Have a voice conversation with our AI assistant to create your personalized plan
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* VIDEO CALL AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI ASSISTANT CARD */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* AI VOICE ANIMATION */}
              <div className={`absolute inset-0 ${isSpeaking ? "opacity-30" : "opacity-0"} transition-opacity duration-300`}>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`mx-1 h-16 w-1 bg-primary rounded-full ${isSpeaking ? "animate-sound-wave" : ""}`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: isSpeaking ? `${Math.random() * 50 + 20}%` : "5%",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* AI IMAGE */}
              <div className="relative size-32 mb-4">
                <div className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${isSpeaking ? "animate-pulse" : ""}`} />
                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                  <Image
                    src="/hero2.jpg"
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-ai.png';
                    }}
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">IzzyFit AI</h2>
              <p className="text-sm text-muted-foreground mt-1">Fitness & Diet Coach</p>

              {/* SPEAKING INDICATOR */}
              <div className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border ${isSpeaking ? "border-primary" : "border-border"}`}>
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-primary animate-pulse" : "bg-muted"}`} />
                <span className="text-xs text-muted-foreground">
                  {isSpeaking
                    ? "Speaking..."
                    : callActive
                      ? "Listening..."
                      : callEnded
                        ? "Redirecting..."
                        : "Waiting..."}
                </span>
              </div>
            </div>
          </Card>

          {/* USER CARD */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* User Image */}
              <div className="relative size-32 mb-4">
                <Image
                  src={user?.imageUrl || '/default-user.png'}
                  alt="User"
                  className="size-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/default-user.png';
                  }}
                />
              </div>

              <h2 className="text-xl font-bold text-foreground">You</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user ? (user.firstName + " " + (user.lastName || "")).trim() : "Guest"}
              </p>

              {/* User Ready Text */}
              <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border">
                <div className={`w-2 h-2 rounded-full ${micAccessGranted ? "bg-green-500" : "bg-muted"}`} />
                <span className="text-xs text-muted-foreground">
                  {micAccessGranted ? "Mic Ready" : "Mic Access Needed"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* MESSAGE CONTAINER */}
        {(messages.length > 0 || callEnded) && (
          <div
            ref={messageContainerRef}
            className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
          >
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className="message-item animate-fadeIn">
                  <div className={`font-semibold text-xs mb-1 ${msg.role === 'assistant' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {msg.role === "assistant" ? "IzzyFit AI" : "You"}:
                  </div>
                  <p className="text-foreground">{msg.content}</p>
                </div>
              ))}

              {callEnded && (
                <div className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-primary mb-1">System:</div>
                  <p className="text-foreground">
                    Your fitness program has been created! Redirecting to your profile...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CALL CONTROLS */}
        <div className="w-full flex justify-center gap-4">
          <Button
            className={`w-40 text-xl rounded-3xl ${
              callActive
                ? "bg-destructive hover:bg-destructive/90"
                : callEnded
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-primary hover:bg-primary/90"
            } text-white relative`}
            onClick={toggleCall}
            disabled={connecting || (callEnded && !callActive) || !vapiReady || !micAccessGranted}
          >
            {connecting && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
            )}
            <span>
              {!vapiReady
                ? "Initializing..."
                : !micAccessGranted
                  ? "Enable Mic"
                  : callActive
                    ? "End Call"
                    : connecting
                      ? "Connecting..."
                      : callEnded
                        ? "Success!"
                        : "Start Call"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramPage;