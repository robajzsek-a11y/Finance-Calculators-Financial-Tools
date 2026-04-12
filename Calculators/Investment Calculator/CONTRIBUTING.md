# Contributing Guide

Thank you for your interest in contributing to Investment-Calculator.  
This document describes the recommended workflow and guidelines for contributors.

## Project Structure

The project is built with plain HTML, CSS, and JavaScript.  
Key directories:

- `css/` – base styles, layout, animations, and component-level CSS  
- `data/` – static data files (ETFs, translations)  
- `app.js` – main application logic  
- `calculator.js` – core calculation functions  
- `chart.js` – chart rendering logic  
- `index.html` – main entry point

Please keep new files consistent with this structure.

## Running the Project Locally

No build tools are required.

1. Clone the repository.
2. Open `index.html` directly in your browser.

All calculations run locally in the browser.

## Coding Standards

- Follow the existing folder and file organization.
- Keep functions small, clear, and focused.
- Prefer readability over cleverness.
- Avoid introducing external dependencies unless necessary.
- Keep UI changes consistent with the minimalist design.

## Commit Message Guidelines

This project uses the Conventional Commits format:

- `feat:` for new features  
- `fix:` for bug fixes  
- `refactor:` for internal code improvements  
- `docs:` for documentation updates  
- `style:` for formatting-only changes  
- `test:` for tests

Example:  
`feat: add inflation-adjusted milestone calculation`

## Pull Request Process

1. Create a separate branch for your change.
2. Ensure the project works correctly in the browser.
3. Keep pull requests focused and concise.
4. Describe what the PR changes and why.
5. Reference related issues when applicable.

## Reporting Issues

When opening an issue, please include:

- A clear description of the problem  
- Steps to reproduce  
- Expected vs. actual behavior  
- Screenshots if relevant  

## Feature Requests

If you have an idea for improvement:

- Open an issue describing the feature and its purpose  
- Explain why it would be useful  
- Provide examples or reasoning if helpful  

---

Thank you for contributing and helping improve the project.