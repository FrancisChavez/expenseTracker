const express = require('express');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3001;
const fs = require('fs').promises; // Use the promise-based API
const crypto = require('crypto');

const EXPENSES_FILE = 'expenses.json'; // Centralize the filename
const BACKUP_FILE = 'expenses.backup.json'; // Backup file for import safety

// Valid credentials - move to backend for security
const VALID_CREDENTIALS = [
    { username: 'francis', password: 'Skiculot1717!', displayName: 'Franz' },
    { username: 'Mhai017', password: 'Skiculot1717!', displayName: 'Mhai' }
];

// Session middleware configuration
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS directly (Cloudflare handles HTTPS)
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

app.use(express.static('public'));
app.use(express.json());

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
};

// Auth endpoints
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = VALID_CREDENTIALS.find(cred =>
        cred.username === username && cred.password === password
    );

    if (user) {
        req.session.user = {
            username: user.username,
            displayName: user.displayName
        };
        res.json({
            success: true,
            user: {
                username: user.username,
                displayName: user.displayName
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid username or password.' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Failed to logout.' });
        } else {
            res.clearCookie('connect.sid');
            res.json({ success: true });
        }
    });
});

app.get('/api/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/expenses', requireAuth, async (req, res) => {
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

app.post('/api/expenses', requireAuth, async (req, res) => {
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

app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
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

app.put('/api/expenses/:id', requireAuth, async (req, res) => {
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

app.post('/api/import', requireAuth, async (req, res) => {
    const { expenses } = req.body;
    if (!Array.isArray(expenses) || expenses.length === 0) {
        return res.status(400).json({ error: 'No expenses provided.' });
    }
    try {
        // Create backup of current data before overwriting
        let backupCreated = false;
        let backupCount = 0;
        try {
            const currentData = await fs.readFile(EXPENSES_FILE, 'utf8');
            const currentExpenses = JSON.parse(currentData);
            backupCount = currentExpenses.length;
            if (backupCount > 0) {
                await fs.writeFile(BACKUP_FILE, currentData);
                backupCreated = true;
                console.log(`Backup created: ${backupCount} expenses saved to ${BACKUP_FILE}`);
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error('Error creating backup:', err);
            }
            // Continue with import even if backup fails (no existing data)
        }

        // Normalize each expense
        const normalized = expenses.map((exp, idx) => {
            let user = exp.user;
            let userDisplay = exp.userDisplay;
            // Map userDisplay to user if only display is present
            if (!user && userDisplay) {
                if (userDisplay === 'Franz') user = 'francis';
                else if (userDisplay === 'Mhai') user = 'Mhai017';
            }
            // Map user to userDisplay if only user is present
            if (!userDisplay && user) {
                if (user === 'francis') userDisplay = 'Franz';
                else if (user === 'Mhai017') userDisplay = 'Mhai';
            }
            // Fallbacks
            if (!user) user = '';
            if (!userDisplay) userDisplay = 'Unknown';
            return {
                id: exp.id || Date.now().toString() + '-' + idx,
                description: exp.description || '',
                amount: exp.amount || '',
                source: exp.source || '',
                createdAt: exp.createdAt || new Date().toISOString(),
                user,
                userDisplay
            };
        });

        await fs.writeFile(EXPENSES_FILE, JSON.stringify(normalized, null, 2));
        res.status(200).json({
            message: 'Import successful.',
            imported: normalized.length,
            backupCreated,
            backupCount
        });
    } catch (err) {
        console.error('Error importing expenses:', err);
        res.status(500).json({ error: 'Failed to import expenses.' });
    }
});

// Get backup info
app.get('/api/backup-info', requireAuth, async (req, res) => {
    try {
        const stats = await fs.stat(BACKUP_FILE);
        const data = await fs.readFile(BACKUP_FILE, 'utf8');
        const expenses = JSON.parse(data);
        res.json({
            exists: true,
            count: expenses.length,
            createdAt: stats.mtime.toISOString()
        });
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.json({ exists: false });
        } else {
            console.error('Error reading backup info:', err);
            res.status(500).json({ error: 'Failed to read backup info.' });
        }
    }
});

// Restore from backup
app.post('/api/restore', requireAuth, async (req, res) => {
    try {
        // Check if backup exists
        const backupData = await fs.readFile(BACKUP_FILE, 'utf8');
        const backupExpenses = JSON.parse(backupData);

        // Get current data count for response
        let currentCount = 0;
        try {
            const currentData = await fs.readFile(EXPENSES_FILE, 'utf8');
            currentCount = JSON.parse(currentData).length;
        } catch (err) {
            // No current data, that's fine
        }

        // Restore backup to main file
        await fs.writeFile(EXPENSES_FILE, backupData);

        res.json({
            message: 'Restore successful.',
            restored: backupExpenses.length,
            replaced: currentCount
        });
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'No backup file found.' });
        } else {
            console.error('Error restoring backup:', err);
            res.status(500).json({ error: 'Failed to restore backup.' });
        }
    }
});

app.listen(port, () => {
    console.log(`Expense tracker app listening at http://localhost:${port}`);
});
