import { useState, useEffect } from 'react'
import './App.css'

interface WindowPosition {
  x: number
  y: number
}

interface TerminalWindow {
  id: string
  isOpen: boolean
  position: WindowPosition
  output: string[]
  input: string
}

export default function App() {
  const [terminalWindows, setTerminalWindows] = useState<TerminalWindow[]>([
    {
      id: '1',
      isOpen: false,
      position: { x: 100, y: 100 },
      output: ['Welcome to WebDesktop Terminal v1.0.0', 'Type "help" for available commands.'],
      input: ''
    }
  ])
  const [activeWindow, setActiveWindow] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleTerminalClick = () => {
    setTerminalWindows(prev => 
      prev.map(window => 
        window.id === '1' 
          ? { ...window, isOpen: true }
          : window
      )
    )
  }

  const handleWindowClose = (windowId: string) => {
    setTerminalWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, isOpen: false }
          : window
      )
    )
  }

  const handleMouseDown = (e: React.MouseEvent, windowId: string) => {
    e.preventDefault()
    setActiveWindow(windowId)
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && activeWindow) {
      setTerminalWindows(prev => 
        prev.map(window => 
          window.id === activeWindow
            ? {
                ...window,
                position: {
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y
                }
              }
            : window
        )
      )
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setActiveWindow(null)
  }

  const handleTerminalInput = (windowId: string, value: string) => {
    setTerminalWindows(prev => 
      prev.map(window => 
        window.id === windowId
          ? { ...window, input: value }
          : window
      )
    )
  }

  const handleTerminalSubmit = (windowId: string) => {
    setTerminalWindows(prev => 
      prev.map(window => {
        if (window.id === windowId) {
          const command = window.input.trim()
          let newOutput = [...window.output, `$ ${command}`]
          
          if (command === 'help') {
            newOutput.push('Available commands:')
            newOutput.push('  help - Show this help message')
            newOutput.push('  clear - Clear terminal output')
            newOutput.push('  date - Show current date and time')
            newOutput.push('  echo [text] - Echo the given text')
            newOutput.push('  ls - List files (simulated)')
            newOutput.push('  pwd - Show current directory')
          } else if (command === 'clear') {
            newOutput = ['Terminal cleared.']
          } else if (command === 'date') {
            newOutput.push(new Date().toLocaleString())
          } else if (command.startsWith('echo ')) {
            newOutput.push(command.substring(5))
          } else if (command === 'ls') {
            newOutput.push('Desktop/')
            newOutput.push('Documents/')
            newOutput.push('Downloads/')
            newOutput.push('Pictures/')
          } else if (command === 'pwd') {
            newOutput.push('/home/user')
          } else if (command) {
            newOutput.push(`Command not found: ${command}`)
          }
          
          return { ...window, output: newOutput, input: '' }
        }
        return window
      })
    )
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, activeWindow, dragOffset])

  return (
    <div className="desktop">
      {/* Desktop Background */}
      <div className="desktop-background">
        <div className="desktop-content">
          <h1>WebDesktop</h1>
          <p>Welcome to your modern desktop environment</p>
        </div>
      </div>

      {/* Terminal Windows */}
      {terminalWindows.map(window => (
        window.isOpen && (
          <div
            key={window.id}
            className="terminal-window"
            style={{
              left: window.position.x,
              top: window.position.y,
              zIndex: activeWindow === window.id ? 1000 : 1
            }}
          >
            <div 
              className="window-header"
              onMouseDown={(e) => handleMouseDown(e, window.id)}
            >
              <div className="window-title">Terminal</div>
              <div className="window-controls">
                <button 
                  className="window-close"
                  onClick={() => handleWindowClose(window.id)}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="terminal-content">
              <div className="terminal-output">
                {window.output.map((line, index) => (
                  <div key={index} className="terminal-line">{line}</div>
                ))}
              </div>
              <div className="terminal-input-line">
                <span className="terminal-prompt">$ </span>
                <input
                  type="text"
                  value={window.input}
                  onChange={(e) => handleTerminalInput(window.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTerminalSubmit(window.id)
                    }
                  }}
                  className="terminal-input"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )
      ))}

      {/* Taskbar */}
      <div className="taskbar">
        <div className="taskbar-left">
          <button className="start-menu-btn" title="Start Menu">
            <span className="start-icon">⊞</span>
          </button>
        </div>
        <div className="taskbar-center">
          {/* Taskbar items would go here */}
        </div>
        <div className="taskbar-right">
          <button 
            className="terminal-btn"
            onClick={handleTerminalClick}
            title="Terminal"
          >
            <span className="terminal-icon">⌨</span>
          </button>
        </div>
      </div>
    </div>
  )
}
