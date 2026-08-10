import { Component, StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  AlignJustify, ChevronDown, Download, FileText, HelpCircle, Moon,
  MoreHorizontal, PanelLeft, Plus, Redo2, Settings2, Share2, Sparkles,
  Sun, Undo2, Volume2, X
} from 'lucide-react'
import './styles.css'

const starter = `The morning arrives quietly.\n\nA thin gold light gathers at the edge of the curtains, and somewhere beyond the window a bird begins its first small song.\n\nThere is a particular calm in an unwritten page. It asks for nothing but attention. One word, then another. The soft, familiar rhythm of the keys.`

// Mixkit royalty-free samples keep repeated keystrokes organic without a large bundled sound bank.
const SAMPLES = {
  key: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  space: 'https://assets.mixkit.co/active_storage/sfx/2583/2583-preview.mp3',
  backspace: 'https://assets.mixkit.co/active_storage/sfx/2584/2584-preview.mp3',
  enter: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3',
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Paperbound renderer error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <section className="fatal-error"><div className="fatal-mark">P<span>·</span></div><h1>Paperbound could not open</h1><p>The writing surface encountered an unexpected error.</p><details><summary>Show technical details</summary><pre>{this.state.error?.stack || String(this.state.error)}</pre></details><button onClick={() => window.location.reload()}>Reload paper</button></section>
  }
}

function App() {
  const [text, setText] = useState(() => localStorage.getItem('paperbound-draft') || starter)
  const [title, setTitle] = useState(() => localStorage.getItem('paperbound-title') || 'A quiet beginning')
  const [saved, setSaved] = useState(true)
  const [focus, setFocus] = useState(false)
  const [dark, setDark] = useState(false)
  const [sound, setSound] = useState(() => localStorage.getItem('paperbound-sound') !== 'off')
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('paperbound-volume') || 0.55))
  const [showSettings, setShowSettings] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const editorRef = useRef(null)
  const audioRef = useRef([])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'night' : 'day'
  }, [dark])

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('paperbound-draft', text)
      localStorage.setItem('paperbound-title', title)
      setSaved(true)
    }, 850)
    return () => clearTimeout(timeout)
  }, [text, title])

  useEffect(() => {
    localStorage.setItem('paperbound-sound', sound ? 'on' : 'off')
    localStorage.setItem('paperbound-volume', String(volume))
  }, [sound, volume])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return undefined
    const syncViewport = () => centerActiveLine(editor, 'auto')
    const observer = new ResizeObserver(syncViewport)
    observer.observe(editor)
    syncViewport()
    return () => observer.disconnect()
  }, [])

  function playSample(type) {
    if (!sound) return
    const audio = new Audio(SAMPLES[type])
    audio.volume = Math.min(1, volume * (0.82 + Math.random() * 0.18))
    audio.playbackRate = 0.96 + Math.random() * 0.08
    audio.addEventListener('error', () => console.warn(`Could not load ${type} typewriter sample`), { once: true })
    audio.play().catch(() => {})
    audioRef.current.push(audio)
    audio.addEventListener('ended', () => {
      audioRef.current = audioRef.current.filter(item => item !== audio)
    }, { once: true })
  }

  function handleKeyDown(event) {
    if (event.key === 'Backspace') playSample('backspace')
    else if (event.key === 'Enter') playSample('enter')
    else if (event.key === ' ') playSample('space')
    else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) playSample('key')
  }

  function onChange(event) {
    setText(event.target.value)
    setSaved(false)
    centerActiveLine(event.target)
  }

  function centerActiveLine(target = editorRef.current, behavior = 'smooth') {
    if (!target) return
    const lineNumber = target.value.slice(0, target.selectionStart).split('\n').length - 1
    const lineHeight = parseFloat(window.getComputedStyle(target).lineHeight) || 32
    const centerPadding = Math.max(0, target.clientHeight / 2 - lineHeight / 2)
    target.style.setProperty('--typewriter-padding', `${centerPadding}px`)
    target.scrollTo({ top: Math.max(0, lineNumber * lineHeight), behavior })
  }

  function download(extension, mime) {
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `${title || 'untitled'}.${extension}`; link.click()
    URL.revokeObjectURL(url); setShowExport(false)
  }

  function newPage() {
    if (text.trim() && !window.confirm('Start a new page? Your current draft is saved.')) return
    setText(''); setTitle('Untitled page'); setSaved(false); editorRef.current?.focus()
  }

  return (
    <main className={`app ${focus ? 'is-focused' : ''}`}>
      <aside className="rail">
        <div className="brand-mark">P<span>·</span></div>
        <div className="rail-actions">
          <button className="rail-button active" aria-label="Current document"><FileText size={18} /></button>
          <button className="rail-button" onClick={newPage} aria-label="New document"><Plus size={19} /></button>
        </div>
        <div className="rail-bottom">
          <button className="rail-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <button className="rail-button" onClick={() => setShowSettings(!showSettings)} aria-label="Settings"><Settings2 size={17} /></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="crumb"><span className="book-dot" /> My writing <ChevronDown size={13} /></div>
          <div className="top-actions">
            <span className={`save-state ${saved ? '' : 'saving'}`}><span className="save-dot" /> {saved ? 'Saved locally' : 'Saving…'}</span>
            <button className="icon-button" aria-label="Share"><Share2 size={16} /></button>
            <div className="export-wrap">
              <button className="export-button" onClick={() => setShowExport(!showExport)}><Download size={15} /> Export</button>
              {showExport && <div className="export-menu">
                <button onClick={() => download('txt', 'text/plain')}><FileText size={15}/> Plain text <kbd>.txt</kbd></button>
                <button onClick={() => download('md', 'text/markdown')}><AlignJustify size={15}/> Markdown <kbd>.md</kbd></button>
                <button onClick={() => download('rtf', 'application/rtf')}><FileText size={15}/> Rich text <kbd>.rtf</kbd></button>
              </div>}
            </div>
            <button className="avatar">AM</button>
          </div>
        </header>

        <div className="canvas-shell">
          <div className="paper-wrap">
            <div className="paper">
              <div className="paper-header"><span>Paperbound / 01</span><span>Sunday, August 09</span></div>
              <input className="title-input" value={title} onChange={e => { setTitle(e.target.value); setSaved(false) }} aria-label="Document title" />
              <textarea
                ref={editorRef}
                className="editor"
                value={text}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                onKeyUp={event => centerActiveLine(event.currentTarget)}
                onClick={event => centerActiveLine(event.currentTarget)}
                spellCheck="true"
                aria-label="Typewriter document"
                placeholder="Begin your story..."
              />
              <div className="paper-footer"><span>—</span><span>{String(text.split('\n').length).padStart(2, '0')}</span></div>
            </div>
          </div>
          <div className="focus-hint"><Sparkles size={14} /> The page moves with you</div>
        </div>

        <footer className="statusbar">
          <div className="status-left"><span>{wordCount(text)} words</span><span className="status-divider"/><span>{text.length} characters</span><span className="status-divider"/><span>Page 01 of 01</span></div>
          <div className="status-right"><button onClick={() => setSound(!sound)} className={sound ? '' : 'muted'}><Volume2 size={14} /> {sound ? 'Sound on' : 'Sound off'}</button><span className="status-divider"/><button onClick={() => setShowSettings(!showSettings)}><Settings2 size={14} /> Preferences</button><button className="help"><HelpCircle size={16}/></button></div>
        </footer>
      </section>

      {showSettings && <div className="settings-popover"><div className="popover-heading"><span>Preferences</span><button onClick={() => setShowSettings(false)}><X size={15}/></button></div><label>Typewriter feel<select defaultValue="classic"><option value="classic">Classic Courier</option><option value="soft">Soft impression</option><option value="clean">Clean machine</option></select></label><label className="toggle-row">Sound effects <input type="checkbox" checked={sound} onChange={event => setSound(event.target.checked)} /><span className="toggle" /></label><label className="volume-control">Mechanical volume <span>{Math.round(volume * 100)}%</span><input type="range" min="0" max="1" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))} /></label><label className="toggle-row">Carriage movement <input type="checkbox" /><span className="toggle" /></label><label className="toggle-row">Ink variation <input type="checkbox" defaultChecked /><span className="toggle" /></label><p>Drafts are automatically saved to this device. Sound samples are loaded from Mixkit's royalty-free audio library.</p></div>}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><AppErrorBoundary><App /></AppErrorBoundary></StrictMode>)
