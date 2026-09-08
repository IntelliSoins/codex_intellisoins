import { useEffect, useState } from "react"
import { CalendarDays, Clock } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { CalendarEvent, Reminder } from "../lib/types"
import { Badge, Card, StatusDot } from "../components/ui"

const KIND_LABEL: Record<CalendarEvent["kind"], string> = {
  rdv: "Rendez-vous",
  livraison: "Livraison",
  garde: "Garde",
  formation: "Formation",
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  useEffect(() => {
    bridge.calendar().then(setEvents)
    bridge.reminders().then(setReminders)
  }, [])

  async function toggle(id: string) {
    setReminders(await bridge.toggleReminder(id))
  }

  return (
    <div className="grid cols-2">
      <Card icon={CalendarDays} title="Aujourd'hui">
        <div className="list">
          {events.map((e) => (
            <div className="row" key={e.id}>
              <span className="mono muted" style={{ width: 96, fontSize: 12 }}>
                {e.start}–{e.end}
              </span>
              <div className="grow">
                <div className="title">{e.title}</div>
              </div>
              <Badge tone={e.kind === "garde" ? "warn" : "neutral"}>{KIND_LABEL[e.kind]}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card icon={Clock} title="Rappels & échéances">
        <div className="list">
          {reminders.map((r) => (
            <label className="row" key={r.id} style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={r.done}
                onChange={() => toggle(r.id)}
                style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
              />
              <StatusDot tone={r.priority === "haute" ? "err" : r.priority === "normale" ? "warn" : "neutral"} />
              <div className="grow">
                <div className="title" style={{ textDecoration: r.done ? "line-through" : "none", color: r.done ? "var(--faint)" : "var(--text)" }}>
                  {r.title}
                </div>
                <div className="meta">{r.due}</div>
              </div>
              <Badge tone="neutral">{r.category}</Badge>
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}
