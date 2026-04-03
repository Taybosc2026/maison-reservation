import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SHARED_PASSWORD = import.meta.env.VITE_SHARED_PASSWORD || 'maison2026'

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

const rooms = [
  'Chambre NORD',
  'Chambre SUD',
  'Chambre 1er étage maison principale',
  'Chambre RDC maison principale',
]

const monthNames = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

function parseDate(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd
}

function reservationOnDay(date, room, reservations) {
  return (
    reservations.find((reservation) => {
      if (reservation.room !== room) return false
      const start = parseDate(reservation.start_date)
      const end = parseDate(reservation.end_date)
      return date >= start && date <= end
    }) || null
  )
}

function reservationTouchesMonth(reservation, monthDate) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const start = parseDate(reservation.start_date)
  const end = parseDate(reservation.end_date)
  return overlaps(start, end, monthStart, monthEnd)
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [reservations, setReservations] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    guest_name: '',
    room: rooms[0],
    start_date: '',
    end_date: '',
  })

  const monthDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const daysInMonth = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: lastDay }, (_, i) => new Date(year, month, i + 1))
  }, [monthDate])

  async function loadReservations() {
    if (!supabase) return
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('reservations')
      .select('id, guest_name, room, start_date, end_date, created_at')
      .order('start_date', { ascending: true })

    if (dbError) {
      setError("Impossible de charger les réservations.")
      setLoading(false)
      return
    }

    setReservations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!authenticated || !supabase) return

    loadReservations()

    const channel = supabase
      .channel('reservations-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => loadReservations()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authenticated])

  function handleLogin(event) {
    event.preventDefault()
    if (password === SHARED_PASSWORD) {
      setAuthenticated(true)
      setError('')
      return
    }
    setError('Mot de passe incorrect.')
  }

  async function addReservation(event) {
    event.preventDefault()
    setError('')
    setInfo('')

    if (!form.guest_name || !form.start_date || !form.end_date) {
      setError('Merci de remplir le nom et les dates.')
      return
    }

    const start = parseDate(form.start_date)
    const end = parseDate(form.end_date)

    if (end < start) {
      setError('La date de fin doit être postérieure ou égale à la date de début.')
      return
    }

    const conflict = reservations.some(
      (reservation) =>
        reservation.room === form.room &&
        overlaps(
          start,
          end,
          parseDate(reservation.start_date),
          parseDate(reservation.end_date)
        )
    )

    if (conflict) {
      setError('Cette chambre est déjà réservée sur cette période.')
      return
    }

    if (!supabase) {
      setError("Supabase n'est pas configuré.")
      return
    }

    const { error: insertError } = await supabase.from('reservations').insert([
      {
        guest_name: form.guest_name.trim(),
        room: form.room,
        start_date: form.start_date,
        end_date: form.end_date,
      },
    ])

    if (insertError) {
      setError("Impossible d'enregistrer la réservation.")
      return
    }

    setForm({ guest_name: '', room: rooms[0], start_date: '', end_date: '' })
    setInfo('Réservation enregistrée.')
    setShowForm(false)
    await loadReservations()
  }

  async function deleteReservation(id) {
    if (!supabase) return
    setError('')
    setInfo('')

    const { error: deleteError } = await supabase.from('reservations').delete().eq('id', id)

    if (deleteError) {
      setError('Impossible de supprimer la réservation.')
      return
    }

    setInfo('Réservation supprimée.')
    await loadReservations()
  }

  const currentMonthReservations = reservations.filter((reservation) =>
    reservationTouchesMonth(reservation, monthDate)
  )

  if (!authenticated) {
    return (
      <main className="page center-page">
        <section className="card login-card">
          <h1>Maison de campagne</h1>
          <p className="muted">Réservation privée pour la famille et les amis.</p>

          {!hasSupabase && (
            <p className="notice">
              Le site est prêt, mais il faut encore renseigner les variables Supabase avant la mise en ligne.
            </p>
          )}

          <form onSubmit={handleLogin} className="stack">
            <label>
              Mot de passe commun
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Saisir le mot de passe"
              />
            </label>
            {error && <p className="message error">{error}</p>}
            <button type="submit">Entrer</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Réservations de la maison</h1>
          <p className="muted">4 chambres d'amis, planning partagé et réservation simple.</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setMonthOffset((v) => v - 1)}>
            Mois précédent
          </button>
          <button type="button" className="secondary" onClick={() => setMonthOffset(0)}>
            Aujourd'hui
          </button>
          <button type="button" className="secondary" onClick={() => setMonthOffset((v) => v + 1)}>
            Mois suivant
          </button>
          <button type="button" onClick={() => setShowForm(true)}>
            Nouvelle réservation
          </button>
          <button type="button" className="secondary" onClick={() => setAuthenticated(false)}>
            Quitter
          </button>
        </div>
      </header>

      {info && <p className="message success">{info}</p>}
      {error && <p className="message error">{error}</p>}
      {loading && <p className="muted">Chargement…</p>}

      {showForm && (
        <section className="card form-card">
          <div className="section-head">
            <h2>Nouvelle réservation</h2>
            <button type="button" className="secondary" onClick={() => setShowForm(false)}>
              Fermer
            </button>
          </div>
          <form className="form-grid" onSubmit={addReservation}>
            <label>
              Nom
              <input
                value={form.guest_name}
                onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                placeholder="Ex. Jean"
              />
            </label>
            <label>
              Chambre
              <select
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
              >
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Début
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </label>
            <label>
              Fin
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </label>
            <div className="full-width">
              <button type="submit">Enregistrer la réservation</button>
            </div>
          </form>
        </section>
      )}

      <section className="layout-grid">
        <section className="card planning-card">
          <div className="section-head">
            <h2>
              Planning — {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
            </h2>
            <button type="button" className="secondary" onClick={loadReservations}>
              Actualiser
            </button>
          </div>

          <div className="planning-wrap">
            <div
              className="planning-grid"
              style={{ gridTemplateColumns: `210px repeat(${daysInMonth.length}, minmax(34px, 1fr))` }}
            >
              <div className="sticky-cell room-cell heading">Chambre</div>
              {daysInMonth.map((day) => (
                <div className="day-cell heading" key={formatDate(day)}>
                  {day.getDate()}
                </div>
              ))}

              {rooms.map((room) => (
                <FragmentRow
                  key={room}
                  room={room}
                  daysInMonth={daysInMonth}
                  reservations={reservations}
                />
              ))}
            </div>
          </div>
        </section>

        <aside className="card sidebar-card">
          <h2>Réservations du mois</h2>
          <div className="reservation-list">
            {currentMonthReservations.length === 0 ? (
              <p className="muted">Aucune réservation sur cette période.</p>
            ) : (
              currentMonthReservations.map((reservation) => (
                <article className="reservation-item" key={reservation.id}>
                  <div>
                    <strong>{reservation.guest_name}</strong>
                    <div className="muted small">{reservation.room}</div>
                    <div className="badge">
                      {reservation.start_date} → {reservation.end_date}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => deleteReservation(reservation.id)}
                  >
                    Supprimer
                  </button>
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}

function FragmentRow({ room, daysInMonth, reservations }) {
  return (
    <>
      <div className="sticky-cell room-cell">{room}</div>
      {daysInMonth.map((day) => {
        const reservation = reservationOnDay(day, room, reservations)
        return (
          <div
            key={room + formatDate(day)}
            className={`day-slot ${reservation ? 'occupied' : 'free'}`}
            title={
              reservation
                ? `${reservation.guest_name} — du ${reservation.start_date} au ${reservation.end_date}`
                : 'Libre'
            }
          >
            <span>{reservation ? reservation.guest_name : ''}</span>
          </div>
        )
      })}
    </>
  )
}
