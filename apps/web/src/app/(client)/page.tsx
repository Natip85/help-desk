"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Headphones,
  Inbox,
  Mail,
  MessageSquare,
  Shield,
  Ticket,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export default function Home() {
  const { data: session } = authClient.useSession();

  if (session) {
    return redirect("/tickets");
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* ── Hero ── */}
      <section className="relative px-6 pt-16 pb-20 lg:px-14 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <Badge
                variant="outline"
                className="text-muted-foreground w-fit text-[11px] tracking-widest uppercase"
              >
                Customer support platform
              </Badge>

              <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Resolve faster.
                <br />
                <span className="text-primary">Retain more.</span>
              </h1>

              <p className="text-muted-foreground max-w-md text-[15px] leading-relaxed">
                Help Desk is the modern support platform that unifies tickets, contacts, and email
                into one streamlined workspace — so your team can focus on what matters.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  size="lg"
                  className="h-10 px-6 text-sm"
                  asChild
                >
                  <Link href="/auth/sign-in">
                    Get started free
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-10 px-6 text-sm"
                  asChild
                >
                  <Link href="/auth/sign-in">Sign in</Link>
                </Button>
              </div>

              <div className="text-muted-foreground flex items-center gap-4 pt-1 text-xs">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  SOC 2 ready
                </span>
                <span className="bg-border h-3 w-px" />
                <span>No credit card required</span>
                <span className="bg-border h-3 w-px" />
                <span>Free forever plan</span>
              </div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <DashboardMockup />
              <div className="bg-primary pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-15 blur-[60px]" />
              <div className="bg-primary pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-10 blur-[80px]" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Metrics strip ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="border-border/50 border-y"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-4 lg:px-14">
          {[
            { value: "98%", label: "Customer satisfaction", icon: TrendingUp },
            { value: "<2min", label: "Avg. first response", icon: Clock },
            { value: "50k+", label: "Tickets resolved", icon: Ticket },
            { value: "24/7", label: "Multi-channel support", icon: Headphones },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="flex flex-col items-center gap-1.5 py-8 text-center"
            >
              <stat.icon className="text-primary mb-1 h-4 w-4" />
              <span className="text-2xl font-semibold tracking-tight">{stat.value}</span>
              <span className="text-muted-foreground text-xs">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section className="px-6 py-20 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="mb-14 max-w-lg"
          >
            <Badge
              variant="outline"
              className="text-muted-foreground mb-4 w-fit text-[11px] tracking-widest uppercase"
            >
              Platform
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything your support team needs
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              A unified workspace for managing customer relationships, from first contact to
              resolution.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <FeatureCard
              icon={Inbox}
              title="Unified Inbox"
              description="All channels in one queue. Email, chat, and forms converge into a single prioritized stream."
              accent
            />
            <FeatureCard
              icon={Users}
              title="Contact Management"
              description="Full customer profiles with interaction history, notes, and custom fields — a true CRM layer."
            />
            <FeatureCard
              icon={Mail}
              title="Email Integration"
              description="Send and receive email natively. Auto-thread conversations and track delivery status."
            />
            <FeatureCard
              icon={Zap}
              title="Automations"
              description="Route, assign, and escalate tickets automatically with rule-based workflows."
            />
            <FeatureCard
              icon={Clock}
              title="SLA Tracking"
              description="Set response and resolution targets. Get alerts before deadlines are breached."
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics"
              description="Track team performance, resolution trends, and customer satisfaction over time."
            />
          </motion.div>
        </div>
      </section>

      {/* ── Workflow preview ── */}
      <section className="border-border/50 border-t px-6 py-20 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2"
          >
            <motion.div variants={fadeUp}>
              <TicketListMockup />
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-5"
            >
              <Badge
                variant="outline"
                className="text-muted-foreground w-fit text-[11px] tracking-widest uppercase"
              >
                Workflow
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                From inbox to resolved, in fewer clicks
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Triage incoming tickets with smart filters, assign them to the right agent, and
                track every interaction until the customer is satisfied. Canned responses and
                keyboard shortcuts keep your team moving fast.
              </p>
              <ul className="text-muted-foreground mt-1 space-y-2.5 text-sm">
                {[
                  "Smart ticket assignment & routing",
                  "Canned responses for common questions",
                  "Internal notes & collision detection",
                  "Custom tags, filters, and saved views",
                ].map((text) => (
                  <li
                    key={text}
                    className="flex items-start gap-2.5"
                  >
                    <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    {text}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-border/50 border-t px-6 py-20 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mx-auto flex max-w-md flex-col items-center gap-5 text-center"
        >
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
            <MessageSquare className="text-primary h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Ready to transform your support?
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Set up your workspace in minutes. Start resolving tickets today.
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="h-10 px-6 text-sm"
              asChild
            >
              <Link href="/auth/sign-in">
                Start for free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-border/50 border-t px-6 py-6 lg:px-14">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Help Desk
          </span>
          <span className="text-muted-foreground text-xs">Built with care.</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`group relative overflow-hidden rounded-lg border p-5 transition-colors ${
        accent ?
          "bg-primary text-primary-foreground border-primary"
        : "border-border/60 bg-card hover:border-border"
      }`}
    >
      <div className="flex flex-col gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent ? "bg-primary-foreground/15" : "bg-primary/10"
          }`}
        >
          <Icon className={`h-4.5 w-4.5 ${accent ? "" : "text-primary"}`} />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className={`text-xs leading-relaxed ${accent ? "opacity-80" : "text-muted-foreground"}`}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Dashboard mockup ── */
function DashboardMockup() {
  return (
    <div className="bg-card ring-border/60 rounded-xl p-5 shadow-xl ring-1">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium">Dashboard</span>
        <div className="flex gap-1.5">
          <div className="bg-muted h-2 w-2 rounded-full" />
          <div className="bg-muted h-2 w-2 rounded-full" />
          <div className="bg-muted h-2 w-2 rounded-full" />
        </div>
      </div>

      {/* Stat row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Open tickets", value: "23", change: "-12%" },
          { label: "Avg. response", value: "1.4m", change: "-8%" },
          { label: "Satisfaction", value: "97%", change: "+3%" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-muted/40 ring-border/40 rounded-lg p-3 ring-1"
          >
            <div className="text-muted-foreground mb-1 text-[10px]">{s.label}</div>
            <div className="text-lg leading-none font-semibold">{s.value}</div>
            <div className="text-primary mt-1 text-[10px] font-medium">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Mini chart placeholder */}
      <div className="bg-muted/30 ring-border/40 mb-4 rounded-lg p-3 ring-1">
        <div className="text-muted-foreground mb-2 text-[10px]">Tickets resolved — last 7 days</div>
        <div className="flex items-end gap-1.5">
          {[40, 55, 35, 65, 80, 60, 75].map((h, i) => (
            <div
              key={i}
              className="bg-primary/60 flex-1 rounded-sm transition-all"
              style={{ height: `${h * 0.5}px` }}
            />
          ))}
        </div>
      </div>

      {/* Recent tickets */}
      <div className="space-y-2">
        <div className="text-muted-foreground text-[10px]">Recent tickets</div>
        {[
          { id: "#1042", subject: "Login issue on mobile", status: "open" },
          { id: "#1041", subject: "Billing question", status: "pending" },
          { id: "#1040", subject: "Feature request: dark mode", status: "resolved" },
        ].map((t) => (
          <div
            key={t.id}
            className="bg-muted/30 ring-border/30 flex items-center gap-3 rounded-md px-3 py-2 ring-1"
          >
            <span className="text-muted-foreground font-mono text-[10px]">{t.id}</span>
            <span className="flex-1 truncate text-[11px]">{t.subject}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                t.status === "open" ? "bg-primary/15 text-primary"
                : t.status === "pending" ? "bg-yellow-500/15 text-yellow-500"
                : "bg-emerald-500/15 text-emerald-500"
              }`}
            >
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ticket list mockup ── */
function TicketListMockup() {
  const tickets = [
    {
      id: "#1048",
      subject: "Cannot reset password",
      priority: "high",
      assignee: "AK",
      time: "2m ago",
      status: "open",
    },
    {
      id: "#1047",
      subject: "Webhook integration failing",
      priority: "medium",
      assignee: "JD",
      time: "8m ago",
      status: "open",
    },
    {
      id: "#1046",
      subject: "Update billing address",
      priority: "low",
      assignee: "SR",
      time: "14m ago",
      status: "pending",
    },
    {
      id: "#1045",
      subject: "SSO configuration help",
      priority: "high",
      assignee: "AK",
      time: "22m ago",
      status: "open",
    },
    {
      id: "#1044",
      subject: "Export data to CSV",
      priority: "low",
      assignee: "JD",
      time: "1h ago",
      status: "resolved",
    },
  ];

  return (
    <div className="bg-card ring-border/60 overflow-hidden rounded-xl shadow-xl ring-1">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-xs font-medium">All Tickets</span>
          <Badge
            variant="secondary"
            className="text-[10px]"
          >
            23 open
          </Badge>
        </div>
        <div className="flex gap-1">
          {["All", "Open", "Pending"].map((f) => (
            <span
              key={f}
              className={`rounded-md px-2 py-0.5 text-[10px] ${
                f === "All" ? "bg-muted font-medium" : "text-muted-foreground"
              }`}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="divide-border/50 divide-y">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="hover:bg-muted/30 flex items-center gap-3 px-4 py-2.5 transition-colors"
          >
            <div
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                t.priority === "high" ? "bg-destructive"
                : t.priority === "medium" ? "bg-yellow-500"
                : "bg-muted-foreground/40"
              }`}
            />
            <span className="text-muted-foreground w-12 font-mono text-[10px]">{t.id}</span>
            <span className="min-w-0 flex-1 truncate text-[11px]">{t.subject}</span>
            <div className="bg-muted text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium">
              {t.assignee}
            </div>
            <span className="text-muted-foreground w-12 text-right text-[10px]">{t.time}</span>
            <span
              className={`w-14 rounded-full px-1.5 py-0.5 text-center text-[9px] font-medium ${
                t.status === "open" ? "bg-primary/15 text-primary"
                : t.status === "pending" ? "bg-yellow-500/15 text-yellow-500"
                : "bg-emerald-500/15 text-emerald-500"
              }`}
            >
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
