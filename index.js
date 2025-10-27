const fs = require('fs')
const path = require('path')
const os = require('os')

const DATA_PATH = path.join(os.homedir(), '.expenses_data.json')

function loadData () {
  try {
    if (!fs.existsSync(DATA_PATH)) return { expenses: [], budgets: {} }
    const raw = fs.readFileSync(DATA_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load data:', e.message)
    process.exit(1)
  }
}

function saveData (data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
  } catch (e) {
    console.error('Failed to save data:', e.message)
    process.exit(1)
  }
}

function usage () {
  console.log(`Usage:
  add <description> <amount> [--category <cat>] [--date YYYY-MM-DD]
  update <id> [--description <desc>] [--amount <amt>] [--category <cat>] [--date YYYY-MM-DD]
  delete <id>
  list [--category <cat>] [--month <1-12>]
  summary
  monthly-summary <month>
  set-budget <month> <amount>
  show-budget <month>
  export <filename> [--month <1-12>] [--category <cat>]
  help
`)
}

function parseArgs (argv) {
  const args = { _: [] }
  let i = 0
  while (i < argv.length) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) {
        args[key] = true
        i += 1
      } else {
        args[key] = next
        i += 2
      }
    } else {
      args._.push(a)
      i += 1
    }
  }
  return args
}

function nextId (expenses) {
  if (!expenses || expenses.length === 0) return 1
  return Math.max(...expenses.map(e => e.id)) + 1
}

function isValidDateStr (s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime())
}

function cmdAdd (args) {
  const description = args._[1]
  const amountS = args._[2]
  if (!description || !amountS) {
    console.error('add requires description and amount')
    usage()
    process.exit(1)
  }
  const amount = Number(amountS)
  if (isNaN(amount)) {
    console.error('amount must be a number')
    process.exit(1)
  }
  const category = args.category || null
  const dateStr = args.date || new Date().toISOString().slice(0, 10)
  if (!isValidDateStr(dateStr)) {
    console.error('date must be YYYY-MM-DD')
    process.exit(1)
  }

  const data = loadData()
  const id = nextId(data.expenses)
  const expense = {
    id,
    description,
    amount: Number(amount.toFixed(2)),
    category,
    date: dateStr,
    created_at: new Date().toISOString()
  }
  data.expenses.push(expense)
  saveData(data)
  console.log('Added expense id=' + id)
  checkBudgetWarning(data, expense)
}

function cmdUpdate (args) {
  const id = Number(args._[1])
  if (isNaN(id)) {
    console.error('update requires numeric id')
    usage()
    process.exit(1)
  }
  const data = loadData()
  const idx = data.expenses.findIndex(e => e.id === id)
  if (idx === -1) {
    console.error('No expense with id', id)
    process.exit(1)
  }
  const exp = data.expenses[idx]
  if (args.description) exp.description = args.description
  if (args.amount) {
    const a = Number(args.amount)
    if (isNaN(a)) {
      console.error('amount must be numeric')
      process.exit(1)
    }
    exp.amount = Number(a.toFixed(2))
  }
  if (args.category !== undefined)
    exp.category = args.category === 'null' ? null : args.category
  if (args.date) {
    if (!isValidDateStr(args.date)) {
      console.error('date must be YYYY-MM-DD')
      process.exit(1)
    }
    exp.date = args.date
  }
  data.expenses[idx] = exp
  saveData(data)
  console.log('Updated expense id=' + id)
}

function cmdDelete (args) {
  const id = Number(args._[1])
  if (isNaN(id)) {
    console.error('delete requires numeric id')
    process.exit(1)
  }
  const data = loadData()
  const before = data.expenses.length
  data.expenses = data.expenses.filter(e => e.id !== id)
  if (data.expenses.length === before) {
    console.error('No expense with id', id)
    process.exit(1)
  }
  saveData(data)
  console.log('Deleted expense id=' + id)
}

function formatExpense (e) {
  return `${e.id}: ${e.date} | ${e.category || '-'} | ${
    e.description
  } | ${e.amount.toFixed(2)}`
}

function cmdList (args) {
  const data = loadData()
  let list = data.expenses.slice().sort((a, b) => a.date.localeCompare(b.date))
  if (args.category) list = list.filter(e => e.category === args.category)
  if (args.month) {
    const m = Number(args.month)
    if (isNaN(m) || m < 1 || m > 12) {
      console.error('--month must be 1-12')
      process.exit(1)
    }
    const year = new Date().getFullYear()
    list = list.filter(e => {
      const dt = new Date(e.date + 'T00:00:00')
      return dt.getFullYear() === year && dt.getMonth() + 1 === m
    })
  }
  if (list.length === 0) {
    console.log('No expenses found.')
    return
  }
  list.forEach(e => console.log(formatExpense(e)))
}

function summaryAll () {
  const data = loadData()
  const total = data.expenses.reduce((s, e) => s + e.amount, 0)
  const byCat = {}
  data.expenses.forEach(e => {
    const c = e.category || 'Uncategorized'
    byCat[c] = (byCat[c] || 0) + e.amount
  })
  console.log('Total expenses:', total.toFixed(2))
  console.log('By category:')
  Object.keys(byCat).forEach(c => console.log(`  ${c}: ${byCat[c].toFixed(2)}`))
}

function monthlySummary (args) {
  const m = Number(args._[1])
  if (isNaN(m) || m < 1 || m > 12) {
    console.error('monthly-summary requires month 1-12')
    process.exit(1)
  }
  const year = new Date().getFullYear()
  const data = loadData()
  const items = data.expenses.filter(e => {
    const dt = new Date(e.date + 'T00:00:00')
    return dt.getFullYear() === year && dt.getMonth() + 1 === m
  })
  const total = items.reduce((s, e) => s + e.amount, 0)
  console.log(`Summary for ${year}-${String(m).padStart(2, '0')}:`)
  console.log('  Total:', total.toFixed(2))
  const byCat = {}
  items.forEach(e => {
    const c = e.category || 'Uncategorized'
    byCat[c] = (byCat[c] || 0) + e.amount
  })
  console.log('  By category:')
  Object.keys(byCat).forEach(c =>
    console.log(`    ${c}: ${byCat[c].toFixed(2)}`)
  )
  const budgetKey = `${year}-${String(m).padStart(2, '0')}`
  if (data.budgets && data.budgets[budgetKey] !== undefined) {
    const b = data.budgets[budgetKey]
    console.log('  Budget:', b.toFixed(2))
    if (total > b) console.log("  ⚠️  You have exceeded this month's budget!")
  }
}

function cmdSetBudget (args) {
  const m = Number(args._[1])
  const amt = Number(args._[2])
  if (isNaN(m) || m < 1 || m > 12 || isNaN(amt)) {
    console.error('set-budget requires month(1-12) and amount')
    process.exit(1)
  }
  const year = new Date().getFullYear()
  const key = `${year}-${String(m).padStart(2, '0')}`
  const data = loadData()
  data.budgets = data.budgets || {}
  data.budgets[key] = Number(amt.toFixed(2))
  saveData(data)
  console.log(`Set budget for ${key} = ${amt.toFixed(2)}`)
}

function cmdShowBudget (args) {
  const m = Number(args._[1])
  if (isNaN(m) || m < 1 || m > 12) {
    console.error('show-budget requires month(1-12)')
    process.exit(1)
  }
  const year = new Date().getFullYear()
  const key = `${year}-${String(m).padStart(2, '0')}`
  const data = loadData()
  if (data.budgets && data.budgets[key] !== undefined) {
    console.log(`${key} budget: ${data.budgets[key].toFixed(2)}`)
  } else {
    console.log(`No budget set for ${key}`)
  }
}

function cmdExport (args) {
  const filename = args._[1]
  if (!filename) {
    console.error('export requires filename')
    process.exit(1)
  }
  const data = loadData()
  let list = data.expenses.slice().sort((a, b) => a.date.localeCompare(b.date))
  if (args.month) {
    const m = Number(args.month)
    if (isNaN(m) || m < 1 || m > 12) {
      console.error('--month must be 1-12')
      process.exit(1)
    }
    const year = new Date().getFullYear()
    list = list.filter(e => {
      const dt = new Date(e.date + 'T00:00:00')
      return dt.getFullYear() === year && dt.getMonth() + 1 === m
    })
  }
  if (args.category) list = list.filter(e => e.category === args.category)
  const rows = list.map(e => ({
    id: e.id,
    date: e.date,
    category: e.category || '',
    description: e.description,
    amount: e.amount
  }))
  const csv = [
    'id,date,category,description,amount',
    ...rows.map(
      r =>
        `${r.id},"${r.date}","${r.category.replace(
          /"/g,
          '""'
        )}","${r.description.replace(/"/g, '""')}",${r.amount.toFixed(2)}`
    )
  ].join('\n')
  fs.writeFileSync(filename, csv, 'utf8')
  console.log('Exported', rows.length, 'rows to', filename)
}

function checkBudgetWarning (data, expense) {
  if (!expense || !expense.date) return
  const dt = new Date(expense.date + 'T00:00:00')
  const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
    2,
    '0'
  )}`
  const budget = data.budgets && data.budgets[key]
  if (!budget) return
  const monthTotal = data.expenses
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00')
      return (
        d.getFullYear() === dt.getFullYear() &&
        d.getMonth() + 1 === dt.getMonth() + 1
      )
    })
    .reduce((s, e) => s + e.amount, 0)
  if (monthTotal > budget) {
    console.log(
      '⚠️  Warning: monthly budget exceeded for',
      key,
      `(budget ${budget.toFixed(2)}, spent ${monthTotal.toFixed(2)})`
    )
  }
}

function cmdSummary (args) {
  summaryAll()
}

function main () {
  const raw = process.argv.slice(2)
  if (raw.length === 0) {
    usage()
    process.exit(0)
  }
  const args = parseArgs(raw)
  const cmd = args._[0]
  switch (cmd) {
    case 'help':
      usage()
      break
    case 'add':
      cmdAdd(args)
      break
    case 'update':
      cmdUpdate(args)
      break
    case 'delete':
      cmdDelete(args)
      break
    case 'list':
      cmdList(args)
      break
    case 'summary':
      cmdSummary(args)
      break
    case 'monthly-summary':
      monthlySummary(args)
      break
    case 'set-budget':
      cmdSetBudget(args)
      break
    case 'show-budget':
      cmdShowBudget(args)
      break
    case 'export':
      cmdExport(args)
      break
    default:
      console.error('Unknown command:', cmd)
      usage()
      process.exit(1)
  }
}

if (require.main === module) main()
