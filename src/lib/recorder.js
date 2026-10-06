// Records the mic as 16 kHz mono WAV in the browser.
// WAV (not MediaRecorder's audio/mp4 on iPhone) because it's a format Gemini
// documents support for, and it works the same in Chrome and Safari on iOS.

const TARGET_RATE = 16000
const MAX_SECONDS = 90

export class MicUnavailableError extends Error {}

export function micSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext))
}

export function createRecorder({ onAutoStop } = {}) {
  let ctx, stream, source, processor, chunks, timer

  async function start() {
    if (!micSupported()) throw new MicUnavailableError('This browser can’t use the microphone.')
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
    } catch (err) {
      throw new MicUnavailableError(
        err?.name === 'NotAllowedError' ? 'Microphone access was blocked.' : 'Couldn’t start the microphone.',
      )
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    ctx = new Ctx()
    await ctx.resume()
    source = ctx.createMediaStreamSource(stream)
    // ScriptProcessor is old but still the most widely supported way to read raw samples on iOS.
    processor = ctx.createScriptProcessor(4096, 1, 1)
    chunks = []
    processor.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
    source.connect(processor)
    processor.connect(ctx.destination)
    timer = setTimeout(() => onAutoStop?.(), MAX_SECONDS * 1000)
  }

  async function stop() {
    clearTimeout(timer)
    processor?.disconnect()
    source?.disconnect()
    stream?.getTracks().forEach((t) => t.stop())
    const rate = ctx?.sampleRate ?? TARGET_RATE
    await ctx?.close().catch(() => {})
    const samples = downsample(merge(chunks ?? []), rate, TARGET_RATE)
    const seconds = samples.length / TARGET_RATE
    return { mimeType: 'audio/wav', data: await toBase64(encodeWav(samples, TARGET_RATE)), seconds }
  }

  return { start, stop }
}

function merge(chunks) {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0))
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

function downsample(samples, from, to) {
  if (from === to) return samples
  const ratio = from / to
  const out = new Float32Array(Math.floor(samples.length / ratio))
  for (let i = 0; i < out.length; i++) {
    // Average the source samples that fall into this output sample.
    const start = Math.floor(i * ratio)
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length)
    let sum = 0
    for (let j = start; j < end; j++) sum += samples[j]
    out[i] = sum / Math.max(1, end - start)
  }
  return out
}

function encodeWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const v = new DataView(buf)
  const text = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)))
  text(0, 'RIFF')
  v.setUint32(4, 36 + samples.length * 2, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  v.setUint32(16, 16, true) // PCM chunk size
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // mono
  v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true) // byte rate
  v.setUint16(32, 2, true) // block align
  v.setUint16(34, 16, true) // bits per sample
  text(36, 'data')
  v.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([buf], { type: 'audio/wav' })
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}
