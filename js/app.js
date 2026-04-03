/* ===== BMI CALCULATOR APP ===== */
try {

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ===== STATE =====
  let unit = 'imperial'; // imperial | metric
  let gender = 'male';
  let history = JSON.parse(localStorage.getItem('bmi_history') || '[]');
  let historyChart = null;
  let lastBmi = null;
  let lastData = null;

  // ===== TOAST =====
  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ===== UNIT TOGGLE =====
  const unitToggle = $('.unit-toggle');
  unitToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.unit-btn');
    if (!btn) return;
    unit = btn.dataset.unit;
    $$('.unit-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    unitToggle.setAttribute('data-unit', unit);

    if (unit === 'metric') {
      $('#heightImperial').classList.add('hidden');
      $('#heightMetric').classList.remove('hidden');
      $('#weightUnit').textContent = 'kg';
      // Convert lbs -> kg
      const lbs = parseFloat($('#weightVal').value) || 160;
      $('#weightVal').value = Math.round(lbs / 2.205);
      // Convert ft/in -> cm
      const ft = parseInt($('#heightFt').value) || 5;
      const inch = parseInt($('#heightIn').value) || 9;
      $('#heightCm').value = Math.round((ft * 12 + inch) * 2.54);
    } else {
      $('#heightImperial').classList.remove('hidden');
      $('#heightMetric').classList.add('hidden');
      $('#weightUnit').textContent = 'lbs';
      // Convert kg -> lbs
      const kg = parseFloat($('#weightVal').value) || 73;
      $('#weightVal').value = Math.round(kg * 2.205);
      // Convert cm -> ft/in
      const cm = parseInt($('#heightCm').value) || 175;
      const totalIn = Math.round(cm / 2.54);
      $('#heightFt').value = Math.floor(totalIn / 12);
      $('#heightIn').value = totalIn % 12;
    }
  });

  // ===== GENDER =====
  $$('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.gender-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gender = btn.dataset.gender;
    });
  });

  // ===== STEPPERS =====
  $$('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = $('#' + btn.dataset.target);
      const dir = parseInt(btn.dataset.dir);
      let val = parseInt(target.value) || 0;
      val += dir;
      val = Math.max(parseInt(target.min), Math.min(parseInt(target.max), val));
      target.value = val;
    });
  });

  // ===== CALCULATE BMI =====
  function calculateBMI() {
    const age = parseInt($('#age').value) || 25;
    let heightM, weightKg;

    if (unit === 'imperial') {
      const ft = parseInt($('#heightFt').value) || 5;
      const inch = parseInt($('#heightIn').value) || 9;
      const totalInches = ft * 12 + inch;
      heightM = totalInches * 0.0254;
      weightKg = (parseFloat($('#weightVal').value) || 160) * 0.453592;
    } else {
      heightM = (parseInt($('#heightCm').value) || 175) / 100;
      weightKg = parseFloat($('#weightVal').value) || 73;
    }

    if (heightM <= 0) { showToast('Enter a valid height'); return; }
    if (weightKg <= 0) { showToast('Enter a valid weight'); return; }

    const bmi = weightKg / (heightM * heightM);
    lastBmi = Math.round(bmi * 10) / 10;
    lastData = { age, heightM, weightKg, gender, unit };

    displayResult(lastBmi, age, heightM, weightKg);
  }

  function getBMICategory(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: 'var(--yellow)', bg: 'rgba(255,217,61,0.12)' };
    if (bmi < 25) return { label: 'Normal', color: 'var(--green)', bg: 'rgba(46,213,115,0.12)' };
    if (bmi < 30) return { label: 'Overweight', color: 'var(--orange)', bg: 'rgba(255,146,43,0.12)' };
    return { label: 'Obese', color: 'var(--red)', bg: 'rgba(255,71,87,0.12)' };
  }

  function displayResult(bmi, age, heightM, weightKg) {
    const card = $('#resultCard');
    card.classList.remove('hidden');

    const cat = getBMICategory(bmi);

    // BMI Value
    $('#bmiValue').textContent = bmi.toFixed(1);
    $('#bmiValue').style.color = cat.color;

    // Arc progress (0-50 BMI range mapped to arc)
    const circumference = 326.73;
    const pct = Math.min(bmi / 50, 1);
    const offset = circumference * (1 - pct);
    const arc = $('#bmiArc');
    arc.style.strokeDashoffset = offset;
    arc.style.stroke = cat.color;

    // Category
    $('#bmiCategory').textContent = cat.label;
    $('#bmiCategory').style.color = cat.color;

    // Range text
    const normalLow = (18.5 * heightM * heightM);
    const normalHigh = (24.9 * heightM * heightM);
    const weightInUnit = unit === 'imperial'
      ? `${Math.round(normalLow * 2.205)} – ${Math.round(normalHigh * 2.205)} lbs`
      : `${Math.round(normalLow)} – ${Math.round(normalHigh)} kg`;
    $('#bmiRange').innerHTML = `Healthy range: <strong>${weightInUnit}</strong>`;

    // Scale marker position
    const markerPct = Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100));
    $('#scaleMarker').style.left = markerPct + '%';

    // Health insight
    let insight = '';
    if (bmi < 18.5) {
      insight = `<i class="fas fa-info-circle" style="color:var(--yellow)"></i> Your BMI suggests you're underweight. Consider a nutrient-rich diet with adequate protein, healthy fats, and complex carbohydrates. Consulting a nutritionist may help.`;
    } else if (bmi < 25) {
      insight = `<i class="fas fa-check-circle" style="color:var(--green)"></i> Great! Your BMI is in the healthy range. Maintain your current lifestyle with balanced nutrition and regular physical activity.`;
    } else if (bmi < 30) {
      insight = `<i class="fas fa-exclamation-circle" style="color:var(--orange)"></i> Your BMI is above the healthy range. Regular exercise (150+ min/week) and mindful eating can help. Small changes add up over time!`;
    } else {
      insight = `<i class="fas fa-exclamation-triangle" style="color:var(--red)"></i> Your BMI is in the obese range, which may increase health risks. Consulting with a healthcare professional for a personalized plan is recommended.`;
    }
    $('#insightBox').innerHTML = insight;

    // Ideal weight range
    const idealLow = unit === 'imperial' ? Math.round(normalLow * 2.205) : Math.round(normalLow);
    const idealHigh = unit === 'imperial' ? Math.round(normalHigh * 2.205) : Math.round(normalHigh);
    const uLabel = unit === 'imperial' ? 'lbs' : 'kg';
    const currentW = unit === 'imperial' ? Math.round(weightKg * 2.205) : Math.round(weightKg);
    let diff = '';
    if (bmi < 18.5) {
      const need = idealLow - currentW;
      diff = `You should gain about <strong>${Math.abs(need)} ${uLabel}</strong> to reach a healthy BMI.`;
    } else if (bmi >= 25) {
      const need = currentW - idealHigh;
      diff = `Losing about <strong>${Math.abs(need)} ${uLabel}</strong> would bring you into the healthy range.`;
    } else {
      diff = `You're within your ideal weight range. Keep it up! 💪`;
    }
    $('#idealBox').innerHTML = `<i class="fas fa-bullseye"></i> <strong>Ideal Weight:</strong> ${idealLow} – ${idealHigh} ${uLabel}<br>${diff}`;

    // Scroll to result
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ===== CALCULATE BUTTON =====
  $('#calcBtn').addEventListener('click', calculateBMI);

  // ===== SAVE TO HISTORY =====
  $('#saveBtn').addEventListener('click', () => {
    if (lastBmi === null) return;
    const entry = {
      bmi: lastBmi,
      date: new Date().toISOString(),
      gender,
      age: lastData.age,
      unit,
      weight: unit === 'imperial'
        ? Math.round(lastData.weightKg * 2.205) + ' lbs'
        : Math.round(lastData.weightKg) + ' kg',
      height: unit === 'imperial'
        ? `${$('#heightFt').value}'${$('#heightIn').value}"`
        : `${$('#heightCm').value} cm`
    };
    history.unshift(entry);
    if (history.length > 50) history.pop();
    localStorage.setItem('bmi_history', JSON.stringify(history));
    showToast('Saved to history! 📊');
  });

  // ===== HISTORY PANEL =====
  const historyPanel = $('#historyPanel');
  const historyToggle = $('#historyToggle');

  historyToggle.addEventListener('click', () => {
    const isOpen = !historyPanel.classList.contains('hidden');
    if (isOpen) {
      historyPanel.classList.add('hidden');
      historyToggle.classList.remove('active');
    } else {
      historyPanel.classList.remove('hidden');
      historyToggle.classList.add('active');
      renderHistory();
    }
  });

  function renderHistory() {
    const list = $('#historyList');
    const empty = $('#emptyHistory');

    if (history.length === 0) {
      list.classList.add('hidden');
      empty.classList.remove('hidden');
      $('.chart-container').classList.add('hidden');
      return;
    }

    list.classList.remove('hidden');
    empty.classList.add('hidden');
    $('.chart-container').classList.remove('hidden');

    // Render list
    list.innerHTML = history.map((entry, i) => {
      const cat = getBMICategory(entry.bmi);
      const date = new Date(entry.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <div class="history-item">
          <div class="history-item-left">
            <div class="history-bmi" style="color:${cat.color}">${entry.bmi.toFixed(1)}</div>
            <div class="history-date">${dateStr} · ${entry.weight} · ${entry.height}</div>
          </div>
          <span class="history-cat" style="color:${cat.color};background:${cat.bg}">${cat.label}</span>
          <button class="history-delete" data-index="${i}"><i class="fas fa-trash"></i></button>
        </div>
      `;
    }).join('');

    // Delete entries
    list.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        history.splice(idx, 1);
        localStorage.setItem('bmi_history', JSON.stringify(history));
        renderHistory();
        showToast('Entry removed');
      });
    });

    // Chart
    renderChart();
  }

  function renderChart() {
    if (history.length < 1) return;

    const entries = history.slice(0, 20).reverse();
    const labels = entries.map(e => {
      const d = new Date(e.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = entries.map(e => e.bmi);
    const colors = entries.map(e => {
      const cat = getBMICategory(e.bmi);
      return cat.color.replace('var(--green)', '#2ED573')
        .replace('var(--yellow)', '#FFD93D')
        .replace('var(--orange)', '#FF922B')
        .replace('var(--red)', '#FF4757');
    });

    if (historyChart) historyChart.destroy();

    const ctx = $('#historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#00D2FF',
          backgroundColor: 'rgba(0,210,255,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors,
          pointBorderColor: colors,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141828',
            titleColor: '#eef0f6',
            bodyColor: '#eef0f6',
            borderColor: '#1e2440',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `BMI: ${item.parsed.y.toFixed(1)}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#7a82a6', font: { size: 10 } },
            grid: { color: 'rgba(122,130,166,0.1)' }
          },
          y: {
            min: 14,
            max: 42,
            ticks: { color: '#7a82a6', font: { size: 10 }, stepSize: 4 },
            grid: { color: 'rgba(122,130,166,0.1)' }
          }
        }
      }
    });
  }

  // ===== CLEAR HISTORY =====
  $('#clearHistory').addEventListener('click', () => {
    history = [];
    localStorage.setItem('bmi_history', JSON.stringify(history));
    renderHistory();
    showToast('History cleared');
  });

  // ===== ADD SVG GRADIENT (for arc) =====
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = $('.bmi-circle svg');
  const defs = document.createElementNS(svgNS, 'defs');
  const grad = document.createElementNS(svgNS, 'linearGradient');
  grad.setAttribute('id', 'bmiGrad');
  const stop1 = document.createElementNS(svgNS, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#00D2FF');
  const stop2 = document.createElementNS(svgNS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#7B61FF');
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svgEl.insertBefore(defs, svgEl.firstChild);

} catch(e) {
  console.error('App error:', e.message, e.stack);
  document.getElementById('app').innerHTML = '<div style="color:red;padding:40px;text-align:center;"><h2>Error</h2><p>' + e.message + '</p></div>';
}
