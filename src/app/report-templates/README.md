# PDF Report Template System

This directory contains a set of professional, government-style HTML and CSS templates designed for server-side PDF generation using a tool like Puppeteer.

## Architecture Overview

The system is built on a modular, template-based architecture:

1.  **`base-template.html`**: This is the master layout file. It includes the document structure (`<html>`, `<head>`, `<body>`), a link to the stylesheet, and the fixed header and footer that will appear on every page of the report. It has a `{{content}}` placeholder where specific report data (like tables) should be injected.

2.  **`styles.css`**: This file contains all the styling for the reports, optimized for print (`@media print`).
    *   **CSS Variables**: At the top of the file, all design tokens (colors, fonts, spacing) are defined as CSS variables. You can change the entire look and feel of the reports just by modifying these variables.
    *   **Page Layout**: It defines the A4 landscape layout, margins, and the fixed positioning of the header and footer.
    *   **Table Styling**: It includes professional, Excel-like styling for tables, ensuring that table headers repeat on every page and that rows do not break across page splits.

3.  **`list-templates.html`**: This file contains example HTML snippets for different types of report tables (e.g., Sales, Inventory, Employee lists). These blocks are designed to be rendered with your data and then injected into the `{{content}}` placeholder in the `base-template.html`.

## How to Use with Puppeteer

Here is a conceptual guide to generating a PDF on the server:

1.  **Read Templates**: Read the content of `base-template.html` and the appropriate list template from `list-templates.html`.

2.  **Prepare Data**: Fetch the data you need for the report (e.g., from your database).

3.  **Render the Table**: Loop through your data to generate the `<tbody>` content for your chosen list template. For example, if you are creating a Sales Report, you would generate all the `<tr>` elements for the sales items.

4.  **Inject Content**:
    *   Replace the `{{listTitle}}` and other table-specific placeholders in your list template with the rendered table content.
    *   Inject the completed list HTML into the `{{content}}` placeholder within `base-template.html`.

5.  **Replace Global Placeholders**: Replace all remaining placeholders in the base template (`{{reportTitle}}`, `{{reportDate}}`, `{{companyLogoUrl}}`, etc.) with their final values.

6.  **Generate PDF with Puppeteer**:
    *   Launch a new Puppeteer browser instance.
    *   Create a new page and set its content to your final, merged HTML.
    *   Use `page.pdf()` to generate the PDF. Key options include:
        *   `format: 'A4'`: Sets the page size.
        *   `landscape: true`: Sets the orientation.
        *   `printBackground: true`: Ensures background colors are rendered.
        *   `displayHeaderFooter: false`: Our HTML/CSS handles the header and footer, so we disable Puppeteer's default.
        *   `margin`: Set margins if needed, although the CSS `@page` rule is preferred.

    ```javascript
    // Example Puppeteer Code Snippet
    const puppeteer = require('puppeteer');

    async function generatePdf(htmlContent) {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        displayHeaderFooter: false, // Important: Our CSS handles this
        margin: {
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px'
        }
      });
      
      await browser.close();
      return pdfBuffer;
    }
    ```

This architecture gives you full control over the report's design through simple CSS variable changes, while the HTML structure remains clean and focused on the data.