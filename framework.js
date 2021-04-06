// const scale = 100
//
// const scaleAttrs = (attrs = {}) => {
//   return {
//     ...attrs,
//     r: (('r' in attrs) ? attrs.r : 3) / scale,
//     strokeWidth: (('strokeWidth' in attrs) ? attrs.strokeWidth : 3) / scale,
//     fontSize: (('fontSize' in attrs) ? attrs.fontSize : 20) / scale
//   }
// }

const defaultAttrs = (attrs = {}) => {
  return {
    ...attrs,
    r: attrs.r || 0.03,
    strokeWidth: attrs.strokeWidth || 0.03,
    fontSize: attrs.fontSize || 0.2
  }
}

const defaultWidth = 10

class Framework {
  constructor (inputs, update, output) {
    this.output = output
    this.inputs = inputs
    this.update = update

    this.pan = { x: 0, y: 0 }
    this.zoom = 0

    this.dragged = false

    this.setupMouse()
    this.makeInputs()
    this.render()
  }

  setupMouse () {
    this.output.addEventListener('mousedown', () => { this.dragged = true })
    this.output.addEventListener('mousemove', e => {
      if (this.dragged) {
        this.pan.x -= e.movementX * (0.01 * 2 ** this.zoom)
        this.pan.y += e.movementY * (0.01 * 2 ** this.zoom)
      }
      this.render()
    })
    this.output.addEventListener('mouseup', () => { this.dragged = false })

    this.output.addEventListener('wheel', e => {
      if (e.deltaY > 0) {
        this.zoom++
      } else if (e.deltaY < 0) {
        this.zoom--
      }
      this.render()
    })
  }

  makeInputs () {
    const inputContainer = document.getElementById('inputs')

    this.inputs.forEach(id => {
      const div = document.createElement('div')

      const input = document.createElement('input')
      input.type = 'range'
      input.id = `input-${id.name}`
      input.min = id.min
      input.max = id.max
      input.step = id.step
      input.value = id.initial

      const span = document.createElement('span')
      span.innerText = `${id.name}: ${input.value}`

      input.addEventListener('input', () => {
        span.innerText = `${id.name}: ${input.value}`
        this.render(update)
      })

      div.appendChild(input)
      div.appendChild(span)
      inputContainer.appendChild(div)
    })
  }

  readInputs () {
    const inputValues = {}

    this.inputs.forEach(id => {
      const input = document.getElementById(`input-${id.name}`)
      inputValues[id.name] = Number(input.value)
    })

    return inputValues
  }

  getViewBox () {
    const ratio = this.output.clientWidth / this.output.clientHeight
    const width = defaultWidth * (2 ** this.zoom)
    const height = width / ratio
    const x = this.pan.x - width / 2
    const y = this.pan.y - height / 2
    return { x, y, width, height }
  }

  render () {
    const vb = this.getViewBox()
    this.output.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`)
    this.output.innerHTML = update(this.readInputs()).map(g => {
      if (g instanceof window['@flatten-js/core'].Line) {
        return g.svg(
          new window['@flatten-js/core'].Box(vb.x, vb.y, vb.width, vb.height),
          // scaleAttrs(g.attrs)
          defaultAttrs(g.attrs)
        )
      } else {
        // return g.svg(scaleAttrs(g.attrs))
        return g.svg(defaultAttrs(g.attrs))
      }
    }).join('')
  }
}

window.Framework = Framework
