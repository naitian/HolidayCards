// https://observablehq.com/@d3/world-tour
class Versor {
  static fromAngles([l, p, g]) {
    l *= Math.PI / 360;
    p *= Math.PI / 360;
    g *= Math.PI / 360;
    const sl = Math.sin(l),
      cl = Math.cos(l);
    const sp = Math.sin(p),
      cp = Math.cos(p);
    const sg = Math.sin(g),
      cg = Math.cos(g);
    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg
    ];
  }
  static toAngles([a, b, c, d]) {
    return [
      (Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180) /
        Math.PI,
      (Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180) /
        Math.PI,
      (Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180) / Math.PI
    ];
  }
  static interpolateAngles(a, b) {
    const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
    return t => Versor.toAngles(i(t));
  }
  static interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    (a2 -= a1), (b2 -= b1), (c2 -= c1), (d2 -= d1);
    const x = new Array(4);
    return t => {
      const l = Math.hypot(
        (x[0] = a1 + a2 * t),
        (x[1] = b1 + b2 * t),
        (x[2] = c1 + c2 * t),
        (x[3] = d1 + d2 * t)
      );
      (x[0] /= l), (x[1] /= l), (x[2] /= l), (x[3] /= l);
      return x;
    };
  }
  static interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
    if (dot < 0) (a2 = -a2), (b2 = -b2), (c2 = -c2), (d2 = -d2), (dot = -dot);
    if (dot > 0.9995)
      return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]);
    const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
    const x = new Array(4);
    const l = Math.hypot(
      (a2 -= a1 * dot),
      (b2 -= b1 * dot),
      (c2 -= c1 * dot),
      (d2 -= d1 * dot)
    );
    (a2 /= l), (b2 /= l), (c2 /= l), (d2 /= l);
    return t => {
      const theta = theta0 * t;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      x[0] = a1 * c + a2 * s;
      x[1] = b1 * c + b2 * s;
      x[2] = c1 * c + c2 * s;
      x[3] = d1 * c + d2 * s;
      return x;
    };
  }
}

console.log("Where in the world...");

class Mappy {
  constructor(canvas, world, tilt = 20) {
    const scale = window.devicePixelRatio; // <--- Change to 1 on retina screens to see blurry canvas.
    canvas.width *= scale;
    canvas.height *= scale;

    [this.width, this.height, this.tilt] = [canvas.width, canvas.height, tilt];
    this.land = topojson.feature(world, world.objects.land);
    this.sphere = { type: "Sphere" };

    this.lng = -83;
    this.lat = 42;
    this.zoomLevel = d3.zoomIdentity;
    this.initialScale = 400;
    this.placeName = null;

    this.mapColor = "#C37570";
    this.textColor = "#fbeed6";

    this.context = canvas.getContext("2d");
    this.projection = d3
      .geoOrthographic()
      .scale(this.initialScale)
      .translate([this.width / 2, this.height / 2])
      .clipAngle(90)
      .precision(0.3);
    this.path = d3.geoPath(this.projection, this.context);

    this.render = this.render.bind(this);
    this.setCoords = this.setCoords.bind(this);

    this.setCoords(this.lng, this.lat, "");
  }

  getCanvas() {
    return this.context.canvas;
  }

  render() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.beginPath(),
      this.path(this.land),
      // (this.context.strokeStyle = this.mapColor),
      // (this.context.lineWidth = 2),
      (this.context.fillStyle = this.mapColor),
      this.context.fill();
    // this.context.beginPath(),
    //   this.path(borders),
    //   (this.context.strokeStyle = "#fff"),
    //   (this.context.lineWidth = 0.5),
    //   this.context.stroke();
    this.context.beginPath(),
      this.path(this.sphere),
      (this.context.strokeStyle = this.mapColor),
      (this.context.lineWidth = 2),
      this.context.stroke();

    if (this.placeName) {
      let [x, y] = this.projection([this.lng, this.lat]);
      if (x && y) {
        this.context.fillStyle = this.textColor;
        this.context.beginPath(),
          this.context.arc(x, y, 4, 0, 2 * Math.PI),
          this.context.fill();
        this.context.beginPath(), (this.context.font = "24px Calistoga");
        this.context.fillText(this.placeName, x + 10, y - 10);
      }
    }
    return this.context.canvas;
  }

  async zoomMap(zoom) {
    const iz = d3.interpolateArray(
      [this.zoomLevel.x, this.zoomLevel.y, this.zoomLevel.k],
      [zoom.x, zoom.y, zoom.k]
    );
    this.zoomLevel = zoom;
    await d3
      .transition()
      .duration(400)
      .tween("render", () => t => {
        let view = iz(t);
        this.projection
          .scale(this.initialScale * view[2])
          .translate([this.width / 2 - view[0], this.height / 2 - view[1]]);
        requestAnimationFrame(this.render);
      }).end();
  }

  async setCoords(lng, lat, placeName = null) {
    let r1 = [-this.lng, this.tilt - this.lat, 0];
    this.lng = lng;
    this.lat = lat;
    this.placeName = placeName;
    let r2 = [-this.lng, this.tilt - this.lat, 0];
    const iv = Versor.interpolateAngles(r1, r2);
    await d3
      .transition()
      .duration(1250)
      .tween("render", () => t => {
        this.projection.rotate(iv(t));
        requestAnimationFrame(this.render);
      })
  }
}

async function init() {
  const world = await d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  );

  const canvas = document.querySelector(".map canvas");
  const mappy = new Mappy(canvas, world);

  const ipaddr = await d3.json("https://api.ipify.org/?format=json");
  // sorry for using this API key... 
  const loc = await d3.json(
    `https://api.ipstack.com/${
      ipaddr.ip
    }?access_key=fd4d87f605681c0959c16d9164ab6a4a&format=1`
  );
  let placeName = loc.city,
    lat = loc.latitude,
    lng = loc.longitude;
  if (placeName) mappy.setCoords(lng, lat, placeName + " (you are here)");

  const scroller = scrollama();
  scroller
    .setup({
      step: ".step",
      offset: 0.7
    })
    .onStepEnter(async response => {
      // { element, index, direction }
      place = window.places[response.index];
      if (response.index === 0 && response.direction === "down") {
        await mappy.zoomMap(d3.zoomIdentity.translate(0, -300).scale(3));
      }
      if (place && place.lng && place.lat) {
        mappy.setCoords(place.lng, place.lat, place.location);
      }
    })
    .onStepExit(async response => {
      // { element, index, direction }
      if (response.index === 0 && response.direction === "up") {
        await mappy.zoomMap(d3.zoomIdentity);
        mappy.setCoords(lng, lat, placeName);
      }
    });

  window.addEventListener("resize", scroller.resize);
}

init();
