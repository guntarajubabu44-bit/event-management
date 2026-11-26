import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const defaultContent = { heroKicker: 'YOUR NEXT GREAT EVENT STARTS HERE', heroTitle: 'Plan. Book. Celebrate.', heroSubtitle: 'Discover and book unforgettable events across India. Find your city, choose your moment, and make plans worth looking forward to.', announcement: '' }

function HomePage() {
  const [content, setContent] = useState(defaultContent)
  useEffect(() => {
    let active = true
    api.get('/public/site-content').then((response) => { if (active) setContent((current) => ({ ...current, ...response.data.data })) }).catch(() => {})
    return () => { active = false }
  }, [])
  return (
    <main className="landing-page">
      <nav className="landing-nav"><Link className="landing-brand" to="/">tickety<span>.</span></Link><div><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/login">Sign in</Link><Link className="button" to="/register">Start planning <span aria-hidden="true">→</span></Link></div></nav>
      {content.announcement && <div className="site-announcement" role="status">{content.announcement}</div>}<section className="landing-hero"><div className="landing-copy"><span className="landing-kicker"><i /> {content.heroKicker}</span><h1>{content.heroTitle}</h1><p>{content.heroSubtitle}</p><div className="landing-actions"><Link className="button" to="/explore">Explore events <span aria-hidden="true">→</span></Link><Link className="landing-secondary" to="/explore">Book an event</Link></div><div className="landing-proof"><div className="landing-avatars"><i>J</i><i>M</i><i>A</i><i>+</i></div><span>Find your next favourite experience across India</span></div></div>
        <div className="landing-art" aria-label="A preview of the event management dashboard"><div className="landing-orbit orbit-one"/><div className="landing-orbit orbit-two"/><div className="landing-spark spark-one">✳</div><div className="landing-spark spark-two">✦</div><article className="landing-ticket"><div className="ticket-top"><span>✳ &nbsp; TICKETY PRESENTS</span><span>NO. 024</span></div><div className="ticket-art"><div className="ticket-sun"/><div className="ticket-hill hill-back"/><div className="ticket-hill hill-front"/><span className="ticket-star">✦</span></div><div className="ticket-info"><div><span>AN EVENING TO REMEMBER</span><h2>Summer<br />Sessions</h2></div><div className="ticket-date"><strong>18</strong><span>JUN<br />2026</span></div></div><div className="ticket-footer"><span>↗ &nbsp; THE GARDEN ROOM</span><span>YOUR STORY, IN PERSON.</span></div></article><div className="landing-float float-guests"><span className="float-icon">♧</span><div><strong>Good things grow</strong><small>When people meet</small></div><span className="float-check">✓</span></div><div className="landing-float float-live"><i/> YOUR NEXT CHAPTER</div></div>
      </section><section className="landing-bottom"><span>LESS SPREADSHEETS, MORE SPARK</span><span>Everything you need to make it happen.</span><span>YOUR PEOPLE. YOUR MOMENT. YOUR EVENT.</span></section>
    </main>
  )
}

export default HomePage
