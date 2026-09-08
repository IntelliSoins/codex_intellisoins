import { useRef, useState } from "react"
import { Bot, Send, ShieldAlert, User } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { AgentMessage } from "../lib/types"
import { useSession } from "../state/session"

const SUGGESTIONS = [
  "Vérifier les interactions d'une ordonnance",
  "Résumer les nouveautés ANSM de la semaine",
  "Préparer un entretien pharmaceutique asthme",
  "Contrôler le stock sous le seuil d'alerte",
]

export function AssistantView() {
  const { backends, activeBackendId } = useSession()
  const activeBackend = backends.find((b) => b.id === activeBackendId)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setBusy(true)
    try {
      const reply = await bridge.sendMessage(activeBackendId, next, content)
      setMessages((m) => [...m, reply])
    } finally {
      setBusy(false)
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }))
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="chat">
      {activeBackend?.externe && (
        <div className="banner warn" style={{ marginBottom: 16 }}>
          <ShieldAlert size={16} />
          Backend externe actif ({activeBackend.label}). Les données patients sont pseudonymisées avant tout envoi.
        </div>
      )}

      <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", maxWidth: 460 }}>
            <span className="brand-mark" style={{ width: 48, height: 48, margin: "0 auto 16px" }}>
              <Bot size={24} />
            </span>
            <h2 style={{ margin: "0 0 6px" }}>Assistant du workflow officinal</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              Interroge la base locale, les serveurs MCP et les backends de calcul pour t'assister au comptoir.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="btn ghost" style={{ justifyContent: "flex-start" }} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role === "user" ? "user" : "assistant"}`}>
            <div className="who">
              {m.role === "user" ? <User size={12} /> : <Bot size={12} />}
              {m.role === "user" ? "Vous" : "Assistant"}
            </div>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="bubble assistant">
            <div className="who">
              <Bot size={12} /> Assistant
            </div>
            <span className="muted">Analyse en cours…</span>
          </div>
        )}
      </div>

      <div className="composer">
        <textarea
          placeholder="Posez une question sur une ordonnance, un stock, une interaction…  (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn primary" onClick={() => send(input)} disabled={busy || !input.trim()}>
          <Send size={16} />
          Envoyer
        </button>
      </div>
    </div>
  )
}
