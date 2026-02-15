"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Columns3, GitBranch, Users, Zap } from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Home() {
  const { data: session } = authClient.useSession();

  if (session) {
    return redirect("/tickets");
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* ── Hero: asymmetric split ── */}
      <div className="grid min-h-[80vh] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-5 lg:gap-16 lg:px-14">
        {/* Left column — copy */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-5 py-20 lg:col-span-2 lg:py-0"
        >
          <Badge
            variant="outline"
            className="w-fit text-[11px] tracking-wide"
          >
            Project management, reimagined
          </Badge>

          <h1 className="font-serif text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl lg:text-6xl">
            Ship&nbsp;faster.
            <br />
            <span className="text-primary italic">Stay&nbsp;organized.</span>
          </h1>

          <p className="text-muted-foreground max-w-sm text-[15px] leading-relaxed">
            Help Desk gives your team a clean, opinionated workspace to plan sprints, track issues,
            and move work forward — no clutter.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <Button
              size="lg"
              className="h-11 px-7 text-sm"
              asChild
            >
              <Link href="#">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <span className="text-muted-foreground text-xs">
              Free forever &middot; No credit&nbsp;card
            </span>
          </div>
        </motion.div>

        {/* Right column — decorative board mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -1 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative hidden lg:col-span-3 lg:block"
        >
          <div className="bg-card ring-foreground/8 rounded-2xl p-7 shadow-2xl ring-1">
            <div className="grid grid-cols-3 gap-5">
              {/* Column: Todo */}
              <KanbanColumn
                title="Todo"
                cards={[
                  { w1: "w-3/4", w2: "w-1/2" },
                  { w1: "w-full", w2: "w-2/3" },
                ]}
              />
              {/* Column: In Progress */}
              <div className="flex flex-col gap-3">
                <span className="text-primary text-[11px] font-semibold tracking-widest uppercase">
                  In&nbsp;Progress
                </span>
                <div className="border-primary/20 bg-primary/5 rounded-lg p-3.5">
                  <div className="bg-primary/25 h-2 w-2/3 rounded-full" />
                  <div className="bg-primary/15 mt-2.5 h-2 w-1/2 rounded-full" />
                </div>
                <div className="border-primary/20 bg-primary/5 rounded-lg p-3.5">
                  <div className="bg-primary/25 h-2 w-5/6 rounded-full" />
                  <div className="bg-primary/15 mt-2.5 h-2 w-1/3 rounded-full" />
                </div>
              </div>
              {/* Column: Done */}
              <KanbanColumn
                title="Done"
                faded
                cards={[
                  { w1: "w-full", w2: "w-3/4" },
                  { w1: "w-2/3", w2: "w-1/3" },
                  { w1: "w-5/6", w2: "w-1/2" },
                ]}
              />
            </div>
          </div>

          {/* Glow accents */}
          <div className="bg-primary pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-20 blur-3xl" />
          <div className="bg-primary pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10 blur-[60px]" />
        </motion.div>
      </div>

      {/* ── Bento feature grid ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid auto-rows-[200px] grid-cols-1 gap-3.5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3 lg:px-14"
      >
        {/* Wide card */}
        <motion.div
          variants={item}
          className="bg-card ring-foreground/8 group relative overflow-hidden rounded-2xl p-6 ring-1 sm:col-span-2"
        >
          <div className="relative z-10 flex h-full flex-col justify-between">
            <Columns3 className="text-primary h-7 w-7" />
            <div>
              <h3 className="text-[15px] font-semibold">Kanban boards</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed">
                Drag-and-drop cards across columns. Visualize your entire workflow at a glance.
              </p>
            </div>
          </div>
          <div className="bg-primary/5 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </motion.div>

        {/* Accent card */}
        <motion.div
          variants={item}
          className="bg-primary text-primary-foreground group relative overflow-hidden rounded-2xl p-6"
        >
          <div className="relative z-10 flex h-full flex-col justify-between">
            <Zap className="h-7 w-7" />
            <div>
              <h3 className="text-[15px] font-semibold">Built for speed</h3>
              <p className="mt-1 text-sm leading-relaxed opacity-80">
                Instant updates. No page reloads. Everything feels snappy.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Normal card */}
        <motion.div
          variants={item}
          className="bg-card ring-foreground/8 group relative overflow-hidden rounded-2xl p-6 ring-1"
        >
          <div className="relative z-10 flex h-full flex-col justify-between">
            <Users className="text-primary h-7 w-7" />
            <div>
              <h3 className="text-[15px] font-semibold">Team-first</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Invite members, assign roles, and collaborate in real time.
              </p>
            </div>
          </div>
          <div className="bg-primary/5 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </motion.div>

        {/* Wide card */}
        <motion.div
          variants={item}
          className="bg-card ring-foreground/8 group relative overflow-hidden rounded-2xl p-6 ring-1 sm:col-span-2"
        >
          <div className="relative z-10 flex h-full flex-col justify-between">
            <GitBranch className="text-primary h-7 w-7" />
            <div>
              <h3 className="text-[15px] font-semibold">GitHub integration</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed">
                Link PRs, track branches, and automate status changes from your repo activity.
              </p>
            </div>
          </div>
          <div className="bg-primary/5 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </motion.div>
      </motion.div>

      {/* ── Bottom CTA strip ── */}
      <div className="border-border/60 flex flex-col items-center gap-4 border-t py-16 text-center">
        <CheckCircle2 className="text-primary h-8 w-8" />
        <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
          Join teams already shipping faster with&nbsp;Help Desk.
        </p>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link href="#">
            Open your workspace
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ── Helper: skeleton kanban column ── */
function KanbanColumn({
  title,
  cards,
  faded = false,
}: {
  title: string;
  cards: { w1: string; w2: string }[];
  faded?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </span>
      {cards.map((c, i) => (
        <div
          key={i}
          className={`bg-muted/50 ring-foreground/5 rounded-lg p-3.5 ring-1 ${faded ? "opacity-50" : ""}`}
        >
          <div className={`bg-foreground/10 h-2 rounded-full ${c.w1}`} />
          <div className={`bg-foreground/5 mt-2.5 h-2 rounded-full ${c.w2}`} />
        </div>
      ))}
    </div>
  );
}
