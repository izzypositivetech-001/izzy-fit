import TerminalOverlay from "@/components/TerminalOverlay";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import UserPrograms from "@/components/UserPrograms";

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden">
      <section className="relative z-10 py-24 flex-grow">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
            {/* CORNER DECORATION */}
            <div className="absolute -top-10 left-0 w-40 h-40 border-l-2 border-t-2 border-border" />

            {/* LEFT SIDE CONTENT */}

            <div className="lg:col-span-7 space-y-8 relative">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <div>
                  <span className="text-foreground">Transform</span>
                </div>
                <div>
                  <span className="text-primary">Your Body</span>
                </div>
                <div>
                  <span className="text-foreground">With Advanced</span>
                </div>
                <div>
                  <span className="text-primary">AI </span>
                  <span className="text-foreground"> Technology</span>
                </div>
              </h1>

              {/* SEPERATOR LINE */}
              <div className="w-full h-1 bg-primary rounded-full" />

              {/* DESCRIPTION */}
              <p className="text-lg text-foreground/80">
                Experience the future of fitness with our AI-powered body
                transformation program. Talk to our AI assistant Get
                personalized workout plans, nutrition guidance, and real-time
                progress tracking. Achieve your dream body faster and smarter
                with our cutting-edge technology.
              </p>

              {/* STATS*/}
              <div className="flex items-center gap-10 py-6 font-mono">
                <div className="flex flex-col">
                  <div className="text-2xl text-primary">500+</div>
                  <div className="text-sm text-foreground/80">ACTIVE USERS</div>
                </div>
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                <div className="flex flex-col">
                  <div className="text-2xl text-primary">3min</div>
                  <div className="text-sm text-foreground/80">GENERATION</div>
                </div>
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                <div className="flex flex-col">
                  <div className="text-2xl text-primary">100%</div>
                  <div className="text-xs uppercase tracking-wider">
                    PERSONALIZED
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  size="lg"
                  asChild
                  className="overflow-hidden bg-primary text-primary-foreground px-8 py-6 text-lg font-medium"
                >
                  <Link
                    href={"/generate-program"}
                    className="flex items-center font-mono"
                  >
                    Build Your Program
                    <ArrowRightIcon className="ml-2 size-5" />
                  </Link>
                </Button>
              </div>
            </div>
            {/* RIGHT SIDE CONTENT */}

            <div className="lg:col-span-5 relative">
              {/* CORNER DECORATION */}
              <div className="absolute -inset-4 pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-primary/40"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-primary/40"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-primary/40"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-primary/40"></div>
              </div>
              {/* IMAGE CONTENT */}
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="relative overflow-hidden rounded-lg bg-cyber-black">
                 <Image 
                      src="/hero1.jpg"
                    alt="hero"
                    className="object-cover object-center w-full h-full transition-transform duration-500 ease-in-out transform hover:scale-105"
                 />

                  {/* SCAN LINE */}
                  <div
                    className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_calc(50%-1px),
                 var(--cyber-glow-primary)_50%,transparent_calc(50%+1px),
                 transparent_100%)] bg-[length:100%_8px] animate-scanline pointer-events-none"
                  />

                  {/* deco on top */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border border-primary/40 rounded-full" />
                    <div className="absolute top-1/2 left-0 w-1/4 h-px bg-primary/50" />
                    <div className="absolute top-1/2 right-0 w-1/4 h-px bg-primary/50" />
                    <div className="absolute top-0 left-1/2 h-1/4 w-px bg-primary/50" />
                    <div className="absolute bottom-0 left-1/2 h-1/4 w-px bg-primary/50" />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>

                {/* terminal overlay */}

                <TerminalOverlay />
              </div>
            </div>
          </div>
        </div>
      </section>

      <UserPrograms />

      {/* FOOTER */}
    </div>
  );
};

export default HomePage;
