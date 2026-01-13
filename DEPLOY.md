# How to Deploy Your Website to GitHub Pages

This guide provides the step-by-step instructions to automatically deploy your website to GitHub Pages and connect a custom domain.

---

### Step 1: Create a GitHub Repository

1.  **Sign up or log in** to your account at [github.com](https://github.com).
2.  Create a **new repository**. You can name it whatever you like (e.g., `my-website`). Make sure it is "Public".

---

### Step 2: Push Your Code to GitHub

Open a terminal on your local computer, navigate to your project's root directory, and run the following commands.

*Replace `<YOUR_GITHUB_URL>` with the URL of the repository you just created.*

```bash
# Initialize git if you haven't already
git init -b main

# Add all your project files
git add .

# Save your changes
git commit -m "Initial commit"

# Connect your local project to your GitHub repository
git remote add origin <YOUR_GITHUB_URL>

# Upload your code
git push -u origin main
```

---

### Step 3: Enable GitHub Pages

1.  Go to your repository on GitHub.
2.  Click on the **"Settings"** tab.
3.  In the left sidebar, click on **"Pages"**.
4.  Under "Build and deployment", change the "Source" from "Deploy from a branch" to **"GitHub Actions"**.

That's it! GitHub will now automatically build and deploy your website. Wait a few minutes, and your site will be live at a URL like `https://your-username.github.io/your-repository-name/`.

**Every time you `git push` new changes to your `main` branch, your website will be automatically updated.**

---

### Step 4 (Optional): Connect Your Custom Domain

1.  **Go to your repository's "Settings" > "Pages" page.**
2.  Under the **"Custom domain"** section, enter your domain name (e.g., `www.yourcompany.com`) and click **"Save"**.
3.  **Configure your DNS records.** GitHub will show you the DNS records you need to add at your domain registrar (e.g., GoDaddy, Namecheap, Google Domains). This usually involves adding one `A` record and one `CNAME` record.

It may take a few hours for the DNS changes to take effect. Once they do, your website will be accessible via your custom domain.
