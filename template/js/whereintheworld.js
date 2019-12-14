function drawMap() {
  const width = 800,
    height = 500;
  const projection = d3
    .geoOrthographic()
    .scale(200)
    .translate([width / 2, height / 2])
    .rotate([83, -42, 0])
    .clipAngle(90)
    .precision(0.3);
  const path = d3.geoPath().projection(projection);
  const svg = d3.select("svg");
  const g = svg.append("g");
  g.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "sphere")
    .style("stroke", "black")
    .attr("d", path)
    .attr("fill", "#fefefe");

  Promise.all([
    d3.json(
      "https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json"
    )
  ]).then(([worldData]) => {
    svg
      .selectAll(".segment")
      .data(topojson.feature(worldData, worldData.objects.countries).features)
      .enter()
      .append("path")
      .attr("class", "segment")
      .attr("d", path)
      // .style("stroke", "#888")
      // .style("stroke-width", "1px")
      .style("fill", (d, i) => "#e5e5e5")
      .style("opacity", ".6");
    // locations = locationData;
    svg
      .selectAll(".marker")
      .data([{ city: "Ann Arbor", lat: 42.2808, lng: -83.743 }])
      .enter()
      .append("circle")
      .each(function(d) {
        [x, y] = projection([d.lng, d.lat]);
        d3.select(this)
          .attr("r", 4)
          .attr("transform", d => `translate(${x}, ${y})`)
          .attr("fill", "black");
      });
  });
}

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
// drawMap();

class Mappy {
  constructor(canvas, world, tilt = 20) {
    const scale = window.devicePixelRatio; // <--- Change to 1 on retina screens to see blurry canvas.
    canvas.width *= scale;
    canvas.height *= scale;

    [this.width, this.height, this.tilt] = [canvas.width, canvas.height, tilt];
    this.land = topojson.feature(world, world.objects.land);
    this.sphere = { type: "Sphere" };

    this.lng = 0;
    this.lat = 0;

    this.context = canvas.getContext("2d");
    this.projection = d3
      .geoOrthographic()
      .scale(400)
      .translate([this.width / 2, this.height / 2])
      .clipAngle(90)
      .precision(0.3);
    this.path = d3.geoPath(this.projection, this.context);

    this.render = this.render.bind(this);
    this.setCoords = this.setCoords.bind(this);

    this.setCoords(this.lng, this.lat);
  }

  getCanvas() {
    return this.context.canvas;
  }

  render(placeName) {
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.beginPath(),
      this.path(this.land),
      (this.context.fillStyle = "#ccc"),
      this.context.fill();
    // this.context.beginPath(),
    //   this.path(borders),
    //   (this.context.strokeStyle = "#fff"),
    //   (this.context.lineWidth = 0.5),
    //   this.context.stroke();
    this.context.beginPath(),
      this.path(this.sphere),
      (this.context.strokeStyle = "#000"),
      (this.context.lineWidth = 0.5),
      this.context.stroke();

    if (placeName) {
      let [x, y] = this.projection([this.lng, this.lat]);
      console.log(x, y);
      this.context.fillStyle = "red";
      this.context.beginPath(),
        this.context.arc(x, y, 4, 0, 2 * Math.PI),
        this.context.fill();
      this.context.beginPath(),
        this.context.font = "16px Calistoga";
        this.context.fillText(placeName, x + 10, y - 10);
    }
    return this.context.canvas;
  }

  async setCoords(lng, lat, placeName) {
    let r1 = [-this.lng, this.tilt - this.lat, 0];
    this.lng = lng;
    this.lat = lat;
    let r2 = [-this.lng, this.tilt - this.lat, 0];
    const iv = Versor.interpolateAngles(r1, r2);
    await d3
      .transition()
      .duration(1250)
      .tween("render", () => t => {
        this.projection.rotate(iv(t));
        this.render(placeName);
      })
      .end();
  }
}

async function init() {
  const world = await d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  );
  const canvas = document.querySelector(".map canvas");
  const mappy = new Mappy(canvas, world);

  const scroller = scrollama();
  scroller
    .setup({
      step: ".step",
      offset: 0.7
    })
    .onStepEnter(response => {
      // { element, index, direction }
      place = window.places[response.index];
      if (place.lng && place.lat) {
        mappy.setCoords(place.lng, place.lat, place.location);
      }
    })
    .onStepExit(response => {
      // { element, index, direction }
    });

  window.addEventListener("resize", scroller.resize);
}

init();
