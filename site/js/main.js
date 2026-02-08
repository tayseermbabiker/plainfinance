// ===== Mobile Menu Toggle =====
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
}

// Close mobile menu when clicking a link
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ===== FAQ Accordion =====
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        // Close other items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });

        // Toggle current item
        item.classList.toggle('active');
    });
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.nav').offsetHeight;
            const targetPosition = target.offsetTop - navHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Navbar Background on Scroll =====
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.boxShadow = 'none';
    }
});

// ===== Form Submission (Netlify Forms) =====
const waitlistForm = document.querySelector('.waitlist-form');

if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = waitlistForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(waitlistForm);

            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                // Success
                waitlistForm.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                        <h3 style="color: white; margin-bottom: 8px;">You're on the list!</h3>
                        <p style="color: #94a3b8;">We'll email you when PlainFinancials launches. Early members get 50% off for life.</p>
                    </div>
                `;
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            // Error
            submitBtn.textContent = 'Try Again';
            submitBtn.disabled = false;
            alert('Something went wrong. Please try again or email us directly at tayseer.babiker@hotmail.com');
        }
    });
}

// ===== Animate Elements on Scroll =====
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.problem-card, .feature-card, .pricing-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});

// Add animation class styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// ===== Pricing Card Hover Effect =====
document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        if (!card.classList.contains('featured')) {
            card.style.transform = 'translateY(-8px)';
            card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
        }
    });

    card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('featured')) {
            card.style.transform = '';
            card.style.boxShadow = '';
        }
    });
});

// ===== Console Easter Egg =====
console.log('%c PlainFinancials ', 'background: #2563eb; color: white; font-size: 24px; font-weight: bold; padding: 10px;');
console.log('%c Your numbers, finally explained. ', 'color: #64748b; font-size: 14px;');
console.log('%c Built by Tayseer Mohammed, FCCA ', 'color: #64748b; font-size: 12px;');

// ===== Exit Intent Popup =====
(function() {
    const exitPopup = document.getElementById('exitPopup');
    const exitPopupClose = document.getElementById('exitPopupClose');
    const exitPopupDismiss = document.getElementById('exitPopupDismiss');

    if (!exitPopup) return;

    let exitIntentShown = false;
    const STORAGE_KEY = 'exitPopupDismissed';
    const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Check if popup was recently dismissed
    function wasRecentlyDismissed() {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) return false;
        const dismissedTime = parseInt(dismissed, 10);
        return (Date.now() - dismissedTime) < DISMISS_DURATION;
    }

    // Show popup
    function showExitPopup() {
        if (exitIntentShown || wasRecentlyDismissed()) return;
        exitIntentShown = true;
        exitPopup.classList.add('active');
    }

    // Hide popup
    function hideExitPopup(saveDismissal) {
        exitPopup.classList.remove('active');
        if (saveDismissal) {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }
    }

    // Exit intent detection (desktop - cursor leaves viewport at top)
    document.addEventListener('mouseleave', function(e) {
        if (e.clientY <= 0) {
            showExitPopup();
        }
    });

    // Fallback: show after 45 seconds if user hasn't engaged
    setTimeout(function() {
        const hasScrolled = window.scrollY > 300;
        if (!hasScrolled && !exitIntentShown) {
            showExitPopup();
        }
    }, 45000);

    // Close button
    if (exitPopupClose) {
        exitPopupClose.addEventListener('click', function() {
            hideExitPopup(true);
        });
    }

    // Dismiss button
    if (exitPopupDismiss) {
        exitPopupDismiss.addEventListener('click', function() {
            hideExitPopup(true);
        });
    }

    // Click outside to close
    exitPopup.addEventListener('click', function(e) {
        if (e.target === exitPopup) {
            hideExitPopup(true);
        }
    });

    // Escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && exitPopup.classList.contains('active')) {
            hideExitPopup(true);
        }
    });
})();

// ===== Runway Calculator Widget =====
(function() {
    const cashInput = document.getElementById('calcCash');
    const expensesInput = document.getElementById('calcExpenses');
    const revenueInput = document.getElementById('calcRevenue');
    const resultDiv = document.getElementById('calculatorResult');
    const ctaDiv = document.getElementById('calculatorCta');

    if (!cashInput || !expensesInput || !revenueInput) return;

    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Parse number from formatted string
    function parseNumber(str) {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
    }

    // Format input as user types
    function formatInput(input) {
        const value = parseNumber(input.value);
        if (value > 0) {
            input.value = formatNumber(value);
        }
    }

    // Calculate and display runway
    function calculateRunway() {
        const cash = parseNumber(cashInput.value);
        const expenses = parseNumber(expensesInput.value);
        const revenue = parseNumber(revenueInput.value);

        // Need at least cash and expenses to calculate
        if (cash <= 0 || expenses <= 0) {
            resultDiv.innerHTML = `
                <div class="result-placeholder">
                    <span class="placeholder-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </span>
                    <span>Enter your numbers above</span>
                </div>
            `;
            resultDiv.className = 'calculator-result';
            ctaDiv.style.display = 'none';
            return;
        }

        const burnRate = expenses - revenue;
        let months, status, message, statusClass;

        if (burnRate <= 0) {
            // Business is cash-flow positive or breakeven
            status = 'growing';
            statusClass = 'runway-status-growing';
            if (burnRate < 0) {
                const monthlyProfit = Math.abs(burnRate);
                months = '∞';
                message = `You're growing! Adding $${formatNumber(monthlyProfit.toFixed(0))}/month to your cash.`;
            } else {
                months = '∞';
                message = "You're at breakeven. Revenue covers expenses exactly.";
            }
        } else {
            // Calculate months of runway
            months = cash / burnRate;

            if (months < 3) {
                status = 'danger';
                statusClass = 'runway-status-danger';
                message = "Critical: You need to act now. Cut costs or boost revenue immediately.";
            } else if (months < 6) {
                status = 'warning';
                statusClass = 'runway-status-warning';
                message = "Caution: Start planning now. You have time, but don't wait.";
            } else if (months < 12) {
                status = 'safe';
                statusClass = 'runway-status-safe';
                message = "Healthy runway. Keep monitoring monthly.";
            } else {
                status = 'safe';
                statusClass = 'runway-status-safe';
                message = "Strong position! You have over a year of runway.";
            }

            months = months.toFixed(1);
        }

        const warning = months === '∞'
            ? ''
            : `<div class="runway-warning">This is your <strong>Surface Runway</strong>. It ignores unpaid bills, loans, and slow-paying customers that could cut this number in half.</div>`;

        resultDiv.innerHTML = `
            <div class="runway-display">
                <div class="runway-estimate">Quick Estimate</div>
                <div class="runway-months">
                    <span class="runway-number">${months}</span>
                    <span class="runway-label">${months === '∞' ? '' : 'months'}</span>
                </div>
                <div class="runway-message">${message}</div>
                ${warning}
            </div>
        `;
        resultDiv.className = 'calculator-result ' + statusClass;

        // Show CTA
        ctaDiv.style.display = 'block';

        // Track calculator usage (if GA is available)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculator_used', {
                'event_category': 'engagement',
                'event_label': status,
                'value': months === '∞' ? 999 : parseFloat(months)
            });
        }
    }

    // Add event listeners for real-time calculation
    [cashInput, expensesInput, revenueInput].forEach(input => {
        input.addEventListener('input', function() {
            calculateRunway();
        });

        input.addEventListener('blur', function() {
            formatInput(this);
            calculateRunway();
        });

        // Format on paste
        input.addEventListener('paste', function() {
            setTimeout(() => {
                formatInput(this);
                calculateRunway();
            }, 0);
        });
    });

})();
