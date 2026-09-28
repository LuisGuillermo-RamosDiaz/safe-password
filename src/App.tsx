import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Copy, Shuffle, X } from 'lucide-react';
import { checkCriteria, CRITERIA } from './lib/criteria';
import { suggestFromPhrase, type Suggestion } from './lib/suggestions';

const MANUAL = 'https://s3.amazonaws.com/kajabi-storefronts-production/file-uploads/sites/172905/downloads/37e602c-1f5-d2-b6c-5644ef50d5e_Manual_Contrase_as_Seguras_-_Hacker_Mentor.pdf';

export default function App() {
  const [activeTool, setActiveTool] = useState<'generate' | 'check'>('generate');
  const [phrase, setPhrase] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [phraseError, setPhraseError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const phraseInput = useRef<HTMLInputElement>(null);
  const checkInput = useRef<HTMLInputElement>(null);
  const focusCheckedOption = useRef(false);

  const criteria = checkCriteria(password);
  const passed = Object.values(criteria).filter(Boolean).length;
  const progressState = !password ? 'Sin evaluar' : passed <= 2 ? 'Baja' : passed <= 4 || !criteria.patterns ? 'Media' : 'Alta';
  useEffect(() => {
    if (activeTool === 'check' && focusCheckedOption.current) {
      checkInput.current?.focus();
      focusCheckedOption.current = false;
    }
  }, [activeTool]);
  useEffect(() => {
    if (copiedIndex === null && !copyMessage) return;
    const timer = window.setTimeout(() => {
      setCopiedIndex(null);
      setCopyMessage('');
      setCopyFailed(false);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [copiedIndex, copyMessage]);

  function updatePassword(value: string) {
    setPassword(value);
    if (!value) setShowPassword(false);
  }

  function generate() {
    try {
      setSuggestions(suggestFromPhrase(phrase));
      setPhraseError('');
      setCopiedIndex(null);
      setCopyMessage('');
    } catch (error) {
      setSuggestions([]);
      setPhraseError(error instanceof Error ? error.message : 'No se pudieron crear las opciones.');
      phraseInput.current?.focus();
    }
  }

  async function copy(value: string, index: number) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      setCopyMessage('Contraseña copiada.');
      setCopyFailed(false);
    } catch {
      setCopiedIndex(null);
      setCopyMessage('No se pudo copiar. Selecciona la contraseña y cópiala manualmente.');
      setCopyFailed(true);
    }
  }

  function inspect(value: string) {
    updatePassword(value);
    setShowPassword(false);
    focusCheckedOption.current = true;
    setActiveTool('check');
  }

  return <div className="page">
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <header className="page-header">
      <h1>Contraseña segura</h1>
    </header>

    <div className={`app ${activeTool === 'check' && passed === 6 ? 'complete' : ''}`}>
    <main id="contenido">
      <div className={`tool-switch ${activeTool}`} role="group" aria-label="Elegir herramienta">
        <button type="button" aria-pressed={activeTool === 'generate'} onClick={() => setActiveTool('generate')}>Generar</button>
        <button type="button" aria-pressed={activeTool === 'check'} onClick={() => setActiveTool('check')}>Comprobar</button>
      </div>
      {activeTool === 'generate' ? <section className="generator-section" aria-labelledby="generate-title">
        <h2 id="generate-title">Crea tres opciones con leetspeak</h2>
        <form onSubmit={event => { event.preventDefault(); generate(); }}>
          <label htmlFor="phrase">Escribe una palabra o frase</label>
          <div className="generate-row">
            <input id="phrase" ref={phraseInput} type="text" value={phrase} autoComplete="off" spellCheck={false} aria-describedby={phraseError ? 'phrase-help phrase-error' : 'phrase-help'} aria-invalid={Boolean(phraseError)} onChange={event => { setPhrase(event.target.value); setSuggestions([]); setPhraseError(''); setCopyMessage(''); }}/>
            <button type="submit" className="primary-button"><Shuffle size={18} aria-hidden="true"/>Generar</button>
          </div>
          <p id="phrase-help" className="field-help">Una frase poco común da mejores opciones.</p>
          {phraseError && <p id="phrase-error" className="field-error" role="alert">{phraseError}</p>}
        </form>

        {suggestions.length > 0 && <div className="results" aria-label="Tres contraseñas sugeridas">
          <h3>Tres niveles de complejidad</h3>
          <div className="result-list">{suggestions.map((suggestion, index) => <div className="result-row" key={suggestion.value} data-testid="suggestion" style={{ animationDelay: `${index * 55}ms` }}>
            <span className="result-meta"><strong>{suggestion.label}</strong></span>
            <span className="result-value" title={suggestion.value}>{suggestion.value}</span>
            <div className="result-actions">
              <button type="button" onClick={() => inspect(suggestion.value)} aria-label={`Comprobar opción ${index + 1}`}>Comprobar</button>
              <button type="button" onClick={() => copy(suggestion.value, index)} aria-label={`Copiar opción ${index + 1}`}><Copy size={16} aria-hidden="true"/>{copiedIndex === index ? 'Copiada' : 'Copiar'}</button>
            </div>
          </div>)}</div>
          <p className={copyFailed ? 'copy-feedback error' : 'copy-feedback'} role="status">{copyMessage}</p>
        </div>}
      </section> : <section className="checker-section" aria-labelledby="check-title">

        <h2 id="check-title">Comprueba una contraseña</h2>
        <label htmlFor="password">Escribe tu contraseña</label>
        <div className="password-row">
          <input id="password" ref={checkInput} type={showPassword ? 'text' : 'password'} value={password} autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={event => updatePassword(event.target.value)}/>
          {password && <button type="button" className="visibility-button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>}
        </div>
        <div className="progress-summary" data-level={progressState.toLowerCase().replace(' ', '-')} aria-live="polite"><span>{progressState}</span><strong>{passed} de 6</strong></div>
        <div className="progress-track" data-level={progressState.toLowerCase().replace(' ', '-')} role="progressbar" aria-label="Criterios cumplidos" aria-valuenow={passed} aria-valuemin={0} aria-valuemax={6} aria-valuetext={`${progressState}. ${passed} de 6 criterios`}>
          {CRITERIA.map((item, index) => <span key={item.id} className={index < passed ? 'filled' : ''}/>)}</div>
        {passed === 6 && <div className="completion" role="status"><CheckCircle2 size={22} aria-hidden="true"/>Cumple los 6 criterios</div>}
        <ul className="criteria-list">
          {CRITERIA.map(item => <li key={item.id} data-testid={`criterion-${item.id}`} data-state={criteria[item.id] ? 'pass' : 'fail'}><span className="criterion-icon" aria-hidden="true">{criteria[item.id] ? <Check size={17}/> : <X size={15}/>}</span><div className="criterion-label">{item.label}{item.id === 'patterns' && <details className="criterion-help"><summary aria-label="Cómo se revisan los patrones">?</summary><p>Detecta ejemplos como password, 1234, qwerty y cuatro caracteres repetidos.</p></details>}</div><span className="criterion-state">{criteria[item.id] ? 'Cumple' : 'Falta'}</span></li>)}
        </ul>
      </section>}
    </main>
    </div>
    <footer className="page-footer"><a href={MANUAL} target="_blank" rel="noreferrer">Manual ↗</a></footer>
  </div>;
}
