// js/main.js

/**
 * Handle practice section quiz responses
 */
window.checkAnswer = function(btnElement, isCorrect) {
    const parent = btnElement.parentElement;
    const feedback = parent.nextElementSibling;
    
    // Reset all buttons in this group
    const buttons = parent.querySelectorAll('button');
    buttons.forEach(b => {
        b.classList.remove('correct', 'wrong');
        b.disabled = true; // disable after selection
    });
    
    if (isCorrect) {
        btnElement.classList.add('correct');
        feedback.innerHTML = '<span style="color: var(--success)">✅ Correct!</span>';
    } else {
        btnElement.classList.add('wrong');
        feedback.innerHTML = '<span style="color: var(--error)">❌ Incorrect.</span> Try refreshing to give it another go!';
        // highlight the correct one implicitly? Or let them learn from failure
    }
}

// Simple smooth scroll for nav links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
