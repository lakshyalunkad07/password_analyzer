const DEFAULT_WORDLIST = [
  "123456", "password", "123456789", "12345678", "12345", "111111",
  "1234567", "sunshine", "qwerty", "iloveyou", "princess", "admin",
  "welcome", "666666", "abc123", "football", "123123", "monkey",
  "654321", "!@#$%^&*", "charlie", "aa123456", "donald", "password1",
  "qwerty123", "zxcvbnm", "1q2w3e4r", "dragon", "master", "hello",
  "freedom", "whatever", "qazwsx", "trustno1", "jordan23", "harley",
  "hunter", "buster", "soccer", "batman", "andrew", "tigger",
  "superman", "pokemon", "ginger", "michelle", "jessica", "pepper",
  "computer", "internet", "michelle1", "maggie", "ashley", "jennifer",
  "joshua", "cheese", "amanda", "summer", "love", "secret",
  "killer", "hottie", "george", "matrix", "naruto", "mustang",
  "access", "flower", "silver", "yellow", "daniel", "robert",
  "babygirl", "loveme", "nicole", "jasmine", "jordan", "buster1",
  "michael", "corvette", "test123", "passw0rd", "starwars", "whatever1",
  "monkey1", "letmein", "shadow", "bailey", "donald123", "asdfgh",
  "qwertyuiop", "zaq12wsx", "login", "admin123", "welcome123", "root",
  "toor", "user", "guest", "temp123"
];

const BRUTEFORCE_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ASSUMED_CRACK_RATE = 1e9;
let crackingChart = null;
let commonPasswords = [...DEFAULT_WORDLIST];

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
loadWordlist();

function analyzePassword() {
  const password = passwordInput.value;
  const metrics = calculatePasswordMetrics(password);
  updateStrengthUI(metrics);
  drawChart(metrics);
  return metrics;
}

function calculatePasswordMetrics(password) {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "At least 12 characters", passed: password.length >= 12 },
    { label: "Contains uppercase letters", passed: /[A-Z]/.test(password) },
    { label: "Contains lowercase letters", passed: /[a-z]/.test(password) },
    { label: "Contains numbers", passed: /\d/.test(password) },
    { label: "Contains special characters", passed: /[^A-Za-z0-9]/.test(password) }
  ];

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSpecial) charsetSize += 32;

  const baseScore = checks.filter((check) => check.passed).length;
  const entropy = password.length && charsetSize
    ? password.length * Math.log2(charsetSize)
    : 0;
  const isCommonPassword = commonPasswords.includes(password.toLowerCase());

  let score = baseScore;
  if (entropy >= 60) score += 1;
  if (password.length >= 16) score += 1;
  if (isCommonPassword) score = Math.max(score - 3, 0);

  let rating = "Weak";
  let meterWidth = 28;
  let meterColor = "#ff6a7a";

  if (score >= 7) {
    rating = "Strong";
    meterWidth = 100;
    meterColor = "#6ef2c7";
  } else if (score >= 4) {
    rating = "Medium";
    meterWidth = 64;
    meterColor = "#ffb84d";
  }

  const estimatedSeconds = charsetSize && password.length
    ? Math.pow(charsetSize, password.length) / ASSUMED_CRACK_RATE
    : 0;

  return {
    password,
    checks,
    charsetSize,
    entropy,
    estimatedSeconds,
    rating,
    meterWidth,
    meterColor,
    isCommonPassword
  };
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
    warning.textContent = "FAIL - This password appears in a common password list.";
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

function runDictionaryAttack() {
  const password = passwordInput.value;
  if (!password) {
    setAttackMessage("Enter a password before running attacks.", "warning");
    return;
  }

  const start = performance.now();
  const foundIndex = commonPasswords.findIndex((entry) => entry === password.toLowerCase());
  const end = performance.now();
  const elapsed = end - start;
  const checks = foundIndex >= 0 ? foundIndex + 1 : commonPasswords.length;

  document.getElementById("dictionaryChecks").textContent = String(checks);
  document.getElementById("measuredTime").textContent = `${elapsed.toFixed(4)} ms`;

  if (foundIndex >= 0) {
    setAttackMessage(
      `Dictionary attack succeeded. The password was found after ${checks} checks in ${elapsed.toFixed(4)} ms.`,
      "danger"
    );
  } else {
    setAttackMessage(
      `Dictionary attack failed. ${checks} common passwords were checked in ${elapsed.toFixed(4)} ms.`,
      "success"
    );
  }
}

async function loadWordlist() {
  try {
    const response = await fetch("wordlist.txt", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load wordlist: ${response.status}`);
    }

    const text = await response.text();
    const loadedWords = text
      .split(/\r?\n/)
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean);

    if (loadedWords.length > 0) {
      commonPasswords = loadedWords;
    }
  } catch (error) {
    console.warn("Using fallback dictionary wordlist.", error);
  }
}

function runBruteForce() {
  const password = passwordInput.value.toLowerCase();
  if (!password) {
    setAttackMessage("Enter a password before running attacks.", "warning");
    return;
  }

  if (!/^[a-z0-9]+$/.test(password)) {
    setAttackMessage(
      "Brute-force simulation only supports lowercase letters and numbers for this demo.",
      "warning"
    );
    return;
  }

  if (password.length > 4) {
    setAttackMessage(
      "Brute-force simulation is limited to passwords of 4 characters or fewer to avoid freezing the browser.",
      "warning"
    );
    return;
  }

  const start = performance.now();
  let attempts = 0;
  let cracked = false;

  for (let length = 1; length <= password.length && !cracked; length += 1) {
    cracked = tryLength(length, "");
  }

  const end = performance.now();
  const elapsed = end - start;

  document.getElementById("bruteAttempts").textContent = attempts.toLocaleString();
  document.getElementById("measuredTime").textContent = `${elapsed.toFixed(4)} ms`;

  if (cracked) {
    setAttackMessage(
      `Brute-force estimate: password cracked after approximately ${attempts.toLocaleString()} attempts in ${elapsed.toFixed(4)} ms of simulation time.`,
      "danger"
    );
  } else {
    setAttackMessage("Password was not cracked within the brute-force limit.", "success");
  }

  function tryLength(targetLength, prefix) {
    if (prefix.length === targetLength) {
      attempts += 1;
      return prefix === password;
    }

    for (const character of BRUTEFORCE_CHARSET) {
      if (tryLength(targetLength, prefix + character)) {
        return true;
      }
    }

    return false;
  }
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
