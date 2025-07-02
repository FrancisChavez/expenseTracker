
const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs').promises; // Use the promise-based API

const EXPENSES_FILE = 'expenses.json'; // Centralize the filename

app.use(express.static('public'));
app.use(express.json());

app.get('/api/expenses', async (req, res) => {
    try {
        let data = await fs.readFile(EXPENSES_FILE, 'utf8');
        let expenses = JSON.parse(data);
        let changed = false;

        // Assign IDs to old records if they don't have one and add user info for old records
        expenses = expenses.map(expense => {
            if (!expense.id) {
                expense.id = `migrated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // Unique ID for migrated records
                changed = true;
            }
            // Add user display name for old records that don't have it
            if (!expense.userDisplay) {
                expense.userDisplay = 'Unknown';
                changed = true;
            }
            return expense;
        });

        if (changed) {
            await fs.writeFile(EXPENSES_FILE, JSON.stringify(expenses, null, 2)); // Save updated expenses
        }
        res.send(JSON.stringify(expenses));
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File not found, return empty array for a new project
            res.send('[]');
        } else {
            console.error('Error reading expenses data:', err);
            res.status(500).send('Error reading expenses data.');
        }
    }
});

app.post('/api/expenses', async (req, res) => {
    const newExpense = req.body;
    newExpense.id = Date.now().toString(); // Add a unique ID
    newExpense.createdAt = new Date().toISOString(); // Add timestamp
    
    // Map username to display name
    let displayName = 'Unknown';
    if (newExpense.user === 'francis') {
        displayName = 'Franz';
    } else if (newExpense.user === 'Mhai017') {
        displayName = 'Mhai';
    }
    newExpense.userDisplay = displayName;
    
    try {
        let expenses = [];
        try {
            const data = await fs.readFile(EXPENSES_FILE, 'utf8');
            expenses = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err; // Re-throw if it's not just file not found
        }
        expenses.push(newExpense);
        await fs.writeFile(EXPENSES_FILE, JSON.stringify(expenses, null, 2));
        res.status(201).send(newExpense);
    } catch (err) {
        console.error('Error saving expense:', err);
        res.status(500).send('Error saving expense.');
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await fs.readFile(EXPENSES_FILE, 'utf8');
        let expenses = JSON.parse(data);

        const initialLength = expenses.length;
        expenses = expenses.filter(expense => expense.id !== id);

        if (expenses.length === initialLength) {
            return res.status(404).send('Expense not found.');
        }

        await fs.writeFile(EXPENSES_FILE, JSON.stringify(expenses, null, 2));
        res.status(200).send({ message: 'Expense deleted successfully.' });
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).send('Expense not found.');
        }
        console.error('Error deleting expense:', err);
        res.status(500).send('Error deleting expense.');
    }
});

app.put('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    const updatedExpenseData = req.body; // This will contain description, amount, source

    try {
        const data = await fs.readFile(EXPENSES_FILE, 'utf8');
        let expenses = JSON.parse(data);

        const expenseIndex = expenses.findIndex(expense => expense.id === id);

        if (expenseIndex === -1) {
            return res.status(404).send('Expense not found.');
        }

        // Update only allowed fields, preserve createdAt and original ID
        expenses[expenseIndex] = { ...expenses[expenseIndex], ...updatedExpenseData };

        await fs.writeFile(EXPENSES_FILE, JSON.stringify(expenses, null, 2));
        res.status(200).send(expenses[expenseIndex]); // Send back the updated expense
    } catch (err) {
        console.error('Error updating expense:', err);
        res.status(500).send('Error updating expense.');
    }
});

app.listen(port, () => {
    console.log(`Expense tracker app listening at http://localhost:${port}`);
});
