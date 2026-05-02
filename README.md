# Password Cracking and Strength Analyzer

A Python-powered web project for evaluating password strength and simulating two classic attack techniques:

- Password strength checker
- Dictionary attack simulation
- Limited brute-force simulation
- Graph of password length vs cracking time

## Features

- Rates passwords as `Weak`, `Medium`, or `Strong`
- Checks length, uppercase, lowercase, numbers, and special characters
- Estimates entropy and offline cracking time
- Measures runtime for dictionary and brute-force simulations
- Runs the analysis and attack logic in Python
- Displays a logarithmic cracking-time chart using Chart.js

## Files

- [app.py](./app.py) - Python backend server and core password logic
- [index.html](./index.html) - app layout
- [style.css](./style.css) - UI styling
- [script.js](./script.js) - frontend UI updates and API calls to Python
- [wordlist.txt](./wordlist.txt) - external dictionary wordlist used by the Python dictionary attack

## How to Run

1. Download or clone the project.
2. Open a terminal in the project folder.
3. Run:

```bash
python app.py
```

4. Open `http://127.0.0.1:8000` in your browser.
5. Enter a password and click `Analyze`.
6. Run `Dictionary Attack` or `Brute Force` to view results.

## Notes

- The main project logic now runs in `app.py`, so this qualifies as a Python-based project.
- The dictionary attack loads passwords from `wordlist.txt`, with a fallback list inside `app.py` if the file cannot be loaded.
- The brute-force demo is limited to lowercase letters and numbers, and to passwords of length `<= 4` for practical runtime.
- The cracking-time chart is an estimate based on character-set size and an assumed attack speed.
- Because the project now has a Python backend, it will not run on GitHub Pages. Use GitHub for source code hosting, and run it locally or deploy it to a Python-friendly host such as Render, Railway, or PythonAnywhere.

## Suggested Report Points

- Compare weak and strong passwords using the strength meter.
- Show dictionary attack success for common passwords.
- Show why short passwords are vulnerable to brute force.
- Explain why cracking time grows exponentially with length.
- Explain that Python performs the actual password analysis, dictionary matching, and brute-force simulation while JavaScript only handles the page and graph.
