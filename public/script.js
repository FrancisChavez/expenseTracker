document.addEventListener('DOMContentLoaded', () => {
    // Login elements
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Show password elements
    const showPasswordCheckbox = document.getElementById('show-password');
    const showUsernameCheckbox = document.getElementById('show-username');

    // Current user info (set after login or session check)
    let currentUser = null;

    // Check if user is already logged in via session
    checkSession();

    async function checkSession() {
        try {
            const response = await fetch('/api/me');
            const data = await response.json();
            if (data.authenticated) {
                currentUser = data.user;
                showApp();
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                currentUser = data.user;
                showApp();
                loginError.textContent = '';
            } else {
                loginError.textContent = data.error || 'Invalid username or password. Please try again.';
                document.getElementById('password').value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Login failed. Please try again.';
            document.getElementById('password').value = '';
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        currentUser = null;
        showLogin();
        loginForm.reset();
        loginError.textContent = '';
    });

    // Show password functionality
    let passwordTimeout, usernameTimeout;
    let passwordHolding = false, usernameHolding = false;

    // Password show/hide functionality
    showPasswordCheckbox.addEventListener('mousedown', () => {
        passwordHolding = true;
        document.getElementById('password').type = 'text';
        clearTimeout(passwordTimeout);
    });

    showPasswordCheckbox.addEventListener('mouseup', () => {
        passwordHolding = false;
        passwordTimeout = setTimeout(() => {
            if (!passwordHolding) {
                document.getElementById('password').type = 'password';
            }
        }, 300);
    });

    showPasswordCheckbox.addEventListener('mouseleave', () => {
        if (passwordHolding) {
            passwordHolding = false;
            document.getElementById('password').type = 'password';
        }
    });

    // Username show/hide functionality
    showUsernameCheckbox.addEventListener('mousedown', () => {
        usernameHolding = true;
        document.getElementById('username').type = 'text';
        clearTimeout(usernameTimeout);
    });

    showUsernameCheckbox.addEventListener('mouseup', () => {
        usernameHolding = false;
        usernameTimeout = setTimeout(() => {
            if (!usernameHolding) {
                document.getElementById('username').type = 'password';
            }
        }, 300);
    });

    showUsernameCheckbox.addEventListener('mouseleave', () => {
        if (usernameHolding) {
            usernameHolding = false;
            document.getElementById('username').type = 'password';
        }
    });

    // Touch events for mobile devices
    showPasswordCheckbox.addEventListener('touchstart', (e) => {
        e.preventDefault();
        passwordHolding = true;
        document.getElementById('password').type = 'text';
        clearTimeout(passwordTimeout);
    });

    showPasswordCheckbox.addEventListener('touchend', (e) => {
        e.preventDefault();
        passwordHolding = false;
        passwordTimeout = setTimeout(() => {
            if (!passwordHolding) {
                document.getElementById('password').type = 'password';
            }
        }, 300);
    });

    showUsernameCheckbox.addEventListener('touchstart', (e) => {
        e.preventDefault();
        usernameHolding = true;
        document.getElementById('username').type = 'text';
        clearTimeout(usernameTimeout);
    });

    showUsernameCheckbox.addEventListener('touchend', (e) => {
        e.preventDefault();
        usernameHolding = false;
        usernameTimeout = setTimeout(() => {
            if (!usernameHolding) {
                document.getElementById('username').type = 'password';
            }
        }, 300);
    });

    function showApp() {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        initializeApp();
    }

    function showLogin() {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    function initializeApp() {
        const expenseForm = document.getElementById('expense-form');
        const expenseTableBody = document.getElementById('expense-table-body');
        const totalExpensesSpan = document.getElementById('total-expenses');
        const monthFilter = document.getElementById('month-filter');
        const yearFilter = document.getElementById('year-filter');
        const userFilter = document.getElementById('user-filter');
        const refreshBtn = document.getElementById('refresh-btn');
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const restoreBtn = document.getElementById('restore-btn');
        const importFile = document.getElementById('import-file');

        // Edit Modal Elements
        const editModal = document.getElementById('edit-modal');
        const closeButton = document.querySelector('.close-button');
        const cancelEditButton = document.getElementById('cancel-edit-button');
        const editExpenseForm = document.getElementById('edit-expense-form');
        const editExpenseId = document.getElementById('edit-expense-id');
        const editDescription = document.getElementById('edit-description');
        const editAmount = document.getElementById('edit-amount');
        const editSource = document.getElementById('edit-source');

        let allExpenses = []; // To store all expenses from the server
        let currentSortOrder = 'desc'; // 'desc' for latest first, 'asc' for oldest first
        let currentSortField = 'date'; // 'date' or 'amount'

        // Populates the month filter dropdown and sets the current month as default
        const populateMonthFilter = () => {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const currentMonth = new Date().getMonth();
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = month;
                if (index === currentMonth) {
                    option.selected = true;
                }
                monthFilter.appendChild(option);
            });
        };

        // Populates the year filter dropdown and sets the current year as default
        const populateYearFilter = () => {
            const currentYear = new Date().getFullYear();
            // Show current year through 2030
            for (let year = currentYear; year <= 2030; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) {
                    option.selected = true;
                }
                yearFilter.appendChild(option);
            }
        };

        // Populates the source options for the edit modal
        const populateEditSourceOptions = () => {
            const mainSourceSelect = document.getElementById('source');
            editSource.innerHTML = mainSourceSelect.innerHTML; // Copy options from main form
        };

        const fetchExpenses = async () => {
            try {
                const response = await fetch('/api/expenses');
                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    showLogin();
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch expenses');
                }
                allExpenses = await response.json();
                applyFiltersAndRender(); // Apply current filter and render
            } catch (error) {
                console.error('Error fetching expenses:', error);
            }
        };

        // Renders a given array of expenses to the table
        const renderExpenses = (expensesToRender) => {
            let total = 0;

            expenseTableBody.innerHTML = ''; // Clear existing rows
            if (expensesToRender.length === 0) {
                const row = expenseTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6; // Updated to include User column
                cell.textContent = 'No expenses recorded for the selected month.';
                cell.style.textAlign = 'center';
            } else {
                expensesToRender.forEach(expense => {
                    total += parseFloat(expense.amount) || 0; // Add to total, ensuring it's a number

                    const row = expenseTableBody.insertRow();
                    row.setAttribute('data-id', expense.id); // All expenses now guaranteed to have an ID
                    row.insertCell().textContent = expense.description;
                    row.insertCell().textContent = parseFloat(expense.amount).toFixed(2);
                    row.insertCell().textContent = expense.source;
                    row.insertCell().textContent = expense.createdAt ? new Date(expense.createdAt).toLocaleString() : 'N/A';
                    row.insertCell().textContent = expense.userDisplay || 'Unknown'; // Display user

                    const actionCell = row.insertCell();
                    // Edit Button
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.className = 'edit-btn';
                    editButton.onclick = () => handleEdit(expense.id);
                    actionCell.appendChild(editButton);
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.className = 'delete-btn';
                    deleteButton.onclick = () => handleDelete(expense.id);
                    actionCell.appendChild(deleteButton);
                });
            }

            totalExpensesSpan.textContent = total.toFixed(2);
        };

        // Handle Edit Button Click
        const handleEdit = (id) => {
            const expenseToEdit = allExpenses.find(expense => expense.id === id);
            if (expenseToEdit) {
                editExpenseId.value = expenseToEdit.id;
                editDescription.value = expenseToEdit.description;
                editAmount.value = expenseToEdit.amount;
                editSource.value = expenseToEdit.source; // Set selected option
                editModal.style.display = 'block'; // Show the modal
            } else {
                alert('Expense not found for editing.');
            }
        };

        // Filters the main expenses list based on UI controls and calls render
        const applyFiltersAndRender = () => {
            const selectedMonth = monthFilter.value;
            const selectedYear = yearFilter.value;
            const selectedUser = userFilter.value;

            let filteredExpenses = allExpenses;

            // Filter by month
            if (selectedMonth !== '') {
                filteredExpenses = filteredExpenses.filter(expense => {
                    // Ensure createdAt exists before trying to create a Date from it
                    return expense.createdAt && new Date(expense.createdAt).getMonth() == selectedMonth;
                });
            }

            // Filter by year
            if (selectedYear !== '') {
                filteredExpenses = filteredExpenses.filter(expense => {
                    return expense.createdAt && new Date(expense.createdAt).getFullYear() == selectedYear;
                });
            }

            // Filter by user
            if (selectedUser !== 'ALL') {
                filteredExpenses = filteredExpenses.filter(expense => {
                    return expense.userDisplay === selectedUser;
                });
            }

            // Sort based on current sort field and order
            filteredExpenses.sort((a, b) => {
                if (currentSortField === 'date') {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    if (currentSortOrder === 'desc') {
                        return dateB - dateA; // Descending order (latest first)
                    } else {
                        return dateA - dateB; // Ascending order (oldest first)
                    }
                } else if (currentSortField === 'amount') {
                    const amountA = parseFloat(a.amount) || 0;
                    const amountB = parseFloat(b.amount) || 0;
                    if (currentSortOrder === 'desc') {
                        return amountB - amountA; // Descending order (highest first)
                    } else {
                        return amountA - amountB; // Ascending order (lowest first)
                    }
                }
                return 0;
            });

            renderExpenses(filteredExpenses);
        };

        const handleDelete = async (id) => {
            if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
                return;
            }

            try {
                const response = await fetch(`/api/expenses/${id}`, {
                    method: 'DELETE',
                });

                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    showLogin();
                    return;
                }

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Expense not found. It might have already been deleted.');
                    } else {
                        throw new Error(`Failed to delete expense: Server responded with status ${response.status}`);
                    }
                }

                fetchExpenses(); // Re-fetch, re-filter, and re-render to update the UI and total

            } catch (error) {
                console.error('Error deleting expense:', error);
                alert(error.message); // Display the more specific error message
            }
        };

        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newExpense = {
                description: document.getElementById('description').value,
                amount: document.getElementById('amount').value,
                source: document.getElementById('source').value,
                user: currentUser ? currentUser.username : '', // Use session user
            };

            try {
                const response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newExpense),
                });

                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    showLogin();
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to add expense');
                }

                expenseForm.reset();
                fetchExpenses(); // Refresh the list
            } catch (error) {
                console.error('Error adding expense:', error);
                alert('Failed to add expense.');
            }
        });

        // Handle Modal Form Submission (Update Expense)
        editExpenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = editExpenseId.value;
            const updatedExpense = {
                description: editDescription.value,
                amount: editAmount.value,
                source: editSource.value,
            };

            try {
                const response = await fetch(`/api/expenses/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedExpense),
                });

                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    showLogin();
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Failed to update expense: Server responded with status ${response.status}`);
                }

                editModal.style.display = 'none'; // Hide the modal
                fetchExpenses(); // Refresh the list
            } catch (error) {
                console.error('Error updating expense:', error);
                alert('Failed to update expense.');
            }
        });

        // Modal event listeners
        closeButton.addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        cancelEditButton.addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === editModal) {
                editModal.style.display = 'none';
            }
        });

        // Filter change events
        monthFilter.addEventListener('change', applyFiltersAndRender);
        yearFilter.addEventListener('change', applyFiltersAndRender);
        userFilter.addEventListener('change', applyFiltersAndRender);

        // Refresh button event
        refreshBtn.addEventListener('click', () => {
            fetchExpenses();
        });

        // Export button event
        exportBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to export all expenses to CSV? This will include all expense data.')) {
                exportToCSV();
            }
        });

        // Import button event
        importBtn.addEventListener('click', () => {
            importFile.value = '';
            importFile.click();
        });

        // Handle file selection
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                const csv = event.target.result;
                const expenses = parseCSV(csv);
                if (expenses.length === 0) {
                    alert('No valid expenses found in CSV.');
                    return;
                }
                // Show detailed confirmation with counts
                const currentCount = allExpenses.length;
                const importCount = expenses.length;
                const confirmMsg = `WARNING: This will REPLACE all your current data!\n\n` +
                    `Current expenses: ${currentCount}\n` +
                    `Expenses to import: ${importCount}\n\n` +
                    `A backup will be created automatically.\n\n` +
                    `Are you sure you want to continue?`;
                if (!confirm(confirmMsg)) return;

                fetch('/api/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expenses })
                })
                .then(res => {
                    if (res.status === 401) {
                        alert('Session expired. Please log in again.');
                        showLogin();
                        throw new Error('Unauthorized');
                    }
                    if (!res.ok) throw new Error('Import failed');
                    return res.json();
                })
                .then((data) => {
                    let msg = `Import successful! ${data.imported} expenses imported.`;
                    if (data.backupCreated) {
                        msg += `\n\nBackup created with ${data.backupCount} expenses.\nYou can restore it using the Restore button.`;
                    }
                    alert(msg);
                    fetchExpenses();
                })
                .catch((err) => {
                    if (err.message !== 'Unauthorized') {
                        alert('Import failed.');
                    }
                });
            };
            reader.readAsText(file);
        });

        // Restore from backup
        const handleRestore = async () => {
            try {
                // First check if backup exists
                const infoRes = await fetch('/api/backup-info');
                if (infoRes.status === 401) {
                    alert('Session expired. Please log in again.');
                    showLogin();
                    return;
                }
                const info = await infoRes.json();
                if (!info.exists) {
                    alert('No backup found. A backup is created automatically when you import a CSV.');
                    return;
                }

                const backupDate = new Date(info.createdAt).toLocaleString();
                const confirmMsg = `Restore from backup?\n\n` +
                    `Backup contains: ${info.count} expenses\n` +
                    `Backup created: ${backupDate}\n` +
                    `Current expenses: ${allExpenses.length}\n\n` +
                    `This will REPLACE your current data with the backup.`;
                if (!confirm(confirmMsg)) return;

                const res = await fetch('/api/restore', { method: 'POST' });
                if (res.status === 401) {
                    alert('Session expired. Please log in again.');
                    showLogin();
                    return;
                }
                if (!res.ok) throw new Error('Restore failed');
                const data = await res.json();
                alert(`Restore successful! ${data.restored} expenses restored.`);
                fetchExpenses();
            } catch (err) {
                console.error('Restore error:', err);
                alert('Restore failed.');
            }
        };

        // CSV parser for import
        function parseCSV(csv) {
            const lines = csv.split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) return [];
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const result = [];
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].match(/("[^"]*"|[^,]+)/g);
                if (!row || row.length < 4) continue;
                const obj = {};
                headers.forEach((h, idx) => {
                    let val = row[idx] || '';
                    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"');
                    obj[h] = val;
                });
                // Normalize fields for backend
                result.push({
                    id: obj['ID'] || obj['id'] || Date.now() + '-' + i,
                    description: obj['Description'] || obj['description'] || '',
                    amount: obj['Amount (PHP)'] || obj['amount'] || '',
                    source: obj['Source'] || obj['source'] || '',
                    createdAt: obj['Created At'] || obj['Date Added'] || new Date().toISOString(),
                    userDisplay: obj['User'] || obj['userDisplay'] || 'Unknown',
                    user: obj['user'] || ''
                });
            }
            return result;
        }

        // Function to handle date header click for sorting
        const handleDateHeaderClick = () => {
            if (currentSortField !== 'date') {
                currentSortField = 'date';
                currentSortOrder = 'desc'; // Reset to latest first when switching to date
            } else {
                currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
            }
            applyFiltersAndRender();
        };

        // Function to handle amount header click for sorting
        const handleAmountHeaderClick = () => {
            if (currentSortField !== 'amount') {
                currentSortField = 'amount';
                currentSortOrder = 'desc'; // Reset to highest first when switching to amount
            } else {
                currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
            }
            applyFiltersAndRender();
        };

        // Function to export expenses to CSV
        const exportToCSV = () => {
            if (allExpenses.length === 0) {
                alert('No expenses to export.');
                return;
            }

            // Define CSV headers
            const headers = ['ID', 'Description', 'Amount (PHP)', 'Source', 'User', 'Created At'];

            // Convert expenses to CSV rows
            const csvRows = [headers.join(',')];

            allExpenses.forEach(expense => {
                const row = [
                    `"${expense.id || ''}"`,
                    `"${(expense.description || '').replace(/"/g, '""')}"`,
                    `"${expense.amount || ''}"`,
                    `"${(expense.source || '').replace(/"/g, '""')}"`,
                    `"${expense.userDisplay || ''}"`,
                    `"${expense.createdAt || ''}"`
                ];
                csvRows.push(row.join(','));
            });

            // Create CSV content
            const csvContent = csvRows.join('\n');

            // Create and download the file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            // Create filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
            const filename = `expenses_${dateStr}_${timeStr}.csv`;

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Fallback for older browsers
                window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
            }
        };

        // Initialize the app
        populateMonthFilter();
        populateYearFilter();
        populateEditSourceOptions();
        fetchExpenses();

        // Add click events to sortable headers
        const dateHeader = document.querySelector('#expense-table th.sortable');
        if (dateHeader) {
            dateHeader.addEventListener('click', handleDateHeaderClick);
        }

        const amountHeader = document.querySelector('#expense-table th.sortable-amount');
        if (amountHeader) {
            amountHeader.addEventListener('click', handleAmountHeaderClick);
        }

        // Restore button event (must be after handleRestore is defined)
        restoreBtn.addEventListener('click', handleRestore);
    }
});