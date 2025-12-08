// ===== PlainFinance - Analyze Form Logic =====

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
        // Skip steps 3-5 for upload method, go straight to submit
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
    const totalSteps = 5;
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
}

// Add listeners to all number inputs
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', updateCalculations);
});

function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ===== File Upload Handling =====

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileUpload');
const uploadedFilesContainer = document.getElementById('uploadedFiles');
const uploadContinueBtn = document.getElementById('uploadContinue');

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

    // File input change
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        // Check file type
        const validTypes = ['.xlsx', '.xls', '.csv', '.pdf'];
        const extension = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(extension)) {
            alert(`Invalid file type: ${file.name}. Please upload Excel, CSV, or PDF files.`);
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
            vatPaid: parseFloat(document.getElementById('vatPaid')?.value) || 0
        };

        // YTD data (Year to Date)
        const ytdRevenue = parseFloat(document.getElementById('ytdRevenue')?.value) || 0;
        if (ytdRevenue > 0) {
            data.ytd = {
                revenue: ytdRevenue,
                cogs: parseFloat(document.getElementById('ytdCogs')?.value) || 0,
                opex: parseFloat(document.getElementById('ytdOpex')?.value) || 0,
                netProfit: parseFloat(document.getElementById('ytdNetProfit')?.value) || 0
            };
            // Calculate months elapsed (current month number)
            const currentMonth = parseInt(document.getElementById('reportMonth')?.value) || 1;
            data.ytd.monthsElapsed = currentMonth;
        }

        if (includeComparison) {
            data.previous = {
                revenue: parseFloat(document.getElementById('prevRevenue')?.value) || 0,
                netProfit: parseFloat(document.getElementById('prevNetProfit')?.value) || 0,
                cash: parseFloat(document.getElementById('prevCash')?.value) || 0,
                receivables: parseFloat(document.getElementById('prevReceivables')?.value) || 0,
                inventory: parseFloat(document.getElementById('prevInventory')?.value) || 0,
                payables: parseFloat(document.getElementById('prevPayables')?.value) || 0
            };
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

        // For file uploads, we would need a different approach
        // For now, only form data is fully supported
        if (inputMethod === 'upload' && uploadedFiles.length > 0) {
            // File upload processing would require additional setup
            // For MVP, redirect to form entry with a message
            alert('File upload processing is coming soon. Please use Quick Entry for now.');
            loadingState.style.display = 'none';
            form.style.display = 'block';
            showStep(1);
            return;
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
            if (typeof saveReport === 'function') {
                try {
                    await saveReport(result);
                } catch (e) {
                    console.log('Not logged in or save failed, continuing...');
                }
            }

            // Redirect to report page
            window.location.href = 'report.html';
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

// ===== Initialize =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (typeof getUser === 'function') {
        const user = await getUser();
        if (!user) {
            // Show login prompt
            showLoginRequired();
            return;
        }
    }

    // Set current month/year as default
    const now = new Date();
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');

    if (monthSelect) monthSelect.value = now.getMonth() + 1;
    if (yearSelect) yearSelect.value = now.getFullYear();

    updateProgress(1);
});

function showLoginRequired() {
    const container = document.querySelector('.analyze-container');
    if (!container) return;

    container.innerHTML = `
        <div class="login-required">
            <div class="login-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <h1>Sign in to continue</h1>
            <p>Create a free account to generate your financial report. It only takes a minute.</p>
            <div class="login-actions">
                <a href="signup.html" class="btn btn-primary btn-lg">Create Free Account</a>
                <a href="login.html" class="btn btn-secondary btn-lg">Log In</a>
            </div>
            <p class="login-note">Free accounts get 2 reports. No credit card required.</p>
        </div>
    `;
}
