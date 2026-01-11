# How to Deploy Your Website

This guide provides the step-by-step instructions to deploy your website to Firebase App Hosting and connect a custom domain.

You will need to run these commands on your local computer's terminal.

---

### Step 1: Install the Firebase CLI

If you don't have it installed already, open a terminal and run this command. This only needs to be done once.

```bash
npm install -g firebase-tools
```

---

### Step 2: Log In to Firebase

Connect the Firebase CLI to your Google account.

```bash
firebase login
```

A browser window will open, asking you to log in and authorize the CLI.

---

### Step 3: Initialize App Hosting

Navigate to your project's root directory in your terminal. Then, run the following command to link your local project to your Firebase project.

```bash
firebase init apphosting
```

You will be prompted to select your Firebase project from a list.

---

### Step 4: Build Your Website for Production

This command creates a highly optimized version of your website that is ready for deployment.

```bash
npm run build
```

---

### Step 5: Deploy to Firebase

This is the final command to launch your website. It will upload your built files to Firebase Hosting.

```bash
firebase deploy
```

After this command finishes, your website will be live on a Firebase-provided URL (like `your-project-id.web.app`).

---

### Step 6: Connect Your Custom Domain

To use your own domain (e.g., `www.yourcompany.com`):

1.  **Go to the Firebase Console**: Open your project in the [Firebase Console](https://console.firebase.google.com/).
2.  **Navigate to App Hosting**: In the left-hand menu, under the "Build" section, click on **App Hosting**.
3.  **Add Custom Domain**: Click the **"Add custom domain"** button.
4.  **Follow the Instructions**: Firebase will provide you with DNS records (like A, AAAA, or CNAME records). You need to copy these records and add them to your domain registrar's settings (e.g., GoDaddy, Google Domains, Namecheap).

This process proves you own the domain and points it to your new website. It can sometimes take a few hours for the changes to take effect across the internet.

Congratulations on getting ready to launch!