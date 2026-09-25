<script lang="ts">
  // The Free Body Diagram Generator: the body and its forces on the left, the
  // figure on the right. Settings live in the page address.
  import { Box, Gauge, MoveUpRight, Plus, Trash2 } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import GeneratorLayout from '$lib/shared/GeneratorLayout.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import { sameDirection } from './fbd'
  import FreeBody from './FreeBody.svelte'
  import { componentLabel, fbdSettings, MAX_FORCES, onAxis, STARTERS, starterForce, type Force } from './settings'

  const gen = createGenerator(fbdSettings, 'free-body-diagram')
  const s = $derived(gen.clean)

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const bodySummary = $derived(s.body === 'dot' ? 'dot' : `${s.body} · ${Math.round(s.bodySize * 100)}% size`)
  const forcesSummary = $derived(s.forces.map((f) => shown(f.label)).join(', ') || 'none')

  const MOTION = [
    { key: 'velocity', angle: 'velocityAngle', label: 'velocityLabel', name: 'Velocity' },
    { key: 'acceleration', angle: 'accelerationAngle', label: 'accelerationLabel', name: 'Acceleration' },
  ] as const
  const motionSummary = $derived(
    MOTION.filter((m) => s[m.key])
      .map((m) => `${m.name.toLowerCase()} ${s[m.angle]}°`)
      .join(', ') || 'none',
  )

  /** The quick picks for a direction. */
  const DIRECTIONS = [
    [90, 'Up'],
    [270, 'Down'],
    [180, 'Left'],
    [0, 'Right'],
  ] as const
  const full = $derived(s.forces.length >= MAX_FORCES)
  const names = (g: number[]) => g.slice(0, -1).map((i) => i + 1).join(', ') + ` and ${g.at(-1)! + 1}`
  const hidden = $derived(sameDirection(s.forces).map((g) => `Forces ${names(g)} point the same way, so one arrow hides the other.`))
  const add = (starter: (typeof STARTERS)[number]) => {
    if (!full) gen.settings.forces.push(starterForce(starter))
  }
  const remove = (i: number) => gen.settings.forces.splice(i, 1)
  // Turning components on names them after the force (T → T_x), unless the teacher already named them.
  function nameComponents(force: Force) {
    if (force.label.mode !== 'text') return
    for (const [axis, key] of [['x', 'xLabel'], ['y', 'yLabel']] as const) {
      const l = force[key]
      if (l.mode === 'text' && l.text === `F_${axis}`) l.text = componentLabel(force.label.text, axis)
    }
  }
</script>

<!-- Which way a force or motion points: a slider and a box in degrees, with quick picks. -->
{#snippet directionField(target: Record<string, any>, key: string, name: string)}
  <div class="field">
    Direction
    <span class="slider">
      <input type="range" min="0" max="359" bind:value={target[key]} aria-label="{name} direction" />
      <span class="degrees"><input type="number" min="0" max="359" bind:value={target[key]} aria-label="{name} angle in degrees" />°</span>
    </span>
    <div class="segmented" role="group" aria-label="{name} quick directions">
      {#each DIRECTIONS as [angle, label]}
        <button type="button" class:on={target[key] === angle} aria-pressed={target[key] === angle} onclick={() => (target[key] = angle)}>{label}</button>
      {/each}
    </div>
  </div>
{/snippet}

<GeneratorLayout title="Free Body Diagram Generator" {gen} filename="free-body-diagram">
  {#snippet controls()}
    <Section title="Body" icon={Box} summary={bodySummary}>
      <div class="field">
        <Choice name="Body" options={[['dot', 'Dot'], ['block', 'Block'], ['ball', 'Ball'], ['cart', 'Cart']]} bind:value={gen.settings.body} />
      </div>
      {#if s.body !== 'dot'}
        <label class="field">
          Size
          <span class="slider">
            <input type="range" min="0.5" max="2" step="0.05" bind:value={gen.settings.bodySize} />
            <output>{Math.round(s.bodySize * 100)}%</output>
          </span>
        </label>
      {/if}
    </Section>

    <Section title="Forces" icon={MoveUpRight} summary={forcesSummary}>
      {#each gen.settings.forces as force, i (force)}
        <div class="force">
          <div class="force-head">
            <span>Force {i + 1}</span>
            <button type="button" class="icon-btn" aria-label="Remove force {i + 1}" data-tip="Remove" onclick={() => remove(i)}>
              <Trash2 size={17} />
            </button>
          </div>
          {@render directionField(force, 'angle', `Force ${i + 1}`)}
          <label class="field">
            Length
            <span class="slider">
              <input type="range" min="0.25" max="2" step="0.05" bind:value={force.length} />
              <output>{s.forces[i]?.length.toFixed(2)}×</output>
            </span>
          </label>
          <div class="field">Label <LabelField name="Force {i + 1} label" bind:label={force.label} /></div>
          {#if !onAxis(s.forces[i]?.angle ?? 0)}
            <label class="check"><input type="checkbox" bind:checked={force.arc} /> Mark its angle</label>
            {#if force.arc}
              <div class="field">
                Measured from
                <Choice name="Force {i + 1} angle measured from" options={[['h', 'Horizontal'], ['v', 'Vertical']]} bind:value={force.from} />
              </div>
              <div class="field">Angle label <LabelField name="Force {i + 1} angle label" bind:label={force.arcLabel} /></div>
            {/if}
            <label class="check"><input type="checkbox" bind:checked={force.parts} onchange={(e) => e.currentTarget.checked && nameComponents(force)} /> Show its components</label>
            {#if force.parts}
              <div class="field">Horizontal label <LabelField name="Force {i + 1} horizontal component label" bind:label={force.xLabel} /></div>
              <div class="field">Vertical label <LabelField name="Force {i + 1} vertical component label" bind:label={force.yLabel} /></div>
            {/if}
          {/if}
        </div>
      {/each}

      {#each hidden as warning}<p class="note warning" role="status">{warning}</p>{/each}

      <div class="field add">
        {full ? `A figure holds up to ${MAX_FORCES} forces.` : 'Add a force'}
        <div class="starters">
          {#each STARTERS as starter}
            <button type="button" class="btn-ghost" disabled={full} onclick={() => add(starter)}><Plus size={15} aria-hidden="true" /> {starter.name}</button>
          {/each}
        </div>
      </div>
    </Section>

    <Section title="Motion" icon={Gauge} summary={motionSummary}>
      <p class="note">Drawn beside the body, dashed, because velocity and acceleration aren't forces.</p>
      {#each MOTION as m (m.key)}
        <div class="motion">
          <label class="check"><input type="checkbox" bind:checked={gen.settings[m.key]} /> {m.name}</label>
          {#if s[m.key]}
            {@render directionField(gen.settings, m.angle, m.name)}
            <div class="field">Label <LabelField name="{m.name} label" bind:label={gen.settings[m.label]} /></div>
          {/if}
        </div>
      {/each}
    </Section>
  {/snippet}

  {#snippet figure(id)}
    <FreeBody settings={s} {id} />
  {/snippet}
</GeneratorLayout>

<style>
  .force { border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
  .force-head { display: flex; align-items: center; justify-content: space-between; font-weight: 800; margin-bottom: 0.25rem; }
  .degrees { display: inline-flex; align-items: center; gap: 0.2rem; color: var(--muted); }
  .degrees input { width: 4.2rem; }
  .motion + .motion { border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.25rem; }
  .warning { color: var(--ink); background: #fffbeb; border-left: 3px solid var(--amber); border-radius: 6px; padding: 0.5rem 0.7rem; }
  .starters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .starters button { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.65rem; font-size: 0.85rem; border-radius: 9px; }
</style>
