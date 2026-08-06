(() => {
  const raw = Array.isArray(window.PHOTO_DATA) ? window.PHOTO_DATA : [];
  const fields = {
    id: "Photo_id", filename: "Filename", datetime: "Datetime",
    country: "Country", city: "City", place: "Place Type",
    group: "With Group", subject: "Subject Type", people: "People Visible",
    emotion: "Emotion", score: "Value"
  };

  const emotions = ["Joy", "Trust", "Fear", "Surprise", "Sadness", "Disgust", "Anger", "Anticipation"];
  const emotionColors = {
    Joy: "#d9a23d", Trust: "#6c9b75", Fear: "#6871a8", Surprise: "#b576a5",
    Sadness: "#587f9f", Disgust: "#826a8d", Anger: "#b95043", Anticipation: "#d27b45"
  };

  const data = raw.map(d => ({
    ...d,
    dateObject: parseDate(d[fields.datetime]),
    scoreNumber: Number(d[fields.score])
  })).filter(d => d[fields.id] && d.dateObject);

  const annotated = data.filter(d => emotions.includes(d[fields.emotion]) && Number.isFinite(d.scoreNumber));
  const state = {
    country: "all", city: "all", place: "all", group: "all", subject: "all", people: "all",
    emotion: null, selectedPhoto: null
  };

  const selects = {
    country: document.querySelector("#country-filter"),
    city: document.querySelector("#city-filter"),
    place: document.querySelector("#place-filter"),
    group: document.querySelector("#group-filter"),
    subject: document.querySelector("#subject-filter"),
    people: document.querySelector("#people-filter")
  };
  const tooltip = document.querySelector("#tooltip");

  function parseDate(value) {
    if (!value) return null;
    const normalized = String(value).trim().replace(" ", "T");
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function unique(field) {
    return [...new Set(data.map(d => d[field]).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }

  function populate(select, values) {
    values.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  populate(selects.country, unique(fields.country));
  populate(selects.city, unique(fields.city));
  populate(selects.place, unique(fields.place));
  populate(selects.group, unique(fields.group));
  populate(selects.subject, unique(fields.subject));
  populate(selects.people, unique(fields.people));

  function baseFiltered() {
    return annotated.filter(d =>
      (state.country === "all" || d[fields.country] === state.country) &&
      (state.city === "all" || d[fields.city] === state.city) &&
      (state.place === "all" || d[fields.place] === state.place) &&
      (state.group === "all" || d[fields.group] === state.group) &&
      (state.subject === "all" || d[fields.subject] === state.subject) &&
      (state.people === "all" || d[fields.people] === state.people)
    );
  }

  function activeRows() {
    const rows = baseFiltered();
    return state.emotion ? rows.filter(d => d[fields.emotion] === state.emotion) : rows;
  }

  function emotionStats(rows) {
    const counts = new Map(emotions.map(e => [e, 0]));
    rows.forEach(d => counts.set(d[fields.emotion], (counts.get(d[fields.emotion]) || 0) + 1));
    return emotions.map(emotion => ({ emotion, count: counts.get(emotion) || 0 }));
  }

  function renderAll() {
    renderFilterSummary();
    renderBubbles();
    renderGallery();
    renderTimeline();
    if (state.selectedPhoto) renderDetail(state.selectedPhoto);
  }

  function renderFilterSummary() {
    const parts = [];
    if (state.country !== "all") parts.push(state.country);
    if (state.city !== "all") parts.push(state.city);
    if (state.place !== "all") parts.push(state.place);
    if (state.group !== "all") parts.push(`with ${state.group}`);
    if (state.subject !== "all") parts.push(state.subject);
    if (state.people !== "all") parts.push(`visible: ${state.people}`);
    const count = baseFiltered().length;
    document.querySelector("#filter-summary").textContent = parts.length
      ? `${count} annotated photographs match: ${parts.join(" · ")}.`
      : `Showing all ${count} annotated photographs.`;
    document.querySelector("#selected-emotion-note").textContent = state.emotion
      ? `${state.emotion} is selected. Click it again to show all emotions.`
      : "Click an emotion circle to isolate it.";
  }

  function renderBubbles() {
    const rows = baseFiltered();
    const stats = emotionStats(rows);
    const svg = d3.select("#emotion-bubbles");
    const width = svg.node().clientWidth || 900;
    const height = 690;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    document.querySelector("#bubble-empty").hidden = rows.length > 0;
    const maxCount = d3.max(stats, d => d.count) || 1;
    const radius = d3.scaleSqrt().domain([0, maxCount]).range([34, Math.min(112, width / 8.5)]);

    const cols = width < 720 ? 2 : 4;
    const rowsN = Math.ceil(stats.length / cols);
    const cellW = width / cols;
    const cellH = height / rowsN;

    const nodes = svg.selectAll(".emotion-node")
      .data(stats)
      .join("g")
      .attr("class", d => `emotion-node${state.emotion === d.emotion ? " is-selected" : ""}${state.emotion && state.emotion !== d.emotion ? " is-muted" : ""}`)
      .attr("transform", (d, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return `translate(${cellW * col + cellW / 2},${cellH * row + cellH / 2})`;
      })
      .on("mouseenter", (event, d) => {
        tooltip.hidden = false;
        const pct = rows.length ? Math.round(d.count / rows.length * 100) : 0;
        tooltip.innerHTML = `<strong>${d.emotion}</strong>${d.count} photographs · ${pct}% of filtered archive`;
        moveTooltip(event);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", () => tooltip.hidden = true)
      .on("click", (_, d) => {
        state.emotion = state.emotion === d.emotion ? null : d.emotion;
        state.selectedPhoto = null;
        renderAll();
        if (state.emotion) document.querySelector("#gallery").scrollIntoView({ behavior: "smooth", block: "start" });
      });

    nodes.append("circle")
      .attr("class", "emotion-circle")
      .attr("r", d => radius(d.count))
      .attr("fill", d => emotionColors[d.emotion])
      .attr("opacity", d => d.count ? .88 : .16);

    nodes.append("text")
      .attr("class", "emotion-count")
      .attr("y", -5)
      .text(d => d.count);

    nodes.append("text")
      .attr("class", "emotion-name")
      .attr("y", 18)
      .text(d => d.emotion);

    nodes.append("text")
      .attr("class", "emotion-percent")
      .attr("y", 36)
      .text(d => rows.length ? `${Math.round(d.count / rows.length * 100)}%` : "0%");
  }

  function renderGallery() {
    const grid = document.querySelector("#gallery-grid");
    const title = document.querySelector("#gallery-title");
    const desc = document.querySelector("#gallery-description");
    grid.innerHTML = "";

    if (!state.emotion) {
      title.textContent = "Choose an emotion";
      desc.textContent = "Click one of the eight circles above to open the matching photo collection.";
      grid.innerHTML = '<p class="gallery-placeholder">The gallery will appear here after an emotion is selected.</p>';
      return;
    }

    const rows = activeRows().sort((a, b) => a.dateObject - b.dateObject);
    title.textContent = state.emotion;
    desc.textContent = `${rows.length} photographs match the current filters and selected emotion.`;

    if (!rows.length) {
      grid.innerHTML = '<p class="gallery-placeholder">No photographs match this emotion and filter combination.</p>';
      return;
    }

    rows.forEach(d => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gallery-card";
      card.setAttribute("aria-label", `Open ${d[fields.id]}`);
      const img = document.createElement("img");
      img.src = `images/${d[fields.filename]}`;
      img.alt = `${d[fields.id]} — ${d[fields.emotion]}`;
      img.loading = "lazy";
      const fallback = document.createElement("div");
      fallback.className = "gallery-fallback";
      fallback.textContent = `${d[fields.id]}\n${formatDate(d.dateObject)}`;
      img.addEventListener("error", () => img.replaceWith(fallback));
      const caption = document.createElement("div");
      caption.className = "gallery-caption";
      caption.textContent = `${formatDate(d.dateObject)} · ${formatScore(d.scoreNumber)}`;
      card.append(img, caption);
      card.addEventListener("click", () => {
        state.selectedPhoto = d;
        renderDetail(d);
        document.querySelector("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      grid.appendChild(card);
    });
  }

  function renderTimeline() {
    const rows = activeRows().sort((a, b) => a.dateObject - b.dateObject);
    const svg = d3.select("#timeline-chart");
    const width = svg.node().clientWidth || 1200;
    const height = 560;
    const margin = { top: 38, right: 28, bottom: 58, left: 52 };
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    document.querySelector("#timeline-empty").hidden = rows.length > 0;
    if (!rows.length) return;

    let extent = d3.extent(rows, d => d.dateObject);
    if (+extent[0] === +extent[1]) {
      extent = [d3.timeDay.offset(extent[0], -1), d3.timeDay.offset(extent[1], 1)];
    }
    const x = d3.scaleTime().domain(extent).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([-5, 5]).range([height - margin.bottom, margin.top]);
    const color = d3.scaleLinear().domain([-5, 0, 5]).range(["#315d8a", "#cbc7bd", "#a63f36"]).clamp(true);

    [-5,-4,-3,-2,-1,0,1,2,3,4,5].forEach(v => {
      svg.append("line")
        .attr("class", v === 0 ? "zero-line" : "grid-line")
        .attr("x1", margin.left).attr("x2", width - margin.right)
        .attr("y1", y(v)).attr("y2", y(v));
    });

    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(Math.min(9, Math.max(3, width / 140))).tickSizeOuter(0));
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickValues([-5,-3,-1,0,1,3,5]).tickSizeOuter(0));

    svg.append("path")
      .datum(rows)
      .attr("class", "timeline-line")
      .attr("d", d3.line().x(d => x(d.dateObject)).y(d => y(d.scoreNumber)).curve(d3.curveMonotoneX));

    svg.selectAll(".timeline-point")
      .data(rows)
      .join("circle")
      .attr("class", d => `timeline-point${state.selectedPhoto?.[fields.id] === d[fields.id] ? " is-selected" : ""}`)
      .attr("cx", d => x(d.dateObject))
      .attr("cy", d => y(d.scoreNumber))
      .attr("r", 5.5)
      .attr("fill", d => color(d.scoreNumber))
      .on("mouseenter", (event, d) => {
        tooltip.hidden = false;
        tooltip.innerHTML = `<strong>${d[fields.id]}</strong>${formatDateTime(d.dateObject)}<br>${d[fields.city] || "Unknown"} · ${d[fields.emotion]} ${formatScore(d.scoreNumber)}`;
        moveTooltip(event);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", () => tooltip.hidden = true)
      .on("click", (_, d) => {
        state.selectedPhoto = d;
        renderTimeline();
        renderDetail(d);
        document.querySelector("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
      });
  }

  function renderDetail(d) {
    document.querySelector("#detail-heading").textContent = d[fields.id];
    const image = document.querySelector("#detail-image");
    const placeholder = document.querySelector("#detail-placeholder");
    image.hidden = false;
    placeholder.hidden = true;
    image.src = `images/${d[fields.filename]}`;
    image.alt = `${d[fields.id]} — ${d[fields.emotion]}`;
    image.onerror = () => {
      image.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = `Image file not found. Add ${d[fields.filename]} to the images folder.`;
    };
    document.querySelector("#detail-id").textContent = d[fields.id] || "—";
    document.querySelector("#detail-date").textContent = formatDateTime(d.dateObject);
    document.querySelector("#detail-location").textContent = [d[fields.city], d[fields.country]].filter(Boolean).join(", ") || "—";
    document.querySelector("#detail-place").textContent = d[fields.place] || "—";
    document.querySelector("#detail-group").textContent = d[fields.group] || "—";
    document.querySelector("#detail-subject").textContent = d[fields.subject] || "—";
    document.querySelector("#detail-people").textContent = d[fields.people] || "—";
    document.querySelector("#detail-emotion").textContent = d[fields.emotion] || "—";
    document.querySelector("#detail-score").textContent = formatScore(d.scoreNumber);
  }

  function formatScore(value) {
    const rounded = Math.round(value * 10) / 10;
    return rounded > 0 ? `+${rounded}` : String(rounded);
  }
  function formatDate(date) {
    return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(date);
  }
  function formatDateTime(date) {
    return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }
  function moveTooltip(event) {
    const pad = 15;
    tooltip.style.left = `${Math.min(event.clientX + pad, window.innerWidth - 280)}px`;
    tooltip.style.top = `${Math.min(event.clientY + pad, window.innerHeight - 120)}px`;
  }

  Object.entries(selects).forEach(([key, select]) => {
    select.addEventListener("change", e => {
      state[key] = e.target.value;
      state.selectedPhoto = null;
      renderAll();
    });
  });

  document.querySelector("#reset-filters").addEventListener("click", () => {
    Object.keys(selects).forEach(key => {
      state[key] = "all";
      selects[key].value = "all";
    });
    state.emotion = null;
    state.selectedPhoto = null;
    document.querySelector("#detail-heading").textContent = "Select a point on the timeline.";
    document.querySelector("#detail-image").hidden = true;
    document.querySelector("#detail-placeholder").hidden = false;
    renderAll();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { renderBubbles(); renderTimeline(); }, 160);
  });

  renderAll();
})();
