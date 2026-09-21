import { useState } from 'react'
import type { ProblemSubmode } from '@/components/ProblemCardView'
import { FormulaQuiz } from '@/pages/FormulaQuiz'
import { Home } from '@/pages/Home'
import { ProblemMode } from '@/pages/ProblemMode'
import { ALL_UNITS, type Unit } from '@/lib/types'

type Screen = { name: 'home' } | { name: 'formula' } | { name: 'problem'; submode: ProblemSubmode }

function App() {
  const [scope, setScope] = useState<Set<Unit>>(new Set(ALL_UNITS.slice(0, 2)))
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  return (
    <div className="min-h-svh bg-background">
      {screen.name === 'home' && (
        <Home
          scope={scope}
          onScopeChange={setScope}
          onStartFormula={() => setScreen({ name: 'formula' })}
          onStartProblem={(submode) => setScreen({ name: 'problem', submode })}
        />
      )}
      {screen.name === 'formula' && <FormulaQuiz scope={scope} onBack={() => setScreen({ name: 'home' })} />}
      {screen.name === 'problem' && (
        <ProblemMode scope={scope} submode={screen.submode} onBack={() => setScreen({ name: 'home' })} />
      )}
    </div>
  )
}

export default App
