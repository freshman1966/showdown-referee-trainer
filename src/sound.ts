// Optional referee whistle, synthesised with Web Audio (spec 5: off by default, never the only signal).
let ctx: AudioContext | null = null

function context(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function blast(ac: AudioContext, start: number, duration: number): void {
  const osc = ac.createOscillator()
  const trill = ac.createOscillator()
  const trillDepth = ac.createGain()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = 2900
  trill.frequency.value = 28
  trillDepth.gain.value = 120
  trill.connect(trillDepth).connect(osc.frequency)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(0.15, start + 0.02)
  gain.gain.setValueAtTime(0.15, start + duration - 0.04)
  gain.gain.linearRampToValueAtTime(0, start + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  trill.start(start)
  osc.stop(start + duration)
  trill.stop(start + duration)
}

/** One whistle on submit; a double whistle for a correct answer. */
export function whistle(kind: 'single' | 'double'): void {
  const ac = context()
  if (!ac) return
  const t = ac.currentTime + 0.01
  blast(ac, t, 0.28)
  if (kind === 'double') blast(ac, t + 0.4, 0.28)
}
