import { portfolio } from '../../data/portfolio'

/** Home Island: a short welcome plus how to play. */
export default function HomeContent() {
  const { personal, sections } = portfolio
  return (
    <div className="sec">
      <p className="sec-name">Hi, I'm {personal.name}!</p>
      <p className="sec-muted">{personal.headline}</p>
      <p className="sec-text">{personal.tagline}</p>

      <h3 className="sec-heading">How to play</h3>
      <ul className="howto">
        <li>
          <span className="howto-keys">
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </span>
          Sail the boat (or use the arrow keys)
        </li>
        <li>
          <span className="howto-keys">
            <kbd>E</kbd>
          </span>
          Dock when you see the glowing ring by a pier
        </li>
        <li>
          <span className="howto-keys">
            <kbd>Esc</kbd>
          </span>
          Close a panel and keep sailing
        </li>
        <li>
          <span className="howto-keys">
            <kbd>[</kbd>
            <kbd>]</kbd>
          </span>
          Rotate the view (or right-drag with the mouse)
        </li>
        <li>
          <span className="howto-keys">
            <kbd>+</kbd>
            <kbd>-</kbd>
          </span>
          Zoom in and out (or scroll)
        </li>
      </ul>

      <h3 className="sec-heading">Islands to visit</h3>
      <ul className="chip-list">
        {sections.map((s) => (
          <li key={s.id} className="chip chip-sun">
            {s.title}
          </li>
        ))}
      </ul>
    </div>
  )
}
