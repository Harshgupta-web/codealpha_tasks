document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:5000/api';
    let currentEventId = null;
    
    // DOM Elements
    const eventsContainer = document.getElementById('eventsContainer');
    const registrationsContainer = document.getElementById('registrationsContainer');
    const registrationsList = document.getElementById('registrationsList');
    const registrationModal = document.getElementById('registrationModal');
    
    // Buttons
    document.getElementById('showEventsBtn').addEventListener('click', () => {
        registrationsContainer.classList.add('hidden');
        loadEvents();
    });
    
    document.getElementById('showRegistrationsBtn').addEventListener('click', () => {
        registrationsContainer.classList.remove('hidden');
        loadRegistrations();
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        registrationModal.classList.add('hidden');
    });
    
    // Load all events
    async function loadEvents() {
        try {
            const response = await fetch(`${API_BASE}/events`);
            const events = await response.json();
            
            eventsContainer.innerHTML = events.map(event => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="p-4">
                        <h3 class="text-xl font-bold mb-2">${event.title}</h3>
                        <p class="text-gray-600 mb-3">${event.description}</p>
                        <p class="text-sm"><i class="fas fa-calendar-alt mr-2"></i>${new Date(event.date).toLocaleDateString()}</p>
                        <p class="text-sm"><i class="fas fa-map-marker-alt mr-2"></i>${event.location}</p>
                        <p class="text-sm"><i class="fas fa-users mr-2"></i>${event.availableSeats} seats available</p>
                        <button onclick="showRegistrationModal('${event._id}', '${event.title}')"
                            class="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                            ${event.availableSeats <= 0 ? 'disabled' : ''}>
                            ${event.availableSeats <= 0 ? 'Sold Out' : 'Register Now'}
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error("Failed to load events:", error);
        }
    }
    
    // Show registration modal
    window.showRegistrationModal = (eventId, eventTitle) => {
        currentEventId = eventId;
        document.getElementById('eventTitle').textContent = eventTitle;
        document.getElementById('eventId').value = eventId;
        registrationModal.classList.remove('hidden');
    };
    
    // Handle registration form submission
    document.getElementById('registrationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const registration = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };
        
        try {
            const response = await fetch(`${API_BASE}/events/${currentEventId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registration)
            });
            
            if (response.ok) {
                alert('Registration successful!');
                registrationModal.classList.add('hidden');
                loadEvents();
            } else {
                const error = await response.json();
                alert(`Registration failed: ${error.error}`);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("Failed to register. Please try again.");
        }
    });
    
    // Load user registrations
    async function loadRegistrations() {
        const email = prompt("Enter your email to view registrations:");
        if (!email) return;
        
        try {
            const response = await fetch(`${API_BASE}/users/${email}/registrations`);
            const registrations = await response.json();
            
            if (registrations.length === 0) {
                registrationsList.innerHTML = '<p class="text-gray-500">No registrations found</p>';
                return;
            }
            
            registrationsList.innerHTML = registrations.map(reg => `
                <div class="bg-white p-4 rounded-lg shadow">
                    <h3 class="font-bold text-lg">${reg.eventId.title}</h3>
                    <p class="text-gray-600">${new Date(reg.eventId.date).toLocaleDateString()}</p>
                    <p class="text-gray-600">${reg.eventId.location}</p>
                    <button onclick="cancelRegistration('${reg._id}')" 
                            class="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm">
                        Cancel Registration
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error("Failed to load registrations:", error);
        }
    }
    
    // Cancel registration
    window.cancelRegistration = async (registrationId) => {
        if (!confirm("Are you sure you want to cancel this registration?")) return;
        
        try {
            const response = await fetch(`${API_BASE}/registrations/${registrationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Registration cancelled successfully!');
                loadRegistrations();
                loadEvents(); // Refresh events to update seat count
            }
        } catch (error) {
            console.error("Failed to cancel registration:", error);
        }
    };
    
    // Initial load
    loadEvents();
});
