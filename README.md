# Password Cracking and Strength Analyzer

A browser-based mini project for evaluating password strength and simulating two classic attack techniques:

- Password strength checker
- Dictionary attack simulation
- Limited brute-force simulation
- Graph of password length vs cracking time

## Features

- Rates passwords as `Weak`, `Medium`, or `Strong`
- Checks length, uppercase, lowercase, numbers, and special characters
- Estimates entropy and offline cracking time
- Measures runtime for dictionary and brute-force simulations
- Displays a logarithmic cracking-time chart using Chart.js

## Files

- [index.html](./index.html) - app layout
- [style.css](./style.css) - UI styling
- [script.js](./script.js) - analyzer and attack logic

## How to Run

1. Download or clone the project.
2. Open `index.html` in a browser.
3. Enter a password and click `Analyze`.
4. Run `Dictionary Attack` or `Brute Force` to view results.

## Notes

- The dictionary attack uses a sample list of common passwords.
- The brute-force demo is limited to lowercase letters and numbers, and to passwords of length `<= 4`.
- The cracking-time chart is an estimate based on character-set size and an assumed attack speed.

## GitHub Upload

Run these commands in the project folder after creating your GitHub repository:

```bash
git init
git add .
git commit -m "Create password cracking and strength analyzer"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## GitHub Pages

To publish the website:

1. Open your repository on GitHub.
2. Go to `Settings > Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select branch `main` and folder `/root`.
5. Save and wait for the Pages link to appear.

## Suggested Report Points

- Compare weak and strong passwords using the strength meter.
- Show dictionary attack success for common passwords.
- Show why short passwords are vulnerable to brute force.
- Explain why cracking time grows exponentially with length.
