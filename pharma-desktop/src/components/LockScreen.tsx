import { useState } from "react"
import { Cross, Fingerprint, ShieldCheck } from "lucide-react"
import { useSession } from "../state/session"

export function LockScreen() {
  const { user, unlock } = useSession()
  const [passphrase, setPassphrase] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await unlock(passphrase)
    } finally {
      setBusy(false)
      setPassphrase("")
    }
  }

  return (
    <div className="lock">
      <form className="lock-card" onSubmit={submit}>
        <span className="brand-mark">
          <Cross size={26} strokeWidth={2.5} />
        </span>
        <h1>PharmaCore</h1>
        <p>
          Coffre local chiffré verrouillé.
          <br />
          {user?.officine} — {user?.displayName}
        </p>

        <div className="input-wrap" style={{ marginBottom: 14 }}>
          <Fingerprint size={16} />
          <input
            className="input"
            type="password"
            autoFocus
            placeholder="Phrase secrète du coffre"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
        </div>

        <button className="btn primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy}>
          <ShieldCheck size={16} />
          {busy ? "Déverrouillage…" : "Déverrouiller le poste"}
        </button>

        <p style={{ marginTop: 18, marginBottom: 0, fontSize: 12 }}>
          Les données patients ne quittent jamais le poste sans pseudonymisation.
        </p>
      </form>
    </div>
  )
}
