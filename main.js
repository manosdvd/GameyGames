// Main JS for Game Hub

document.addEventListener('DOMContentLoaded', () => {
    console.log('Game Hub Loaded');

    // FAB interaction
    const fab = document.querySelector('.fab');
    if (fab) {
        fab.addEventListener('click', () => {
            alert('Add Game feature coming soon!');
        });
    }

    // Ripple effect for buttons (Simple generic ripple)
    const buttons = document.querySelectorAll('button, .card');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function(e) {
            // Optional: Implement complex ripple here if needed
            // For now, CSS active state and transition is used
        });
    });
});
