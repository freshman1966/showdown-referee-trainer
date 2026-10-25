import { render } from 'preact'
import '@fontsource/atkinson-hyperlegible-next/400.css'
import '@fontsource/atkinson-hyperlegible-next/700.css'
import '@fontsource/atkinson-hyperlegible-next/800.css'
import '@fontsource/atkinson-hyperlegible-mono/500.css'
import './styles.css'
import { App } from './App'
import { createStore } from './state/storage'

render(<App store={createStore()} />, document.getElementById('app')!)
