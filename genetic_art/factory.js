function random(min, max) {
  return min + Math.random() * (max - min)
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function clamp(x, min, max) {
  [min, max] = [Math.min(min, max), Math.max(min, max)]
  return Math.min(max, Math.max(min, x))
}

function rgb2hex(red, green, blue) {
  const rgb = blue | (green << 8) | (red << 16)
  return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

export class PolygonFactory {
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

      const x1 = Math.cos(i1 / sides * 2 * Math.PI + angle) * radius + this.width / 2
      const y1 = Math.sin(i1 / sides * 2 * Math.PI + angle) * radius + this.height / 2

      const x2 = Math.cos(i2 / sides * 2 * Math.PI + angle) * radius + this.width / 2
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
      return [clamp(point[0] + random(-this.width / 10, this.width / 10), 0, this.width),
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
      a: this.options.transparent ? Math.random() : 1,
      points
    }
  }

  tweak(polygon) {
    const newPolygon = { ...polygon, points: polygon.points.slice() }
    const r = random(0, polygon.points.length + 4)
    if (r < 3) {
      const color = randomChoice(['r', 'g', 'b'])
      newPolygon[color] = clamp(polygon[color] + random(-25, 25), 0, 255)
    } else if (r < 4 && this.options.transparent) {
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

export class RegularPolygonFactory extends PolygonFactory {
  generate() {
    return {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
      a: this.options.transparent ? Math.random() : 1,
      sides: Math.floor(random(this.options.minSides, this.options.maxSides)),
      x: random(0, this.width), y: random(0, this.height),
      radius: random(this.options.minRadius, this.options.maxRadius),
      angle: random(0, 2 * Math.PI)
    }
  }

  tweak(polygon) {
    const newPolygon = { ...polygon }
    const r = random(0, 10)
    if (r < 4 && (polygon.sides > this.options.minSides || polygon.sides < this.options.maxSides)) {
      if (polygon.sides > this.options.minSides) {
        newPolygon.sides--
      } else if (polygon.sides < this.options.maxSides) {
        newPolygon.sides++
      }
    } else if (r < 6) {
      const color = randomChoice(['r', 'g', 'b'])
      newPolygon[color] = clamp(polygon[color] + random(-25, 25), 0, 255)
    } else if (r < 7 && this.options.transparent) {
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

export class TextureFactory {
  constructor(width, height, options, textureCanvas) {
    this.width = width
    this.height = height
    this.options = options
    this.textureCanvas = textureCanvas
  }

  generate() {
    return {
      a: this.options.transparent ? Math.random() : 1,
      x: random(0, this.width),
      y: random(0, this.height),
      radius: random(this.options.minRadius, this.options.maxRadius),
      angle: random(0, 2 * Math.PI)
    }
  }

  tweak(texture) {
    const newTexture = { ...texture }

    const r = random(0, 5)
    if (r < 1 && this.options.transparent) {
      newTexture.a = clamp(texture.a + random(-0.1, 0.1), 0, 1)
    } else if (r < 2) {
      newTexture.x = clamp(texture.x + random(-0.1, 0.1) * this.width, -texture.radius, this.width + texture.radius)
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