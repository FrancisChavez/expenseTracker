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

    // Hardcoded credentials - Multiple users
    const VALID_CREDENTIALS = [
        { username: 'francis', password: 'Skiculot1717!' },
        { username: 'Mhai017', password: 'Skiculot1717!' }
    ];

    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        showApp();
    }

    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Check if credentials match any valid user
        const isValidUser = VALID_CREDENTIALS.some(cred => 
            cred.username === username && cred.password === password
        );

        if (isValidUser) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', username); // Store current user
            showApp();
            loginError.textContent = '';
        } else {
            loginError.textContent = 'Invalid username or password. Please try again.';
            document.getElementById('password').value = '';
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser'); // Remove current user
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
        const userFilter = document.getElementById('user-filter');
        const refreshBtn = document.getElementById('refresh-btn');
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
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

        // Populates the source options for the edit modal
        const populateEditSourceOptions = () => {
            const mainSourceSelect = document.getElementById('source');
            editSource.innerHTML = mainSourceSelect.innerHTML; // Copy options from main form
        };

        const fetchExpenses = async () => {
            try {
                const response = await fetch('/api/expenses');
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
            const selectedUser = userFilter.value;

            let filteredExpenses = allExpenses;

            // Filter by month
            if (selectedMonth !== '') {
                filteredExpenses = filteredExpenses.filter(expense => {
                    // Ensure createdAt exists before trying to create a Date from it
                    return expense.createdAt && new Date(expense.createdAt).getMonth() == selectedMonth;
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

            const currentUser = localStorage.getItem('currentUser');
            const newExpense = {
                description: document.getElementById('description').value,
                amount: document.getElementById('amount').value,
                source: document.getElementById('source').value,
                user: currentUser, // Add current user to the expense
            };

            try {
                const response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newExpense),
                });

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
            if (!confirm('Are you sure you want to import this CSV file? This will overwrite all current expenses.')) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                const csv = event.target.result;
                const expenses = parseCSV(csv);
                if (expenses.length === 0) {
                    alert('No valid expenses found in CSV.');
                    return;
                }
                fetch('/api/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expenses })
                })
                .then(res => {
                    if (!res.ok) throw new Error('Import failed');
                    return res.json();
                })
                .then(() => {
                    alert('Import successful!');
                    fetchExpenses();
                })
                .catch(() => alert('Import failed.'));
            };
            reader.readAsText(file);
        });

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
            const headers = ['ID', 'Description', 'Amount (PHP)', 'Source', 'Date Added', 'User', 'Created At'];
            
            // Convert expenses to CSV rows
            const csvRows = [headers.join(',')];
            
            allExpenses.forEach(expense => {
                const row = [
                    expense.id || '',
                    `"${(expense.description || '').replace(/"/g, '""')}"`, // Escape quotes in description
                    expense.amount || '',
                    `"${(expense.source || '').replace(/"/g, '""')}"`, // Escape quotes in source
                    expense.createdAt ? new Date(expense.createdAt).toLocaleString() : '',
                    expense.userDisplay || '',
                    expense.createdAt || ''
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
    }
});