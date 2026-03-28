// ===== PlainFinancials - Analyze Form Logic =====

// State
let currentStep = 1;
let inputMethod = 'form'; // 'form' or 'upload'
let includeComparison = false;
let uploadedFiles = [];

// DOM Elements
const form = document.getElementById('analyzeForm');
const progressFill = document.querySelector('.progress-fill');
const progressSteps = document.querySelectorAll('.progress-bar .step');
const loadingState = document.getElementById('loadingState');

// ===== Step Navigation =====

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show the correct step based on input method
    let targetStep;
    if (stepNumber === 2) {
        targetStep = document.querySelector(`.form-step[data-step="2"][data-method="${inputMethod}"]`);
    } else if (stepNumber >= 3 && inputMethod === 'upload') {
        // Skip steps 3-4 for upload method, go straight to submit
        submitForm();
        return;
    } else {
        targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"][data-method="form"]`) ||
                     document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    }

    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress bar
    updateProgress(stepNumber);
    currentStep = stepNumber;
}

function updateProgress(stepNumber) {
    const totalSteps = 4;
    const percentage = (stepNumber / totalSteps) * 100;
    progressFill.style.width = `${percentage}%`;

    progressSteps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        if (stepNum < stepNumber) {
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
        }
    });
}

// ===== Next/Prev Button Handlers =====

document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            showStep(currentStep + 1);
        }
    });
});

document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => {
        showStep(currentStep - 1);
    });
});

// ===== Input Method Toggle =====

document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        inputMethod = btn.dataset.method;
    });
});

// ===== Comparison Choice =====

document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        includeComparison = btn.dataset.compare === 'yes';
        const comparisonFields = document.getElementById('comparisonFields');

        if (includeComparison) {
            comparisonFields.style.display = 'block';
        } else {
            comparisonFields.style.display = 'none';
        }
    });
});

// ===== Currency Prefix Update =====

const currencySelect = document.getElementById('currency');
if (currencySelect) {
    currencySelect.addEventListener('change', () => {
        const currency = currencySelect.value;
        document.querySelectorAll('.currency-prefix').forEach(prefix => {
            prefix.textContent = currency;
        });
    });
}

// ===== Live Calculations =====

function updateCalculations() {
    const getValue = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    const currency = document.getElementById('currency')?.value || 'AED';

    // MTD Gross Profit
    const revenue = getValue('revenue');
    const cogs = getValue('cogs');
    const grossProfit = revenue - cogs;
    const grossProfitDisplay = document.getElementById('grossProfitDisplay');
    if (grossProfitDisplay) {
        grossProfitDisplay.textContent = `${currency} ${formatNumber(grossProfit)}`;
    }

    // YTD Gross Profit
    const ytdRevenue = getValue('ytdRevenue');
    const ytdCogs = getValue('ytdCogs');
    const ytdGrossProfit = ytdRevenue - ytdCogs;
    const ytdGrossProfitDisplay = document.getElementById('ytdGrossProfitDisplay');
    if (ytdGrossProfitDisplay) {
        ytdGrossProfitDisplay.textContent = `${currency} ${formatNumber(ytdGrossProfit)}`;
    }

    // MTD Net Margin
    const netProfit = getValue('netProfit');
    const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;
    const netMarginDisplay = document.getElementById('netMarginDisplay');
    if (netMarginDisplay) {
        netMarginDisplay.textContent = `${netMargin}%`;
        netMarginDisplay.style.color = netMargin >= 10 ? '#10b981' : netMargin >= 0 ? '#f59e0b' : '#ef4444';
    }

    // YTD Net Margin
    const ytdNetProfit = getValue('ytdNetProfit');
    const ytdNetMargin = ytdRevenue > 0 ? ((ytdNetProfit / ytdRevenue) * 100).toFixed(1) : 0;
    const ytdNetMarginDisplay = document.getElementById('ytdNetMarginDisplay');
    if (ytdNetMarginDisplay) {
        ytdNetMarginDisplay.textContent = `${ytdNetMargin}%`;
        ytdNetMarginDisplay.style.color = ytdNetMargin >= 10 ? '#10b981' : ytdNetMargin >= 0 ? '#f59e0b' : '#ef4444';
    }

    // Total Current Assets
    const cash = getValue('cash');
    const receivables = getValue('receivables');
    const inventory = getValue('inventory');
    const totalCurrentAssets = cash + receivables + inventory;
    const totalCurrentAssetsDisplay = document.getElementById('totalCurrentAssets');
    if (totalCurrentAssetsDisplay) {
        totalCurrentAssetsDisplay.textContent = `${currency} ${formatNumber(totalCurrentAssets)}`;
    }

    // VAT Calculation
    const vatCollected = getValue('vatCollected');
    const vatPaid = getValue('vatPaid');
    const vatPayable = vatCollected - vatPaid;
    const vatPayableDisplay = document.getElementById('vatPayable');
    if (vatPayableDisplay) {
        vatPayableDisplay.textContent = `${currency} ${formatNumber(vatPayable)}`;
        vatPayableDisplay.style.color = vatPayable > 0 ? '#ef4444' : '#10b981';
    }

    // Total Current Liabilities (including VAT payable if positive)
    const payables = getValue('payables');
    const shortTermLoans = getValue('shortTermLoans');
    const otherLiabilities = getValue('otherLiabilities');
    const vatLiability = vatPayable > 0 ? vatPayable : 0;
    const totalCurrentLiabilities = payables + shortTermLoans + otherLiabilities + vatLiability;
    const totalCurrentLiabilitiesDisplay = document.getElementById('totalCurrentLiabilities');
    if (totalCurrentLiabilitiesDisplay) {
        totalCurrentLiabilitiesDisplay.textContent = `${currency} ${formatNumber(totalCurrentLiabilities)}`;
    }

    // Working Capital
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const workingCapitalDisplay = document.getElementById('workingCapital');
    if (workingCapitalDisplay) {
        workingCapitalDisplay.textContent = `${currency} ${formatNumber(workingCapital)}`;
        workingCapitalDisplay.style.color = workingCapital >= 0 ? '#10b981' : '#ef4444';
    }

    // Cash Movements (optional section)
    const loanRepayments = getValue('loanRepayments');
    const ownerDrawings = getValue('ownerDrawings');
    const assetPurchases = getValue('assetPurchases');
    const totalCashOutflows = loanRepayments + ownerDrawings + assetPurchases;
    const totalCashOutflowsDisplay = document.getElementById('totalCashOutflows');
    if (totalCashOutflowsDisplay) {
        totalCashOutflowsDisplay.textContent = `${currency} ${formatNumber(totalCashOutflows)}`;
    }
}

// Add listeners to all number inputs
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', updateCalculations);
});

function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ===== File Upload Handling =====

let uploadZone, fileInput, uploadedFilesContainer, uploadContinueBtn;

function initFileUpload() {
    uploadZone = document.getElementById('uploadZone');
    fileInput = document.getElementById('fileUpload');
    uploadedFilesContainer = document.getElementById('uploadedFiles');
    uploadContinueBtn = document.getElementById('uploadContinue');

    if (uploadZone) {
        // Click to upload
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });

        // File input change — reset value after handling so re-uploading same file works
        fileInput.addEventListener('change', () => {
            handleFiles(fileInput.files);
            fileInput.value = '';
        });
    }
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        // Check file type - only CSV supported for now
        const validTypes = ['.csv'];
        const extension = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(extension)) {
            alert(`Invalid file type: ${file.name}. Please upload a CSV file using our template.`);
            return;
        }

        // Check if already uploaded
        if (uploadedFiles.some(f => f.name === file.name)) {
            return;
        }

        uploadedFiles.push(file);
        renderUploadedFiles();
    });

    updateUploadButton();
}

function renderUploadedFiles() {
    uploadedFilesContainer.innerHTML = uploadedFiles.map((file, index) => `
        <div class="uploaded-file">
            <div class="file-info">
                <div class="file-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="remove-file" onclick="removeFile(${index})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderUploadedFiles();
    updateUploadButton();
}

function updateUploadButton() {
    if (uploadContinueBtn) {
        uploadContinueBtn.disabled = uploadedFiles.length === 0;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== CSV Template Parser =====

function parseCSVTemplate(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').map(line => line.trim()).filter(line => line);

                // Field mapping: CSV field name → form field ID
                const fieldMap = {
                    'revenue': 'revenue',
                    'sales': 'revenue',
                    'revenue / sales': 'revenue',
                    'cost of goods sold': 'cogs',
                    'cost of goods sold (cogs)': 'cogs',
                    'cogs': 'cogs',
                    'operating expenses': 'opex',
                    'operating expenses (opex)': 'opex',
                    'opex': 'opex',
                    'net profit': 'netProfit',
                    'net income': 'netProfit',
                    'cash in bank': 'cash',
                    'cash': 'cash',
                    'accounts receivable': 'receivables',
                    'accounts receivable (ar)': 'receivables',
                    'receivables': 'receivables',
                    'ar': 'receivables',
                    'inventory': 'inventory',
                    'stock': 'inventory',
                    'accounts payable': 'payables',
                    'accounts payable (ap)': 'payables',
                    'payables': 'payables',
                    'ap': 'payables',
                    'short-term loans': 'shortTermLoans',
                    'short term loans': 'shortTermLoans',
                    'loans': 'shortTermLoans',
                    'other liabilities': 'otherLiabilities',
                    'vat collected': 'vatCollected',
                    'output vat': 'vatCollected',
                    'tax collected': 'vatCollected',
                    'tax collected from customers': 'vatCollected',
                    'sales tax collected': 'vatCollected',
                    'vat paid': 'vatPaid',
                    'input vat': 'vatPaid',
                    'tax paid': 'vatPaid',
                    'tax paid on purchases': 'vatPaid',
                    'sales tax paid': 'vatPaid',
                    'opening cash': 'ytdStartingCash',
                    'opening cash (start of year)': 'ytdStartingCash',
                    'cash at start of year': 'ytdStartingCash',
                    'ytd starting cash': 'ytdStartingCash',
                    'starting cash (ytd)': 'ytdStartingCash',
                    'loan repayments': 'loanRepayments',
                    'owner drawings': 'ownerDrawings',
                    'drawings': 'ownerDrawings',
                    'asset purchases': 'assetPurchases',
                    'equipment purchases': 'assetPurchases',
                    // Labour cost
                    'labour cost': 'labourCost',
                    'labor cost': 'labourCost',
                    'labour / staff cost': 'labourCost',
                    'staff cost': 'labourCost',
                    'wages': 'labourCost',
                    'wages and salaries': 'labourCost',
                    // Industry-specific COGS aliases
                    'food cost': 'cogs',
                    'food & beverage cost': 'cogs',
                    'food and beverage cost': 'cogs',
                    'material cost': 'cogs',
                    'material & production cost': 'cogs',
                    'project costs': 'cogs',
                    'cost of service': 'cogs',
                    'direct delivery cost': 'cogs',
                    'clinical cost': 'cogs',
                    'clinical / treatment cost': 'cogs'
                };

                // YTD field mapping
                const ytdFieldMap = {
                    'revenue': 'ytdRevenue',
                    'sales': 'ytdRevenue',
                    'revenue / sales': 'ytdRevenue',
                    'cost of goods sold': 'ytdCogs',
                    'cost of goods sold (cogs)': 'ytdCogs',
                    'cogs': 'ytdCogs',
                    'operating expenses': 'ytdOpex',
                    'operating expenses (opex)': 'ytdOpex',
                    'opex': 'ytdOpex',
                    'net profit': 'ytdNetProfit',
                    'net income': 'ytdNetProfit',
                    'labour cost': 'ytdLabourCost',
                    'labor cost': 'ytdLabourCost',
                    'labour / staff cost': 'ytdLabourCost',
                    'staff cost': 'ytdLabourCost',
                    'wages': 'ytdLabourCost',
                    'wages and salaries': 'ytdLabourCost'
                };

                const data = { current: {}, previous: {}, ytd: {} };

                // Detect column layout from header
                const header = parseCSVRow(lines[0]);
                const headerLower = header.map(h => h.toLowerCase().trim());
                const hasPrevCol = headerLower.includes('previous month') || headerLower.includes('last month');
                // Column indices: Field=0, This Month=1, Previous Month=2 (if present), YTD=next, Notes=last
                const prevColIdx = hasPrevCol ? 2 : -1;
                const ytdColIdx = hasPrevCol ? 3 : 2;

                // Previous month field mapping (balance sheet + revenue/profit)
                const prevFieldMap = {
                    'revenue': 'revenue', 'revenue / sales': 'revenue', 'sales': 'revenue', 'sales / revenue': 'revenue',
                    'net profit': 'netProfit', 'net income': 'netProfit',
                    'cash in bank': 'cash', 'cash': 'cash', 'bank balance': 'cash',
                    'accounts receivable': 'receivables', 'accounts receivable (ar)': 'receivables', 'receivables': 'receivables',
                    'inventory': 'inventory',
                    'accounts payable': 'payables', 'accounts payable (ap)': 'payables', 'payables': 'payables'
                };

                // Skip header row, parse data rows
                for (let i = 1; i < lines.length; i++) {
                    const row = parseCSVRow(lines[i]);
                    if (row.length < 2) continue;

                    const fieldName = row[0].toLowerCase().trim();
                    const thisMonthValue = parseNumber(row[1]);
                    const prevValue = prevColIdx > 0 && row.length > prevColIdx ? parseNumber(row[prevColIdx]) : null;
                    const ytdValue = row.length > ytdColIdx ? parseNumber(row[ytdColIdx]) : null;

                    // Map to current month fields
                    if (fieldMap[fieldName]) {
                        const targetField = fieldMap[fieldName];
                        if (targetField === 'ytdStartingCash') {
                            data.ytd.startingCash = thisMonthValue;
                        } else {
                            data.current[targetField] = thisMonthValue;
                        }
                    }

                    // Map to previous month fields
                    if (prevFieldMap[fieldName] && prevValue !== null && prevValue !== 0) {
                        data.previous[prevFieldMap[fieldName]] = prevValue;
                    }

                    // Map to YTD fields
                    if (ytdFieldMap[fieldName] && ytdValue !== null) {
                        data.ytd[ytdFieldMap[fieldName]] = ytdValue;
                    }
                }

                resolve(data);
            } catch (error) {
                reject(new Error('Failed to parse CSV: ' + error.message));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

function parseNumber(value) {
    if (!value) return 0;
    let str = value.toString().trim();

    // Handle accounting format: (123) means -123
    const isNegative = str.startsWith('(') && str.endsWith(')');
    if (isNegative) {
        str = str.slice(1, -1); // Remove parentheses
    }

    // Remove currency symbols, commas, spaces
    const cleaned = str.replace(/[^0-9.-]/g, '');
    let num = parseFloat(cleaned);

    if (isNaN(num)) return 0;

    // Apply negative if was in parentheses
    if (isNegative) num = -num;

    return num;
}

function populateFormFromCSV(data) {
    // Populate current month fields
    Object.keys(data.current).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && data.current[fieldId]) {
            field.value = data.current[fieldId];
        }
    });

    // Populate previous month fields if present
    if (data.previous && Object.keys(data.previous).length > 0) {
        const prevFieldMap = {
            'revenue': 'prevRevenue',
            'netProfit': 'prevNetProfit',
            'cash': 'prevCash',
            'receivables': 'prevReceivables',
            'inventory': 'prevInventory',
            'payables': 'prevPayables'
        };
        Object.keys(data.previous).forEach(key => {
            const fieldId = prevFieldMap[key];
            const field = fieldId ? document.getElementById(fieldId) : null;
            if (field && data.previous[key]) {
                field.value = data.previous[key];
            }
        });

        // Enable comparison section
        includeComparison = true;
        const comparisonFields = document.getElementById('comparisonFields');
        if (comparisonFields) comparisonFields.style.display = 'block';
        const compareBtn = document.querySelector('[data-compare="yes"]');
        if (compareBtn) {
            document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
            compareBtn.classList.add('selected');
        }
    }

    // Populate YTD fields if present
    if (data.ytd && Object.keys(data.ytd).length > 0) {
        Object.keys(data.ytd).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && data.ytd[fieldId]) {
                field.value = data.ytd[fieldId];
            }
        });

        // Check the YTD toggle if we have YTD data
        const ytdToggle = document.getElementById('includeYtd');
        if (ytdToggle) {
            ytdToggle.checked = true;
            const ytdSection = document.getElementById('ytdSection');
            if (ytdSection) ytdSection.style.display = 'block';
        }
    }
}

async function processUploadedFile() {
    if (uploadedFiles.length === 0) {
        alert('Please upload a file first.');
        return false;
    }

    const file = uploadedFiles[0];
    const extension = '.' + file.name.split('.').pop().toLowerCase();

    if (extension === '.csv') {
        try {
            const data = await parseCSVTemplate(file);

            // Populate all form fields silently
            populateFormFromCSV(data);
            updateCalculations();

            // Check mandatory fields
            const mandatoryFields = [
                { id: 'revenue', label: 'Revenue / Sales', group: 'income' },
                { id: 'cogs', label: 'Cost of Goods Sold', group: 'income' },
                { id: 'opex', label: 'Operating Expenses', group: 'income' },
                { id: 'netProfit', label: 'Net Profit', group: 'income' },
                { id: 'cash', label: 'Cash in Bank', group: 'balance' },
                { id: 'receivables', label: 'Accounts Receivable', group: 'balance' },
                { id: 'payables', label: 'Accounts Payable', group: 'balance' }
            ];

            const missing = mandatoryFields.filter(f => {
                const el = document.getElementById(f.id);
                const val = parseFloat(el?.value);
                return !el || isNaN(val) || val === 0;
            });

            // Check optional-but-impactful fields that are blank/zero
            const optionalFields = [
                { id: 'ytdStartingCash', label: 'Opening Cash (Start of Year)', hint: 'Needed for cash bridge and runway accuracy' },
                { id: 'shortTermLoans', label: 'Short-term Loans', hint: 'Affects current ratio and debt section' },
                { id: 'otherLiabilities', label: 'Other Liabilities', hint: 'Credit cards, accrued expenses' },
                { id: 'loanRepayments', label: 'Loan Repayments', hint: 'Needed for debt coverage analysis' },
                { id: 'ownerDrawings', label: 'Owner Drawings', hint: 'Affects free cash flow analysis' },
                { id: 'assetPurchases', label: 'Asset Purchases', hint: 'Affects free cash flow analysis' },
                { id: 'inventory', label: 'Inventory', hint: 'Needed for DIO and working capital' }
            ];

            const blankOptional = optionalFields.filter(f => {
                const el = document.getElementById(f.id);
                const val = parseFloat(el?.value);
                return !el || isNaN(val) || val === 0;
            });

            if (missing.length === 0 && blankOptional.length === 0) {
                // Everything filled — submit directly
                inputMethod = 'form';
                submitForm();
                return true;
            }

            // Show review step with missing mandatory + blank optional fields
            showCSVReviewStep(data, missing, mandatoryFields, blankOptional);
            return true;
        } catch (error) {
            alert('Error reading file: ' + error.message);
            return false;
        }
    } else if (extension === '.xlsx' || extension === '.xls') {
        alert('Excel files (.xlsx/.xls) require additional processing. Please save as CSV and re-upload, or use Quick Entry.');
        return false;
    } else {
        alert('Unsupported file format. Please upload a CSV file using our template.');
        return false;
    }
}

function showCSVReviewStep(data, missingFields, allMandatory, blankOptional = []) {
    const currency = document.getElementById('currency')?.value || 'AED';
    const fmt = (v) => v != null && v !== 0
        ? `${currency} ${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : '—';

    // Build summary rows grouped by category
    const groups = {
        'Income Statement': [
            { label: 'Revenue / Sales', current: data.current.revenue, ytd: data.ytd?.ytdRevenue },
            { label: 'Cost of Goods Sold', current: data.current.cogs, ytd: data.ytd?.ytdCogs },
            { label: 'Operating Expenses', current: data.current.opex, ytd: data.ytd?.ytdOpex },
            { label: 'Net Profit', current: data.current.netProfit, ytd: data.ytd?.ytdNetProfit }
        ],
        'Balance Sheet': [
            { label: 'Cash in Bank', current: data.current.cash },
            { label: 'Accounts Receivable', current: data.current.receivables },
            { label: 'Inventory', current: data.current.inventory },
            { label: 'Accounts Payable', current: data.current.payables },
            { label: 'Short-term Loans', current: data.current.shortTermLoans },
            { label: 'Other Liabilities', current: data.current.otherLiabilities }
        ],
        'Cash Movements': [
            { label: 'Opening Cash (Start of Year)', current: data.ytd?.startingCash },
            { label: 'Loan Repayments', current: data.current.loanRepayments },
            { label: 'Owner Drawings', current: data.current.ownerDrawings },
            { label: 'Asset Purchases', current: data.current.assetPurchases }
        ]
    };

    // Build summary table HTML
    let summaryHTML = '';
    for (const [groupName, rows] of Object.entries(groups)) {
        // Only show rows that have at least one non-zero value
        const hasData = rows.some(r => (r.current && r.current !== 0) || (r.ytd && r.ytd !== 0));
        if (!hasData) continue;

        summaryHTML += `<tr class="csv-review-group-header"><td colspan="3">${groupName}</td></tr>`;
        rows.forEach(r => {
            if ((r.current && r.current !== 0) || (r.ytd && r.ytd !== 0)) {
                summaryHTML += `<tr>
                    <td>${r.label}</td>
                    <td>${fmt(r.current)}</td>
                    <td>${r.ytd !== undefined ? fmt(r.ytd) : '—'}</td>
                </tr>`;
            }
        });
    }

    // Build missing mandatory fields HTML
    const missingInputsHTML = missingFields.map(f => `
        <div class="form-group">
            <label for="review_${f.id}">${f.label}</label>
            <div class="input-with-currency">
                <span class="currency-prefix">${currency}</span>
                <input type="number" id="review_${f.id}" placeholder="0" min="0">
            </div>
        </div>
    `).join('');

    // Build blank optional fields HTML
    const blankOptionalHTML = blankOptional.map(f => `
        <div class="form-group">
            <label for="review_${f.id}">${f.label}</label>
            <div class="input-with-currency">
                <span class="currency-prefix">${currency}</span>
                <input type="number" id="review_${f.id}" value="0" min="0">
            </div>
            <small class="field-hint">${f.hint}</small>
        </div>
    `).join('');

    // Determine header text based on what's missing
    const hasMissing = missingFields.length > 0;
    const hasBlankOptional = blankOptional.length > 0;
    const headerText = hasMissing
        ? 'We parsed your CSV. A few fields need your input.'
        : 'We parsed your CSV. Some fields were left blank — confirm or fill them in.';

    // Hide all form steps and show the review
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));

    // Remove any previous review step
    const existing = document.getElementById('csvReviewStep');
    if (existing) existing.remove();

    const reviewStep = document.createElement('div');
    reviewStep.id = 'csvReviewStep';
    reviewStep.className = 'form-step active';
    reviewStep.innerHTML = `
        <div class="step-header">
            <h1>Review your uploaded data</h1>
            <p>${headerText}</p>
        </div>

        <div class="csv-review-summary">
            <table class="csv-review-table">
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>This Month</th>
                        <th>YTD</th>
                    </tr>
                </thead>
                <tbody>
                    ${summaryHTML}
                </tbody>
            </table>
        </div>

        ${hasMissing ? `
        <div class="csv-review-missing">
            <h3>Required fields</h3>
            <p>These are needed for your report.</p>
            ${missingInputsHTML}
        </div>
        ` : ''}

        ${hasBlankOptional ? `
        <div class="csv-review-blank">
            <h3>These were left blank</h3>
            <p>We will treat them as zero. If you have the data, fill them in now for a more accurate report.</p>
            ${blankOptionalHTML}
        </div>
        ` : ''}

        <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="csvReviewBack">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back
            </button>
            <button type="button" class="btn btn-primary btn-generate" id="csvReviewSubmit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Generate My Report
            </button>
        </div>
    `;

    form.appendChild(reviewStep);

    // Update progress bar to show step 3
    updateProgress(3);
    currentStep = 3;

    // Wire up Back button
    reviewStep.querySelector('#csvReviewBack').addEventListener('click', () => {
        reviewStep.remove();
        inputMethod = 'upload';
        showStep(2);
    });

    // Wire up Generate button
    reviewStep.querySelector('#csvReviewSubmit').addEventListener('click', () => {
        // Copy review inputs back into the actual form fields (mandatory + optional)
        [...missingFields, ...blankOptional].forEach(f => {
            const reviewInput = document.getElementById(`review_${f.id}`);
            const formInput = document.getElementById(f.id);
            if (reviewInput && formInput) {
                formInput.value = reviewInput.value || '0';
            }
        });
        updateCalculations();

        // Remove review step and submit
        reviewStep.remove();
        inputMethod = 'form';
        submitForm();
    });
}

// ===== Form Validation =====

function validateCurrentStep() {
    const currentStepEl = document.querySelector(`.form-step.active`);
    if (!currentStepEl) return true;

    const requiredFields = currentStepEl.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        // Remove previous error state
        field.classList.remove('error');

        // Check if field is empty
        const isEmpty = !field.value || field.value.trim() === '';

        if (isEmpty) {
            field.classList.add('error');
            field.style.borderColor = '#ef4444';
            isValid = false;

            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            field.style.borderColor = '#e2e8f0';
        }
    });

    if (!isValid && firstInvalidField) {
        // Scroll to and focus the first invalid field
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            firstInvalidField.focus();
        }, 300);

        // Show error message
        const fieldName = firstInvalidField.closest('.form-group')?.querySelector('label')?.textContent?.replace('?', '').trim() || 'This field';
        showValidationError(`${fieldName} is required`);
    }

    return isValid;
}

function showValidationError(message) {
    // Remove any existing error toast
    const existingToast = document.querySelector('.validation-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'validation-toast';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Form Submission =====

form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm();
});

function submitForm() {
    // Collect form data
    const formData = collectFormData();

    // Show loading state
    form.style.display = 'none';
    loadingState.style.display = 'block';

    // Animate loading steps
    animateLoadingSteps();

    // Send to n8n webhook (replace with actual URL)
    sendToAnalyze(formData);
}

function collectFormData() {
    // Get language preference (from i18n.js if available)
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';

    const data = {
        company: {
            name: document.getElementById('companyName')?.value,
            industry: document.getElementById('industry')?.value,
            period: {
                month: document.getElementById('reportMonth')?.value,
                year: document.getElementById('reportYear')?.value
            },
            currency: document.getElementById('currency')?.value
        },
        language: lang,
        inputMethod: inputMethod,
        includeComparison: includeComparison
    };

    if (inputMethod === 'form') {
        data.current = {
            revenue: parseFloat(document.getElementById('revenue')?.value) || 0,
            cogs: parseFloat(document.getElementById('cogs')?.value) || 0,
            opex: parseFloat(document.getElementById('opex')?.value) || 0,
            netProfit: parseFloat(document.getElementById('netProfit')?.value) || 0,
            cash: parseFloat(document.getElementById('cash')?.value) || 0,
            receivables: parseFloat(document.getElementById('receivables')?.value) || 0,
            inventory: parseFloat(document.getElementById('inventory')?.value) || 0,
            payables: parseFloat(document.getElementById('payables')?.value) || 0,
            shortTermLoans: parseFloat(document.getElementById('shortTermLoans')?.value) || 0,
            otherLiabilities: parseFloat(document.getElementById('otherLiabilities')?.value) || 0,
            vatCollected: parseFloat(document.getElementById('vatCollected')?.value) || 0,
            vatPaid: parseFloat(document.getElementById('vatPaid')?.value) || 0,
            // Cash Movements (for Cash Bridge analysis)
            loanRepayments: parseFloat(document.getElementById('loanRepayments')?.value) || 0,
            ownerDrawings: parseFloat(document.getElementById('ownerDrawings')?.value) || 0,
            assetPurchases: parseFloat(document.getElementById('assetPurchases')?.value) || 0,
            labourCost: parseFloat(document.getElementById('labourCost')?.value) || 0
        };

        // YTD data (Year to Date)
        const ytdRevenue = parseFloat(document.getElementById('ytdRevenue')?.value) || 0;
        const ytdStartingCash = parseFloat(document.getElementById('ytdStartingCash')?.value) || 0;
        if (ytdRevenue > 0 || ytdStartingCash > 0) {
            data.ytd = {
                revenue: ytdRevenue,
                cogs: parseFloat(document.getElementById('ytdCogs')?.value) || 0,
                opex: parseFloat(document.getElementById('ytdOpex')?.value) || 0,
                netProfit: parseFloat(document.getElementById('ytdNetProfit')?.value) || 0,
                startingCash: ytdStartingCash
            };
            // Calculate months elapsed (current month number)
            const currentMonth = parseInt(document.getElementById('reportMonth')?.value) || 1;
            data.ytd.monthsElapsed = currentMonth;
        }

        if (includeComparison) {
            // Only include previous fields that have actual values (not empty/zero)
            // Zero means "not provided" for previous month — we don't know if they had zero revenue
            const prev = {};
            const prevFields = {
                revenue: 'prevRevenue', netProfit: 'prevNetProfit', cash: 'prevCash',
                receivables: 'prevReceivables', inventory: 'prevInventory', payables: 'prevPayables'
            };
            for (const [key, fieldId] of Object.entries(prevFields)) {
                const val = parseFloat(document.getElementById(fieldId)?.value);
                if (val && val !== 0) prev[key] = val;
            }
            // Only include previous data if at least one field was actually filled
            if (Object.keys(prev).length > 0) {
                data.previous = prev;
            }
        }
    } else {
        data.files = uploadedFiles.map(f => f.name);
    }

    return data;
}

function animateLoadingSteps() {
    const steps = document.querySelectorAll('.loading-step');
    const messages = [
        'Reading your data',
        'Calculating metrics',
        'Comparing to benchmarks',
        'Writing your report'
    ];

    let currentLoadingStep = 0;

    const interval = setInterval(() => {
        if (currentLoadingStep > 0) {
            steps[currentLoadingStep - 1].classList.add('completed');
        }

        if (currentLoadingStep < steps.length) {
            steps[currentLoadingStep].classList.add('active');
            document.querySelector('.loading-message').textContent = messages[currentLoadingStep];
            currentLoadingStep++;
        } else {
            clearInterval(interval);
        }
    }, 1500);
}

async function sendToAnalyze(formData) {
    try {
        // Check subscription limits for logged-in users
        if (typeof canCreateReport === 'function') {
            const reportCheck = await canCreateReport();
            if (!reportCheck.allowed) {
                loadingState.style.display = 'none';
                form.style.display = 'block';
                showStep(1);

                const message = `You have used all ${reportCheck.limit} reports for this month on the Free plan. Upgrade to Professional for unlimited reports.`;
                if (confirm(message + '\n\nWould you like to view pricing options?')) {
                    window.location.href = 'pricing.html';
                }
                return;
            }
        }

        // For file uploads, parse CSV and populate form
        if (inputMethod === 'upload' && uploadedFiles.length > 0) {
            loadingState.style.display = 'none';
            form.style.display = 'block';
            await processUploadedFile();
            return;
        }

        // Fetch historical data for context (if available)
        if (typeof getHistoricalReports === 'function') {
            try {
                const { data: historicalReports } = await getHistoricalReports(3);
                if (historicalReports && historicalReports.length > 0) {
                    formData.historicalReports = historicalReports;
                }
            } catch (e) {
                console.log('Could not fetch historical reports:', e);
            }
        }

        // Include previous action items with their updated status
        if (pendingActionItems && pendingActionItems.length > 0) {
            formData.previousActions = pendingActionItems.map(item => ({
                title: item.title,
                status: item.status
            }));
        }

        // Call the Netlify Function
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Analysis failed');
        }

        const result = await response.json();

        if (result.success) {
            // Store the complete response for the report page
            localStorage.setItem('plainfinance_report', JSON.stringify(result));

            // Save to user account if logged in
            let savedReportId = null;
            if (typeof saveReport === 'function') {
                try {
                    const { data: savedReport } = await saveReport(result);
                    if (savedReport && savedReport[0]) {
                        savedReportId = savedReport[0].id;
                    }
                } catch (e) {
                    console.log('Not logged in or save failed, continuing...');
                }
            }

            // Save action items if report was saved
            if (savedReportId && result.actionItems && typeof saveActionItems === 'function') {
                try {
                    await saveActionItems(savedReportId, result.actionItems);
                } catch (e) {
                    console.log('Could not save action items:', e);
                }
            }

            // Redirect to report page
            window.location.href = 'report-sky.html';
        } else {
            throw new Error(result.error || 'Analysis failed');
        }

    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error: ' + (error.message || 'Something went wrong. Please try again.'));

        // Reset form
        loadingState.style.display = 'none';
        form.style.display = 'block';
        showStep(1);
    }
}

// ===== Format Guide Toggle =====

function toggleFormatGuide() {
    const content = document.getElementById('formatGuideContent');
    const toggle = document.querySelector('.format-guide-toggle');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.classList.add('open');
    } else {
        content.style.display = 'none';
        toggle.classList.remove('open');
    }
}

// ===== Cash Movements Toggle =====

function toggleCashMovements() {
    const content = document.getElementById('cashMovementsFields');
    const toggle = document.querySelector('.cash-movements-section .section-toggle');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.classList.add('open');
    } else {
        content.style.display = 'none';
        toggle.classList.remove('open');
    }
}

function updateCashOutflows() {
    const getValue = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    const currency = document.getElementById('currency')?.value || 'AED';

    const loanRepayments = getValue('loanRepayments');
    const ownerDrawings = getValue('ownerDrawings');
    const assetPurchases = getValue('assetPurchases');

    const totalCashOutflows = loanRepayments + ownerDrawings + assetPurchases;
    const totalCashOutflowsDisplay = document.getElementById('totalCashOutflows');

    if (totalCashOutflowsDisplay) {
        totalCashOutflowsDisplay.textContent = `${currency} ${formatNumber(totalCashOutflows)}`;
    }
}

// ===== Previous Actions =====

let pendingActionItems = [];

async function loadPreviousActions() {
    if (typeof getPendingActionItems !== 'function') return;

    try {
        const { data: items } = await getPendingActionItems();
        if (items && items.length > 0) {
            pendingActionItems = items;
            showPreviousActionsUI(items);
        }
    } catch (e) {
        console.log('Could not load previous actions:', e);
    }
}

function showPreviousActionsUI(items) {
    const container = document.getElementById('previousActionsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="previous-actions-card">
            <h3>Before we generate your new report...</h3>
            <p>Last time, we recommended these actions. Check off what you completed:</p>
            <div class="action-items-list">
                ${items.map(item => `
                    <label class="action-item-check" data-id="${item.id}">
                        <input type="checkbox" name="action_status_${item.id}" value="done">
                        <span>${item.title}</span>
                    </label>
                `).join('')}
            </div>
            <div class="previous-actions-footer">
                <button type="button" class="skip-actions" onclick="skipActionsReview()">Skip this</button>
                <button type="button" class="btn btn-primary" onclick="saveActionsAndContinue()">Continue</button>
            </div>
        </div>
    `;

    container.style.display = 'block';

    // Add checkbox toggle styling
    container.querySelectorAll('.action-item-check input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            this.closest('.action-item-check').classList.toggle('completed', this.checked);
        });
    });
}

async function saveActionsAndContinue() {
    const container = document.getElementById('previousActionsContainer');
    if (!container) return;

    // Update status of checked items
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');

    for (const checkbox of checkboxes) {
        const actionId = checkbox.name.replace('action_status_', '');
        const newStatus = checkbox.checked ? 'done' : 'pending';

        // Only update if marked as done
        if (checkbox.checked && typeof updateActionItemStatus === 'function') {
            try {
                await updateActionItemStatus(actionId, newStatus);
            } catch (e) {
                console.log('Could not update action status:', e);
            }
        }
    }

    // Hide the previous actions and show the form
    container.style.display = 'none';
}

function skipActionsReview() {
    const container = document.getElementById('previousActionsContainer');
    if (container) {
        container.style.display = 'none';
    }
}

// ===== Initialize =====

// COGS label mapping for industry-specific form labels
const COGS_FORM_LABELS = {
    'food': 'Food & Beverage Cost', 'product': 'Cost of Goods',
    'online': 'Cost of Service', 'services': 'Direct Delivery Cost',
    'construction': 'Project Costs', 'manufacturing': 'Material & Production Cost',
    'healthcare': 'Clinical / Treatment Cost', 'other': 'Cost of Goods Sold'
};

document.addEventListener('DOMContentLoaded', async () => {
    // Dynamic COGS label based on industry
    const industrySelect = document.getElementById('industry');
    const cogsLabel = document.getElementById('cogsLabel');
    if (industrySelect && cogsLabel) {
        industrySelect.addEventListener('change', () => {
            cogsLabel.textContent = COGS_FORM_LABELS[industrySelect.value] || 'Cost of Goods Sold';
        });
    }

    // Check if user is logged in - signup required to analyze
    const isLoggedIn = await checkUserLoggedIn();

    if (!isLoggedIn) {
        // Show signup prompt instead of form
        showLoginRequired();
        return;
    }

    // User is logged in - initialize the form
    initFileUpload();

    // Load previous action items (if any)
    await loadPreviousActions();

    // Set current month/year as default
    const now = new Date();
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');

    if (monthSelect) monthSelect.value = now.getMonth() + 1;
    if (yearSelect) yearSelect.value = now.getFullYear();

    // Sync currency prefix spans with the selected currency
    const initCurrency = document.getElementById('currency');
    if (initCurrency) {
        document.querySelectorAll('.currency-prefix').forEach(prefix => {
            prefix.textContent = initCurrency.value;
        });
    }

    updateProgress(1);
});

// Check if user is logged in
async function checkUserLoggedIn() {
    // Check if Supabase is available
    if (typeof getUser !== 'function') {
        return false;
    }

    try {
        const user = await getUser();
        return !!user;
    } catch (e) {
        console.error('Error checking auth:', e);
        return false;
    }
}

function showLoginRequired() {
    const container = document.querySelector('.analyze-container');
    if (!container) return;

    container.innerHTML = `
        <div class="login-required">
            <div class="login-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
            <h1>Sign up to analyze your numbers</h1>
            <p>Create a free account to generate your personalized financial report. See exactly where your cash is going and what to do about it.</p>
            <div class="login-actions">
                <a href="signup.html" class="btn btn-primary btn-lg">Create Free Account</a>
                <a href="login.html" class="btn btn-secondary btn-lg">Log In</a>
            </div>
            <p class="login-note">Free accounts get 1 full report. No credit card required.</p>
            <div class="login-sample">
                <p>Want to see what you will get first?</p>
                <a href="report-sky.html?sample=true" class="sample-link">View Sample Report</a>
            </div>
        </div>
    `;
}
