// NationScope: a small hash router that renders every page from data.js.
// Pages: home (#/), country (#/country/ind), compare (#/compare), indicators
// (#/indicators) and about (#/about). No network calls anywhere — the whole
// site is its own files, so it works offline once served.
(function () {
  "use strict";

  var view = document.getElementById("view");

  function byCode(code) {
    for (var i = 0; i < NATIONS.length; i++) {
      if (NATIONS[i].code === code) return NATIONS[i];
    }
    return null;
  }

  function fmtMillions(n) {
    return n >= 1000 ? (n / 1000).toFixed(2) + " bn" : n.toFixed(1) + " m";
  }

  function fmtMoney(n) {
    return "$" + n.toFixed(2) + " tn";
  }

  function fmtDollars(n) {
    return "$" + n.toLocaleString("en-US");
  }

  function changeSince(nation) {
    return (((nation.pop2024 - nation.pop2015) / nation.pop2015) * 100).toFixed(1);
  }

  function rankOf(list, code) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === code) return i + 1;
    }
    return null;
  }

  function sortedBy(key) {
    return NATIONS.slice().sort(function (a, b) { return b[key] - a[key]; });
  }

  function esc(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function card(label, value, note) {
    return '<div class="stat"><span class="stat-label">' + label + '</span>' +
      '<span class="stat-value">' + value + '</span>' +
      '<span class="stat-note">' + note + '</span></div>';
  }

  function countryRow(nation, showRank) {
    var popRank = rankOf(sortedBy("pop2024"), nation.code);
    var gdpRank = rankOf(sortedBy("gdp2024"), nation.code);
    return '<tr><td>' + (showRank ? popRank + ". " : "") +
      '<a href="#/country/' + nation.code + '">' + esc(nation.name) + '</a></td>' +
      '<td>' + esc(nation.region) + '</td>' +
      '<td class="num">' + fmtMillions(nation.pop2024) + '</td>' +
      '<td class="num">' + fmtMoney(nation.gdp2024) + '</td>' +
      '<td class="num">' + fmtDollars(nation.gdpPc) + '</td>' +
      '<td class="num">' + nation.life.toFixed(1) + '</td>' +
      '<td class="num">#' + gdpRank + '</td></tr>';
  }

  function homePage() {
    var byPop = sortedBy("pop2024").slice(0, 10);
    var byGdp = sortedBy("gdp2024").slice(0, 10);
    var rows = NATIONS.map(function (n) { return countryRow(n, false); }).join("");
    view.innerHTML =
      '<section class="hero"><h1>Every country, in numbers.</h1>' +
      '<p class="lede">NationScope gathers the headline statistics of 20 countries — population, economy and how long people live — from the World Bank, with the source and year beside every figure.</p>' +
      '<div class="worldline"><span><strong>8.14 bn</strong> people on Earth, 2024</span>' +
      '<span><strong>$111.3 tn</strong> world GDP, 2024</span>' +
      '<span><strong>20</strong> countries profiled</span></div></section>' +
      '<section class="search"><label for="q">Find a country</label>' +
      '<input id="q" type="search" placeholder="Type a name — try Japan, Nigeria, Brazil…" autocomplete="off">' +
      '<p id="qhint" class="hint">Or browse the table below.</p></section>' +
      '<section class="charts"><div class="chartbox"><h2>Most people, 2024</h2>' +
      '<canvas id="popChart" height="330" aria-label="Bar chart of the ten most populous countries"></canvas>' +
      '<p class="src">World Bank WDI, SP.POP.TOTL, 2024</p></div>' +
      '<div class="chartbox"><h2>Biggest economies, 2024</h2>' +
      '<canvas id="gdpChart" height="330" aria-label="Bar chart of the ten largest economies"></canvas>' +
      '<p class="src">World Bank WDI, NY.GDP.MKTP.CD, 2024</p></div></section>' +
      '<section><h2>All 20 countries</h2>' +
      '<div class="tablewrap"><table><thead><tr><th>Country</th><th>Region</th>' +
      '<th class="num">Population</th><th class="num">GDP</th><th class="num">GDP per person</th>' +
      '<th class="num">Life expectancy</th><th class="num">GDP rank</th></tr></thead>' +
      '<tbody id="countryTable">' + rows + '</tbody></table></div>' +
      '<p class="src">Population and GDP: World Bank WDI 2024. Life expectancy: World Bank WDI 2023. ' +
      '<a href="#/indicators">What each number means</a></p></section>';
    drawBars(document.getElementById("popChart"),
      byPop.map(function (n) { return { label: n.name, value: n.pop2024, colour: "#2a7f6f" }; }),
      function (v) { return fmtMillions(v); });
    drawBars(document.getElementById("gdpChart"),
      byGdp.map(function (n) { return { label: n.name, value: n.gdp2024, colour: "#e8a33d" }; }),
      function (v) { return fmtMoney(v); });
    var input = document.getElementById("q");
    var tbody = document.getElementById("countryTable");
    input.addEventListener("input", function () {
      var needle = input.value.trim().toLowerCase();
      var matches = NATIONS.filter(function (n) {
        return n.name.toLowerCase().indexOf(needle) !== -1 || n.region.toLowerCase().indexOf(needle) !== -1;
      });
      tbody.innerHTML = matches.map(function (n) { return countryRow(n, false); }).join("") ||
        '<tr><td colspan="7">No country matches that search.</td></tr>';
      document.getElementById("qhint").textContent = matches.length + " of 20 countries shown.";
    });
    window.__shotReady = true;
  }

  function countryPage(code) {
    var nation = byCode(code);
    if (!nation) { view.innerHTML = "<p>That country is not in our list. <a href='#/'>Back home</a>.</p>"; window.__shotReady = true; return; }
    var popRank = rankOf(sortedBy("pop2024"), code);
    var gdpRank = rankOf(sortedBy("gdp2024"), code);
    var pcRank = rankOf(sortedBy("gdpPc"), code);
    var lifeRank = rankOf(sortedBy("life"), code);
    var delta = changeSince(nation);
    var others = NATIONS.filter(function (n) { return n.code !== code; }).slice(0, 3);
    view.innerHTML =
      '<p class="crumb"><a href="#/">All countries</a> › ' + esc(nation.region) + '</p>' +
      '<h1>' + esc(nation.name) + '</h1>' +
      '<p class="lede">' + esc(NOTES[code] || "") + '</p>' +
      '<div class="stats">' +
      card("Population, 2024", fmtMillions(nation.pop2024), "Rank #" + popRank + " of 20 · " + (delta >= 0 ? "+" : "") + delta + "% since 2015") +
      card("GDP, 2024", fmtMoney(nation.gdp2024), "Rank #" + gdpRank + " of 20 · World Bank WDI") +
      card("GDP per person, 2024", fmtDollars(nation.gdpPc), "Rank #" + pcRank + " of 20") +
      card("Life expectancy, 2023", nation.life.toFixed(1) + " years", "Rank #" + lifeRank + " of 20") +
      card("Capital", esc(nation.capital), "Region: " + esc(nation.region)) +
      card("Share of world population", (nation.pop2024 / WORLD.population * 100).toFixed(1) + "%", "Of 8.14 billion people, 2024") +
      '</div>' +
      '<section class="chartbox wide"><h2>Population: 2015 vs 2024</h2>' +
      '<canvas id="decadeChart" height="150" aria-label="Population in 2015 and 2024"></canvas>' +
      '<p class="src">World Bank WDI, SP.POP.TOTL. Bars show millions of people.</p></section>' +
      '<section><h2>How ' + esc(nation.name) + ' compares</h2>' +
      '<div class="tablewrap"><table><thead><tr><th>Country</th><th>Region</th><th class="num">Population</th><th class="num">GDP</th><th class="num">GDP per person</th><th class="num">Life expectancy</th><th class="num">GDP rank</th></tr></thead><tbody>' +
      countryRow(nation, true) + others.map(function (n) { return countryRow(n, true); }).join("") +
      '</tbody></table></div></section>' +
      '<p><a class="button" href="#/compare">Compare two countries side by side</a></p>';
    drawPairedBars(document.getElementById("decadeChart"),
      [{ label: nation.name, before: nation.pop2015, after: nation.pop2024 }],
      function (v) { return fmtMillions(v); });
    window.__shotReady = true;
  }

  function comparePage() {
    view.innerHTML =
      '<h1>Compare two countries</h1>' +
      '<p class="lede">Pick any two of the 20 countries and see their headline numbers side by side.</p>' +
      '<div class="pickers"><label>First country <select id="pickA"></select></label>' +
      '<label>Second country <select id="pickB"></select></label></div>' +
      '<div id="compareOut"></div>';
    var pickA = document.getElementById("pickA");
    var pickB = document.getElementById("pickB");
    NATIONS.forEach(function (n) {
      pickA.add(new Option(n.name, n.code));
      pickB.add(new Option(n.name, n.code));
    });
    pickA.value = "usa";
    pickB.value = "chn";
    function renderCompare() {
      var a = byCode(pickA.value);
      var b = byCode(pickB.value);
      if (!a || !b) return;
      function row(label, fa, fb, fmt) {
        var winA = fa > fb;
        return '<tr><td>' + label + '</td><td class="num' + (winA ? " win" : "") + '">' + fmt(fa) + '</td><td class="num' + (!winA && fa !== fb ? " win" : "") + '">' + fmt(fb) + '</td></tr>';
      }
      document.getElementById("compareOut").innerHTML =
        '<div class="tablewrap"><table><thead><tr><th></th><th class="num">' + esc(a.name) + '</th><th class="num">' + esc(b.name) + '</th></tr></thead><tbody>' +
        row("Population, 2024", a.pop2024, b.pop2024, fmtMillions) +
        row("GDP, 2024", a.gdp2024, b.gdp2024, fmtMoney) +
        row("GDP per person, 2024", a.gdpPc, b.gdpPc, fmtDollars) +
        row("Life expectancy, 2023", a.life, b.life, function (v) { return v.toFixed(1) + " years"; }) +
        row("Population change since 2015", parseFloat(changeSince(a)), parseFloat(changeSince(b)), function (v) { return (v >= 0 ? "+" : "") + v.toFixed(1) + "%"; }) +
        '</tbody></table></div>' +
        '<section class="chartbox wide"><h2>Population, 2024</h2><canvas id="cmpChart" height="120"></canvas>' +
        '<p class="src">World Bank WDI, SP.POP.TOTL, 2024. The larger bar wins each row.</p></section>';
      drawBars(document.getElementById("cmpChart"),
        [{ label: a.name, value: a.pop2024, colour: "#2a7f6f" }, { label: b.name, value: b.pop2024, colour: "#e8a33d" }],
        function (v) { return fmtMillions(v); });
    }
    pickA.addEventListener("change", renderCompare);
    pickB.addEventListener("change", renderCompare);
    renderCompare();
    window.__shotReady = true;
  }

  function indicatorsPage() {
    view.innerHTML = '<h1>What each number means</h1>' +
      '<p class="lede">Every figure on NationScope comes from the World Bank\'s World Development Indicators. Here is what each one counts, and how to read it.</p>' +
      INDICATORS.map(function (ind) {
        return '<article class="indicator"><h2>' + esc(ind.label) + ' <span class="unit">(' + esc(ind.unit) + ')</span></h2>' +
          '<p>' + esc(ind.about) + '</p>' +
          '<p class="src">Series ' + esc(ind.series) + ' · reference year ' + ind.year + ' · World Bank WDI</p></article>';
      }).join("") +
      '<section><h2>How to use this site</h2><ul class="tips">' +
      '<li><strong>Rankings</strong> on the home page sort by size; a small country can still lead on income per person.</li>' +
      '<li><strong>Life expectancy</strong> is the most recent year available (2023); population and GDP are 2024.</li>' +
      '<li><strong>Population change</strong> compares 2024 with 2015, so you can see a decade of growth or decline.</li></ul></section>';
    window.__shotReady = true;
  }

  function aboutPage() {
    view.innerHTML = '<h1>About NationScope</h1>' +
      '<p class="lede">NationScope is an independent reference site. It is not affiliated with the World Bank; it republishes a small set of the Bank\'s headline indicators so that anyone can compare countries quickly.</p>' +
      '<section><h2>Sources</h2><p>All figures: World Bank, World Development Indicators (CC BY 4.0). Population and GDP are 2024 values; life expectancy is 2023, the latest year published. Values are rounded for display; the underlying series codes are listed on the <a href="#/indicators">indicators page</a>.</p></section>' +
      '<section><h2>Method</h2><ul class="tips">' +
      '<li>GDP is nominal, in current US dollars — not adjusted for purchasing power.</li>' +
      '<li>Population change is the simple percentage change between the 2015 and 2024 mid-year estimates.</li>' +
      '<li>Ranks are computed within the 20 countries profiled here, not the whole world.</li></ul></section>' +
      '<section><h2>Contact</h2><p>Spotted a figure that looks wrong? Every number on this site names its series and year, so you can check it against the World Bank\'s own data pages.</p></section>';
    window.__shotReady = true;
  }

  function route() {
    window.__shotReady = false;
    var hash = location.hash || "#/";
    var parts = hash.replace(/^#\//, "").split("/");
    document.querySelectorAll("nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#/" + (parts[0] || ""));
    });
    if (parts[0] === "country" && parts[1]) { countryPage(parts[1]); return; }
    if (parts[0] === "compare") { comparePage(); return; }
    if (parts[0] === "indicators") { indicatorsPage(); return; }
    if (parts[0] === "about") { aboutPage(); return; }
    homePage();
  }

  window.addEventListener("hashchange", route);
  route();
})();
