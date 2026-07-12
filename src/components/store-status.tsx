import { CheckCircle2, Clock, XCircle } from "lucide-react";

type Status = "pending" | "approved" | "rejected";

const COPY: Record<
  Status,
  { icon: typeof Clock; title: string; body: string; tone: string }
> = {
  pending: {
    icon: Clock,
    title: "Under review",
    body: "A person is looking at your application. We'll call you on the number you gave us within a couple of days.",
    tone: "text-flare-amber",
  },
  approved: {
    icon: CheckCircle2,
    title: "You're live",
    body: "Your store is approved. You can start listing stock — photograph each piece flat against a white wall and upload it.",
    tone: "text-flare-rose",
  },
  rejected: {
    icon: XCircle,
    title: "Not a fit right now",
    body: "We couldn't approve this application. If you think that's a mistake, reply to the email we sent and we'll take another look.",
    tone: "text-bone-400",
  },
};

export function StoreStatusCard({
  name,
  status,
}: {
  name: string;
  status: Status;
}) {
  const { icon: Icon, title, body, tone } = COPY[status];

  return (
    <div className="hairline glass rounded-3xl border p-8 text-center sm:p-10">
      <Icon className={`mx-auto size-8 ${tone}`} />
      <h1 className="mt-6 font-display text-3xl leading-tight text-bone-50">
        {title}
      </h1>
      <p className="mt-2 text-sm text-bone-500">{name}</p>
      <p className="mt-5 text-sm leading-relaxed text-bone-400">{body}</p>
    </div>
  );
}
