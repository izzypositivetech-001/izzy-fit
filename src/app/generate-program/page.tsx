"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GenerateProgramPage = () => {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{ content: string; role: "user" | "assistant" }[]>([]);
  const [callEnded, setCallEnded] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced error handling for the new @vapi-ai/web SDK
  useEffect(() => {
    const handleError = (error: any) => {
      console.log("Raw Vapi Error:", error);
      
      // Handle different error formats from new SDK
      let errorMessage = "";
      
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = typeof error.error === "string" ? error.error : JSON.stringify(error.error);
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error && typeof error === "object") {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }

      // Ignore known harmless errors
      if (
        errorMessage.includes("Meeting has ended") ||
        errorMessage.includes("Call already ended") ||
        errorMessage.includes("WebRTC") ||
        errorMessage === "{}" ||
        errorMessage === "" ||
        errorMessage.includes("NotAllowedError") // Common microphone permission error
      ) {
        console.log("Ignoring known Vapi error:", errorMessage);
        return;
      }

      console.error("Actual Vapi Error:", errorMessage);
      setConnecting(false);
      setCallActive(false);
    };

    vapi.on("error", handleError);

    return () => {
      vapi.off("error", handleError);
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Navigate to profile after call ends
  useEffect(() => {
    if (callEnded) {
      const redirectTimer = setTimeout(() => {
        router.push("/profile");
      }, 1500);

      return () => clearTimeout(redirectTimer);
    }
  }, [callEnded, router]);

  // Setup Vapi event listeners with new SDK compatibility
  useEffect(() => {
    const handleCallStart = () => {
      console.log("Call started");
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
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

    // Updated message handling for @vapi-ai/web SDK
    const handleMessage = (message: any) => {
      console.log("Raw message:", message);
      
      // The new SDK uses different message structures
      if (message?.type === "transcript") {
        const transcript = message.transcript;
        const role = message.role;
        const transcriptType = message.transcriptType;

        if (transcript && role && transcriptType === "final") {
          const newMessage = { 
            content: transcript, 
            role: role as "user" | "assistant" 
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      }
      
      // Handle other message types that might contain transcripts
      else if (message?.transcript && message?.role) {
        const newMessage = { 
          content: message.transcript, 
          role: message.role as "user" | "assistant" 
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    // Event listener setup for new SDK
    try {
      vapi.on("call-start", handleCallStart);
      vapi.on("call-end", handleCallEnd);
      vapi.on("speech-start", handleSpeechStart);
      vapi.on("speech-end", handleSpeechEnd);
      vapi.on("message", handleMessage);
    } catch (error) {
      console.warn("Error setting up Vapi listeners:", error);
    }

    // Cleanup
    return () => {
      try {
        vapi.off("call-start", handleCallStart);
        vapi.off("call-end", handleCallEnd);
        vapi.off("speech-start", handleSpeechStart);
        vapi.off("speech-end", handleSpeechEnd);
        vapi.off("message", handleMessage);
      } catch (error) {
        console.warn("Error cleaning up Vapi listeners:", error);
      }
    };
  }, []);

  const toggleCall = async () => {
    if (callActive) {
      try {
        vapi.stop();
        // Don't wait for the call to end, just update state
        setCallActive(false);
        setConnecting(false);
        setIsSpeaking(false);
      } catch (error) {
        console.warn("Error stopping call:", error);
        // Force state reset even if stop fails
        setCallActive(false);
        setConnecting(false);
        setIsSpeaking(false);
      }
    } else {
      try {
        setConnecting(true);
        setMessages([]);
        setCallEnded(false);

        const fullName = user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : "User";

        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        if (!assistantId) {
          throw new Error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is not defined in environment variables");
        }

        // Correct way to start with assistant ID and overrides
        const assistantOverrides = {
          recordingEnabled: false,
          variableValues: {
            full_name: fullName,
            user_id: user?.id || "anonymous",
          },
        };

        console.log("Starting call with assistant ID:", assistantId);
        console.log("Assistant overrides:", assistantOverrides);
        
        vapi.start(assistantId, assistantOverrides);
        
      } catch (error) {
        console.error("Failed to start call:", error);
        setConnecting(false);
        
        // Provide more specific error feedback
        let errorMessage = "Failed to start call";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        }
        
        // Show error to user
        alert(`Error starting call: ${errorMessage}`);
      }
    }
  };

  // Predefined heights for voice waves to avoid random jitter on re-renders
  const waveHeights = [30, 60, 90, 60, 30]; // Symmetric wave pattern

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

        {/* VIDEO CALL AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI ASSISTANT CARD */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* AI VOICE ANIMATION */}
              <div
                className={`absolute inset-0 ${
                  isSpeaking ? "opacity-30" : "opacity-0"
                } transition-opacity duration-300`}
              >
                {/* Voice wave animation when speaking */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                  {waveHeights.map((height, i) => (
                    <div
                      key={i}
                      className={`mx-1 h-16 w-1 bg-primary rounded-full ${
                        isSpeaking ? "animate-sound-wave" : ""
                      }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: isSpeaking ? `${height}%` : "5%",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* AI IMAGE */}
              <div className="relative size-32 mb-4">
                <div
                  className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${
                    isSpeaking ? "animate-pulse" : ""
                  }`}
                />
                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                  <Image
                    src="/hero2.jpg"
                    alt="AI Assistant Avatar"
                    height={200}
                    width={200}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">Izzy Fit</h2>
              <p className="text-sm text-muted-foreground mt-1">Fitness & Diet Coach</p>

              {/* SPEAKING INDICATOR */}
              <div
                className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${
                  isSpeaking ? "border-primary" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking ? "bg-primary animate-pulse" : "bg-muted"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isSpeaking
                    ? "Speaking..."
                    : callActive
                    ? "Listening..."
                    : callEnded
                    ? "Redirecting to profile..."
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
                  src={user?.imageUrl || "/default-user.png"}
                  alt="User Profile Image"
                  height={200}
                  width={200}
                  className="size-full object-cover rounded-full"
                />
              </div>

              <h2 className="text-xl font-bold text-foreground">You</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Guest"}
              </p>

              {/* User Ready Text */}
              <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
          </Card>
        </div>

        {/* MESSAGE CONTAINER */}
        {messages.length > 0 && (
          <div
            ref={messageContainerRef}
            className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 max-h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
          >
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
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
        {!callEnded && (
          <div className="w-full flex justify-center gap-4">
            <Button
              className={`w-40 text-xl rounded-3xl ${
                callActive
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90"
              } text-white relative`}
              onClick={toggleCall}
              disabled={connecting}
              aria-label={callActive ? "End Call" : "Start Call"}
            >
              {connecting && (
                <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
              )}
              <span>
                {callActive ? "End Call" : connecting ? "Connecting..." : "Start Call"}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateProgramPage;