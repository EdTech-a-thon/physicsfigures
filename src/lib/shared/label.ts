// Labels on figures (m₁, F_N, 30°, θ), typed in Caret's math field (see
// docs/adr/0003-caret-for-labels.md). A label's text is kept the way it is
// written in a page address, for people to read: "m_1", "F_N", "30deg",
// "theta", "mu_k". A subscript is _x or _{0x}, a superscript ^2 or ^{-1}.

import { charTokenType, createDocToken, defineSchema, getStrandById, traverseStrands } from '@caret-js/core'
import type { Doc, DocStrand, EditorCommand } from '@caret-js/core'
import { mathCommands, subSupTokenType } from '@caret-js/math'

export type LabelMode = 'text' | 'blank' | 'none'

/** A label as the teacher set it. `text` is kept while the label is blank or
 *  off, so switching back to Text brings it back. */
export interface Label {
  mode: LabelMode
  text: string
}

/** Written the same way in a page address and as you type: "theta" becomes θ. */
const SYMBOLS: [string, string][] = [
  ['alpha', 'α'],
  ['beta', 'β'],
  ['gamma', 'γ'],
  ['Delta', 'Δ'],
  ['delta', 'δ'],
  ['epsilon', 'ε'],
  ['theta', 'θ'],
  ['lambda', 'λ'],
  ['mu', 'μ'],
  ['pi', 'π'],
  ['rho', 'ρ'],
  ['sigma', 'σ'],
  ['tau', 'τ'],
  ['phi', 'φ'],
  ['omega', 'ω'],
  ['Omega', 'Ω'],
  ['deg', '°'],
]
const NAME_OF = new Map(SYMBOLS.map(([name, char]) => [char, name]))

export const typingRules = SYMBOLS.map(([match, char]) => ({ match, char }))

/** Caret's field drops typed spaces (spacing is its renderer's job), so inside
 *  the field a space is this blank Braille character, which it keeps. */
export const FIELD_SPACE = String.fromCodePoint(0x2800)

/** Text typed key by key, with symbol names turned into symbols: "30deg" → "30°". */
export function typeLabel(text: string): string {
  let out = ''
  for (const char of text) {
    out += char
    const rule = typingRules.find((r) => out.endsWith(r.match))
    if (rule) out = out.slice(0, -rule.match.length) + rule.char
  }
  return out
}

// A label read into parts: plain characters, and subscripts or superscripts.
type Part = { char: string } | { sub: Part[] | null; sup: Part[] | null }

function parse(text: string): Part[] {
  const chars = [...text]
  let i = 0
  const readStrand = (close: string | null): Part[] => {
    const parts: Part[] = []
    let typed = '' // this strand's plain characters so far, for the typing rules
    while (i < chars.length) {
      const char = chars[i++]
      if (char === close) break
      if (char === '_' || char === '^') {
        const box = chars[i] === '{' ? (i++, readStrand('}')) : i < chars.length ? [{ char: chars[i++] }] : []
        const last = parts.at(-1)
        const key = char === '_' ? 'sub' : 'sup'
        if (last && 'sub' in last && last[key] === null) last[key] = box
        else parts.push({ sub: key === 'sub' ? box : null, sup: key === 'sup' ? box : null })
        typed = ''
        continue
      }
      parts.push({ char: char === FIELD_SPACE ? ' ' : char })
      typed += char
      const rule = typingRules.find((r) => typed.endsWith(r.match))
      if (rule) {
        parts.splice(parts.length - [...rule.match].length, [...rule.match].length, { char: rule.char })
        typed = typed.slice(0, -rule.match.length) + rule.char
      }
    }
    return parts
  }
  return readStrand(null)
}

export const schema = defineSchema({ tokenTypes: new Set([charTokenType, subSupTokenType]) })
type LabelDoc = Doc<typeof schema>

/** A label's text as a Caret doc, for the math field. */
export function labelFromText(text: string): LabelDoc {
  let counter = 0
  const nextId = () => `text/${counter++}` as const
  const toTokens = (parts: Part[]): any[] =>
    parts.map((part) => {
      if ('char' in part) return createDocToken(nextId(), charTokenType, { char: part.char === ' ' ? FIELD_SPACE : part.char })
      const token = createDocToken(nextId(), subSupTokenType, { hasSubscript: part.sub !== null, hasSuperscript: part.sup !== null })
      if (part.sub) token.children.set('subscript', { id: [token.id, 'subscript'], tokens: toTokens(part.sub) })
      if (part.sup) token.children.set('superscript', { id: [token.id, 'superscript'], tokens: toTokens(part.sup) })
      return token
    })
  return { root: { id: '[ROOT]', tokens: toTokens(parse(String(text ?? ''))) }, selection: null } as LabelDoc
}

function strandText(strand: DocStrand<any> | undefined): string {
  let text = ''
  for (const token of (strand?.tokens ?? []) as any[]) {
    if (token.type === charTokenType.type) {
      const char: string = token.props.char
      text += char === FIELD_SPACE ? ' ' : (NAME_OF.get(char) ?? char)
    } else if (token.type === subSupTokenType.type) {
      const box = (name: string) => {
        const inner = strandText(token.children.get(name))
        return [...inner].length === 1 ? inner : `{${inner}}`
      }
      if (token.props.hasSubscript) text += `_${box('subscript')}`
      if (token.props.hasSuperscript) text += `^${box('superscript')}`
    }
  }
  return text
}

/** A Caret doc as a label's text: "m_1", "30deg". */
export const labelToText = (doc: Doc<any>): string => strandText(doc.root)

export interface Run {
  text: string
  shift: 'sub' | 'super' | null
}

/** A label as runs of text to draw, each on the baseline, lowered or raised. */
export function labelRuns(text: string): Run[] {
  const runs: Run[] = []
  const add = (t: string, shift: Run['shift']) => {
    const last = runs.at(-1)
    if (last && last.shift === shift) last.text += t
    else if (t) runs.push({ text: t, shift })
  }
  const walk = (parts: Part[], shift: Run['shift']) => {
    for (const part of parts) {
      if ('char' in part) add(part.char, shift)
      else {
        if (part.sub) walk(part.sub, shift ?? 'sub')
        if (part.sup) walk(part.sup, shift ?? 'super')
      }
    }
  }
  walk(parse(text), null)
  return runs
}

/** Unit words set upright even though they're short. */
const UNITS = new Set(['kg', 'cm', 'mm', 'km', 'ms', 'Hz', 'kJ', 'kW', 'kN', 'eV', 'mA', 'mV', 'kV', 'Pa', 'Wb', 'mol', 'rad', 'kPa'])

/**
 * A run of label text split into pieces to set in italics or upright, the way
 * physics sets quantities in italics (m, v, F, θ, mg) and words and units
 * upright (kg, cm, "block").
 */
export function italicPieces(text: string): { text: string; italic: boolean }[] {
  return (text.match(/\p{L}+|[^\p{L}]+/gu) ?? []).map((t) => ({
    text: t,
    italic: /^\p{L}{1,2}$/u.test(t) && !UNITS.has(t),
  }))
}

/** A label in a page address: its text, "~" for a blank line, empty for none,
 *  and "~_" for Text with nothing typed yet. */
export function encodeLabel(label: Label): string {
  if (label.mode === 'none') return ''
  if (label.mode === 'blank') return '~'
  if (label.text === '') return EMPTY_TEXT
  return label.text.startsWith('~') ? `~${label.text}` : label.text
}

const EMPTY_TEXT = '~_'

export function decodeLabel(raw: string | null | undefined, fallback: Label): Label {
  if (raw === null || raw === undefined) return { ...fallback }
  if (raw === '') return { mode: 'none', text: fallback.text }
  if (raw === '~') return { mode: 'blank', text: fallback.text }
  if (raw === EMPTY_TEXT) return { mode: 'text', text: '' }
  return { mode: 'text', text: raw.startsWith('~~') ? raw.slice(1) : raw }
}

/** Tidy a stored or linked label into a usable one. */
export function cleanLabel(value: unknown, fallback: Label): Label {
  const v = value as Partial<Label> | null
  const mode = v?.mode === 'text' || v?.mode === 'blank' || v?.mode === 'none' ? v.mode : fallback.mode
  return { mode, text: typeof v?.text === 'string' ? v.text : fallback.text }
}

// Editing commands for the field.

/** The strand holding the box the cursor is in, and where its token sits. */
function owner(editor: Parameters<EditorCommand<any>>[0]) {
  const s = editor.selection
  if (!s || !Array.isArray(s.strandId)) return null
  const [tokenId] = s.strandId
  for (const strand of traverseStrands(editor.doc.root)) {
    const index = strand.tokens.findIndex((t) => t.id === tokenId)
    if (index >= 0) return { strand, index }
  }
  return null
}

/** "_" makes a subscript after the cursor and puts the cursor in it: F_N is F with N below. */
const subscriptCommand: EditorCommand<any> = (editor) => {
  const s = editor.selection
  if (!s) return false
  const at = Math.min(s.anchorIndex, s.headIndex)
  editor.insert([{ type: subSupTokenType.type, props: { hasSubscript: true, hasSuperscript: false }, children: new Map([['subscript', []]]) }])
  const strand = getStrandById(editor.doc, s.strandId)
  if (strand) editor.select({ strandId: [strand.tokens[at].id, 'subscript'], tokenIndex: 0 })
  return true
}

/** A space typed at the end of a subscript or superscript steps out of it and
 *  is then typed there, so "F_N = 3" reads the way it's typed. */
const spaceCommand: EditorCommand<any> = (editor) => {
  const head = editor.head
  if (!head || editor.hasRange || head.index === 0 || head.index !== head.strand.tokens.length) return false
  const o = owner(editor)
  if (!o) return false
  editor.select({ strandId: o.strand.id, tokenIndex: o.index + 1 })
  return false
}

export const commands: Record<string, EditorCommand<any>> = {
  '^': mathCommands['^'],
  _: subscriptCommand,
  [FIELD_SPACE]: spaceCommand,
}
