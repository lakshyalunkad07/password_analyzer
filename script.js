let crackingChart = null;

const passwordInput = document.getElementById("passwordInput");
const strengthBar = document.getElementById("strengthBar");
const strengthLabel = document.getElementById("strengthLabel");
const strengthSummary = document.getElementById("strengthSummary");
const strengthTips = document.getElementById("strengthTips");
const attackResult = document.getElementById("attackResult");

document.getElementById("analyzeButton").addEventListener("click", analyzePassword);
document.getElementById("dictionaryButton").addEventListener("click", runDictionaryAttack);
document.getElementById("bruteforceButton").addEventListener("click", runBruteForce);
document.getElementById("toggleShow").addEventListener("click", togglePasswordVisibility);
passwordInput.addEventListener("input", analyzePassword);

async function analyzePassword() {
  const password = passwordInput.value;

  try {
    const metrics = await postJson("/api/analyze", { password });
    updateStrengthUI(metrics);
    drawChart(metrics);
    return metrics;
  } catch (error) {
    console.error(error);
    setAttackMessage("Python backend is not running. Start the project with python app.py.", "warning");
  }

  return null;
}

async function runDictionaryAttack() {
  const password = passwordInput.value;
  if (!password) {
    setAttackMessage("Enter a password before running attacks.", "warning");
    return;
  }

  try {
    const result = await postJson("/api/dictionary-attack", { password });
    document.getElementById("dictionaryChecks").textContent = result.checks.toLocaleString();
    document.getElementById("measuredTime").textContent = `${result.elapsedMs.toFixed(4)} ms`;

    if (result.found) {
      setAttackMessage(
        `Dictionary attack succeeded. The password was found after ${result.checks.toLocaleString()} checks in ${result.elapsedMs.toFixed(4)} ms.`,
        "danger"
      );
    } else {
      setAttackMessage(
        `Dictionary attack failed. ${result.checks.toLocaleString()} common passwords were checked in ${result.elapsedMs.toFixed(4)} ms.`,
        "success"
      );
    }
  } catch (error) {
    console.error(error);
    setAttackMessage("Python backend is not running. Start the project with python app.py.", "warning");
  }
}

async function runBruteForce() {
  const password = passwordInput.value;
  if (!password) {
    setAttackMessage("Enter a password before running attacks.", "warning");
    return;
  }

  try {
    const result = await postJson("/api/bruteforce", { password });
    if (result.status === "invalid_charset" || result.status === "too_long") {
      setAttackMessage(result.message, "warning");
      return;
    }

    document.getElementById("bruteAttempts").textContent = result.attempts.toLocaleString();
    document.getElementById("measuredTime").textContent = `${result.elapsedMs.toFixed(4)} ms`;

    if (result.cracked) {
      setAttackMessage(
        `Brute-force estimate: password cracked after approximately ${result.attempts.toLocaleString()} attempts in ${result.elapsedMs.toFixed(4)} ms of simulation time.`,
        "danger"
      );
    } else {
      setAttackMessage("Password was not cracked within the brute-force limit.", "success");
    }
  } catch (error) {
    console.error(error);
    setAttackMessage("Python backend is not running. Start the project with python app.py.", "warning");
  }
}

function updateStrengthUI(metrics) {
  strengthBar.style.width = `${metrics.meterWidth}%`;
  strengthBar.style.background = metrics.meterColor;
  strengthLabel.textContent = `Strength: ${metrics.rating}`;

  const summary = metrics.password
    ? `${metrics.rating} password with approximately ${metrics.entropy.toFixed(1)} bits of entropy. Estimated offline cracking time: ${formatDuration(metrics.estimatedSeconds)}.`
    : "Run an analysis to see a rating, entropy score, and attack outlook.";

  strengthSummary.textContent = summary;
  strengthTips.innerHTML = "";

  metrics.checks.forEach((check) => {
    const item = document.createElement("li");
    item.className = check.passed ? "pass" : "fail";
    item.textContent = `${check.passed ? "PASS" : "FAIL"} - ${check.label}`;
    strengthTips.appendChild(item);
  });

  if (metrics.isCommonPassword && metrics.password) {
    const warning = document.createElement("li");
    warning.className = "fail";
    warning.textContent = `FAIL - This password appears in the Python wordlist (${metrics.wordlistSize} entries).`;
    strengthTips.appendChild(warning);
  }

  document.getElementById("metricLength").textContent = String(metrics.password.length);
  document.getElementById("metricCharset").textContent = String(metrics.charsetSize);
  document.getElementById("metricEntropy").textContent = `${metrics.entropy.toFixed(1)} bits`;
  document.getElementById("metricCrackTime").textContent = formatDuration(metrics.estimatedSeconds);

  document.getElementById("heroStrength").textContent = metrics.rating;
  document.getElementById("heroEntropy").textContent = `${metrics.entropy.toFixed(1)} bits`;
  document.getElementById("heroLength").textContent = String(metrics.password.length);
}

function drawChart(metrics) {
  const length = metrics.password.length || 0;
  const milliseconds = Math.max(metrics.estimatedSeconds * 1000, 0.001);

  if (crackingChart) {
    crackingChart.destroy();
  }

  crackingChart = new Chart(document.getElementById("crackingChart"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Entered password",
          data: length ? [{ x: length, y: milliseconds }] : [],
          borderColor: "#6ef2c7",
          backgroundColor: "rgba(110, 242, 199, 0.16)",
          pointBackgroundColor: "#6ef2c7",
          pointBorderColor: "#6ef2c7",
          pointRadius: 8,
          pointHoverRadius: 10,
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#eaf2ff"
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const point = context.raw;
              return ` Length ${point.x}, crack time ${formatDuration(point.y / 1000)}`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 16,
          title: {
            display: true,
            text: "Password length",
            color: "#96a8c6"
          },
          ticks: {
            color: "#96a8c6"
          },
          grid: {
            color: "rgba(150, 168, 198, 0.08)"
          }
        },
        y: {
          type: "logarithmic",
          min: 0.001,
          max: 1e26,
          title: {
            display: true,
            text: "Cracking time (log scale, ms)",
            color: "#96a8c6"
          },
          ticks: {
            color: "#96a8c6",
            callback(value) {
              return formatMillisecondsLabel(value);
            }
          },
          grid: {
            color: "rgba(150, 168, 198, 0.08)"
          }
        }
      }
    }
  });
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function setAttackMessage(message, type) {
  attackResult.className = `attack-result ${type}`;
  attackResult.textContent = message;
}

function togglePasswordVisibility() {
  const nextType = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = nextType;
  this.textContent = nextType === "text" ? "Hide" : "Show";
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "less than 1 ms";
  }

  const units = [
    { label: "year", value: 60 * 60 * 24 * 365 },
    { label: "day", value: 60 * 60 * 24 },
    { label: "hour", value: 60 * 60 },
    { label: "minute", value: 60 },
    { label: "second", value: 1 }
  ];

  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(2)} ms`;
  }

  for (const unit of units) {
    if (seconds >= unit.value) {
      const amount = seconds / unit.value;
      const rounded = amount >= 10 ? amount.toFixed(1) : amount.toFixed(2);
      return `${rounded} ${unit.label}${amount >= 2 ? "s" : ""}`;
    }
  }

  return `${seconds.toFixed(2)} seconds`;
}

function formatMillisecondsLabel(value) {
  if (value < 1) {
    return `${value.toFixed(2)} ms`;
  }
  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }
  return formatDuration(value / 1000);
}

analyzePassword();
