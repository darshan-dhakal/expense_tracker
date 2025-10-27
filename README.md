# 💰 Expense Tracker CLI (Node.js)

A **powerful and minimal command-line expense tracker** built with pure **Node.js**, designed to help you take control of your finances directly from the terminal. Add, update, delete, and analyze your expenses — no database setup, no external dependencies, just you and your budget.

---

## 🚀 Features

✅ **Add expenses** with description, amount, category, and date
✅ **Update or delete** existing expenses easily
✅ **View all expenses** or filter by category/month
✅ **Get summary reports** (total + by category)
✅ **Monthly summaries** for better insights
✅ **Set and track budgets** per month — get warnings when you exceed them
✅ **Export data to CSV** for sharing or analysis
✅ **100% offline** — data stored locally in a JSON file (`~/.expenses_data.json`)
✅ **No frameworks** — built from scratch with love ❤️

---

## 📦 Installation

Clone this repository:

```bash
git clone https://github.com/<your-username>/expense-tracker-cli.git
cd expense-tracker-cli
```

Make the script executable (optional on macOS/Linux):

```bash
chmod +x expense-tracker.js
```

Run using Node.js:

```bash
node expense-tracker.js help
```

---

## 🧠 Usage Examples

### ➕ Add an expense

```bash
node expense-tracker.js add "Lunch" 12.50 --category Food --date 2025-10-26
```

### 🔁 Update an expense

```bash
node expense-tracker.js update 3 --amount 15.0
```

### ❌ Delete an expense

```bash
node expense-tracker.js delete 5
```

### 📋 View all expenses

```bash
node expense-tracker.js list
```

### 🧾 View summary

```bash
node expense-tracker.js summary
```

### 📅 Monthly summary (October)

```bash
node expense-tracker.js monthly-summary 10
```

### 💸 Set a budget

```bash
node expense-tracker.js set-budget 10 300.0
```

### 📤 Export to CSV

```bash
node expense-tracker.js export october.csv --month 10
```

---

## 📂 Data Storage

All expenses and budgets are safely stored in your home directory:

```
~/.expenses_data.json
```

No cloud, no tracking — **your data stays with you.**

---

## 🧩 Project Structure

```
├── expense-tracker.js   # Main CLI script
├── README.md            # You're reading it!
```

---

## ⚙️ Tech Stack

* **Node.js** (no frameworks)
* **File System (fs)** for data persistence
* **CSV Export** support

---

## 💪 Behind the Code

This project was built with **dedication and persistence** — written entirely from scratch to strengthen Node.js fundamentals and command-line app design. Every feature, from budget warnings to category summaries, is handcrafted with care to make personal finance simple and empowering.

---

## 🌟 Future Enhancements

* [ ] SQLite backend option
* [ ] Pretty CLI using chalk/commander
* [ ] Cloud sync support
* [ ] Dashboard web UI

---

## 🧑‍💻 Author

**Darshan Dhakal**
📍 Passionate Developer | Learner | Builder
If you like this project, don’t forget to ⭐ **star** the repo!

---

### "Track your expenses. Master your money. Own your future."
