// Saving the figure as a picture, for pasting into Docs, Slides or a worksheet.

function svgText(svg) {
  return new XMLSerializer().serializeToString(svg)
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Render the SVG to a high-resolution PNG (3× so it stays sharp when printed). */
export function pngBlob(svg, scale = 3) {
  const w = svg.viewBox.baseVal.width
  const h = svg.viewBox.baseVal.height
  const url = URL.createObjectURL(new Blob([svgText(svg)], { type: 'image/svg+xml' }))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

export async function downloadPng(svg, filename) {
  download(await pngBlob(svg), filename)
}

export function downloadSvg(svg, filename) {
  download(new Blob([svgText(svg)], { type: 'image/svg+xml' }), filename)
}

/** Put the figure on the clipboard as an image. The promise is handed straight
 *  to ClipboardItem so Safari keeps the click's permission. */
export async function copyPng(svg) {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob(svg) })])
}
