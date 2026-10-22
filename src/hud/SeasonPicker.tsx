import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useAppStore, useSeason } from '../store/useAppStore'
import { seasonIds, themes } from '../themes'
import type { SeasonId } from '../types/theme'

/** One-line flavour text under each season in the menu. */
const BLURBS: Record<SeasonId, string> = {
  summer: 'Sunny islands & clear water',
  winter: 'Snow, lights & Christmas trees',
  halloween: 'Pumpkins, bats & ghost ships',
  valentines: 'Hearts, roses & sunset light',
}

/**
 * Custom season dropdown (button + listbox popover), centred at the top of the HUD.
 *
 * Deliberately NOT a native <select>: a focused <select> jumps to the option whose label starts
 * with the typed letter, so sailing with W/A/S/D after picking a season used to switch seasons.
 * This listbox only reacts to its own navigation keys (arrows, Home/End, Enter/Space, Esc, Tab).
 */
export default function SeasonPicker() {
  const season = useSeason()
  const setSeasonPreference = useAppStore((s) => s.setSeasonPreference)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const listId = useId()

  const openMenu = () => {
    setActiveIndex(Math.max(0, seasonIds.indexOf(season)))
    setOpen(true)
  }
  const closeMenu = (refocus = true) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }
  const choose = (id: SeasonId) => {
    setSeasonPreference(id)
    closeMenu()
  }

  // Move focus into the list when it opens; close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return
    list.current?.focus()
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      openMenu()
    }
  }

  const onListKeyDown = (e: KeyboardEvent) => {
    const last = seasonIds.length - 1
    // Swallow every key while the menu is open so nothing (e.g. W/A/S/D) leaks to the game.
    e.stopPropagation()
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i >= last ? 0 : i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i <= 0 ? last : i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(last)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(seasonIds[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        closeMenu()
        break
      case 'Tab':
        closeMenu(false)
        break
    }
  }

  return (
    <div className="season-picker" ref={root}>
      <button
        ref={trigger}
        type="button"
        className={`btn season-trigger season-${season}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Season: ${themes[season].label}. Change season`}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="btn-icon" aria-hidden="true">
          {themes[season].icon}
        </span>
        <span className="btn-label">{themes[season].label}</span>
        <span className={`season-caret ${open ? 'is-open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={list}
          id={listId}
          className="season-menu"
          role="listbox"
          aria-label="Season"
          aria-activedescendant={`${listId}-${seasonIds[activeIndex]}`}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
        >
          {seasonIds.map((id, i) => {
            const selected = id === season
            return (
              <li
                key={id}
                id={`${listId}-${id}`}
                role="option"
                aria-selected={selected}
                className={`season-option season-${id} ${i === activeIndex ? 'is-active' : ''} ${selected ? 'is-selected' : ''}`}
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => choose(id)}
              >
                <span className="season-swatch" aria-hidden="true" />
                <span className="season-option-text">
                  <span className="season-option-label">{themes[id].label}</span>
                  <span className="season-option-blurb">{BLURBS[id]}</span>
                </span>
                <span className="season-check" aria-hidden="true" />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
