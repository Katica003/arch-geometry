class Text {
  constructor (point, text) {
    this.point = point
    this.text = text
  }

  svg (attrs = {}) {
    const { stroke, strokeWidth, fontSize, fill, id, className } = attrs
    const idStr = (id && id.length > 0) ? `id="${id}"` : ''
    const classStr = (className && className.length > 0) ? `class="${className}"` : ''
    return `
      <text
        x="${this.point.x + 0.05}"
        y="${this.point.y - 0.1}"
        stroke="${stroke || 'black'}"
        stroke-width="${strokeWidth / 3}"
        font-size="${fontSize}px"
        fill="${fill || 'blue'}"
        ${idStr}
        ${classStr}
      >${this.text}</text>`
  }
}

class Formula {
  constructor (f, from, to, step) {
    // this.attrs = {
    //   fill: 'none'
    // }

    const Flatten = window['@flatten-js/core']

    const getPoint = x => new Flatten.Point(x, f(x))

    const segments = []
    let previous = getPoint(from)
    for (let i = 1; i <= (to - from) / step; i++) {
      const current = getPoint(from + (i * step))
      segments.push(new Flatten.Segment(previous, current))
      previous = current
    }
    // for (let i = from + step; i <= to; i += step) {
    //   const current = getPoint(i)
    //   segments.push(new Flatten.Segment(previous, current))
    //   previous = current
    // }

    this.multiline = new Flatten.Multiline(segments)
    // this.svg = this.multiline.svg.bind(this.multiline)
  }

  intersect (shape) {
    return [].concat(...this.multiline.edges.map(e => e.shape.intersect(shape)))
  }

  svg (attrs = {}) {
    const { stroke, strokeWidth, fill, fillRule, fillOpacity, id, className } = attrs
    const idStr = (id && id.length > 0) ? `id="${id}"` : ''
    const classStr = (className && className.length > 0) ? `class="${className}"` : ''

    let svgStr = `
      <path
        stroke="${stroke || 'black'}"
        stroke-width="${strokeWidth || 1}"
        fill="${fill || 'none'}"
        fill-rule="${fillRule || 'evenodd'}"
        fill-opacity="${fillOpacity || 1.0}" ${idStr} ${classStr}
        d="
    `
    svgStr += `\nM${this.multiline.first.start.x},${this.multiline.first.start.y}`
    for (const edge of this.multiline) {
      svgStr += edge.svg()
    }
    svgStr += '" >\n</path>'

    return svgStr
  }
}

window['@isti/flatten-js-extra'] = {
  Text,
  Formula
}

// window['@flatten-js/core'].Point = class extends window['@flatten-js/core'].Point {
//   constructor(x, y) {
//     super(x, -y)
//   }
// }

window['@flatten-js/core'].Segment.prototype.svg = function (attrs = {}) {
  const { stroke, strokeWidth, strokeDashArray, id, className } = attrs
  // let restStr = Object.keys(rest).reduce( (acc, key) => acc += ` ${key}="${rest[key]}"`, "");
  const idStr = (id && id.length > 0) ? `id="${id}"` : ''
  const classStr = (className && className.length > 0) ? `class="${className}"` : ''

  return `\n<line
          x1="${this.start.x}"
          y1="${this.start.y}"
          x2="${this.end.x}"
          y2="${this.end.y}"
          stroke="${stroke || 'black'}"
          stroke-width="${strokeWidth || 1}"
          stroke-dasharray="${strokeDashArray || ''}"
          ${idStr} ${classStr} />`
}
