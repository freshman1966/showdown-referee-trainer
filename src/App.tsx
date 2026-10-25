import ui from '../content/i18n/ui.en.json'

// Placeholder shell until the v1 screens are built.
export function App() {
  return (
    <>
      {__PREVIEW__ && <p role="status">{ui.app.previewBanner}</p>}
      <main>
        <h1>{ui.app.name}</h1>
        <p>{ui.app.subtitle}</p>
      </main>
    </>
  )
}
