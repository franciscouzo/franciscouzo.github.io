'use strict'

function random(min, max) {
  return min + Math.random() * (max - min)
}

function clamp(x, min, max) {
  [min, max] = [Math.min(min, max), Math.max(min, max)]
  return Math.min(max, Math.max(min, x))
}


class PolygonFactory {
  constructor(width, height, options) {
    this.width = width
    this.height = height
    this.options = options
  }

  generatePoint() {
    if (this.options.restriction.enable) {
      const sides = this.options.restriction.sides
      const angle = this.options.restriction.angle
      const radius = Math.min(this.width, this.height) / 2

      const i1 = Math.floor(Math.random() * sides)
      const i2 = (i1 + 1) % sides

      const x1 = Math.cos(i1 / sides * 2 * Math.PI + angle) * radius + this.width  / 2
      const y1 = Math.sin(i1 / sides * 2 * Math.PI + angle) * radius + this.height / 2

      const x2 = Math.cos(i2 / sides * 2 * Math.PI + angle) * radius + this.width  / 2
      const y2 = Math.sin(i2 / sides * 2 * Math.PI + angle) * radius + this.height / 2

      const t = Math.random()
      const x = (1 - t) * x1 + t * x2
      const y = (1 - t) * y1 + t * y2

      return [x, y]
    } else {
      return [random(0, this.width), random(0, this.height)]
    }
  }

  tweakPoint(point) {
    if (this.options.restriction.enable) {
      return this.generatePoint()
    } else {
      return [clamp(point[0] + random(-this.width  / 10, this.width  / 10), 0, this.width),
              clamp(point[1] + random(-this.height / 10, this.height / 10), 0, this.height)]
    }
  }

  generate() {
    const points = []
    const sides = Math.floor(random(this.options.minSides, this.options.maxSides))

    for (let i = 0; i < sides; i++) {
      points.push(this.generatePoint())
    }

    return {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
      a: Math.random(),
      points
    }
  }

  tweak(polygon) {
    const newPolygon = Object.assign({}, polygon)
    newPolygon.points = polygon.points.slice()
    const r = random(0, polygon.points.length + 4)
    if (r < 3) {
      const color = random_choice(['r', 'g', 'b'])
      newPolygon[color] = clamp(polygon[color] + random(-25, 25), 0, 255)
    } else if (r < 4) {
      newPolygon.a = clamp(polygon.a + random(-0.1, 0.1), 0, 1)
    } else {
      const i = Math.floor(Math.random() * polygon.points.length)
      if (polygon.points.length > this.options.minSides && Math.random() < 0.1) {
        newPolygon.points.splice(i, 1)
      } else if (polygon.points.length < this.options.maxSides && Math.random() < 0.1) {
        newPolygon.points.splice(i, 0, this.generatePoint())
      } else if (Math.random() < 0.5) {
        const j = Math.floor(Math.random() * polygon.points.length)
        newPolygon.points[i] = polygon.points[j]
        newPolygon.points[j] = polygon.points[i]
      } else {
        newPolygon.points[i] = this.tweakPoint(polygon.points[i])
      }
    }

    return newPolygon
  }

  draw(ctx, polygon) {
    const style = `rgba(${polygon.r}, ${polygon.g}, ${polygon.b}, ${polygon.a})`
    ctx.strokeStyle = ctx.fillStyle = style

    ctx.beginPath()
    ctx.moveTo(polygon.points[0][0], polygon.points[0][1])
    for (let i = 0; i < polygon.points.length; i++) {
      ctx.lineTo(polygon.points[i][0], polygon.points[i][1])
    }

    if (polygon.points.length === 2) {
      ctx.stroke()
    } else {
      ctx.fill()
    }
  }

  svg(polygon) {
    const style = rgb2hex(polygon.r, polygon.g, polygon.b)
    const points = polygon.points.map(([x, y]) => `${x},${y}`)
    return `<polygon points="${points.join(' ')}" fill="${style}" opacity="${polygon.a}"/>`
  }
}

class RegularPolygonFactory extends PolygonFactory {
  generate() {
    return {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
      a: Math.random(),
      sides: Math.floor(random(this.options.minSides, this.options.maxSides)),
      x: random(0, this.width), y: random(0, this.height),
      radius: random(this.options.minRadius, this.options.maxRadius),
      angle: random(0, 2 * Math.PI)
    }
  }

  tweak(polygon) {
    const newPolygon = Object.assign({}, polygon)
    const r = random(0, 10)
    if (r < 4 && (polygon.sides > this.options.minSides || polygon.sides < this.options.maxSides)) {
      if (polygon.sides > this.options.minSides) {
        newPolygon.sides--
      } else if (polygon.sides < this.options.maxSides) {
        newPolygon.sides++
      }
    } else if (r < 6) {
      const color = random_choice(['r', 'g', 'b'])
      newPolygon[color] = clamp(polygon[color] + random(-25, 25), 0, 255)
    } else if (r < 7) {
      newPolygon.a = clamp(polygon.a + random(-0.1, 0.1), 0, 1)
    } else {
      newPolygon.angle = (polygon.angle + random(-0.1, 0.1)) % (2 * Math.PI)
    }

    return newPolygon
  }

  getPoint(polygon, i) {
    const rot = i / polygon.sides * 2 * Math.PI + polygon.angle
    return [
      Math.cos(rot) * polygon.radius + polygon.x,
      Math.sin(rot) * polygon.radius + polygon.y
    ]
  }

  draw(ctx, polygon) {
    const style = `rgba(${polygon.r}, ${polygon.g}, ${polygon.b}, ${polygon.a})`
    ctx.strokeStyle = ctx.fillStyle = style

    ctx.beginPath()
    if (polygon.sides === 50) {
      ctx.arc(polygon.x, polygon.y, polygon.radius, 0, 2 * Math.PI)
    } else {
      for (let i = 0; i < polygon.sides; i++) {
        const [x, y] = this.getPoint(polygon, i)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
    }

    if (polygon.sides === 2) {
      ctx.stroke()
    } else {
      ctx.fill()
    }
  }

  svg(polygon) {
    const style = rgb2hex(polygon.r, polygon.g, polygon.b)

    if (polygon.sides === 50) {
      return `<circle cx="${polygon.x}" cy="${polygon.y}" r="${polygon.radius}" fill="${style}" />`
    } else {
      const points = []
      for (let i = 0; i < polygon.sides; i++) {
        const [x, y] = this.getPoint(polygon, i)
        points.push(`${x},${y}`)
      }
      return `<polygon points="${points.join(' ')}" fill="${style}" opacity="${polygon.a}"/>`
    }
  }
}

class TextureFactory {
  constructor(width, height, options, textureCanvas) {
    this.width = width
    this.height = height
    this.options = options
    this.textureCanvas = textureCanvas
  }

  generate() {
    return {
      a: Math.random(),
      x: random(0, this.width),
      y: random(0, this.height),
      radius: random(this.options.minRadius, this.options.maxRadius),
      angle: random(0, 2 * Math.PI)
    }
  }

  tweak(texture) {
    const newTexture = Object.assign({}, texture)

    const r = random(0, 5)
    if (r < 1) {
      newTexture.a = clamp(texture.a + random(-0.1, 0.1), 0, 1)
    } else if (r < 2) {
      newTexture.x = clamp(texture.x + random(-0.1, 0.1) * this.width,  -texture.radius, this.width  + texture.radius)
    } else if (r < 3) {
      newTexture.y = clamp(texture.y + random(-0.1, 0.1) * this.height, -texture.radius, this.height + texture.radius)
    } else if (r < 4) {
      newTexture.radius = clamp(texture.radius + random(this.options.minRadius, this.options.maxRadius) / 10, this.options.minRadius, this.options.maxRadius)
    } else {
      newTexture.angle = (texture.angle + random(-0.1, 0.1)) % (2 * Math.PI)
    }

    return newTexture
  }

  draw(ctx, texture) {
    ctx.save()
    ctx.globalAlpha = texture.a
    ctx.translate(texture.x, texture.y)
    ctx.rotate(texture.angle)

    let width = texture.radius
    let height = texture.radius

    if (texture.width > texture.height) {
      height *= this.textureCanvas.height / this.textureCanvas.width
    } else {
      width *= this.textureCanvas.width / this.textureCanvas.height
    }

    ctx.drawImage(this.textureCanvas, -width / 2, -height / 2, width, height)
    ctx.restore()
  }
}

function getScore(origImgData, imgData) {
  const { data: origData, width, height } = origImgData
  const { data } = imgData

  let score = 0

  for (let i = 0; i < width * height * 4; i++) {
    //score += Math.pow((origData[i] - data[i]) / 255, 2)
    score += Math.abs(origData[i] - data[i])
  }

  return score
}

function rgb2hex(red, green, blue) {
  const rgb = blue | (green << 8) | (red << 16)
  return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

document.addEventListener('DOMContentLoaded', function() {
  let shapes = []
  let shapeFactory
  let imgData

  const options = {
    loadImage: function() {
      imageUpload.click()
    },
    algorithm: 'Simulated annealing',
    style: 'Regular polygons',
    minSides: 4,
    maxSides: 4,
    minRadius: 30,
    maxRadius: 50,
    restriction: {
      enable: false,
      sides: 4,
      angle: 0
    },
    loadTexture: function() {
      textureUpload.click()
    },
    resize: false,
    maintainAspectRatio: true,
    maxWidth: 512,
    maxHeight: 512,
    overdraw: false,
    shapeCount: 500,
    speed: 1,
    generate: function() {
      hide_gui_element(gui, 'generate', true)
      hide_gui_element(gui, 'clear', true)
      hide_gui_element(gui, 'stop', false)

      generating = true

      let generations = 0
      let evolutions = 0

      shapeFactory = new {
        Polygons: PolygonFactory,
        'Regular polygons': RegularPolygonFactory,
        Textures: TextureFactory
      }[options.style](canvas.width, canvas.height, options, textureCanvas)

      hide_gui_element(gui, 'downloadSvg', !shapeFactory.svg)

      const { shapeCount, overdraw } = options

      shapes = []

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!overdraw) {
        for (let i = 0; i < shapeCount; i++) {
          const shape = shapeFactory.generate()
          shapes.push(shape)
        }
      }

      let bestScore = Infinity
      let generationTag = document.getElementById('generation')

      const acceptNewStateAlgorithms = {
        'Simulated annealing': function(score, bestScore, generation) {
          if (score <= bestScore) {
            return true
          } else {
            const temperature = 10000 / Math.log(generation + 1)
            return Math.exp(-(score - bestScore) / temperature) >= Math.random()
          }
        },
        'Hill climbing': function(score, bestScore, generation) {
          return score <= bestScore
        }
      }

      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = canvas.width
      tmpCanvas.height = canvas.height
      const tmpCtx = tmpCanvas.getContext('2d')

      function step() {
        if (!generating) {
          generating = false

          hide_gui_element(gui, 'generate', false)
          hide_gui_element(gui, 'clear', false)
          hide_gui_element(gui, 'stop', true)

          return
        }

        for (let j = 0; j < options.speed; j++) {
          generations++

          tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height)

          let oldShapes
          if (!overdraw) {
            oldShapes = shapes.slice()
            const steps = -Math.log(1 - Math.random()) / 2 + 1
            for (let k = 0; k < steps; k++) {
              const r = Math.random()
              const r1 = Math.floor(Math.random() * shapeCount)
              if (r < 0.7) {
                shapes[r1] = shapeFactory.tweak(shapes[r1])
              } else if (r < 0.8) {
                const r2 = Math.floor(Math.random() * shapeCount)
                ;[shapes[r1], shapes[r2]] = [shapes[r2], shapes[r1]]
              } else {
                shapes[r1] = shapeFactory.generate()
              }
            }

            for (let i = 0; i < shapeCount; i++) {
              shapeFactory.draw(tmpCtx, shapes[i])
            }
          } else {
            tmpCtx.drawImage(canvas, 0, 0)
            const shape = shapeFactory.generate()
            shapeFactory.draw(tmpCtx, shape)
          }

          const tmpImgData = tmpCtx.getImageData(0, 0, canvas.width, canvas.height)
          const score = getScore(imgData, tmpImgData)

          if (acceptNewStateAlgorithms[options.algorithm](score, bestScore, generations)) {
            bestScore = score
            ctx.putImageData(tmpImgData, 0, 0)
            evolutions++
          } else if (!overdraw) {
            shapes = oldShapes
          }
        }

        generationTag.innerHTML = `Generations: ${generations}<br>Evolutions: ${evolutions}<br>Score: ${bestScore}`

        requestAnimationFrame(step)
      }

      requestAnimationFrame(step)
    },
    clear: function() {
      hide_gui_element(gui, 'clear', true)
      hide_gui_element(gui, 'downloadSvg', true)

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    },
    stop: function() {
      generating = false

      hide_gui_element(gui, 'generate', false)
      hide_gui_element(gui, 'clear', false)
      hide_gui_element(gui, 'stop', true)
    },
    downloadSvg: function() {
      const svgElements = shapes.map(shape => shapeFactory.svg(shape))
      const data = [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ' +
        `width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`
      ].concat(svgElements, '</svg>').join('\n')
      download(filename.replace(/\.[^.]+$/, '') + '.svg', 'data:image/svg+xml,' + encodeURIComponent(data))
    }
  }
  const gui = new dat.GUI()
  gui.add(options, 'loadImage').name('Load image')
  gui.add(options, 'algorithm', ['Simulated annealing', 'Hill climbing']).name('Algorithm')
  gui.add(options, 'style', ['Polygons', 'Regular polygons', 'Textures']).name('Style').onChange(function(value) {
    hide_gui_folder(gui, 'Radius', value !== 'Regular polygons' && value !== 'Textures')
    hide_gui_folder(gui, 'Shape restriction', value !== 'Polygons')
    hide_gui_folder(gui, 'Sides', value === 'Textures')
    hide_gui_element(gui, 'loadTexture', value !== 'Textures')
  })

  const sidesFolder = gui.addFolder('Sides')
  sidesFolder.add(options, 'minSides', 2, 50, 1).name('Min sides').onChange(function(value) {
    options.maxSides = Math.max(options.minSides, options.maxSides)
    update_gui(sidesFolder)
  })
  sidesFolder.add(options, 'maxSides', 2, 50, 1).name('Max sides').onChange(function(value) {
    options.minSides = Math.min(options.minSides, options.maxSides)
    update_gui(sidesFolder)
  })

  const radiusFolder = gui.addFolder('Radius')
  radiusFolder.add(options, 'minRadius', 5, 100).name('Min radius').onChange(function(value) {
    options.maxRadius = Math.max(options.minRadius, options.maxRadius)
    update_gui(radiusFolder)
  })
  radiusFolder.add(options, 'maxRadius', 5, 100).name('Max radius').onChange(function(value) {
    options.minRadius = Math.min(options.minRadius, options.maxRadius)
    update_gui(radiusFolder)
  })

  const shapeRestrictionFolder = gui.addFolder('Shape restriction')
  shapeRestrictionFolder.add(options.restriction, 'enable').name('Restrict').onChange(function(value) {
    hide_gui_element(shapeRestrictionFolder, 'sides', !value)
    hide_gui_element(shapeRestrictionFolder, 'angle', !value)
  })
  shapeRestrictionFolder.add(options.restriction, 'sides', 3, 50, 1).name('Sides')
  shapeRestrictionFolder.add(options.restriction, 'angle', 0, 2 * Math.PI).name('Angle')

  gui.add(options, 'loadTexture').name('Load texture')

  gui.add(options, 'resize').name('Resize').onChange(function(value) {
    hide_gui_element(gui, 'maintainAspectRatio', !value)
    hide_gui_element(gui, 'maxWidth', !value)
    hide_gui_element(gui, 'maxHeight', !value)
  })
  gui.add(options, 'maintainAspectRatio').name('Maintain aspect ratio')
  gui.add(options, 'maxWidth', 64, 1024, 1).name('Max width')
  gui.add(options, 'maxHeight', 64, 1024, 1).name('Max height')

  gui.add(options, 'overdraw').name('Overdraw').onChange(function(value) {
    hide_gui_element(gui, 'shapeCount', value)
  })
  gui.add(options, 'shapeCount', 1, 5000).name('Shape count')
  gui.add(options, 'speed', 1, 25, 1).name('Speed')
  gui.add(options, 'generate').name('Generate')
  gui.add(options, 'clear').name('Clear')
  gui.add(options, 'stop').name('Stop')
  gui.add(options, 'downloadSvg').name('Download SVG')

  hide_gui_element(gui, 'loadTexture', true)
  hide_gui_element(gui, 'maintainAspectRatio', true)
  hide_gui_element(gui, 'maxWidth', true)
  hide_gui_element(gui, 'maxHeight', true)
  hide_gui_element(gui, 'clear', true)
  hide_gui_element(gui, 'stop', true)
  hide_gui_element(gui, 'downloadSvg', true)

  hide_gui_element(shapeRestrictionFolder, 'sides', true)
  hide_gui_element(shapeRestrictionFolder, 'angle', true)

  hide_gui_folder(gui, 'Shape restriction', true)

  const imageUpload = document.getElementById('imageUpload')
  const textureUpload = document.getElementById('textureUpload')

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  const textureCanvas = document.createElement('canvas')

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let generating = false

  let filename = 'default'

  imageUpload.addEventListener('change', function(e) {
    const reader = new FileReader()
    reader.onload = function(event) {
      const img = new Image()
      img.src = event.target.result
      img.onload = function() {
        if (options.resize) {
          if (options.maintainAspectRatio) {
            const ratio = Math.min(options.maxWidth / img.width, options.maxHeight / img.height)
            canvas.width = img.width * ratio
            canvas.height = img.height * ratio
          } else {
            canvas.width = options.maxWidth
            canvas.height = options.maxHeight
          }
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      }
    }
    const file = e.target.files[0]
    reader.readAsDataURL(file)
    filename = file.name
  }, false)

  textureUpload.addEventListener('change', function(e) {
    const reader = new FileReader()
    reader.onload = function(event) {
      const img = new Image()
      img.src = event.target.result
      img.onload = function() {
        textureCanvas.width = img.width
        textureCanvas.height = img.height
        textureCanvas.getContext('2d').drawImage(img, 0, 0)
      }
    }
    reader.readAsDataURL(e.target.files[0])
  }, false)
})
